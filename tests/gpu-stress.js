import shader from "./legacy/gpuStress.wgsl";
import renderShader from "./legacy/gpuStressRender.wgsl";
import {
  BODY_BYTES,
  CONTACT_CACHE_BYTES,
  BODY_COUNT,
  CELL_SIZE,
  GRID_MIN,
  GRID_DIMS,
  packInitialBodies,
} from "./legacy/gpuStressDemo.js";
import { assert, close, readBuffer, buffer } from "./helpers/gpu.js";
import {
  referenceBoxContact,
  seededBoxPairs,
} from "./helpers/reference-contacts.js";

function pack(specs) {
  const data = new ArrayBuffer(specs.length * BODY_BYTES);
  const f32 = new Float32Array(data),
    u32 = new Uint32Array(data);
  specs.forEach((spec, i) => {
    const o = i * 24;
    f32.set([...(spec.position ?? [0, 2, 0]), 1], o);
    f32.set([...(spec.velocity ?? [0, 0, 0]), 0], o + 4);
    f32.set([...(spec.shape ?? [0.18, 0.09, 0.12]), spec.invMass ?? 1], o + 8);
    f32.set(spec.orientation ?? [0, 0, 0, 1], o + 12);
    f32.set([...(spec.angular ?? [0, 0, 0]), 0], o + 16);
    u32[o + 20] = spec.kind ?? 1;
    u32[o + 21] = spec.awake === false ? 0 : 1;
  });
  return data;
}

async function checkedModule(device, code) {
  const module = device.createShaderModule({ code });
  const info = await module.getCompilationInfo();
  assert(
    !info.messages.some((m) => m.type === "error"),
    info.messages.map((m) => `line ${m.lineNum}: ${m.message}`).join("\n"),
  );
  return module;
}

async function harness(
  device,
  data,
  {
    dims = [18, 26, 18],
    min = [-4, -1, -4],
    cell = CELL_SIZE,
    gravity = -28,
    iterations = 4,
  } = {},
) {
  const count = data.byteLength / BODY_BYTES,
    cells = dims.reduce((a, b) => a * b);
  const bodies = buffer(device, data.byteLength, data),
    snapshot = buffer(device, data.byteLength);
  const contactCache = buffer(device, count * CONTACT_CACHE_BYTES),
    grid = buffer(device, cells * 4),
    next = buffer(device, count * 4);
  const paramsData = new ArrayBuffer(64),
    f32 = new Float32Array(paramsData),
    u32 = new Uint32Array(paramsData);
  f32.set([1 / 120, gravity, cell, 0.72]);
  u32.set([count, cells, dims[0], dims[1], dims[2], 0, iterations, 0], 4);
  f32.set([...min, 0], 12);
  const params = buffer(device, 64, paramsData, GPUBufferUsage.UNIFORM),
    counters = buffer(device, 16);
  const resources = [
    bodies,
    snapshot,
    contactCache,
    grid,
    next,
    params,
    counters,
  ];
  const module = await checkedModule(device, shader);
  const layout = device.createBindGroupLayout({
    entries: resources.map((_, binding) => ({
      binding,
      visibility: GPUShaderStage.COMPUTE,
      buffer: {
        type:
          binding === 5
            ? "uniform"
            : binding === 1
              ? "read-only-storage"
              : "storage",
      },
    })),
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [layout],
  });
  const pipelines = Object.fromEntries(
    [
      "clearGrid",
      "clearCounters",
      "predictBodies",
      "buildGrid",
      "wakeBodies",
      "solveBodies",
      "finalizeBodies",
      "countState",
    ].map((entryPoint) => [
      entryPoint,
      device.createComputePipeline({
        layout: pipelineLayout,
        compute: { module, entryPoint },
      }),
    ]),
  );
  const group = device.createBindGroup({
    layout,
    entries: resources.map((b, binding) => ({
      binding,
      resource: { buffer: b },
    })),
  });
  return {
    bodies,
    step() {
      const encoder = device.createCommandEncoder();
      const dispatch = (name, n = count) => {
        const pass = encoder.beginComputePass();
        pass.setPipeline(pipelines[name]);
        pass.setBindGroup(0, group);
        pass.dispatchWorkgroups(Math.ceil(n / 256));
        pass.end();
      };
      dispatch("clearCounters", 1);
      encoder.copyBufferToBuffer(bodies, 0, snapshot, 0, data.byteLength);
      dispatch("predictBodies");
      dispatch("clearGrid", cells);
      dispatch("buildGrid");
      encoder.copyBufferToBuffer(bodies, 0, snapshot, 0, data.byteLength);
      dispatch("wakeBodies");
      for (let i = 0; i < iterations; i++) {
        encoder.copyBufferToBuffer(bodies, 0, snapshot, 0, data.byteLength);
        dispatch("solveBodies");
      }
      dispatch("finalizeBodies");
      dispatch("countState");
      device.queue.submit([encoder.finish()]);
    },
    read: () => readBuffer(device, bodies),
    readCache: () => readBuffer(device, contactCache),
    readCounters: () => readBuffer(device, counters),
    destroy: () => resources.forEach((b) => b.destroy()),
  };
}

export async function stressTests(device, test) {
  await test("stress renderer compiles with rotational body layout", async () => {
    await checkedModule(device, renderShader);
  });
  // Test entry point calls the production narrowphase and inertia functions directly.
  const probes = `${shader}\n
    @group(0) @binding(7) var<storage, read_write> probeResults: array<vec4<f32>>;
    @compute @workgroup_size(64)
    fn probeCollisions(@builtin(global_invocation_id) gid: vec3<u32>) {
      let id = gid.x;
      if (id >= arrayLength(&probeResults) / 3u) { return; }
      let a = snapshot[id * 2u]; let b = snapshot[id * 2u + 1u];
      let c = collide(a, b);
      probeResults[id * 3u] = vec4<f32>(c.normal, c.penetration);
      probeResults[id * 3u + 1u] = vec4<f32>(c.point, f32(c.hit));
      probeResults[id * 3u + 2u] = vec4<f32>(inverseInertia(a, vec3<f32>(1.0, 0.0, 0.0)), 0.0);
    }`;
  const module = await checkedModule(device, probes);
  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "probeCollisions" },
  });
  const probe = async (pairs) => {
    const data = pack(pairs.flat());
    const input = buffer(device, data.byteLength, data),
      output = buffer(device, pairs.length * 48);
    try {
      const group = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 1, resource: { buffer: input } },
          { binding: 7, resource: { buffer: output } },
        ],
      });
      const encoder = device.createCommandEncoder(),
        pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, group);
      pass.dispatchWorkgroups(Math.ceil(pairs.length / 64));
      pass.end();
      device.queue.submit([encoder.finish()]);
      return new Float32Array(await readBuffer(device, output));
    } finally {
      input.destroy();
      output.destroy();
    }
  };
  await test("stress rotated boxes match canonical SAT across 300 seeded pairs", async () => {
    const pairs = seededBoxPairs(),
      values = await probe(pairs);
    let hits = 0,
      misses = 0;
    pairs.forEach((pair, i) => {
      const expected = referenceBoxContact(...pair),
        actual = values[i * 12 + 7] === 1;
      if (!expected.hit && actual) {
        // The production solver keeps a 1 cm skin for persistent contact forces.
        // Such a contact must have zero penetration and disappear outside the
        // expanded reference bounds; it must never become a false overlap.
        close(values[i * 12 + 3], 0, 1e-6, `pair ${i}: contact skin only`);
        assert(
          referenceBoxContact(
            ...pair.map((spec) => ({
              ...spec,
              shape: spec.shape.map((h) => h + 0.01),
            })),
          ).hit,
          `pair ${i}: skin contact outside reference bounds`,
        );
      } else
        assert(
          actual === expected.hit,
          `pair ${i}: GPU hit ${actual}, canonical hit ${expected.hit}`,
        );
      if (actual) {
        hits++;
        assert(values[i * 12 + 3] >= 0, `pair ${i}: nonnegative depth`);
        close(
          Math.hypot(...values.subarray(i * 12, i * 12 + 3)),
          1,
          1e-4,
          `pair ${i}: unit normal`,
        );
      } else misses++;
    });
    assert(
      hits > 30 && misses > 30,
      `exercise both outcomes: ${hits}/${misses}`,
    );
  });
  for (const [aKind, bKind] of [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
    [1, 2],
    [2, 2],
  ]) {
    await test(`stress narrowphase ${aKind}/${bKind} symmetric contact and separation`, async () => {
      const shape = (kind) => (kind === 2 ? [0.2, 0.3, 0.2] : [0.2, 0.2, 0.2]);
      const a = { kind: aKind, shape: shape(aKind), position: [0, 2, 0] };
      const b = { kind: bKind, shape: shape(bKind), position: [0.3, 2, 0] };
      const values = await probe([
        [a, b],
        [b, a],
        [a, { ...b, position: [3, 2, 0] }],
      ]);
      close(values[7], 1);
      close(values[19], 1);
      close(values[31], 0);
      close(values[3], values[15], 1e-4, "symmetric penetration");
      for (let k = 0; k < 3; k++)
        close(values[k], -values[12 + k], 1e-4, "opposite normal");
      assert(values.every(Number.isFinite), "finite collision outputs");
    });
  }
  await test("stress aligned face contacts have an unbiased patch centroid", async () => {
    const pairs = [0.17, 0.179, 0.17999].map((height) => [
      { position: [0, 2, 0], shape: [0.18, 0.09, 0.12] },
      { position: [0, 2 + height, 0], shape: [0.18, 0.09, 0.12] },
    ]);
    const values = await probe(pairs);
    for (let i = 0; i < pairs.length; i++) {
      close(values[i * 12 + 7], 1, 1e-5, `pair ${i}: contact`);
      close(values[i * 12 + 4], 0, 1e-6, `pair ${i}: centered x`);
      close(values[i * 12 + 6], 0, 1e-6, `pair ${i}: centered z`);
    }
  });
  await test("stress capsule hits a thin obstacle between endpoints", async () => {
    const v = await probe([
      [
        { kind: 2, shape: [0.05, 0.5, 0.05] },
        { position: [0.25, 2, 0], shape: [0.03, 0.2, 0.2] },
      ],
    ]);
    close(v[7], 1);
    assert(v[3] > 0, "capsule penetration");
  });
  await test("stress rotated OBB rejects an AABB-only overlap", async () => {
    const orientation = [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)];
    const v = await probe([
      [
        { shape: [0.6, 0.04, 0.04], orientation },
        { shape: [0.6, 0.04, 0.04], orientation, position: [0, 2.2, 0] },
      ],
    ]);
    close(v[7], 0);
  });
  await test("stress box inertia agrees with analytic dimensions", async () => {
    const v = await probe([
      [{ shape: [0.5, 1, 1.5], invMass: 1 / 12 }, { position: [5, 2, 0] }],
    ]);
    close(v[8], 1 / 13);
    close(v[9], 0);
    close(v[10], 0);
  });
  await test("stress free spin changes a normalized quaternion", async () => {
    const h = await harness(
      device,
      pack([
        { kind: 0, shape: [0.2, 0.2, 0.2], position: [-3, 5, -3] },
        { position: [0, 3, 0], angular: [0, 0, 2] },
      ]),
      { gravity: 0 },
    );
    try {
      for (let i = 0; i < 60; i++) h.step();
      const data = new Float32Array(await h.read());
      const q = data.subarray(36, 40);
      close(Math.hypot(...q), 1, 1e-5);
      assert(Math.abs(q[2]) > 0.2, `rotation ${q}`);
    } finally {
      h.destroy();
    }
  });
  await test("stress static body remains fixed under gravity and contacts", async () => {
    const data = pack([
      { position: [0, 3, 0], kind: 0, shape: [0.2, 0.2, 0.2] },
      { position: [0, 2.65, 0], invMass: 0 },
    ]);
    const h = await harness(device, data);
    try {
      for (let i = 0; i < 10; i++) h.step();
      const v = new Float32Array(await h.read());
      close(v[25], 2.65);
      close(v[39], 1);
    } finally {
      h.destroy();
    }
  });
  await test("stress large projectile contact is reciprocal beyond adjacent cells", async () => {
    const h = await harness(
      device,
      pack([
        { kind: 0, position: [0, 3, 0], shape: [0.75, 0.75, 0.75] },
        { position: [0, 3, 0.8], shape: [0.18, 0.09, 0.12] },
      ]),
      { gravity: 0 },
    );
    try {
      h.step();
      const v = new Float32Array(await h.read());
      assert(
        v[2] < -0.001 && v[26] > 0.8,
        `reciprocal positions ${v[2]}, ${v[26]}`,
      );
    } finally {
      h.destroy();
    }
  });
  await test("stress penetration repair does not create kinetic energy", async () => {
    const h = await harness(
      device,
      pack([
        { kind: 0, position: [0, 3, 0], shape: [0.2, 0.2, 0.2] },
        { kind: 0, position: [0, 3, 0.35], shape: [0.2, 0.2, 0.2] },
      ]),
      { gravity: 0 },
    );
    try {
      h.step();
      const v = new Float32Array(await h.read());
      assert(v[26] - v[2] > 0.39, "overlap repaired");
      for (const o of [0, 24]) {
        close(
          Math.hypot(...v.subarray(o + 4, o + 7)),
          0,
          1e-6,
          "zero repair velocity",
        );
        close(
          Math.hypot(...v.subarray(o + 16, o + 19)),
          0,
          1e-6,
          "zero repair spin",
        );
      }
    } finally {
      h.destroy();
    }
  });
  await test("stress support removal wakes only the unsupported region", async () => {
    const specs = [
      { kind: 0, position: [-3, 5, -3], shape: [0.2, 0.2, 0.2] },
      { position: [0, 1, 0], awake: false },
      { position: [2, 0.09, 0], awake: false },
    ];
    const h = await harness(device, pack(specs));
    try {
      for (let i = 0; i < 5; i++) h.step();
      const data = await h.read(),
        v = new Float32Array(data),
        flags = new Uint32Array(data);
      assert(flags[45] === 1 && v[25] < 1, "unsupported block wakes and falls");
      assert(
        flags[69] === 0 && v[49] === Math.fround(0.09),
        "distant supported block stays asleep",
      );
    } finally {
      h.destroy();
    }
  });
  await test("stress warm contacts preserve momentum without adding kinetic energy", async () => {
    const h = await harness(
      device,
      pack([
        {
          kind: 0,
          shape: [0.2, 0.2, 0.2],
          position: [-0.19, 2, 0],
          velocity: [2, 0, 0],
        },
        {
          kind: 0,
          shape: [0.2, 0.2, 0.2],
          position: [0.19, 2, 0],
          invMass: 1 / 3,
        },
      ]),
      { gravity: 0 },
    );
    try {
      for (let frame = 0; frame < 120; frame++) {
        h.step();
        if (frame % 20 !== 19) continue;
        const values = new Float32Array(await h.read());
        close(
          values[4] + 3 * values[28],
          2 * Math.exp((-0.35 * (frame + 1)) / 120),
          0.005,
          `frame ${frame}: momentum with known drag`,
        );
        const energy = 0.5 * values[4] ** 2 + 1.5 * values[28] ** 2;
        assert(energy <= 2.001, `frame ${frame}: energy ${energy}`);
      }
    } finally {
      h.destroy();
    }
  });
  await test("stress contact cache obeys Coulomb limits and releases a removed contact", async () => {
    const h = await harness(
      device,
      pack([
        { kind: 0, position: [-3, 5, -3], invMass: 0 },
        { position: [0, 0.09, 0], velocity: [1, 0, 0] },
      ]),
    );
    try {
      for (let frame = 0; frame < 30; frame++) h.step();
      const data = await h.readCache(),
        values = new Float32Array(data),
        tags = new Uint32Array(data);
      let active = 0;
      for (let k = 0; k < 16; k++) {
        const o = CONTACT_CACHE_BYTES / 4 + k * 12;
        if (!tags[o + 7]) continue;
        active++;
        const lambda = values[o + 3],
          tangent = values.subarray(o + 4, o + 7);
        assert(
          lambda >= 0 && Math.hypot(...tangent) <= 0.65 * lambda + 1e-5,
          `slot ${k}: unilateral/Coulomb limits`,
        );
        close(
          values[o] * tangent[0] +
            values[o + 1] * tangent[1] +
            values[o + 2] * tangent[2],
          0,
          1e-5,
          `slot ${k}: tangent orthogonal`,
        );
      }
      assert(active > 0, "actual floor impulse cached");
      device.queue.writeBuffer(
        h.bodies,
        BODY_BYTES,
        pack([{ position: [0, 2, 0] }]),
      );
      h.step();
      const falling = new Float32Array(await h.read());
      close(
        falling[29],
        (-28 / 120) * Math.exp(-0.35 / 120),
        1e-5,
        "old floor force released; analytic gravity",
      );
    } finally {
      h.destroy();
    }
  });
  await test("stress cache overflow is reported and excess contacts still solve", async () => {
    const h = await harness(
      device,
      pack(
        Array.from({ length: 22 }, (_, i) => ({
          position: [i * 0.001, 2, 0],
          velocity: [i === 0 ? 1 : 0, 0, 0],
        })),
      ),
      { gravity: 0, iterations: 1 },
    );
    try {
      h.step();
      const counters = new Uint32Array(await h.readCounters());
      const values = new Float32Array(await h.read());
      assert(counters[3] > 0, "bounded cache overflow reported");
      assert(
        values.every(Number.isFinite),
        "excess contacts keep finite state",
      );
      assert(counters[1] === 22, "all bodies retain contact records");
    } finally {
      h.destroy();
    }
  });
  await test("stress falling sphere, box and capsule settle without oscillation", async () => {
    const h = await harness(
      device,
      pack([
        { kind: 0, position: [-3, 5, -3], invMass: 0 },
        { kind: 0, shape: [0.15, 0.15, 0.15], position: [-1, 1, 0] },
        { kind: 1, position: [0, 2, 0] },
        { kind: 2, shape: [0.1, 0.2, 0.1], position: [1, 1.5, 0] },
      ]),
    );
    try {
      for (let i = 0; i < 600; i++) h.step();
      const first = new Float32Array(await h.read());
      for (let i = 0; i < 120; i++) h.step();
      const data = await h.read(),
        values = new Float32Array(data),
        flags = new Uint32Array(data);
      for (const [id, height] of [
        [1, 0.15],
        [2, 0.09],
        [3, 0.1],
      ]) {
        const offset = id * 24;
        close(values[offset + 1], height, 0.011, `body ${id}: floor margin`);
        close(
          Math.hypot(...values.subarray(offset + 4, offset + 7)),
          0,
          1e-3,
          `body ${id}: residual speed`,
        );
        close(
          Math.hypot(...values.subarray(offset + 16, offset + 19)),
          0,
          1e-3,
          `body ${id}: residual spin`,
        );
        close(
          values[offset + 1],
          first[offset + 1],
          1e-4,
          `body ${id}: no vertical oscillation`,
        );
        assert(flags[offset + 21] === 0, `body ${id}: asleep after settling`);
      }
    } finally {
      h.destroy();
    }
  });
  await test("stress 10-box stack retains height and settles", async () => {
    const specs = [
      { kind: 0, position: [-3, 5, -3], invMass: 0 },
      ...Array.from({ length: 10 }, (_, i) => ({
        position: [0, 0.09 + i * 0.18, 0],
      })),
    ];
    const h = await harness(device, pack(specs));
    try {
      for (let i = 0; i < 720; i++) h.step();
      const values = new Float32Array(await h.read());
      for (let id = 1; id <= 10; id++) {
        const offset = id * 24;
        close(
          values[offset + 1],
          0.09 + (id - 1) * 0.18,
          0.011 * id,
          `box ${id}: height, stack ${JSON.stringify(Array.from({ length: 10 }, (_, i) => [values[(i + 1) * 24 + 1], values[(i + 1) * 24 + 5]]))}`,
        );
        close(
          Math.hypot(values[offset], values[offset + 2]),
          0,
          0.01,
          `box ${id}: drift`,
        );
        close(
          Math.hypot(...values.subarray(offset + 4, offset + 7)),
          0,
          0.035,
          `box ${id}: residual speed, state ${Array.from(values.subarray(offset, offset + 20))}`,
        );
      }
    } finally {
      h.destroy();
    }
  });
  await test("stress 100K wall impact stays local and rotates debris", async () => {
    const initial = packInitialBodies(),
      original = new Float32Array(initial);
    const h = await harness(device, initial, {
      dims: GRID_DIMS,
      min: GRID_MIN,
      cell: CELL_SIZE,
    });
    try {
      // Three seconds includes impact, the breach and the support cascade.
      // The remote outer quarters, defined by the scene's actual width, stay unchanged;
      // less than 10% of the wall may be active after one central projectile.
      for (let i = 0; i < 360; i++) h.step();
      const data = await h.read(),
        v = new Float32Array(data),
        flags = new Uint32Array(data);
      let moved = 0,
        rotated = 0,
        farMoved = 0,
        awake = 0,
        maxMovedX = 0;
      let wallHalfWidth = 0;
      for (let id = 1; id < BODY_COUNT; id++)
        wallHalfWidth = Math.max(wallHalfWidth, Math.abs(original[id * 24]));
      for (let id = 1; id < BODY_COUNT; id++) {
        const o = id * 24;
        assert(
          v.subarray(o, o + 20).every(Number.isFinite),
          `finite body ${id}`,
        );
        close(
          Math.hypot(...v.subarray(o + 12, o + 16)),
          1,
          1e-4,
          `body ${id} quaternion`,
        );
        const displacement = Math.hypot(
          v[o] - original[o],
          v[o + 1] - original[o + 1],
          v[o + 2] - original[o + 2],
        );
        if (displacement > 0.03) {
          moved++;
          maxMovedX = Math.max(maxMovedX, Math.abs(original[o]));
          if (Math.abs(original[o]) > wallHalfWidth * 0.5) farMoved++;
        }
        if (Math.hypot(...v.subarray(o + 12, o + 15)) > 0.05) rotated++;
        awake += flags[o + 21];
      }
      assert(
        moved > 10 && rotated > 10,
        `moving ${moved}, rotating ${rotated}`,
      );
      assert(
        farMoved === 0 && awake < 10000 && moved < 10000,
        `impact stays local: far moved ${farMoved}, awake ${awake}, moved ${moved}, max impact x ${maxMovedX}`,
      );
    } finally {
      h.destroy();
    }
  });
}
