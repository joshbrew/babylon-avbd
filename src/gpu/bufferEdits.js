/** Coalesced property patches. Only owned words are changed, preserving live GPU state. */
export class BufferEdits {
  constructor(device) {
    this.device = device;
    this.targets = new Map();
    this.bits = new Float32Array(1);
    this.words = new Uint32Array(this.bits.buffer);
  }
  target(buffer) {
    let target = this.targets.get(buffer);
    if (!target) this.targets.set(buffer, (target = { pending: new Map() }));
    return target;
  }
  uint(buffer, word, value) {
    this.target(buffer).pending.set(word, value >>> 0);
  }
  float(buffer, word, value) {
    this.bits[0] = value;
    this.uint(buffer, word, this.words[0]);
  }
  get pending() {
    for (const target of this.targets.values())
      if (target.pending.size) return true;
    return false;
  }
  flush(encoder) {
    const d = this.device;
    let e = encoder,
      writes = 0,
      dispatches = 0,
      words = 0,
      uploadedBytes = 0;
    for (const [buffer, target] of this.targets) {
      const n = target.pending.size;
      if (!n) continue;
      if (!target.data || target.data.length < n * 2)
        target.data = new Uint32Array(
          Math.max(n * 2, (target.data?.length ?? 0) * 2, 128),
        );
      const offsets = Array.from(target.pending.keys());
      let ordered = true;
      for (let i = 1; i < n; i++)
        if (offsets[i] < offsets[i - 1]) {
          ordered = false;
          break;
        }
      if (!ordered) offsets.sort((a, b) => a - b);
      let runs = 1;
      for (let i = 1; i < n; i++) if (offsets[i] !== offsets[i - 1] + 1) runs++;
      // Few contiguous ranges are cheaper as direct uploads. Sparse edits share a dispatch.
      if (runs <= 4 || n <= 8) {
        for (let i = 0; i < n; i++)
          target.data[i] = target.pending.get(offsets[i]);
        for (let start = 0; start < n;) {
          let end = start + 1;
          while (end < n && offsets[end] === offsets[end - 1] + 1) end++;
          d.queue.writeBuffer(
            buffer,
            offsets[start] * 4,
            target.data.buffer,
            start * 4,
            (end - start) * 4,
          );
          writes++;
          start = end;
        }
        uploadedBytes += n * 4;
      } else {
        const bytes = n * 8;
        const limit = Math.min(
          d.limits.maxBufferSize,
          d.limits.maxStorageBufferBindingSize,
        );
        if (bytes > limit)
          throw Error("Property batch exceeds GPU buffer limits");
        for (let i = 0; i < n; i++) {
          target.data[i * 2] = offsets[i];
          target.data[i * 2 + 1] = target.pending.get(offsets[i]);
        }
        if (!target.upload || target.upload.size < bytes) {
          target.upload?.destroy();
          target.upload = d.createBuffer({
            size: Math.min(limit, bytes * 2),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
          });
          target.group = null;
        }
        d.queue.writeBuffer(target.upload, 0, target.data.buffer, 0, bytes);
        this.pipeline ??= d.createComputePipeline({
          layout: "auto",
          compute: {
            entryPoint: "applyEdits",
            module: d.createShaderModule({
              code: `
          @group(0) @binding(0) var<storage,read_write> outputWords:array<u32>;
          @group(0) @binding(1) var<storage,read> edits:array<vec2u>;
          @compute @workgroup_size(64) fn applyEdits(@builtin(global_invocation_id) id:vec3u){
            let i=id.x+id.y*${d.limits.maxComputeWorkgroupsPerDimension * 64}u;
            if(i>=arrayLength(&edits)){return;}let edit=edits[i];outputWords[edit.x]=edit.y;
          }`,
            }),
          },
        });
        if (!target.group || target.bytes !== bytes) {
          target.group = d.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
              { binding: 0, resource: { buffer } },
              { binding: 1, resource: { buffer: target.upload, size: bytes } },
            ],
          });
          target.bytes = bytes;
        }
        e ??= d.createCommandEncoder({ label: "AVBD property edits" });
        const p = e.beginComputePass();
        p.setPipeline(this.pipeline);
        p.setBindGroup(0, target.group);
        const groups = Math.ceil(n / 64),
          max = d.limits.maxComputeWorkgroupsPerDimension;
        p.dispatchWorkgroups(Math.min(groups, max), Math.ceil(groups / max));
        p.end();
        writes++;
        dispatches++;
        uploadedBytes += bytes;
      }
      words += n;
      target.pending.clear();
    }
    if (!encoder && e) d.queue.submit([e.finish()]);
    if (words)
      this.lastBatch = {
        words,
        writes,
        dispatches,
        uploadedBytes,
        submissions: !encoder && e ? 1 : 0,
      };
  }
  destroy() {
    for (const t of this.targets.values()) t.upload?.destroy();
    this.targets.clear();
  }
  forget(buffer) {
    this.targets.get(buffer)?.upload?.destroy();
    this.targets.delete(buffer);
  }
}

export function propertyEdits(solver) {
  return (solver.propertyEdits ??= new BufferEdits(solver.device));
}
