import { browserCheck } from "./browser-check.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";
import { writeReport } from "./report-file.mjs";
import { readFile } from "node:fs/promises";

// Real animation frames, visible sprites, the demo's unchanged collision shader.
// Headless Chrome remains display-paced: do not disable its frame limiter.
const browser = await browserCheck();
const quick = process.argv.includes("--quick");
const report = {
  started: new Date().toISOString(),
  targetFps: 60,
  method: {
    viewport: "1440 × 900, device pixel ratio 1",
    warmupSeconds: 2,
    measurementSeconds: quick ? 2 : 5,
    confirmationSeconds: quick ? 2 : 8,
    pass: "At least 59 FPS and frame p95 below 25 ms (less than 1.5 refresh intervals at 60 Hz); all requested particles alive, collisions observed, no GPU errors.",
    workload:
      "Particles sweep against the rotating D20's 20 triangles and ignore one another. Five offset rays approximate each particle sweep. This is the dedicated collision demo, not an AVBD rigid-body benchmark.",
    timing:
      "Collision and sprite times use separate GPU timestamp passes. CPU submission includes JavaScript and Babylon shield submission. Frame time also includes browser scheduling, the WebGL shield and compositing; these stage times are not additive.",
  },
  results: [],
  errors: [],
};
const output = "test-results/particle-capacity.json";
const passes = (r) =>
  r.fps >= 59 &&
  r.frames.p95 < 25 &&
  r.alive?.median === r.count &&
  r.hitsPerSecond > 0 &&
  !r.errors.length;
async function measure(
  count,
  phase = "search",
  draw = true,
  seconds = report.method.measurementSeconds,
) {
  console.log(
    `Measuring ${count.toLocaleString()} particles (${phase}, ${draw ? "sprites visible" : "collision only"})...`,
  );
  const r = await browser.evaluate(
    `__COLLISION_BENCHMARK__.measure(${JSON.stringify({ count, warmupSeconds: 2, seconds, draw })})`,
  );
  if (
    browser.errors.length ||
    r.errors.length ||
    r.alive?.median !== count ||
    !r.hitsPerSecond
  )
    throw Error(JSON.stringify({ result: r, browser: browser.errors }));
  const row = { ...r, phase, sustainable60: passes(r) };
  report.results.push(row);
  console.log(
    `${row.sustainable60 ? "60 FPS" : "Below target"}: ${r.fps.toFixed(2)} FPS, frame p95 ${r.frames.p95.toFixed(2)} ms, collision ${r.collisionMs?.median.toFixed(3) ?? "unavailable"} ms, sprites ${r.spriteMs?.median.toFixed(3) ?? "off"} ms`,
  );
  await writeReport(output, report);
  return row;
}
try {
  await browser.navigate("?demo=benchmark");
  for (let i = 0; i < 600; i++) {
    if (await browser.evaluate("!!globalThis.__COLLISION_BENCHMARK__")) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  report.info = await browser.evaluate("__COLLISION_BENCHMARK__.info()");
  Object.assign(report, await gpuBenchmarkHardware(report.info.adapter));
  if (process.argv.includes("--resume")) {
    const previous = JSON.parse(await readFile(output, "utf8"));
    if (
      previous.hardware !== report.hardware ||
      JSON.stringify(previous.info.viewport) !==
        JSON.stringify(report.info.viewport) ||
      JSON.stringify(previous.info.settings) !==
        JSON.stringify(report.info.settings)
    )
      throw Error(
        "Cannot combine particle runs with different hardware, viewport or settings",
      );
    report.started = previous.started;
    report.results = previous.results;
    report.boundary = previous.boundary;
  }
  const requestedCounts = process.argv.find((arg) =>
    arg.startsWith("--counts="),
  );
  if (requestedCounts) {
    for (const count of requestedCounts.slice(9).split(",").map(Number))
      for (
        let repeat = 0;
        repeat < (process.argv.includes("--confirm") ? 3 : 1);
        repeat++
      )
        await measure(
          count,
          process.argv.includes("--confirm") ? "confirmation" : "search",
          true,
          process.argv.includes("--confirm")
            ? report.method.confirmationSeconds
            : report.method.measurementSeconds,
        );
  } else {
    let lower = 0,
      upper = null;
    const ceiling = report.info.capacity;
    for (let count = 25_000; ; count = Math.min(ceiling, count * 2)) {
      const r = await measure(count);
      if (!r.sustainable60) {
        upper = count;
        break;
      }
      lower = count;
      if (count === ceiling) break;
    }
    if (upper !== null) {
      for (
        let i = 0;
        i < (quick ? 2 : 6) && upper - lower > Math.max(5000, lower * 0.05);
        i++
      ) {
        const count = Math.round((lower + upper) / 2000) * 1000;
        if ((await measure(count, "refinement")).sustainable60) lower = count;
        else upper = count;
      }
      // Repeats expose thermal, clock and scheduling variability near the limit.
      let reliableLower = false;
      for (const count of [lower, upper].filter((count) => count > 0)) {
        let allPassed = true;
        for (let repeat = 0; repeat < (quick ? 1 : 3); repeat++)
          allPassed =
            (
              await measure(
                count,
                "confirmation",
                true,
                report.method.confirmationSeconds,
              )
            ).sustainable60 && allPassed;
        if (count === lower) reliableLower = allPassed;
      }
      // A boundary that held for five seconds can soften as the GPU warms up.
      // Keep the failed runs and confirm a lower count rather than hiding them.
      for (
        let backoff = 0;
        lower > 0 && !reliableLower && backoff < 3;
        backoff++
      ) {
        upper = Math.min(upper, lower);
        lower = Math.max(1, Math.floor((lower * 0.95) / 1000) * 1000);
        reliableLower = true;
        for (let repeat = 0; repeat < (quick ? 1 : 3); repeat++)
          reliableLower =
            (
              await measure(
                lower,
                "confirmation",
                true,
                report.method.confirmationSeconds,
              )
            ).sustainable60 && reliableLower;
      }
      await measure(upper, "drawing-disabled diagnostic", false);
    }
    report.boundary = {
      lower,
      upper,
      reachedDeviceOrSearchCeiling: upper === null,
    };
  }
  const visibleCounts = [
    ...new Set(report.results.filter((r) => r.draw).map((r) => r.count)),
  ];
  report.confirmed60FpsCount =
    Math.max(
      0,
      ...visibleCounts.filter((count) => {
        const runs = report.results.filter((r) => r.draw && r.count === count);
        return (
          runs.filter((r) => r.phase === "confirmation").length >= 3 &&
          runs.every(passes)
        );
      }),
    ) || null;
  report.completed = new Date().toISOString();
  report.passed = true;
} catch (error) {
  report.errors.push(error.stack ?? String(error));
  report.passed = false;
  process.exitCode = 1;
} finally {
  await writeReport(output, report);
  await browser.close();
}
if (!report.passed) throw Error(report.errors.join("\n"));
