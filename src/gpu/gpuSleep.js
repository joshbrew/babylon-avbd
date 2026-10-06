import shader from "./gpuSleep.wgsl";
import { GpuTimer } from "./gpuTimer.js";

// Sleeping is an app-level scheduling policy. Canonical constraint math and
// upstream sources remain unchanged; sleeping bodies act as fixed supports.
export class GpuSleep {
  constructor(device, solver, gpu, { batchPasses = true } = {}) {
    this.device = device;
    this.gpu = gpu;
    this.batchPasses = batchPasses;
    this.resources = [];
    this.count = solver.bodies.length;
    this.projectile = gpu.gpuIndex(this.count - 1);
    this.cell = 2.3;
    this.min = [-250, -40, -2];
    this.dims = [220, 45, 55];
    this.cells = this.dims.reduce((a, b) => a * b);
    const state = new ArrayBuffer(this.count * 32),
      f = new Float32Array(state),
      u = new Uint32Array(state);
    const buckets = new Map(),
      key = (p) => p.map((v) => Math.floor(v / this.cell)).join(",");
    solver.bodies.forEach((b, i) => {
      if (b.mass > 0 && i !== this.count - 1) {
        const k = key([...b.positionLin]);
        if (!buckets.has(k)) buckets.set(k, []);
        buckets.get(k).push(i);
      }
    });
    solver.bodies.forEach((b, i) => {
      const id = gpu.gpuIndex(i),
        o = id * 8;
      f[o] = b.mass;
      u[o + 2] = i === this.count - 1 ? 1 : 0;
      u[o + 3] = i;
      u.fill(0xffffffff, o + 4, o + 8);
      if (b.mass <= 0 || i === this.count - 1) return;
      const p = [...b.positionLin],
        c = p.map((v) => Math.floor(v / this.cell)),
        support = [];
      for (let z = -1; z <= 0; z++)
        for (let y = -1; y <= 1; y++)
          for (let x = -1; x <= 1; x++) {
            for (const j of buckets.get(
              [c[0] + x, c[1] + y, c[2] + z].join(","),
            ) || []) {
              const a = solver.bodies[j];
              if (a.positionLin[2] >= p[2]) continue;
              const bottom = p[2] - b.size[2] / 2,
                top = a.positionLin[2] + a.size[2] / 2;
              if (
                Math.abs(top - bottom) < 0.02 &&
                Math.abs(p[0] - a.positionLin[0]) <
                  (b.size[0] + a.size[0]) / 2 - 0.01 &&
                Math.abs(p[1] - a.positionLin[1]) <
                  (b.size[1] + a.size[1]) / 2 - 0.01
              )
                support.push(gpu.gpuIndex(j));
            }
          }
      if (support.length > 4)
        throw Error(
          "Benchmark sleep graph exceeds four original supports per brick.",
        );
      u.set(support, o + 4);
      if (!support.length && p[2] - b.size[2] / 2 > 0.015)
        throw Error(`Unsupported initial sleeping brick ${i}`);
    });
    this.snapshot = this.buffer(this.count * 160);
    this.heads = this.buffer((this.cells + 1) * 4);
    this.next = this.buffer(this.count * 4);
    this.state = this.buffer(state.byteLength, new Uint8Array(state));
    this.masses = Float32Array.from({ length: this.count }, (_, i) => f[i * 8]);
    const data = new ArrayBuffer(48),
      pf = new Float32Array(data),
      pu = new Uint32Array(data);
    pu.set([this.count, this.cells, ...this.dims, this.projectile]);
    pf.set([this.cell, solver.dt], 6);
    pf.set(this.min, 8);
    this.params = this.buffer(
      48,
      new Uint8Array(data),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );
    const module = device.createShaderModule({
      label: "Benchmark sleeping islands",
      code: shader,
    });
    const layout = device.createBindGroupLayout({
      entries: [0, 1, 2, 3, 4, 5].map((binding) => ({
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
    this.group = device.createBindGroup({
      layout,
      entries: [
        gpu.bodyBuffer,
        this.snapshot,
        this.state,
        this.heads,
        this.next,
        this.params,
      ].map((buffer, binding) => ({ binding, resource: { buffer } })),
    });
    const pl = device.createPipelineLayout({ bindGroupLayouts: [layout] });
    this.pipelines = {};
    for (const entryPoint of [
      "initialize",
      "clear",
      "build",
      "wake",
      "rest",
      "countAwake",
    ])
      this.pipelines[entryPoint] = device.createComputePipeline({
        layout: pl,
        compute: { module, entryPoint },
      });
    this.timer = new GpuTimer(device);
    this.physicsTimer = new GpuTimer(device);
    const encoder = device.createCommandEncoder();
    this.dispatch(encoder, "initialize", this.count);
    device.queue.submit([encoder.finish()]);
  }
  buffer(
    size,
    data,
    usage = GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC,
  ) {
    const b = this.device.createBuffer({ size, usage });
    if (data) this.device.queue.writeBuffer(b, 0, data);
    this.resources.push(b);
    return b;
  }
  dispatch(e, name, count, desc = {}) {
    this.dispatchBatch(e, [[name, count]], desc);
  }
  dispatchBatch(e, kernels, desc = {}) {
    // Ordered dispatches share the same storage usages. Keeping them in one
    // compute pass preserves dependencies while avoiding extra pass boundaries.
    const p = e.beginComputePass(desc);
    p.setBindGroup(0, this.group);
    for (const [name, count] of kernels) {
      p.setPipeline(this.pipelines[name]);
      p.dispatchWorkgroups(Math.ceil(count / 256));
    }
    p.end();
  }
  before() {
    const e = this.device.createCommandEncoder(),
      slot = this.timer.begin();
    this.physicsSlot = this.physicsTimer.begin();
    e.copyBufferToBuffer(
      this.gpu.bodyBuffer,
      0,
      this.snapshot,
      0,
      this.count * 160,
    );
    this.dispatchBatch(
      e,
      this.batchPasses
        ? [
            ["clear", this.cells],
            ["build", this.count],
          ]
        : [["clear", this.cells]],
      this.physicsSlot
        ? {
            timestampWrites: {
              querySet: this.physicsSlot.query,
              beginningOfPassWriteIndex: 0,
            },
          }
        : {},
    );
    if (!this.batchPasses) this.dispatch(e, "build", this.count);
    this.dispatch(e, "wake", this.count, this.timer.descriptor(slot));
    this.timer.encode(e, slot);
    this.device.queue.submit([e.finish()]);
    this.timer.resolve(slot);
  }
  after() {
    const e = this.device.createCommandEncoder();
    if (!this.batchPasses) this.dispatch(e, "rest", this.count);
    this.dispatchBatch(
      e,
      this.batchPasses
        ? [
            ["rest", this.count],
            ["countAwake", this.count],
          ]
        : [["countAwake", this.count]],
      this.physicsSlot
        ? {
            timestampWrites: {
              querySet: this.physicsSlot.query,
              endOfPassWriteIndex: 1,
            },
          }
        : {},
    );
    this.physicsTimer.encode(e, this.physicsSlot);
    this.device.queue.submit([e.finish()]);
    this.physicsTimer.resolve(this.physicsSlot);
  }
  async readAwake() {
    const b = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const e = this.device.createCommandEncoder();
    e.copyBufferToBuffer(this.heads, this.cells * 4, b, 0, 4);
    this.device.queue.submit([e.finish()]);
    await b.mapAsync(GPUMapMode.READ);
    const n = new Uint32Array(b.getMappedRange())[0];
    b.unmap();
    b.destroy();
    return n;
  }
  wakeBody(id) {
    if (this.masses[id] > 0) {
      this.device.queue.writeBuffer(
        this.gpu.bodyBuffer,
        id * 160 + 19 * 4,
        new Float32Array([this.masses[id]]),
      );
      this.device.queue.writeBuffer(
        this.state,
        id * 32 + 4,
        new Uint32Array([0, 1]),
      );
    }
  }
  setMass(id, mass) {
    this.masses[id] = mass;
    this.device.queue.writeBuffer(
      this.state,
      id * 32,
      new Float32Array([mass]),
    );
    this.wakeBody(id);
  }
  dispose() {
    this.timer.destroy();
    this.physicsTimer.destroy();
    for (const b of this.resources) b.destroy();
  }
}
