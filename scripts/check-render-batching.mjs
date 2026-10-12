import assert from "node:assert/strict";
import { build } from "esbuild";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";

await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `export {createSimulationSession} from './demo/shared/runtime/simulationSession.js';
      export {canonicalScenes} from './demo/lab/scenes.js';
      export {WorkerCanvas} from './src/utils/workerCanvas.js';
      export {createWebGPUDevice} from './src/gpu/device.js';`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/render-batching.js",
});
const b = await browserCheck(),
  results = [];
try {
  await b.navigate("test-results/solver-performance.html");
  const scenes = await b.evaluate(`(async()=>{
    const m=await import('/.temp/render-batching.js');
    globalThis.__batchModule=m;
    globalThis.__batchGraphics=await m.createWebGPUDevice({preferredLimits:{maxStorageBuffersPerShaderStage:9,maxStorageBufferBindingSize:512*1024**2,maxBufferSize:1024**3}});
    return [...m.canonicalScenes.map(s=>s.id),'naval'];
  })()`);
  for (const scene of scenes) {
    const row = await b.evaluate(`(async()=>{
      const m=__batchModule;
      document.body.innerHTML='<canvas style="width:900px;height:600px"></canvas>';
      const canvas=new m.WorkerCanvas(document.querySelector('canvas'),900,600);
      const s=await m.createSimulationSession(canvas,{scene:${JSON.stringify(scene)},backend:'gpu',renderer:'webgpu',enhanced:true},()=>{},__batchGraphics);
      const calls=[],proto=GPURenderPassEncoder.prototype,originals=new Map();
      try {
        for(const name of ['draw','drawIndexed','drawIndirect','drawIndexedIndirect']) {
          const original=proto[name];originals.set(name,original);
          proto[name]=function(...args){calls.push({method:name,count:args[0],instances:args[1]??1});return Reflect.apply(original,this,args);};
        }
        s.draw();await s.device.queue.onSubmittedWorkDone();
        const visuals=s.renderer.visuals;
        return {scene:${JSON.stringify(scene)},bodies:s.gpu.bodyCount,draws:calls.length,calls,
          shapes:visuals?.groups.map(g=>{const mesh=visuals.meshes.get(g.kind);return {kind:g.kind,instances:g.count,vertices:mesh.vertices.length/6,indices:mesh.indices.length};}),
          errors:[...s.errors]};
      }finally{for(const [name,original]of originals)proto[name]=original;s.destroy();}
    })()`);
    assert.deepEqual(row.errors, []);
    assert.ok(
      (row.draws > 0 || row.bodies === 0) && row.draws <= 12,
      `${scene}: excessive draw calls: ${row.draws}`,
    );
    for (const shape of row.shapes ?? []) {
      assert.ok(
        shape.vertices < shape.indices / 2,
        `${scene}: shared shape vertices must be reused`,
      );
      assert.equal(
        row.calls.filter(
          (c) =>
            c.method === "drawIndexed" &&
            c.instances === shape.instances &&
            c.count === shape.indices,
        ).length >= 1,
        true,
      );
    }
    results.push(row);
    console.log(`PASS ${scene}: ${row.bodies} bodies, ${row.draws} draws`);
  }
  assert.deepEqual(b.errors, []);
  await b.evaluate("__batchGraphics.device.destroy()");
  await writeAtomicFile(
    "test-results/render-batching.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
} finally {
  await b.close();
}
