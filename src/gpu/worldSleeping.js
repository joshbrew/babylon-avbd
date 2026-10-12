import { uniformData, uploadUniform } from "./uniformUpload.js";
import shader from "./worldSleeping.wgsl";
import islandShader from "./islandSleeping.wgsl";
import contactShader from "./sleepContact.wgsl";
import { propertyEdits } from "./bufferEdits.js";
export class WorldSleeping {
  constructor(world, options = {}) {
    this.world = world;
    this.device = world.device;
    this.speed = options.speedThreshold ?? 0.03;
    this.delay = options.timeThreshold ?? 0.5;
    if (
      options.startAsleep !== undefined &&
      typeof options.startAsleep !== "boolean"
    )
      throw Error("startAsleep must be a boolean");
    if (options.islands !== undefined && typeof options.islands !== "boolean")
      throw Error("Sleep islands must be a boolean");
    this.islands =
      options.islands ??
      (world.gpu.bodyCount >= 4096 &&
        !world.gpu.portableContactMath &&
        !world.gpu.dispatchIsolation);
    this.initializing = !!options.startAsleep && this.islands;
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
    const module = d.createShaderModule({
      code: `${this.islands ? islandShader : shader}\n${contactShader}`,
    });
    this.layout = d.createBindGroupLayout({
      entries: [
        "storage",
        "storage",
        "read-only-storage",
        "read-only-storage",
        "read-only-storage",
        "storage",
        "uniform",
        "read-only-storage",
      ].map((type, binding) => ({
        binding,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type },
      })),
    });
    const layout = d.createPipelineLayout({ bindGroupLayouts: [this.layout] });
    this.pipelines = Object.fromEntries(
      [
        "before",
        "clear",
        ...(this.islands
          ? ["connectContacts", "connectJoints", "activity"]
          : []),
        "contacts",
        "joints",
        "rest",
      ].map((entryPoint) => [
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
        if (this.islands) flags[slot + 5] = slot / 8;
      }
    d.queue.writeBuffer(this.state, 0, data);
    this.wakeRequested = false;
  }
  register(index, mass, allowSleep = true) {
    const data = new Float32Array([mass, 0, 0, 0, 0, 0, 0, 0]);
    new Uint32Array(data.buffer)[4] = allowSleep ? 1 : 0;
    if (this.islands) new Uint32Array(data.buffer)[5] = index;
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
      storage.contacts,
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
    const { gpu } = this.world;
    const cache = (this.paramData ??= uniformData(12)),
      { u, f } = cache;
    u[0] = gpu.bodyCount;
    u[1] = gpu.jointCount;
    u[2] = gpu.manifoldCapacity;
    u[3] = Number(this.wakeRequested) | (this.initializing ? 2 : 0);
    f[4] = this.speed;
    f[5] = this.delay;
    f[6] = gpu.params.dt;
    f[7] = gpu.params.gravity;
    f[8] = gpu.params.up[0];
    f[9] = gpu.params.up[1];
    f[10] = gpu.params.up[2];
    uploadUniform(this.device, this.params, cache);
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
  wakeBody(index) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.world.gpu.bodyCount
    )
      throw Error("Sleeping wake requires a live GPU body index");
    // Keep this in the normal property batch; before() consumes the local flag.
    propertyEdits(this.world.gpu).uint(this.state, index * 8 + 7, 2);
  }
  after(encoder) {
    const gpu = this.world.gpu;
    // Collision buffers ping-pong in step(); bind the newly generated contacts.
    this.bindContacts();
    this.run(
      [
        ...(this.islands
          ? [
              ["connectContacts", gpu.manifoldCapacity],
              ["connectJoints", gpu.jointCount],
            ]
          : []),
        ["contacts", gpu.manifoldCapacity],
        ["joints", gpu.jointCount],
        ...(this.islands ? [["activity", gpu.bodyCount]] : []),
        ["rest", gpu.bodyCount],
      ],
      encoder,
    );
    this.initializing = false;
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
