import { createWebGPUDevice, prepareWebGPUDevice3D } from "../gpu/device.js";
import { NativeCpuSolver } from "./cpu/world.js";

import { registerSolverPipeline } from "./pipelineRegistry.js";
export { isSolverPipeline } from "./pipelineRegistry.js";

/** Initialize execution once; scene builders and world commands stay unchanged. */
export async function createSolverPipeline({
  backend = "webgpu",
  device,
  gl,
  validate3D = true,
  ...deviceOptions
} = {}) {
  if (!["webgpu", "cpu"].includes(backend))
    throw Error(`Unsupported solver backend: ${backend}`);
  if (backend !== "webgpu" && device !== undefined)
    throw Error("Only WebGPU initialization accepts a GPU device");
  if (gl !== undefined)
    throw Error("Solver pipelines do not accept a WebGL context");
  let adapter,
    owned = false,
    destroyed = false;
  if (backend === "webgpu") {
    if (!device) {
      ({ device, adapter } = await createWebGPUDevice({
        ...deviceOptions,
        // Reserve supported limits once, before a scene needs hull geometry or
        // large buffers. Requesting a capacity does not allocate those buffers.
        preferredLimits: {
          maxStorageBuffersPerShaderStage: 9,
          maxStorageBufferBindingSize: 512 * 1024 * 1024,
          maxBufferSize: 1024 * 1024 * 1024,
          ...deviceOptions.preferredLimits,
        },
        validate3D,
      }));
      owned = true;
    } else if (validate3D) await prepareWebGPUDevice3D(device);
  }
  const worlds = new Set();
  const pipeline = {
    backend,
    device,
    adapter,
    createSolver(scene, options = {}) {
      if (destroyed) throw Error("The solver pipeline has been destroyed");
      if (
        !scene ||
        typeof scene.assertEditable !== "function" ||
        (!scene.ref && !scene.topology)
      )
        throw Error("An AVBD scene builder is required");
      scene.assertEditable();
      let world;
      if (backend === "webgpu") world = scene.createSolver(device, options);
      else {
        const dimension = scene.ref ? 3 : scene.topology ? 2 : 0;
        if (options.bodyBuffer !== undefined)
          throw Error("A GPU body buffer requires the WebGPU backend");
        world = new NativeCpuSolver(scene, dimension, options);
        scene.gpu = world;
        scene.created = true;
      }
      Object.defineProperty(world, "backend", {
        value: backend,
        configurable: true,
      });
      worlds.add(world);
      const destroy = world.destroy;
      world.destroy = function () {
        destroy.call(this);
        worlds.delete(this);
      };
      return world;
    },
    destroy() {
      if (destroyed) return;
      for (const world of worlds) world.destroy();
      worlds.clear();
      if (owned) device.destroy();
      destroyed = true;
    },
  };
  registerSolverPipeline(pipeline);
  return pipeline;
}
