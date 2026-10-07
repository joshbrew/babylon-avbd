import { AppGpuSolver3D } from "./appGpuSolver3D.js";
import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../../reference/three-avbd/src/avbd3d/shapes.ts";
import { capsule } from "./capsuleShape.js";
import {
  IA_PAIRS,
  IA_COLOR,
  IA_CONTACTS,
  IA_CONSTRAINTS,
} from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import { PRELUDE_3D } from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";
import { solveWGSL } from "../../reference/three-avbd/src/avbd3d/gpu/wgsl-solve.ts";
import { setGpuExecutionPolicy3D } from "./executionPolicy3D.js";

const checks = new WeakMap();
const modes = [
  { name: "batched-grid", broadphase: "grid", dispatchIsolation: false },
  { name: "isolated-grid", broadphase: "grid", dispatchIsolation: true },
  { name: "batched-hploc", broadphase: "hploc", dispatchIsolation: false },
  { name: "isolated-hploc", broadphase: "hploc", dispatchIsolation: true },
  {
    name: "scalar-grid",
    broadphase: "grid",
    dispatchIsolation: false,
    scalarPrimal: true,
  },
  {
    name: "scalar-isolated-grid",
    broadphase: "grid",
    dispatchIsolation: true,
    scalarPrimal: true,
  },
  {
    name: "portable-contact-grid",
    broadphase: "grid",
    dispatchIsolation: false,
    portableContactMath: true,
  },
  {
    name: "portable-contact-isolated-grid",
    broadphase: "grid",
    dispatchIsolation: true,
    scalarPrimal: true,
    portableContactMath: true,
  },
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
      scalarPrimal: mode.scalarPrimal ?? false,
      portableContactMath: mode.portableContactMath ?? false,
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
  const adj = new Uint32Array(await readWords(gpu.device, gpu.adjBuffer));
  const color = new Uint32Array(await readWords(gpu.device, gpu.colorBuffer));
  const { manifolds, contacts } = gpu.contactStorage;
  const manifoldRaw = await readWords(
    gpu.device,
    manifolds,
    Math.max(32, counters.manifolds * 32),
  );
  const mi = new Uint32Array(manifoldRaw),
    mf = new Float32Array(manifoldRaw);
  const cf = new Float32Array(
    await readWords(gpu.device, contacts, Math.max(64, counters.contacts * 64)),
  );
  const bodies = await gpu.readBodies();
  const serialSystems =
    counters.manifolds >= 3 ? await inspectSystems(gpu) : [];
  const zeroForceFailure = serialSystems.some(
    ({ contactEvaluation: e }) =>
      e.returnedForce === 0 && e.independentForce < -1e-5,
  );
  return {
    expectedFloorPairs: 3,
    counters,
    pairs: counters.pairs ? Array.from(await gpu.readPairs()) : [],
    narrowphaseWorkgroups: Array.from(args.subarray(IA_PAIRS, IA_PAIRS + 3)),
    solver: {
      scalarPrimal: gpu.scalarPrimal,
      portableContactMath: gpu.portableContactMath,
      lanes: [...gpu.primalLanes],
      contactWorkgroups: Array.from(
        args.subarray(IA_CONTACTS, IA_CONTACTS + 3),
      ),
      dualWorkgroups: Array.from(
        args.subarray(IA_CONSTRAINTS, IA_CONSTRAINTS + 3),
      ),
      colorWorkgroups: Array.from(
        args.subarray(IA_COLOR, IA_COLOR + 3 * gpu.colorCap),
      ),
      adjacencyStarts: Array.from(adj.subarray(0, 5)),
      adjacencyEntries: Array.from(
        adj.subarray(
          2 * gpu.bodyCapacity + 1,
          2 * gpu.bodyCapacity + 1 + adj[4],
        ),
      ),
      colorStarts: Array.from(
        color.subarray(
          2 * gpu.bodyCapacity,
          2 * gpu.bodyCapacity + gpu.colorCap + 1,
        ),
      ),
      colorBodies: Array.from(
        color.subarray(2 * gpu.bodyCapacity + 65, 2 * gpu.bodyCapacity + 68),
      ),
      positionsAfterOverlap: [1, 2, 3].map((i) =>
        Array.from(bodies.subarray(i * 40, i * 40 + 3)),
      ),
      manifolds: Array.from({ length: counters.manifolds }, (_, i) => ({
        ids: Array.from(mi.subarray(i * 8, i * 8 + 4)),
        normalAndFriction: Array.from(mf.subarray(i * 8 + 4, i * 8 + 8)),
      })),
      contacts: Array.from({ length: counters.contacts }, (_, i) => ({
        anchorA: Array.from(cf.subarray(i * 16, i * 16 + 3)),
        anchorB: Array.from(cf.subarray(i * 16 + 4, i * 16 + 7)),
        gap: cf[i * 16 + 7],
        penalty: Array.from(cf.subarray(i * 16 + 8, i * 16 + 11)),
        force: Array.from(cf.subarray(i * 16 + 12, i * 16 + 15)),
      })),
      serialSystems,
      failure: zeroForceFailure ? "contact-evaluation" : null,
    },
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
      alpha: f[11],
    },
    stage:
      counters.pairs < 3
        ? "collision-pairs"
        : counters.manifolds < 3
          ? "contact-generation"
          : "contacts-created",
  };
}
// This diagnostic scene has no joints. Reuse its unused joint storage for the
// canary, avoiding an extra storage binding on devices limited to eight. The
// world is destroyed after this trace; the canary does not change body poses.
async function inspectSystems(gpu) {
  const alpha = gpu.portableContactMath
    ? "bitcast<f32>(pc.data.y)"
    : "pc.alpha";
  const gap = gpu.portableContactMath ? "k.anchorB.w" : "k.c0x";
  const penalty = gpu.portableContactMath ? "k.penalty.x" : "k.pen.x";
  const force = gpu.portableContactMath ? "k.force.x" : "k.lam.x";
  const module = gpu.device.createShaderModule({
    code:
      gpu.solveSource(solveWGSL) +
      `
@compute @workgroup_size(1) fn inspectSystems(@builtin(global_invocation_id) gid: vec3u) {
  let acc = accumulate(gid.x + 1u, 0u, 1u);
  joints[gid.x].penLin = vec4f(acc.lin[0][0], acc.lin[1][1], acc.lin[2][2], 0.0);
  joints[gid.x].penAng = vec4f(acc.ang[0][0], acc.ang[1][1], acc.ang[2][2], 0.0);
  joints[gid.x].c0Lin = vec4f(acc.rLin, 0.0);
  joints[gid.x].c0Ang = vec4f(acc.rAng, 0.0);
  let mf = manifolds[gid.x];
  let k = contacts[mf.ids.z];
  let A = pairBody(mf.ids.x); let B = pairBody(mf.ids.y);
  let basis = orthonormal(mf.geo.xyz);
  let result = evalContact(k, basis, mf.geo.w, A, B, ${alpha});
  // Independently recompute the normal row from scalar inputs. Compare input
  // reads, pass alpha, the returned error and the returned clamped force.
  let dA = bodies[mf.ids.x].pos.xyz - bodies[mf.ids.x].initialPos.xyz;
  let dB = bodies[mf.ids.y].pos.xyz - bodies[mf.ids.y].initialPos.xyz;
  let wA = qsub(bodies[mf.ids.x].rot, bodies[mf.ids.x].initialRot);
  let wB = qsub(bodies[mf.ids.y].rot, bodies[mf.ids.y].initialRot);
  let expectedC = ${gap} * (1.0 - ${alpha}) + dot(basis[0], dA - dB)
    + dot(cross(result.rAW.xyz, basis[0]), wA)
    - dot(cross(result.rBW.xyz, basis[0]), wB);
  let raw = ${penalty} * expectedC + ${force};
  joints[gid.x].rA = vec4f(${gap}, ${alpha}, result.C.x, result.F.x);
  joints[gid.x].rB = vec4f(${penalty}, ${force}, expectedC, min(raw, 0.0));
}`,
  });
  const pipeline = gpu.device.createComputePipeline({
    layout: gpu.device.createPipelineLayout({
      bindGroupLayouts: [gpu.layouts.solve, gpu.layouts.pass],
    }),
    compute: { module, entryPoint: "inspectSystems" },
  });
  const encoder = gpu.device.createCommandEncoder(),
    pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, gpu.groups.solve[1 - gpu.parity]);
  pass.setBindGroup(1, gpu.passGroup, [0]);
  pass.dispatchWorkgroups(3);
  pass.end();
  gpu.device.queue.submit([encoder.finish()]);
  const data = new Float32Array(
    await readWords(gpu.device, gpu.jointBuffer, 3 * 128),
  );
  return [0, 1, 2].map((i) => ({
    linearDiagonal: Array.from(data.subarray(i * 32, i * 32 + 3)),
    angularDiagonal: Array.from(data.subarray(i * 32 + 4, i * 32 + 7)),
    linearForce: Array.from(data.subarray(i * 32 + 16, i * 32 + 19)),
    angularForce: Array.from(data.subarray(i * 32 + 20, i * 32 + 23)),
    contactEvaluation: {
      inputGap: data[i * 32 + 24],
      passAlpha: data[i * 32 + 25],
      returnedError: data[i * 32 + 26],
      returnedForce: data[i * 32 + 27],
      inputPenalty: data[i * 32 + 28],
      inputForce: data[i * 32 + 29],
      independentError: data[i * 32 + 30],
      independentForce: data[i * 32 + 31],
    },
  }));
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
  out[11]=bitcast<u32>(p.alpha);
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
    diagnosticVersion: 4,
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
      scalarPrimal: mode.scalarPrimal ?? false,
      portableContactMath: mode.portableContactMath ?? false,
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
      if (!result.passed)
        result.reason =
          result.pipeline.solver.failure === "contact-evaluation"
            ? "The GPU created floor contacts but returned zero force where a push was required."
            : "The GPU did not keep all three falling shapes on the floor.";
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
