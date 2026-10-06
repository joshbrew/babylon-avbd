import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
import { build } from "esbuild";

await build({
  entryPoints: ["tests/tearable-cloth-layout.js"],
  outfile: "dist/cloth-layout.js",
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
});

const browser = await browserCheck();
const snapshots = [];
try {
  await browser.navigate(
    "?demo=canonical&scene=3d-tearable-cloth&backend=gpu&paused=1",
  );
  for (let i = 0; i < 400; i++) {
    if (await browser.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready"))
      break;
    await new Promise((r) => setTimeout(r, 30));
  }
  if (!(await browser.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")))
    throw Error("Cloth scene did not initialize");
  await browser.evaluate(`(async()=>{
    const {tearableBondLayout}=await import('/dist/cloth-layout.js');
    globalThis.clothBonds=tearableBondLayout();
    const p=(await __AVBD_LAB__.snapshot()).poses;
    globalThis.clothPointMap=new Map();
    for(let o=0;o<p.length;o+=40)if(p[o+39]===1&&p[o+23]<.3)clothPointMap.set(Math.round(p[o]/.25+15.5)+','+Math.round(p[o+1]/.25+15.5),o);
    globalThis.clothInitial=p;
    if(clothPointMap.size!==1024)throw Error('Expected 1024 fabric points');
    for(const [key,o] of clothPointMap){const [x,y]=key.split(',').map(Number);const corner=(x===0||x===31)&&(y===0||y===31);if((p[o+19]===0)!==corner)throw Error('Only the four corners may be pinned');}
  })()`);
  for (const target of [0, 60, 90, 120, 150, 180, 240, 480, 960]) {
    let steps = await browser.evaluate(
      "(async()=> (await __AVBD_LAB__.snapshot()).steps)()",
    );
    while (steps < target) {
      const count = Math.min(20, target - steps);
      await browser.evaluate(`__AVBD_LAB__.step(${count})`);
      const stats = await browser.evaluate("__AVBD_LAB__.collect()");
      if (stats.overflow || stats.clashes)
        throw Error(JSON.stringify({ steps, stats }));
      steps += count;
    }
    const result = await browser.evaluate(`(async()=>{
      const s=await __AVBD_LAB__.snapshot({joints:true});
      let broken=0,maxQuatError=0,ball,maxStrain=0,minSheetZ=Infinity,maxAnchorError=0,minFreeEdgeZ=Infinity;
      for(let o=0;o<s.jointStates.length;o+=32) if(s.jointStates[o+3]===0) broken++;
      const brokenBonds=clothBonds.filter(b=>s.jointStates[b.slot*32+3]===0);
      const brokenAttachments=brokenBonds.filter(b=>b.anchor).length;
      const brokenOuterBonds=brokenBonds.filter(b=>b.edge>.75).length;
      const maxTearRadius=Math.max(0,...brokenBonds.map(b=>Math.hypot(b.x,b.y)));
      for(let o=0;o<s.poses.length;o+=40) {
        maxQuatError=Math.max(maxQuatError,Math.abs(Math.hypot(...s.poses.slice(o+4,o+8))-1));
        if(s.poses[o+39]===1&&s.poses[o+23]>.3) ball=s.poses.slice(o,o+3);
      }
      for(const [key,o] of clothPointMap){minSheetZ=Math.min(minSheetZ,s.poses[o+2]);const [x,y]=key.split(',').map(Number);if(clothInitial[o+19]===0)for(let k=0;k<3;k++)maxAnchorError=Math.max(maxAnchorError,Math.abs(s.poses[o+k]-clothInitial[o+k]));else if(x===0||x===31||y===0||y===31)minFreeEdgeZ=Math.min(minFreeEdgeZ,s.poses[o+2]);for(const [dx,dy] of [[1,0],[0,1]]){const b=clothPointMap.get((x+dx)+','+(y+dy));if(b!==undefined)maxStrain=Math.max(maxStrain,Math.hypot(...[0,1,2].map(k=>s.poses[o+k]-s.poses[b+k]))/.25-1);}}
      return {steps:s.steps,seconds:s.steps*s.timeStep,bodies:s.bodyCount,pinnedPoints:4,bonds:s.jointStates.length/32,broken,brokenAttachments,brokenOuterBonds,maxTearRadius,ball,maxStrain,minSheetZ,minFreeEdgeZ,maxAnchorError,maxQuatError,finite:s.poses.every(Number.isFinite),stats:s.stats,errors:s.errors,gpuProfile:s.gpuProfile};
    })()`);
    if (
      !result.finite ||
      result.errors.length ||
      result.maxQuatError > 1e-4 ||
      result.brokenAttachments ||
      result.brokenOuterBonds ||
      result.maxAnchorError !== 0
    )
      throw Error(JSON.stringify(result));
    snapshots.push(result);
    await browser.screenshot(
      `test-results/screenshots/tearable-cloth-${target}-steps.png`,
    );
    console.log(JSON.stringify(result));
  }
  const first = snapshots[0],
    last = snapshots.at(-1);
  if (
    first.broken !== 0 ||
    snapshots[1].broken !== 0 ||
    snapshots[2].broken !== 0 ||
    snapshots[1].maxStrain < 0.02 ||
    snapshots[1].minFreeEdgeZ >= 3.5 ||
    last.minSheetZ >= 1 ||
    last.broken === 0 ||
    last.broken > last.bonds * 0.05 ||
    !last.ball ||
    last.ball[2] > 2
  )
    throw Error(
      "Expected elastic stretch before impact, a central tear, four intact attachments and falling torn fabric: " +
        JSON.stringify(snapshots),
    );
  if (browser.errors.length) throw Error(JSON.stringify(browser.errors));
  await writeFile(
    "test-results/tearable-cloth.json",
    JSON.stringify(
      { passed: true, snapshots, errors: browser.errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
