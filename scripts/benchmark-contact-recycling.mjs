import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";
const filter = process.argv.find((a) => a.startsWith("--scene="))?.slice(8);
// Subset checks should not replace the complete published scene comparison.
const reportPath = filter
  ? ".temp/contact-recycling-subset.json"
  : "test-results/contact-recycling-performance.json";
const repeats = Number(process.env.AVBD_RECYCLE_REPEATS ?? 2),
  seconds = Number(process.env.AVBD_RECYCLE_SECONDS ?? 8);
assert(
  Number.isInteger(repeats) &&
    repeats >= 2 &&
    Number.isFinite(seconds) &&
    seconds >= 4,
);
await mkdir(".temp/recycling-benchmark", { recursive: true });
await build({
  entryPoints: ["tests/scene-sleep-performance.js"],
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outdir: ".temp/recycling-benchmark",
  splitting: true,
});
const b = await browserCheck();
const microOnly = process.argv.includes("--micro-only");
let report = {
  date: new Date().toISOString(),
  seconds,
  repeats,
  method:
    "Paired WebGPU worlds at matching simulation ages, alternating step order and creation order. Same scene, timestep, iterations, actions and sleeping preset. GPU timestamps surround the complete physics step; drawing is excluded. First 0.2 seconds omitted. Active window: 0.2–2 seconds; later window: final two seconds. Presets require at least 10% total time saved in both repeats and no more than 15% active-time regression. Invalid poses, dropped contacts or solve-group conflicts disqualify a preset.",
  results: [],
  summary: [],
  errors: [],
};
if (microOnly)
  report = JSON.parse(
    await readFile("test-results/contact-recycling-performance.json", "utf8"),
  );
try {
  await b.navigate("test-results/solver-performance.html");
  const scenes = await b.evaluate(
    "import('/.temp/recycling-benchmark/scene-sleep-performance.js').then(m=>m.sleepBenchmarkScenes.filter(s=>s.id!=='mixed-collider-gallery'))",
  );
  for (const scene of scenes.filter(
    (s) => !microOnly && (!filter || new RegExp(filter).test(s.id)),
  )) {
    for (let repeat = 0; repeat < repeats; repeat++) {
      console.log(
        `Measuring ${scene.id}, paired run ${repeat + 1}/${repeats}...`,
      );
      try {
        const r = await b.evaluate(
          `import('/.temp/recycling-benchmark/scene-sleep-performance.js').then(m=>m.benchmarkSceneSleeping(${JSON.stringify(scene.id)},{seconds:${seconds},repeat:${repeat},policy:'contactRecycling'}))`,
        );
        r.runs = r.runs.map(({ sleeping, ...run }) => ({
          contactRecycling: sleeping,
          ...run,
        }));
        report.results.push(r);
        console.log(
          JSON.stringify({
            scene: scene.id,
            repeat,
            passed: r.passed,
            runs: r.runs.map((r) => ({
              enabled: r.contactRecycling,
              ms: r.total.mean,
              active: r.active.mean,
              later: r.settled.mean,
              errors: r.errors.length,
            })),
          }),
        );
      } catch (e) {
        report.results.push({
          scene: scene.id,
          repeat,
          passed: false,
          error: e.message,
        });
        console.log(e.message);
      }
      await writeAtomicFile(reportPath, JSON.stringify(report));
    }
    const paired = report.results.filter((r) => r.scene === scene.id),
      valid = paired.length === repeats && paired.every((r) => r.passed);
    const mean = (enabled, window) =>
      paired.reduce(
        (sum, r) =>
          sum +
          (r.runs?.find((r) => r.contactRecycling === enabled)?.[window]
            ?.mean ?? NaN),
        0,
      ) / paired.length;
    const enabled =
      valid &&
      paired.every((r) => {
        const off = r.runs.find((r) => !r.contactRecycling),
          on = r.runs.find((r) => r.contactRecycling);
        return (
          on.total.mean < off.total.mean * 0.9 &&
          on.active.mean <= off.active.mean * 1.15
        );
      });
    report.summary.push({
      ...scene,
      passed: valid,
      defaultContactRecycling: enabled,
      offMs: mean(false, "total"),
      onMs: mean(true, "total"),
      activeOffMs: mean(false, "active"),
      activeOnMs: mean(true, "active"),
      laterOffMs: mean(false, "settled"),
      laterOnMs: mean(true, "settled"),
    });
  }
  if (!filter) {
    await build({
      entryPoints: ["tests/contact-recycling.js"],
      bundle: true,
      format: "esm",
      loader: { ".wgsl": "text" },
      outfile: ".temp/contact-recycling-workloads.js",
    });
    report.workloads = await b.evaluate(
      "import('/.temp/contact-recycling-workloads.js').then(m=>m.benchmarkRecyclingWorkloads())",
    );
  }
  report.errors = b.errors;
  report.passed = report.results.every((r) => r.passed) && !b.errors.length;
  Object.assign(
    report,
    await gpuBenchmarkHardware(report.results.find((r) => r.adapter)?.adapter),
  );
  await writeAtomicFile(reportPath, JSON.stringify(report));
  if (process.argv.includes("--update-presets")) {
    assert(report.passed, "Resolve benchmark failures before updating presets");
    const { contactRecyclingPresets: previous } =
      await import("../demo/shared/runtime/contactRecyclingPresets.js");
    const presets = {
      ...previous,
      ...Object.fromEntries(
        report.summary.map((r) => [r.id, r.defaultContactRecycling]),
      ),
    };
    await writeAtomicFile(
      "demo/shared/runtime/contactRecyclingPresets.js",
      `// Measured on ${report.hardware ?? "WebGPU"}; see test-results/contact-recycling-performance.json.\nexport const contactRecyclingPresets = ${JSON.stringify(presets, null, 2)};\n`,
    );
  }
  console.log(`Saved contact recycling measurements to ${reportPath}`);
  if (!report.passed) process.exitCode = 1;
} finally {
  await b.close();
}
