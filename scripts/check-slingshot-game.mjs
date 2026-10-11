import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";
import { browserCheck } from "./browser-check.mjs";

const b = await browserCheck(),
  results = [];
async function ready() {
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate("globalThis.__SLINGSHOT__?.ready")) return;
    await new Promise((r) => setTimeout(r, 30));
  }
  throw Error("Slingshot did not initialize");
}
try {
  await mkdir("test-results/screenshots", { recursive: true });
  for (const count of [1000, 5000, 10000]) {
    await b.navigate(`?demo=slingshot&bricks=${count}&paused=1`);
    await ready();
    const stability = await b.evaluate(`(async()=>{
      const lab=__SLINGSHOT__, initial=await lab.gpu.readBodies();
      await lab.step(600);const p=await lab.gpu.readBodies();
      const displaced=lab.built.masonryBricks.filter(i=>Math.hypot(p[i*24]-initial[i*24],p[i*24+1]-initial[i*24+1])>.2).length;
      return {count:lab.built.brickCount,structural:lab.built.masonryBricks.length,displaced,finite:Array.from(p).every(Number.isFinite),state:lab.state};
    })()`);
    console.log(
      JSON.stringify({
        phase: "stability",
        count,
        displaced: stability.displaced,
        broken: stability.state.broken,
      }),
    );
    assert.equal(stability.finite, true);
    assert.ok(
      stability.displaced < stability.structural * 0.02,
      "At least 98% of structural masonry must stay in place before firing; loose rooftop bricks may settle",
    );
    assert.equal(
      stability.state.broken,
      0,
      "Mortar must not break under normal settling loads",
    );
    assert.deepEqual(stability.state.errors, []);
    assert.equal(stability.state.metrics.overflow, 0);
    assert.equal(stability.state.metrics.clashes, 0);
    assert.equal(stability.state.toppled, 0);
    results.push({
      phase: "stability",
      count,
      displaced: stability.displaced,
      passed: true,
    });
    if (count !== 5000) continue;
    await b.screenshot("test-results/screenshots/slingshot-stable.png");
    // Use the actual aiming helper and launch/reload controls, with no pose or
    // target edits. This exercises whether normal play can clear the level.
    for (let shot = 0; shot < 32; shot++) {
      const state = await b.evaluate(`(async()=>{
        const lab=__SLINGSHOT__;if(!lab.state.hold)lab.reload();
        lab.aimAtTarget();lab.launch();await lab.step(660);return lab.state;
      })()`);
      console.log(
        JSON.stringify({
          phase: "game",
          shot: state.shots,
          cleared: state.toppled,
          won: state.won,
        }),
      );
      assert.deepEqual(state.errors, []);
      assert.equal(state.metrics.overflow, 0);
      assert.equal(state.metrics.clashes, 0);
      if (state.won) break;
    }
    const win = await b.evaluate("__SLINGSHOT__.state");
    assert.equal(
      win.won,
      true,
      "The level must be winnable through normal aimed shots",
    );
    assert.equal(win.toppled, 16);
    assert.ok(
      win.targets.every(
        (t) => t.health === 0,
      ),
    );
    await b.evaluate("__SLINGSHOT__.step(600)");
    const later = await b.evaluate("__SLINGSHOT__.state");
    assert.equal(
      later.toppled,
      win.toppled,
      "Cleared targets must stay cleared after settling",
    );
    assert.equal(later.won, true);
    assert.ok(
      await b.evaluate(
        "document.querySelector('#siege-status').textContent.includes('Fort clear!')",
      ),
    );
    await b.screenshot("test-results/screenshots/slingshot-victory.png");
    results.push({
      phase: "victory",
      count,
      shots: win.shots,
      targets: win.toppled,
      destroyedBricks: win.destroyedBricks,
      passed: true,
    });
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const layout = await b.evaluate(
      "({width:innerWidth,body:document.body.scrollWidth})",
    );
    assert.ok(
      layout.body <= layout.width,
      "Controls must fit a phone-sized viewport",
    );
    await b.screenshot("test-results/screenshots/slingshot-victory-mobile.png");
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }
  assert.deepEqual(b.errors, []);
  await writeFile(
    "test-results/slingshot-game.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        results,
        screenshots: [
          "screenshots/slingshot-stable.png",
          "screenshots/slingshot-victory.png",
          "screenshots/slingshot-victory-mobile.png",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
