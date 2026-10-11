import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";

const b = await browserCheck(),
  results = [],
  baselines = new Map();
async function ready() {
  for (let i = 0; i < 600; i++) {
    const state = await b.evaluate(
      "({ready:globalThis.__WORKER_BENCH__?.ready,errors:globalThis.__WORKER_BENCH__?.errors})",
    );
    if (state.errors?.length) throw Error(JSON.stringify(state));
    if (state.ready) return;
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Worker comparison did not initialize");
}
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await b.navigate("tests/workers.html?scene=3d-sphere-contacts");
  if (process.argv.includes("--debug")) {
    await new Promise((r) => setTimeout(r, 2500));
    console.log(
      await b.evaluate(
        "({text:document.body.innerText,errors:globalThis.__WORKER_BENCH__?.errors})",
      ),
    );
    console.log(
      await b.evaluate(
        "import('/dist/simulation-worker.js').then(()=>'ok').catch(e=>e.stack)",
      ),
    );
    console.log(b.errors);
    process.exitCode = 1;
  } else {
    await ready();
    for (const backend of ["gpu", "cpu"])
      for (const scene of ["3d-sphere-contacts", "2d-pyramid"])
        for (const scope of ["main", "worker", "worker-sab"]) {
          const options = {
            scene,
            backend,
            renderer: "webgpu",
            scope,
            paused: true,
          };
          const info = await b.evaluate(
            `__WORKER_BENCH__.load(${JSON.stringify(options)})`,
          );
          await b.evaluate("__WORKER_BENCH__.client.step(30)");
          const s = await b.evaluate("__WORKER_BENCH__.client.snapshot()");
          assert.ok(s.poses.every(Number.isFinite));
          assert.equal(s.bodies, info.bodies);
          assert.deepEqual(s.errors, []);
          const key = `${backend}/${scene}`,
            baseline = baselines.get(key);
          if (!baseline) baselines.set(key, s);
          else {
            assert.equal(s.iterations, baseline.iterations);
            assert.equal(s.timeStep, baseline.timeStep);
            assert.ok(
              Math.max(
                ...s.poses.map((v, i) => Math.abs(v - baseline.poses[i])),
              ) < 0.01,
              "Worker execution must preserve the scene trajectory",
            );
          }
          const moved = await b.evaluate(
            `(async()=>{const c=__WORKER_BENCH__.client;c.input('pointerdown',{clientX:10,clientY:10,pointerId:1,button:0,buttons:1,altKey:true});c.pointerMove({clientX:70,clientY:50,pointerId:1,buttons:1,altKey:true});await new Promise(r=>setTimeout(r,40));c.input('pointerup',{clientX:70,clientY:50,pointerId:1,button:0});return c.snapshot();})()`,
          );
          assert.ok(
            moved.inputs >= 3,
            "Pointer input must reach the simulation",
          );
          assert.notDeepEqual(
            moved.camera,
            s.camera,
            "Forwarded drag must move the camera",
          );
          results.push({
            scene,
            backend,
            scope,
            bodies: s.bodies,
            passed: true,
          });
          console.log(JSON.stringify(results.at(-1)));
        }
    for (const scene of ["3d-sphere-contacts", "2d-pyramid"]) {
      await b.evaluate(
        `__WORKER_BENCH__.load(${JSON.stringify({ scene, backend: "gpu", renderer: "babylon", scope: "worker", paused: true })})`,
      );
      await b.evaluate("__WORKER_BENCH__.client.step(30)");
      const s = await b.evaluate("__WORKER_BENCH__.client.snapshot()");
      assert.deepEqual(s.errors, []);
      results.push({
        scene,
        renderer: "babylon",
        scope: "worker",
        passed: true,
      });
    }
    assert.deepEqual(b.errors, []);
    await b.evaluate(
      "__WORKER_BENCH__.load({scene:'3d-pyramid',backend:'cpu',renderer:'webgpu',scope:'worker',paused:true})",
    );
    await b.evaluate("document.getElementById('recorded').onclick()");
    assert.equal(
      await b.evaluate("document.querySelectorAll('#results tr').length"),
      6,
      "Recorded results must appear for the selected scene",
    );
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1400,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.screenshot("test-results/screenshots/workers.png");
    await writeFile(
      "test-results/workers.json",
      JSON.stringify(
        {
          passed: true,
          results,
          errors: b.errors,
          screenshot: "screenshots/workers.png",
        },
        null,
        2,
      ),
    );
    const ordinary = await browserCheck({ isolated: false });
    try {
      await ordinary.navigate("tests/workers.html?scene=2d-pyramid");
      for (let i = 0; i < 600; i++) {
        if (await ordinary.evaluate("globalThis.__WORKER_BENCH__?.ready"))
          break;
        await new Promise((r) => setTimeout(r, 50));
      }
      assert.equal(await ordinary.evaluate("crossOriginIsolated"), false);
      await ordinary.evaluate(
        "__WORKER_BENCH__.load({scene:'2d-pyramid',backend:'cpu',renderer:'webgpu',scope:'worker',paused:true})",
      );
      await ordinary.evaluate("__WORKER_BENCH__.client.step(10)");
      const rejection = await ordinary.evaluate(
        "__WORKER_BENCH__.load({scene:'2d-pyramid',backend:'cpu',renderer:'webgpu',scope:'worker-sab',paused:true}).then(()=>null).catch(e=>e.message)",
      );
      assert.match(rejection, /isolation/);
      assert.deepEqual(ordinary.errors, []);
    } finally {
      await ordinary.close();
    }
  }
} finally {
  await b.close();
}
