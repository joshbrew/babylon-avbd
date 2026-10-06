/** Packed velocity uploads for frequent mass edits. One invocation per unique GPU slot. */
export class VelocityBatch {
  constructor(solver, dimension, kind = "linear") {
    this.solver = solver;
    this.dimension = dimension;
    this.components = kind === "angular" && dimension === 2 ? 1 : dimension;
    const d = solver.device,
      stride = dimension === 3 ? 10 : 6,
      velocity = dimension === 3 ? (kind === "angular" ? 9 : 8) : 3;
    this.pipeline = d.createComputePipeline({
      layout: "auto",
      compute: {
        entryPoint: "setVelocities",
        module: d.createShaderModule({
          code: `
      @group(0) @binding(0) var<storage,read_write> bodies:array<vec4f>;
      @group(0) @binding(1) var<storage,read> indices:array<u32>;
      @group(0) @binding(2) var<storage,read> velocities:array<f32>;
      @compute @workgroup_size(64) fn setVelocities(@builtin(global_invocation_id) id:vec3u) {
        let i=id.x+id.y*${d.limits.maxComputeWorkgroupsPerDimension * 64}u;
        if(i>=arrayLength(&indices)){return;}
        let base=indices[i]*${stride}u+${velocity}u;
        var v=bodies[base];
        ${this.components === 1 ? "v.z=velocities[i];" : `v.x=velocities[i*${dimension}u];v.y=velocities[i*${dimension}u+1u];${dimension === 3 ? "v.z=velocities[i*3u+2u];" : ""}`}
        bodies[base]=v;
      }`,
        }),
      },
    });
  }
  set(indices, velocities) {
    const s = this.solver,
      d = s.device;
    const ids =
        indices instanceof Uint32Array ? indices : Uint32Array.from(indices),
      values =
        velocities instanceof Float32Array
          ? velocities
          : Float32Array.from(velocities);
    if (values.length !== ids.length * this.components)
      throw Error(`Provide ${this.components} velocity components per body`);
    // Ascending slots guarantee that invocations cannot write the same record.
    let previous = -1;
    for (let i = 0; i < indices.length; i++) {
      s.liveIndex(indices[i]);
      if (indices[i] <= previous)
        throw Error(
          "Velocity batch indices must be unique and ascending GPU slots",
        );
      previous = indices[i];
    }
    for (const v of values)
      if (!Number.isFinite(v))
        throw Error("Velocities must be finite Float32 values");
    const limit = Math.min(
      d.limits.maxStorageBufferBindingSize,
      d.limits.maxBufferSize,
    );
    if (ids.byteLength > limit || values.byteLength > limit)
      throw Error("Velocity batch exceeds GPU buffer limits");
    if (!ids.length) return;
    s.wakeAll();
    s.flushEdits();
    this.submitValidated(ids, values);
  }
  /** Internal: unique live slots and finite packed values were already validated by the command queue. */
  submitValidated(ids, values, encoder) {
    if (!ids.length) return;
    const s = this.solver,
      d = s.device;
    const limit = Math.min(
      d.limits.maxStorageBufferBindingSize,
      d.limits.maxBufferSize,
    );
    if (ids.byteLength > limit || values.byteLength > limit)
      throw Error("Velocity batch exceeds GPU buffer limits");
    for (const [name, data] of [
      ["indices", ids],
      ["values", values],
    ]) {
      if (!this[name] || this[name].size < data.byteLength) {
        this[name]?.destroy();
        this[name] = d.createBuffer({
          size: Math.min(limit, data.byteLength * 2),
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
      }
      d.queue.writeBuffer(this[name], 0, data);
    }
    const e = encoder ?? d.createCommandEncoder(),
      p = e.beginComputePass();
    p.setPipeline(this.pipeline);
    if (
      !this.binding ||
      this.boundBody !== s.bodyBuffer ||
      this.boundIndices !== this.indices ||
      this.boundValues !== this.values ||
      this.boundBytes !== values.byteLength
    ) {
      this.binding = d.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: s.bodyBuffer } },
          {
            binding: 1,
            resource: { buffer: this.indices, size: ids.byteLength },
          },
          {
            binding: 2,
            resource: { buffer: this.values, size: values.byteLength },
          },
        ],
      });
      this.boundBody = s.bodyBuffer;
      this.boundIndices = this.indices;
      this.boundValues = this.values;
      this.boundBytes = values.byteLength;
    }
    p.setBindGroup(0, this.binding);
    const groups = Math.ceil(ids.length / 64),
      max = d.limits.maxComputeWorkgroupsPerDimension;
    p.dispatchWorkgroups(Math.min(groups, max), Math.ceil(groups / max));
    p.end();
    if (!encoder) d.queue.submit([e.finish()]);
    this.lastBatch = {
      bodies: ids.length,
      uploadedBytes: ids.byteLength + values.byteLength,
    };
  }
  destroy() {
    this.indices?.destroy();
    this.values?.destroy();
  }
}

/** Replacements of linear and/or angular velocity; one owner per body, no readback. */
export class MotionBatch {
  constructor(solver, dimension) {
    this.solver = solver;
    this.dimension = dimension;
    this.wordsPerBody = dimension === 3 ? 8 : 5;
  }
  set(indices, { linear, angular } = {}) {
    const s = this.solver,
      dimension = this.dimension,
      angularDimension = dimension === 3 ? 3 : 1;
    const ids =
      indices instanceof Uint32Array ? indices : Uint32Array.from(indices);
    const l =
      linear === undefined
        ? null
        : linear instanceof Float32Array
          ? linear
          : Float32Array.from(linear);
    const a =
      angular === undefined
        ? null
        : angular instanceof Float32Array
          ? angular
          : Float32Array.from(angular);
    if (!l && !a) throw Error("Provide linear and/or angular velocities");
    if (l && l.length !== ids.length * dimension)
      throw Error(`Provide ${dimension} linear components per body`);
    if (a && a.length !== ids.length * angularDimension)
      throw Error(`Provide ${angularDimension} angular components per body`);
    let previous = -1;
    for (let i = 0; i < indices.length; i++) {
      s.liveIndex(indices[i]);
      if (indices[i] <= previous)
        throw Error(
          "Velocity batch indices must be unique and ascending GPU slots",
        );
      previous = indices[i];
    }
    for (const values of [l, a])
      if (values)
        for (const v of values)
          if (!Number.isFinite(v))
            throw Error("Velocities must be finite Float32 values");
    const n = ids.length * this.wordsPerBody;
    const limit = Math.min(
      s.device.limits.maxStorageBufferBindingSize,
      s.device.limits.maxBufferSize,
    );
    if (n * 4 > limit) throw Error("Motion batch exceeds GPU buffer limits");
    if (!n) return;
    if (!this.data || this.data.length < n) {
      this.data = new Uint32Array(Math.max(n, (this.data?.length ?? 0) * 2));
      this.floats = new Float32Array(this.data.buffer);
    }
    for (let i = 0; i < ids.length; i++) {
      const o = i * this.wordsPerBody;
      this.data[o] = ids[i];
      this.data[o + 1] = (l ? 1 : 0) | (a ? 2 : 0);
      if (l)
        for (let k = 0; k < dimension; k++)
          this.floats[o + 2 + k] = l[i * dimension + k];
      if (a)
        for (let k = 0; k < angularDimension; k++)
          this.floats[o + 2 + dimension + k] = a[i * angularDimension + k];
    }
    s.wakeAll();
    s.flushEdits();
    this.submitValidated(this.data.subarray(0, n));
  }
  submitValidated(records, encoder) {
    if (!records.length) return;
    const s = this.solver,
      d = s.device,
      width = this.wordsPerBody;
    const limit = Math.min(
      d.limits.maxStorageBufferBindingSize,
      d.limits.maxBufferSize,
    );
    if (records.byteLength > limit)
      throw Error("Motion batch exceeds GPU buffer limits");
    if (!this.buffer || this.buffer.size < records.byteLength) {
      this.buffer?.destroy();
      this.buffer = d.createBuffer({
        size: Math.min(limit, records.byteLength * 2),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }
    d.queue.writeBuffer(this.buffer, 0, records);
    this.pipeline ??= d.createComputePipeline({
      layout: "auto",
      compute: {
        entryPoint: "edit",
        module: d.createShaderModule({
          code: `
      @group(0) @binding(0) var<storage,read_write> bodies:array<vec4f>;
      @group(0) @binding(1) var<storage,read> commands:array<u32>;
      @compute @workgroup_size(64) fn edit(@builtin(global_invocation_id) id:vec3u) {
        let i=id.x+id.y*${d.limits.maxComputeWorkgroupsPerDimension * 64}u;
        let o=i*${width}u;if(o>=arrayLength(&commands)){return;}
        let b=commands[o]*${this.dimension === 3 ? 10 : 6}u;
        let mask=commands[o+1u];
        var v=bodies[b+${this.dimension === 3 ? 8 : 3}u];
        if((mask&1u)!=0u){v.x=bitcast<f32>(commands[o+2u]);v.y=bitcast<f32>(commands[o+3u]);${this.dimension === 3 ? "v.z=bitcast<f32>(commands[o+4u]);" : ""}}
        ${this.dimension === 2 ? "if((mask&2u)!=0u){v.z=bitcast<f32>(commands[o+4u]);}" : "if((mask&2u)!=0u){var a=bodies[b+9u];a.xyz=vec3f(bitcast<f32>(commands[o+5u]),bitcast<f32>(commands[o+6u]),bitcast<f32>(commands[o+7u]));bodies[b+9u]=a;}"}
        bodies[b+${this.dimension === 3 ? 8 : 3}u]=v;
      }`,
        }),
      },
    });
    if (
      !this.binding ||
      this.boundBody !== s.bodyBuffer ||
      this.boundBuffer !== this.buffer ||
      this.boundBytes !== records.byteLength
    ) {
      this.binding = d.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: s.bodyBuffer } },
          {
            binding: 1,
            resource: { buffer: this.buffer, size: records.byteLength },
          },
        ],
      });
      this.boundBody = s.bodyBuffer;
      this.boundBuffer = this.buffer;
      this.boundBytes = records.byteLength;
    }
    const e = encoder ?? d.createCommandEncoder(),
      p = e.beginComputePass();
    p.setPipeline(this.pipeline);
    p.setBindGroup(0, this.binding);
    const groups = Math.ceil(records.length / width / 64),
      max = d.limits.maxComputeWorkgroupsPerDimension;
    p.dispatchWorkgroups(Math.min(groups, max), Math.ceil(groups / max));
    p.end();
    if (!encoder) d.queue.submit([e.finish()]);
    this.lastBatch = {
      bodies: records.length / width,
      uploadedBytes: records.byteLength,
    };
  }
  destroy() {
    this.buffer?.destroy();
    this.binding = null;
    this.data = this.floats = null;
  }
}
