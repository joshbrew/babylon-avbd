import { buildCanonicalScene } from "../demo/lab/scenes.js";
import { sceneGpuSolverOptions } from "../src/gpu/gpuSolverOptions.js";
import { NativeGpuSolver3D } from "../src/native/solver3D.js";
import {
  createWebGPUDevice,
  prepareWebGPUDevice3D,
} from "../src/gpu/device.js";
import { readBuffer } from "./helpers/gpu.js";

export async function checkRingSleeping({ steps = 900, drag = false } = {}) {
  const { device } = await createWebGPUDevice({
    preferredLimits: { maxStorageBuffersPerShaderStage: 9 },
  });
  await prepareWebGPUDevice3D(device);
  const built = buildCanonicalScene("showcase-brick-ring-28k", "gpu");
  const gpu = new NativeGpuSolver3D(
    device,
    built.solver,
    sceneGpuSolverOptions(built.def.id),
  );
  gpu.enableSleeping({ timeThreshold: 0.3 });
  const samples = [],
    errors = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let slot, dragPoint, heldIndex;
  try {
    for (let step = 0; step < steps; step++) {
      if (drag && step === 600) {
        const p = await gpu.readBodies();
        const refIndex = built.solver.bodies.findIndex(
          (b, i) => b.mass > 0 && p[gpu.gpuIndex(i) * 40 + 19] === 0,
        );
        if (refIndex < 0) throw Error("No sleeping brick available to grab");
        const index = (heldIndex = gpu.gpuIndex(refIndex));
        dragPoint = Array.from(p.slice(index * 40, index * 40 + 3));
        slot = gpu.appendJoint(-1, index, dragPoint, [0, 0, 0], 1000, 0);
      }
      if (slot !== undefined) gpu.setWorldAnchor(slot, dragPoint);
      gpu.step();
      if (step % 10 !== 9) continue;
      const stats = await gpu.readSleepStats();
      const counters = await gpu.readCounters();
      samples.push({
        step: step + 1,
        ...stats,
        overflow: counters.overflow,
        clashes: counters.clashes,
      });
    }
    const state = new Uint32Array(await readBuffer(device, gpu.sleeping.state));
    if (heldIndex !== undefined && state[heldIndex * 8 + 2])
      throw Error("Held brick must remain awake");
    const roots = new Set();
    for (let i = 0; i < gpu.bodyCount; i++) {
      let root = i;
      for (let depth = 0; state[root * 8 + 5] !== root; depth++) {
        if (depth >= gpu.bodyCount) throw Error("Cyclic sleep island");
        root = state[root * 8 + 5];
        if (root >= gpu.bodyCount) throw Error("Invalid sleep island");
      }
      roots.add(root);
    }
    return { samples, roots: roots.size, errors };
  } finally {
    gpu.destroy();
    device.destroy();
  }
}
