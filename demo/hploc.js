import { GpuTimer } from "../src/gpu/gpuTimer.js";
// Modified H-PLOC demo-safe GPU broadphase builder.
// This keeps the H-PLOC stage wired into the AVBD demo without depending on the
// experimental full BVH shader during the rigid-body iteration loop.

import hplocWGSL from "./hploc.wgsl";

function align4(n) {
  return (Math.max(4, n) + 3) & ~3;
}

export class BVHBuilder {
  constructor(device, primCap, tune = {}) {
    this.dev = device;
    this.cap = Math.max(1, primCap | 0);
    this.tune = {
      CELL_RES: tune.CELL_RES ?? 512,
      BLOCK_SIZE: tune.BLOCK_SIZE ?? 128,
    };
    this.module = device.createShaderModule({
      label: "modified-hploc-module",
      code: hplocWGSL,
    });
    this.pipeline = device.createComputePipeline({
      label: "modified-hploc-morton-pipeline",
      layout: "auto",
      compute: {
        module: this.module,
        entryPoint: "mortonCodes",
        constants: { CELL_RES: this.tune.CELL_RES },
      },
    });
    const storage =
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC;
    this.primAABB = device.createBuffer({
      label: "modified-hploc-prim-aabb",
      size: align4(this.cap * 32),
      usage: storage,
    });
    this.mortonKey = device.createBuffer({
      label: "modified-hploc-morton-key",
      size: align4(this.cap * 4),
      usage: storage,
    });
    this.params = device.createBuffer({
      label: "modified-hploc-params",
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.bindGroup = device.createBindGroup({
      label: "modified-hploc-bindgroup",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.primAABB } },
        { binding: 1, resource: { buffer: this.mortonKey } },
        { binding: 2, resource: { buffer: this.params } },
      ],
    });
    this.lastCount = 0;
    this.timer = new GpuTimer(device);
  }

  _pack(mins, maxs) {
    const count = Math.min(
      this.cap,
      Math.floor(mins.length / 3),
      Math.floor(maxs.length / 3),
    );
    const data = new Float32Array(count * 8);
    for (let i = 0; i < count; i += 1) {
      const s = i * 3;
      const d = i * 8;
      data[d + 0] = mins[s + 0];
      data[d + 1] = mins[s + 1];
      data[d + 2] = mins[s + 2];
      data[d + 3] = 0;
      data[d + 4] = maxs[s + 0];
      data[d + 5] = maxs[s + 1];
      data[d + 6] = maxs[s + 2];
      data[d + 7] = 0;
    }
    return { count, data };
  }

  build({ mins, maxs }) {
    const { count, data } = this._pack(mins, maxs);
    this.lastCount = count;
    if (count <= 0) return;
    this.dev.queue.writeBuffer(this.primAABB, 0, data, 0, data.length);
    const params = new Uint32Array([count, 0, 0, 0]);
    this.dev.queue.writeBuffer(this.params, 0, params);
    const enc = this.dev.createCommandEncoder({
      label: "modified-hploc-build-encoder",
    });
    const slot = this.timer.begin();
    const pass = enc.beginComputePass({
      label: "morton-keys",
      ...this.timer.descriptor(slot),
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(Math.ceil(count / 128));
    pass.end();
    this.timer.encode(enc, slot);
    this.dev.queue.submit([enc.finish()]);
    this.timer.resolve(slot);
  }
  destroy() {
    this.timer.destroy();
    this.primAABB.destroy();
    this.mortonKey.destroy();
    this.params.destroy();
  }
}
