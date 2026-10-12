import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";
// Keep per-step evidence without whitespace inflating the checked-in report.
const writeReport = (path, report) =>
  writeAtomicFile(path, JSON.stringify(report));
const filter = process.argv.find((a) => a.startsWith("--scene="))?.slice(8);
const repeats = Number(process.env.AVBD_SLEEP_REPEATS ?? 2);
const seconds = Number(process.env.AVBD_SLEEP_SECONDS ?? 8);
const resume = process.argv.includes("--resume");
assert(
  Number.isInteger(repeats) &&
    repeats > 0 &&
    Number.isFinite(seconds) &&
    seconds >= 4,
);
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/scene-sleep-performance.js"],
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outdir: ".temp/sleep-benchmark",
  splitting: true,
});
const b = await browserCheck();
const report = {
  date: new Date().toISOString(),
  seconds,
  repeats,
  measurementVersion: 4,
  method:
    "Fresh WebGPU demo sessions share one device and alternate sleeping on/off at each fixed step, with alternating creation order on repeats. Steps stay queued between samples. GPU timestamps surround the complete physics step, including sleeping, water/force hooks and queue gaps. Drawing is excluded. Samples every ten steps; first 0.2 seconds excluded. Active = 0.2–2 seconds; later = last two seconds. Identical object counts, timesteps, iterations and actions; playgrounds start and the slingshot fires. Overflow, coloring conflicts and finite poses checked. Defaults require at least 10% mean time saved in every repeat, without more than 15% active-time regression. Measurements depend on hardware and scene motion.",
  results: [],
  summary: [],
};
if (resume) {
  const previous = JSON.parse(
    await readFile("test-results/scene-sleep-performance.json", "utf8"),
  );
  assert(
    previous.seconds === seconds &&
      previous.repeats === repeats &&
      previous.measurementVersion === report.measurementVersion,
    "Resume requires matching measurement settings",
  );
  report.results = previous.results.filter((r) => r.passed);
}
try {
  await b.navigate("test-results/solver-performance.html");
  const scenes = await b.evaluate(
    `import('/.temp/sleep-benchmark/scene-sleep-performance.js').then(m=>m.sleepBenchmarkScenes)`,
  );
  const ordered = scenes.toSorted(
    (a, b) =>
      ["showcase-brick-ring-110k", "3d-voronoi-demolition"].indexOf(b.id) -
      ["showcase-brick-ring-110k", "3d-voronoi-demolition"].indexOf(a.id),
  );
  for (const scene of ordered.filter((s) => !filter || s.id.includes(filter))) {
    for (let repeat = 0; repeat < repeats; repeat++) {
      if (
        report.results.some(
          (r) => r.scene === scene.id && r.repeat === repeat && r.passed,
        )
      )
        continue;
      console.log(
        `Measuring ${scene.id}, paired run ${repeat + 1}/${repeats}...`,
      );
      try {
        const r = await b.evaluate(
          `import('/.temp/sleep-benchmark/scene-sleep-performance.js').then(m=>m.benchmarkSceneSleeping(${JSON.stringify(scene.id)},{seconds:${seconds},repeat:${repeat}}))`,
        );
        report.results.push(r);
        console.log(
          JSON.stringify({
            scene: scene.id,
            repeat,
            passed: r.passed,
            runs: r.runs.map((r) => ({
              sleeping: r.sleeping,
              total: r.total.mean,
              active: r.active.mean,
              settled: r.settled.mean,
              sleepingBodies: r.sleepingBodies,
              errors: r.errors.slice(0, 1),
            })),
          }),
        );
      } catch (error) {
        report.results.push({
          scene: scene.id,
          repeat,
          passed: false,
          error: String(error),
        });
        console.log(`FAIL ${scene.id}: ${error.message}`);
      }
      await writeReport(
        filter
          ? ".temp/scene-sleep-performance.json"
          : "test-results/scene-sleep-performance.json",
        report,
      );
    }
    const paired = report.results.filter((r) => r.scene === scene.id);
    const valid = paired.length === repeats && paired.every((r) => r.passed);
    const mean = (enabled, window) =>
      paired.reduce(
        (sum, r) =>
          sum +
          (r.runs?.find((x) => x.sleeping === enabled)?.[window]?.mean ?? NaN),
        0,
      ) / paired.length;
    const enabled =
      valid &&
      paired.every((r) => {
        const off = r.runs.find((r) => !r.sleeping),
          on = r.runs.find((r) => r.sleeping);
        return (
          on.sleepingBodies > 0 &&
          on.total.mean < off.total.mean * 0.9 &&
          on.active.mean <= off.active.mean * 1.15
        );
      });
    report.summary.push({
      ...scene,
      passed: valid,
      defaultSleeping: enabled,
      offMs: mean(false, "total"),
      onMs: mean(true, "total"),
      activeOffMs: mean(false, "active"),
      activeOnMs: mean(true, "active"),
      laterOffMs: mean(false, "settled"),
      laterOnMs: mean(true, "settled"),
    });
  }
  report.errors = b.errors;
  Object.assign(
    report,
    await gpuBenchmarkHardware(report.results.find((r) => r.adapter)?.adapter),
  );
  report.passed =
    report.results.every((r) => r.passed) && !report.errors.length;
  await writeReport(
    filter
      ? ".temp/scene-sleep-performance.json"
      : "test-results/scene-sleep-performance.json",
    report,
  );
  if (!filter) {
    // Only a complete, successful run can replace the shipped presets.
    assert(
      report.passed &&
        report.summary.length === scenes.length &&
        report.results.length === scenes.length * repeats,
      "Resolve failed scenes before updating sleeping presets",
    );
    const presets = Object.fromEntries(
      report.summary.map((r) => [r.id, r.defaultSleeping]),
    );
    await writeAtomicFile(
      "demo/shared/runtime/sleepPresets.js",
      `// Generated by npm run benchmark:scene-sleep. ${report.hardware ?? "Measured GPU"}; see test-results/scene-sleep-performance.json.\nexport const sceneSleepPresets = ${JSON.stringify(presets, null, 2)};\n`,
    );
  }
} finally {
  await b.close();
}
