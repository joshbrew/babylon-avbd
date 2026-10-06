import shader from "./worldSleeping.wgsl";
import { propertyEdits } from "./bufferEdits.js";
export class WorldSleeping {
  constructor(world, options = {}) {
    this.world = world;
    this.device = world.device;
    this.speed = options.speedThreshold ?? 0.03;
    this.delay = options.timeThreshold ?? 0.5;
    if (
      !Number.isFinite(this.speed) ||
      this.speed <= 0 ||
      !Number.isFinite(this.delay) ||
      this.delay <= 0
    )
      throw Error(
        "Sleep speedThreshold and timeThreshold must be positive and finite",
      );
    const d = this.device,
      storage =
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC;
    this.state = d.createBuffer({ size: world.capacity * 32, usage: storage });
    this.globals = d.createBuffer({ size: 8, usage: storage });
    this.params = d.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const module = d.createShaderModule({ code: shader });
    this.layout = d.createBindGroupLayout({
      entries: [
        "storage",
        "storage",
        "read-only-storage",
        "read-only-storage",
        "read-only-storage",
        "storage",
        "uniform",
      ].map((type, binding) => ({
        binding,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type },
      })),
    });
    const layout = d.createPipelineLayout({ bindGroupLayouts: [this.layout] });
    this.pipelines = Object.fromEntries(
      ["before", "clear", "contacts", "joints", "rest"].map((entryPoint) => [
        entryPoint,
        d.createComputePipeline({ layout, compute: { module, entryPoint } }),
      ]),
    );
    const data = new Float32Array(world.capacity * 8);
    const flags = new Uint32Array(data.buffer);
    for (const a of world.aggregates)
      if (!a.disposed) {
        const slot = (a.gpuSlot ?? world.gpu.gpuIndex(a.index)) * 8;
        data[slot] = a.rigid.mass;
        flags[slot + 4] =
          a.allowSleep === false || a.rigid.allowSleep === false ? 0 : 1;
      }
    d.queue.writeBuffer(this.state, 0, data);
    this.wakeRequested = false;
  }
  register(index, mass, allowSleep = true) {
    const data = new Float32Array([mass, 0, 0, 0, 0, 0, 0, 0]);
    new Uint32Array(data.buffer)[4] = allowSleep ? 1 : 0;
    const words = new Uint32Array(data.buffer),
      edits = propertyEdits(this.world.gpu);
    for (let k = 0; k < 8; k++) edits.uint(this.state, index * 8 + k, words[k]);
    this.wakeRequested = true;
  }
  bindContacts() {
    const gpu = this.world.gpu,
      storage = gpu.contactStorage;
    const buffers = [
      gpu.bodyBuffer,
      this.state,
      gpu.infoBuffer,
      storage.manifolds,
      storage.counters,
      this.globals,
      this.params,
    ];
    let cached = this.groups?.find((entry) =>
      entry.buffers.every((buffer, i) => buffer === buffers[i]),
    );
    if (!cached) {
      cached = {
        buffers,
        group: this.device.createBindGroup({
          layout: this.layout,
          entries: buffers.map((buffer, binding) => ({
            binding,
            resource: { buffer },
          })),
        }),
      };
      // Retain the two ping-pong contact sets; discard references after growth.
      this.groups = [...(this.groups ?? []).slice(-1), cached];
    }
    this.group = cached.group;
  }
  before(encoder) {
    this.world.gpu.flushPropertyEdits(encoder);
    const { gpu } = this.world,
      storage = gpu.contactStorage;
    const data = new ArrayBuffer(48),
      u = new Uint32Array(data),
      f = new Float32Array(data);
    u.set([
      gpu.bodyCount,
      gpu.jointCount,
      gpu.manifoldCapacity,
      this.wakeRequested ? 1 : 0,
    ]);
    f.set([this.speed, this.delay, gpu.params.dt, gpu.params.gravity], 4);
    f.set(gpu.params.up, 8);
    this.device.queue.writeBuffer(this.params, 0, data);
    this.wakeRequested = false;
    // Contact and joint buffers can grow between steps.
    this.bindContacts();
    this.run(
      [
        ["before", gpu.bodyCount],
        ["clear", 1],
      ],
      encoder,
    );
  }
  after(encoder) {
    const gpu = this.world.gpu,
      storage = gpu.contactStorage;
    // Collision buffers ping-pong in step(); bind the newly generated contacts.
    this.bindContacts();
    this.run(
      [
        ["contacts", gpu.manifoldCapacity],
        ["joints", gpu.jointCount],
        ["rest", gpu.bodyCount],
      ],
      encoder,
    );
  }
  run(entries, encoder) {
    const e = encoder ?? this.device.createCommandEncoder(),
      pass = e.beginComputePass();
    pass.setBindGroup(0, this.group);
    for (const [name, n] of entries) {
      if (!n) continue;
      pass.setPipeline(this.pipelines[name]);
      pass.dispatchWorkgroups(name === "clear" ? 1 : Math.ceil(n / 64));
    }
    pass.end();
    if (!encoder) this.device.queue.submit([e.finish()]);
  }
  async readStats() {
    const d = this.device,
      b = d.createBuffer({
        size: 8,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    try {
      const e = d.createCommandEncoder();
      e.copyBufferToBuffer(this.globals, 0, b, 0, 8);
      d.queue.submit([e.finish()]);
      await b.mapAsync(GPUMapMode.READ);
      const v = new Uint32Array(b.getMappedRange());
      return { sleeping: v[1], wakeRequested: !!v[0] };
    } finally {
      b.destroy();
    }
  }
  dispose() {
    this.world.gpu.propertyEdits?.forget(this.state);
    this.state.destroy();
    this.globals.destroy();
    this.params.destroy();
  }
}
