import shader from "./gpuShowcaseRender.wgsl";
import { chainRingScales } from "./ringGeometry.js";
import { tearableClothsOf } from "./clothTopology.js";
import { TearableClothRenderer } from "./tearableClothRenderer.js";
import {
  visualOf,
  clothsOf,
  ropesOf,
  RING,
} from "../reference/three-avbd/src/avbd3d/visuals.ts";
import { isSphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";

// Cosmetic tags match the upstream gallery. Capsules/rings retain the original
// box collision geometry. Spheres retain their true GPU sphere contacts.
// Every style is one instanced draw, including all 14,400 ragdoll parts.
export class GpuShowcaseVisuals {
  constructor(renderer) {
    this.renderer = renderer;
    this.device = renderer.device;
    this.resources = [];
    const d = this.device;
    this.styles = this.buffer(
      new Uint32Array(Math.max(1, renderer.solver.bodies.length) * 8),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    this.dummy = this.buffer(new Uint32Array(8), GPUBufferUsage.STORAGE);
    this.texture = this.makeClothTexture();
    this.sampler = d.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });
    this.layout = d.createBindGroupLayout({
      entries: [
        ...[0, 1, 2, 3, 4].map((binding) => ({
          binding,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: binding === 1 ? "uniform" : "read-only-storage" },
        })),
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 6, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
      ],
    });
    const module = d.createShaderModule({
        label: "Instanced canonical showcase visuals",
        code: shader,
      }),
      layout = d.createPipelineLayout({ bindGroupLayouts: [this.layout] });
    this.pipelines = new Map();
    for (let kind = 1; kind <= 5; kind++)
      this.pipelines.set(
        kind,
        d.createRenderPipeline({
          layout,
          multisample: { count: renderer.sampleCount },
          vertex: {
            module,
            entryPoint: "shapeMain",
            constants: { KIND: kind },
            buffers: [
              {
                arrayStride: 24,
                attributes: [
                  { shaderLocation: 0, offset: 0, format: "float32x3" },
                  { shaderLocation: 1, offset: 12, format: "float32x3" },
                ],
              },
            ],
          },
          fragment: {
            module,
            entryPoint: "shapeFragment",
            targets: [{ format: renderer.format }],
          },
          primitive: { topology: "triangle-list", cullMode: "none" },
          depthStencil: {
            format: "depth24plus",
            depthWriteEnabled: true,
            depthCompare: "less-equal",
          },
        }),
      );
    this.clothPipeline = d.createRenderPipeline({
      layout,
      multisample: { count: renderer.sampleCount },
      vertex: { module, entryPoint: "clothMain" },
      fragment: {
        module,
        entryPoint: "clothFragment",
        targets: [{ format: renderer.format }],
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less-equal",
      },
    });
    this.meshes = new Map();
    for (let kind = 1; kind <= 5; kind++) {
      const data =
        kind <= 2
          ? roundedMesh(kind === 2)
          : ringMesh(kind === 3 ? RING.flat : RING.link);
      this.meshes.set(kind, {
        vertices: data,
        buffer: this.buffer(data, GPUBufferUsage.VERTEX),
        count: data.length / 6,
      });
    }
    this.refresh();
    this.makeCloth();
    this.tears = new TearableClothRenderer(
      renderer,
      this.texture,
      this.sampler,
    );
  }
  buffer(data, usage) {
    const b = this.device.createBuffer({
      size: Math.max(4, data.byteLength),
      usage: usage | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Uint8Array(b.getMappedRange()).set(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    );
    b.unmap();
    this.resources.push(b);
    return b;
  }
  bind(indices, cloth = this.dummy) {
    const r = this.renderer;
    return this.device.createBindGroup({
      layout: this.layout,
      entries: [
        ...[r.buffer, r.camera, this.styles, indices, cloth].map(
          (buffer, binding) => ({ binding, resource: { buffer } }),
        ),
        { binding: 5, resource: this.texture.createView() },
        { binding: 6, resource: this.sampler },
      ],
    });
  }
  refresh() {
    const { solver, gpu } = this.renderer,
      bytes = new ArrayBuffer(Math.max(1, solver.bodies.length) * 32),
      f = new Float32Array(bytes),
      u = new Uint32Array(bytes);
    this.ringScales ??= chainRingScales(solver, visualOf, RING);
    const groups = new Map(),
      ropeStyles = new Map();
    for (const rope of ropesOf(solver))
      for (const body of rope.links)
        ropeStyles.set(body, { shape: "capsule", color: rope.color });
    solver.bodies.forEach((b, i) => {
      const id = gpu ? gpu.gpuIndex(i) : i,
        v = ropeStyles.get(b) ?? visualOf(b),
        kind =
          v?.shape === "hidden"
            ? 6
            : isSphere(b)
              ? 1
              : ({ capsule: 2, ringFlat: 3, ringX: 4, ringY: 5, hidden: 6 }[
                  v?.shape
                ] ?? 0);
      u[id * 8 + 4] = kind;
      u[id * 8 + 5] = Number(v?.metal ?? false);
      u[id * 8 + 6] = Number(v?.mortar ?? false);
      f[id * 8 + 7] = this.ringScales.get(b) ?? 1;
      if (v?.color !== undefined)
        f.set(
          [
            ((v.color >> 16) & 255) / 255,
            ((v.color >> 8) & 255) / 255,
            (v.color & 255) / 255,
            1,
          ],
          id * 8,
        );
      if (kind > 0 && kind < 6) {
        if (!groups.has(kind)) groups.set(kind, []);
        groups.get(kind).push(id);
      }
    });
    this.device.queue.writeBuffer(this.styles, 0, bytes);
    this.styleVersion = (this.styleVersion ?? 0) + 1;
    for (const group of this.groups ?? []) {
      group.indices.destroy();
      this.resources = this.resources.filter((b) => b !== group.indices);
    }
    this.groups = Array.from(groups, ([kind, ids]) => {
      const indices = this.buffer(new Uint32Array(ids), GPUBufferUsage.STORAGE);
      return { kind, indices, count: ids.length, bind: this.bind(indices) };
    });
  }
  makeCloth() {
    const { solver, gpu } = this.renderer,
      map = new Map(
        solver.bodies.map((b, i) => [b, gpu ? gpu.gpuIndex(i) : i]),
      ),
      vertices = [],
      indices = [];
    for (const grid of clothsOf(solver)) {
      if (tearableClothsOf(solver).some((s) => s.grid === grid)) continue;
      const h = grid.length,
        w = grid[0].length,
        start = vertices.length / 8;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++)
          vertices.push(
            map.get(grid[y][x]),
            map.get(grid[y][Math.max(0, x - 1)]),
            map.get(grid[y][Math.min(w - 1, x + 1)]),
            map.get(grid[Math.max(0, y - 1)][x]),
            map.get(grid[Math.min(h - 1, y + 1)][x]),
            x / (w - 1),
            y / (h - 1),
            0,
          );
      for (let y = 0; y < h - 1; y++)
        for (let x = 0; x < w - 1; x++) {
          const a = start + y * w + x;
          indices.push(a, a + 1, a + w, a + 1, a + w + 1, a + w);
        }
    }
    if (!indices.length) return;
    const data = new ArrayBuffer(vertices.length * 4),
      u = new Uint32Array(data),
      f = new Float32Array(data);
    vertices.forEach((v, i) => {
      if (i % 8 === 5 || i % 8 === 6) f[i] = v;
      else u[i] = v;
    });
    this.clothMap = this.buffer(u, GPUBufferUsage.STORAGE);
    this.clothIndices = this.buffer(
      new Uint32Array(indices),
      GPUBufferUsage.INDEX,
    );
    this.clothCount = indices.length;
    this.clothIndexData = indices;
    this.clothVertexCount = vertices.length / 8;
    this.clothBind = this.bind(this.dummy, this.clothMap);
  }
  makeClothTexture() {
    const canvas = document.createElement("canvas");
    this.fabricCanvas = canvas;
    canvas.width = canvas.height = 512;
    const c = canvas.getContext("2d");
    c.fillStyle = "#f4efe6";
    c.fillRect(0, 0, 512, 512);
    c.fillStyle = "#2e5a78";
    c.beginPath();
    c.arc(256, 256, 155, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e1795b";
    c.lineWidth = 9;
    c.stroke();
    c.fillStyle = "#f4efe6";
    c.font = "bold 68px sans-serif";
    c.textAlign = "center";
    c.fillText("AVBD", 256, 274);
    c.font = "15px sans-serif";
    c.fillText("AUGMENTED VERTEX", 256, 304);
    c.fillText("BLOCK DESCENT", 256, 325);
    for (let row = 0; row < 4; row++)
      for (let x = 0; x < 8; x++) {
        c.fillStyle = ["#d7b59b", "#bfc9c3", "#e6c3a5", "#d8b9b2"][row];
        c.fillRect(x * 64 + (row % 2) * 32, 20 + row * 14, 60, 10);
        c.fillRect(x * 64 + (row % 2) * 32, 438 + row * 14, 60, 10);
      }
    const texture = this.device.createTexture({
      size: [512, 512],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    this.device.queue.copyExternalImageToTexture(
      { source: canvas },
      { texture },
      [512, 512],
    );
    return texture;
  }
  draw(pass) {
    this.tears?.draw(pass);
    for (const group of this.groups) {
      const mesh = this.meshes.get(group.kind);
      pass.setPipeline(this.pipelines.get(group.kind));
      pass.setBindGroup(0, group.bind);
      pass.setVertexBuffer(0, mesh.buffer);
      pass.draw(mesh.count, group.count);
    }
    if (this.clothCount) {
      pass.setPipeline(this.clothPipeline);
      pass.setBindGroup(0, this.clothBind);
      pass.setIndexBuffer(this.clothIndices, "uint32");
      pass.drawIndexed(this.clothCount);
    }
  }
  dispose() {
    this.tears?.dispose();
    for (const b of this.resources) b.destroy();
    this.texture.destroy();
  }
}

function roundedMesh(capsule) {
  const rows = 12,
    columns = 16,
    rings = [];
  for (let row = 0; row <= rows; row++) {
    const angle = (Math.PI * row) / rows,
      axis = Math.cos(angle),
      radius = Math.sin(angle);
    if (capsule && row === rows / 2) {
      rings.push([0.00001, 1], [-0.00001, 1]);
    } else rings.push([axis, radius]);
  }
  const point = (row, column) => {
      const [axis, radius] = rings[row],
        a = (column / columns) * Math.PI * 2;
      return [axis, radius * Math.cos(a), radius * Math.sin(a)];
    },
    values = [];
  for (let row = 0; row < rings.length - 1; row++)
    for (let col = 0; col < columns; col++)
      for (const [r, c] of [
        [row, col],
        [row + 1, col],
        [row, col + 1],
        [row, col + 1],
        [row + 1, col],
        [row + 1, col + 1],
      ]) {
        const p = point(r, c);
        values.push(...p, ...p);
      }
  return new Float32Array(values);
}
function ringMesh(radius) {
  const values = [],
    point = (a, b) => {
      a = (a / 24) * Math.PI * 2;
      b = (b / 8) * Math.PI * 2;
      const n = [
        Math.cos(a) * Math.cos(b),
        Math.sin(a) * Math.cos(b),
        Math.sin(b),
      ];
      return [
        (radius + RING.wire * Math.cos(b)) * Math.cos(a),
        (radius + RING.wire * Math.cos(b)) * Math.sin(a),
        RING.wire * Math.sin(b),
        ...n,
      ];
    };
  for (let a = 0; a < 24; a++)
    for (let b = 0; b < 8; b++)
      for (const [i, j] of [
        [a, b],
        [a + 1, b],
        [a, b + 1],
        [a, b + 1],
        [a + 1, b],
        [a + 1, b + 1],
      ])
        values.push(...point(i, j));
  return new Float32Array(values);
}
