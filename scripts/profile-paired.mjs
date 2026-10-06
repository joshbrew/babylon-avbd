import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
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
  "showcase-box-columns-100k,showcase-brick-ring-110k,paper-walls-510k-4"
).split(",");
const variants = (
  process.env.AVBD_PROFILE_VARIANTS || "projected,points"
).split(",");
const repeats = Number(process.env.AVBD_PROFILE_REPEATS || 3);
const warmup = Number(process.env.AVBD_PROFILE_WARMUP || 60);
const count = Number(process.env.AVBD_PROFILE_SAMPLES || 60);
const report = { date: new Date().toISOString(), comparisons: [] };
try {
  await browser.navigate("tests/performance.html");
  let ready = false;
  for (let i = 0; i < 300; i++) {
    const state = await browser.evaluate(
      "({ready:!!globalThis.__PERFORMANCE__,error:globalThis.__PERFORMANCE_SETUP_ERROR__})",
    );
    if (state.error) throw Error(state.error);
    if (state.ready) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  if (!ready) throw Error("Paired benchmark setup timed out");
  report.adapter = await browser.evaluate("__PERFORMANCE__.info");
  for (const scene of scenes)
    for (let repeat = 0; repeat < repeats; repeat++) {
      const comparison = await browser.evaluate(
        `__PERFORMANCE__.runPaired(${JSON.stringify(scene)},${JSON.stringify(variants)},${warmup},${count})`,
      );
      comparison.repeat = repeat;
      report.comparisons.push(comparison);
      await writeFile(
        `test-results/solver-${process.argv[2] || "paired"}.json`,
        JSON.stringify(report, null, 2),
      );
      console.log(
        JSON.stringify({
          scene,
          repeat,
          saving: comparison.saving,
          collisionChange: comparison.collisionChange,
          results: comparison.results.map((r) => ({
            variant: r.variant,
            total: r.summary.total,
            solve: r.summary.solve,
            counters: r.counters,
          })),
        }),
      );
    }
  report.errors = [
    ...browser.errors,
    ...(await browser.evaluate("__PERFORMANCE__.errors")),
  ];
  if (report.errors.length) throw Error(report.errors.join("\n"));
  await writeFile(
    `test-results/solver-${process.argv[2] || "paired"}.json`,
    JSON.stringify(report, null, 2),
  );
} finally {
  await browser.close();
}
