import { browserCheck } from "./browser-check.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await browserCheck(),
  results = [];
const selected = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const onlyGpu = !process.argv.includes("--cpu-reference");
const filter =
  selected && !["gpu", "--cpu-reference"].includes(selected) ? selected : null;
const wait = async (expression) => {
  for (let i = 0; i < 600; i++) {
    if (await browser.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error(`Timed out: ${expression}`);
};
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await browser.navigate(
    "?demo=canonical&scene=2d-empty&backend=gpu&quality=benchmark",
  );
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  const scenes = await browser.evaluate("__AVBD_LAB__.diagnostics.scenes");
  for (const scene of scenes) {
    if (filter && !scene.id.includes(filter)) continue;
    for (const backend of scene.gpuOnly
      ? ["gpu"]
      : scene.dimension === 2
        ? scene.name === "Cards"
          ? ["ref", "soa-seq", "gpu"]
          : ["ref", "soa-seq", "soa-colored", "gpu"]
        : scene.gpuOnly
          ? ["gpu"]
          : ["ref", "gpu"]) {
      if (onlyGpu && backend !== "gpu") continue;
      const name = `${scene.id}-${backend}`;
      try {
        await browser.evaluate(
          `__AVBD_LAB__.select(${JSON.stringify(scene.id)},${JSON.stringify(backend)})`,
        );
        await browser.evaluate("__AVBD_LAB__.pause(false)");
        await wait("__AVBD_LAB__.diagnostics.frames >= 65");
        await browser.evaluate("__AVBD_LAB__.pause(true)");
        const result = await browser.evaluate(
          `(async()=>{await __AVBD_LAB__.collect();const s=await __AVBD_LAB__.snapshot();const flat=s.poses.flat();const samples=s.samples.slice(10);const timing={};for(const key of ['frameMs','solveMs','renderMs','collisionMs','constraintMs','adjacencyMs','coloringMs']){const v=samples.map(s=>s[key]??0).sort((a,b)=>a-b);timing[key]={mean:v.reduce((a,b)=>a+b,0)/v.length,median:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)]};}return {scene:s.scene,backend:s.backend,steps:s.steps,bodies:s.bodyCount,finite:flat.every(Number.isFinite),timing,stats:s.stats,gpuProfile:s.gpuProfile,errors:s.errors};})()`,
        );
        if (
          !result.finite ||
          result.errors.length ||
          result.stats.overflow ||
          result.stats.clashes ||
          result.stats.colorConflicts
        )
          throw Error(JSON.stringify(result));
        await browser.evaluate(`document.querySelector('#lab-fit').onclick()`);
        await browser.screenshot(`test-results/screenshots/${name}.png`);
        await browser.evaluate(`document.querySelector('#lab-step').click()`);
        const stepped = await browser.evaluate(
          "__AVBD_LAB__.diagnostics.steps",
        );
        if (stepped !== result.steps + 1)
          throw Error("Single-step control did not advance exactly once");
        results.push({ name, passed: true, ...result });
        console.log(
          `PASS ${name}: solve ${result.timing.solveMs.median.toFixed(2)} ms, render ${result.timing.renderMs.median.toFixed(2)} ms`,
        );
      } catch (e) {
        results.push({ name, passed: false, error: e.message });
        console.error(`FAIL ${name}: ${e.message}`);
      }
      await writeFile(
        selected
          ? `test-results/scenes-${selected}.json`
          : onlyGpu
            ? "test-results/scenes.json"
            : "test-results/scenes-cpu-reference.json",
        JSON.stringify({ results, errors: browser.errors }, null, 2),
      );
    }
  }
  if (results.some((r) => !r.passed) || browser.errors.length)
    process.exitCode = 1;
  console.log(
    `${results.filter((r) => r.passed).length}/${results.length} ${onlyGpu ? "GPU scene" : "scene/backend"} checks passed.`,
  );
} finally {
  await browser.close();
}
