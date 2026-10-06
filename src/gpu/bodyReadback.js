// Gather just the requested records, including a compact 32-byte rendering
// path. No whole-world pose download when only a few meshes are mirrored.
export class BodyReadback {
  constructor(device) {
    this.device = device;
    this.pipelines = new Map();
    this.idle = [];
    this.jobs = new Set();
    this.destroyed = false;
  }
  acquire(indexBytes, bytes) {
    if (this.destroyed) throw Error("Pose readback has been destroyed");
    const device = this.device;
    if (
      indexBytes > device.limits.maxStorageBufferBindingSize ||
      bytes >
        Math.min(
          device.limits.maxStorageBufferBindingSize,
          device.limits.maxBufferSize,
        )
    )
      throw Error("Pose selection exceeds GPU buffer limits");
    const suitable = this.idle.findIndex(
      (j) => j.selection.size >= indexBytes && j.selected.size >= bytes,
    );
    const job =
      suitable >= 0
        ? this.idle.splice(suitable, 1)[0]
        : (this.idle.pop() ?? {});
    for (const [name, size, usage] of [
      [
        "selection",
        indexBytes,
        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      ],
      ["selected", bytes, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC],
      ["staging", bytes, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST],
    ])
      if (!job[name] || job[name].size < size) {
        job[name]?.destroy();
        job[name] = device.createBuffer({ size, usage });
      }
    this.jobs.add(job);
    return job;
  }
  release(job) {
    job.staging.unmap();
    // Small repeated selections benefit from reuse. Large downloads do not retain huge allocations.
    if (
      !this.destroyed &&
      job.selected.size <= 8 * 1024 * 1024 &&
      this.idle.length < 2
    )
      this.idle.push(job);
    else {
      for (const name of ["selection", "selected", "staging"])
        job[name].destroy();
      this.jobs.delete(job);
    }
  }
  destroy() {
    this.destroyed = true;
    for (const job of this.jobs)
      for (const name of ["selection", "selected", "staging"])
        job[name].destroy();
    this.jobs.clear();
    this.idle.length = 0;
  }
  async read(buffer, indices, posesOnly = false, bodyVec4s = 10) {
    if (!indices.length) return new Float32Array();
    const stride = posesOnly ? (bodyVec4s === 6 ? 1 : 2) : bodyVec4s,
      device = this.device,
      maxGroups = device.limits.maxComputeWorkgroupsPerDimension;
    const key = `${bodyVec4s}:${stride}`;
    let pipeline = this.pipelines.get(key);
    if (!pipeline) {
      pipeline = device.createComputePipeline({
        layout: "auto",
        compute: {
          entryPoint: "gather",
          module: device.createShaderModule({
            code: `
        @group(0) @binding(0) var<storage,read> bodies:array<vec4f>;
        @group(0) @binding(1) var<storage,read> indices:array<u32>;
        @group(0) @binding(2) var<storage,read_write> selected:array<vec4f>;
        @compute @workgroup_size(64) fn gather(@builtin(global_invocation_id) id:vec3u) {
          let i=id.x+id.y*${maxGroups * 64}u; if(i>=arrayLength(&selected)){return;}
          selected[i]=bodies[indices[i/${stride}u]*${bodyVec4s}u+i%${stride}u];
        }`,
          }),
        },
      });
      this.pipelines.set(key, pipeline);
    }
    const bytes = indices.length * stride * 16;
    const job = this.acquire(indices.length * 4, bytes);
    const { selection, selected, staging } = job;
    try {
      device.queue.writeBuffer(
        selection,
        0,
        indices instanceof Uint32Array ? indices : Uint32Array.from(indices),
      );
      if (
        !job.group ||
        job.body !== buffer ||
        job.pipeline !== pipeline ||
        job.boundSelection !== selection ||
        job.boundSelected !== selected ||
        job.indexBytes !== indices.length * 4 ||
        job.bytes !== bytes
      ) {
        job.group = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer } },
            {
              binding: 1,
              resource: { buffer: selection, size: indices.length * 4 },
            },
            { binding: 2, resource: { buffer: selected, size: bytes } },
          ],
        });
        job.body = buffer;
        job.pipeline = pipeline;
        job.boundSelection = selection;
        job.boundSelected = selected;
        job.indexBytes = indices.length * 4;
        job.bytes = bytes;
      }
      const encoder = device.createCommandEncoder(),
        pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, job.group);
      const groups = Math.ceil((indices.length * stride) / 64);
      pass.dispatchWorkgroups(
        Math.min(groups, maxGroups),
        Math.ceil(groups / maxGroups),
      );
      pass.end();
      encoder.copyBufferToBuffer(selected, 0, staging, 0, bytes);
      device.queue.submit([encoder.finish()]);
      await staging.mapAsync(GPUMapMode.READ, 0, bytes);
      return new Float32Array(staging.getMappedRange(0, bytes).slice(0));
    } finally {
      this.release(job);
    }
  }
}
