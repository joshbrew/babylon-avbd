import shader from "./sleeping2D.wgsl";
import { propertyEdits } from "./bufferEdits.js";
export function sleepOptions2D(options = {}) {
  if (options !== true && (typeof options !== "object" || options === null))
    throw Error("sleeping must be a boolean or options object");
  const speedThreshold = options.speedThreshold ?? 0.03;
  const timeThreshold = options.timeThreshold ?? 0.5;
  if (
    ![speedThreshold, timeThreshold].every((v) => Number.isFinite(v) && v > 0)
  )
    throw Error("Sleep thresholds must be positive and finite");
  return { speedThreshold, timeThreshold };
}
export function withSleepingSolve2D(source) {
  for (const entry of ["warmStartBodies", "updateVelocities"])
    source = source.replace(
      `fn ${entry}(@builtin(global_invocation_id) gid: vec3u) {`,
      `fn ${entry}(@builtin(global_invocation_id) gid: vec3u) {\n  if(gid.x<params.bodyCount && bodies[gid.x].vel.w!=0.){return;}`,
    );
  return source.replace(
    "fn solveBody(i: u32) {",
    "fn solveBody(i: u32) {\n  if(bodies[i].vel.w!=0.){return;}",
  );
}
export function withSleepingTopology2D(source) {
  return source.replace(
    "return i >= 0 && bodies[i].shape.z > 0.0;",
    "return i >= 0 && bodies[i].shape.z > 0.0 && bodies[i].vel.w==0.;",
  );
}
export class Sleeping2D {
  constructor(gpu, options) {
    this.gpu = gpu;
    this.device = gpu.device;
    this.options = sleepOptions2D(options);
    const d = this.device,
      usage =
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC;
    this.state = d.createBuffer({ size: gpu.bodyCapacity * 16, usage });
    this.globals = d.createBuffer({ size: 8, usage });
    this.params = d.createBuffer({
      size: 32,
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
    this.pipes = Object.fromEntries(
      [
        "clear",
        "before",
        "contactsWake",
        "jointsWake",
        "decide",
        "applyWake",
        "rest",
      ].map((entryPoint) => [
        entryPoint,
        d.createComputePipeline({ layout, compute: { module, entryPoint } }),
      ]),
    );
    const data = new Uint32Array(gpu.bodyCapacity * 4);
    for (let i = 0; i < gpu.bodyCount; i++)
      data[i * 4 + 1] = gpu.sleepEligible?.get(i) === false ? 0 : 1;
    d.queue.writeBuffer(this.state, 0, data);
    this.wakeRequested = false;
  }
  register(index, eligible = true) {
    const edits = propertyEdits(this.gpu);
    for (let k = 0; k < 4; k++)
      edits.uint(this.state, index * 4 + k, k === 1 ? Number(eligible) : 0);
    this.wakeRequested = true;
  }
  group(cur) {
    const g = this.gpu,
      buffers = [
        g.bodyBuffer,
        this.state,
        g.infoBuffer,
        g.jointBuffer,
        g.contactBuffers[cur],
        g.counterBuffer,
        this.globals,
        this.params,
      ];
    let cached = this.groups?.find((x) =>
      x.buffers.every((b, i) => b === buffers[i]),
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
      this.groups = [...(this.groups ?? []).slice(-1), cached];
    }
    return cached.group;
  }
  dispatch(pass, cur, entries) {
    pass.setBindGroup(0, this.group(cur));
    for (const [name, n] of entries) {
      if (!n) continue;
      pass.setPipeline(this.pipes[name]);
      pass.dispatchWorkgroups(Math.ceil(n / 64));
    }
  }
  run(entries, encoder) {
    const e = encoder ?? this.device.createCommandEncoder(),
      p = e.beginComputePass();
    this.dispatch(p, 1 - this.gpu.parity, entries);
    p.end();
    if (!encoder) this.device.queue.submit([e.finish()]);
  }
  before(encoder) {
    this.gpu.flushPropertyEdits(encoder);
    const g = this.gpu,
      data = new ArrayBuffer(32),
      u = new Uint32Array(data),
      f = new Float32Array(data);
    u.set([
      g.bodyCount,
      g.jointCount,
      g.contactCapacity,
      Number(this.wakeRequested),
    ]);
    f.set(
      [
        this.options.speedThreshold,
        this.options.timeThreshold,
        g.params.dt,
        g.params.gravity,
      ],
      4,
    );
    this.device.queue.writeBuffer(this.params, 0, data);
    this.wakeRequested = false;
    this.run(
      [
        ["clear", 1],
        ["before", g.bodyCount],
      ],
      encoder,
    );
  }
  encodeWake(pass, cur) {
    const g = this.gpu;
    this.dispatch(pass, cur, [
      ["contactsWake", g.contactCapacity],
      ["jointsWake", g.jointCount],
      ["decide", g.bodyCount],
      ["applyWake", g.bodyCount],
    ]);
  }
  after(encoder) {
    this.run([["rest", this.gpu.bodyCount]], encoder);
  }
  async readStats() {
    const data = new Uint32Array(await this.gpu.read(this.globals, 8));
    return {
      sleeping: data[1],
      wakeRequested: this.wakeRequested || !!data[0],
    };
  }
  destroy() {
    this.gpu.propertyEdits?.forget(this.state);
    this.state.destroy();
    this.globals.destroy();
    this.params.destroy();
  }
}
