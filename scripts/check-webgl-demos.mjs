import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await browserCheck(),
  rows = [];
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await browser.navigate(
    "?demo=canonical&scene=3d-stack&backend=webgl2&paused=1",
  );
  let ready = false;
  for (let i = 0; i < 600; i++) {
    const d = await browser.evaluate("globalThis.__AVBD_LAB__?.diagnostics");
    if (d?.errors?.length) throw Error(d.errors.join("\n"));
    if (d?.ready) {
      ready = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, "WebGL2 demo did not initialize");
  const originals = await browser.evaluate(
    "__AVBD_LAB__.diagnostics.scenes.filter(s=>s.canonical).map(s=>s.id)",
  );
  assert.equal(originals.length, 33);
  const showcase = [
    "3d-stack",
    "2d-stack",
    "2d-mixed-shapes",
    "2d-limited-hinges",
    "2d-triggers-and-masks",
    "3d-convex-hulls",
    "3d-rope",
    "3d-limited-hinges",
    "3d-triggers-and-masks",
    "3d-tearable-cloth",
    "3d-castle-siege",
    "3d-voronoi-demolition",
  ];
  for (const scene of new Set([...originals, ...showcase])) {
    console.log(scene);
    const result = await browser.evaluate(
      `(async()=>{await __AVBD_LAB__.select('${scene}','webgl2');await __AVBD_LAB__.step(8);await __AVBD_LAB__.collect();let counters=(await __AVBD_LAB__.snapshot()).stats;let adaptations=0;while((counters.overflow||counters.clashes)&&adaptations++<4){await __AVBD_LAB__.step(8);await __AVBD_LAB__.collect();counters=(await __AVBD_LAB__.snapshot()).stats;}const s=await __AVBD_LAB__.snapshot();return {backend:s.backend,count:s.bodyCount,finite:s.poses.flat().every(Number.isFinite),errors:s.errors,contacts:s.stats.contacts,overflow:s.stats.overflow,clashes:s.stats.clashes,adaptations};})()`,
    );
    console.log(result);
    assert.equal(result.backend, "webgl2");
    assert.ok(result.finite);
    assert.deepEqual(result.errors, []);
    assert.equal(result.overflow, 0);
    assert.equal(result.clashes, 0);
    if (showcase.includes(scene))
      await browser.screenshot(`test-results/screenshots/webgl2-${scene}.png`);
    rows.push({
      scene,
      ...result,
      ...(showcase.includes(scene)
        ? { screenshot: `screenshots/webgl2-${scene}.png` }
        : {}),
      passed: true,
    });
  }
  assert.deepEqual(browser.errors, []);
  await writeFile(
    "test-results/webgl-demos.json",
    JSON.stringify({ passed: true, rows }, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
