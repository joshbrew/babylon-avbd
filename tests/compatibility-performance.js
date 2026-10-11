import { buildCanonicalScene } from "../demo/canonicalScenes.js";
import { createWebglDemoWorld } from "../demo/webglWorld.js";
import { CpuWorld } from "../demo/cpuWorld.js";
const summarize = (values) => {
  if (!values.length) return { mean: null, median: null, p95: null, n: 0 };
  const a = values.toSorted((a, b) => a - b);
  return {
    mean: a.reduce((a, b) => a + b, 0) / a.length,
    median: a[Math.floor(a.length / 2)],
    p95: a[Math.floor(a.length * 0.95)],
    n: a.length,
  };
};
export async function compatibilityPerformance(scene, backend, warmup, count) {
  const started = performance.now(),
    built = buildCanonicalScene(scene, "gpu"),
    sceneBuildMs = performance.now() - started;
  let world, pipeline;
  try {
    if (backend === "webgl2")
      ({ world, pipeline } = await createWebglDemoWorld(built));
    else world = new CpuWorld(built, "ref");
    world.disableSleeping();
    const setup = {
        sceneBuildMs,
        initializationMs: performance.now() - started - sceneBuildMs,
      },
      samples = [];
    let peakContacts = 0,
      peakPairs = 0,
      counters;
    for (let i = 0; i < warmup + count; i++) {
      let resolveProfile;
      const profile =
        backend === "webgl2"
          ? new Promise((resolve) => (resolveProfile = resolve))
          : null;
      if (profile) world.profileNextStep(resolveProfile);
      const start = performance.now();
      world.step();
      const submission = performance.now() - start;
      const timing = profile ? await profile : null;
      if (backend === "webgl2" && !timing)
        await world.readSelectedBodies(world.bodyCount ? [0] : [], {
          posesOnly: true,
        });
      const wall = performance.now() - start;
      counters = await world.readCounters();
      if (counters.overflow || counters.clashes) {
        if (i < warmup) {
          world.adapt(counters);
          continue;
        }
        throw Error(
          "Collision storage or work groups were too small. Increase warmup or candidate capacity.",
        );
      }
      peakContacts = Math.max(peakContacts, counters.contacts);
      peakPairs = Math.max(peakPairs, counters.pairs);
      if (i >= warmup) samples.push({ ...timing, wall, submission });
      if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
    }
    const poses = await world.readBodies();
    if (!poses.every(Number.isFinite)) throw Error("Nonfinite physics state");
    let quaternionError = 0;
    if (built.def.dimension === 3)
      for (let i = 0; i < world.bodyCount; i++)
        quaternionError = Math.max(
          quaternionError,
          Math.abs(Math.hypot(...poses.subarray(i * 40 + 4, i * 40 + 8)) - 1),
        );
    if (quaternionError > 2e-4) throw Error("Invalid body rotation");
    return {
      scene,
      backend,
      dimension: built.def.dimension,
      bodyCount: world.bodyCount,
      jointCount: world.jointCount,
      params: { dt: world.params.dt, iterations: world.params.iterations },
      rendering: false,
      sleeping: false,
      timingKind:
        backend === "cpu"
          ? "CPU step time"
          : samples.some((s) => s.total !== undefined)
            ? "WebGL2 GPU elapsed queries"
            : "WebGL2 completion time; GPU timer unavailable",
      summary: Object.fromEntries(
        [
          "collision",
          "adjacency",
          "coloring",
          "solve",
          "total",
          "wall",
          "submission",
        ].map((key) => [
          key,
          summarize(samples.map((s) => s[key]).filter(Number.isFinite)),
        ]),
      ),
      peakContacts,
      peakPairs,
      counters,
      quaternionError,
      finite: true,
      verifiedSteps: warmup + count,
      setup,
      samples,
    };
  } finally {
    world?.destroy();
    pipeline?.destroy();
  }
}
