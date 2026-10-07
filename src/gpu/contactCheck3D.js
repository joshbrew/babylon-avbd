import { AppGpuSolver3D } from "./appGpuSolver3D.js";
import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../../reference/three-avbd/src/avbd3d/shapes.ts";
import { capsule } from "./capsuleShape.js";

const checks = new WeakMap();
/** A small real GPU test, cached once per device. No user-world poses are changed. */
export function checkGpuContacts3D(device) {
  if (!checks.has(device)) checks.set(device, run(device));
  return checks.get(device);
}
async function run(device) {
  const result = {
    passed: false,
    steps: 180,
    cases: [],
    errors: [],
    contactCache: "normal-float-generations-v1",
    limits: {
      storageBindings: device.limits.maxStorageBuffersPerShaderStage,
      workgroupStorageBytes: device.limits.maxComputeWorkgroupStorageSize,
      workgroupInvocations: device.limits.maxComputeInvocationsPerWorkgroup,
      storageBindingBytes: device.limits.maxStorageBufferBindingSize,
    },
  };
  const scene = new Solver();
  scene.iterations = 5;
  new Rigid(scene, [16, 0.25, 16], 0, 0.6, [0, -0.125, 0]);
  new Rigid(scene, [1, 1, 1], 1, 0.6, [-2, 2, 0]);
  sphere(scene, 0.5, 1, 0.6, [0, 2.3, 0]);
  capsule(scene, 0.25, 1.6, 1, 0.6, [2, 2.5, 0]);
  let gpu;
  device.pushErrorScope("validation");
  try {
    gpu = new AppGpuSolver3D(device, scene, {
      spatialSort: false,
      bodyCapacity: 4,
      capacity: { pairs: 32, manifolds: 32, contacts: 256, colors: 8 },
    });
    gpu.params.up = [0, 1, 0];
    let contactSteps = 0;
    for (let step = 0; step < result.steps; step++) {
      gpu.step();
      if ((step + 1) % 30) continue;
      const counters = await gpu.readCounters();
      if (counters.manifolds) contactSteps++;
      if (counters.overflow || counters.clashes)
        throw Error("Incomplete GPU contact graph");
    }
    const data = await gpu.readBodies();
    for (let i = 1; i < 4; i++) {
      const p = i * 40,
        q = data.subarray(p + 4, p + 8),
        [x, y, z, w] = q;
      const extent =
        i === 1
          ? 0.5 *
            (Math.abs(2 * (x * y + w * z)) +
              Math.abs(1 - 2 * (x * x + z * z)) +
              Math.abs(2 * (y * z - w * x)))
          : i === 2
            ? 0.5
            : 0.25 + 0.55 * Math.abs(1 - 2 * (x * x + z * z));
      const floorGap = data[p + 1] - extent;
      const finite = data.subarray(p, p + 40).every(Number.isFinite);
      result.cases.push({
        shape: ["floor", "box", "sphere", "capsule"][i],
        passed: finite && floorGap >= -0.06 && floorGap < 0.12,
        floorGap,
        position: Array.from(data.subarray(p, p + 3)),
      });
    }
    result.contactSteps = contactSteps;
    result.passed = contactSteps > 0 && result.cases.every((c) => c.passed);
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    try {
      const error = await device.popErrorScope();
      if (error) result.errors.push(error.message);
    } catch (error) {
      result.errors.push(error.message);
    }
    gpu?.destroy();
  }
  result.passed = result.passed && !result.errors.length;
  return result;
}
