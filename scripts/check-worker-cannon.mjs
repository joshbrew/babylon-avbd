import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeReport } from "./report-file.mjs";
const b = await browserCheck(),
  results = [];
try {
  for (const mode of [
    { demo: "cannon", scope: "worker", backend: "gpu", renderer: "webgpu" },
    {
      demo: "cannon",
      scope: "worker-sab",
      backend: "gpu",
      renderer: "babylon",
    },
    { demo: "cannon", scope: "worker", backend: "cpu", renderer: "webgpu" },
    { demo: "gpu-stress", scope: "worker", backend: "gpu", renderer: "webgpu" },
  ]) {
    await b.navigate(
      "?" + new URLSearchParams({ ...mode, paused: "1", quality: "benchmark" }),
    );
    for (let i = 0; i < 1200; i++) {
      const d = await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics");
      if (d?.errors.length) throw Error(d.errors.join("\n"));
      if (d?.ready) break;
      if (i === 1199) throw Error("Cannon did not initialize");
      await new Promise((r) => setTimeout(r, 50));
    }
    const initial = await b.evaluate("__AVBD_LAB__.client.getInfo()");
    assert.equal(
      initial.scene,
      mode.demo === "cannon" ? "3d-castle-siege" : "3d-100k-rook-impact",
    );
    assert.equal(
      await b.evaluate("document.querySelector('#lab-shoot').hidden"),
      false,
    );
    if (mode.demo === "cannon")
      await b.evaluate(
        `(()=>{for(const [key,value] of Object.entries({yaw:14,elevation:35,speed:50})){const e=document.querySelector('#lab-cannon-'+key);e.value=value;e.dispatchEvent(new Event('input'));}})()`,
      );
    for (const kind of ["sphere", "box", "capsule", "cylinder"]) {
      const r = await b.evaluate(
        `(async()=>{document.querySelector('#lab-projectile').value=${JSON.stringify(kind)};document.querySelector('#lab-shoot').click();await __AVBD_LAB__.step(2);const info=await __AVBD_LAB__.client.getInfo();return {info,body:Array.from(await __AVBD_LAB__.client.readSelectedBodies([info.projectileGpuIndex])),errors:__AVBD_LAB__.diagnostics.errors};})()`,
      );
      assert.equal(r.info.bodies, initial.bodies);
      assert.ok(r.body.every(Number.isFinite));
      assert.ok(Math.hypot(...r.body.slice(32, 35)) > 5, `${kind} must launch`);
      if (mode.demo === "cannon")
        assert.ok(
          r.body[32] > 0 && r.body[34] > 0,
          "Aim must affect the live shot",
        );
      assert.deepEqual(r.errors, []);
    }
    results.push({
      ...mode,
      passed: true,
      shapes: 4,
      aiming: mode.demo === "cannon",
    });
    console.log("PASS worker cannon controls: " + JSON.stringify(mode));
  }
  assert.deepEqual(b.errors, []);
  await writeReport("test-results/worker-cannon.json", {
    passed: true,
    results,
  });
} finally {
  await b.close();
}
