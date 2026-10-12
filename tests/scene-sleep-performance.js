import {
  createSimulationSession,
  workerScenes,
} from "../demo/shared/runtime/simulationSession.js";
import { startMixedColliderDemo } from "../demo/mixed-colliders/index.js";
import { createWebGPUDevice } from "../src/gpu/device.js";

export const sleepBenchmarkScenes = [
  ...workerScenes.map(({ id, name, dimension }) => ({ id, name, dimension })),
  {
    id: "mixed-collider-gallery",
    name: "Mixed collider gallery · Babylon",
    dimension: 3,
  },
];
const summarize = (values) => {
  const a = values.toSorted((a, b) => a - b);
  return {
    samples: a.length,
    mean: a.reduce((s, v) => s + v, 0) / a.length,
    median: a[Math.floor(a.length / 2)],
    p95: a[Math.min(a.length - 1, Math.floor(a.length * 0.95))],
  };
};

// Instrument the encoders the real step creates. This covers both native fast
// paths and multi-submission support policies without adding CPU queue gaps
// before a single-command-buffer step or changing its dispatch selection.
function timedStep(w) {
  const d = w.s.device,
    create = d.createCommandEncoder;
  let started = false;
  d.createCommandEncoder = function (...args) {
    const e = create.apply(d, args);
    if (!started) {
      started = true;
      e.beginComputePass({
        timestampWrites: { querySet: w.query, beginningOfPassWriteIndex: 0 },
      }).end();
    }
    const finish = e.finish;
    e.finish = function (...args) {
      e.beginComputePass({
        timestampWrites: { querySet: w.query, endOfPassWriteIndex: 1 },
      }).end();
      e.resolveQuerySet(w.query, 0, 2, w.resolve, 0);
      e.copyBufferToBuffer(w.resolve, 0, w.read, 0, 16);
      return finish.apply(e, args);
    };
    return e;
  };
  try {
    w.s.step();
    if (!started) throw Error("Physics step did not encode GPU work");
  } finally {
    d.createCommandEncoder = create;
  }
}

/** Fresh paired scenes alternate execution order, at identical simulation ages. */
export async function benchmarkSceneSleeping(
  scene,
  { seconds = 8, repeat = 0 } = {},
) {
  const worlds = [];
  const graphics = await createWebGPUDevice({
    preferredLimits: {
      maxStorageBuffersPerShaderStage: 9,
      maxStorageBufferBindingSize: 512 * 1024 ** 2,
      maxBufferSize: 1024 ** 3,
    },
  });
  try {
    for (const sleeping of repeat % 2 ? [true, false] : [false, true]) {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 600;
      canvas.style.cssText = "width:800px;height:600px";
      document.body.append(canvas);
      let s;
      if (scene === "mixed-collider-gallery") {
        const root = document.createElement("div");
        document.body.append(root);
        const gallery = await startMixedColliderDemo({
          root,
          device: graphics.device,
        });
        gallery.engine.stopRenderLoop();
        const w = gallery.world;
        if (sleeping) w.enableSleeping({ timeThreshold: 0.3 });
        else w.disableSleeping();
        s = {
          device: w.device,
          gpu: w.gpu,
          dimension: 3,
          adapter: {
            vendor: graphics.adapter.info.vendor,
            description: graphics.adapter.info.description,
          },
          errors: w.errors,
          step: () => w.step(),
          readSleepStats: () => w.readSleepStats(),
          destroy: () => {
            gallery.dispose();
            root.remove();
          },
        };
      } else
        s = await createSimulationSession(
          canvas,
          {
            scene,
            backend: "gpu",
            renderer: "webgpu",
            enhanced: false,
            sleeping,
          },
          undefined,
          graphics,
        );
      const d = s.device;
      if (!d.features.has("timestamp-query"))
        throw Error("GPU timestamps required");
      const query = d.createQuerySet({ type: "timestamp", count: 2 });
      const resolve = d.createBuffer({
        size: 16,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });
      const read = d.createBuffer({
        size: 16,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      const w = {
        s,
        canvas,
        query,
        resolve,
        read,
        sleeping,
        samples: [],
        errors: [],
      };
      worlds.push(w);
      s.playground?.action("start");
      s.slingshot?.launch();
    }
    const steps = Math.ceil(seconds / worlds[0].s.gpu.params.dt);
    for (let step = 1; step <= steps; step++) {
      const ordered = step % 2 ? worlds : [...worlds].reverse();
      for (const w of ordered) {
        if (step % 10 === 0) timedStep(w);
        else w.s.step();
      }
      if (step % 10 === 0)
        for (const w of ordered) {
          const { s, read } = w;
          await read.mapAsync(GPUMapMode.READ);
          const stamps = new BigUint64Array(read.getMappedRange());
          const ms = Number(stamps[1] - stamps[0]) / 1e6;
          read.unmap();
          if (!Number.isFinite(ms) || ms <= 0)
            throw Error("Invalid GPU timestamp interval");
          const counters = await s.gpu.readCounters();
          if (counters.overflow || counters.clashes)
            w.errors.push({ step, counters });
          s.gpu.adapt?.(counters);
          w.samples.push({
            step,
            seconds: step * s.gpu.params.dt,
            ms,
            sleeping: (await s.readSleepStats()).sleeping,
            counters,
          });
        }
    }
    const runs = [];
    for (const w of worlds) {
      const poses = await w.s.gpu.readBodies();
      const summarizeWindow = (filter) =>
        summarize(w.samples.filter(filter).map((s) => s.ms));
      runs.push({
        sleeping: w.sleeping,
        finite: poses.every(Number.isFinite),
        errors: [...w.errors, ...w.s.errors],
        total: summarizeWindow((s) => s.seconds > 0.2),
        active: summarizeWindow((s) => s.seconds > 0.2 && s.seconds <= 2),
        settled: summarizeWindow((s) => s.seconds > seconds - 2),
        sleepingBodies: w.samples.at(-1)?.sleeping ?? 0,
        peakContacts: Math.max(...w.samples.map((s) => s.counters.contacts)),
        samples: w.samples,
      });
    }
    const s = worlds[0].s;
    return {
      scene,
      repeat,
      seconds,
      steps,
      objects: s.gpu.bodyCount,
      dimension: s.dimension,
      iterations: s.gpu.params.iterations,
      dt: s.gpu.params.dt,
      adapter: s.adapter,
      runs,
      passed: runs.every((r) => r.finite && !r.errors.length),
    };
  } finally {
    for (const w of worlds) {
      w.query.destroy();
      w.resolve.destroy();
      w.read.destroy();
      w.s.destroy();
      w.canvas.remove();
    }
    graphics.device.destroy();
  }
}
