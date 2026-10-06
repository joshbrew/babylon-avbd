import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const b = await browserCheck(),
  results = [];
try {
  await b.navigate("?scene=2d-empty&backend=ref&paused=1");
  for (
    let i = 0;
    i < 400 &&
    !(await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready"));
    i++
  )
    await new Promise((r) => setTimeout(r, 30));
  for (const [id, columns, boxes] of [
    ["2d-stress-pile-10k", 100, 10000],
    ["2d-stress-pile-50k", 500, 50000],
    ["2d-stress-pile-100k", 1000, 100000],
  ]) {
    await b.evaluate(`__AVBD_LAB__.select('${id}','gpu')`);
    await b.evaluate("__AVBD_LAB__.pause(true)");
    const checkpoints = [];
    for (let step = 1; step <= 360; step++) {
      await b.evaluate("__AVBD_LAB__.step(1)");
      const counters = await b.evaluate("__AVBD_LAB__.collect()");
      if (counters.overflow || counters.clashes)
        throw Error(JSON.stringify({ id, step, counters }));
      if (step % 120) continue;
      const snapshot = await b.evaluate(
        `__AVBD_LAB__.snapshot().then(s=>{const p=s.poses.slice(3);return {steps:s.steps,bodies:s.bodyCount,finite:p.flat().every(Number.isFinite),minY:Math.min(...p.map(p=>p[1])),outside:p.filter(p=>p[1]<-1||Math.abs(p[0])>${columns / 2 + 1}).length,stats:s.stats,errors:s.errors};})`,
      );
      if (
        !snapshot.finite ||
        snapshot.outside ||
        snapshot.errors.length ||
        snapshot.bodies !== boxes + 3
      )
        throw Error(JSON.stringify(snapshot));
      checkpoints.push(snapshot);
    }
    await b.evaluate("document.querySelector('#lab-fit').onclick()");
    await b.screenshot(`test-results/screenshots/${id}-six-seconds.png`);
    results.push({ scene: id, passed: true, checkpoints });
    console.log("PASS " + JSON.stringify(results.at(-1)));
  }
  if (b.errors.length) throw Error(b.errors.join("\n"));
  await writeFile(
    "test-results/stress-2d.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
} finally {
  await b.close();
}
