import { AvbdScene3D, createWebGPUDevice } from "../src/index.js";
import {
  nativeEditPerformance,
  nativeOverheadPerformance,
} from "./native-edit-performance.js";
import { sleepingBenchmark2D } from "./sleeping-performance2d.js";
const summary = (values) => {
  const a = [...values].sort((x, y) => x - y);
  return {
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    median: a[Math.floor(a.length / 2)],
    p95: a[Math.min(a.length - 1, Math.floor(a.length * 0.95))],
    samples: a.length,
  };
};
async function benchmarkOnce(onProgress, shouldStop) {
  const { device, adapter } = await createWebGPUDevice({
    requiredLimits: {
      maxStorageBufferBindingSize: 512 * 1024 * 1024,
      maxBufferSize: 1024 * 1024 * 1024,
      maxStorageBuffersPerShaderStage: 9,
    },
  });
  const errors = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  const report = {
    adapter: {
      ...adapter.info.toJSON?.(),
      vendor: adapter.info.vendor,
      architecture: adapter.info.architecture,
      device: adapter.info.device,
      description: adapter.info.description,
    },
    date: new Date().toISOString(),
    errors,
  };
  const checkStop = () => {
    if (shouldStop()) throw new DOMException("Benchmark stopped", "AbortError");
  };
  try {
    const s = new AvbdScene3D({ gravity: 0 });
    for (let i = 0; i < 100_000; i++)
      s.addBox([1, 1, 1], {
        position: [2 * (i % 400), 0, 2 * Math.floor(i / 400)],
      });
    const gpu = s.createSolver(device, { bodyCapacity: 100_000 }),
      indices = [0, 1777, 33333, 77777, 99999].map((i) => gpu.gpuIndex(i));
    try {
      const durations = { full: [], selected: [] };
      let verified = true;
      for (let repeat = 0; repeat < 40; repeat++) {
        checkStop();
        let full, selected;
        for (const mode of repeat % 2
          ? ["selected", "full"]
          : ["full", "selected"]) {
          const start = performance.now();
          const poses =
            mode === "full"
              ? await gpu.readBodies()
              : await gpu.readSelectedBodies(indices, { posesOnly: true });
          const ms = performance.now() - start;
          if (repeat >= 10) durations[mode].push(ms);
          if (mode === "full") full = poses;
          else selected = poses;
        }
        for (let i = 0; i < indices.length; i++)
          for (let k = 0; k < 8; k++)
            verified &&= full[indices[i] * 40 + k] === selected[i * 8 + k];
      }
      report.readback = {
        bodies: 100_000,
        mirrored: 5,
        fullBytes: 16_000_000,
        selectedBytes: 160,
        full: summary(durations.full),
        selected: summary(durations.selected),
        identicalPoses: verified,
        measurement:
          "Elapsed JavaScript time including command encoding, GPU gather/copy, mapping and allocation; excludes mesh updates and rendering. Alternating order; 10 warmups and 30 samples.",
      };
    } finally {
      gpu.destroy();
    }
    report.nativeEdits = [];
    report.nativeOverhead = [];
    for (const dimension of [2, 3]) {
      checkStop();
      onProgress(
        `Measuring packed velocity updates for 100,000 ${dimension}D bodies…`,
      );
      report.nativeEdits.push(await nativeEditPerformance(device, dimension));
      onProgress(
        `Measuring property updates and grouped queries in ${dimension}D…`,
      );
      report.nativeOverhead.push(
        await nativeOverheadPerformance(device, dimension),
      );
    }
    if (device.features.has("timestamp-query")) {
      const build = (sleeping) => {
        const scene = new AvbdScene3D({ iterations: 10 });
        scene.addBox([100, 1, 100], { mass: 0, position: [0, -0.5, 0] });
        for (let y = 0; y < 4; y++)
          for (let z = 0; z < 64; z++)
            for (let x = 0; x < 64; x++)
              scene.addBox([1, 1, 1], {
                position: [(x - 31.5) * 1.01, y + 0.5, (z - 31.5) * 1.01],
              });
        return scene.createSolver(device, {
          bodyCapacity: 16_385,
          sleeping,
          minimumColors: 16,
          minimumColorRounds: 16,
        });
      };
      const active = build(false),
        sleep = build({ speedThreshold: 0.03, timeThreshold: 0.5 });
      const query = device.createQuerySet({ type: "timestamp", count: 2 }),
        resolve = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        }),
        read = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
      const timed = async (gpu) => {
        checkStop();
        let e = device.createCommandEncoder(),
          p = e.beginComputePass({
            timestampWrites: { querySet: query, beginningOfPassWriteIndex: 0 },
          });
        p.end();
        device.queue.submit([e.finish()]);
        gpu.step();
        e = device.createCommandEncoder();
        p = e.beginComputePass({
          timestampWrites: { querySet: query, endOfPassWriteIndex: 1 },
        });
        p.end();
        e.resolveQuerySet(query, 0, 2, resolve, 0);
        e.copyBufferToBuffer(resolve, 0, read, 0, 16);
        device.queue.submit([e.finish()]);
        await read.mapAsync(GPUMapMode.READ);
        const t = new BigUint64Array(read.getMappedRange()),
          ms = Number(t[1] - t[0]) / 1e6;
        read.unmap();
        const c = await gpu.readCounters();
        if (c.overflow || c.clashes) throw Error(JSON.stringify(c));
        return ms;
      };
      try {
        onProgress("Measuring sleep checks while every body is awake…");
        const moving = { active: [], sleep: [] };
        for (let i = 0; i < 24; i++)
          for (const mode of i % 2
            ? ["sleep", "active"]
            : ["active", "sleep"]) {
            const ms = await timed(mode === "sleep" ? sleep : active);
            if (i >= 4) moving[mode].push(ms);
          }
        const initialSleeping = (await sleep.readSleepStats()).sleeping;
        if (initialSleeping !== 0)
          throw Error(
            "Awake-overhead measurement unexpectedly contains sleeping bodies",
          );
        onProgress(
          "Letting the stack settle before measuring sleeping bodies…",
        );
        for (let i = 24; i < 420; i++) {
          checkStop();
          active.step();
          sleep.step();
          if (i % 20 === 19) {
            await device.queue.onSubmittedWorkDone();
            for (const g of [active, sleep]) {
              const c = await g.readCounters();
              if (c.overflow || c.clashes) throw Error(JSON.stringify(c));
              g.adapt(c);
            }
          }
        }
        onProgress("Measuring the settled stack with sleeping off and on…");
        const durations = { active: [], sleep: [] };
        for (let i = 0; i < 40; i++)
          for (const mode of i % 2
            ? ["sleep", "active"]
            : ["active", "sleep"]) {
            const ms = await timed(mode === "sleep" ? sleep : active);
            if (i >= 10) durations[mode].push(ms);
          }
        const a = await active.readBodies(),
          b = await sleep.readBodies();
        let maxPositionDifference = 0;
        for (let i = 0; i < active.bodyCount; i++)
          for (let k = 0; k < 3; k++)
            maxPositionDifference = Math.max(
              maxPositionDifference,
              Math.abs(a[i * 40 + k] - b[i * 40 + k]),
            );
        report.sleeping = {
          bodies: active.bodyCount,
          iterations: 10,
          settledSteps: 420,
          awakeOverhead: {
            withoutSleeping: summary(moving.active),
            withSleeping: summary(moving.sleep),
            sleeping: initialSleeping,
          },
          awakePolicy: summary(durations.active),
          sleepPolicy: summary(durations.sleep),
          ...(await sleep.readSleepStats()),
          maxPositionDifference,
          finite: a.every(Number.isFinite) && b.every(Number.isFinite),
          measurement:
            "GPU elapsed interval around the entire step, including sleep support/wake/quiet passes and queue gaps. Alternating order; 10 warmups and 30 samples. Resting workload, not a paper-comparison result.",
        };
      } finally {
        active.destroy();
        sleep.destroy();
        query.destroy();
        resolve.destroy();
        read.destroy();
      }
    }
    report.sleeping2D = await sleepingBenchmark2D(
      device,
      onProgress,
      checkStop,
    );
    if (errors.length) throw Error(errors.join("\n"));
    return report;
  } finally {
    device.destroy();
  }
}

export async function packageBenchmarks({
  repeats = 3,
  onProgress = () => {},
  shouldStop = () => false,
} = {}) {
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10)
    throw Error("repeats must be 1–10");
  const runs = [];
  for (let i = 0; i < repeats; i++) {
    const progress = (message) =>
      onProgress(`Repeat ${i + 1}/${repeats}: ${message}`);
    progress("Measuring five mirrored bodies in a 100,000-body world…");
    runs.push(await benchmarkOnce(progress, shouldStop));
  }
  // WebGPU may hide the model name. Record the browser's graphics renderer too.
  const canvas = new OffscreenCanvas(1, 1),
    gl = canvas.getContext("webgl"),
    debug = gl?.getExtension("WEBGL_debug_renderer_info");
  const graphicsRenderer = debug
    ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
    : "";
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return {
    adapter: runs[0].adapter,
    graphicsRenderer,
    completed: new Date().toISOString(),
    repeats,
    runs,
  };
}
