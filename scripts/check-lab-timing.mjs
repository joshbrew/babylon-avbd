import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
await mkdir(".temp", { recursive: true });
await build({
  stdin: {
    resolveDir: process.cwd(),
    contents:
      "export {SimulationRuntime} from './demo/shared/runtime/simulationRuntime.js';",
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/clock-check.js",
});
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  const clocks = await b.evaluate(`(async()=>{
    const {SimulationRuntime}=await import('/.temp/clock-check.js'),rows=[];
    for(const fps of [30,60,90,144,240])for(const hz of [60,120]){
      const r=new SimulationRuntime({revision:0},{paused:false});let steps=0;
      r.session={errors:[],gpu:{params:{dt:1/hz}},step(){steps++;},draw(){},destroy(){}};
      r.drawRevision=0;
      r.completed=()=>({catch:()=>({finally:f=>f()})});r.statusAt=Infinity;r.last=0;
      let zeroStepFrames=0,maxSteps=0;
      for(let i=1;i<=fps*2;i++){const before=steps;r.frame(i*1000/fps);cancelAnimationFrame(r.raf);maxSteps=Math.max(maxSteps,steps-before);if(steps===before)zeroStepFrames++;}
      rows.push({fps,hz,steps,zeroStepFrames,maxSteps,remainder:r.accumulator});r.destroy();
    }
    for(const cost of [2,8,20,90]) {
      const r=new SimulationRuntime({revision:0},{paused:false});let steps=0;
      r.session={errors:[],gpu:{params:{dt:1/120}},step(){steps++;},draw(){},destroy(){}};
      r.drawRevision=0;
      r.completed=()=>({catch:()=>({finally:f=>f()})});r.statusAt=Infinity;r.last=0;r.profile={total:cost};
      r.frame(50);cancelAnimationFrame(r.raf);
      rows.push({cost,steps,remainder:r.accumulator,overloaded:true});r.destroy();
    }
    const slow=new SimulationRuntime({revision:0},{paused:false});let steps=0;
    slow.session={errors:[],gpu:{params:{dt:1/120}},step(){steps++;},draw(){},destroy(){}};slow.drawRevision=0;slow.completed=()=>({catch:()=>({finally:f=>f()})});slow.statusAt=Infinity;slow.last=0;
    slow.frame(10000);rows.push({overloaded:true,steps,remainder:slow.accumulator});slow.destroy();return rows;
  })()`);
  for (const r of clocks) {
    if (r.overloaded) {
      assert.ok(r.steps <= 6);
      if (r.cost >= 20) {
        assert.equal(
          r.steps,
          1,
          "Expensive physics must not queue six catch-up steps before drawing",
        );
        assert.ok(
          r.remainder > 0,
          "Bounded catch-up time is retained for later frames",
        );
      }
      continue;
    }
    assert.equal(
      r.steps,
      r.hz * 2,
      `Real-time clock at ${r.fps} FPS / ${r.hz} Hz`,
    );
    assert.ok(r.maxSteps <= 6);
    if (r.fps > r.hz)
      assert.ok(
        r.zeroStepFrames > 0,
        "Physics must wait when it is ahead of elapsed time",
      );
  }
  await b.navigate(
    "?demo=canonical&scene=3d-marble-cascade&backend=gpu&paused=1&quality=benchmark",
  );
  for (
    let i = 0;
    i < 1200 &&
    !(await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready"));
    i++
  )
    await new Promise((r) => setTimeout(r, 30));
  assert.ok(await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready"));
  const live = await b.evaluate(`(async()=>{
    const lab=__AVBD_LAB__;lab.client.control('play','start');const before=await lab.client.getInfo(),start=performance.now();lab.pause(false);
    await new Promise(r=>setTimeout(r,4200));lab.pause(true);const after=await lab.client.getInfo(),wallSeconds=(performance.now()-start)/1000;
    const status=lab.status;
    return {worker:after.worker,hz:1/after.timeStep,steps:after.steps-before.steps,wallSeconds,rate:(after.steps-before.steps)*after.timeStep/wallSeconds,fps:status?.fps,physicsMs:status?.profile?.total,drawMs:status?.drawMs,errors:lab.diagnostics.errors};
  })()`);
  console.log(JSON.stringify({ clocks, live }));
  assert.deepEqual(live.errors, []);
  assert.ok(
    live.rate > 0.55 && live.rate < 1.1,
    "The Galton clock must catch up across frames without a fixed half-speed limit",
  );
  assert.deepEqual(b.errors, []);
  await b.evaluate("__AVBD_LAB__.dispose()");
  await writeAtomicFile(
    "test-results/lab-timing.json",
    JSON.stringify({ passed: true, clocks, live }, null, 2),
  );
} finally {
  await b.close();
}
