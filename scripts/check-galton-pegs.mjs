import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
const b = await browserCheck(),
  results = [];
const info =
  "__AVBD_LAB__.client ? __AVBD_LAB__.client.getInfo() : ({pegs:__AVBD_LAB__.diagnostics.pegs})";
async function ready() {
  for (let i = 0; i < 1200; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) return;
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((r) => setTimeout(r, 30));
  }
  throw Error("Galton startup timed out");
}
async function click(retracted, touch = false) {
  const p = await b.evaluate(
    `(()=>{const r=document.querySelector('.lab-view>canvas').getBoundingClientRect(),y=${retracted ? 2.65 : -2.85},z=20.05,x=.475,s=Math.sin(.06),c=Math.cos(.06),f=-s*(z-20.5-86*s)+c*(y+86*c),v=c*(z-20.5-86*s)+s*(y+86*c),scale=r.height/(2*Math.tan(.39));return [r.left+r.width/2+x/f*scale,r.top+r.height/2-v/f*scale];})()`,
  );
  if (touch) {
    await b.call("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: p[0], y: p[1], id: 1 }],
    });
    await b.call("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    for (const type of ["mousePressed", "mouseReleased"])
      await b.call("Input.dispatchMouseEvent", {
        type,
        x: p[0],
        y: p[1],
        button: "left",
        buttons: type === "mousePressed" ? 1 : 0,
        clickCount: 1,
      });
  }
  await new Promise((r) => setTimeout(r, 350));
  return b.evaluate(info);
}
try {
  for (const mode of [
    { scope: "main", renderer: "webgpu" },
    { scope: "main", renderer: "babylon" },
    { scope: "worker", renderer: "webgpu" },
    { scope: "worker-sab", renderer: "webgpu" },
    { scope: "worker", renderer: "babylon" },
    { scope: "worker", backend: "cpu", renderer: "webgpu" },
  ]) {
    await b.navigate(
      `?demo=canonical&scene=3d-marble-cascade&paused=1&scope=${mode.scope}&renderer=${mode.renderer}&backend=${mode.backend ?? "gpu"}`,
    );
    await ready();
    const out = await click(false);
    assert.equal(out.pegs.retracted, 1);
    const id = out.pegs.last.id;
    const pose = await b.evaluate(
      `(__AVBD_LAB__.client ?? __AVBD_LAB__).readSelectedBodies([${id}]).then(p=>Array.from(p))`,
    );
    assert.ok(
      pose[1] > 5.4 && pose[1] < 5.6,
      "Retracted peg must slide behind the marble lanes",
    );
    const back = await click(true);
    assert.equal(back.pegs.retracted, 0);
    assert.equal(back.pegs.last.id, id);
    const restored = await b.evaluate(
      `(__AVBD_LAB__.client ?? __AVBD_LAB__).readSelectedBodies([${id}]).then(p=>Array.from(p))`,
    );
    assert.ok(Math.abs(restored[1]) < 1e-6);
    await b.call("Emulation.setTouchEmulationEnabled", { enabled: true });
    const touched = await click(false, true);
    assert.equal(touched.pegs.retracted, 1);
    await b.call("Emulation.setTouchEmulationEnabled", { enabled: false });
    await b.evaluate(
      "document.querySelector('[data-action=restore-pegs]').onclick()",
    );
    await new Promise((r) => setTimeout(r, 350));
    await b.evaluate("__AVBD_LAB__.pause(true)");
    const reset = await b.evaluate(info);
    assert.equal(reset.pegs.retracted, 0);
    const errors = await b.evaluate("__AVBD_LAB__.diagnostics.errors");
    assert.deepEqual(errors, []);
    results.push({
      ...mode,
      id,
      mouse: true,
      touch: true,
      restore: true,
      errors,
    });
    console.log(JSON.stringify(results.at(-1)));
    await b.screenshot(
      `test-results/screenshots/galton-pegs-${mode.backend ?? "gpu"}-${mode.renderer}-${mode.scope}.png`,
    );
    await b.evaluate("__AVBD_LAB__.dispose()");
  }
  assert.deepEqual(b.errors, []);
  await writeAtomicFile(
    "test-results/galton-pegs.json",
    JSON.stringify(
      {
        passed: true,
        results,
        screenshots: results.map(
          (m) =>
            `screenshots/galton-pegs-${m.backend ?? "gpu"}-${m.renderer}-${m.scope}.png`,
        ),
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
