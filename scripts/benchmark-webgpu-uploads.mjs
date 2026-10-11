import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeReport } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";

await mkdir(".temp", { recursive: true });
await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `export {AvbdScene2D,AvbdScene3D} from './src/native/scenes.js';
      export {GpuSolver2D} from './reference/three-avbd/src/avbd2d/gpu/solver.ts';
      export {GpuSolver3D} from './reference/three-avbd/src/avbd3d/gpu/solver.ts';
      export {createWebGPUDevice} from './src/gpu/device.js';`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/webgpu-uploads.js",
});
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  const result = await b.evaluate(`(async()=>{
    const {AvbdScene2D,AvbdScene3D,GpuSolver2D,GpuSolver3D,createWebGPUDevice}=await import('/.temp/webgpu-uploads.js');
    const {device,adapter}=await createWebGPUDevice();
    const errors=[],results=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    try{
      for(const dimension of [2,3]){
        const scene=dimension===2?new AvbdScene2D():new AvbdScene3D();
        scene.addBox(dimension===2?[1,1]:[1,1,1]);const g=scene.createSolver(device);
        try{
          const methods=[(dimension===2?GpuSolver2D:GpuSolver3D).prototype.writeParams,g.writeParams];
          const samples=[[],[]],batch=2000;
          for(let r=0;r<30;r++)for(const mode of r%2?[1,0]:[0,1]){
            await device.queue.onSubmittedWorkDone();
            const start=performance.now();
            for(let i=0;i<batch;i++) {if(dimension===3)g.stepCount++;methods[mode].call(g,g.params.alpha,false);}
            const elapsed=(performance.now()-start)/batch;if(r>=10)samples[mode].push(elapsed);
          }
          await device.queue.onSubmittedWorkDone();
          const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
          results.push({dimension,callsPerSample:batch,samplesPerMode:20,fullUploadCpuMs:median(samples[0]),cachedUploadCpuMs:median(samples[1]),stableStepBytes:dimension===3?4:0,previousStepBytes:g.paramsBuffer.size,samples});
        }finally{g.destroy();}
      }
      return {date:new Date().toISOString(),adapter:{vendor:adapter.info.vendor,architecture:adapter.info.architecture,description:adapter.info.description},results,errors};
    }finally{device.destroy();}
  })()`);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(b.errors, []);
  for (const row of result.results)
    console.log(JSON.stringify({ ...row, samples: undefined }));
  await writeReport("test-results/webgpu-upload-performance.json", {
    passed: true,
    method:
      "CPU preparation and queue.writeBuffer calls for WebGPU solver settings only. 10 warmup plus 20 alternating batches of 2,000 calls. 3D generation advances on every call. No CPU physics pipeline, GPU solving, drawing or end-to-end frame rate is measured.",
    ...result,
    ...(await gpuBenchmarkHardware(result.adapter)),
  });
} finally {
  await b.close();
}
