import { GpuTimer } from "../src/gpu/gpuTimer.js";
import broadphaseWGSL from "./gpuBroadphase.wgsl";

const PARAM_BYTES = 16;
const STATS_BYTES = 8;

export class GPUAABBNeighborBuilder {
  static async create(device, {
    bodyBuffer,
    neighborBuffer,
    bodyCapacity,
    maxNeighbors = 64,
    padding = 0.02,
  }) {
    const module = device.createShaderModule({
      label: "gpu-aabb-neighbors-module",
      code: broadphaseWGSL,
    });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((message) => message.type === "error");
    if (errors.length) {
      throw new Error(
        errors
          .map(
            (message) =>
              `GPU broadphase line ${message.lineNum}: ${message.message}`,
          )
          .join("\n"),
      );
    }
    return new GPUAABBNeighborBuilder(device, module, {
      bodyBuffer,
      neighborBuffer,
      bodyCapacity,
      maxNeighbors,
      padding,
    });
  }

  constructor(device, module, options) {
    this.device = device;
    this.bodyCapacity = options.bodyCapacity;
    this.maxNeighbors = options.maxNeighbors;
    this.padding = options.padding;
    this.pipeline = device.createComputePipeline({
      label: "gpu-aabb-neighbors-pipeline",
      layout: "auto",
      compute: { module, entryPoint: "buildNeighbors" },
    });
    this.params = device.createBuffer({
      label: "gpu-aabb-neighbors-params",
      size: PARAM_BYTES,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.stats = device.createBuffer({
      label: "gpu-aabb-neighbors-stats",
      size: STATS_BYTES,
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
    this.bindGroup = device.createBindGroup({
      label: "gpu-aabb-neighbors-bind-group",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: options.bodyBuffer } },
        { binding: 1, resource: { buffer: options.neighborBuffer } },
        { binding: 2, resource: { buffer: this.params } },
        { binding: 3, resource: { buffer: this.stats } },
      ],
    });
    this.timer = new GpuTimer(device);
  }

  build(bodyCount) {
    const count = Math.min(this.bodyCapacity, Math.max(0, bodyCount | 0));
    if (!count) return;
    const data = new ArrayBuffer(PARAM_BYTES);
    const u32 = new Uint32Array(data);
    const f32 = new Float32Array(data);
    u32[0] = count;
    u32[1] = this.maxNeighbors;
    f32[2] = this.padding;
    this.device.queue.writeBuffer(this.params, 0, data);
    this.device.queue.writeBuffer(this.stats, 0, new Uint32Array(2));

    const encoder = this.device.createCommandEncoder({
      label: "gpu-aabb-neighbors-encoder",
    });
    const timerSlot = this.timer.begin();
    const pass = encoder.beginComputePass({
      label: "gpu-aabb-neighbors",
      ...this.timer.descriptor(timerSlot),
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(Math.ceil(count / 64));
    pass.end();
    this.timer.encode(encoder, timerSlot);
    this.device.queue.submit([encoder.finish()]);
    this.timer.resolve(timerSlot);
  }

  destroy() {
    this.timer.destroy();
    this.params.destroy();
    this.stats.destroy();
  }
}
