import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";

const b = await browserCheck();
const results = [];
async function ready(expression) {
  for (let i = 0; i < 1200; i++) {
    try {
      if (await b.evaluate(expression)) return;
    } catch (error) {
      // The default scene route replaces the laboratory with the worker view.
      if (
        !/navigated or closed|Execution context was destroyed|Cannot find context/.test(
          error.message,
        )
      )
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 50));
      continue;
    }
    if (b.errors.length) throw Error(b.errors.join("\n"));
    const failure = await b.evaluate(
      "globalThis.__WORKER_BENCH__?.errors?.join('\\n')",
    );
    if (failure) throw Error(failure);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw Error(`Startup timed out: ${expression}`);
}
try {
  await b.call("Page.addScriptToEvaluateOnNewDocument", {
    source: `globalThis.__STARTUP_TICKS__=0;setInterval(()=>__STARTUP_TICKS__++,20);
       globalThis.__LOADING_VISIBLE__=false;
       new MutationObserver(()=>{const p=document.querySelector('.lab-loading');if(p&&!p.hidden)__LOADING_VISIBLE__=true;}).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});`,
  });
  const started = performance.now();
  await b.navigate(
    "?demo=canonical&scene=3d-marble-cascade&backend=gpu&paused=1",
  );
  await ready("globalThis.__AVBD_LAB__?.diagnostics.ready");
  const worker = await b.evaluate(`({
    ...__AVBD_LAB__.client.info,
    scope:document.querySelector('#lab-execution select').value,
    ticks:__STARTUP_TICKS__,
    fullControls:new URL([...document.querySelectorAll('a')].find(a=>a.textContent==='Open scene editing and diagnostic tools').href).searchParams.get('scope'),
    paused:document.getElementById('lab-pause').textContent==='Resume',
    settingsEnabled:!document.getElementById('lab-scene').disabled,
    pathname:location.pathname
  })`);
  assert.equal(worker.worker, true);
  assert.equal(worker.scope, "worker");
  assert.equal(worker.pathname, "/");
  assert.equal(worker.bodies, 40747);
  assert.equal(worker.iterations, 5);
  assert.equal(worker.fullControls, "main");
  assert.equal(worker.paused, true);
  assert.equal(worker.settingsEnabled, true);
  async function checkLoading() {
    assert.equal(
      await b.evaluate("__LOADING_VISIBLE__"),
      true,
      "Scene setup has a visible loading panel",
    );
    assert.equal(
      await b.evaluate("document.querySelector('.lab-loading').hidden"),
      true,
      "Loading panel disappears when ready",
    );
    assert.equal(
      await b.evaluate(
        "document.querySelector('.lab-view').getAttribute('aria-busy')",
      ),
      "false",
    );
  }
  await checkLoading();
  assert.ok(
    worker.startupPhases.length >= 5 &&
      worker.startupPhases.every((p) => Number.isFinite(p.ms) && p.ms >= 0),
    "Worker setup phases have separate timings",
  );
  assert.ok(
    worker.ticks > 0,
    "Page timers must run while the worker initializes",
  );
  const snapshot = await b.evaluate("__AVBD_LAB__.client.snapshot()");
  assert.equal(snapshot.galton.queued, 40000);
  assert.equal(snapshot.galton.released, 0);
  assert.ok(snapshot.poses.every(Number.isFinite));
  assert.deepEqual(snapshot.errors, []);
  results.push({
    mode: "default-worker",
    elapsedMs: performance.now() - started,
    ...worker,
    screenshot: "screenshots/galton-worker-startup.png",
  });
  await b.screenshot("test-results/screenshots/galton-worker-startup.png");
  await b.evaluate("__AVBD_LAB__.dispose()");

  await b.navigate(
    "?demo=canonical&scene=3d-marble-cascade&backend=gpu&scope=main&paused=1",
  );
  await ready("globalThis.__AVBD_LAB__?.diagnostics.ready");
  assert.equal(await b.evaluate("location.pathname"), "/");
  await checkLoading();
  await b.evaluate("__AVBD_LAB__.dispose()");
  results.push({ mode: "explicit-main", passed: true });

  // Exercise automatic fallback on the same scene, without a Worker API.
  await b.call("Page.addScriptToEvaluateOnNewDocument", {
    source: "globalThis.Worker=undefined",
  });
  await b.navigate(
    "?demo=canonical&scene=3d-marble-cascade&backend=gpu&paused=1",
  );
  await ready("globalThis.__AVBD_LAB__?.diagnostics.ready");
  assert.equal(await b.evaluate("location.pathname"), "/");
  await checkLoading();
  assert.equal(
    await b.evaluate(
      "document.querySelector('#lab-execution select [value=worker]').disabled",
    ),
    true,
  );
  await b.evaluate("__AVBD_LAB__.dispose()");
  results.push({ mode: "unsupported-worker-fallback", passed: true });
  assert.deepEqual(b.errors, []);
  await writeAtomicFile(
    "test-results/galton-startup.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
  console.log(JSON.stringify({ passed: true, results }));
} finally {
  await b.close();
}
