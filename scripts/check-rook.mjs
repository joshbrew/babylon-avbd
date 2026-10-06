import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const b = await browserCheck();
try {
  await b.navigate(
    "?demo=canonical&scene=3d-100k-rook-impact&backend=gpu&paused=1&quality=benchmark",
  );
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  await b.evaluate("__AVBD_LAB__.pause(true)");
  const baseline = await b.evaluate(
    `(async()=>{const s=await __AVBD_LAB__.snapshot();globalThis.rookInitial=s.poses;return {steps:s.steps,count:s.bodyCount};})()`,
  );
  const checkpoints = [];
  for (const target of [60, 180, 360]) {
    await b.evaluate(
      `(async()=>{for(let i=0;i<${target - baseline.steps - (checkpoints.at(-1)?.advanced ?? 0)};i++){await __AVBD_LAB__.step(1);}})()`,
    );
    const s = await b.evaluate(
      `(async()=>{await __AVBD_LAB__.collect();const s=await __AVBD_LAB__.snapshot();const p=s.poses;let moved=0,farMoved=0,farCount=0,edgeMoved=0,edgeCount=0,maxFarMove=0,rotated=0,finite=true,maxSpeed=0,minZ=Infinity,maxZ=-Infinity,maxQuatError=0,halfWidth=0;for(let i=0;i<p.length;i+=40)if(p[i+23]<5&&p[i+39]===0)halfWidth=Math.max(halfWidth,Math.abs(rookInitial[i]));for(let i=0;i<p.length;i+=40){if(p[i+23]>=5||p[i+39]!==0)continue;const d=Math.hypot(p[i]-rookInitial[i],p[i+1]-rookInitial[i+1],p[i+2]-rookInitial[i+2]);if(d>.15)moved++;if(Math.abs(rookInitial[i])>halfWidth*.5){farCount++;maxFarMove=Math.max(maxFarMove,d);if(d>.15)farMoved++;}if(Math.abs(rookInitial[i])>halfWidth*.75){edgeCount++;if(d>.15)edgeMoved++;}if(Math.hypot(...p.slice(i+4,i+7))>.1)rotated++;maxQuatError=Math.max(maxQuatError,Math.abs(Math.hypot(...p.slice(i+4,i+8))-1));maxSpeed=Math.max(maxSpeed,Math.hypot(...p.slice(i+32,i+35)));minZ=Math.min(minZ,p[i+2]);maxZ=Math.max(maxZ,p[i+2]);}finite=p.every(Number.isFinite);return {steps:s.steps,moved,farMoved,farCount,edgeMoved,edgeCount,maxFarMove,rotated,finite,maxSpeed,minZ,maxZ,maxQuatError,projectile:s.projectile,stats:s.stats,gpuProfile:s.gpuProfile,physicsMs:s.physicsMs,sleepMs:s.sleepMs,errors:s.errors};})()`,
    );
    s.advanced = target - baseline.steps;
    checkpoints.push(s);
    await b.screenshot(`test-results/screenshots/rook-${target}.png`);
    console.log(JSON.stringify(s));
  }
  await b.evaluate("__AVBD_LAB__.pause(false)");
  const start = await b.evaluate("__AVBD_LAB__.diagnostics.frames");
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate(`__AVBD_LAB__.diagnostics.frames > ${start + 120}`))
      break;
    await new Promise((r) => setTimeout(r, 50));
  }
  await b.evaluate("__AVBD_LAB__.pause(true)");
  const timing = await b.evaluate(
    `(async()=>{const s=await __AVBD_LAB__.snapshot();const summary={};for(const key of ['frameMs','solveMs','renderMs']){const v=s.samples.slice(-100).map(x=>x[key]).sort((a,b)=>a-b);summary[key]={mean:v.reduce((a,b)=>a+b,0)/v.length,median:v[Math.floor(v.length*.5)],p95:v[Math.floor(v.length*.95)]};}return {summary,stats:s.stats,profile:s.gpuProfile,adapter:__AVBD_LAB__.diagnostics.adapter};})()`,
  );
  await writeFile(
    "test-results/rook.json",
    JSON.stringify(
      { baseline, checkpoints, timing, errors: b.errors },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(timing));
  if (
    checkpoints.at(-1).projectile[1] <= 4.75 ||
    checkpoints.at(-1).moved < 1000 ||
    checkpoints.at(-1).rotated < 1000 ||
    checkpoints.some(
      (s) =>
        !s.finite ||
        s.errors.length ||
        // Detect widespread edge motion while retaining every measured outlier
        // in the report. Freely simulated debris can reach a few edge bricks.
        s.edgeMoved > s.edgeCount * 0.001 ||
        s.edgeCount < 20000 ||
        s.farMoved > s.farCount * 0.25 ||
        s.farCount < 40000 ||
        s.maxQuatError > 0.0002 ||
        s.stats.overflow ||
        s.stats.clashes,
    ) ||
    b.errors.length
  )
    process.exitCode = 1;
} finally {
  await b.close();
}
