import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeReport, writeAtomicFile } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";

const warmup = Number(process.env.AVBD_PROFILE_WARMUP ?? 120);
const samples = Number(process.env.AVBD_PROFILE_SAMPLES ?? 60);
const repeats = Number(process.env.AVBD_PROFILE_REPEATS ?? 3);
assert(
  Number.isInteger(repeats) && repeats > 0,
  "Positive repeat count required",
);
await mkdir(".temp", { recursive: true });
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
export {NativeGpuSolver3D} from './src/native/solver3D.js';
export {Solver} from './reference/three-avbd/src/avbd3d/ref/solver.ts';
export {Rigid} from './reference/three-avbd/src/avbd3d/ref/body.ts';
export {pairedPerformance} from './tests/paired-performance.js';`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/small-groups.js",
  write: false,
});
for (const file of bundle.outputFiles)
  await writeAtomicFile(file.path, file.contents);
const b = await browserCheck(),
  results = [];
try {
  await b.navigate("test-results/solver-performance.html");
  for (const count of [9, 32])
    for (let repeat = 0; repeat < repeats; repeat++) {
      const variants =
        repeat % 2
          ? ["single-workgroup", "separate-dispatches"]
          : ["separate-dispatches", "single-workgroup"];
      const result = await b.evaluate(`(async()=>{
      const m=await import('/.temp/small-groups.js');
      const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
      const device=await adapter.requestDevice({requiredFeatures:['timestamp-query']});
      const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
      const poses={};
      const summarize=a=>{a=a.toSorted((a,b)=>a-b);return {mean:a.reduce((s,v)=>s+v,0)/a.length,median:a[Math.floor(a.length/2)],p95:a[Math.floor(a.length*.95)],n:a.length};};
      try{
        const create=(_,variant)=>{
          const ref=new m.Solver();ref.iterations=5;
          new m.Rigid(ref,[30,30,1],0,.5,[0,0,-.5]);
          for(let i=0;i<${count - 1};i++){const body=new m.Rigid(ref,[.8,.8,.8],1,.5,[(i%2)*.8,0,.4+Math.floor(i/2)*.8]);body.velocityLin[0]=.1;}
          const g=new m.NativeGpuSolver3D(device,ref,{smallGroups:variant==='single-workgroup'?undefined:false,spatialSort:false,colorCap:8,colorRounds:16,primalLanes:[2147483648,2147483648,2147483648]});
          const read=g.readBodies.bind(g);g.readBodies=async()=>{const p=await read();poses[variant]=p;return p;};
          return {gpu:g,detailed:true};
        };
        const comparison=await m.pairedPerformance({device,create,summarize,errors},'closed-group-${count}',${JSON.stringify(variants)},${warmup},${samples});
        let differentWords=0;const a=poses['separate-dispatches'],c=poses['single-workgroup'];
        for(let i=0;i<a.length;i++)if(a[i]!==c[i])differentWords++;
        return {count:${count},repeat:${repeat},comparison,differentWords,errors,adapter:{vendor:adapter.info.vendor,description:adapter.info.description}};
      }finally{device.destroy();}
    })()`);
      assert.deepEqual(result.errors, []);
      assert.deepEqual(b.errors, []);
      assert.equal(result.differentWords, 0);
      results.push(result);
      await writeReport("test-results/small-group-performance.json", {
        date: new Date().toISOString(),
        method: `${repeats} paired runs at each size; creation order reversed on odd repeats and execution alternated every step. ${warmup} warmup steps and ${samples} separately timed steps, five iterations, no rendering or sleeping. Every step checks contact overflow and coloring conflicts. All final body fields must match exactly. Single-workgroup timing combines body and contact updates.`,
        results,
        ...(await gpuBenchmarkHardware(result.adapter)),
      });
      console.log(
        JSON.stringify({
          count,
          repeat,
          differentWords: result.differentWords,
          timings: result.comparison.results.map((r) => ({
            variant: r.variant,
            total: r.summary.total,
            solve: r.summary.solve,
          })),
        }),
      );
    }
} finally {
  await b.close();
}
