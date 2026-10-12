import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
const b = await browserCheck(),
  results = [];
const screenshots = process.argv.includes("--screenshots");
async function ready() {
  for (let i = 0; i < 2400; i++) {
    const r = await b.evaluate(
      "({ready:globalThis.__AVBD_LAB__?.diagnostics.ready,errors:globalThis.__AVBD_LAB__?.diagnostics.errors})",
    );
    if (r.errors?.length) throw Error(r.errors.join("\n"));
    if (r.ready) return;
    await new Promise((r) => setTimeout(r, 30));
  }
  throw Error("Lab startup timed out");
}
try {
  for (const scene of [
    "2d-stack",
    "3d-stack",
    "showcase-box-columns-100k",
    "3d-100k-rook-impact",
    "paper-walls-510k-3",
    "paper-walls-510k-4",
  ]) {
    await b.navigate(
      `?demo=canonical&scene=${scene}&backend=gpu&paused=1&quality=benchmark`,
    );
    await ready();
    const initial = await b.evaluate("__AVBD_LAB__.client.getInfo()");
    assert.equal(
      await b.evaluate("document.querySelector('#lab-sleep-label').hidden"),
      false,
    );
    assert.equal(
      initial.sleepingEnabled,
      scene !== "2d-stack" && scene !== "3d-stack",
    );
    async function rookMasses() {
      return b.evaluate(
        `(async()=>{const p=await __AVBD_LAB__.client.readSelectedBodies([20,40,100]);return [p[19],p[59],p[99]];})()`,
      );
    }
    if (scene === "3d-100k-rook-impact" || scene.startsWith("paper-walls-"))
      assert.deepEqual(
        await rookMasses(),
        [0, 0, 0],
        "Supported bricks start asleep before the first interactive frame",
      );
    if (initial.bowling) {
      const masses = await b.evaluate(
        `(async()=>{const p=await __AVBD_LAB__.client.readSelectedBodies(${JSON.stringify(initial.bowlingBalls)});return [p[19],p[59]];})()`,
      );
      assert.ok(
        masses.every((m) => m > 0),
        "Bowling balls remain awake at startup",
      );
    }
    for (const enabled of [true, false, true]) {
      const info = await b.evaluate(
        `(async()=>{const e=document.querySelector('#lab-sleep');e.checked=${enabled};e.onchange({target:e});await __AVBD_LAB__.step(2);return __AVBD_LAB__.client.getInfo();})()`,
      );
      assert.equal(info.sleepingEnabled, enabled);
      if (scene === "3d-100k-rook-impact" && !enabled)
        assert.ok(
          (await rookMasses()).every((m) => m > 0),
          "Disabling sleep restores live brick masses",
        );
    }
    if (initial.bowling) {
      assert.equal(initial.bowlingBalls.length, 2);
      assert.equal(initial.bodies, 505923);
      const balls = await b.evaluate(
        `(async()=>{document.querySelector('#lab-bowl').onclick();__AVBD_LAB__.pause(true);const info=await __AVBD_LAB__.client.getInfo(),p=await __AVBD_LAB__.client.readSelectedBodies(info.bowlingBalls);return {info,poses:Array.from(p)};})()`,
      );
      assert.equal(balls.info.bodies, 505937);
      assert.equal(balls.info.bowlingBalls.length, 16);
      const lanes = new Set();
      for (let i = 0; i < 16; i++) {
        lanes.add(Math.round(balls.poses[i * 40]));
        assert.ok(balls.poses[i * 40 + 33] > 29);
      }
      assert.equal(lanes.size, 16);
      await b.evaluate("__AVBD_LAB__.step(60)");
      const motion = await b.evaluate(
        `(async()=>{const p=await __AVBD_LAB__.client.readSelectedBodies(${JSON.stringify(balls.info.bowlingBalls)});return Array.from(p);})()`,
      );
      assert.ok(motion.every(Number.isFinite));
      for (let i = 0; i < 16; i++)
        assert.ok(
          motion[i * 40 + 1] > balls.poses[i * 40 + 1] + 10,
          "Every bowling lane must advance into its walls",
        );
      if (screenshots)
        await b.screenshot(`test-results/screenshots/${scene}-all-lanes.png`);
    }
    const errors = await b.evaluate("__AVBD_LAB__.diagnostics.errors");
    assert.deepEqual(errors, []);
    results.push({
      scene,
      defaultSleeping: initial.sleepingEnabled,
      toggle: true,
      bowling: initial.bowling,
      errors,
    });
    console.log(JSON.stringify(results.at(-1)));
    await b.evaluate("__AVBD_LAB__.dispose()");
  }
  assert.deepEqual(b.errors, []);
  await writeAtomicFile(
    "test-results/lab-sleep.json",
    JSON.stringify(
      {
        passed: true,
        results,
        screenshots: (screenshots ? results : [])
          .filter((r) => r.bowling)
          .map((r) => `screenshots/${r.scene}-all-lanes.png`),
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
