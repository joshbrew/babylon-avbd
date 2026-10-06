import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck(),
  checkpoints = [];
const wait = async (expression) => {
  for (let i = 0; i < 900; i++) {
    if (await browser.evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw Error(`Castle initialization timed out: ${expression}`);
};
try {
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await browser.navigate("?demo=cannon&paused=1");
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  await browser.evaluate("__AVBD_LAB__.pause(true)");
  await browser.evaluate(
    "__AVBD_LAB__.snapshot().then(s=>globalThis.castleInitial=s)",
  );
  const capture = async (name, target) => {
    await browser.evaluate(
      `(async()=>{for(let i=__AVBD_LAB__.diagnostics.steps;i<${target};i++)await __AVBD_LAB__.step();await __AVBD_LAB__.collect();})()`,
    );
    const state = await browser.evaluate(`(async()=>{
      const s=await __AVBD_LAB__.snapshot({joints:true}), p=s.poses;
      let broken=0,maxDrift=0,moved=0,rotated=0,remote=0,remoteMoved=0,minZ=Infinity,maxSpeed=0;
      for(let i=0;i<s.jointStates.length;i+=32)if(s.jointStates[i+3]===0 && s.jointStates[i+7]===0)broken++;
      for(const part of s.castle.parts){const i=part.gpuIndex*40, q=castleInitial.poses;
        const d=Math.hypot(p[i]-q[i],p[i+1]-q[i+1],p[i+2]-q[i+2]);maxDrift=Math.max(maxDrift,d);if(d>.15)moved++;
        const dot=Math.abs(p.slice(i+4,i+8).reduce((n,v,k)=>n+v*q[i+4+k],0));if(dot<.995)rotated++;
        if(part.part==='back-wall'||part.part==='east-wall'||(part.part==='east-tower'&&q[i+1]>0)){remote++;if(d>.15)remoteMoved++;}
        minZ=Math.min(minZ,p[i+2]);maxSpeed=Math.max(maxSpeed,Math.hypot(...p.slice(i+32,i+35)));
      }
      return {name:${JSON.stringify(name)},steps:s.steps,workload:s.castle.workload,finite:p.every(Number.isFinite),broken,maxDrift,moved,rotated,remote,remoteMoved,minZ,maxSpeed,projectile:s.projectile,stats:s.stats,profile:s.gpuProfile,errors:s.errors};
    })()`);
    checkpoints.push(state);
    if (state.errors.length) throw Error(state.errors[0]);
    console.log(JSON.stringify(state));
    await browser.screenshot(`test-results/screenshots/castle-${name}.png`);
    return state;
  };
  const initial = await capture("initial", 1);
  const quiet = await capture("settled", 180);
  await browser.evaluate(
    "__AVBD_LAB__.shoot().then(()=>__AVBD_LAB__.pause(true))",
  );
  await capture("impact", 240);
  const final = await capture("destroyed", 420);
  await writeFile(
    "test-results/castle.json",
    JSON.stringify(
      { initial, quiet, final, checkpoints, errors: browser.errors },
      null,
      2,
    ),
  );
  if (
    !quiet.finite ||
    quiet.broken > 0 ||
    quiet.maxDrift > 0.15 ||
    final.broken < 5 ||
    final.moved < 10 ||
    final.rotated < 5 ||
    final.remoteMoved > final.remote * 0.1 ||
    checkpoints.some(
      (s) =>
        !s.finite || s.errors.length || s.stats.overflow || s.stats.clashes,
    ) ||
    browser.errors.length
  )
    throw Error("Castle motion checks failed; inspect castle.json");
  console.log(
    "PASS castle: intact mortar before firing, localized fracture, rotating rubble and stable distant walls",
  );
  await browser.evaluate(
    "__AVBD_LAB__.select('3d-castle-siege','gpu').then(()=>__AVBD_LAB__.pause(true)).then(()=>__AVBD_LAB__.snapshot()).then(s=>globalThis.castleInitial=s)",
  );
  await browser.evaluate(
    `(async()=>{for(const [id,value] of [['yaw',-32],['elevation',30],['speed',44]]){const e=document.querySelector('#lab-cannon-'+id);e.value=value;await e.oninput();}})()`,
  );
  await browser.evaluate(
    "__AVBD_LAB__.shoot().then(()=>__AVBD_LAB__.pause(true))",
  );
  const roof = await capture("roof-impact", 180);
  const roofDamage = await browser.evaluate(
    `(async()=>{const s=await __AVBD_LAB__.snapshot();return s.castle.parts.filter(part=>part.part.endsWith('-roof')).filter(part=>{const i=part.gpuIndex*40,q=castleInitial.poses;return Math.hypot(s.poses[i]-q[i],s.poses[i+1]-q[i+1],s.poses[i+2]-q[i+2])>.2;}).length;})()`,
  );
  if (roof.broken < 5 || roofDamage < 3)
    throw Error("Elevated shot did not break the roof");
  const controls = [];
  for (const [kind, shape] of [
    ["sphere", 1],
    ["box", 0],
    ["capsule", 3],
    ["cylinder", 3],
  ]) {
    await browser.evaluate(
      "__AVBD_LAB__.select('3d-castle-siege','gpu').then(()=>__AVBD_LAB__.pause(true))",
    );
    const result = await browser.evaluate(
      `(async()=>{const e=document.querySelector('#lab-projectile');e.value=${JSON.stringify(kind)};await e.onchange({target:e});__AVBD_LAB__.pause(true);const s=await __AVBD_LAB__.snapshot();const index=s.projectileGpuIndex;return {shape:s.poses[index*40+39],mass:s.poses[index*40+19],speed:Math.hypot(...s.poses.slice(index*40+32,index*40+35)),finite:s.poses.every(Number.isFinite),errors:s.errors};})()`,
    );
    // Hull codes include their packed header offset; the three primitive codes do not.
    const actualShape = result.shape >= 3 ? 3 : result.shape;
    if (
      actualShape !== shape ||
      Math.abs(result.mass - 100) > 1e-5 ||
      result.speed < 40 ||
      !result.finite ||
      result.errors.length
    )
      throw Error(JSON.stringify(result));
    controls.push({ kind, passed: true });
  }
  await browser.evaluate(
    "__AVBD_LAB__.select('3d-castle-siege','gpu').then(()=>__AVBD_LAB__.pause(true))",
  );
  const reset = await browser.evaluate(
    "__AVBD_LAB__.snapshot({joints:true}).then(s=>({broken:s.jointStates.filter((v,i)=>i%32===3&&v===0&&s.jointStates[i+4]===0).length,yaw:document.querySelector('#lab-cannon-yaw').value,errors:s.errors}))",
  );
  if (reset.broken || reset.yaw !== "-16" || reset.errors.length)
    throw Error(JSON.stringify(reset));
  await browser.screenshot("test-results/screenshots/castle-ready.png");
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await browser.screenshot("test-results/screenshots/castle-390.png");
  await writeFile(
    "test-results/castle.json",
    JSON.stringify(
      {
        initial,
        quiet,
        final,
        roof,
        roofDamage,
        controls,
        reset,
        checkpoints,
        errors: browser.errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS castle controls: aiming breaks ${roofDamage} roof pieces, all four projectiles, reset and mobile screenshot`,
  );
} finally {
  await browser.close();
}
