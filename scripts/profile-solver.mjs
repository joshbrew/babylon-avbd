import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
await mkdir("test-results", { recursive: true });
await build({
  entryPoints: ["tests/performance-entry.js"],
  bundle: true,
  format: "esm",
  outfile: "dist/performance.js",
  loader: { ".wgsl": "text" },
});
const browser = await browserCheck();
const scenes = (
  process.env.AVBD_PROFILE_SCENES ||
  "showcase-box-columns-100k,showcase-brick-ring-110k,showcase-brick-ring-28k,showcase-ragdolls-on-cloth-24k"
).split(",");
const variants = (
  process.env.AVBD_PROFILE_VARIANTS || "baseline,projected"
).split(",");
const warmup = Number(process.env.AVBD_PROFILE_WARMUP || 60),
  count = Number(process.env.AVBD_PROFILE_SAMPLES || 60);
const repeats = Number(process.env.AVBD_PROFILE_REPEATS || 3);
const report = {
  date: new Date().toISOString(),
  method:
    "Distinct GPU phase timestamps; no renderer, sleeping or frame-rate cap. Fresh scene per variant, identical fixed steps. Timed steps split phases into four passes. Wall time includes JS submission, queue and readback; not GPU solver time.",
  runs: [],
};
try {
  await browser.navigate("tests/performance.html");
  for (let i = 0; i < 200; i++) {
    const state = await browser.evaluate(
      "({ready:!!globalThis.__PERFORMANCE__,error:globalThis.__PERFORMANCE_SETUP_ERROR__})",
    );
    if (state.error) throw Error(state.error);
    if (state.ready) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  report.adapter = await browser.evaluate("__PERFORMANCE__.info");
  for (const scene of scenes)
    for (let repeat = 0; repeat < repeats; repeat++)
      for (const variant of repeat % 2 ? [...variants].reverse() : variants) {
        const result = await browser.evaluate(
          `__PERFORMANCE__.run(${JSON.stringify(scene)},${JSON.stringify(variant)},${warmup},${count})`,
        );
        result.repeat = repeat;
        report.runs.push(result);
        await writeFile(
          `test-results/solver-${process.argv[2] || "tuning"}.json`,
          JSON.stringify(report, null, 2),
        );
        console.log(
          JSON.stringify({
            scene,
            variant,
            summary: result.summary,
            counters: result.counters,
          }),
        );
      }
  report.errors = [
    ...browser.errors,
    ...(await browser.evaluate("__PERFORMANCE__.errors")),
  ];
  if (report.errors.length) throw Error(report.errors.join("\n"));
  await writeFile(
    `test-results/solver-${process.argv[2] || "tuning"}.json`,
    JSON.stringify(report, null, 2),
  );
} finally {
  await browser.close();
}
