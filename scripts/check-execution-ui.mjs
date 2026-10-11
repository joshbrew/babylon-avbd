import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
const b = await browserCheck();
async function wait(expression) {
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate(expression)) return;
    const failure = await b.evaluate(
      "globalThis.__AVBD_NAVAL__?.diagnostics.errors",
    );
    if (failure?.length) throw Error(failure.join("\n"));
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw Error(`Timed out: ${expression}`);
}
try {
  await b.navigate("?demo=canonical&scope=main&scene=2d-stack&backend=webgl2&paused=1");
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  assert.equal(
    await b.evaluate(
      "[...document.querySelector('#lab-backend').options].some(o=>o.value==='webgl2')",
    ),
    false,
  );
  await b.evaluate(
    "const select=document.querySelector('#lab-execution select');select.value='worker';select.onchange()",
  );
  await wait("globalThis.__AVBD_LAB__?.diagnostics.worker && globalThis.__AVBD_LAB__?.diagnostics.ready");
  const configured = await b.evaluate(
    "({scene:document.getElementById('lab-scene').value,scope:document.querySelector('#lab-execution select').value,worker:__AVBD_LAB__.client.info.worker})",
  );
  assert.deepEqual(configured, {
    scene: "2d-stack",
    scope: "worker",
    worker: true,
  });
  await b.evaluate("document.getElementById('lab-benchmark').onclick()");
  const measured = await b.evaluate(
    "({rows:document.getElementById('lab-benchmark-result').textContent.includes('Typical physics:')?1:0,scope:__AVBD_LAB__.client.scope,errors:__AVBD_LAB__.diagnostics.errors})",
  );
  assert.equal(measured.rows, 1);
  assert.equal(measured.scope, "worker");
  assert.deepEqual(measured.errors, []);
  await b.screenshot("test-results/screenshots/execution-worker.png");
  assert.equal(await b.evaluate("location.pathname"),"/");
  await b.evaluate("__AVBD_LAB__.dispose()");
  await b.navigate("tests/performance.html?scene=2d-stack&backend=webgl2");
  await wait("globalThis.__BENCHMARK_VIEW__?.preview.state.phase==='ready'");
  const benchmark = await b.evaluate(
    "({backend:document.getElementById('backend').value,scene:document.getElementById('scene').value,preview:__BENCHMARK_VIEW__.preview.state.backend,solver:document.getElementById('preview-frame').contentWindow.__AVBD_LAB__.diagnostics.backend})",
  );
  assert.deepEqual(benchmark, {
    backend: "webgl2",
    scene: "2d-stack",
    preview: "webgl2",
    solver: "webgl2",
  });
  await b.evaluate("__BENCHMARK_VIEW__.preview.stop()");
  await b.navigate("?demo=naval&scope=main&paused=1");
  await wait("globalThis.__AVBD_NAVAL__?.diagnostics.ready");
  await b.evaluate("__AVBD_NAVAL__.setAuto(false);__AVBD_NAVAL__.step(60)");
  const naval = await b.evaluate("__AVBD_NAVAL__.snapshot()");
  assert.ok(naval.poses.every(Number.isFinite));
  assert.deepEqual(naval.errors, []);
  await b.evaluate("__AVBD_NAVAL__.dispose()");
  await b.navigate("tests/workers.html?scene=2d-slingshot-siege&scope=worker-sab&bricks=1000&sleeping=0");
  await wait("globalThis.__WORKER_BENCH__?.ready");
  await b.evaluate("document.getElementById('fire').onclick();__WORKER_BENCH__.client.step(30)");
  const siege = await b.evaluate("__WORKER_BENCH__.client.snapshot()");
  assert.ok(siege.bodies > 1000 && siege.bodies < 2000);
  assert.equal(siege.worker, true);
  assert.equal(siege.sharedInput, true);
  assert.ok(siege.poses.every(Number.isFinite));
  assert.deepEqual(siege.errors, []);
  await b.evaluate("__WORKER_BENCH__.client.destroy()");
  const ordinary = await browserCheck({ isolated: false });
  try {
    await ordinary.navigate("tests/workers.html?scene=2d-pyramid&backend=cpu&scope=worker-sab");
    let available = false;
    for (let i = 0; i < 600; i++) {
      if (await ordinary.evaluate("globalThis.__WORKER_BENCH__?.ready")) { available = true; break; }
      if (ordinary.errors.length) throw Error(ordinary.errors.join("\n"));
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.ok(available);
    assert.deepEqual(await ordinary.evaluate("({scope:document.getElementById('scope').value,hidden:document.querySelector('#scope [value=worker-sab]').hidden,shared:__WORKER_BENCH__.client.shared})"),
      {scope:"worker",hidden:true,shared:false});
    await ordinary.evaluate("__WORKER_BENCH__.client.step(5)");
    assert.deepEqual(ordinary.errors, []);
  } finally { await ordinary.close(); }
  assert.deepEqual(b.errors, []);
  await writeFile(
    "test-results/execution-ui.json",
    JSON.stringify(
      {
        passed: true,
        configured,
        measured,
        benchmark,
        naval: { bodies: naval.bodyCount, errors: naval.errors },
        siege: { bodies: siege.bodies, worker: siege.worker, sharedInput: siege.sharedInput },
        nonisolatedFallback: true,
        screenshot: "screenshots/execution-worker.png",
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS demo execution selector, selected-mode benchmark, benchmark-only WebGL2, and main-thread naval rendering",
  );
} finally {
  await b.close();
}
