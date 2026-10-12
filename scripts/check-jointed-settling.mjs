import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/settling-performance.js"],
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/settling-performance.js",
});
const b = await browserCheck(),
  results = process.argv.includes("--view-only")
    ? JSON.parse(await readFile("test-results/jointed-settling.json", "utf8"))
        .results
    : [];
async function ready() {
  for (let i = 0; i < 1200; i++) {
    const state = await b.evaluate(
      "({ready:globalThis.__AVBD_LAB__?.diagnostics.ready,errors:globalThis.__AVBD_LAB__?.diagnostics.errors})",
    );
    if (state.errors?.length) throw Error(state.errors.join("\n"));
    if (state.ready) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw Error("Jointed-drop view did not initialize");
}
try {
  await b.navigate("test-results/solver-performance.html");
  for (const sleeping of process.argv.includes("--view-only")
    ? []
    : [false, "conservative", true]) {
    const result = await b.evaluate(
      `(async()=>{const {profileSettling}=await import('/.temp/settling-performance.js');return profileSettling({scene:'showcase-jointed-drop-34k',sleeping:${JSON.stringify(sleeping)},steps:1800});})()`,
    );
    results.push(result);
    assert.deepEqual(result.errors, []);
    const windows = [100, 300, 600, 900, 1200, 1800].map((end) => {
      const samples = result.samples.filter(
        (s) => s.step > end - 100 && s.step <= end,
      );
      const mean = (key) =>
        samples.reduce((sum, s) => sum + key(s), 0) / samples.length;
      return {
        throughStep: end,
        physicsMs: mean((s) => s.physicsMs),
        collisionMs: mean((s) => s.profile.collision),
        solveMs: mean((s) => s.profile.solve),
        contacts: mean((s) => s.counters.contacts),
        sleeping: samples.at(-1).sleep.sleeping,
        overflow: Math.max(...samples.map((s) => s.counters.overflow)),
        clashes: Math.max(...samples.map((s) => s.counters.clashes)),
        colors: samples.at(-1).colors,
      };
    });
    result.windows = windows;
    await writeAtomicFile(
      "test-results/jointed-settling.json",
      JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
    );
    console.log(JSON.stringify({ sleeping, windows }));
    assert.ok(
      result.samples.every((s) => !s.counters.overflow && !s.counters.clashes),
      "Settling must retain valid contact storage and conflict-free solve groups",
    );
    if (sleeping === true)
      assert.equal(
        result.islands,
        true,
        "Large jointed scenes automatically use group sleeping",
      );
  }
  await b.navigate(
    "?demo=canonical&scene=showcase-jointed-drop-34k&backend=gpu&scope=worker&quality=enhanced&paused=1",
  );
  await ready();
  const view = [];
  for (const phase of ["falling", "settled"]) {
    if (phase === "settled") await b.evaluate("__AVBD_LAB__.step(1710)");
    const result = await b.evaluate(
      "__AVBD_LAB__.client.benchmark({warmup:30,samples:60})",
    );
    assert.deepEqual(result.errors, []);
    assert.equal(result.counters.overflow, 0);
    assert.equal(result.counters.clashes, 0);
    view.push({ phase, ...result });
    console.log(
      JSON.stringify({
        phase,
        physicsMs: result.physicsMs,
        drawMs: result.drawMs,
        frameMs: result.frameMs,
      }),
    );
  }
  await b.screenshot(
    "test-results/screenshots/showcase-jointed-drop-34k-gpu.png",
  );
  await b.evaluate("__AVBD_LAB__.dispose()");
  await writeAtomicFile(
    "test-results/jointed-settling.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        ...(await gpuBenchmarkHardware(results[0]?.adapter)),
        method:
          "GPU timestamp samples at 60 Hz and ten AVBD iterations through 30 seconds of settling, using the demo's desktop storage limits. Contact overflow and solve-group conflicts are checked on every step. Physics-only runs compare sleeping off, whole-world waking and automatic connected-group sleeping. The worker view also draws at enhanced quality and measures falling and settled frames. Frame intervals are browser-dependent; GPU drawing and physics are recorded separately.",
        results,
        view,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(b.errors, []);
} finally {
  await b.close();
}
