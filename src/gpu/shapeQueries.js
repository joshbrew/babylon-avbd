import source from "./shapeQueries.wgsl";
/** Optional GPU queries. Nothing runs or allocates until a query is requested. */
export class ShapeQueries {
  constructor(solver, dimension = 3) {
    this.solver = solver;
    this.dimension = dimension;
    this.jobs = new Set();
    this.idle = [];
    this.destroyed = false;
    const d = solver.device;
    const module = d.createShaderModule({
      label: `AVBD ${dimension}D queries`,
      code:
        dimension === 2
          ? source
              .replace("const DIM=3u;", "const DIM=2u;")
              .replace("const STRIDE=10u;", "const STRIDE=6u;")
          : source,
    });
    this.layout = d.createBindGroupLayout({
      entries: [
        "read-only-storage",
        "read-only-storage",
        "read-only-storage",
        "storage",
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
    this.pipes = Object.fromEntries(
      ["nearest", "owner", "finish"].map((entryPoint) => [
        entryPoint,
        d.createComputePipeline({ layout, compute: { module, entryPoint } }),
      ]),
    );
    this.dummy = d.createBuffer({ size: 16, usage: GPUBufferUsage.STORAGE });
  }
  acquire(count) {
    if (this.destroyed) throw Error("GPU queries have been destroyed");
    const suitable = this.idle.findIndex((j) => j.capacity >= count);
    const job =
      suitable >= 0
        ? this.idle.splice(suitable, 1)[0]
        : (this.idle.pop() ?? {});
    if (!job.capacity || job.capacity < count) {
      const capacity = Math.min(
        65535,
        Math.max(count, (job.capacity ?? 0) * 2, 16),
      );
      for (const [name, size, usage] of [
        ["queryBuffer", capacity * 32, GPUBufferUsage.STORAGE],
        ["best", capacity * 8, GPUBufferUsage.STORAGE],
        [
          "hits",
          capacity * 32,
          GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
        ],
        ["uniform", 96, GPUBufferUsage.UNIFORM],
        ["read", capacity * 32, GPUBufferUsage.MAP_READ],
      ]) {
        job[name]?.destroy();
        job[name] = this.solver.device.createBuffer({
          size,
          usage: usage | GPUBufferUsage.COPY_DST,
        });
      }
      job.capacity = capacity;
      job.buffers = null;
      job.data = new Float32Array(capacity * 8);
      job.initial = new Uint32Array(capacity * 2);
      job.params = new Uint32Array(24);
    }
    this.jobs.add(job);
    return job;
  }
  release(job) {
    job.read.unmap();
    // Keep at most two small sets. Concurrent mapped reads always own different sets.
    if (
      !this.destroyed &&
      job.capacity * 104 <= 2 * 1024 * 1024 &&
      this.idle.length < 2
    )
      this.idle.push(job);
    else {
      for (const name of ["queryBuffer", "best", "hits", "uniform", "read"])
        job[name].destroy();
      this.jobs.delete(job);
    }
  }
  async cast(
    queries,
    { ignore = [], collidesWith = 0xffffffff, includeTriggers = true } = {},
  ) {
    if (this.destroyed) throw Error("GPU queries have been destroyed");
    const s = this.solver,
      d = s.device,
      dim = this.dimension;
    if (
      !Number.isInteger(collidesWith) ||
      collidesWith < 0 ||
      collidesWith > 0xffffffff
    )
      throw Error("Query mask must be an unsigned 32-bit integer");
    if (typeof includeTriggers !== "boolean")
      throw Error("includeTriggers must be boolean");
    if (
      ignore.length > 16 ||
      ignore.some((i) => !Number.isInteger(i) || i < 0 || i >= s.bodyCount)
    )
      throw Error("Queries can ignore up to 16 live body indices");
    if (
      queries.length >
      Math.min(65535, d.limits.maxComputeWorkgroupsPerDimension)
    )
      throw Error("Too many queries in one batch");
    const checked = queries.map((query) => {
      const origin = Array.from(query.origin),
        direction = Array.from(query.direction),
        radius = query.radius ?? 0,
        maxDistance = query.maxDistance ?? 3e38;
      if (
        origin.length !== dim ||
        direction.length !== dim ||
        ![...origin, ...direction].every(Number.isFinite) ||
        Math.hypot(...direction) === 0
      )
        throw Error(
          `A query requires ${dim} finite components and a nonzero direction`,
        );
      if (
        !Number.isFinite(radius) ||
        radius < 0 ||
        !Number.isFinite(maxDistance) ||
        maxDistance < 0
      )
        throw Error(
          "Query radius and maximum distance must be finite and nonnegative",
        );
      const length = Math.hypot(...direction);
      return {
        origin,
        direction: direction.map((x) => x / length),
        radius,
        maxDistance,
      };
    });
    if (!checked.length) return [];
    const count = checked.length,
      job = this.acquire(count);
    try {
      const data = job.data;
      checked.forEach((q, i) => {
        data.set(
          [
            ...q.origin,
            ...Array(3 - dim).fill(0),
            q.maxDistance,
            ...q.direction,
            ...Array(3 - dim).fill(0),
            q.radius,
          ],
          i * 8,
        );
      });
      const params = job.params;
      params.fill(0);
      params.set([
        s.bodyCount,
        count,
        ignore.length,
        collidesWith,
        includeTriggers ? 0 : 1,
        dim === 3 || s.filters ? 1 : 0,
        s.sensorsEnabled ? 1 : 0,
        dim === 2 && s.shapeBuffer ? 1 : 0,
      ]);
      params.set(ignore, 8);
      const initial = job.initial;
      for (let i = 0; i < count; i++)
        initial.set([0x7f800000, 0xffffffff], i * 2);
      const { queryBuffer, best, hits, uniform, read } = job;
      d.queue.writeBuffer(queryBuffer, 0, data.buffer, 0, count * 32);
      d.queue.writeBuffer(best, 0, initial.buffer, 0, count * 8);
      d.queue.writeBuffer(uniform, 0, params);
      const buffers = [
        s.bodyBuffer,
        dim === 3 ? s.hullStorage : (s.shapeBuffer ?? this.dummy),
        queryBuffer,
        best,
        hits,
        uniform,
        dim === 3 ? s.filterStorage : (s.filters ?? this.dummy),
      ];
      if (!job.buffers || buffers.some((b, i) => b !== job.buffers[i])) {
        job.group = d.createBindGroup({
          layout: this.layout,
          entries: buffers.map((buffer, binding) => ({
            binding,
            resource: { buffer },
          })),
        });
        job.buffers = buffers;
      }
      const e = d.createCommandEncoder(),
        pass = e.beginComputePass();
      pass.setBindGroup(0, job.group);
      for (const name of ["nearest", "owner"]) {
        pass.setPipeline(this.pipes[name]);
        pass.dispatchWorkgroups(Math.ceil(s.bodyCount / 64), count);
      }
      pass.setPipeline(this.pipes.finish);
      pass.dispatchWorkgroups(Math.ceil(count / 64));
      pass.end();
      e.copyBufferToBuffer(hits, 0, read, 0, count * 32);
      d.queue.submit([e.finish()]);
      await read.mapAsync(GPUMapMode.READ, 0, count * 32);
      const mapped = read.getMappedRange(0, count * 32),
        result = new Float32Array(mapped),
        indices = new Uint32Array(mapped);
      return checked.map((q, i) => {
        const distance = result[i * 8 + 3];
        if (distance < 0) return null;
        const normal = Array.from(result.slice(i * 8, i * 8 + dim));
        const center = q.origin.map((x, k) => x + distance * q.direction[k]);
        return {
          index: indices[i * 8 + 4],
          distance,
          normal,
          center,
          point: center.map((x, k) => x - q.radius * normal[k]),
        };
      });
    } finally {
      this.release(job);
    }
  }
  destroy() {
    this.destroyed = true;
    for (const job of this.jobs)
      for (const name of ["queryBuffer", "best", "hits", "uniform", "read"])
        job[name].destroy();
    this.jobs.clear();
    this.idle.length = 0;
    this.dummy.destroy();
  }
}
