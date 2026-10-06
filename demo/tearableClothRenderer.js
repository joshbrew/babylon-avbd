import { tearableClothsOf } from "./clothTopology.js";
import shader from "./tearableClothRender.wgsl";
export class TearableClothRenderer {
  constructor(renderer, texture, sampler) {
    this.renderer = renderer;
    this.resources = [];
    this.texture = texture;
    this.sampler = sampler;
    const sheets = tearableClothsOf(renderer.solver);
    if (!sheets.length) return;
    const bodyMap = new Map(
        renderer.solver.bodies.map((b, i) => [b, renderer.gpu.gpuIndex(i)]),
      ),
      forceMap = new Map(renderer.forces.map((f, i) => [f, i]));
    const triangles = sheets.flatMap((s) => s.triangles),
      bytes = new ArrayBuffer(triangles.length * 128),
      u = new Uint32Array(bytes),
      f = new Float32Array(bytes);
    triangles.forEach((t, i) => {
      const o = i * 32;
      const edge = (a, b) => {
        const spring = t.bonds.find(
          (bond) =>
            (bond.bodyA === a && bond.bodyB === b) ||
            (bond.bodyA === b && bond.bodyB === a),
        );
        if (!spring) throw Error("Fabric triangle is missing its edge spring");
        return forceMap.get(spring);
      };
      u.set(
        [
          ...t.bodies.map((b) => bodyMap.get(b)),
          edge(t.bodies[0], t.bodies[1]),
          edge(t.bodies[0], t.bodies[2]),
          edge(t.bodies[1], t.bodies[2]),
          0,
          0,
        ],
        o,
      );
      f.set(t.uv, o + 8);
      t.bodies.forEach((body, corner) =>
        f.set(body.positionLin, o + 16 + corner * 4),
      );
    });
    const d = renderer.device;
    // Six material triangles per original face partition it into three patches.
    // Each patch belongs to its simulated point and survives all spring breaks.
    this.count = triangles.length * 18;
    this.buffer = d.createBuffer({
      size: bytes.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    d.queue.writeBuffer(this.buffer, 0, bytes);
    this.resources.push(this.buffer);
    // Shared positions and area-weighted normals keep unbroken seams smooth.
    const neighbors = Array.from(
      { length: renderer.solver.bodies.length },
      () => [],
    );
    triangles.forEach((t, i) =>
      t.bodies.forEach((b) => neighbors[bodyMap.get(b)].push(i)),
    );
    const header = [],
      faces = [];
    neighbors.forEach((list) => {
      header.push(neighbors.length * 2 + faces.length, list.length);
      faces.push(...list);
    });
    const adjacency = Uint32Array.from([...header, ...faces]);
    this.adjacency = d.createBuffer({
      size: adjacency.byteLength,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    d.queue.writeBuffer(this.adjacency, 0, adjacency);
    this.resources.push(this.adjacency);
    this.layout = d.createBindGroupLayout({
      entries: [
        ...[
          "read-only-storage",
          "uniform",
          "read-only-storage",
          "read-only-storage",
        ].map((type, binding) => ({
          binding,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type },
        })),
        { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: {} },
        { binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        {
          binding: 6,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
      ],
    });
    const module = d.createShaderModule({ code: shader });
    this.pipeline = d.createRenderPipeline({
      layout: d.createPipelineLayout({ bindGroupLayouts: [this.layout] }),
      multisample: { count: renderer.sampleCount },
      vertex: { module, entryPoint: "main" },
      fragment: {
        module,
        entryPoint: "fragment",
        targets: [{ format: renderer.format }],
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less-equal",
      },
    });
  }
  draw(pass) {
    if (!this.count) return;
    const r = this.renderer,
      joints = r.gpu.jointBuffer;
    if (this.boundJoints !== joints) {
      this.boundJoints = joints;
      this.group = r.device.createBindGroup({
        layout: this.layout,
        entries: [
          ...[r.buffer, r.camera, this.buffer, joints].map(
            (buffer, binding) => ({ binding, resource: { buffer } }),
          ),
          { binding: 4, resource: this.texture.createView() },
          { binding: 5, resource: this.sampler },
          { binding: 6, resource: { buffer: this.adjacency } },
        ],
      });
    }
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.group);
    pass.draw(this.count);
  }
  dispose() {
    for (const b of this.resources) b.destroy();
  }
}
