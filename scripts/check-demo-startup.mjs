import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";

const b = await browserCheck(),
  results = [];
async function ready() {
  for (let i = 0; i < 2400; i++) {
    const s = await b.evaluate(
      "({ready:globalThis.__WORKER_BENCH__?.ready,errors:globalThis.__WORKER_BENCH__?.errors})",
    );
    if (s.errors?.length) throw Error(s.errors.join("\n"));
    if (s.ready) return;
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error("Scene startup timed out");
}
try {
  await b.navigate("tests/workers.html?scene=3d-empty&scope=worker&paused=1");
  await ready();
  const all = await b.evaluate(
    "Array.from(document.querySelector('#scene').options,o=>o.value)",
  );
  const scenes = process.argv.includes("--all")
    ? all
    : [
        "3d-ground",
        "2d-pyramid",
        "2d-stress-pile-100k",
        "2d-slingshot-siege",
        "3d-marble-cascade",
        "3d-tornado-town",
        "3d-domino-spiral",
        "showcase-ragdolls-on-cloth-24k",
        "showcase-box-columns-100k",
        "paper-walls-510k-4",
        "3d-static-terrain",
        "naval",
      ];
  await b.evaluate("__WORKER_BENCH__.client.destroy()");
  for (const scene of scenes) {
    const start = performance.now();
    await b.navigate(
      `tests/workers.html?scene=${scene}&scope=worker&backend=gpu&paused=1`,
    );
    await ready();
    const info = await b.evaluate("__WORKER_BENCH__.client.info");
    assert.equal(info.scene, scene);
    assert.equal(info.worker, true);
    assert.ok(info.bodies > 0 || scene.endsWith("empty"));
    assert.ok(Number.isFinite(info.startupMs));
    const result = {
      ...info,
      navigationMs: performance.now() - start,
      passed: true,
    };
    results.push(result);
    console.log(
      `${scene}: ${info.bodies.toLocaleString()} bodies, ${(info.startupMs / 1000).toFixed(2)} s initialization`,
    );
    await b.evaluate("__WORKER_BENCH__.client.destroy()");
  }
  assert.deepEqual(b.errors, []);
  await writeAtomicFile(
    "test-results/demo-startup.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        ...(await gpuBenchmarkHardware(results[0]?.adapter)),
        method:
          "One paused initialization per scene in a dedicated worker. Includes scene building, GPU contact qualification, physics and rendering setup; excludes simulation steps. Browser/driver caches may warm between scenes. These are startup times, not frame times.",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
