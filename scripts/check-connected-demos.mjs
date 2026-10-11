import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { connectedBrowser } from "./connected-browser.mjs";
import { writeAtomicFile } from "./report-file.mjs";

const b = await connectedBrowser(),
  results = [];
await mkdir("test-results/screenshots", { recursive: true });
const report = {
  measuredAt: new Date().toISOString(),
  hardware: process.env.AVBD_PHONE_MODEL ?? "Connected Android phone",
  scope:
    "Physical phone, local production demo. GPU timestamps when available; completion includes submission and waiting. Short runs check compatibility, not long-term settling or the final Galton distribution.",
  results,
};
async function save(passed = false) {
  await writeAtomicFile(
    "test-results/connected-phone-demos.json",
    JSON.stringify({ ...report, passed, browserErrors: b.errors }, null, 2),
  );
}
try {
  report.userAgent = await b.evaluate("navigator.userAgent");
  for (const scene of [
    "3d-ground",
    "3d-sphere-contacts",
    "2d-mixed-shapes",
    "2d-limited-hinges",
    "3d-limited-hinges",
    "2d-triggers-and-masks",
    "3d-triggers-and-masks",
    "3d-static-terrain",
    "3d-tearable-cloth",
    "3d-marble-cascade",
  ]) {
    const started = performance.now();
    await b.navigate(
      `/?demo=canonical&scene=${scene}&backend=gpu&renderer=webgpu&scope=worker&paused=1&quality=enhanced`,
    );
    await b.ready("globalThis.__AVBD_LAB__?.diagnostics.ready");
    await b.evaluate("__AVBD_LAB__.pause(true)");
    const startupMs = performance.now() - started;
    const benchmark = await b.evaluate(
      "__AVBD_LAB__.client.benchmark({warmup:5,samples:30})",
    );
    console.log(
      JSON.stringify({
        scene,
        startupMs,
        physics: benchmark.physicsMs,
        completion: benchmark.completionMs,
        errors: benchmark.errors,
      }),
    );
    assert.deepEqual(benchmark.errors, []);
    assert.equal(benchmark.counters.overflow, 0);
    assert.equal(benchmark.counters.clashes, 0);
    await b.evaluate(
      `__AVBD_LAB__.client.step(${scene === "3d-marble-cascade" ? 600 : 120})`,
    );
    const state = await b.evaluate(`(async()=>{
      const s=await __AVBD_LAB__.client.snapshot();
      let minDynamicHeight=Infinity,rotationError=0;
      for(let i=0;i<s.bodies;i++){
        if(s.dimension===3){
          if(s.poses[i*40+19]>0)minDynamicHeight=Math.min(minDynamicHeight,s.poses[i*40+2]);
          rotationError=Math.max(rotationError,Math.abs(Math.hypot(...s.poses.slice(i*40+4,i*40+8))-1));
        }
      }
      return {finite:s.poses.every(Number.isFinite),counters:s.counters,errors:s.errors,steps:s.steps,galton:s.galton,pegs:s.pegs,minDynamicHeight:Number.isFinite(minDynamicHeight)?minDynamicHeight:null,rotationError};
    })()`);
    assert.ok(state.finite);
    assert.deepEqual(state.errors, []);
    assert.equal(state.counters.overflow, 0);
    assert.equal(state.counters.clashes, 0);
    assert.ok(state.rotationError < 0.0002);
    if (scene === "3d-marble-cascade") {
      assert.equal(benchmark.bodies, 40747);
      assert.equal(state.galton.released + state.galton.queued, 40000);
      assert.ok(state.galton.released > 0);
      assert.ok(state.galton.bins.reduce((a, n) => a + n, 0) > 0);
      assert.equal(state.galton.escaped, 0);
      assert.equal(state.pegs.total, 700);
    }
    if (scene === "3d-ground" || scene === "3d-sphere-contacts")
      assert.ok(
        state.minDynamicHeight > -0.1,
        "Dynamic shapes must remain above the floor",
      );
    const screenshot = `screenshots/connected-phone-${scene}.png`;
    await b.evaluate(
      "document.querySelector('.lab-view').scrollIntoView({block:'start'})",
    );
    await b.screenshot(`test-results/${screenshot}`);
    results.push({
      scene,
      passed: true,
      startupMs,
      benchmark,
      state,
      screenshot,
    });
    await save();
  }
  assert.deepEqual(b.errors, []);
  await save(true);
  console.log(`PASS ${results.length} connected-phone production scenes`);
} catch (error) {
  report.failure = error.stack;
  await save();
  throw error;
} finally {
  await b.evaluate("globalThis.__AVBD_LAB__?.pause(true)").catch(() => {});
  b.close();
}
