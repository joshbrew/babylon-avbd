import collisionWGSL from "./surfaceParticles.wgsl";
import { GPUBufferRecycler } from "./bufferRecycler.js";
import { GpuTimer } from "./gpuTimer.js";

export const PARTICLE_BYTE_STRIDE = 48;

const TRIANGLE_BYTE_STRIDE = 48;
const COUNTER_BYTES = 16;
const PARAM_BYTES = 48;
class CounterReadbackRing {
  constructor(device, recycler, slotCount = 3) {
    this.device = device;
    this.recycler = recycler;
    this.slotCount = Math.max(2, slotCount | 0);
    this.usage = GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST;
    this.slots = [];
    this.cursor = 0;
    this.latest = { hits: 0, alive: 0 };
    for (let i = 0; i < this.slotCount; i += 1) {
      this.slots.push({
        buffer: recycler.acquire(
          COUNTER_BYTES,
          this.usage,
          `collision-counter-readback-${i}`,
        ),
        pending: false,
      });
    }
  }

  encodeCopy(commandEncoder, sourceBuffer) {
    let slot = null;
    for (let i = 0; i < this.slots.length; i += 1) {
      const idx = (this.cursor + i) % this.slots.length;
      if (!this.slots[idx].pending) {
        slot = this.slots[idx];
        this.cursor = (idx + 1) % this.slots.length;
        break;
      }
    }
    if (!slot) {
      return null;
    }

    slot.pending = true;
    commandEncoder.copyBufferToBuffer(
      sourceBuffer,
      0,
      slot.buffer,
      0,
      COUNTER_BYTES,
    );
    return slot;
  }

  resolve(slot) {
    if (!slot) {
      return this.latest;
    }
    slot.buffer
      .mapAsync(GPUMapMode.READ)
      .then(() => {
        const data = new Uint32Array(slot.buffer.getMappedRange(), 0, 4);
        this.latest = { hits: data[0], alive: data[1] };
        slot.buffer.unmap();
        slot.pending = false;
      })
      .catch((error) => {
        if (!this.disposed)
          console.warn("Particle counter readback failed:", error);
        slot.pending = false;
      });
    return this.latest;
  }

  destroy() {
    this.disposed = true;
    for (const slot of this.slots) {
      if (!slot.pending) {
        this.recycler.release(slot.buffer, COUNTER_BYTES, this.usage);
      }
    }
    this.slots.length = 0;
  }
}

export class GpuSurfaceParticles {
  constructor(device, { capacity, triangleCount, readback = true } = {}) {
    const maxDispatch =
      device.limits.maxComputeWorkgroupsPerDimension ** 2 * 128;
    const maxBytes = Math.min(
      device.limits.maxStorageBufferBindingSize,
      device.limits.maxBufferSize,
    );
    for (const [name, count, stride] of [
      ["capacity", capacity, PARTICLE_BYTE_STRIDE],
      ["triangleCount", triangleCount, TRIANGLE_BYTE_STRIDE],
    ])
      if (
        !Number.isSafeInteger(count) ||
        count < 1 ||
        count * stride > maxBytes ||
        (name === "capacity" && count > maxDispatch)
      )
        throw Error(
          `Invalid particle ${name}: exceeds GPU capacity or is not a positive integer`,
        );
    this.device = device;
    this.timer = new GpuTimer(device);
    this.capacity = capacity;
    this.triangleCount = triangleCount;
    this.frame = 0;
    this.recycler = new GPUBufferRecycler(device);
    this.storageUsage =
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC;
    this.uniformUsage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
    this.module = device.createShaderModule({
      label: "collision-benchmark-module",
      code: collisionWGSL,
    });
    this.pipeline = device.createComputePipeline({
      label: "collision-benchmark-pipeline",
      layout: "auto",
      compute: { module: this.module, entryPoint: "collisionBenchmark" },
    });
    this.particleBuffer = this.recycler.acquire(
      this.capacity * PARTICLE_BYTE_STRIDE,
      this.storageUsage,
      "collision-bullets",
    );

    this.triangleBuffer = this.recycler.acquire(
      this.triangleCount * TRIANGLE_BYTE_STRIDE,
      this.storageUsage,
      "collision-triangles",
    );
    this.counterBuffer = this.recycler.acquire(
      COUNTER_BYTES,
      this.storageUsage,
      "collision-counters",
    );
    this.paramBuffer = this.recycler.acquire(
      PARAM_BYTES,
      this.uniformUsage,
      "collision-params",
    );
    this.params = new ArrayBuffer(PARAM_BYTES);
    this.zeroCounters = new Uint32Array(4);
    this.readback = readback
      ? new CounterReadbackRing(device, this.recycler, 3)
      : null;
    this.bindGroup = device.createBindGroup({
      label: "collision-benchmark-bg",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.particleBuffer } },
        { binding: 1, resource: { buffer: this.triangleBuffer } },
        { binding: 2, resource: { buffer: this.counterBuffer } },
        { binding: 3, resource: { buffer: this.paramBuffer } },
      ],
    });
    this.clear();
  }

  clear() {
    if (this.disposed) throw Error("Particle system has been destroyed");
    const encoder = this.device.createCommandEncoder({label:"Clear surface particles"});
    encoder.clearBuffer(this.particleBuffer);
    this.device.queue.submit([encoder.finish()]);
    this.frame = 0;
    if (this.readback) this.readback.latest = {hits:0,alive:0};
  }

  writeTriangles(triangleData) {
    if (this.disposed) throw Error("Particle system has been destroyed");
    if (
      !(triangleData instanceof Float32Array) ||
      triangleData.length !== this.triangleCount * 12 ||
      !triangleData.every(Number.isFinite)
    )
      throw Error(
        "Triangles require 12 finite float32 values per triangle: padded a, b, c vertices",
      );
    this.device.queue.writeBuffer(this.triangleBuffer, 0, triangleData);
  }

  step(options) {
    if (this.disposed) throw Error("Particle system has been destroyed");
    const config = {
      speed: 80,
      life: 3,
      bulletRadius: 0.09,
      spawnRadius: 32,
      jitter: 4.8,
      ...options,
      target: options.count ?? this.capacity,
      frame: options.frame ?? this.frame++,
    };
    if (
      !Number.isSafeInteger(config.target) ||
      config.target < 1 ||
      config.target > this.capacity
    )
      throw Error("Particle count exceeds allocated capacity");
    for (const key of ["dt", "speed", "life", "bulletRadius", "spawnRadius"])
      if (!Number.isFinite(config[key]) || config[key] <= 0)
        throw Error(`Particle ${key} must be positive and finite`);
    if (!Number.isFinite(config.jitter) || config.jitter < 0)
      throw Error("Particle jitter must be nonnegative and finite");
    const f32 = new Float32Array(this.params);
    const u32 = new Uint32Array(this.params);
    f32.fill(0);
    f32[0] = config.dt;
    f32[1] = config.speed;
    f32[2] = config.life;
    f32[3] = config.bulletRadius;
    f32[4] = config.spawnRadius;
    f32[5] = config.jitter;
    u32[6] = config.target >>> 0;
    u32[7] = this.triangleCount >>> 0;
    u32[8] = config.frame >>> 0;
    const groups = Math.ceil(config.target / 128);
    const rows = Math.ceil(
      groups / this.device.limits.maxComputeWorkgroupsPerDimension,
    );
    const columns = Math.ceil(groups / rows);
    u32[9] = columns * 128;

    this.device.queue.writeBuffer(this.paramBuffer, 0, this.params);
    this.device.queue.writeBuffer(this.counterBuffer, 0, this.zeroCounters);

    const enc = this.device.createCommandEncoder({
      label: "collision-benchmark-encoder",
    });
    const timing = this.timer.begin();
    const pass = enc.beginComputePass({
      label: "collision-benchmark-pass",
      ...this.timer.descriptor(timing),
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(columns, rows);
    pass.end();
    this.timer.encode(enc, timing);
    const slot = this.readback?.encodeCopy(enc, this.counterBuffer);
    this.device.queue.submit([enc.finish()]);
    this.timer.resolve(timing);
    return this.readback?.resolve(slot) ?? null;
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.timer.destroy();
    this.readback?.destroy();
    this.recycler.release(
      this.particleBuffer,
      this.capacity * PARTICLE_BYTE_STRIDE,
      this.storageUsage,
    );
    this.recycler.release(
      this.triangleBuffer,
      this.triangleCount * TRIANGLE_BYTE_STRIDE,
      this.storageUsage,
    );
    this.recycler.release(this.counterBuffer, COUNTER_BYTES, this.storageUsage);
    this.recycler.release(this.paramBuffer, PARAM_BYTES, this.uniformUsage);
    this.recycler.destroy();
  }
}
