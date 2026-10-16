import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeReport } from "./report-file.mjs";
const b = await browserCheck();
const rows = [];
async function ready() {
  for (let i = 0; i < 600; i++) {
    const state = await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics");
    if (state?.errors?.length || b.errors.length)
      throw Error(JSON.stringify({ state, errors: b.errors }));
    if (state?.ready) return state;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw Error("Recycling UI did not finish loading");
}
async function change(id, value) {
  await b.evaluate(
    `(()=>{const e=document.getElementById(${JSON.stringify(id)});e.value=${JSON.stringify(value)};e.onchange();})()`,
  );
  return ready();
}
try {
  for (const scope of ["main", "worker"])
    for (const backend of ["gpu", "cpu"]) {
      await b.navigate(
        `?demo=canonical&scene=2d-stack&scope=${scope}&backend=${backend}&recycling=on&paused=1`,
      );
      assert.equal((await ready()).contactRecyclingEnabled, true);
      assert.equal(
        (await change("lab-recycling", "off")).contactRecyclingEnabled,
        false,
      );
      assert.equal(
        await b.evaluate(
          "new URL(location.href).searchParams.get('recycling')",
        ),
        "off",
      );
      assert.equal(
        (await change("lab-scene", "3d-stack")).contactRecyclingEnabled,
        false,
      );
      assert.equal(
        await b.evaluate("document.getElementById('lab-recycling').value"),
        "auto",
      );
      await change("lab-recycling", "on");
      assert.equal(
        (await change("lab-scene", "2d-stack")).contactRecyclingEnabled,
        false,
      );
      assert.equal(
        await b.evaluate("document.getElementById('lab-recycling').value"),
        "off",
      );
      assert.equal(
        (await change("lab-scene", "3d-stack")).contactRecyclingEnabled,
        true,
      );
      rows.push({
        scope,
        backend,
        manualChoicePreserved: true,
        scenePresetsIndependent: true,
      });
      await b.evaluate("__AVBD_LAB__.dispose()");
    }
  await b.navigate(
    "?demo=canonical&scene=showcase-wall-smash-2k&backend=gpu&scope=worker&paused=1",
  );
  assert.equal((await ready()).contactRecyclingEnabled, true);
  await b.evaluate("__AVBD_LAB__.dispose()");
  await b.navigate(
    "?demo=canonical&scene=showcase-wall-smash-2k&backend=cpu&scope=worker&paused=1",
  );
  assert.equal((await ready()).contactRecyclingEnabled, false);
  await b.evaluate("__AVBD_LAB__.dispose()");
  assert.deepEqual(b.errors, []);
  await writeReport("test-results/contact-recycling-ui.json", {
    passed: true,
    rows,
  });
  console.log(
    "PASS contact recycling controls: 2D/3D, CPU/GPU, main/worker, scene-local overrides and GPU-only presets",
  );
} finally {
  await b.close();
}
