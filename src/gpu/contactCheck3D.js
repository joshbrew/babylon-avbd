import { AppGpuSolver3D } from "./appGpuSolver3D.js";
import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../../reference/three-avbd/src/avbd3d/shapes.ts";
import { capsule } from "./capsuleShape.js";
import { IA_PAIRS } from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import { PRELUDE_3D } from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";
import { setGpuExecutionPolicy3D } from "./executionPolicy3D.js";

const checks = new WeakMap();
const modes = [
  { name: "batched-grid", broadphase: "grid", dispatchIsolation: false },
  { name: "isolated-grid", broadphase: "grid", dispatchIsolation: true },
  { name: "batched-hploc", broadphase: "hploc", dispatchIsolation: false },
  { name: "isolated-hploc", broadphase: "hploc", dispatchIsolation: true },
];
/** Cached once per device. Successful compatibility paths keep identical physics. */
export function checkGpuContacts3D(device) {
  if (!checks.has(device)) checks.set(device, runGpuContactChecks3D(device));
  return checks.get(device);
}
// configure is an internal fault-injection hook for real GPU fallback tests.
export async function runGpuContactChecks3D(device, configure) {
  const attempts = [];
  for (const mode of modes) {
    const result = await attempt(device, mode, configure);
    attempts.push(result);
    if (!result.passed) continue;
    setGpuExecutionPolicy3D(device, {
      dispatchIsolation: mode.dispatchIsolation,
      // Retain automatic scene selection when the normal grid works.
      broadphase: mode.broadphase === "hploc" ? "hploc" : undefined,
    });
    return {
      ...result,
      selected: mode.name,
      compatibility: mode.name !== modes[0].name,
      attempts,
    };
  }
  return { ...attempts[0], selected: null, compatibility: false, attempts };
}
function scene(falling) {
  const ref = new Solver();
  ref.iterations = 5;
  if (!falling) ref.gravity = 0;
  new Rigid(ref, [16, 0.25, 16], 0, 0.6, [0, -0.125, 0]);
  new Rigid(ref, [1, 1, 1], 1, 0.6, [-2, falling ? 2 : 0.45, 0]);
  sphere(ref, 0.5, 1, 0.6, [0, falling ? 2.3 : 0.45, 0]);
  capsule(ref, 0.25, 1.6, 1, 0.6, [2, falling ? 2.5 : 0.75, 0]);
  return ref;
}
async function readWords(device, source, bytes = source.size) {
  const read = device.createBuffer({
    size: bytes,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });
  try {
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(source, 0, read, 0, bytes);
    device.queue.submit([encoder.finish()]);
    await read.mapAsync(GPUMapMode.READ);
    return read.getMappedRange().slice(0);
  } finally {
    read.destroy();
  }
}
async function pipelineTrace(gpu) {
  gpu.step();
  const counters = await gpu.readCounters();
  const args = new Uint32Array(await readWords(gpu.device, gpu.argsBuffer));
  const raw = await readParams(gpu);
  const u = new Uint32Array(raw),
    f = new Float32Array(raw);
  return {
    expectedFloorPairs: 3,
    counters,
    pairs: counters.pairs ? Array.from(await gpu.readPairs()) : [],
    narrowphaseWorkgroups: Array.from(args.subarray(IA_PAIRS, IA_PAIRS + 3)),
    filters: Array.from(
      new Uint32Array(await readWords(gpu.device, gpu.filterBuffer)),
    ),
    params: {
      bodyCount: u[0],
      largeCount: u[1],
      noCollideCount: u[2],
      pairCapacity: u[3],
      contactCapacity: u[4],
      dt: f[5],
      cellSize: f[6],
      maxSmallRadius: f[7],
      up: Array.from(f.subarray(8, 11)),
    },
    stage:
      counters.pairs < 3
        ? "collision-pairs"
        : counters.manifolds < 3
          ? "contact-generation"
          : "contacts-created",
  };
}
// Read the uniform through a shader; production uniforms deliberately do not
// request COPY_SRC. This also verifies the values as the GPU actually sees them.
async function readParams(gpu) {
  const { device } = gpu;
  const output = device.createBuffer({
    size: 48,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  try {
    const pipeline = device.createComputePipeline({
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          code:
            PRELUDE_3D +
            `
@group(0) @binding(0) var<uniform> p: Params;
@group(0) @binding(1) var<storage,read_write> out: array<u32>;
@compute @workgroup_size(1) fn inspectParams() {
  out[0]=p.bodyCount; out[1]=p.largeCount; out[2]=p.noCollideCount;
  out[3]=p.pairCapacity; out[4]=p.contactCapacity;
  out[5]=bitcast<u32>(p.dt); out[6]=bitcast<u32>(p.cellSize); out[7]=bitcast<u32>(p.maxSmallRadius);
  out[8]=bitcast<u32>(p.up.x); out[9]=bitcast<u32>(p.up.y); out[10]=bitcast<u32>(p.up.z);
}`,
        }),
        entryPoint: "inspectParams",
      },
    });
    const group = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: gpu.paramsBuffer } },
        { binding: 1, resource: { buffer: output } },
      ],
    });
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(1);
    pass.end();
    device.queue.submit([encoder.finish()]);
    return await readWords(device, output);
  } finally {
    output.destroy();
  }
}
async function attempt(device, mode, configure) {
  const result = {
    mode: mode.name,
    passed: false,
    steps: 180,
    cases: [],
    errors: [],
    contactCache: "normal-float-generations-v1",
    diagnosticVersion: 2,
    limits: {
      storageBindings: device.limits.maxStorageBuffersPerShaderStage,
      workgroupStorageBytes: device.limits.maxComputeWorkgroupStorageSize,
      workgroupInvocations: device.limits.maxComputeInvocationsPerWorkgroup,
      storageBindingBytes: device.limits.maxStorageBufferBindingSize,
    },
  };
  let gpu;
  const create = (falling) => {
    const world = new AppGpuSolver3D(device, scene(falling), {
      spatialSort: false,
      bodyCapacity: 4,
      broadphase: mode.broadphase,
      capacity: { pairs: 32, manifolds: 32, contacts: 256, colors: 8 },
    });
    world.params.up = [0, 1, 0];
    world.dispatchIsolation = mode.dispatchIsolation;
    configure?.(world, mode, falling);
    return world;
  };
  device.pushErrorScope("validation");
  try {
    // Known overlaps locate pair generation versus narrowphase failures. This
    // is followed by a separate falling test, with no injected contacts.
    gpu = create(false);
    result.pipeline = await pipelineTrace(gpu);
    if (result.pipeline.stage !== "contacts-created") {
      result.reason =
        result.pipeline.stage === "collision-pairs"
          ? "The GPU did not find the three known overlapping floor pairs."
          : "The GPU found overlapping pairs but did not create all floor contacts.";
    } else {
      gpu.destroy();
      gpu = create(true);
      let contactSteps = 0;
      result.samples = [];
      for (let step = 0; step < result.steps; step++) {
        gpu.step();
        if ((step + 1) % 30 && step !== 39) continue;
        const counters = await gpu.readCounters();
        result.samples.push({ step: step + 1, ...counters });
        if (counters.manifolds) contactSteps++;
        if (counters.overflow || counters.clashes)
          throw Error("Incomplete GPU contact graph");
      }
      const data = await gpu.readBodies();
      for (let i = 1; i < 4; i++) {
        const p = i * 40,
          [x, y, z, w] = data.subarray(p + 4, p + 8);
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
    }
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
