import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const b = await browserCheck(),
  results = [];
const wait = async (expression) => {
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error(`Timed out: ${expression}`);
};
try {
  await b.navigate("?demo=gpu-stress");
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  await b.evaluate("__AVBD_LAB__.pause(true)");
  for (const [kind, shape] of [
    ["box", 0],
    ["capsule", 3],
    ["cylinder", 3],
    ["sphere", 1],
  ]) {
    // Invoke the selector's actual asynchronous change handler and await its
    // completion; event dispatch itself does not await async DOM handlers.
    await b.evaluate(
      `(async()=>{const e=document.querySelector('#lab-projectile');e.value='${kind}';await e.onchange({target:e});__AVBD_LAB__.pause(true);await __AVBD_LAB__.step(30);await __AVBD_LAB__.collect();})()`,
    );
    const result = await b.evaluate(
      `(async()=>{const s=await __AVBD_LAB__.snapshot();const p=s.poses;let projectile=null;for(let i=0;i<p.length;i+=40)if(p[i+19]>100)projectile=p.slice(i,i+40);return {kind:s.projectileKind,count:s.bodyCount,finite:p.every(Number.isFinite),projectile,stats:s.stats,errors:s.errors};})()`,
    );
    if (
      result.kind !== kind ||
      result.count !== 100002 ||
      !result.finite ||
      result.errors.length ||
      result.stats.overflow ||
      result.stats.clashes ||
      !result.projectile ||
      result.projectile[39] !== shape
    )
      throw Error(JSON.stringify(result));
    results.push({
      control: kind,
      passed: true,
      shape,
      mass: result.projectile[19],
      stats: result.stats,
    });
    await b.screenshot(`test-results/screenshots/projectile-${kind}.png`);
    console.log(
      `PASS ${kind} projectile: finite rotation, matching collision shape, ${result.count} bodies`,
    );
  }
  await b.evaluate(`document.querySelector('#lab-reset').click()`);
  await wait("__AVBD_LAB__.diagnostics.ready");
  await b.evaluate("__AVBD_LAB__.pause(true)");
  const reset = await b.evaluate(
    `(async()=>{const s=await __AVBD_LAB__.snapshot();return {count:s.bodyCount,steps:s.steps,kind:s.projectileKind};})()`,
  );
  if (reset.count !== 100002 || reset.steps > 3 || reset.kind !== "sphere")
    throw Error("Reset did not restore initial benchmark");
  results.push({ control: "reset", passed: true, ...reset });
  await b.evaluate(
    `(async()=>{await document.querySelector('#lab-shoot').onclick();__AVBD_LAB__.pause(true);})()`,
  );
  const shot = await b.evaluate(
    `(async()=>{const s=await __AVBD_LAB__.snapshot();return s.projectile;})()`,
  );
  if (Math.hypot(shot[0], shot[1] + 25, shot[2] - 20.5) > 0.0001)
    throw Error("Launch did not restore projectile");
  results.push({ control: "launch", passed: true });
  console.log("PASS reset and launch controls");
  if (b.errors.length) throw Error(b.errors.join("\n"));
} catch (e) {
  results.push({ passed: false, error: e.message });
  console.error(e);
  process.exitCode = 1;
} finally {
  await writeFile(
    "test-results/controls.json",
    JSON.stringify({ results, errors: b.errors }, null, 2),
  );
  await b.close();
}
