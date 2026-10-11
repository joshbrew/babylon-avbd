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
    contents: `export {createEncodingFixture} from './tests/gpu-command-encoding.js';
      export {encodeGpuSolverStep} from './src/gpu/gpuSolverStep.js';
      export {encodeGpuSolverStep2D} from './src/gpu/gpuSolverStep2D.ts';
      export {createWebGPUDevice} from './src/gpu/device.js';`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/command-encoding.js",
});
const browser = await browserCheck();
try {
  await browser.navigate("test-results/solver-performance.html");
  const result = await browser.evaluate(`(async()=>{
    const m=await import('/.temp/command-encoding.js');
    const {device,adapter}=await m.createWebGPUDevice();
    const errors=[],results=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    const summary=a=>{const s=a.toSorted((a,b)=>a-b);return {mean:a.reduce((s,v)=>s+v,0)/a.length,median:s[Math.floor(s.length/2)],p95:s[Math.floor(s.length*.95)],samples:a.length};};
    try{
      for(const dimension of [2,3]){
        const worlds=[m.createEncodingFixture(device,dimension),m.createEncodingFixture(device,dimension)];
        worlds.forEach(g=>g.step());
        worlds[0].passOffsets=new Uint32Array(1);worlds[1].passOffsets=[0];
        const step=worlds.map(g=>()=>dimension===2?m.encodeGpuSolverStep2D.call(g):m.encodeGpuSolverStep(g));
        try{
          const samples=[[],[]],batch=4;
          for(let repeat=0;repeat<120;repeat++)for(const mode of repeat%2?[1,0]:[0,1]){
            await device.queue.onSubmittedWorkDone();
            const start=performance.now();
            for(let i=0;i<batch;i++)step[mode]();
            const elapsed=(performance.now()-start)/batch;
            if(repeat>=60)samples[mode].push(elapsed);
          }
          await device.queue.onSubmittedWorkDone();
          const counts=[];
          for(let mode=0;mode<2;mode++){
            const count={bindings:0,directDispatches:0,indirectDispatches:0};
            const bind=(object,key)=>{const value=Reflect.get(object,key,object);return typeof value==='function'?value.bind(object):value;};
            const proxyPass=pass=>new Proxy(pass,{get(target,key){
              if(key==='setBindGroup')return (...args)=>{count.bindings++;return target.setBindGroup(...args);};
              if(key==='dispatchWorkgroups')return (...args)=>{count.directDispatches++;return target.dispatchWorkgroups(...args);};
              if(key==='dispatchWorkgroupsIndirect')return (...args)=>{count.indirectDispatches++;return target.dispatchWorkgroupsIndirect(...args);};
              return bind(target,key);
            }});
            worlds[mode].device=new Proxy(device,{get(target,key){
              if(key==='createCommandEncoder')return (...args)=>{
                const encoder=target.createCommandEncoder(...args);
                return new Proxy(encoder,{get(target,key){
                  if(key==='beginComputePass')return (...args)=>proxyPass(target.beginComputePass(...args));
                  return bind(target,key);
                }});
              };
              return bind(target,key);
            }});
            try{step[mode]();}finally{worlds[mode].device=device;}
            counts.push(count);
          }
          const poses=await Promise.all(worlds.map(g=>g.readBodies()));
          const sameState=poses[0].every((v,i)=>Number.isFinite(v)&&v===poses[1][i]);
          const counters=await Promise.all(worlds.map(g=>g.readCounters()));
          results.push({dimension,bodyCount:worlds[0].bodyCount,iterations:worlds[0].params.iterations,colorRounds:worlds[0].colorRounds,
            callsPerSample:batch,warmupSamples:60,measuredSamples:60,baselineOffsetArray:'Uint32Array',currentOffsetArray:'Array',baselineCpuMs:summary(samples[0]),currentCpuMs:summary(samples[1]),
            counts,sameState,counters,samples});
        }finally{worlds.forEach(g=>g.destroy());}
      }
      return {date:new Date().toISOString(),adapter:{vendor:adapter.info.vendor,description:adapter.info.description},results,errors};
    }finally{device.destroy();}
  })()`);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(browser.errors, []);
  for (const row of result.results) {
    assert(row.sameState, "Resulting body fields must match exactly");
    assert(row.counters.every((c) => !c.overflow && !c.clashes));
    assert.equal(
      row.counts[0].directDispatches,
      row.counts[1].directDispatches,
    );
    assert.equal(
      row.counts[0].indirectDispatches,
      row.counts[1].indirectDispatches,
    );
    assert.deepEqual(row.counts[0], row.counts[1]);
    console.log(JSON.stringify({ ...row, samples: undefined }));
  }
  await writeReport("test-results/command-encoding-performance.json", {
    passed: true,
    method:
      "CPU encoding and submission of WebGPU steps with reused typed versus plain dynamic-offset arrays, excluding world-policy selection, GPU duration and drawing. Same small mixed-shape worlds, contacts, timestep, iterations and encoder; only the offset-array overload differs. 120 alternating batches of four steps, first 60 discarded. GPU completion between batches prevents a long submission queue from dominating CPU timings. Binding/dispatch counting runs separately from timing. Every resulting body field matches; contact capacity and solve-group conflicts are checked.",
    ...result,
    ...(await gpuBenchmarkHardware(result.adapter)),
  });
} finally {
  await browser.close();
}
