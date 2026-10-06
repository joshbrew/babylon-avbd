import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const b = await browserCheck(),
  results = [];
const wait = async (expression) => {
  for (let i = 0; i < 400; i++) {
    if (await b.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error(`Timed out: ${expression}`);
};
try {
  for (const id of process.env.AVBD_SLINGSHOT_ONLY
    ? []
    : ["2d-sleeping-pile", "2d-limited-hinges"]) {
    await b.navigate(`?demo=canonical&scene=${id}&backend=gpu&paused=1`);
    await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
    await b.evaluate("__AVBD_LAB__.step(720)");
    const snapshot = await b.evaluate(
      "(async()=>{await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot();})()",
    );
    if (
      snapshot.errors.length ||
      snapshot.stats.overflow ||
      snapshot.stats.clashes ||
      !snapshot.poses.flat().every(Number.isFinite)
    )
      throw Error(JSON.stringify(snapshot));
    if (id === "2d-sleeping-pile" && snapshot.stats.sleeping < 200)
      throw Error(`Only ${snapshot.stats.sleeping} bodies asleep`);
    await b.screenshot(`test-results/screenshots/${id}.png`);
    results.push({ scene: id, passed: true, stats: snapshot.stats });
    console.log(`PASS ${id}`);
  }
  await b.navigate("?demo=slingshot&paused=1");
  await wait("globalThis.__SLINGSHOT__?.ready");
  for (const count of [1000, 5000, 10000]) {
    await b.evaluate(
      `(async()=>{document.querySelector('#siege-size').value='${count}';await __SLINGSHOT__.reset();await __SLINGSHOT__.step(${count === 1000 ? 1200 : 360});})()`,
    );
    const quiet = await b.evaluate(
      "(async()=>{const a=__SLINGSHOT__,p=await a.gpu.readBodies(),c=await a.gpu.readCounters(),s=await a.gpu.readSleepStats();return{bricks:a.built.bricks.length,bodies:a.gpu.bodyCount,finite:p.every(Number.isFinite),bad:a.built.bricks.filter(i=>p[i*24+1]<-.2||Math.abs(p[i*24])>150).length,c,s,errors:a.state.errors,baselineMoved:a.built.bricks.filter(i=>Math.abs(p[i*24+2])>.4).length};})()",
    );
    if (
      quiet.bricks !== count ||
      !quiet.finite ||
      quiet.bad ||
      quiet.c.overflow ||
      quiet.c.clashes ||
      quiet.errors.length ||
      quiet.baselineMoved > count * 0.02
    )
      throw Error(JSON.stringify({ count, quiet }));
    await b.screenshot(`test-results/screenshots/slingshot-${count}-ready.png`);
    if (count === 1000) {
      const origin = await b.evaluate(
        "(()=>{const a=__SLINGSHOT__,r=document.querySelector('#siege-canvas').getBoundingClientRect(),c=a.state.camera,o=a.built.origin;return{x:r.x+r.width/2+(o[0]-c.x)*c.scale,y:r.y+r.height/2-(o[1]-c.y)*c.scale,scale:c.scale};})()",
      );
      await b.call("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: origin.x,
        y: origin.y,
        button: "left",
        clickCount: 1,
      });
      await b.call("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: origin.x - origin.scale * 3,
        y: origin.y + origin.scale * 0.3,
        button: "left",
        buttons: 1,
      });
      await new Promise((r) => setTimeout(r, 250));
      await b.evaluate("__SLINGSHOT__.queryAim()");
      await wait("__SLINGSHOT__.state.aimReady");
      if (!(await b.evaluate("__SLINGSHOT__.state.aimHits>0")))
        throw Error(
          JSON.stringify(
            await b.evaluate(
              "({state:__SLINGSHOT__.state,status:document.querySelector('#siege-status').textContent})",
            ),
          ),
        );
      await b.screenshot("test-results/screenshots/slingshot-aim.png");
      await b.call("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: origin.x - origin.scale * 3,
        y: origin.y + origin.scale * 0.3,
        button: "left",
        clickCount: 1,
      });
      await b.evaluate("__SLINGSHOT__.step(1200)");
      const impact = await b.evaluate(
        "(async()=>{await __SLINGSHOT__.collect();return{...__SLINGSHOT__.state,c:await __SLINGSHOT__.gpu.readCounters(),finite:(await __SLINGSHOT__.gpu.readBodies()).every(Number.isFinite)};})()",
      );
      if (
        impact.shots !== 1 ||
        impact.moved < 20 ||
        !impact.finite ||
        impact.c.overflow ||
        impact.c.clashes ||
        impact.errors.length ||
        impact.crossings !== 1
      )
        throw Error(JSON.stringify(impact));
      await b.screenshot("test-results/screenshots/slingshot-impact.png");
      await b.evaluate(
        "__SLINGSHOT__.reload();document.querySelector('#siege-bounce').checked=true;document.querySelector('#siege-bounce').onchange();__SLINGSHOT__.launch();__SLINGSHOT__.boost();__SLINGSHOT__.step(120)",
      );
      if ((await b.evaluate("__SLINGSHOT__.state.shots")) !== 2)
        throw Error("Reload/fire failed");
      results.push({
        scene: "slingshot-impact",
        passed: true,
        moved: impact.moved,
        toppled: impact.toppled,
        crossings: impact.crossings,
        broken: impact.broken,
      });
    }
    await b.evaluate(
      "document.querySelector('#siege-sleep').checked=false;document.querySelector('#siege-sleep').onchange()",
    );
    const awake = await b.evaluate(
      "(async()=>{const p=await __SLINGSHOT__.gpu.readBodies();return Array.from({length:__SLINGSHOT__.gpu.bodyCount},(_,i)=>p[i*24+15]).filter(v=>v!==0).length;})()",
    );
    if (awake) throw Error(`Disabling sleep left ${awake} sleepers`);
    await b.evaluate(
      "document.querySelector('#siege-sleep').checked=true;document.querySelector('#siege-sleep').onchange()",
    );
    const playback = await b.evaluate(
      "new Promise(resolve=>{__SLINGSHOT__.pause(false);const times=[];let previous=performance.now(),startTime=previous,startSteps=__SLINGSHOT__.state.steps;const sample=now=>{times.push(now-previous);previous=now;if(times.length===10){startTime=now;startSteps=__SLINGSHOT__.state.steps;}if(times.length>=70){__SLINGSHOT__.pause(true);return resolve({intervals:times.slice(10),stepsPerSecond:(__SLINGSHOT__.state.steps-startSteps)*1000/(now-startTime)});}requestAnimationFrame(sample);};requestAnimationFrame(sample);})",
    );
    const intervals = playback.intervals;
    intervals.sort((a, b) => a - b);
    results.push({
      scene: `slingshot-${count}`,
      passed: true,
      quiet,
      frameMs: { median: intervals[30], p95: intervals[57] },
      stepsPerSecond: playback.stepsPerSecond,
    });
    console.log(
      `PASS slingshot ${count}: ${(1000 / intervals[30]).toFixed(1)} FPS`,
    );
  }
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await b.evaluate("document.querySelector('.siege-metrics').open=false");
  await b.screenshot("test-results/screenshots/slingshot-mobile.png");
  if (await b.evaluate("document.documentElement.scrollWidth>innerWidth+1"))
    throw Error("Mobile horizontal overflow");
  await b.evaluate("__SLINGSHOT__.dispose()");
  if (b.errors.length) throw Error(b.errors.join("\n"));
  await writeFile(
    "test-results/policy-2d.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
} finally {
  await b.close();
}
