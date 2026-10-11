import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { writeReport } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";
import { browserCheck } from "./browser-check.mjs";
const repeats = Number(process.env.AVBD_PROFILE_REPEATS ?? 2);
const steps = Number(process.env.AVBD_SLEEP_STEPS ?? 480);
assert(
  Number.isInteger(repeats) && repeats > 0,
  "Positive repeat count required",
);
assert(
  Number.isInteger(steps) && steps >= 100,
  "At least 100 sleep benchmark steps required",
);
await mkdir(".temp", { recursive: true });
await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
export {buildCanonicalScene} from './demo/lab/scenes.js';
export {sceneGpuSolverOptions} from './src/gpu/gpuSolverOptions.js';
export {NativeGpuSolver3D} from './src/native/solver3D.js';
export {readBuffer} from './tests/helpers/gpu.js';
`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/island-bundle.js",
});
const b = await browserCheck(),
  results = [];
try {
  await b.navigate("test-results/solver-performance.html");
  for (let repeat = 0; repeat < repeats; repeat++) {
    const result = await b.evaluate(`(async()=>{
  const m=await import('/.temp/island-bundle.js');
  const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
  const device=await adapter.requestDevice({requiredFeatures:['timestamp-query'],requiredLimits:{maxStorageBufferBindingSize:Math.min(512*1024*1024,adapter.limits.maxStorageBufferBindingSize),maxBufferSize:Math.min(1024*1024*1024,adapter.limits.maxBufferSize),maxStorageBuffersPerShaderStage:9}});
  const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
  const summarize=a=>{a=a.toSorted((a,b)=>a-b);return {mean:a.reduce((s,v)=>s+v,0)/a.length,median:a[Math.floor(a.length/2)],p95:a[Math.floor(a.length*.95)],n:a.length};};
  const worlds=[];
  try{
   for(const islands of ${JSON.stringify(repeat % 2 ? [true, false] : [false, true])}){
    const built=m.buildCanonicalScene('paper-walls-510k-4','gpu');
    const g=new m.NativeGpuSolver3D(device,built.solver,{...m.sceneGpuSolverOptions('paper-walls-510k-4'),...built.gpuOptions,broadphase:'grid',adaptiveScheduling:true});
    Object.assign(g.params,built.gpuParams);
    g.enableSleeping(built.solver,islands?{timeThreshold:1000}:{islands:false,timeThreshold:1000});
    if(g.sleeping.islands!==islands)throw Error('Automatic large-world sleep selection failed');
    const query=device.createQuerySet({type:'timestamp',count:2});
    const resolve=device.createBuffer({size:16,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC});
    const read=device.createBuffer({size:16,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    const pre=g.encodeStepPrelude.bind(g),post=g.encodeStepPostlude.bind(g);
    let measuring=false;
    g.encodeStepPrelude=e=>{if(measuring)e.beginComputePass({timestampWrites:{querySet:query,beginningOfPassWriteIndex:0}}).end();pre(e);};
    g.encodeStepPostlude=e=>{post(e);if(measuring){e.beginComputePass({timestampWrites:{querySet:query,endOfPassWriteIndex:1}}).end();e.resolveQuerySet(query,0,2,resolve,0);e.copyBufferToBuffer(resolve,0,read,0,16);}};
    const timed=async()=>{measuring=true;g.step();await read.mapAsync(GPUMapMode.READ);const t=new BigUint64Array(read.getMappedRange());const ms=Number(t[1]-t[0])/1e6;read.unmap();measuring=false;return ms;};
    worlds.push({islands,g,query,resolve,read,timed,awake:[],settled:[],snapshots:[]});
   }
   for(let step=0;step<${steps};step++){
    for(const w of step%2?worlds:[...worlds].reverse()){
     if(step===30)w.g.sleeping.delay=.1;
     if((step>=10&&step<30)||step>=${steps - 40}){
      const ms=await w.timed();(step<30?w.awake:w.settled).push(ms);
     }else w.g.step();
     if(step%20===19){
      await device.queue.onSubmittedWorkDone();const c=await w.g.readCounters();
      if(c.overflow||c.clashes)throw Error(JSON.stringify({step,islands:w.islands,c}));
      w.g.adapt(c);
      if(step%60===59)w.snapshots.push({step,counters:c,sleep:await w.g.readSleepStats()});
     }
    }
   }
   const out=[];
   for(const w of worlds){
    const p=await w.g.readBodies();if(!p.every(Number.isFinite))throw Error('Nonfinite pose');
    let belowFloor=0,quatError=0;
    for(let i=0;i<w.g.bodyCount;i++){if(p[i*40+2]<-20)belowFloor++;quatError=Math.max(quatError,Math.abs(Math.hypot(...p.subarray(i*40+4,i*40+8))-1));}
    const state=new Uint32Array(await m.readBuffer(device,w.g.sleeping.state));
    const roots=new Set();if(w.islands)for(let i=0;i<w.g.bodyCount;i++){let r=i,n=0;while(state[r*8+5]!==r && n++<w.g.bodyCount)r=state[r*8+5];roots.add(r);}
    out.push({islands:w.islands,awake:summarize(w.awake),settled:summarize(w.settled),sleep:await w.g.readSleepStats(),snapshots:w.snapshots,belowFloor,quatError,roots:roots.size});
   }
   return {repeat:${repeat},scene:'paper-walls-510k-4',steps:${steps},objects:505923,adapter:{vendor:adapter.info.vendor,description:adapter.info.description},results:out,errors};
  }finally{for(const w of worlds){w.g.destroy();w.query.destroy();w.resolve.destroy();w.read.destroy();}device.destroy();}
 })()`);
    results.push(result);
    await writeReport("test-results/connected-sleep-performance.json", {
      date: new Date().toISOString(),
      method:
        "Two independent 505,923-object worlds alternate execution order every fixed step. Four iterations at 60 Hz. First 30 steps keep every body awake, then both policies use identical speed 0.03 and delay 0.1 sleep thresholds. GPU timestamps include collision detection, scheduling, movement and all sleep checks. No rendering. Every 20 steps check overflow and color conflicts; every final pose must be finite with valid rotations and no body below the solid floor. Sleeping deliberately changes which resting bodies participate; trajectories are not expected to be bit identical during impacts.",
      results,
      ...(await gpuBenchmarkHardware(result.adapter)),
    });
    console.log(JSON.stringify(result));
    if (
      result.errors.length ||
      b.errors.length ||
      result.results.some((w) => w.belowFloor || w.quatError > 2e-4)
    )
      throw Error(JSON.stringify({ result, browser: b.errors }));
  }
} finally {
  await b.close();
}
