import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck(),
  rows = [];
try {
  for (const backend of process.argv.includes("--webgl2")
    ? ["webgl2"]
    : ["cpu", "webgpu", "webgl2"]) {
    await browser.navigate(
      `?demo=slingshot&backend=${backend}&bricks=1000&paused=1`,
    );
    for (let i = 0; i < 400; i++) {
      if (await browser.evaluate("globalThis.__SLINGSHOT__?.ready")) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    assert.equal(await browser.evaluate("__SLINGSHOT__.ready"), true);
    const result = await browser.evaluate(`(async()=>{
      const lab=__SLINGSHOT__, before=lab.gpu.bodyCount;
      lab.launch();const launchState=await lab.gpu.readBodyState(lab.state.bird),launchX=launchState.position[0];
      await lab.step(1);const firstState=await lab.gpu.readBodyState(lab.state.bird),firstStatus=lab.gpu.glWorld?await lab.gpu.glWorld.readStatus():null;
      await lab.step(23);const flight=(await lab.gpu.readBodyState(lab.state.bird)).position[0]-launchX;
      lab.boost();await lab.step(3);
      lab.reload();await lab.step(3);
      const poses=await lab.gpu.readBodies();
      return {backend:lab.gpu.backend,bodyCount:lab.gpu.bodyCount,before,flight,launchState,firstState,firstStatus,finite:Array.from(poses).every(Number.isFinite),state:lab.state,renderStats:lab.renderStats};
    })()`);
    assert.equal(result.backend, backend);
    assert.equal(result.bodyCount, result.before + 1);
    assert.equal(result.finite, true);
    assert.ok(result.flight > 1, "Launched ball did not advance");
    if (result.firstStatus) assert.equal(result.firstStatus.problems, 0);
    assert.equal(result.state.metrics.clashes, 0);
    assert.equal(result.state.metrics.overflow, 0);
    assert.equal(result.state.shots, 1);
    assert.equal(result.state.hold, true);
    assert.deepEqual(result.state.errors, []);
    assert.equal(
      result.renderStats.renderer,
      backend === "webgpu" ? "webgpu" : "canvas",
    );
    await browser.screenshot(
      `test-results/screenshots/${backend}-slingshot.png`,
    );
    await browser.evaluate("__SLINGSHOT__.dispose()");
    rows.push({
      ...result,
      screenshot: `screenshots/${backend}-slingshot.png`,
      passed: true,
    });
    console.log(
      `PASS ${backend} slingshot: launch, boost, live append, constraints, queries, finite poses and drawing`,
    );
  }
  assert.deepEqual(browser.errors, []);
  await writeFile(
    "test-results/cpu-slingshot.json",
    JSON.stringify({ passed: true, rows }, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
