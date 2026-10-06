import contacts from "./gpuContactRender.wgsl";

// Use the native overlay's exact sampling and pose transform, then transfer only
// the displayed clip-space points to Babylon rather than full contact storage.
const source =
  contacts
    .replace("@vertex fn vertexMain", "fn samplePoint")
    .replaceAll("@builtin(vertex_index) ", "")
    .replaceAll("@builtin(instance_index) ", "")
    .replace("->@builtin(position) vec4f", "->vec4f")
    .replace(/clip\.x\+=.*?;/, "")
    .replace(/clip\.y\+=.*?;/, "") +
  `
@group(0) @binding(5) var<storage,read_write> sampled:array<vec4f>;
@compute @workgroup_size(64) fn gather(@builtin(global_invocation_id) id:vec3u) {
  if(id.x<arrayLength(&sampled)){sampled[id.x]=samplePoint(0u,id.x);}
}`;

export const sampledContactShader = `
struct Camera {vp:mat4x4f,eye:vec4f,light:vec4f}
@group(0) @binding(0) var<uniform> camera:Camera;
@group(0) @binding(1) var<storage,read> points:array<vec4f>;
const CORNERS=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,1));
@vertex fn vertexMain(@builtin(vertex_index) v:u32,@builtin(instance_index) instance:u32)->@builtin(position) vec4f {
  var clip=points[instance];
  clip.x+=CORNERS[v].x*3./camera.light.x*clip.w;
  clip.y+=CORNERS[v].y*3./camera.light.y*clip.w;
  return clip;
}
@fragment fn fragmentMain()->@location(0) vec4f {return vec4f(.83,.25,.39,1);}
`;

export class GpuContactSample {
  constructor(renderer) {
    this.renderer = renderer;
    this.count = 2048;
    this.buffer = renderer.device.createBuffer({
      label: "AVBD sampled contact dots",
      size: this.count * 16,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    this.pipeline = renderer.device.createComputePipeline({
      label: "AVBD contact overlay sampling",
      layout: "auto",
      compute: {
        module: renderer.device.createShaderModule({ code: source }),
        entryPoint: "gather",
      },
    });
    this.bindings = [];
  }
  encode(encoder) {
    const r = this.renderer,
      storage = r.gpu.contactStorage;
    const buffers = [
      r.buffer,
      r.camera,
      storage.manifolds,
      storage.contacts,
      storage.counters,
      this.buffer,
    ];
    let entry = this.bindings.find((c) =>
      c.buffers.every((b, i) => b === buffers[i]),
    );
    if (!entry) {
      entry = {
        buffers,
        bind: r.device.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: buffers.map((buffer, binding) => ({
            binding,
            resource: { buffer },
          })),
        }),
      };
      this.bindings.push(entry);
      if (this.bindings.length > 2) this.bindings.shift();
    }
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, entry.bind);
    pass.dispatchWorkgroups(this.count / 64);
    pass.end();
  }
  dispose() {
    this.buffer.destroy();
    this.bindings.length = 0;
  }
}
