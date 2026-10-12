import { buildCanonicalScene } from "../demo/lab/scenes.js";
import { sceneGpuSolverOptions } from "../src/gpu/gpuSolverOptions.js";
import { NativeGpuSolver3D } from "../src/native/solver3D.js";
import {
  createWebGPUDevice,
  prepareWebGPUDevice3D,
} from "../src/gpu/device.js";

/** Sample complete GPU steps as a scene lands, including sleep/wake work. */
export async function profileSettling({ scene, sleeping, steps = 900 }) {
  const { device, adapter } = await createWebGPUDevice({
    preferredLimits: {
      maxStorageBuffersPerShaderStage: 9,
      maxStorageBufferBindingSize: 512 * 1024 * 1024,
      maxBufferSize: 1024 * 1024 * 1024,
    },
  });
  const errors = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let gpu, query, resolve, read;
  try {
    await prepareWebGPUDevice3D(device);
    if (!device.features.has("timestamp-query"))
      throw Error("GPU timestamps are required for this check");
    const built = buildCanonicalScene(scene, "gpu");
    gpu = new NativeGpuSolver3D(device, built.solver, {
      ...sceneGpuSolverOptions(scene),
      ...built.gpuOptions,
    });
    Object.assign(gpu.params, built.gpuParams);
    if (sleeping)
      gpu.enableSleeping({
        timeThreshold: 0.3,
        ...(sleeping === "conservative" ? { islands: false } : {}),
      });
    query = device.createQuerySet({ type: "timestamp", count: 2 });
    resolve = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
    });
    read = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const pre = gpu.encodeStepPrelude.bind(gpu),
      post = gpu.encodeStepPostlude.bind(gpu);
    let measuring = false;
    gpu.encodeStepPrelude = (e) => {
      if (measuring)
        e.beginComputePass({
          timestampWrites: { querySet: query, beginningOfPassWriteIndex: 0 },
        }).end();
      pre(e);
    };
    gpu.encodeStepPostlude = (e) => {
      post(e);
      if (measuring) {
        e.beginComputePass({
          timestampWrites: { querySet: query, endOfPassWriteIndex: 1 },
        }).end();
        e.resolveQuerySet(query, 0, 2, resolve, 0);
        e.copyBufferToBuffer(resolve, 0, read, 0, 16);
      }
    };
    const samples = [];
    for (let step = 1; step <= steps; step++) {
      measuring = step % 10 === 0;
      let profile;
      const detailed = measuring
        ? new Promise((resolve) => {
            if (!gpu.profileDetailedNextStep(resolve))
              throw Error("GPU profile unavailable");
          })
        : null;
      gpu.step();
      const counters = await gpu.readCounters();
      if (counters.overflow || counters.clashes)
        throw Error(
          `Invalid settling step ${step}: ${JSON.stringify(counters)}`,
        );
      if (!measuring) continue;
      await read.mapAsync(GPUMapMode.READ);
      const stamps = new BigUint64Array(read.getMappedRange());
      const physicsMs = Number(stamps[1] - stamps[0]) / 1e6;
      read.unmap();
      profile = await detailed;
      const sleep = await gpu.readSleepStats();
      samples.push({
        step,
        physicsMs,
        profile,
        counters,
        sleep,
        colors: gpu.colorCap,
        rounds: gpu.colorRounds,
        capacities: {
          pairs: gpu.pairCapacity,
          manifolds: gpu.manifoldCapacity,
          contacts: gpu.contactCapacity,
        },
      });
      gpu.adapt(counters);
    }
    const poses = await gpu.readBodies();
    if (!poses.every(Number.isFinite)) throw Error("Nonfinite body pose");
    return {
      scene,
      sleeping,
      islands: gpu.sleeping?.islands ?? false,
      steps,
      objects: gpu.bodyCount,
      joints: gpu.jointCount,
      iterations: gpu.params.iterations,
      dt: gpu.params.dt,
      adapter: {
        vendor: adapter.info.vendor,
        description: adapter.info.description,
      },
      samples,
      errors,
    };
  } finally {
    gpu?.destroy();
    query?.destroy();
    resolve?.destroy();
    read?.destroy();
    device.destroy();
  }
}
