import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { build } from "esbuild";
await mkdir(".temp", { recursive: true });
await build({
  bundle: true,
  format: "esm",
  outfile: ".temp/terrain-babylon.js",
  stdin: {
    resolveDir: process.cwd(),
    contents: `
import '@babylonjs/core/Engines/engine.js';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
export function fixtures(mirrored=false){
 const engine=new NullEngine(),scene=new Scene(engine),parent=new TransformNode('terrain parent',scene);
 parent.position.set(.5,1.5,.5);
 if(mirrored)parent.scaling.x=-1;
 const ground=MeshBuilder.CreateGround('terrain',{width:4,height:4,subdivisions:2},scene);ground.position.y=.25;ground.parent=parent;
 const box=MeshBuilder.CreateSphere('body',{diameter:.5},scene);box.position.set(.5,2.6,.5);
 return {ground,box,dispose(){scene.dispose();engine.dispose();}};
}`,
  },
});
const b = await browserCheck(),
  results = [];
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await b.navigate("tests/workers.html?scene=3d-static-terrain");
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate("globalThis.__WORKER_BENCH__?.ready")) break;
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((r) => setTimeout(r, 50));
  }
  await b.evaluate(
    "__WORKER_BENCH__.client.control('pause',true);__WORKER_BENCH__.client.step(240)",
  );
  const shown = await b.evaluate("__WORKER_BENCH__.client.snapshot()");
  assert.ok(shown.poses.every(Number.isFinite));
  assert.deepEqual(shown.errors, []);
  assert.ok(!shown.counters.overflow && !shown.counters.clashes);
  await b.screenshot("test-results/screenshots/terrain.png");
  await b.evaluate("__WORKER_BENCH__.client.destroy()");
  for (const backend of ["webgpu", "cpu"])
    for (const broadphase of backend === "webgpu"
      ? ["grid", "hploc"]
      : ["auto"]) {
      const result = await b.evaluate(`(async()=>{
      const {AvbdScene3D,createSolverPipeline,cookStaticMesh,AvbdPhysics}=await import('/dist/avbd.js');
      const pipeline=await createSolverPipeline({backend:${JSON.stringify(backend)},validate3D:true});
      try{
        const scene=new AvbdScene3D({up:[0,1,0],timeStep:1/120,iterations:8});
        const floor=scene.addHeightfield({heights:new Float32Array(81),columns:9,rows:9,origin:[-4,0,-4],baseHeight:-1});
        const roof=scene.addStaticMesh({positions:[-2,3,-2,-2,3,2,2,3,2,2,3,-2,-2,0,-2,-2,0,2,2,0,2],indices:[0,1,2,0,2,3,4,5,1,4,1,0,5,6,2,5,2,1],thickness:.25});
        const ball=scene.addSphere(.35,{position:[0,1,0],friction:.5});
        const above=scene.addBox([.5,.5,.5],{position:[1,4,0],friction:.5});
        const solver=scene.createSolver(pipeline,{broadphase:${JSON.stringify(broadphase)}});
        for(let i=0;i<240;i++){solver.step();if(pipeline.device&&i%30===29)await pipeline.device.queue.onSubmittedWorkDone();}
        const ballState=await solver.body(ball).readState(),boxState=await solver.body(above).readState();
        const hit=await solver.raycast([0,2,0],[0,-1,0],{maxDistance:3,ignore:[solver.body(ball).gpuIndex,solver.body(above).gpuIndex]});
        const counts=await solver.readCounters();
        floor.dispose();for(let i=0;i<90;i++)solver.step();
        if(pipeline.device)await pipeline.device.queue.onSubmittedWorkDone();
        const released=await solver.body(ball).readState();
        let babylon;
        if(pipeline.device){
          const world=await AvbdPhysics.create({device:pipeline.device,capacity:200,syncMeshes:false,autoAttach:false});
          const terrain=world.addHeightfield({heights:new Float32Array(9),columns:3,rows:3});
          const cooked=cookStaticMesh({positions:[0,3,0,0,3,1,1,3,0]});
          world.addTerrain(cooked);
          const fixture=(await import('/.temp/terrain-babylon.js')).fixtures(${JSON.stringify(broadphase === "hploc")});
          const meshTerrain=world.addStaticMesh(fixture.ground,{thickness:.15});
          const aggregate=world.addAggregate(fixture.box,'sphere',{mass:1});
          for(let i=0;i<120;i++){world.step();if(i%30===29)await pipeline.device.queue.onSubmittedWorkDone();}
          const supported=await aggregate.body.readState();
          const ray=await world.raycast([.25,2,.25],[0,-1,0],{maxDistance:3});
          meshTerrain.dispose();meshTerrain.dispose();
          for(let i=0;i<120;i++){world.step();if(i%30===29)await pipeline.device.queue.onSubmittedWorkDone();}
          const dropped=await aggregate.body.readState();
          babylon={tiles:terrain.bodies.length,hit:!!ray,surface:ray?.point[1],supported:supported.position[1],dropped:dropped.position[1],errors:[...world.errors]};terrain.dispose();world.step();world.dispose();fixture.dispose();
        }
        return {backend:${JSON.stringify(backend)},broadphase:${JSON.stringify(broadphase)},ball:ballState,above:boxState,released,hit:hit?.point,counts,babylon,tiles:floor.bodies.length};
      }finally{pipeline.destroy();}
    })()`);
      console.log(JSON.stringify(result));
      assert.ok(
        result.ball.position[1] > 0.25 && result.ball.position[1] < 0.55,
        "Sphere must rest on the floor beneath the overhang",
      );
      assert.ok(
        result.above.position[1] > 3.15 && result.above.position[1] < 3.5,
        "Box must rest on the roof",
      );
      assert.ok(
        Math.abs(result.hit[1]) < 0.02,
        "Ray must hit the original terrain surface",
      );
      assert.ok(
        result.released.position[1] < -1,
        "Disposing terrain must release its supported body",
      );
      assert.ok(!result.counts.overflow && !result.counts.clashes);
      if (result.babylon) {
        assert.ok(result.babylon.hit);
        assert.ok(
          Math.abs(result.babylon.surface - 1.75) < 0.001,
          "Mesh backing must remain behind the visible terrain surface",
        );
        assert.ok(
          Math.abs(result.babylon.supported - 2) < 0.06,
          "Babylon terrain must include parent and mesh transforms",
        );
        assert.ok(
          Math.abs(result.babylon.dropped - 0.25) < 0.06,
          "Batched terrain removal must release a Babylon aggregate",
        );
        assert.deepEqual(result.babylon.errors, []);
      }
      results.push(result);
    }
  assert.deepEqual(b.errors, []);
  await writeFile(
    "test-results/terrain.json",
    JSON.stringify(
      { passed: true, results, screenshot: "screenshots/terrain.png" },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
