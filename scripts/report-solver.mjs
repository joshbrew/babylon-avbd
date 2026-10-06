import { solverReportView } from "./solver-report-view.mjs";
import { readFile, writeFile } from "node:fs/promises";
const read = (path) =>
  readFile(`test-results/${path}`, "utf8").then(JSON.parse);
const catalog = await read("solver-scenes.json");
const hardware = await read("hardware.json");
const matches = hardware.filter((h) =>
  h.Name.toLowerCase().includes(catalog.adapter.vendor),
);
const verified = matches.length === 1 ? matches[0] : null;
const valid = (r) =>
  r.passed && r.finite && !r.counters.overflow && !r.counters.clashes;
const names = {
  "showcase-box-columns-100k": "100K columns",
  "showcase-brick-ring-110k": "110K brick ring",
  "showcase-brick-ring-28k": "28K brick ring",
  "showcase-ragdolls-on-cloth-24k": "Ragdolls on a rigid net",
};
const rows = Object.entries(names).map(([scene, name]) => {
  const run = catalog.results.find((r) => r.scene === scene);
  if (!run || !valid(run))
    throw Error(`Missing or invalid production measurements for ${scene}`);
  return {
    scene,
    name,
    bodies: run.bodyCount,
    joints: run.jointCount,
    iterations: run.params.iterations,
    params: run.params,
    timing: run.summary,
  };
});
const report = {
  completed: new Date().toISOString(),
  measured: catalog.completed,
  powerContext: catalog.powerContext,
  adapter: {
    ...catalog.adapter,
    model: verified?.Name ?? "Unidentified GPU",
    driver: verified?.DriverVersion ?? "Unknown",
    identification:
      "Windows Win32_VideoController matched to Chrome adapter vendor",
  },
  summary: rows,
  checkedScenes: catalog.results.filter(valid).length,
  errors: [],
};
report.packageBenchmarks = await read("package-performance.json").catch(
  () => null,
);
report.capsuleBenchmark = await read("capsule-performance.json").catch(
  () => null,
);
const ragdollPhases = [
  ["solver-ragdoll-collision.json", "Ragdolls landing on the net"],
  ["solver-ragdoll-settled.json", "Later in the simulation"],
];
report.ragdollCollision = { phases: [] };
for (const [file, label] of ragdollPhases) {
  const data = await read(file).catch(() => null);
  if (!data) continue;
  if (data.errors?.length || data.comparisons.length !== 2)
    throw Error(`Invalid ragdoll collision measurements: ${file}`);
  for (const comparison of data.comparisons) {
    const [grid, tree] = comparison.results;
    if (
      comparison.scene !== "showcase-ragdolls-on-cloth-24k" ||
      grid.broadphase !== "grid" ||
      tree.broadphase !== "hploc" ||
      [grid, tree].some(
        (r) =>
          !r.finite ||
          r.params.dt !== 1 / 240 ||
          r.params.iterations !== 5 ||
          r.counters.overflow ||
          r.counters.clashes,
      ) ||
      ["pairs", "contacts", "manifolds"].some(
        (k) => grid.counters[k] !== tree.counters[k],
      )
    )
      throw Error(
        `Ragdoll methods must preserve workload and contacts: ${file}`,
      );
  }
  const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
  const timing = (index) =>
    Object.fromEntries(
      ["total", "collision", "solve"].map((key) => [
        key,
        mean(data.comparisons.map((c) => c.results[index].summary[key].mean)),
      ]),
    );
  const grid = timing(0),
    tree = timing(1),
    first = data.comparisons[0];
  report.ragdollCollision.phases.push({
    label,
    grid,
    tree,
    saving: 100 * (1 - tree.total / grid.total),
    collisionSaving: 100 * (1 - tree.collision / grid.collision),
    from: first.warmup / 240,
    to: (first.warmup + first.count) / 240,
  });
}
const summary = (values) => {
  const a = values.toSorted((x, y) => x - y);
  return {
    n: a.length,
    mean: a.reduce((s, v) => s + v, 0) / a.length,
    median: a[Math.floor(a.length / 2)],
    p95: a[Math.floor(a.length * 0.95)],
  };
};
const scheduling = await read("solver-sleep-batching.json").catch(() => null);
report.paper = {
  source:
    "https://graphics.cs.utah.edu/research/projects/avbd/Augmented_VBD-SIGGRAPH25.pdf",
  gpu: "NVIDIA RTX 4090",
  api: "DirectX 11 compute shaders",
  broadphase: "LBVH",
  dt: 1 / 60,
  alpha: 0.95,
  beta: 10,
  gamma: 0.99,
  ring: {
    figure: 1,
    bodies: 110000,
    iterations: 4,
    solverMs: 3.5,
    collisionMs: 6.3,
    totalMs: 9.8,
  },
  walls: {
    figure: 3,
    bodies: 510000,
    tableIterations: 3,
    captionIterations: 4,
    solverMs: 10.3,
    totalMs: 17.6,
  },
  cloth: { figure: 14, iterations: 10, totalMs: 16, matched: false },
};
const hploc = await read("solver-hploc.json").catch(() => null);
if (hploc) {
  if (
    hploc.errors?.length ||
    hploc.comparisons.length !== 18 ||
    hploc.comparisons.some((c) =>
      c.results.some(
        (r) =>
          !r.finite ||
          r.counters.overflow ||
          r.counters.clashes ||
          r.samples.length !== 60,
      ),
    )
  )
    throw Error("Incomplete grid/tree comparison");
  const ids = [...new Set(hploc.comparisons.map((c) => c.scene))];
  report.hploc = {
    ...hploc,
    summary: ids.map((scene) => {
      const repeats = hploc.comparisons.filter((c) => c.scene === scene);
      if (repeats.length !== 3) throw Error("Missing grid/tree repeat");
      const method = (variant) => {
        const samples = repeats.flatMap(
          (c) => c.results.find((r) => r.variant === variant).samples,
        );
        return Object.fromEntries(
          ["total", "collision", "solve"].map((key) => [
            key,
            summary(samples.map((p) => p[key])).mean,
          ]),
        );
      };
      const grid = method("grid"),
        tree = method("hploc");
      const treeSamples = repeats.flatMap(
        (c) => c.results.find((r) => r.variant === "hploc").samples,
      );
      const rebuildSamples = treeSamples.filter((p) => p.bvhRebuilt);
      return {
        scene,
        iterations: repeats[0].results[0].params.iterations,
        timeStep: repeats[0].results[0].params.dt,
        grid,
        hploc: tree,
        saving: 100 * (1 - tree.total / grid.total),
        repeats: repeats.map((c) => c.saving),
        noisyRuns: repeats.filter((c) => !c.stableControlTiming).length,
        extraBytes: repeats[0].results[1].bvh.extraBytes,
        firstTreeStep: repeats[0].results[1].startup.total,
        maxTreeStep: Math.max(...treeSamples.map((p) => p.total)),
        rebuildSteps: rebuildSamples.length,
        meanRebuildStep: rebuildSamples.length
          ? summary(rebuildSamples.map((p) => p.total)).mean
          : null,
      };
    }),
  };
}
report.hplocMotion = await read("hploc-motion-hploc.json").catch(() => null);
if (
  report.hplocMotion &&
  (!report.hplocMotion.passed ||
    report.hplocMotion.results.length !== 5 ||
    report.hplocMotion.results.some(
      (r) =>
        !r.passed ||
        r.checkpoints.length !== 3 ||
        r.checkpoints.some(
          (s) =>
            !s.finite ||
            s.broadphase !== "hploc" ||
            s.stats.overflow ||
            s.stats.clashes,
        ),
    ))
)
  throw Error("Incomplete GPU tree motion check");
const paperRuns = catalog.results.filter((r) => r.scene.startsWith("paper-"));
if (paperRuns.length !== 3 || !paperRuns.every(valid))
  throw Error("Incomplete production paper-scene measurements");
report.paperMeasurements = {
  date: catalog.refreshed ?? catalog.completed,
  adapter: report.adapter,
  method: catalog.method,
  runs: paperRuns,
  errors: [],
};
await writeFile(
  "test-results/solver-paper.json",
  JSON.stringify(report.paperMeasurements, null, 2),
);
await writeFile(
  "test-results/solver-performance.json",
  JSON.stringify(report, null, 2),
);
await writeFile(
  "test-results/solver-performance.html",
  solverReportView(report, rows, catalog, scheduling),
);
console.log(
  `PASS production solver report: ${report.checkedScenes} checked scenes, ${rows.length} stage charts, GPU ${report.adapter.model}`,
);
