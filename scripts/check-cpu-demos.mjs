import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";

const b = await browserCheck();
const results = [];
async function ready() {
  for (let i = 0; i < 400; i++) {
    const state = await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics");
    if (state?.errors.length) throw Error(state.errors.join("\n"));
    if (state?.ready) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Scene did not become ready");
}
async function checkScene(id, backend = "ref", steps = 8) {
  await b.evaluate(
    `__AVBD_LAB__.select(${JSON.stringify(id)}, ${JSON.stringify(backend)})`,
  );
  await ready();
  const result = await b.evaluate(`(async () => {
    await __AVBD_LAB__.step(${steps});
    await __AVBD_LAB__.collect();
    const s = await __AVBD_LAB__.snapshot();
    return { scene:s.scene, backend:s.backend, renderer:s.renderer, bodyCount:s.bodyCount,
      finite:s.poses.flat().every(Number.isFinite), iterations:s.iterations,
      timeStep:s.timeStep, steps:s.steps, errors:s.errors,
      contactCheck:__AVBD_LAB__.diagnostics.contactCheck,
      canvasVisible:!!document.querySelector('.lab-view canvas')?.width };
  })()`);
  assert.equal(result.backend, backend);
  assert.equal(result.finite, true);
  assert.equal(result.canvasVisible, true);
  assert.deepEqual(result.errors, []);
  if (backend !== "gpu") assert.equal(result.contactCheck, null);
  results.push({ ...result, passed: true });
  console.log(`PASS ${id} / ${backend} / ${result.renderer}`);
  return result;
}
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await b.navigate("?demo=canonical&scene=3d-stack&backend=cpu&paused=1");
  await ready();
  assert.equal(await b.evaluate("__AVBD_LAB__.diagnostics.backend"), "ref");
  const scenes = await b.evaluate(
    "__AVBD_LAB__.diagnostics.scenes.filter(s => s.canonical).map(s => ({id:s.id,dimension:s.dimension,name:s.name}))",
  );
  assert.equal(scenes.length, 33);
  for (const scene of scenes) {
    await checkScene(scene.id);
    if (scene.dimension === 2) {
      await checkScene(scene.id, "soa-seq");
      if (scene.name !== "Cards") await checkScene(scene.id, "soa-colored");
    }
  }
  const cpu = await checkScene("3d-stack", "ref", 240);
  const floor = await b.evaluate(`(async()=>{
    const s=await __AVBD_LAB__.snapshot();
    const heights=[];for(let i=0;i<s.poses.length;i+=40)if(s.poses[i+19]>0)heights.push(s.poses[i+2]);
    return Math.min(...heights);
  })()`);
  assert.ok(floor > 0.3 && floor < 1, `Stack left the floor: ${floor}`);
  const bench = await b.evaluate("__AVBD_LAB__.benchmark({warmup:5,count:30})");
  assert.equal(bench.backend, "ref");
  assert.ok(bench.meanMs > 0 && Number.isFinite(bench.p95Ms));
  results.push({ check: "CPU physics measurement", ...bench, passed: true });
  await b.screenshot("test-results/screenshots/cpu-3d-stack.png");
  // Renderer settings must retain the selected CPU solver.
  await b.evaluate("document.querySelector('#lab-enhanced').click()");
  await ready();
  assert.equal(
    await b.evaluate("document.querySelector('#lab-renderer').value"),
    "webgl",
  );
  for (const kind of ["webgpu", "babylon"]) {
    await b.evaluate(`__AVBD_LAB__.setRenderer('${kind}')`);
    assert.equal(await b.evaluate("__AVBD_LAB__.diagnostics.backend"), "ref");
    await b.evaluate("__AVBD_LAB__.step(2)");
  }
  const gpu = await checkScene("3d-stack", "gpu");
  assert.equal(gpu.bodyCount, cpu.bodyCount);
  assert.equal(gpu.iterations, cpu.iterations);
  assert.equal(gpu.timeStep, cpu.timeStep);
  // Exercise the actual selector handler, including returning from Babylon GPU.
  await b.evaluate(
    "(async()=>{const e=document.querySelector('#lab-backend');e.value='ref';await e.onchange();})()",
  );
  assert.equal(await b.evaluate("__AVBD_LAB__.diagnostics.backend"), "ref");
  assert.equal(
    await b.evaluate("document.querySelector('#lab-renderer').value"),
    "webgl",
  );
  const cpu2D = await checkScene("2d-stack", "ref");
  await b.screenshot("test-results/screenshots/cpu-2d-stack.png");
  const gpu2D = await checkScene("2d-stack", "gpu");
  assert.equal(cpu2D.timeStep, gpu2D.timeStep);
  assert.equal(cpu2D.iterations, gpu2D.iterations);
  await b.evaluate("__AVBD_LAB__.select('3d-limited-hinges','gpu')");
  assert.equal(
    await b.evaluate(
      "document.querySelector('#lab-backend option[value=ref]').disabled",
    ),
    false,
  );
  await checkScene("3d-limited-hinges", "ref", 60);
  // A browser without WebGPU must still run 2D and 3D CPU scenes.
  await b.call("Page.addScriptToEvaluateOnNewDocument", {
    source:
      "Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true});",
  });
  await b.navigate("?demo=canonical&paused=1");
  await ready();
  assert.equal(await b.evaluate("__AVBD_LAB__.diagnostics.scene"), "3d-stack");
  await checkScene("3d-stack", "ref", 120);
  await checkScene("2d-rope", "ref", 30);
  await b.navigate("?demo=canonical&scene=3d-rope&backend=cpu&paused=1");
  await ready();
  await b.evaluate("__AVBD_LAB__.step(30)");
  assert.equal(await b.evaluate("__AVBD_LAB__.diagnostics.backend"), "ref");
  results.push({
    check: "No-WebGPU startup, 2D/3D compatibility and direct CPU links",
    passed: true,
  });
  assert.deepEqual(b.errors, []);
} catch (error) {
  results.push({ passed: false, error: error.stack });
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(
    "test-results/cpu-demos.json",
    JSON.stringify(
      { date: new Date().toISOString(), results, errors: b.errors },
      null,
      2,
    ),
  );
  await b.close();
}
