import { GlCompute } from "../src/webgl/compute.js";
import {
  checkReleasedCompute,
  destroyComputeAndCheck,
} from "./webgl-resources.js";
import { GlSolve2D } from "../src/webgl/solve2D.js";
const check = (value, message) => {
  if (!value) throw Error(message);
};
const bodyFields = {
  pose: 0,
  initial: 1,
  inertial: 2,
  velocity: 3,
  previousVelocity: 4,
  shape: 5,
};
const jointFields = {
  jointPenalty: 0,
  jointLambda: 1,
  jointStiffness: 2,
  jointInitial: 6,
};
const stages = {
  warmStartBodies: ["pose", "initial", "inertial", "velocity"],
  warmStartJoints: [
    "jointPenalty",
    "jointLambda",
    "jointInitial",
    "jointStiffness",
  ],
  solveBody: ["pose"],
  dualJoint: ["jointPenalty", "jointLambda", "jointInitial", "jointStiffness"],
  dualContact: ["contactPenalty", "contactIds"],
  refreshStick: ["contactPenalty", "contactIds"],
  updateVelocities: ["velocity", "previousVelocity"],
};

function fixture() {
  const N = 5,
    J = 5,
    C = 2,
    bodies = new Float32Array(N * 24),
    joints = new Float32Array(J * 36),
    info = new Int32Array(J * 4),
    contactBytes = new ArrayBuffer(C * 80),
    contacts = new Float32Array(contactBytes),
    ids = new Uint32Array(contactBytes);
  for (let i = 0; i < N; i++) {
    const at = i * 24;
    const p =
      i === 0
        ? [0, -0.5, 0, 0.7]
        : [i - 1, 0.48 + (i === 2 ? 0.1 : 0), i * 0.08, 0.7];
    bodies.set(p, at);
    bodies.set(p, at + 4);
    bodies.set(p, at + 8);
    bodies.set(
      [i === 0 ? 0 : 0.12, -0.1 * i, 0.15 * i, i === 4 ? 1 : 0],
      at + 12,
    );
    bodies.set([0, 0, 0, 0], at + 16);
    bodies.set(i === 0 ? [10, 1, 0, 0] : [1, 1, 1, 1 / 6], at + 20);
  }
  const define = (i, type, a, b, param) => {
    const o = i * 36;
    info.set([type, a, b, 0], i * 4);
    joints.set([10, 11, 12, 0], o);
    joints.set([0.2, -0.3, 0.1, 0], o + 4);
    joints.set([3e38, 3e38, 3e38, 0], o + 8);
    joints.set([-3e38, -3e38, -3e38, 0], o + 12);
    joints.set([3e38, 3e38, 3e38, 0], o + 16);
    joints.set([3e38, 3e38, 3e38, 3e38], o + 20);
    joints.set([0, 0, 0, 0], o + 28);
    joints.set(param, o + 32);
  };
  define(0, 1, -1, 1, [0.08, 1, 0, 0]);
  joints.set([0, 0.48, 0, 0], 28);
  define(1, 2, 1, 2, [1, 0, 0, 0]);
  joints.set([800, 0, 0, 0], 36 + 8);
  define(2, 3, -1, 3, [2, 0, 0, 0]);
  joints.set([3e38, 0, 0, 0], 72 + 8);
  joints.set([-4, 0, 0, 0], 72 + 12);
  joints.set([4, 0, 0, 0], 72 + 16);
  define(3, 1, -1, 3, [0.24, 1, 0, 0]);
  joints.set([10, 10, 10, 0], 108 + 20);
  joints.set([2, 0.8, 0, 0], 108 + 28);
  define(4, 5, -1, 3, [0, -0.1, 0.1, 0]);
  joints.set([3e38, 3e38, 0, 0], 144 + 8);
  joints.set([-3e38, 0, 0, 0], 144 + 12);
  joints.set([0, 3e38, 0, 0], 144 + 16);
  ids.set([1, 0, 42, 0], 0);
  contacts.set([50, 50, -0.8, 0], 4);
  contacts.set([0, -0.5, 0, 0.5], 8);
  contacts.set([-0.02, 0, 0, 1], 12);
  contacts.set([0.7, 0, 0, 0], 16);
  ids.set([2, 1, 99, 0], 20);
  contacts.set([50, 50, -0.4, 0.01], 24);
  contacts.set([-0.5, 0, 0.5, 0], 28);
  contacts.set([-0.1, 0, 1, 0], 32);
  contacts.set([0.7, 0, 0, 0], 36);
  const lists = [[], [0, 1, J, J + 1], [1, J + 1], [2, 3, 4], []],
    adj = [0];
  for (const list of lists) adj.push(adj.at(-1) + list.length);
  adj.push(...lists.flat());
  const params = {
    dt: 1 / 60,
    gravity: -9.81,
    beta: 10000,
    gamma: 0.9,
    alpha: 0.9,
    vbdStiffness: 1e6,
    flags: 2,
    bodyCount: N,
    jointCount: J,
    contactCapacity: C,
    adjListOffset: N + 1,
  };
  const words = new Uint32Array(32),
    floats = new Float32Array(words.buffer);
  const fields = [
    "dt",
    "gravity",
    "beta",
    "gamma",
    "alpha",
    "vbdStiffness",
    "flags",
    "bodyCount",
    "jointCount",
    "colorCap",
    "cellSize",
    "tableMask",
    "maxSmallRadius",
    "largeCount",
    "noCollideCount",
    "pairCapacity",
    "contactCapacity",
    "hashMask",
    "adjFillOffset",
    "adjListOffset",
  ];
  for (let i = 0; i < fields.length; i++)
    if (i < 6 || i === 10 || i === 12) floats[i] = params[fields[i]] ?? 0;
    else words[i] = params[fields[i]] ?? 0;
  return {
    N,
    J,
    C,
    bodies,
    joints,
    info,
    contacts,
    ids,
    adj: new Uint32Array(adj),
    params,
    words,
  };
}
export async function checkGlSolve2D(source) {
  const progress = async (stage) => {
    globalThis.__GL_SOLVE_PROGRESS__ = stage;
    await new Promise((r) => setTimeout(r, 20));
  };
  const c = new GlCompute(
    document
      .createElement("canvas")
      .getContext("webgl2", { antialias: false, depth: false, stencil: false }),
  );
  const adapter = await navigator.gpu.requestAdapter(),
    device = await adapter.requestDevice(),
    resources = [],
    errors = [],
    rows = [];
  device.addEventListener("uncapturederror", (event) =>
    errors.push(event.error.message),
  );
  const f = fixture(),
    inputs = {},
    spare = {};
  let solver,
    maxError = 0;
  const texture = (data, integer = false) =>
    c.texture(Math.max(1, data.length / 4), 1, integer, data);
  const field = (array, count, stride, index) =>
    Float32Array.from(
      { length: count * 4 },
      (_, i) => array[Math.floor(i / 4) * stride + index * 4 + (i % 4)],
    );
  const buffer = (data, usage) => {
    const b = device.createBuffer({
      size: Math.max(16, Math.ceil(data.byteLength / 16) * 16),
      usage: usage | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(b, 0, data);
    resources.push(b);
    return b;
  };
  try {
    for (const [name, index] of Object.entries(bodyFields)) {
      const data = field(f.bodies, f.N, 24, index);
      inputs[name] = texture(data);
      spare[name] = texture(new Float32Array(data.length));
    }
    for (const [name, index] of Object.entries(jointFields)) {
      const data = field(f.joints, f.J, 36, index);
      inputs[name] = texture(data);
      spare[name] = texture(new Float32Array(data.length));
    }
    inputs.jointStatic = texture(
      Float32Array.from(
        { length: f.J * 20 },
        (_, i) =>
          f.joints[
            Math.floor(i / 20) * 36 +
              [3, 4, 5, 7, 8][Math.floor((i % 20) / 4)] * 4 +
              (i % 4)
          ],
      ),
    );
    inputs.jointInfo = texture(new Uint32Array(f.info.buffer), true);
    inputs.contactStatic = texture(
      Float32Array.from(
        { length: f.C * 12 },
        (_, i) =>
          f.contacts[
            Math.floor(i / 12) * 20 +
              [2, 3, 4][Math.floor((i % 12) / 4)] * 4 +
              (i % 4)
          ],
      ),
    );
    inputs.contactPenalty = texture(field(f.contacts, f.C, 20, 1));
    spare.contactPenalty = texture(new Float32Array(f.C * 4));
    inputs.contactIds = texture(
      Uint32Array.from(
        { length: f.C * 4 },
        (_, i) => f.ids[Math.floor(i / 4) * 20 + (i % 4)],
      ),
      true,
    );
    spare.contactIds = texture(new Uint32Array(f.C * 4), true);
    const paddedAdj = new Uint32Array(Math.ceil(f.adj.length / 4) * 4);
    paddedAdj.set(f.adj);
    inputs.adjacency = texture(paddedAdj, true);
    inputs.colors = texture(
      Uint32Array.from({ length: f.N * 4 }, (_, i) =>
        i % 4 === 0 ? [255, 0, 1, 0, 255][i / 4] : 0,
      ),
      true,
    );
    await progress("Compile 2D solve stages");
    solver = await GlSolve2D.create(c, {
      math: source.glsl,
      onCompile: (stage) => progress(`Compile ${stage}`),
    });
    const data = [
      f.words,
      f.bodies,
      f.joints,
      f.info,
      new Uint8Array(f.contacts.buffer),
      f.adj,
      new Uint32Array(16),
      new Uint32Array([0, f.C, ...Array(14).fill(0)]),
    ];
    const buffers = data.map((a, i) =>
      buffer(
        a,
        i === 0
          ? GPUBufferUsage.UNIFORM
          : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      ),
    );
    const pc = buffer(new Uint32Array(4), GPUBufferUsage.UNIFORM);
    let oracleSource = source.wgsl;
    for (const stage of ["warmStartBodies", "updateVelocities"]) {
      const signature = `fn ${stage}(@builtin(global_invocation_id) gid: vec3u) {`;
      check(
        oracleSource.split(signature).length === 2,
        "Production sleep entry changed",
      );
      oracleSource = oracleSource.replace(
        signature,
        signature +
          "\nif(gid.x<params.bodyCount&&bodies[gid.x].vel.w!=0.){return;}",
      );
    }
    const module = device.createShaderModule({
      code:
        oracleSource +
        `
      @compute @workgroup_size(64) fn glPrimal(@builtin(global_invocation_id) gid:vec3u){let i=gid.x;if(i<params.bodyCount&&bodies[i].shape.z>0.&&bodies[i].vel.w==0.&&((i==2u&&pc.color==1u)||((i==1u||i==3u)&&pc.color==0u))){solveBody(i);}}
      @compute @workgroup_size(64) fn glJoint(@builtin(global_invocation_id) gid:vec3u){if(gid.x<params.jointCount){dualJoint(gid.x);}}
      @compute @workgroup_size(64) fn glContact(@builtin(global_invocation_id) gid:vec3u){if(gid.x<contactCount()){dualContact(gid.x);}}
    `,
    });
    const pipelines = {};
    for (const stage of Object.keys(stages)) {
      const entryPoint =
        {
          solveBody: "glPrimal",
          dualJoint: "glJoint",
          dualContact: "glContact",
        }[stage] ?? stage;
      const pipe = device.createComputePipeline({
        layout: "auto",
        compute: { module, entryPoint },
      });
      // Auto layouts omit unused bindings, so reflect binding use explicitly.
      const bindings = {
        warmStartBodies: [0, 1],
        warmStartJoints: [0, 1, 2, 3],
        solveBody: [0, 1, 2, 3, 4, 5],
        dualJoint: [0, 1, 2, 3],
        dualContact: [0, 1, 4, 7],
        refreshStick: [0, 4, 7],
        updateVelocities: [0, 1],
      }[stage];
      const group = device.createBindGroup({
        layout: pipe.getBindGroupLayout(0),
        entries: bindings.map((binding) => ({
          binding,
          resource: { buffer: buffers[binding] },
        })),
      });
      const needsPass = ["solveBody", "dualJoint", "dualContact"].includes(
        stage,
      );
      const pass = needsPass
        ? device.createBindGroup({
            layout: pipe.getBindGroupLayout(1),
            entries: [{ binding: 0, resource: { buffer: pc } }],
          })
        : null;
      pipelines[stage] = { pipe, group, pass };
    }
    const run = async (stage, color = 0) => {
      await progress(`${stage}, color ${color}`);
      const pass = { alpha: 0.9, color };
      solver.dispatch(stage, inputs, spare, {
        params: f.params,
        pass,
        contactCount: f.C,
      });
      const words = new Uint32Array(4);
      words[0] = color;
      new Float32Array(words.buffer)[1] = pass.alpha;
      device.queue.writeBuffer(pc, 0, words);
      const { pipe, group, pass: passGroup } = pipelines[stage],
        encoder = device.createCommandEncoder(),
        compute = encoder.beginComputePass();
      compute.setPipeline(pipe);
      compute.setBindGroup(0, group);
      if (passGroup) compute.setBindGroup(1, passGroup);
      compute.dispatchWorkgroups(1);
      compute.end();
      const kind =
        stage === "warmStartJoints" || stage === "dualJoint"
          ? "joint"
          : stage === "dualContact" || stage === "refreshStick"
            ? "contact"
            : "body";
      const index = kind === "body" ? 1 : kind === "joint" ? 2 : 4,
        size = buffers[index].size;
      const read = device.createBuffer({
        size,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      try {
        encoder.copyBufferToBuffer(buffers[index], 0, read, 0, size);
        device.queue.submit([encoder.finish()]);
        await read.mapAsync(GPUMapMode.READ);
        const bytes = read.getMappedRange().slice(0),
          expected = new Float32Array(bytes),
          expectedIds = new Uint32Array(bytes);
        read.unmap();
        check(errors.length === 0, errors.join("\n"));
        for (const name of stages[stage]) {
          const actual = await c.read(spare[name]),
            count = kind === "body" ? f.N : kind === "joint" ? f.J : f.C,
            stride = kind === "body" ? 24 : kind === "joint" ? 36 : 20;
          const fieldIndex =
            bodyFields[name] ??
            jointFields[name] ??
            (name === "contactIds" ? 0 : 1);
          for (let i = 0; i < count * 4; i++) {
            const at = Math.floor(i / 4) * stride + fieldIndex * 4 + (i % 4);
            if (name === "contactIds")
              check(
                actual[i] === expectedIds[at],
                `${stage} contact ID ${i} mismatch`,
              );
            else {
              const a = actual[i],
                b = expected[at],
                error = Math.abs(a - b) / Math.max(1, Math.abs(b));
              maxError = Math.max(maxError, error);
              check(
                Number.isFinite(a) && error < 0.00015,
                `${stage} ${name}[${i}]: GL ${a}, WebGPU ${b}, relative error ${error}`,
              );
            }
          }
          [inputs[name], spare[name]] = [spare[name], inputs[name]];
        }
        check(c.gl.getError() === c.gl.NO_ERROR, `${stage} WebGL error`);
        rows.push({ stage, color, passed: true });
      } finally {
        read.destroy();
      }
    };
    await run("warmStartJoints");
    await run("warmStartBodies");
    for (let i = 0; i < 5; i++) {
      await run("solveBody", 0);
      await run("solveBody", 1);
      await run("dualJoint");
      await run("dualContact");
    }
    await run("updateVelocities");
    await run("refreshStick");
    // An incomplete GPU topology holds every stage, including warm starts and
    // dual state. The guard is generated on GPU, rather than read by JavaScript.
    const guardedColors = c.texture(f.N, 2, true),
      guardProgram = c.program(`#version 300 es
      precision highp float;precision highp int;precision highp usampler2D;
      uniform usampler2D inputColors;layout(location=0)out uvec4 result;
      void main(){ivec2 uv=ivec2(gl_FragCoord.xy);result=uv.y==0?texelFetch(inputColors,uv,0):uvec4(4u,0u,0u,0u);}`);
    c.dispatch(guardProgram, [guardedColors], { inputColors: inputs.colors });
    c.release(guardProgram);
    c.release(inputs.colors);
    inputs.colors = guardedColors;
    for (const stage of Object.keys(stages)) {
      const before = await Promise.all(
        stages[stage].map((name) => c.read(inputs[name])),
      );
      solver.dispatch(stage, inputs, spare, {
        params: f.params,
        pass: { alpha: 0.9, color: 0 },
        contactCount: f.C,
        guarded: true,
        bodyCapacity: f.N,
      });
      const after = await Promise.all(
        stages[stage].map((name) => c.read(spare[name])),
      );
      for (let j = 0; j < before.length; j++)
        check(
          before[j].every((value, i) => Object.is(value, after[j][i])),
          `${stage} changed state during a held step`,
        );
      rows.push({ stage, heldStep: true, passed: true });
    }
    check(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      dimension: 2,
      stages: rows,
      maxRelativeError: maxError,
    };
  } finally {
    solver?.destroy();
    for (const b of resources) b.destroy();
    for (const t of [...c.textures]) c.release(t);
    checkReleasedCompute(c);
    destroyComputeAndCheck(c);
    device.destroy();
  }
}
