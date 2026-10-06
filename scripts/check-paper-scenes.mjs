import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";

const browser = await browserCheck(),
  results = [];
try {
  await browser.navigate(
    "?demo=canonical&scene=2d-empty&backend=ref&paused=1&quality=benchmark",
  );
  for (
    let i = 0;
    i < 600 &&
    !(await browser.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready"));
    i++
  )
    await new Promise((r) => setTimeout(r, 50));
  for (const scene of process.env.AVBD_MOTION_SCENES?.split(",") ?? [
    "paper-walls-510k-3",
    "paper-walls-510k-4",
    "paper-cloth-35k",
  ]) {
    if (process.env.AVBD_MOTION_BROADPHASE)
      await browser.evaluate(
        `document.querySelector('#lab-broadphase').value=${JSON.stringify(process.env.AVBD_MOTION_BROADPHASE)}`,
      );
    await browser.evaluate(`__AVBD_LAB__.select('${scene}','gpu')`);
    await browser.evaluate("__AVBD_LAB__.pause(true)");
    await browser.evaluate(`__AVBD_LAB__.snapshot().then(s=>{
      globalThis.paperInitial=new Float32Array(s.bodyCount*3);
      for(let i=0;i<s.bodyCount;i++) paperInitial.set(s.poses.slice(i*40,i*40+3),i*3);
    })`);
    const prefix = process.env.AVBD_MOTION_BROADPHASE
      ? `${scene}-${process.env.AVBD_MOTION_BROADPHASE}`
      : scene;
    await browser.screenshot(`test-results/screenshots/${prefix}-initial.png`);
    const checkpoints = [];
    for (let step = 1; step <= 360; step++) {
      await browser.evaluate("__AVBD_LAB__.step(1)");
      const counters = await browser.evaluate("__AVBD_LAB__.collect()");
      if (counters.overflow || counters.clashes)
        throw Error(JSON.stringify({ scene, step, counters }));
      if (step % 120) continue;
      const state = await browser.evaluate(`__AVBD_LAB__.snapshot().then(s=>{
        const p=s.poses, cloth=s.scene==='paper-cloth-35k';
        let minZ=Infinity,maxZ=-Infinity,points=0,pinError=0,pointRotation=0,sag=0,rotated=0,farCount=0,farMoved=0,farDropped=0,farTilted=0;
        for(let i=0;i<s.bodyCount;i++) {
          const o=i*40,x=p[o],y=p[o+1],z=p[o+2];
          const moved=Math.hypot(x-paperInitial[i*3],y-paperInitial[i*3+1],z-paperInitial[i*3+2]);
          const point=cloth && p[o+39]===1 && p[o+20]===0;
          if(point) {
            points++;sag=Math.max(sag,8-z);
            pointRotation=Math.max(pointRotation,Math.hypot(p[o+4],p[o+5],p[o+6]));
            if(p[o+19]===0) pinError=Math.max(pinError,moved);
          }
          if(p[o+19]>0) {
            minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
            if(Math.hypot(p[o+4],p[o+5],p[o+6])>.02) rotated++;
            if(!cloth && Math.abs(paperInitial[i*3])>90) {
              farCount++;if(moved>.15) farMoved++;
              if(z<paperInitial[i*3+2]-.5) farDropped++;
              if(Math.hypot(p[o+4],p[o+5],p[o+6])>Math.sin(Math.PI/36)) farTilted++;
            }
          }
        }
        return {steps:s.steps,bodies:s.bodyCount,broadphase:s.broadphase,bvh:s.bvh,finite:p.every(Number.isFinite),minZ,maxZ,points,pinError,pointRotation,sag,rotated,farCount,farMoved,farDropped,farTilted,stats:s.stats,errors:s.errors};
      })`);
      if (
        !state.finite ||
        state.errors.length ||
        state.minZ < 0 ||
        state.maxZ > 100 ||
        state.pinError > 1e-5 ||
        state.pointRotation > 1e-6 ||
        (scene.includes("cloth") &&
          (state.points !== 10000 || state.sag < 0.01))
      )
        throw Error(JSON.stringify({ scene, step, state }));
      // A half-metre drop loses a whole brick course; a ten-degree tilt is
      // visibly falling. Measure small settling separately from wall collapse.
      if (
        scene.startsWith("paper-walls-") &&
        (state.farDropped > state.farCount * 0.05 ||
          state.farTilted > state.farCount * 0.05)
      )
        throw Error(
          "Walls away from the ball paths lose support: " +
            JSON.stringify(state),
        );
      checkpoints.push(state);
      if (
        process.env.AVBD_MOTION_BROADPHASE === "hploc" &&
        state.broadphase !== "hploc"
      )
        throw Error("Requested tree was not used");
      await browser.screenshot(
        `test-results/screenshots/${prefix}-${step}.png`,
      );
    }
    results.push({ scene, passed: true, checkpoints });
    console.log("PASS " + JSON.stringify(results.at(-1)));
  }
  if (browser.errors.length) throw Error(browser.errors.join("\n"));
  await writeFile(
    process.env.AVBD_MOTION_BROADPHASE
      ? `test-results/hploc-motion-${process.env.AVBD_MOTION_BROADPHASE}.json`
      : process.env.AVBD_MOTION_SCENES
        ? "test-results/paper-motion-selected.json"
        : "test-results/paper-motion.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
} finally {
  await browser.close();
}
