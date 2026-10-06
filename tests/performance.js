import {
  buildCanonicalScene,
  canonicalScenes,
} from "../demo/canonicalScenes.js";
import { NativeGpuSolver3D as GpuSolver3D } from "../src/native/solver3D.js";
import { NativeGpuSolver2D as GpuSolver2D } from "../src/native/solver2D.js";
import { parallelParams } from "../reference/three-avbd/src/avbd2d/ref/solver.ts";
import {
  sceneGpuSolverOptions,
  appGpuSolverOptions,
} from "../src/gpu/gpuSolverOptions.js";
import { mountPerformanceView } from "./performance-view.js";
import { GpuSleep } from "../src/gpu/gpuSleep.js";
import { pairedPerformance } from "./paired-performance.js";
import { packageBenchmarks } from "./package-performance.js";
import {
  rendererBenchmark,
  createRendererBenchmarkSession,
} from "./renderer-performance.js";

const adapter = await navigator.gpu.requestAdapter({
  powerPreference: "high-performance",
});
if (!adapter?.features.has("timestamp-query"))
  throw Error("GPU timestamps are required for solver measurements");
const device = await adapter.requestDevice({
  requiredFeatures: ["timestamp-query"],
  requiredLimits: {
    maxStorageBufferBindingSize: Math.min(
      512 * 1024 * 1024,
      adapter.limits.maxStorageBufferBindingSize,
    ),
    maxBufferSize: Math.min(1024 * 1024 * 1024, adapter.limits.maxBufferSize),
    maxStorageBuffersPerShaderStage: 9,
  },
});
const errors = [];
device.addEventListener("uncapturederror", (e) => errors.push(e.error.message));
device.lost.then((info) => errors.push(`Device lost: ${info.message}`));
const rules = {
  baseline: [2 ** 31, 2 ** 15, 2 ** 12],
  one: [1, 1, 1],
  two: [2 ** 31, 1, 1],
  four: [2 ** 31, 2 ** 31, 1],
  eight: [2 ** 31, 2 ** 31, 2 ** 31],
};
const summarize = (values) => {
  const a = values.toSorted((x, y) => x - y);
  return {
    n: a.length,
    mean: a.reduce((s, x) => s + x, 0) / a.length,
    median: a[Math.floor(a.length / 2)],
    p95: a[Math.floor(a.length * 0.95)],
  };
};
globalThis.__PERFORMANCE__ = {
  info: {
    ...adapter.info.toJSON?.(),
    vendor: adapter.info.vendor,
    architecture: adapter.info.architecture,
  },
  errors,
  scenes: canonicalScenes,
  runPackageBenchmarks: packageBenchmarks,
  runRenderers: rendererBenchmark,
  createRendererSession: createRendererBenchmarkSession,
  async runPaired(
    scene,
    variants = ["projected", "points"],
    warmup = 60,
    count = 60,
  ) {
    await globalThis.__BENCHMARK_VIEW__?.suspendPreview();
    const create = (scene, variant) => {
      const mode = variant.replace(/-detail$/, "").replace(/-sorted$/, "");
      if (
        ![
          "baseline",
          "projected",
          "points",
          "grid",
          "hploc",
          "one",
          "two",
          "four",
          "eight",
        ].includes(mode)
      )
        throw Error("Unknown paired solver variant");
      const built = buildCanonicalScene(scene, "gpu");
      if (built.def.dimension !== 3 || built.gpuOptions?.shaders)
        throw Error("This comparison requires a 3D rigid-body scene");
      const options = {
        bodyCapacity: built.solver.bodies.length,
        ...sceneGpuSolverOptions(scene),
        ...built.gpuOptions,
        cacheAdjacencyKeys: variant.includes("-sorted"),
        adaptiveScheduling: false,
        broadphase: mode === "hploc" ? "hploc" : "grid",
        solverMode:
          { baseline: "standard", projected: "optimized", points: "points" }[
            mode
          ] ?? "auto",
      };
      const gpuOptions = ["baseline", "projected", "points"].includes(mode)
        ? options
        : appGpuSolverOptions(built.solver, options);
      const gpu = built.scene
        ? built.scene.createSolver(device, gpuOptions)
        : new GpuSolver3D(device, built.solver, gpuOptions);
      if (rules[mode]) gpu.primalLanes = rules[mode];
      Object.assign(gpu.params, built.gpuParams);
      return { gpu, detailed: variant.endsWith("-detail") };
    };
    return pairedPerformance(
      { device, create, summarize, errors },
      scene,
      variants,
      warmup,
      count,
    );
  },
  async runSleepScheduling(
    batchPasses,
    warmup = 30,
    count = 60,
    { cacheAdjacencyKeys } = {},
  ) {
    if (
      !Number.isInteger(warmup) ||
      warmup < 0 ||
      !Number.isInteger(count) ||
      count < 1
    )
      throw Error("Invalid sleeping benchmark sample counts");
    await globalThis.__BENCHMARK_VIEW__?.suspendPreview();
    const built = buildCanonicalScene("3d-100k-rook-impact", "gpu");
    const gpu = new GpuSolver3D(
      device,
      built.solver,
      appGpuSolverOptions(built.solver, {
        bodyCapacity: built.solver.bodies.length,
        ...sceneGpuSolverOptions(built.def.id),
        cacheAdjacencyKeys,
      }),
    );
    const sleep = new GpuSleep(device, built.solver, gpu, { batchPasses });
    const samples = [];
    try {
      for (let step = 1; step <= warmup + count; step++) {
        const prior = sleep.physicsTimer.samples;
        sleep.before();
        gpu.step();
        sleep.after();
        const counters = await gpu.readCounters();
        if (counters.overflow || counters.clashes)
          throw Error(JSON.stringify({ step, counters }));
        if (step % 20 === 0) gpu.adapt(counters);
        const start = performance.now();
        while (sleep.physicsTimer.samples === prior) {
          if (performance.now() - start > 20000)
            throw Error("Sleeping timestamp timeout");
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        if (step > warmup)
          samples.push({
            step,
            total: sleep.physicsTimer.latestMs,
            wake: sleep.timer.latestMs,
          });
      }
      if (errors.length) throw Error(errors.join("\n"));
      const poses = await gpu.readBodies();
      if (!poses.every(Number.isFinite)) throw Error("Non-finite rook poses");
      return {
        batchPasses,
        cacheAdjacencyKeys: gpu.adjacencyCached,
        awake: await sleep.readAwake(),
        bodyCount: gpu.bodyCount,
        warmup,
        measuredSteps: count,
        finite: true,
        samples,
        summary: summarize(samples.map((p) => p.total)),
        params: { ...gpu.params },
        startupOptions: sceneGpuSolverOptions(built.def.id),
        method:
          "100K rook, identical full AVBD steps and sleeping; GPU interval from clear through awake count, snapshot copy excluded; no drawing",
      };
    } finally {
      sleep.dispose();
      gpu.destroy();
      await device.queue.onSubmittedWorkDone();
    }
  },
  async run(
    scene,
    variant = "production",
    warmup = 60,
    count = 60,
    { broadphase = "auto", detailed = false } = {},
  ) {
    await globalThis.__BENCHMARK_VIEW__?.suspendPreview();
    if (
      !Number.isInteger(warmup) ||
      warmup < 0 ||
      !Number.isInteger(count) ||
      count < 1
    )
      throw Error(
        "Warmup and sample counts must be nonnegative/positive integers",
      );
    if (
      ![
        "baseline",
        "production",
        "projected",
        "points",
        ...Object.keys(rules),
      ].includes(variant)
    )
      throw Error(`Unknown kernel variant: ${variant}`);
    const setupStart = performance.now();
    const built = buildCanonicalScene(scene, "gpu");
    const sceneBuildMs = performance.now() - setupStart;
    if (
      built.gpuOptions?.shaders &&
      !["baseline", "production"].includes(variant)
    )
      throw Error(
        "This fabric scene needs its scene-specific solver. Choose Automatic.",
      );
    const dimension = built.def.dimension;
    if (dimension === 2 && !["baseline", "production"].includes(variant))
      throw Error("3D kernel variants cannot be applied to a 2D solver");
    // Cloth lands rapidly and needs capacity before it makes contact, rather than
    // dropping contacts while waiting for the next capacity readback.
    const options =
      dimension === 3
        ? {
            bodyCapacity: Math.max(1, built.solver.bodies.length),
            ...sceneGpuSolverOptions(scene),
            ...built.gpuOptions,
            adaptiveScheduling: variant === "production",
            cacheAdjacencyKeys: variant === "production" ? undefined : false,
            broadphase,
            solverMode: built.gpuOptions?.shaders
              ? "auto"
              : ({
                  baseline: "standard",
                  projected: "optimized",
                  points: "points",
                }[variant] ?? "auto"),
          }
        : undefined;
    let gpu;
    if (dimension === 2) {
      Object.assign(built.sim.solver.params, parallelParams(), built.gpuParams);
      const options2D = {
        bodyCapacity: built.sim.bodyCount + 4096,
        ...built.gpuOptions2D,
        sleeping: false,
      };
      gpu = built.scene
        ? built.scene.createSolver(device, options2D)
        : new GpuSolver2D(device, built.sim.solver, options2D);
    } else {
      const gpuOptions =
        variant === "production"
          ? appGpuSolverOptions(built.solver, options)
          : options;
      gpu = built.scene
        ? built.scene.createSolver(device, gpuOptions)
        : new GpuSolver3D(device, built.solver, gpuOptions);
    }
    Object.assign(gpu.params, built.gpuParams);
    if (dimension === 3) gpu.primalLanes = rules[variant] || rules.baseline;
    const setup = {
      sceneBuildMs,
      gpuInitializationMs: performance.now() - setupStart - sceneBuildMs,
    };
    const samples = [];
    let counters,
      peakContacts = 0,
      peakPairs = 0;
    try {
      for (let step = 1; step <= warmup + count; step++) {
        // Each entry is a distinct hardware timestamp result, never a repeated UI sample.
        if (step > warmup) {
          const start = performance.now();
          let submissionMs;
          const profile = await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(Error("Timestamp readback timed out")),
              20000,
            );
            const profileStep =
              detailed && dimension === 3
                ? gpu.profileDetailedNextStep.bind(gpu)
                : gpu.profileNextStep.bind(gpu);
            profileStep((p) => {
              clearTimeout(timeout);
              resolve(p);
            });
            const submissionStart = performance.now();
            gpu.step();
            submissionMs = performance.now() - submissionStart;
          });
          samples.push({
            step,
            ...profile,
            submission: submissionMs,
            wall: performance.now() - start,
          });
        } else {
          gpu.step();
          await device.queue.onSubmittedWorkDone();
        }
        {
          counters = await gpu.readCounters();
          peakContacts = Math.max(peakContacts, counters.contacts);
          peakPairs = Math.max(peakPairs, counters.pairs);
          if (step > warmup)
            Object.assign(samples.at(-1), {
              contacts: counters.contacts,
              pairs: counters.pairs,
            });
          if (counters.overflow || counters.clashes)
            throw Error(
              "Invalid measured step: " + JSON.stringify({ step, counters }),
            );
          if (step % 20 === 0) gpu.adapt(counters);
        }
      }
      counters = await gpu.readCounters();
      const poses = await gpu.readBodies();
      let quaternionError = 0,
        finite = true;
      const stride = dimension === 2 ? 24 : 40;
      for (let i = 0; i < gpu.bodyCount; i++) {
        for (let j = 0; j < stride; j++)
          finite &&= Number.isFinite(poses[i * stride + j]);
        if (dimension === 3)
          quaternionError = Math.max(
            quaternionError,
            Math.abs(Math.hypot(...poses.subarray(i * 40 + 4, i * 40 + 8)) - 1),
          );
      }
      if (
        !finite ||
        quaternionError > 2e-4 ||
        counters.overflow ||
        counters.clashes ||
        errors.length
      )
        throw Error(
          JSON.stringify({ finite, quaternionError, counters, errors }),
        );
      return {
        scene,
        workload: built.workload,
        dimension,
        variant,
        bodyCount: gpu.bodyCount,
        jointCount: gpu.jointCount,
        params: { ...gpu.params },
        colorCap: gpu.colorCap,
        capacity: {
          contacts: gpu.contactCapacity,
          pairs: gpu.pairCapacity,
          manifolds: gpu.manifoldCapacity,
        },
        counters,
        peakContacts,
        peakPairs,
        finite,
        quaternionError,
        broadphase: dimension === 3 ? gpu.broadphase : "grid-2d",
        broadphaseDecision: gpu.broadphaseDecision,
        bvh: gpu.bvh ? { ...gpu.bvh.stats } : null,
        details:
          detailed && dimension === 3
            ? Object.fromEntries(
                Object.keys(samples[0].details).map((key) => [
                  key,
                  summarize(samples.map((p) => p.details[key])),
                ]),
              )
            : null,
        sleeping: false,
        rendering: false,
        verifiedSteps: warmup + count,
        solverDecision: dimension === 3 ? gpu.solverDecision : undefined,
        schedulingDecision: gpu.schedulingDecision,
        cachedAdjacency: gpu.adjacencyCached,
        primalLanes: gpu.primalLanes,
        setup,
        kernel:
          dimension === 2
            ? "canonical-2d"
            : built.gpuOptions?.shaders
              ? "cloth-points-and-rigids"
              : variant === "production"
                ? gpu.solverDecision.selected === "points"
                  ? "parallel-points"
                  : gpu.solverDecision.selected === "optimized"
                    ? "projected"
                    : "baseline"
                : variant,
        warmup,
        samples,
        summary: Object.fromEntries(
          [
            "total",
            "collision",
            "adjacency",
            "coloring",
            "solve",
            "submission",
            "wall",
          ].map((key) => [key, summarize(samples.map((p) => p[key]))]),
        ),
      };
    } finally {
      gpu.destroy();
      await device.queue.onSubmittedWorkDone();
    }
  },
};
mountPerformanceView(globalThis.__PERFORMANCE__);
