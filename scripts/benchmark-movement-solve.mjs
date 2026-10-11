import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeReport, writeAtomicFile } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";
assert.equal(
  process.argv.length,
  2,
  "This benchmark uses the production solver; configure scenes and sampling through AVBD_PROFILE_* environment variables",
);
const warmup = Number(process.env.AVBD_PROFILE_WARMUP ?? 120);
const samples = Number(process.env.AVBD_PROFILE_SAMPLES ?? 60);
const scenes = (
  process.env.AVBD_PROFILE_SCENES ??
  "showcase-box-columns-100k,showcase-brick-ring-110k,paper-walls-510k-3,paper-walls-510k-4"
).split(",");
const repeats = Number(process.env.AVBD_PROFILE_REPEATS ?? 2);
assert(
  Number.isInteger(repeats) && repeats > 0,
  "Positive repeat count required",
);
await mkdir(".temp", { recursive: true });
const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
export {buildCanonicalScene} from './demo/lab/scenes.js';
export {sceneGpuSolverOptions} from './src/gpu/gpuSolverOptions.js';
export {NativeGpuSolver3D} from './src/native/solver3D.js';
export {solveWGSL} from './reference/three-avbd/src/avbd3d/gpu/wgsl-solve.ts';
export {projectedContactSolve,pointLanesContactSolve} from './src/gpu/gpuSolverKernels.js';
export {pairedPerformance} from './tests/paired-performance.js';
`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/movement-solve.js",
  write: false,
});
for (const file of bundle.outputFiles)
  await writeAtomicFile(file.path, file.contents);
const b = await browserCheck();
const results = [];
try {
  await b.navigate("test-results/solver-performance.html");
  for (const scene of scenes)
    for (let repeat = 0; repeat < repeats; repeat++) {
      const result = await b.evaluate(`(async()=>{
      const m=await import('/.temp/movement-solve.js');
      const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
      if(!adapter?.features.has('timestamp-query'))throw Error('Movement benchmarking requires GPU timestamp queries');
      const device=await adapter.requestDevice({requiredFeatures:['timestamp-query'],requiredLimits:{maxStorageBufferBindingSize:Math.min(512*1024*1024,adapter.limits.maxStorageBufferBindingSize),maxBufferSize:Math.min(1024*1024*1024,adapter.limits.maxBufferSize),maxStorageBuffersPerShaderStage:9}});
      const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
      const summarize=a=>{a=a.toSorted((a,b)=>a-b);return {mean:a.reduce((s,v)=>s+v,0)/a.length,median:a[Math.floor(a.length/2)],p95:a[Math.floor(a.length*.95)],n:a.length};};
      const poses=[];
      try{
        const create=(scene,variant)=>{
          const built=m.buildCanonicalScene(scene,'gpu');
          const source=scene==='showcase-box-columns-100k'?m.pointLanesContactSolve:built.solver.bodies.length>=50000&&!built.solver.forces.length?m.projectedContactSolve:m.solveWGSL;
          const options={...m.sceneGpuSolverOptions(scene),...built.gpuOptions,shaders:{solve:source},broadphase:scene.includes('ragdolls')?'hploc':'grid',adaptiveScheduling:true};
          if(variant==='production')delete options.shaders;
          const gpu=built.scene?built.scene.createSolver(device,options):new m.NativeGpuSolver3D(device,built.solver,options);
          Object.assign(gpu.params,built.gpuParams);
          const read=gpu.readBodies.bind(gpu);gpu.readBodies=async()=>{const data=await read();poses[variant==='full'?0:1]=data;return data;};
          return {gpu,detailed:true};
        };
        const comparison=await m.pairedPerformance({device,create,summarize,errors},${JSON.stringify(scene)},${JSON.stringify(repeat % 2 ? ["production", "full"] : ["full", "production"])},${warmup},${samples});
        let maxPoseError=0,maxWordError=0,differentWords=0;
        for(let i=0;i<poses[0].length;i++){const error=Math.abs(poses[0][i]-poses[1][i]);maxWordError=Math.max(maxWordError,error);if(i%40<8)maxPoseError=Math.max(maxPoseError,error);if(error)differentWords++;}
        return {...comparison,maxPoseError,maxWordError,differentWords,adapter:{vendor:adapter.info.vendor,description:adapter.info.description},errors};
      }finally{device.destroy();}
    })()`);
      assert.deepEqual(result.errors, []);
      assert.deepEqual(b.errors, []);
      assert.equal(
        result.differentWords,
        0,
        "All resulting body-state values match",
      );
      result.repeat = repeat;
      result.baselineVariant = "full";
      result.baselineImplementation = "Same equations before movement batching";
      result.candidateVariant = "production";
      result.physicsSavingPercent =
        100 *
        (1 -
          result.results.find((r) => r.variant === "production").summary.total
            .mean /
            result.results.find((r) => r.variant === "full").summary.total
              .mean);
      results.push(result);
      console.log(
        JSON.stringify({
          scene,
          results: result.results.map((r) => ({
            variant: r.variant,
            solve: r.summary.solve,
            details: r.details,
            counters: r.counters,
          })),
          repeat,
          physicsSavingPercent: result.physicsSavingPercent,
          maxPoseError: result.maxPoseError,
          differentWords: result.differentWords,
        }),
      );
    }
  await writeReport("test-results/movement-solve-performance.json", {
    date: new Date().toISOString(),
    passed: true,
    method: `Same contacts, equations, timestep and iterations. ${repeats} repeat(s), reversing world creation order on odd repeats; fixed-step execution alternates every step. Every step checks overflow and conflicts. Every resulting body field must match exactly. GPU detailed timestamps; no rendering or sleeping.`,
    results,
    ...(await gpuBenchmarkHardware(results[0].adapter)),
  });
} finally {
  await b.close();
}
