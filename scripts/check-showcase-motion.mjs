import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const b = await browserCheck(),
  results = [];
try {
  await b.navigate("?scene=2d-empty&backend=gpu&paused=1");
  for (let i = 0; i < 400; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  await b.evaluate("__AVBD_LAB__.pause(true)");
  for (const id of [
    "showcase-brick-ring-28k",
    "showcase-ragdolls-on-cloth-24k",
  ]) {
    await b.evaluate(`__AVBD_LAB__.select(${JSON.stringify(id)},'gpu')`);
    await b.evaluate(
      `(async()=>{globalThis.initialShowcase=(await __AVBD_LAB__.snapshot()).poses;})()`,
    );
    const initial = await b.evaluate("__AVBD_LAB__.snapshot()");
    const durationSteps = Math.round(6 / initial.timeStep);
    for (
      let completed = initial.steps;
      completed < durationSteps;
      completed += 20
    )
      await b.evaluate(
        `__AVBD_LAB__.step(${Math.min(20, durationSteps - completed)})`,
      );
    const result = await b.evaluate(
      `(async()=>{await __AVBD_LAB__.collect();const s=await __AVBD_LAB__.snapshot();let moved=0,rotated=0,maxQuatError=0,minZ=Infinity,maxZ=-Infinity,belowFloor=0,escapedFloor=0;const floor=initialShowcase.findIndex((v,i)=>i%40===19&&v===0&&initialShowcase[i-3]>100);const floorOffset=floor-19;for(let o=0;o<s.poses.length;o+=40){const p=s.poses;if(p[o+19]<=0)continue;if(Math.hypot(...p.slice(o,o+3).map((v,k)=>v-initialShowcase[o+k]))>.1)moved++;if(Math.hypot(...p.slice(o+4,o+8).map((v,k)=>v-initialShowcase[o+4+k]))>.05)rotated++;maxQuatError=Math.max(maxQuatError,Math.abs(Math.hypot(...p.slice(o+4,o+8))-1));minZ=Math.min(minZ,p[o+2]);maxZ=Math.max(maxZ,p[o+2]);if(p[o+2]<-1){const inside=Math.abs(p[o]-initialShowcase[floorOffset])<initialShowcase[floorOffset+16]/2-p[o+23]&&Math.abs(p[o+1]-initialShowcase[floorOffset+1])<initialShowcase[floorOffset+17]/2-p[o+23];if(inside)belowFloor++;else escapedFloor++;}}return {scene:s.scene,steps:s.steps,bodies:s.bodyCount,finite:s.poses.every(Number.isFinite),moved,rotated,maxQuatError,minZ,maxZ,belowFloor,escapedFloor,stats:s.stats,errors:s.errors};})()`,
    );
    if (
      !result.finite ||
      result.errors.length ||
      result.stats.overflow ||
      result.stats.clashes ||
      result.maxQuatError > 1e-4 ||
      result.moved < 100 ||
      result.rotated < 100 ||
      result.belowFloor
    )
      throw Error(JSON.stringify(result));
    await b.screenshot(`test-results/screenshots/${id}-six-seconds.png`);
    results.push({ ...result, passed: true });
    console.log("PASS " + JSON.stringify(result));
  }
  await writeFile(
    "test-results/showcase-motion.json",
    JSON.stringify({ results, errors: b.errors }, null, 2),
  );
  if (b.errors.length) throw Error(JSON.stringify(b.errors));
} finally {
  await b.close();
}
