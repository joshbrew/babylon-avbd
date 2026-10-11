import { GlCompute } from "../src/webgl/compute.js";
import { GlBroadphase } from "../src/webgl/broadphase.js";
import { GlNarrowphase } from "../src/webgl/narrowphase.js";
import { GlColoring } from "../src/webgl/coloring.js";
const check = (v, m) => {
  if (!v) throw Error(m);
};

async function oracle(device, dimension, source, bodies, geometry, pairs) {
  const resources = [];
  const buffer = (data, usage) => {
    const b = device.createBuffer({
      size: Math.max(16, data.byteLength),
      usage: usage | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(b, 0, data);
    resources.push(b);
    return b;
  };
  try {
    const body = buffer(bodies, GPUBufferUsage.STORAGE),
      geo = buffer(geometry, GPUBufferUsage.STORAGE),
      pair = buffer(pairs, GPUBufferUsage.STORAGE);
    const params = new Uint32Array(44);
    params[6] = 2;
    const uniform = buffer(params, GPUBufferUsage.UNIFORM);
    const size = Math.max(64, (pairs.length / 2) * 8 * 64);
    const out = device.createBuffer({
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    resources.push(out);
    const read = device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    resources.push(read);
    const math =
      dimension === 3
        ? `
      let col=glCollision(a,b);let count=col.found.count;
      for(var i=0u;i<count;i++){
        var o:GlContact;o.normal=vec4f(col.normal,f32(count));
        o.anchorA=vec4f(qrotate(qconj(bodies[a].rot),col.found.xA[i]-bodies[a].pos.xyz),0.);
        o.anchorB=vec4f(qrotate(qconj(bodies[b].rot),col.found.xB[i]-bodies[b].pos.xyz),0.);
        o.metadata=vec4u(a,b,col.found.feature[i],count);glOut[k*8u+i]=o;
      }`
        : `
      let col=collideShapes2D(a,b);let count=col.count;
      for(var i=0u;i<count;i++){
        var o:GlContact;o.normal=vec4f(col.c[i].n,0.,f32(count));
        o.anchorA=vec4f(col.c[i].rA,0.,0.);o.anchorB=vec4f(col.c[i].rB,0.,0.);
        o.metadata=vec4u(a,b,col.c[i].feature,count);glOut[k*8u+i]=o;
      }`;
    const code =
      source +
      `
      struct GlContact{normal:vec4f,anchorA:vec4f,anchorB:vec4f,metadata:vec4u}
      @group(1) @binding(0) var<storage,read_write> glOut:array<GlContact>;
      @group(1) @binding(1) var<storage,read> glPairs:array<vec2u>;
      @compute @workgroup_size(64) fn checkContact(@builtin(global_invocation_id) gid:vec3u){
        let k=gid.x;if(k>=${pairs.length / 2}u){return;}
        let a=glPairs[k].x;let b=glPairs[k].y;${math}
      }`;
    const pipeline = device.createComputePipeline({
      layout: "auto",
      compute: {
        module: device.createShaderModule({ code }),
        entryPoint: "checkContact",
      },
    });
    const entries = [
      { binding: 1, resource: { buffer: body } },
      dimension === 3
        ? { binding: 0, resource: { buffer: uniform } }
        : { binding: 7, resource: { buffer: geo } },
    ];
    const bind0 = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries,
    });
    const bind1 = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(1),
      entries: [
        { binding: 0, resource: { buffer: out } },
        { binding: 1, resource: { buffer: pair } },
      ],
    });
    const encoder = device.createCommandEncoder(),
      pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bind0);
    pass.setBindGroup(1, bind1);
    pass.dispatchWorkgroups(Math.ceil(pairs.length / 2 / 64));
    pass.end();
    encoder.copyBufferToBuffer(out, 0, read, 0, size);
    device.queue.submit([encoder.finish()]);
    await read.mapAsync(GPUMapMode.READ);
    const copy = read.getMappedRange().slice(0);
    read.unmap();
    return { f: new Float32Array(copy), u: new Uint32Array(copy) };
  } finally {
    for (const b of resources) b.destroy();
  }
}

export async function checkGlContacts(sources) {
  const progress = async (stage) => {
    globalThis.__GL_CONTACT_PROGRESS__ = stage;
    await new Promise((r) => setTimeout(r, 150));
  };
  const gl = document
    .createElement("canvas")
    .getContext("webgl2", { antialias: false, depth: false, stencil: false });
  const c = new GlCompute(gl),
    adapter = await navigator.gpu.requestAdapter(),
    device = await adapter.requestDevice(),
    errors = [],
    rows = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let seed = 0xf00d;
  const random = () =>
    ((seed = (Math.imul(seed, 1664525) + 1013904223) | 0) >>> 0) / 2 ** 32;
  try {
    for (const dimension of [2, 3]) {
      await progress(`${dimension}D setup`);
      const count = 96,
        grid = new GlBroadphase(c, {
          bodyCount: count,
          dimension,
          cellSize: 4,
          neighborCapacity: dimension === 2 ? 105 : 15,
        });
      const bounds = new Float32Array(grid.capacity * 4),
        poses = new Float32Array(grid.capacity * 4),
        rotations = new Float32Array(grid.capacity * 4),
        sizes = new Float32Array(grid.capacity * 4),
        filters = new Uint32Array(grid.capacity * 4);
      const geometry = new Float32Array((grid.capacity + count * 32) * 4);
      for (let i = 0; i < count; i++) {
        const pair = Math.floor(i / 2),
          kind =
            dimension === 3
              ? [0, 1, -1][pair % 3]
              : [0, 1, 2, 4, 3, 2][pair % 6];
        const isB = i % 2 === 1;
        const shape =
          dimension === 3 && isB && pair % 7 === 0
            ? -1
            : dimension === 3 && isB && pair % 5 === 0
              ? 1
              : isB && pair % 4 === 0
                ? 0
                : kind;
        const p = [
          (pair % 8) * 8 + (isB ? 0.6 : 0),
          Math.floor(pair / 8) * 8,
          dimension === 3 ? (isB ? 0.25 : 0) : 0,
        ];
        const q =
          dimension === 3
            ? [random() - 0.5, random() - 0.5, random() - 0.5, random() + 0.3]
            : [0, 0, 0, 1];
        const length = Math.hypot(...q);
        for (let j = 0; j < 4; j++) q[j] /= length;
        const angle = dimension === 2 ? (random() - 0.5) * 3 : 0;
        if (dimension === 3) {
          poses.set([...p, 0.6], i * 4);
          rotations.set(q, i * 4);
          sizes.set([1, shape === -1 ? 2 : 1, 1, shape], i * 4);
        } else {
          poses.set([p[0], p[1], angle, 0.6], i * 4);
          rotations.set([0, 0, 0, 1], i * 4);
          sizes.set([1, 1, 1, 1], i * 4);
          const g =
            shape === 1
              ? [1, 0.5, 0, 0]
              : shape === 2
                ? [2, pair % 6 === 5 ? 0.01 : 0.3, 0.7, 0]
                : shape === 3
                  ? [3, 0, 0, 0]
                  : [shape, 0, 0, 0];
          if (shape === 4) {
            const n = pair % 4 === 3 ? 32 : 4;
            g[1] = 0.7;
            g[2] = grid.capacity + i * 32;
            g[3] = n;
            for (let j = 0; j < n; j++)
              geometry.set(
                [
                  0.5 * Math.cos((j * Math.PI * 2) / n),
                  0.5 * Math.sin((j * Math.PI * 2) / n),
                  Math.cos(((j + 0.5) * Math.PI * 2) / n),
                  Math.sin(((j + 0.5) * Math.PI * 2) / n),
                ],
                (g[2] + j) * 4,
              );
          }
          geometry.set(g, i * 4);
        }
        bounds.set(
          [
            p[0],
            p[1],
            p[2],
            dimension === 2 && shape === 3 ? 1e5 : shape === -1 ? 1.1 : 1,
          ],
          i * 4,
        );
        filters.set([1, 1, Number(!isB || pair % 3 === 0), 0], i * 4);
      }
      // Ensure one separated pair and a long capsule crossing a thin box.
      poses[4] += 3;
      bounds[4] += 3;
      const texture = (
        data,
        integer = false,
        width = grid.width,
        height = grid.height,
      ) => c.texture(width, height, integer, data);
      const boundsTex = texture(bounds),
        filterTex = texture(filters, true),
        poseTex = texture(poses),
        rotTex = texture(rotations),
        sizeTex = texture(sizes),
        geoTex = texture(geometry, false, geometry.length / 4, 1);
      grid.dispatch(boundsTex, filterTex);
      const neighborData = await Promise.all(
        grid.neighbors.map((t) => c.read(t)),
      );
      await progress(`${dimension}D compile contact shader`);
      const narrow = await GlNarrowphase.create(c, grid, {
        dimension,
        math: sources[dimension].glsl,
        onCompile: (variant) =>
          progress(`${dimension}D compile ${variant} contacts`),
      });
      await progress(`${dimension}D dispatch contact shader`);
      narrow.dispatch({
        poses: poseTex,
        rotations: rotTex,
        sizes: sizeTex,
        geometry: geoTex,
      });
      const actual = await Promise.all(narrow.outputs.map((t) => c.read(t)));
      const coloring = await GlColoring.create(c, grid, {
        contactsPerPair: dimension === 3 ? 8 : 2,
      });
      try {
        const colors = await c.read(
          coloring.dispatch(filterTex, narrow.outputs[3]),
        );
        check(
          colors[grid.capacity * 4] === 0,
          `${dimension}D contact graph could not be colored safely`,
        );
        for (let i = 0; i < actual[3].length; i += 4) {
          const [a, b, , count] = actual[3].subarray(i, i + 4);
          if (count && filters[a * 4 + 2] && filters[b * 4 + 2])
            check(
              colors[a * 4] !== colors[b * 4],
              `${dimension}D active contacts share a solve color`,
            );
        }
      } finally {
        coloring.destroy();
      }
      await progress(`${dimension}D compare with WebGPU`);
      check(gl.getError() === gl.NO_ERROR, `${dimension}D contact WebGL error`);
      const pairs = [],
        slots = [];
      for (let a = 0; a < count; a++) {
        const candidateCount = neighborData[0][a * 4];
        check(
          candidateCount <= grid.neighborCapacity,
          "Contact fixture overflowed broadphase",
        );
        for (let k = 0; k < candidateCount; k++) {
          const slot = (k % 15) + 1,
            offset = (Math.floor(k / 15) * grid.capacity + a) * 4,
            b = neighborData[Math.floor(slot / 4)][offset + (slot % 4)] - 1;
          pairs.push(a, b);
          slots.push((a * grid.neighborCapacity + k) * narrow.contactsPerPair);
        }
      }
      const raw = new Float32Array(count * (dimension === 3 ? 40 : 24));
      for (let i = 0; i < count; i++) {
        const o = i * (dimension === 3 ? 40 : 24);
        raw.set(poses.subarray(i * 4, i * 4 + 4), o);
        if (dimension === 3) {
          raw.set(rotations.subarray(i * 4, i * 4 + 4), o + 4);
          raw.set(sizes.subarray(i * 4, i * 4 + 4), o + 16);
          raw[o + 39] = sizes[i * 4 + 3];
        } else raw.set(sizes.subarray(i * 4, i * 4 + 4), o + 20);
      }
      const expected = await oracle(
        device,
        dimension,
        sources[dimension].wgsl,
        raw,
        geometry,
        new Uint32Array(pairs),
      );
      let contacts = 0,
        maxError = 0;
      for (let p = 0; p < slots.length; p++)
        for (let k = 0; k < narrow.contactsPerPair; k++) {
          const offset = (slots[p] + k) * 4,
            ref = (p * 8 + k) * 16,
            count = expected.u[ref + 15];
          check(
            actual[3][offset + 3] === count,
            `${dimension}D pair ${p}, point ${k}: expected count ${count}, received ${actual[3][offset + 3]}`,
          );
          if (!count) continue;
          contacts++;
          for (let j = 0; j < 4; j++)
            check(
              actual[3][offset + j] === expected.u[ref + 12 + j],
              `${dimension}D contact feature/IDs mismatch`,
            );
          for (let t = 0; t < 3; t++)
            for (let j = 0; j < 4; j++) {
              const value = actual[t][offset + j],
                target = expected.f[ref + t * 4 + j],
                error = Math.abs(value - target);
              check(
                Number.isFinite(value) && error < 3e-4,
                `${dimension}D pair ${p} (${pairs[p * 2]},${pairs[p * 2 + 1]} shapes ${sizes[pairs[p * 2] * 4 + 3]},${sizes[pairs[p * 2 + 1] * 4 + 3]}) point ${k} field ${t}/${j}: ${value} differs from ${target}`,
              );
              maxError = Math.max(maxError, error);
            }
        }
      check(
        contacts > 20,
        `${dimension}D fixture did not produce enough contacts`,
      );
      rows.push({
        dimension,
        bodies: count,
        candidatePairs: pairs.length / 2,
        contactPoints: contacts,
        maxError,
        passed: true,
      });
      narrow.destroy();
      grid.destroy();
      for (const t of [boundsTex, filterTex, poseTex, rotTex, sizeTex, geoTex])
        c.release(t);
      check(
        c.textures.size === 0 && c.programs.size === 0,
        "Contact resources leaked",
      );
    }
    check(errors.length === 0, errors.join("\n"));
    return { passed: true, rows };
  } finally {
    c.destroy();
    device.destroy();
  }
}
