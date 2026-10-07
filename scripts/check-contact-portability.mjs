import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
await mkdir(".temp", { recursive: true });
await build({
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/contact-portability.js",
  stdin: {
    resolveDir: process.cwd(),
    contents: `export {createWebGPUDevice} from './src/gpu/device.js'; export {contactPortabilityGpuTests} from './tests/gpu-contact-portability.js';`,
  },
});
const browser = await browserCheck(),
  results = [];
try {
  await browser.navigate("test-results/solver-performance.html");
  for (const bindings of [8, 9]) {
    const result = await browser.evaluate(`(async()=>{
      const {createWebGPUDevice,contactPortabilityGpuTests}=await import('/.temp/contact-portability.js');
      const {device}=await createWebGPUDevice({requiredLimits:{maxStorageBuffersPerShaderStage:${bindings}}});
      const cases=[],errors=[];
      device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
      try{await contactPortabilityGpuTests(device,async(name,run)=>{await run();cases.push({name,passed:true});});return {bindings:device.limits.maxStorageBuffersPerShaderStage,cases,errors};}finally{device.destroy();}
    })()`);
    assert.equal(result.bindings, bindings);
    assert.equal(result.errors.length, 0);
    results.push(result);
  }
  // Viewport emulation checks the controls, not the phone's GPU driver.
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  for (const renderer of ["webgpu", "babylon"]) {
    await browser.navigate(
      `?demo=canonical&scene=3d-sphere-contacts&backend=gpu&renderer=${renderer}&paused=1`,
    );
    for (let i = 0; i < 600; i++) {
      const state = await browser.evaluate(
        "({ready:globalThis.__AVBD_LAB__?.diagnostics.ready,errors:globalThis.__AVBD_LAB__?.diagnostics.errors??[]})",
      );
      assert.equal(state.errors.length, 0, JSON.stringify(state.errors));
      if (state.ready) break;
      assert(i < 599, "Scene initialization timeout");
      await new Promise((r) => setTimeout(r, 50));
    }
    const check = await browser.evaluate(
      "__AVBD_LAB__.diagnostics.contactCheck",
    );
    assert(check.passed, JSON.stringify(check));
    assert.equal(
      await browser.evaluate(
        "document.querySelector('#lab-gpu-check-save').disabled",
      ),
      false,
    );
    await browser.evaluate("__AVBD_LAB__.step(180)");
    const snapshot = await browser.evaluate("__AVBD_LAB__.snapshot()");
    assert.equal(snapshot.errors.length, 0);
    assert(snapshot.poses.every(Number.isFinite));
    await browser.screenshot(
      `test-results/screenshots/mobile-contact-${renderer}.png`,
    );
    results.push({
      renderer,
      viewport: [390, 844],
      contacts: check,
      steps: snapshot.steps,
    });
  }
  assert.equal(browser.errors.length, 0, JSON.stringify(browser.errors));
  await writeFile(
    "test-results/contact-portability.json",
    JSON.stringify(
      {
        passed: true,
        scope:
          "Desktop GPU, explicit 8/9 storage-binding limits and mobile viewport. Physical Android checks are recorded separately.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS GPU 3D compatibility: cache generations, zero-force recovery, verified path selection, 8/9 bindings and both mobile layouts (desktop GPU)",
  );
} finally {
  await browser.close();
}
