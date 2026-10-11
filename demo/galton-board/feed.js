import shader from "./feed.wgsl";

/** Hold the visible hopper until opened; gravity handles the entire discharge. */
export class GaltonFeed {
  constructor(device, built, gpu, index) {
    this.device = device;
    this.gpu = gpu;
    this.feed = built.play.feed;
    this.binCount = this.feed.binCount;
    this.countBytes = (this.binCount + 3) * 4;
    this.opened = false;
    this.data = new Float32Array(gpu.bodyCount * 4);
    for (let i = 0; i < gpu.bodyCount; i++) this.data[i * 4 + 3] = -1;
    built.play.marbles.forEach((b) => {
      this.data.set([...b.positionLin, 0], index(b) * 4);
    });
    if (!gpu.bodyBuffer) {
      this.device = null;
      return;
    }
    this.metadata = device.createBuffer({
      size: this.data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.metadata, 0, this.data);
    this.uniform = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.settings = new ArrayBuffer(16);
    this.f = new Float32Array(this.settings);
    this.u = new Uint32Array(this.settings);
    this.u[2] = gpu.bodyCount;
    this.u[3] = this.binCount;
    this.f[0] = this.feed.outletHeight;
    device.queue.writeBuffer(this.uniform, 0, this.settings);
    this.pipeline = device.createComputePipeline({
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          code: shader,
          label: "Galton hopper gate",
        }),
        entryPoint: "holdAndRelease",
      },
    });
    this.group = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: gpu.bodyBuffer } },
        { binding: 1, resource: { buffer: this.metadata } },
        { binding: 2, resource: { buffer: gpu.filterBuffer } },
        { binding: 3, resource: { buffer: this.uniform } },
      ],
    });
  }
  async measure(force = false) {
    if (this.pending) return this.pending;
    if (!force && this.latest && performance.now() - this.lastMeasured < 750)
      return this.latest;
    this.pending = this.readHistogram().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }
  async readHistogram() {
    if (!this.device) {
      const bins = Array(this.binCount).fill(0);
      let released = 0,
        queued = 0,
        escaped = 0;
      for (let i = 0; i < this.gpu.bodyCount; i++) {
        if (this.data[i * 4 + 3] < 0) continue;
        const p = this.gpu.solver.bodies[i].positionLin;
        if (!this.opened || p[2] >= this.feed.outletHeight) {
          queued++;
          continue;
        }
        released++;
        if (p[2] >= 7.5) continue;
        const bin = Math.floor((p[0] + this.binCount * 0.52) / 1.04);
        if (bin >= 0 && bin < this.binCount) bins[bin]++;
        else escaped++;
      }
      this.lastMeasured = performance.now();
      return (this.latest = {
        bins,
        released,
        queued,
        escaped,
        opened: this.opened,
      });
    }
    if (!this.histPipeline) {
      this.counts = this.device.createBuffer({
        size: this.countBytes,
        usage:
          GPUBufferUsage.STORAGE |
          GPUBufferUsage.COPY_DST |
          GPUBufferUsage.COPY_SRC,
      });
      this.readback = this.device.createBuffer({
        size: this.countBytes,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });
      this.histPipeline = this.device.createComputePipeline({
        layout: "auto",
        compute: {
          module: this.device.createShaderModule({
            code: shader,
            label: "Galton bin counts",
          }),
          entryPoint: "histogram",
        },
      });
      this.histGroup = this.device.createBindGroup({
        layout: this.histPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.gpu.bodyBuffer } },
          { binding: 1, resource: { buffer: this.metadata } },
          { binding: 2, resource: { buffer: this.gpu.filterBuffer } },
          { binding: 3, resource: { buffer: this.uniform } },
          { binding: 4, resource: { buffer: this.counts } },
        ],
      });
    }
    const encoder = this.device.createCommandEncoder();
    encoder.clearBuffer(this.counts);
    const pass = encoder.beginComputePass({
      label: "Count actual Galton bins",
    });
    pass.setPipeline(this.histPipeline);
    pass.setBindGroup(0, this.histGroup);
    pass.dispatchWorkgroups(Math.ceil(this.gpu.bodyCount / 64));
    pass.end();
    encoder.copyBufferToBuffer(
      this.counts,
      0,
      this.readback,
      0,
      this.countBytes,
    );
    this.device.queue.submit([encoder.finish()]);
    try {
      await this.readback.mapAsync(GPUMapMode.READ);
      const counts = new Uint32Array(this.readback.getMappedRange()).slice();
      this.readback.unmap();
      this.lastMeasured = performance.now();
      return (this.latest = {
        bins: Array.from(counts.subarray(0, this.binCount)),
        released: counts[this.binCount],
        queued: counts[this.binCount + 1],
        escaped: counts[this.binCount + 2],
        opened: this.opened,
      });
    } catch (error) {
      if (!this.destroyed) throw error;
      return null;
    }
  }

  start() {
    this.opened = true;
  }
  get finished() {
    return this.activated;
  }
  encode(encoder) {
    if (this.finished) return;
    this.f[0] = this.feed.outletHeight;
    this.u[1] = +this.opened;
    this.u[2] = this.gpu.bodyCount;
    this.device.queue.writeBuffer(this.uniform, 0, this.settings);
    const pass = encoder.beginComputePass({
      label: "Hold the hopper or enable its marbles together",
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.group);
    pass.dispatchWorkgroups(Math.ceil(this.gpu.bodyCount / 64));
    pass.end();
    if (this.opened) this.activated = true;
  }
  cpuStep() {
    if (this.finished) return;
    const indices = [],
      groups = [],
      masks = [];
    for (let i = 0; i < this.gpu.bodyCount; i++) {
      const o = i * 4;
      if (this.data[o + 3] < 0) continue;
      const b = this.gpu.solver.bodies[i];
      if (this.opened) {
        indices.push(i);
        groups.push(1);
        masks.push(1);
        continue;
      }
      b.positionLin.set(this.data.subarray(o, o + 3));
      b.velocityLin.fill(0);
      b.velocityAng.fill(0);
    }
    if (indices.length) this.gpu.setFilters(indices, groups, masks);
    if (this.opened) this.activated = true;
  }
  destroy() {
    this.destroyed = true;
    this.counts?.destroy();
    this.readback?.destroy();
    this.metadata?.destroy();
    this.uniform?.destroy();
  }
}
