import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";
import { browserCheck } from "./browser-check.mjs";

await mkdir(".temp", { recursive: true });
await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `export {SimulationRuntime} from './demo/shared/runtime/simulationRuntime.js';
      export {createSimulationClient} from './demo/shared/runtime/simulationClient.js';
      export {WorkerCanvas} from './src/utils/workerCanvas.js';`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/runtime-efficiency.js",
});
const b = await browserCheck(),
  results = [];
try {
  await b.navigate("test-results/solver-performance.html");
  const scheduling = await b.evaluate(`(async()=>{
    const {SimulationRuntime}=await import('/.temp/runtime-efficiency.js');
    const r=new SimulationRuntime({revision:0,dispatch(){}},{paused:false});
    let steps=0,draws=0;
    r.session={errors:[],gpu:{params:{dt:.01}},step(){steps++;},draw(){draws++;},destroy(){}};
    r.frame=r.frame.bind(r);r.completed=()=>Promise.resolve();r.last=0;r.statusAt=Infinity;r.inFlight=2;
    r.frame(20);const held=r.accumulator;
    r.inFlight=0;r.frame(40);const elapsed=steps*.01+r.accumulator;
    r.measuring=true;
    const rejected=await r.step(1).then(()=>false,e=>/already running/.test(e.message));
    let failures=0;r.notify=()=>failures++;r.measuring=false;r.fail(Error('test device failure'));r.fail(Error('duplicate failure'));
    r.frame(60);const stopped=draws===1&&failures===1;
    r.destroy();return {held,elapsed,steps,draws,rejected,stopped};
  })()`);
  assert.equal(scheduling.held, 0.02);
  assert.ok(
    Math.abs(scheduling.elapsed - 0.04) < 1e-9,
    "Busy frames must preserve bounded simulation time",
  );
  assert.ok(scheduling.rejected, "Concurrent measurements must reject");
  assert.ok(
    scheduling.stopped,
    "Failed devices must stop rather than repeatedly submit errors",
  );
  results.push({ scheduling });
  const adaptation = await b.evaluate(`(async()=>{
    const {SimulationRuntime}=await import('/.temp/runtime-efficiency.js');
    const result=[];
    for(const dimension of [2,3]){
      const r=new SimulationRuntime({revision:0,dispatch(){}},{paused:true});
      const expected={contacts:5,overflow:2,clashes:1};let adapted;
      r.session={dimension,cpu:false,errors:[],renderer:{timer:{latestMs:0}},readSleepStats:async()=>({sleeping:0}),gpu:{params:{dt:1/60},readCounters:async()=>expected,adapt(c){adapted=c;}},destroy(){}};
      await r.status();const startupPreserved=adapted===undefined;
      r.steps=1;await r.status();result.push({dimension,startupPreserved,adapted:adapted===expected});r.destroy();
    }
    return result;
  })()`);
  assert.ok(
    adaptation.every((r) => r.adapted && r.startupPreserved),
    "Both dimensions must adapt capacity and scheduling from status counters",
  );
  results.push({ adaptation });
  const disposal = await b.evaluate(`(async()=>{
    const {createSimulationClient}=await import('/.temp/runtime-efficiency.js');
    const originalWorker=globalThis.Worker,result=[];
    try {
      for(const acknowledge of [true,false]){
        let released=false,terminated=false,ordered=false;
        globalThis.Worker=class {
          postMessage(data){
            if(data.type==='init')queueMicrotask(()=>this.onmessage({data:{id:data.id,result:{}}}));
            if(data.type==='dispose'&&acknowledge)setTimeout(()=>{
              released=true;this.onmessage({data:{id:data.id}});
            },20);
          }
          terminate(){terminated=true;ordered=released;}
        };
        const canvas=document.createElement('canvas');document.body.append(canvas);
        try {
          const client=await createSimulationClient(canvas,{scope:'worker'});
          await client.destroy();result.push({acknowledge,released,terminated,ordered});
        } finally {canvas.remove();}
      }
      return result;
    } finally {globalThis.Worker=originalWorker;}
  })()`);
  assert.deepEqual(disposal, [
    { acknowledge: true, released: true, terminated: true, ordered: true },
    { acknowledge: false, released: false, terminated: true, ordered: false },
  ], "Worker cleanup completes before termination; an unresponsive worker still terminates");
  results.push({ disposal });
  for (const scene of [
    "3d-sphere-contacts",
    "3d-static-terrain",
    "3d-voronoi-demolition",
    "showcase-ragdolls-on-cloth-24k",
    "showcase-box-columns-100k",
  ]) {
    const result = await b.evaluate(`(async()=>{
      const {SimulationRuntime,WorkerCanvas}=await import('/.temp/runtime-efficiency.js');
      document.body.innerHTML='<canvas style="width:900px;height:600px"></canvas>';
      const canvas=document.querySelector('canvas'),surface=new WorkerCanvas(canvas,900,600),events=[];
      const r=new SimulationRuntime(surface,{scene:${JSON.stringify(scene)},backend:'gpu',renderer:'webgpu',paused:true,enhanced:false},event=>events.push(event));
      try {
        await r.init();await r.completed();
        const s=r.session,renderer=s.renderer;
        let draws=0;const draw=s.draw;s.draw=()=>{draws++;draw();};
        await new Promise(resolve=>setTimeout(resolve,160));const idleDraws=draws;
        r.input('wheel',{deltaY:40});await new Promise(resolve=>setTimeout(resolve,80));const afterInput=draws;
        surface.resize(880,590);await new Promise(resolve=>setTimeout(resolve,80));const afterResize=draws;
        const compactCount=renderer.boxCount,compact=renderer.boxIndices,batch=renderer.specialBatch;
        draw();await r.completed();const image=canvas.toDataURL();
        renderer.boxIndices=null;renderer.boxCount=s.gpu.bodyCount;renderer.specialBatch=null;
        draw();await r.completed();const identical=image===canvas.toDataURL();
        renderer.boxIndices=compact;renderer.boxCount=compactCount;renderer.specialBatch=batch;
        const times=[[],[]],submit=[[],[]];
        for(let i=0;i<30;i++)for(const mode of i%2?[1,0]:[0,1]){
          const full=mode===0;
          renderer.boxIndices=full?null:compact;renderer.boxCount=full?s.gpu.bodyCount:compactCount;renderer.specialBatch=full?null:batch;
          const samples=renderer.timer.samples,start=performance.now();draw();const cpu=performance.now()-start;await r.completed();
          await renderer.timer.settled();
          if(i>=10){submit[mode].push(cpu);if(renderer.timer.samples>samples)times[mode].push(renderer.timer.latestMs);}
        }
        const median=a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)]??null;
        const [full,compactTiming]=[0,1].map(i=>({gpuMs:median(times[i]),submitMs:median(submit[i])}));
        renderer.boxIndices=compact;renderer.boxCount=compactCount;renderer.specialBatch=batch;
        await r.step(2);const counters=await s.gpu.readCounters();
        return {scene:${JSON.stringify(scene)},bodies:s.gpu.bodyCount,boxInstances:compactCount,compact:!!compact,customMeshes:renderer.special.length,customMeshDraws:batch?1:renderer.special.length,idleDraws,afterInput,afterResize,identical,fullDrawMs:full.gpuMs,compactDrawMs:compactTiming.gpuMs,fullSubmitMs:full.submitMs,compactSubmitMs:compactTiming.submitMs,counters,errors:s.errors,events:events.filter(e=>e.type==='error')};
      }finally{r.destroy();}
    })()`);
    console.log(JSON.stringify(result));
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.events, []);
    assert.equal(
      result.idleDraws,
      0,
      "Paused scenes must not redraw unchanged frames",
    );
    assert.ok(
      result.afterInput > 0 && result.afterResize > result.afterInput,
      "Paused camera input and resize must redraw",
    );
    assert.equal(
      result.identical,
      true,
      "Compaction must preserve every rendered pixel",
    );
    assert.ok(!result.counters.overflow && !result.counters.clashes);
    if (scene.includes("100k"))
      assert.equal(
        result.compact,
        false,
        "Box-only stress scenes keep their original rendering path",
      );
    results.push(result);
  }
  const readback = await b.evaluate(`(async()=>{
    const {SimulationRuntime,WorkerCanvas}=await import('/.temp/runtime-efficiency.js');
    document.body.innerHTML='<canvas style="width:900px;height:600px"></canvas>';
    const surface=new WorkerCanvas(document.querySelector('canvas'),900,600);
    const r=new SimulationRuntime(surface,{scene:'naval',backend:'gpu',renderer:'webgpu',paused:true});
    try{
      await r.init();const w=r.session.water;w.auto=false;
      const a=w.readState(),b=w.readState(),shared=a===b;
      const first=await a,buffer=w.readback;
      await r.step(1);const next=await w.readState();
      const reused=w.readback===buffer;
      const measured=await r.benchmark({warmup:5,samples:10});
      return {shared,reused,firstTick:first.tick,nextTick:next.tick,stateLength:next.state.length,shotLength:next.shots.length,waterSamples:measured.waterMs?.samples,drawSamples:measured.drawMs?.samples,errors:r.session.errors};
    }finally{r.destroy();}
  })()`);
  assert.ok(
    readback.shared && readback.reused,
    "Status requests must share and reuse staging storage",
  );
  assert.equal(readback.nextTick, readback.firstTick + 1);
  assert.ok(readback.waterSamples > 0 && readback.waterSamples <= 10);
  assert.ok(readback.drawSamples > 0 && readback.drawSamples <= 10);
  assert.deepEqual(readback.errors, []);
  results.push({ readback });
  assert.deepEqual(b.errors, []);
  await writeFile(
    "test-results/runtime-efficiency.json",
    JSON.stringify(
      {
        passed: true,
        date: new Date().toISOString(),
        method:
          "Rendering only: 10 warmup draws and 20 alternating samples per path; same unmoved scene and pixel-identical images. Draw times use GPU timestamps; submission times measure CPU encoding. Paused input, sizing, backpressure and readback lifecycle checks.",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
