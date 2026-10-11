import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";
import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["demo/shared/runtime/simulationSession.js"],
  outfile: ".temp/naval-profile.js",
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
});
const b = await browserCheck(),
  results = [],
  playback = [];
try {
  await b.navigate("tests/workers.html?scene=2d-stack&backend=cpu");
  for (let i = 0; i < 500; i++) {
    if (await b.evaluate("globalThis.__WORKER_BENCH__?.ready")) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  await b.evaluate("__WORKER_BENCH__.client.destroy()");
  for (const broadphase of ["grid", "hploc"]) {
    const result = await b.evaluate(`(async()=>{
      const {createSimulationSession}=await import('/.temp/naval-profile.js');
      const canvas=document.getElementById('canvas').cloneNode(false);document.getElementById('canvas').replaceWith(canvas);
      const s=await createSimulationSession(canvas,{scene:'naval',backend:'gpu',renderer:'webgpu',broadphase:'${broadphase}',enhanced:true});
      try {
        s.water.auto=false;
        const stages=[], walls=[], submit=[], water=[], draw=[];
        let worst={overflow:0,clashes:0};
        for(let i=0;i<720;i++) {
          const start=performance.now();
          if(i>=600)s.gpu.profileNextStep(p=>stages.push(p));
          s.gpu.step();const submitted=performance.now()-start;s.draw();await s.device.queue.onSubmittedWorkDone();
          const completed=performance.now()-start;
          await Promise.all([s.water.timer.settled(),s.renderer.timer.settled()]);
          if(i>=600){walls.push(completed);submit.push(submitted);water.push(s.water.timer.latestMs);draw.push(s.renderer.timer.latestMs);}
          if(i<20||i%60===59){const c=await s.gpu.readCounters();worst.overflow|=c.overflow;worst.clashes=Math.max(worst.clashes,c.clashes);}
        }
        const poses=await s.gpu.readBodies(),counters=await s.gpu.readCounters();
        const ships=s.built.ships.map(ship=>{
          const i=s.gpu.gpuIndex(s.built.world.bodies.indexOf(ship.root)),q=Array.from(poses.slice(i*40+4,i*40+8));
          let mass=0,cm=0,volume=0;for(const p of ship.pieces){mass+=p.body.mass;cm+=p.body.mass*(p.body.positionLin[2]-ship.root.positionLin[2]);volume+=p.volume;}
          return {tiltDegrees:Math.acos(Math.max(-1,Math.min(1,1-2*(q[0]*q[0]+q[1]*q[1]))))*180/Math.PI,position:Array.from(poses.slice(i*40,i*40+3)),mass,centerOfMassHeight:cm/mass,solidVolume:volume};
        });
        const stat=xs=>{xs.sort((a,b)=>a-b);return {median:xs[Math.floor(xs.length/2)],p95:xs[Math.floor(xs.length*.95)],samples:xs.length};};
        return {broadphase:'${broadphase}',adapter:s.adapter,bodies:s.gpu.bodyCount,timeStep:s.gpu.params.dt,iterations:s.gpu.params.iterations,colorCap:s.gpu.colorCap,counters,worst,ships,stages:Object.fromEntries(['total','collision','adjacency','coloring','solve'].map(k=>[k,stat(stages.map(p=>p[k]))])),submitDrawAndWaitMs:stat(walls),stepCpuSubmitMs:stat(submit),waterGpuMs:stat(water),drawGpuMs:stat(draw),waterMs:s.water.timer.latestMs,drawMs:s.renderer.timer.latestMs,errors:s.errors,finite:Array.from(poses).every(Number.isFinite)};
      } finally {s.destroy();}
    })()`);
    results.push(result);
    console.log(JSON.stringify(result));
    assert.deepEqual(result.errors, []);
    assert.ok(result.finite);
    assert.ok(!result.worst.overflow && !result.worst.clashes);
  }
  assert.deepEqual(b.errors, []);
  for (const scope of ["main", "worker", "worker-sab"]) {
    await b.navigate(`?demo=naval&scope=${scope}&paused=1`);
    let ready = false;
    for (let i = 0; i < 600; i++) {
      if (await b.evaluate("globalThis.__AVBD_NAVAL__?.diagnostics.ready")) {
        ready = true;
        break;
      }
      if (b.errors.length) throw Error(b.errors.join("\n"));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.ok(ready, `Naval ${scope} playback must initialize`);
    await b.evaluate("__AVBD_NAVAL__.setAuto(false);__AVBD_NAVAL__.step(120)");
    const before = await b.evaluate("__AVBD_NAVAL__.snapshot()"),
      start = performance.now();
    await b.evaluate("__AVBD_NAVAL__.pause(false)");
    await new Promise((resolve) => setTimeout(resolve, 4000));
    const displayedFrameRate = await b.evaluate(
      "document.querySelector('#naval-performance dd')?.textContent",
    );
    await b.evaluate("__AVBD_NAVAL__.pause(true)");
    const elapsed = (performance.now() - start) / 1000,
      after = await b.evaluate("__AVBD_NAVAL__.snapshot()");
    const row = {
      scope,
      elapsedSeconds: elapsed,
      simulationStepsPerSecond: (after.tick - before.tick) / elapsed,
      displayedFrameRate,
      counters: after.counters,
      errors: after.errors,
    };
    assert.deepEqual(row.errors, []);
    assert.ok(
      row.simulationStepsPerSecond > 0 &&
        !row.counters.overflow &&
        !row.counters.clashes,
    );
    playback.push(row);
    console.log(JSON.stringify(row));
    await b.evaluate("__AVBD_NAVAL__.dispose()");
  }
  assert.deepEqual(b.errors, []);
  await writeFile(
    "test-results/naval-performance.json",
    JSON.stringify(
      {
        passed: true,
        date: new Date().toISOString(),
        method:
          "600 warmup steps, 120 sampled steps; automatic cannon fire disabled; same intact ships, cloth, waves and enhanced rendering. Stage times use GPU timestamps. Submission/draw/wait time includes browser scheduling and is not a frame-rate measurement.",
        results,
        playback,
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
