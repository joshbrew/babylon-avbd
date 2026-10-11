import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";

const b = await browserCheck(),
  results = [];
async function wait(expression) {
  for (let i = 0; i < 800; i++) {
    if (await b.evaluate(expression)) return;
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((r) => setTimeout(r, 30));
  }
  throw Error(`Input check timed out: ${expression}`);
}
async function mouse(type, p, button = "left") {
  await b.call("Input.dispatchMouseEvent", {
    type,
    x: p[0],
    y: p[1],
    button,
    buttons: type === "mouseReleased" ? 0 : 1,
    clickCount: type === "mouseMoved" ? 0 : 1,
  });
}
async function touch(type, p) {
  await b.call("Input.dispatchTouchEvent", {
    type,
    touchPoints:
      type === "touchEnd" || type === "touchCancel"
        ? []
        : [{ x: p[0], y: p[1], id: 1, radiusX: 2, radiusY: 2 }],
  });
}
try {
  for (const mode of [
    { scope: "full", backend: "webgpu", renderer: "webgpu" },
    { scope: "full", backend: "webgpu", renderer: "babylon" },
    { scope: "full", backend: "cpu", renderer: "canvas" },
    { scope: "main", backend: "gpu", renderer: "webgpu" },
    { scope: "worker", backend: "gpu", renderer: "webgpu" },
    { scope: "worker-sab", backend: "gpu", renderer: "webgpu" },
    { scope: "worker", backend: "gpu", renderer: "babylon" },
  ])
    for (const input of ["mouse", "touch"]) {
      const full = mode.scope === "full";
      await b.call("Emulation.setDeviceMetricsOverride", {
        width: input === "touch" ? 390 : 1440,
        height: input === "touch" ? 844 : 900,
        deviceScaleFactor: 1,
        mobile: input === "touch",
      });
      await b.call("Emulation.setTouchEmulationEnabled", {
        enabled: input === "touch",
      });
      await b.navigate(
        full
          ? `?demo=slingshot&bricks=1000&paused=1&backend=${mode.backend}&renderer=${mode.renderer}`
          : `tests/workers.html?scene=2d-slingshot-siege&bricks=1000&paused=1&backend=${mode.backend}&renderer=${mode.renderer}&scope=${mode.scope}`,
      );
      await wait(
        full
          ? "globalThis.__SLINGSHOT__?.ready"
          : "globalThis.__WORKER_BENCH__?.ready",
      );
      if (full) {
        const initial = await b.evaluate(
          `(async()=>{await __SLINGSHOT__.step(0);return __SLINGSHOT__.state;})()`,
        );
        assert.equal(initial.steps, 0);
        assert.equal(
          initial.broken,
          0,
          "Intact mortar must remain intact before the first step",
        );
      }
      const geometry = await b.evaluate(
        full
          ? `(()=>{const s=__SLINGSHOT__.state,r=document.querySelector('#siege-canvas').getBoundingClientRect(),o=__SLINGSHOT__.built.origin;
      return {origin:[r.left+r.width/2+(o[0]-s.camera.x)*s.camera.scale,r.top+r.height/2+(s.camera.y-o[1])*s.camera.scale],scale:s.camera.scale};})()`
          : `(async()=>{const s=await __WORKER_BENCH__.client.snapshot(),r=document.querySelector('#canvas').getBoundingClientRect();return {origin:[r.left+s.slingshot.bands[1][0],r.top+s.slingshot.bands[1][1]],scale:s.camera.scale};})()`,
      );
      // Keep the canvas in view before sending physical browser mouse/touch input.
      await b.evaluate(
        `document.querySelector('${full ? "#siege-canvas" : "#canvas"}').scrollIntoView({block:'center'})`,
      );
      // Scrolling changes the page position, so read the launch point again.
      const start = await b.evaluate(
        full
          ? `(()=>{const s=__SLINGSHOT__.state,r=document.querySelector('#siege-canvas').getBoundingClientRect(),o=__SLINGSHOT__.built.origin;return [r.left+r.width/2+(o[0]-s.camera.x)*s.camera.scale,r.top+r.height/2+(s.camera.y-o[1])*s.camera.scale];})()`
          : `(async()=>{const s=await __WORKER_BENCH__.client.snapshot(),r=document.querySelector('#canvas').getBoundingClientRect();return [r.left+s.slingshot.bands[1][0],r.top+s.slingshot.bands[1][1]];})()`,
      );
      const pull = [
        start[0] - 2.5 * geometry.scale,
        start[1] + 1.1 * geometry.scale,
      ];
      if (input === "mouse") {
        await mouse("mousePressed", start);
        await mouse("mouseMoved", pull);
      } else {
        await touch("touchStart", start);
        await touch("touchMove", pull);
      }
      const svg = full ? "#siege-aim" : "#slingshot-aim";
      await wait(`!!document.querySelector('${svg} [data-trajectory]')`);
      if (full) await wait("__SLINGSHOT__.state.aimReady");
      const line = await b.evaluate(
        `document.querySelector('${svg} [data-trajectory]').getAttribute('points')`,
      );
      assert.ok(
        line.split(" ").length > 2,
        "Dragging must draw a trajectory line",
      );
      const screenshot = `test-results/screenshots/slingshot-aim-${mode.scope}-${mode.backend}-${mode.renderer}-${input}.png`;
      await b.screenshot(screenshot);
      // Cancellation must restore the ball without firing.
      if (input === "touch") {
        await touch("touchCancel", pull);
        await wait(
          full
            ? "__SLINGSHOT__.state.pull===null"
            : `!document.querySelector('${svg} [data-trajectory]')`,
        );
        await touch("touchStart", start);
        await touch("touchMove", pull);
        await wait(`!!document.querySelector('${svg} [data-trajectory]')`);
      }
      // Mouse-up's final position can differ from the last move; use that position.
      const end = [
        pull[0] - 0.3 * geometry.scale,
        pull[1] + 0.2 * geometry.scale,
      ];
      if (input === "mouse") await mouse("mouseReleased", end);
      else {
        await touch("touchMove", end);
        await touch("touchEnd", end);
      }
      const launched = await b.evaluate(
        full
          ? `(async()=>{const resumed=!__SLINGSHOT__.state.paused;await __SLINGSHOT__.step(1);const s=__SLINGSHOT__.state;return {resumed,shots:s.shots,holding:s.hold,body:await __SLINGSHOT__.gpu.readBodyState(s.bird),errors:s.errors};})()`
          : `(async()=>{const c=__WORKER_BENCH__.client;c.control('pause',true);await c.step(1);const s=await c.snapshot();return {...s.slingshot,errors:s.errors};})()`,
      );
      assert.equal(launched.shots, 1);
      assert.equal(launched.holding, false);
      if (full)
        assert.equal(
          launched.resumed,
          true,
          "Firing must resume a paused game",
        );
      assert.deepEqual(launched.errors, []);
      const velocity = full ? launched.body.linearVelocity : launched.velocity;
      assert.ok(
        velocity[0] > 23 && velocity[1] > 9,
        "Release must use the pulled-back position",
      );
      await b.evaluate(
        full
          ? `document.querySelector('#siege-reload').click()`
          : `document.querySelector('#reload').click()`,
      );
      await wait(
        full
          ? "__SLINGSHOT__.state.hold"
          : `!!document.querySelector('${svg} polyline')`,
      );
      // Space fires, and auto-repeat must not reload/fire additional balls.
      await b.call("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: " ",
        code: "Space",
        windowsVirtualKeyCode: 32,
      });
      await b.call("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: " ",
        code: "Space",
        windowsVirtualKeyCode: 32,
        autoRepeat: true,
      });
      await b.call("Input.dispatchKeyEvent", {
        type: "keyUp",
        key: " ",
        code: "Space",
        windowsVirtualKeyCode: 32,
      });
      const shots = await b.evaluate(
        full
          ? "__SLINGSHOT__.state.shots"
          : `__WORKER_BENCH__.client.snapshot().then(s=>s.slingshot.shots)`,
      );
      assert.equal(shots, 2, "One key press must launch exactly one ball");
      results.push({
        ...mode,
        input,
        passed: true,
        shots,
        screenshot: screenshot.replace("test-results/", ""),
      });
      console.log(JSON.stringify(results.at(-1)));
      await b.evaluate(
        full ? "__SLINGSHOT__.dispose()" : "__WORKER_BENCH__.client.destroy()",
      );
    }
  assert.deepEqual(b.errors, []);
  await writeAtomicFile(
    "test-results/slingshot-input.json",
    JSON.stringify(
      { date: new Date().toISOString(), passed: true, results },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
