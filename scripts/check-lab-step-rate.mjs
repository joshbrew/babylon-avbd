import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeReport } from "./report-file.mjs";
const b = await browserCheck(),
  results = [];
async function ready() {
  for (let i = 0; i < 1200; i++) {
    const state = await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics");
    if (state?.errors.length) throw Error(state.errors.join("\n"));
    if (state?.ready) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Step-rate scene did not initialize");
}
async function change(value, reset = false) {
  await b.evaluate(
    reset
      ? "document.querySelector('#lab-step-rate-default').click()"
      : `(()=>{const input=document.querySelector('#lab-step-rate');input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('change'));})()`,
  );
  return b.evaluate("__AVBD_LAB__.snapshot()");
}
try {
  for (const mode of [
    { scope: "main", backend: "gpu", scene: "3d-ground" },
    { scope: "worker", backend: "gpu", scene: "3d-ground" },
    { scope: "worker-sab", backend: "gpu", scene: "2d-ground" },
    { scope: "main", backend: "cpu", scene: "2d-ground" },
    { scope: "worker", backend: "cpu", scene: "3d-ground" },
    {
      scope: "worker",
      backend: "gpu",
      renderer: "babylon",
      scene: "3d-ground",
    },
  ]) {
    const route = `?demo=canonical&scene=${mode.scene}&backend=${mode.backend}&scope=${mode.scope}&renderer=${mode.renderer ?? "webgpu"}&paused=1&quality=benchmark`;
    await b.navigate(route);
    await ready();
    const initial = await b.evaluate("__AVBD_LAB__.snapshot()");
    const defaultRate = await b.evaluate(
      "+document.querySelector('#lab-step-rate').value",
    );
    const changed = await change(90);
    assert.equal(changed.timeStep, 1 / 90);
    assert.equal(
      changed.steps,
      initial.steps,
      "Rate changes must not restart or advance physics",
    );
    assert.deepEqual(changed.poses, initial.poses);
    assert.equal(
      await b.evaluate("new URLSearchParams(location.search).get('hz')"),
      "90",
    );
    await b.evaluate("__AVBD_LAB__.step(2)");
    const stepped = await b.evaluate("__AVBD_LAB__.snapshot()");
    assert.equal(stepped.steps, initial.steps + 2);
    assert.ok(stepped.poses.flat().every(Number.isFinite));
    assert.deepEqual(stepped.errors, []);
    assert.equal((await change(0)).timeStep, 1 / 15);
    assert.equal((await change(9999)).timeStep, 1 / 480);
    assert.equal((await change(undefined, true)).timeStep, 1 / defaultRate);
    assert.equal(
      await b.evaluate("new URLSearchParams(location.search).has('hz')"),
      false,
    );
    await b.navigate(route + "&hz=90");
    await ready();
    assert.equal(
      (await b.evaluate("__AVBD_LAB__.snapshot()")).timeStep,
      1 / 90,
    );
    await change(undefined, true);
    results.push({
      ...mode,
      defaultRate,
      liveChange: true,
      unchangedPoses: true,
      restored: true,
      urlOverride: true,
    });
    console.log(
      `PASS physics step-rate controls: ${mode.scene} / ${mode.scope} / ${mode.backend} / ${mode.renderer ?? "webgpu"}`,
    );
  }
  for (const [scene, hz] of [
    ["3d-voronoi-demolition", 240],
    ["showcase-chain-mail-1.6k", 60],
  ]) {
    await b.navigate(
      `?demo=canonical&scene=${scene}&backend=gpu&scope=worker&paused=1`,
    );
    await ready();
    assert.equal(
      +(await b.evaluate("document.querySelector('#lab-step-rate').value")),
      hz,
    );
    results.push({ scene, defaultRate: hz, passed: true });
  }
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate(
    "document.querySelector('.lab-solver-settings').scrollIntoView({block:'center'})",
  );
  assert.ok(
    await b.evaluate("document.documentElement.scrollWidth<=innerWidth"),
  );
  await b.screenshot("test-results/screenshots/step-rate-mobile.png");
  assert.deepEqual(b.errors, []);
  await writeReport("test-results/lab-step-rate.json", {
    passed: true,
    results,
    screenshot: "screenshots/step-rate-mobile.png",
  });
} finally {
  await b.close();
}
