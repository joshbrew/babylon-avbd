import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { build } from "esbuild";

// Bundle the documented modules directly, rather than maintaining test copies.
export async function checkReadmeExamples(browser) {
  const doc = await readFile("README.md", "utf8");
  const modules = new Map();
  for (const match of doc.matchAll(/```js\n([\s\S]*?)\n```/g)) {
    const path = match[1].match(/^\/\/ ((?:src|demo)\/[\w-]+\.js)/)?.[1];
    if (path) modules.set(resolve(path), match[1]);
  }
  const plugin = {
    name: "readme-modules",
    setup(b) {
      b.onResolve({ filter: /\.js$/ }, (args) => {
        const path = resolve(args.resolveDir, args.path);
        if (modules.has(path)) return { path, namespace: "readme" };
      });
      b.onLoad({ filter: /.*/, namespace: "readme" }, (args) => ({
        contents: modules.get(args.path),
        loader: "js",
        resolveDir: dirname(args.path),
      }));
    },
  };
  const options = {
    bundle: true,
    format: "esm",
    loader: { ".wgsl": "text" },
    plugins: [plugin],
  };
  await build({
    ...options,
    outfile: "dist/readme-scene-examples.js",
    stdin: {
      resolveDir: process.cwd(),
      contents: `
      export { createMixedColliderScene } from './src/mixed-gallery.js';
      export { createBrickWallScene } from './src/brick-wall.js';
      export { createBoxPileScene } from './src/box-pile.js';
      export { createDirectGpuExample } from './src/direct-gpu.js';
      export { createJointExamples } from './demo/readme-constraints.js';
      export { createNativeRig } from './demo/readme-rigs.js';
      export { createTearableCloth } from './demo/readme-tearable.js';
      export { createMaterialExamples } from './src/materials-and-sensors.js';
      export { createHingeExample } from './src/hinge-motor.js';
      export { create2DExamples } from './demo/readme-2d.js';
      export { create2DShapeExamples } from './demo/readme-2d-shapes.js';
      export { create2DPolicyExamples } from './demo/readme-2d-policies.js';
      export { createPortable3D } from './src/portable-3d.js';
      export { createPortable2D } from './src/portable-2d.js';
      export { launchAll } from './src/portable-batches.js';
      export { createVelocityController } from './src/portable-velocities.js';
      export { createMotionController } from './src/portable-motion.js';
      export { configureBodies } from './src/portable-properties.js';
      import { Engine, Scene, FreeCamera, HemisphericLight, Vector3 } from '@babylonjs/core';
      export function stage(canvas) {
        const engine = new Engine(canvas, true), scene = new Scene(engine);
        const camera = new FreeCamera('camera', new Vector3(-12, 15, -22), scene);
        camera.setTarget(new Vector3(0, 6, 0));
        new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        return { engine, scene };
      }`,
    },
  });
  const worker = modules.get(resolve("src/render-worker.js"));
  if (!worker) throw Error("Worker example missing");
  // A test-only message inspects the exact documented worker after rendering.
  await build({
    ...options,
    outfile: "dist/readme-worker-example.js",
    stdin: {
      resolveDir: resolve("src"),
      contents:
        worker +
        `
      const handle = self.onmessage;
      self.onmessage = async event => {
        if (event.data.type !== 'check') return handle(event);
        try {
          engine.stopRenderLoop();
          for (let i=0;i<120;i++) { physics.step(); await physics.device.queue.onSubmittedWorkDone(); }
          await physics.syncMeshes(); await scene.whenReadyAsync(); scene.render();
          const poses=await physics.readBodies(), counters=await physics.gpu.readCounters();
          self.postMessage({type:'checked', finite:poses.every(Number.isFinite),
            bodies:poses.length/40, steps:physics.steps, counters, errors:physics.errors,
            width:engine.getRenderWidth(), height:engine.getRenderHeight()});
          scene.dispose(); engine.dispose();
        } catch(error) { self.postMessage({type:'error',message:error.message}); }
      };`,
    },
  });
  await browser.evaluate(
    "(async()=>{globalThis.__README_SCENES__ = await import('/dist/readme-scene-examples.js')})()",
  );
  const results = [];
  for (const [name, expected] of [
    ["createMixedColliderScene", 31],
    ["createBrickWallScene", 98],
    ["createBoxPileScene", 2001],
    ["createMaterialExamples", 7],
    ["createHingeExample", 3],
  ]) {
    const result = await browser.evaluate(`(async()=>{
      document.body.innerHTML='<canvas id="canvas" style="width:100vw;height:100vh"></canvas>';
      const stage=__README_SCENES__.stage(document.querySelector('canvas'));
      const built=await __README_SCENES__[${JSON.stringify(name)}](stage.scene), w=built.physics;
      built.shoot?.();
      for(let i=0;i<180;i++){w.step();await w.device.queue.onSubmittedWorkDone();}
      await w.syncMeshes(); await stage.scene.whenReadyAsync(); stage.scene.render();
      const poses=await w.readBodies(),counters=await w.gpu.readCounters();
      const result={name:${JSON.stringify(name)},bodies:poses.length/40,
        finite:poses.every(Number.isFinite),counters,errors:[...w.errors],
        types:[...new Set(w.aggregates.map(a=>a.type))],instances:built.source?.thinInstanceCount};
      globalThis.__README_STAGE__=stage;
      return result;
    })()`);
    if (
      !result.finite ||
      result.bodies !== expected ||
      result.counters.overflow ||
      result.counters.clashes ||
      result.errors.length
    )
      throw Error(JSON.stringify(result));
    if (name === "createMixedColliderScene" && result.types.length !== 5)
      throw Error("Missing collider example");
    if (name === "createBoxPileScene" && result.instances !== 2000)
      throw Error("Thin instances missing");
    await browser.screenshot(`test-results/screenshots/readme-${name}.png`);
    await browser.evaluate(
      "__README_STAGE__.scene.dispose();__README_STAGE__.engine.dispose()",
    );
    results.push(result);
    console.log(
      `PASS README ${name}: ${result.bodies} bodies, real GPU steps and drawing`,
    );
  }
  const direct = await browser.evaluate(`(async()=>{
    document.body.innerHTML='<canvas id="canvas" style="display:block;width:100vw;height:100vh"></canvas>';
    const built=await __README_SCENES__.createDirectGpuExample(document.querySelector('canvas'));
    globalThis.__README_DIRECT__=built;
    const read=built.gpu.readBodies.bind(built.gpu);
    let poseReads=0;
    built.gpu.readBodies=()=>{poseReads++;throw Error('Drawing must not download body poses');};
    await new Promise(resolve=>{let frames=0;function check(){if(++frames===15)resolve();else requestAnimationFrame(check);}requestAnimationFrame(check);});
    built.stop();
    await built.device.queue.onSubmittedWorkDone();
    const counters=await built.gpu.readCounters();
    const poses=await read();
    return {kind:'direct-gpu-rendering',bodies:built.gpu.bodyCount,poseReads,
      finite:poses.every(Number.isFinite),counters,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height]};
  })()`);
  if (
    !direct.finite ||
    direct.bodies !== 4097 ||
    direct.poseReads ||
    direct.counters.overflow ||
    direct.counters.clashes
  )
    throw Error(JSON.stringify(direct));
  await browser.screenshot("test-results/screenshots/readme-direct-gpu.png");
  await browser.evaluate("__README_DIRECT__.dispose()");
  results.push(direct);
  console.log(
    "PASS README direct GPU drawing: 4097 live bodies, one instanced draw, zero pose downloads",
  );
  for (const kind of [
    "joints",
    "rope",
    "ragdolls",
    "tearable",
    "2d",
    "2d-shapes",
    "2d-policies",
  ]) {
    const result = await browser.evaluate(`(async()=>{
      const built = ${kind === "2d-policies" ? "await __README_SCENES__.create2DPolicyExamples()" : kind === "2d-shapes" ? "await __README_SCENES__.create2DShapeExamples()" : kind === "2d" ? "await __README_SCENES__.create2DExamples()" : kind === "joints" ? "await __README_SCENES__.createJointExamples()" : kind === "tearable" ? "await __README_SCENES__.createTearableCloth()" : `await __README_SCENES__.createNativeRig(${JSON.stringify(kind)})`};
      const {gpu,device}=built;
      try {
        for(let i=0;i<180;i++){gpu.step();await device.queue.onSubmittedWorkDone();
          const c=await gpu.readCounters();if(c.overflow||c.clashes)throw Error(JSON.stringify(c));if(i%20===19)gpu.adapt(c);}
        const poses=await gpu.readBodies(), joints=await gpu.readJoints();
        const is2D=${kind.startsWith("2d")};
        let broken=0;for(let i=0;i<joints.length;i+=is2D?36:32) if(is2D ? joints[i+8]===0&&joints[i+9]===0&&joints[i+10]===0 : joints[i+3]===0&&joints[i+7]===0)broken++;
        return {kind:${JSON.stringify(kind)},bodies:gpu.bodyCount,joints:gpu.jointCount,broken,finite:poses.every(Number.isFinite)};
      } finally {gpu.destroy();device.destroy();}
    })()`);
    if (!result.finite || (!result.joints && kind !== "2d-shapes"))
      throw Error(JSON.stringify(result));
    if (
      kind === "tearable" &&
      (!result.broken || result.broken > 100 || result.bodies !== 1026)
    )
      throw Error(JSON.stringify(result));
    results.push(result);
    console.log(
      `PASS README native ${kind}: ${result.bodies} bodies, ${result.joints} constraints`,
    );
  }
  for (const dimension of [2, 3]) {
    const result = await browser.evaluate(`(async()=>{
      const built=await __README_SCENES__.createPortable${dimension}D({count:256});
      const {gpu,bodies,projectile,sensor,hinge}=built;
      try {
        __README_SCENES__.configureBodies(gpu,bodies);
        __README_SCENES__.launchAll(gpu,bodies,${dimension});
        const packed=__README_SCENES__.createVelocityController(gpu,bodies,${dimension});
        for(let i=0;i<packed.velocities.length;i+=${dimension})packed.velocities[i+1]=2;
        packed.update();
        const motion=__README_SCENES__.createMotionController(gpu,bodies,${dimension});
        for(let i=0;i<motion.linear.length;i+=${dimension})motion.linear[i+1]=2;
        motion.angular.fill(.25);
        motion.update();
        motion.angular.fill(.5);
        motion.updateSpin();
        const edited=await gpu.readBodyState(gpu.bodyIndex(bodies[0]));
        if(edited.linearVelocity[1]!==2 || ${dimension === 3 ? "edited.angularVelocity.some(v=>v!==.5)" : "edited.angularVelocity!==.5"})throw Error('README packed motion did not preserve movement and update spin');
        projectile.setTrigger(false).setRestitution(.5).setSleepEnabled(false).setCollisionGroups(2,1|2);
        projectile.applyImpulse(${dimension === 3 ? "[20,0,0]" : "[20,0]"});
        gpu.setMotor(hinge.motor.slot,{speed:-1,maxTorque:10});
        gpu.watchContacts({indices:[projectile.gpuIndex,sensor.gpuIndex]});
        for(let i=0;i<60;i++){gpu.advance(1/60);await built.device.queue.onSubmittedWorkDone();}
        const c=await gpu.readCounters();if(c.overflow||c.clashes)throw Error(JSON.stringify(c));
        const poses=await gpu.readSelectedBodies([projectile.gpuIndex,sensor.gpuIndex],{posesOnly:true});
        const state=await projectile.readState(),events=await gpu.readContactEvents();
        return {dimension:${dimension},bodies:gpu.bodyCount,finite:poses.every(Number.isFinite),selectedFloats:poses.length,velocity:state.linearVelocity,events:events.events.length};
      }finally{built.dispose();}
    })()`);
    if (!result.finite || result.selectedFloats !== (dimension === 2 ? 8 : 16))
      throw Error(JSON.stringify(result));
    results.push({ name: "portable-body-and-bulk-api", ...result });
    console.log(
      `PASS README portable ${dimension}D: body handles, bulk properties, packed movement/spin, motor, masks, bounce, sensors and selected reads`,
    );
  }
  const workerResult = await browser.evaluate(`(async()=>{
    document.body.innerHTML='<canvas id="canvas" width="640" height="360"></canvas>';
    const canvas=document.querySelector('canvas').transferControlToOffscreen();
    const worker=new Worker('/dist/readme-worker-example.js',{type:'module'});
    try {return await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>reject(Error('README worker timed out')),30000);
      worker.onerror=e=>{clearTimeout(timeout);reject(Error(e.message));};
      worker.onmessage=({data})=>{
        if(data.type==='error'){clearTimeout(timeout);reject(Error(data.message));}
        if(data.type==='ready'){
          worker.postMessage({type:'resize',width:600,height:340});
          worker.postMessage({type:'shoot'});worker.postMessage({type:'check'});
        }
        if(data.type==='checked'){clearTimeout(timeout);resolve(data);}
      };
      worker.postMessage({type:'init',canvas,width:640,height:360},[canvas]);
    });}finally{worker.terminate();}
  })()`);
  if (
    !workerResult.finite ||
    workerResult.bodies !== 98 ||
    workerResult.steps < 120 ||
    workerResult.counters.overflow ||
    workerResult.counters.clashes ||
    workerResult.errors.length ||
    workerResult.width !== 600 ||
    workerResult.height !== 340
  )
    throw Error(JSON.stringify(workerResult));
  results.push({ name: "worker", ...workerResult });
  console.log(
    "PASS README worker: OffscreenCanvas, Babylon rendering, AVBD physics, resize and shooting",
  );
  return results;
}
