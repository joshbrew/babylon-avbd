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
  let slot, dragPoint, heldIndex, witnessIndex, witnessPose;
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
        const state = new Uint32Array(
          await readBuffer(device, gpu.sleeping.state),
        );
        const rootOf = (index) => {
          while (state[index * 8 + 5] !== index) index = state[index * 8 + 5];
          return index;
        };
        const heldRoot = rootOf(index);
        witnessIndex = built.solver.bodies
          .map((_, i) => gpu.gpuIndex(i))
          .find(
            (i) =>
              state[i * 8 + 2] &&
              rootOf(i) !== heldRoot &&
              Math.hypot(...dragPoint.map((v, k) => v - p[i * 40 + k])) > 20,
          );
        if (witnessIndex === undefined)
          throw Error(
            "No separate sleeping group available to verify drag isolation",
          );
        witnessPose = Array.from(
          p.slice(witnessIndex * 40, witnessIndex * 40 + 8),
        );
        slot = gpu.appendJoint(-1, index, dragPoint, [0, 0, 0], 1000, 0);
      }
      if (slot !== undefined) gpu.setWorldAnchor(slot, dragPoint);
      gpu.step();
      if (step % 10 !== 9) continue;
      const stats = await gpu.readSleepStats();
      const counters = await gpu.readCounters();
      if (witnessIndex !== undefined) {
        const state = new Uint32Array(
          await readBuffer(device, gpu.sleeping.state),
        );
        if (!state[witnessIndex * 8 + 2])
          throw Error("Dragging woke a disconnected sleeping group");
      }
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
    const roots = new Set(),
      groups = new Map();
    const stateFloat = new Float32Array(state.buffer);
    for (let i = 0; i < gpu.bodyCount; i++) {
      let root = i;
      for (let depth = 0; state[root * 8 + 5] !== root; depth++) {
        if (depth >= gpu.bodyCount) throw Error("Cyclic sleep island");
        root = state[root * 8 + 5];
        if (root >= gpu.bodyCount) throw Error("Invalid sleep island");
      }
      roots.add(root);
      const group = groups.get(root) ?? {
        root,
        bodies: 0,
        awake: 0,
        unready: 0,
        unsupported: 0,
        flags: state[root * 8 + 6],
      };
      group.bodies++;
      if (!state[i * 8 + 2] && stateFloat[i * 8] > 0) {
        group.awake++;
        group.unready += Number(
          stateFloat[i * 8 + 1] + gpu.params.dt < gpu.sleeping.delay,
        );
        group.unsupported += Number(!state[i * 8 + 3]);
      }
      groups.set(root, group);
    }
    const poses = await gpu.readBodies();
    if (
      witnessIndex !== undefined &&
      !witnessPose.every((v, k) => v === poses[witnessIndex * 40 + k])
    )
      throw Error("A disconnected sleeper's pose changed while dragging");
    const speeds = [],
      quiet = [],
      unsupported = [];
    for (let i = 0; i < gpu.bodyCount; i++) {
      if (stateFloat[i * 8] <= 0 || state[i * 8 + 2]) continue;
      speeds.push(
        Math.hypot(...poses.slice(i * 40 + 32, i * 40 + 35)) +
          Math.hypot(...poses.slice(i * 40 + 36, i * 40 + 39)) *
            poses[i * 40 + 23],
      );
      quiet.push(stateFloat[i * 8 + 1]);
      if (!state[i * 8 + 3]) unsupported.push(i);
    }
    speeds.sort((a, b) => a - b);
    return {
      samples,
      roots: roots.size,
      errors,
      isolatedDrag: witnessIndex !== undefined,
      groups: [...groups.values()]
        .sort((a, b) => b.bodies - a.bodies)
        .slice(0, 5),
      motion: {
        awake: speeds.length,
        belowThreshold: speeds.filter((v) => v <= gpu.sleeping.speed).length,
        speedMedian: speeds[Math.floor(speeds.length / 2)],
        speedP95: speeds[Math.floor(speeds.length * 0.95)],
        quietLongEnough: quiet.filter((v) => v >= gpu.sleeping.delay).length,
        unsupported: unsupported.length,
      },
    };
  } finally {
    gpu.destroy();
    device.destroy();
  }
}
