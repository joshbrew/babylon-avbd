import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const b = await browserCheck();
const rows = [];
try {
  await b.navigate(
    "?demo=canonical&scope=main&scene=2d-mixed-shapes&backend=cpu&paused=1",
  );
  for (let i = 0; i < 200; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  for (const id of [
    "2d-mixed-shapes",
    "2d-limited-hinges",
    "2d-triggers-and-masks",
    "3d-sphere-contacts",
    "3d-convex-hulls",
    "3d-rope",
    "3d-heavy-rope",
    "showcase-chain-mail-1.6k",
    "showcase-heavy-pendulum",
    "showcase-flag-in-the-wind-1.5k",
    "3d-limited-hinges",
    "3d-triggers-and-masks",
    "3d-tearable-cloth",
    "3d-castle-siege",
    "3d-voronoi-demolition",
  ]) {
    console.log(id);
    const result = await b.evaluate(
      `(async()=>{await __AVBD_LAB__.select('${id}','ref');await __AVBD_LAB__.step(30);await __AVBD_LAB__.collect();const s=await __AVBD_LAB__.snapshot();return {count:s.bodyCount,finite:s.poses.flat().every(Number.isFinite),rings:s.rings?.length??0,shapeDrawCalls:s.renderStats.shapeDrawCalls??0,errors:s.errors}})()`,
    );
    console.log(result);
    assert.ok(result.finite);
    assert.deepEqual(result.errors, []);
    if (id.includes("chain-mail")) {
      assert.ok(result.rings > 0, "CPU chainmail is missing its ring geometry");
      assert.ok(
        result.shapeDrawCalls > 0 && result.shapeDrawCalls < 20,
        "CPU chainmail did not share its ring geometry",
      );
    }
    if (id.includes("triggers")) {
      console.log(await b.evaluate("__AVBD_LAB__.queryFeature()"));
    }
    await b.screenshot(`test-results/screenshots/cpu-${id}.png`);
    rows.push({
      scene: id,
      ...result,
      screenshot: `screenshots/cpu-${id}.png`,
      passed: true,
    });
  }
  assert.deepEqual(b.errors, []);
  await writeFile(
    "test-results/cpu-features.json",
    JSON.stringify({ passed: true, rows }, null, 2) + "\n",
  );
} finally {
  await b.close();
}
