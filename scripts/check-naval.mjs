import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";

const b = await browserCheck(),
  checkpoints = [];
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await b.navigate("?demo=naval&paused=1");
  let ready = false;
  for (let i = 0; i < 500; i++) {
    const state = await b.evaluate(
      "({ready:globalThis.__AVBD_NAVAL__?.diagnostics.ready,errors:globalThis.__AVBD_NAVAL__?.diagnostics.errors,text:document.body.innerText.slice(-1500)})",
    );
    if (state.errors?.length) throw Error(JSON.stringify(state));
    if (state.ready) {
      ready = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  assert.ok(ready, "Naval demo must initialize");
  await b.evaluate("__AVBD_NAVAL__.setAuto(false)");
  const initial = await b.evaluate("__AVBD_NAVAL__.snapshot()");
  async function collect(label) {
    const s = await b.evaluate("__AVBD_NAVAL__.snapshot()");
    const ships = [0, 1].map((team) => {
      const root = s.pieces.find((p) => p.team === team && p.root),
        o = root.index * 40;
      return {
        team,
        position: s.poses.slice(o, o + 3),
        rotation: s.poses.slice(o + 4, o + 8),
        tilt:
          (Math.acos(
            Math.max(
              -1,
              Math.min(1, 1 - 2 * (s.poses[o + 4] ** 2 + s.poses[o + 5] ** 2)),
            ),
          ) *
            180) /
          Math.PI,
        support: s.state[root.stateIndex * 4 + 1],
        brokenMembers: s.state[root.stateIndex * 4 + 2],
        broken: s.pieces.filter(
          (p) => p.team === team && !p.root && s.state[p.stateIndex * 4] <= 0,
        ).length,
      };
    });
    const result = {
      label,
      tick: s.tick,
      rounds: s.rounds,
      ships,
      bodies: s.bodyCount,
      counters: s.counters,
      waterMs: s.waterMs,
      drawMs: s.drawMs,
      errors: s.errors,
    };
    checkpoints.push(result);
    console.log(JSON.stringify(result));
    assert.ok(s.poses.every(Number.isFinite), "All bodies must remain finite");
    assert.equal(s.bodyCount, initial.bodyCount, "Hull fragments must persist");
    assert.ok(!s.errors.length && !b.errors.length, "No browser or GPU errors");
    assert.ok(
      !s.counters.overflow && !s.counters.clashes,
      "No contact overflow or solve conflicts",
    );
    for (const p of s.pieces)
      assert.ok(
        Math.abs(
          Math.hypot(...s.poses.slice(p.index * 40 + 4, p.index * 40 + 8)) - 1,
        ) < 0.0001,
      );
    await b.screenshot(`test-results/screenshots/naval-${label}.png`);
    return { result, snapshot: s };
  }
  await b.evaluate("__AVBD_NAVAL__.step(600)");
  const afloat = await collect("afloat");
  for (const ship of afloat.result.ships) {
    assert.ok(
      ship.position[2] > -1.2 && ship.position[2] < 1.2,
      "Undamaged ships must float near the water surface",
    );
    assert.ok(Math.abs(ship.support - 1) < 0.00001);
    assert.equal(ship.broken, 0);
  }
  await b.evaluate("__AVBD_NAVAL__.step(1800)");
  const settled = await collect("settled");
  for (const ship of settled.result.ships) {
    assert.ok(
      ship.tilt < 20,
      "Undamaged ships must settle without capsizing under sail forces",
    );
    assert.equal(ship.broken, 0);
  }
  // Release only the yard ties: fabric springs and all particles stay alive.
  await b.evaluate(
    "__AVBD_NAVAL__.releaseSail(0);__AVBD_NAVAL__.releaseSail(1);__AVBD_NAVAL__.step(1800)",
  );
  const floatingSails = await collect("floating-sails");
  function checkSails(snapshot) {
    const sails = snapshot.pieces.filter((p) => p.sail);
    assert.equal(
      sails.length,
      260,
      "Both complete sails must persist after release",
    );
    for (const team of [0, 1]) {
      const heights = sails
        .filter((p) => p.team === team)
        .map((p) => snapshot.poses[p.index * 40 + 2]);
      assert.ok(
        heights.every((z) => z > -0.4 && z < 2) &&
          heights.reduce((a, b) => a + b, 0) / heights.length < 0.4,
        "Detached fabric must stay above water, with most particles on the surface and the rest draped over the ship",
      );
      const root = snapshot.pieces.find((p) => p.root && p.team === team);
      assert.equal(
        snapshot.state[root.stateIndex * 4 + 1],
        1,
        "Dropping a sail must leave the wooden hull supports attached",
      );
    }
  }
  checkSails(floatingSails.snapshot);
  await b.evaluate("__AVBD_NAVAL__.step(600)");
  checkSails((await collect("floating-sails-later")).snapshot);
  await b.evaluate("__AVBD_NAVAL__.reset();");
  await b.evaluate("__AVBD_NAVAL__.setAuto(true)");
  for (const tick of [720, 1440, 3000]) {
    await b.evaluate(
      `(async()=>{await __AVBD_NAVAL__.step(${tick} - (await __AVBD_NAVAL__.snapshot()).tick);})()`,
    );
    await collect(String(tick));
  }
  const final = checkpoints.at(-1),
    coral = final.ships[1],
    blue = final.ships[0];
  assert.ok(
    coral.broken >= 3 && coral.support < 1,
    "Cannon impacts must release buoyant hull members",
  );
  assert.ok(blue.position[2] > -1.2, "The stronger ship must remain afloat");
  await b.evaluate("__AVBD_NAVAL__.releaseHull(1);__AVBD_NAVAL__.step(1800)");
  const separated = await collect("separated");
  assert.ok(
    separated.result.ships[1].position[2] < -2,
    "Dense keel must sink without wooden supports",
  );
  const floating = separated.snapshot.pieces.filter(
    (p) =>
      p.team === 1 &&
      !p.root &&
      separated.snapshot.state[p.stateIndex * 4] <= 0 &&
      separated.snapshot.poses[p.index * 40 + 2] > -1.2,
  );
  assert.ok(
    floating.length > 5,
    "Detached wood must retain buoyancy after its weld breaks",
  );
  // Both explicit collision paths use the same water and body coupling.
  await b.evaluate(
    "document.querySelector('#naval-broadphase').value='grid';__AVBD_NAVAL__.reset()",
  );
  await b.evaluate("__AVBD_NAVAL__.setAuto(false);__AVBD_NAVAL__.step(120)");
  await collect("grid");
  // Grounding must fracture actual AVBD welds without a cannon hit or scripted damage.
  await b.evaluate("__AVBD_NAVAL__.ram(1);__AVBD_NAVAL__.step(900)");
  const grounding = await collect("island");
  assert.deepEqual(
    grounding.result.rounds,
    [0, 0],
    "Grounding check must not fire cannons",
  );
  assert.ok(
    grounding.result.ships[1].position[1] > 4,
    "Ship must reach the island shore",
  );
  assert.ok(
    grounding.result.ships[1].broken > 0,
    "Shore collisions must break hull welds",
  );
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await b.evaluate("__AVBD_NAVAL__.step(1)");
  await b.screenshot("test-results/screenshots/naval-mobile-layout.png");
  const layout = await b.evaluate(
    "({width:innerWidth,body:document.querySelector('.naval-demo').scrollWidth,canvas:document.querySelector('canvas').clientWidth})",
  );
  assert.ok(
    layout.body <= layout.width && layout.canvas > 300,
    "Controls must fit a narrow screen",
  );
  await writeFile(
    "test-results/naval.json",
    JSON.stringify(
      {
        passed: true,
        checkpoints,
        layout,
        errors: b.errors,
        screenshots: [
          "afloat",
          "settled",
          "floating-sails",
          "floating-sails-later",
          "720",
          "1440",
          "3000",
          "grid",
          "island",
          "separated",
          "mobile-layout",
        ].map((name) => `screenshots/naval-${name}.png`),
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
