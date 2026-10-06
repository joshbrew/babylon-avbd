import { buildCanonicalScene } from "../demo/canonicalScenes.js";
import { CanonicalRenderer } from "../demo/canonicalRenderer.js";
import { GpuRenderer2D } from "../demo/gpuRenderer2D.js";
import {
  createBabylonEngine,
  BabylonRenderer2D,
  BabylonRenderer3D,
} from "../demo/babylonGpuRenderer.js";
import { NativeGpuSolver2D } from "../src/native/solver2D.js";
import { NativeGpuSolver3D } from "../src/native/solver3D.js";
import {
  appGpuSolverOptions,
  sceneGpuSolverOptions,
} from "../src/gpu/gpuSolverOptions.js";
import { parallelParams } from "../reference/three-avbd/src/avbd2d/ref/solver.ts";
import { GpuSleep } from "../src/gpu/gpuSleep.js";

const summarize = (values) => {
  const ordered = values.toSorted((a, b) => a - b);
  return {
    median: ordered[Math.floor(ordered.length / 2)],
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    p95: ordered[
      Math.min(ordered.length - 1, Math.floor(ordered.length * 0.95))
    ],
    samples: values.length,
  };
};
function fit2D(sim, width, height) {
  const low = [Infinity, Infinity],
    high = [-Infinity, -Infinity];
  let count = 0;
  for (let i = 0; i < sim.bodyCount; i++) {
    const size = sim.size(i);
    if (!sim.isDynamic(i) && Math.max(...size) >= 60) continue;
    const pose = sim.pose(i),
      c = Math.abs(Math.cos(pose[2])),
      s = Math.abs(Math.sin(pose[2])),
      extent = [
        (c * size[0] + s * size[1]) / 2,
        (s * size[0] + c * size[1]) / 2,
      ];
    for (let a = 0; a < 2; a++) {
      low[a] = Math.min(low[a], pose[a] - extent[a]);
      high[a] = Math.max(high[a], pose[a] + extent[a]);
    }
    count++;
  }
  if (!count) {
    low.splice(0, 2, -12, -3);
    high.splice(0, 2, 12, 12);
  }
  low[1] = Math.min(-2, low[1]);
  return {
    x: (low[0] + high[0]) / 2,
    y: (low[1] + high[1]) / 2,
    scale: Math.max(
      0.01,
      Math.min(
        (width - 100) / (high[0] - low[0]),
        (height - 150) / (high[1] - low[1]),
      ),
    ),
  };
}

async function settleQueue(device) {
  let timeout;
  try {
    await Promise.race([
      device.queue.onSubmittedWorkDone().catch(() => {}),
      new Promise((resolve) => {
        timeout = setTimeout(resolve, 3000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function createRendererBenchmarkSession({
  width = 960,
  height = 540,
} = {}) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 128 ||
    height < 128 ||
    width > 4096 ||
    height > 4096
  )
    throw Error("Invalid renderer comparison resolution");
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${width}px`,
    height: `${height}px`,
    opacity: "0",
    pointerEvents: "none",
  });
  const canvases = [
    document.createElement("canvas"),
    document.createElement("canvas"),
  ];
  for (const canvas of canvases) {
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: `${width}px`,
      height: `${height}px`,
    });
    host.append(canvas);
  }
  document.body.append(host);
  try {
    const created = await createBabylonEngine(canvases[1], false);
    const session = {
      ...created,
      canvases,
      host,
      width,
      height,
      disposed: false,
    };
    session.dispose = async () => {
      if (session.disposed) return;
      session.disposed = true;
      await settleQueue(session.device);
      session.engine.dispose();
      host.remove();
    };
    return session;
  } catch (error) {
    host.remove();
    throw error;
  }
}

export async function rendererBenchmark(
  scene,
  {
    warmup = 20,
    samples = 30,
    width = 960,
    height = 540,
    broadphase = "auto",
    shouldStop = () => false,
    session: provided,
  } = {},
) {
  for (const [name, value, min, max] of [
    ["warmup", warmup, 0, 600],
    ["samples", samples, 1, 600],
    ["width", width, 128, 4096],
    ["height", height, 128, 4096],
  ])
    if (!Number.isInteger(value) || value < min || value > max)
      throw Error(`Invalid renderer benchmark ${name}`);
  if (
    provided &&
    (provided.disposed ||
      provided.width !== width ||
      provided.height !== height)
  )
    throw Error("Renderer session is disposed or has a different resolution");
  if (provided?.busy)
    throw Error("A renderer comparison is already using this session");
  if (provided) provided.busy = true;
  let session = provided,
    gpu,
    sleep,
    direct,
    babylon;
  const errors = [];
  const captureError = (e) => errors.push(e.error.message);
  try {
    session ??= await createRendererBenchmarkSession({ width, height });
    const { canvases } = session;
    const { device, engine } = session;
    if (!device.features.has("timestamp-query"))
      throw Error("Renderer comparison requires GPU timestamp queries.");
    device.addEventListener("uncapturederror", captureError);
    const built = buildCanonicalScene(scene, "gpu"),
      dimension = built.def.dimension;
    if (dimension === 2) {
      Object.assign(built.sim.solver.params, parallelParams(), built.gpuParams);
      const options = {
        bodyCapacity: built.sim.bodyCount + 4096,
        ...built.gpuOptions2D,
      };
      gpu = built.scene
        ? built.scene.createSolver(device, options)
        : new NativeGpuSolver2D(device, built.sim.solver, options);
      const sim = {
        solver: gpu,
        dragBody: -1,
        get bodyCount() {
          return gpu.bodyCount;
        },
      };
      const camera = fit2D(built.sim, width, height);
      direct = new GpuRenderer2D(
        device,
        canvases[0],
        sim,
        () => camera,
        built.renderOptions2D,
      );
      babylon = new BabylonRenderer2D(device, canvases[1], sim, () => camera, {
        ...built.renderOptions2D,
        engine,
      });
    } else {
      const options = appGpuSolverOptions(built.solver, {
        bodyCapacity: built.solver.bodies.length,
        spatialSort: true,
        ...sceneGpuSolverOptions(scene),
        ...built.gpuOptions,
        broadphase,
        solverMode: "auto",
      });
      gpu = built.scene
        ? built.scene.createSolver(device, options)
        : new NativeGpuSolver3D(device, built.solver, options);
      if (built.def.benchmark) sleep = new GpuSleep(device, built.solver, gpu);
      direct = new CanonicalRenderer(device, canvases[0], built.solver, gpu, {
        enhanced: false,
      });
      babylon = new BabylonRenderer3D(device, canvases[1], built.solver, gpu, {
        engine,
        enhanced: false,
      });
      if (built.camera) {
        direct.setCamera(built.camera);
        babylon.setCamera(built.camera);
      }
    }
    Object.assign(gpu.params, built.gpuParams);
    await babylon.ready();
    const rows = { webgpu: [], babylon: [] },
      physics = [];
    const selected = Uint32Array.from([
      ...new Set(
        [0, Math.floor(gpu.bodyCount / 2), gpu.bodyCount - 1].filter(
          (i) => i >= 0 && i < gpu.bodyCount,
        ),
      ),
    ]);
    let identical = true,
      peakContacts = 0;
    const draw = async (renderer) => {
      const prior = renderer.timer.samples,
        copyPrior = renderer.babylon?.copyTimer.samples,
        drawPrior =
          renderer.babylon?.engine.gpuTimeInFrameForMainPass.counter.count;
      const start = performance.now();
      renderer.draw(false);
      const cpu = performance.now() - start;
      await device.queue.onSubmittedWorkDone();
      const completion = performance.now() - start;
      const waitStart = performance.now();
      while (
        renderer.timer.samples === prior ||
        (renderer.babylon &&
          (renderer.babylon.copyTimer.samples === copyPrior ||
            renderer.babylon.engine.gpuTimeInFrameForMainPass.counter.count ===
              drawPrior))
      ) {
        if (performance.now() - waitStart > 15000)
          throw Error("Renderer GPU timestamp timed out.");
        await new Promise((r) => setTimeout(r, 0));
      }
      const stats = renderer.renderStats;
      return {
        drawMs: stats?.gpuDrawMs ?? renderer.timer.latestMs,
        copyMs: stats?.gpuCopyMs ?? 0,
        cpuMs: cpu,
        completionMs: completion,
        copiedBytes: stats?.copiedBytes ?? 0,
        poseDownloads: stats?.poseDownloads ?? 0,
        matrixUpdates: stats?.matrixUpdates ?? 0,
      };
    };
    for (let step = 0; step < warmup + samples; step++) {
      if (shouldStop())
        throw new DOMException("Renderer comparison stopped", "AbortError");
      let profile;
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(Error("Physics timestamp timed out")),
          15000,
        );
        gpu.profileNextStep((p) => {
          profile = p;
          clearTimeout(timeout);
          resolve();
        });
        sleep?.before();
        gpu.step();
        sleep?.after();
      });
      const counters = await gpu.readCounters();
      if (counters.overflow || counters.clashes)
        throw Error(`Incomplete physics step: ${JSON.stringify(counters)}`);
      peakContacts = Math.max(peakContacts, counters.contacts ?? 0);
      if ((step + 1) % 20 === 0) gpu.adapt(counters);
      const before = await gpu.readSelectedBodies(selected);
      for (const kind of step % 2
        ? ["babylon", "webgpu"]
        : ["webgpu", "babylon"]) {
        const measured = await draw(kind === "babylon" ? babylon : direct);
        if (step >= warmup) rows[kind].push(measured);
      }
      const after = await gpu.readSelectedBodies(selected);
      identical &&=
        before.length === after.length &&
        before.every((value, i) => Object.is(value, after[i]));
      if (!identical) throw Error("Rendering changed live physics state.");
      if (step >= warmup) physics.push(profile.total);
    }
    const poses = await gpu.readBodies();
    if (!poses.every(Number.isFinite) || errors.length)
      throw Error(errors.join("\n") || "Non-finite physics poses");
    const summarizeRows = (kind) =>
      Object.fromEntries(
        ["drawMs", "copyMs", "cpuMs", "completionMs"].map((key) => [
          key,
          summarize(rows[kind].map((r) => r[key])),
        ]),
      );
    return {
      scene,
      name: built.def.name,
      dimension,
      bodyCount: gpu.bodyCount,
      params: { ...gpu.params },
      adapter: {
        vendor: session.info.vendor,
        architecture: session.info.architecture,
        description: session.info.description,
      },
      width,
      height,
      warmup,
      samples,
      physics: summarize(physics),
      webgpu: summarizeRows("webgpu"),
      babylon: summarizeRows("babylon"),
      records: rows,
      identicalState: identical,
      finite: true,
      peakContacts,
      errors,
      passed: true,
      engineSession: provided
        ? "Reused engine; fresh physics world"
        : "Fresh engine and physics world",
      method:
        "Both renderers draw each completed physics step on the same GPUDevice. Order alternates. Identical shaders, geometry, camera, resolution, no antialiasing and no debug overlays. GPU draw timestamps exclude copies; GPU copy time and CPU submission are separate. Completion is CPU submission through GPU queue completion, not display FPS. Selected complete body records match before and after drawing. No render pose downloads or per-frame CPU instance matrix updates.",
    };
  } finally {
    if (session) await settleQueue(session.device);
    direct?.dispose();
    babylon?.dispose();
    sleep?.dispose();
    gpu?.destroy();
    session?.device.removeEventListener("uncapturederror", captureError);
    if (provided) provided.busy = false;
    if (!provided) await session?.dispose();
  }
}
