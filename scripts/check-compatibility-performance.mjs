import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const browser = await browserCheck(),
  rows = [];
try {
  await browser.navigate("tests/performance.html");
  for (let i = 0; i < 400; i++) {
    if (await browser.evaluate("!!globalThis.__BENCHMARK_VIEW__")) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(await browser.evaluate("!!globalThis.__BENCHMARK_VIEW__"), true);
  for (const backend of ["cpu", "webgl2", "webgpu"]) {
    const result = await browser.evaluate(`(async()=>{
      const $=id=>document.getElementById(id);
      $('scene').value='3d-stack';$('backend').value='${backend}';
      $('warmup').value=2;$('samples').value=3;$('repeats').value=1;
      const state=await __BENCHMARK_VIEW__.runSelected();
      await __BENCHMARK_VIEW__.preview.pause(true);
      return {result:state.results[0],preview:{...__BENCHMARK_VIEW__.preview.state},rows:$('results').textContent};
    })()`);
    assert.equal(result.result.passed, true, result.result.error);
    assert.equal(result.preview.backend, backend);
    assert.equal(result.preview.phase, "ready");
    assert.deepEqual(result.preview.errors, []);
    assert.ok(result.result.summary.wall.mean > 0);
    if (backend === "cpu") assert.equal(result.result.summary.total.mean, null);
    else if (
      backend === "webgpu" ||
      result.result.timingKind.includes("elapsed queries")
    )
      assert.ok(result.result.summary.total.mean > 0);
    rows.push({ backend, ...result });
    console.log(
      `PASS ${backend}: measured steps, backend labels and playable preview`,
    );
  }
  await browser.screenshot(
    "test-results/screenshots/compatibility-performance.png",
  );
  await browser.evaluate("__BENCHMARK_VIEW__.preview.stop()");
  // CPU and WebGL2 remain usable when navigator.gpu does not exist.
  await browser.evaluate(
    "Object.defineProperty(navigator,'gpu',{value:undefined,configurable:true})",
  );
  const withoutWebgpu = await browser.evaluate(`(async()=>{
    const runner=await import('/dist/performance.js?withoutWebgpu');
    await __BENCHMARK_VIEW__.suspendPreview();
    const rows=[];for(const backend of ['cpu','webgl2'])rows.push(await __PERFORMANCE__.run('2d-stack','production',1,2,{backend}));
    await __BENCHMARK_VIEW__.preview.stop();return rows;
  })()`);
  assert.ok(
    withoutWebgpu.every((row) => row.finite && row.summary.wall.mean > 0),
  );
  assert.deepEqual(browser.errors, []);
  await writeFile(
    "test-results/compatibility-performance.json",
    JSON.stringify(
      {
        passed: true,
        rows,
        withoutWebgpu,
        screenshot: "screenshots/compatibility-performance.png",
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser.close();
}
