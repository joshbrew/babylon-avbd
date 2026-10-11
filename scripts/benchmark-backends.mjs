import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { cpus, platform, release } from "node:os";

const quick = process.argv.includes("--quick");
const settings = {
  warmup: quick ? 10 : 60,
  samples: quick ? 10 : 60,
  repeats: quick ? 1 : 3,
  scenes: ["2d-stack", "2d-joint-grid", "3d-stack", "3d-pyramid"],
  backends: ["webgpu", "webgl2", "cpu"],
};
const browser = await browserCheck(),
  runs = [];
const report = {
  date: new Date().toISOString(),
  cpu: cpus()[0]?.model,
  os: `${platform()} ${release()}`,
  settings,
  rendering: false,
  sleeping: false,
  runs,
};
const summarize = (values) => {
  if (!values.length) return null;
  const sorted = values.toSorted((a, b) => a - b);
  return {
    mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    n: sorted.length,
  };
};
try {
  await browser.navigate("tests/performance.html");
  for (let i = 0; i < 400; i++) {
    if (await browser.evaluate("!!globalThis.__BENCHMARK_VIEW__")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.equal(await browser.evaluate("!!globalThis.__BENCHMARK_VIEW__"), true);
  report.hardware = await browser.evaluate(`(async()=>{
    await __BENCHMARK_VIEW__.suspendPreview();
    const gl=new OffscreenCanvas(1,1).getContext('webgl2');
    const debug=gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return {webgpu:__PERFORMANCE__.info,webglRenderer:renderer,userAgent:navigator.userAgent};
  })()`);
  // Rotate order between repeats to avoid consistently measuring one backend first.
  for (const scene of settings.scenes)
    for (let repeat = 0; repeat < settings.repeats; repeat++)
      for (let offset = 0; offset < settings.backends.length; offset++) {
        const backend =
          settings.backends[(offset + repeat) % settings.backends.length];
        console.log(
          `${scene}: ${backend}, repeat ${repeat + 1}/${settings.repeats}`,
        );
        const result = await browser.evaluate(
          `__PERFORMANCE__.run(${JSON.stringify(scene)},'production',${settings.warmup},${settings.samples},{backend:${JSON.stringify(backend)}})`,
        );
        assert.equal(result.finite, true);
        assert.equal(result.rendering, false);
        assert.equal(result.sleeping, false);
        assert.equal(result.counters.overflow, 0);
        assert.equal(result.counters.clashes, 0);
        assert.equal(result.samples.length, settings.samples);
        if (backend !== "cpu")
          assert.ok(
            result.summary.total?.mean > 0,
            "GPU timestamps required for this comparison",
          );
        const peer = runs.find((r) => r.scene === scene);
        if (peer) {
          assert.equal(result.bodyCount, peer.bodyCount);
          assert.equal(result.jointCount, peer.jointCount);
          assert.equal(result.params.dt, peer.params.dt);
          assert.equal(result.params.iterations, peer.params.iterations);
        }
        runs.push({ backend, repeat, ...result });
      }
  assert.deepEqual(browser.errors, []);
  report.summary = settings.scenes.flatMap((scene) =>
    settings.backends.map((backend) => {
      const matching = runs.filter(
        (r) => r.scene === scene && r.backend === backend,
      );
      const samples = matching.flatMap((r) => r.samples);
      return {
        scene,
        backend,
        bodyCount: matching[0].bodyCount,
        jointCount: matching[0].jointCount,
        dt: matching[0].params.dt,
        iterations: matching[0].params.iterations,
        physics: summarize(
          samples.map((s) => (backend === "cpu" ? s.wall : s.total)),
        ),
        submission: summarize(samples.map((s) => s.submission)),
        completedStep: summarize(samples.map((s) => s.wall)),
        initialization: summarize(
          matching.map(
            (r) => r.setup.initializationMs ?? r.setup.gpuInitializationMs,
          ),
        ),
      };
    }),
  );
  report.passed = true;
  console.table(
    report.summary.map((r) => ({
      scene: r.scene,
      backend: r.backend,
      bodies: r.bodyCount,
      iterations: r.iterations,
      physicsMs: r.physics.mean.toFixed(3),
      submissionMs: r.submission.mean.toFixed(3),
    })),
  );
} catch (error) {
  report.passed = false;
  report.error = error.stack;
  throw error;
} finally {
  await mkdir("test-results", { recursive: true });
  await writeFile(
    `test-results/backend-comparison${quick ? "-quick" : ""}.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}
