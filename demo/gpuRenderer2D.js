import shader from "./gpuRender2D.wgsl";
import shapeShader from "./gpuRenderShapes2D.wgsl";
import { GpuTimer } from "../src/gpu/gpuTimer.js";
import {
  CS,
  RA,
  RB,
  T_JOINT,
  T_SPRING,
} from "../reference/three-avbd/src/avbd2d/soa/solver.ts";
import {
  JOINT_FLOATS,
  J_PEN,
} from "../reference/three-avbd/src/avbd2d/gpu/layout.ts";

// The renderer shares the live solver buffer; poses are never read to draw a frame.
// A small, asynchronous joint-status copy supports fracture visualization. Body
// readbacks in the canonical Sim2D adapter serve picking only, every ten steps.
export class GpuRenderer2D {
  constructor(device, canvas, sim, camera, options = {}) {
    Object.assign(this, { device, canvas, sim, camera, resources: [] });
    this.context = (options.contextCanvas ?? canvas).getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({ device, format, alphaMode: "opaque" });
    this.uniform = this.buffer(
      new Float32Array(8),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );
    const mirror = sim.solver.topology;
    this.linkData = new Float32Array(Math.max(1, mirror.jointCount) * 8);
    for (let i = 0; i < mirror.jointCount; i++) {
      const o = i * CS,
        info = i * 4;
      this.linkData.set(
        [
          ...mirror.data.subarray(o + RA, o + RA + 2),
          ...mirror.data.subarray(o + RB, o + RB + 2),
          mirror.info[info + 1],
          mirror.info[info + 2],
          Number(
            [T_JOINT, T_SPRING].includes(mirror.info[info]) &&
              (!options.visibleLinks || options.visibleLinks.includes(i)),
          ),
          0,
        ],
        i * 8,
      );
    }
    this.linkCount = mirror.jointCount;
    this.drawLinks = !!options.visibleLinks;
    this.links = this.buffer(
      this.linkData,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    this.contacts = this.buffer(
      new Float32Array(512 * 4),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    this.contactCount = 0;
    const shapes = sim.solver.shapeBuffer;
    this.clearValue = options.background ?? { r: 0.91, g: 0.92, b: 0.94, a: 1 };
    if (options.colors) {
      const palette = new Float32Array(sim.solver.bodyCapacity * 4);
      palette.fill(1);
      for (let i = 0; i < options.colors.length; i++)
        if (options.colors[i]) palette.set(options.colors[i], i * 4);
      this.colors = this.buffer(
        palette,
        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      );
    }
    const layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
        ...(shapes
          ? [
              {
                binding: 4,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: "read-only-storage" },
              },
            ]
          : []),
        ...(this.colors
          ? [
              {
                binding: 5,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "read-only-storage" },
              },
            ]
          : []),
      ],
    });
    let renderSource = shader + (shapes ? shapeShader : "");
    if (options.filledPlanes && shapes)
      renderSource = renderSource
        .replace(
          "size=vec2f(2.*length(camera.viewport.xy)/scale,2./scale);",
          "size=vec2f(2.*length(camera.viewport.xy)/scale);",
        )
        .replace("distance=abs(p.y)-1./out.scale;", "distance=p.y;");
    if (this.colors)
      renderSource =
        "@group(0) @binding(5) var<storage,read> palette:array<vec4f>;\n" +
        renderSource
          .replace(
            "if(f32(id)==camera.view.w){o.color=",
            "o.color=palette[id].xyz;if(b.velocity.w!=0.){o.color=mix(o.color,vec3f(.3,.65,.4),.35);}\n if(f32(id)==camera.view.w){o.color=",
          )
          .replace(
            "if(f32(id)==camera.view.w){out.color=",
            "out.color=palette[id].xyz;if(b.velocity.w!=0.){out.color=mix(out.color,vec3f(.3,.65,.4),.35);}\n if(f32(id)==camera.view.w){out.color=",
          );
    if (this.colors && shapes && options.characters)
      renderSource = renderSource.replace(
        "return vec4f(color,alpha*select(1.,.22,out.trigger!=0.));",
        `
 if(g.x==1.&&out.color.r>out.color.g*1.7){
  if(length(p-vec2f(.08,.14))<.13){color=vec3f(.99,.98,.9);}
  if(length(p-vec2f(.12,.14))<.055){color=vec3f(.12,.10,.08);}
  if(p.x>.24&&p.x<.5&&abs(p.y+.03)<(.5-p.x)*.6){color=vec3f(1.,.71,.15);}
 }else if(g.x==1.&&out.color.g>out.color.r*1.3){
  if(min(length(p-vec2f(-.18,.16)),length(p-vec2f(.18,.16)))<.095){color=vec3f(.99,.98,.9);}
  if(min(length(p-vec2f(-.18,.16)),length(p-vec2f(.18,.16)))<.04){color=vec3f(.1,.14,.06);}
  if(length((p-vec2f(0.,-.13))/vec2f(.24,.15))<1.){color=vec3f(.64,.84,.37);}
  if(min(length(p-vec2f(-.08,-.13)),length(p-vec2f(.08,-.13)))<.035){color=vec3f(.2,.35,.12);}
 }
 return vec4f(color,alpha*select(1.,.22,out.trigger!=0.));`,
      );
    this.renderSource = renderSource;
    const module = device.createShaderModule({
      label: "2D GPU body and joint rendering",
      code: renderSource,
    });
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });
    this.bodyPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module, entryPoint: shapes ? "shapeMain" : "bodyMain" },
      fragment: {
        module,
        entryPoint: shapes ? "shapeFragment" : "bodyFragment",
        targets: [
          {
            format,
            ...(shapes
              ? {
                  blend: {
                    color: {
                      srcFactor: "src-alpha",
                      dstFactor: "one-minus-src-alpha",
                    },
                    alpha: {
                      srcFactor: "one",
                      dstFactor: "one-minus-src-alpha",
                    },
                  },
                }
              : {}),
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });
    this.linkPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module, entryPoint: "linkMain" },
      fragment: { module, entryPoint: "linkFragment", targets: [{ format }] },
      primitive: { topology: "line-list" },
    });
    this.contactPipeline = device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: { module, entryPoint: "contactMain" },
      fragment: {
        module,
        entryPoint: "contactFragment",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-list" },
    });
    this.layout = layout;
    this.bindShapes(shapes);
    this.timer = new GpuTimer(device);
  }
  bindShapes(shapes) {
    this.boundShapes = shapes;
    this.bind = this.device.createBindGroup({
      layout: this.layout,
      entries: [
        this.sim.solver.bodyBuffer,
        this.uniform,
        this.links,
        this.contacts,
      ]
        .map((buffer, binding) => ({ binding, resource: { buffer } }))
        .concat(
          shapes ? [{ binding: 4, resource: { buffer: shapes } }] : [],
          this.colors
            ? [{ binding: 5, resource: { buffer: this.colors } }]
            : [],
        ),
    });
  }
  buffer(data, usage) {
    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: usage | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();
    this.resources.push(buffer);
    return buffer;
  }
  async updateJointVisibility(data) {
    if (!this.linkCount) return;
    data ??= await this.sim.solver.readJoints();
    if (this.disposed) return;
    for (let i = 0; i < this.linkCount; i++) {
      const o = i * JOINT_FLOATS + J_PEN;
      this.linkData[i * 8 + 6] = Number(
        this.linkData[i * 8 + 6] > 0 &&
          (data[o] > 0 || data[o + 1] > 0 || data[o + 2] > 0),
      );
    }
    this.device.queue.writeBuffer(this.links, 0, this.linkData);
  }
  async updateContacts() {
    // Optional debug overlay, sampled during diagnostics, never during a frame.
    // The upstream 2D API exposes a contact readback rather than a storage view.
    const bytes = await this.sim.solver.readContacts();
    if (this.disposed) return;
    const f = new Float32Array(bytes),
      u = new Uint32Array(bytes),
      count = bytes.byteLength / 80;
    this.contactCount = Math.min(512, count);
    const points = new Float32Array(this.contactCount * 4);
    for (let i = 0; i < this.contactCount; i++) {
      const o = Math.floor((i * count) / this.contactCount) * 20;
      points.set([f[o + 8], f[o + 9], u[o], 0], i * 4);
    }
    if (points.length) this.device.queue.writeBuffer(this.contacts, 0, points);
  }
  prepareFrame() {
    if (this.boundShapes && this.boundShapes !== this.sim.solver.shapeBuffer)
      this.bindShapes(this.sim.solver.shapeBuffer);
    const { canvas, device } = this,
      w = Math.max(1, canvas.clientWidth),
      h = Math.max(1, canvas.clientHeight),
      camera = this.camera();
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    device.queue.writeBuffer(
      this.uniform,
      0,
      new Float32Array([
        camera.x,
        camera.y,
        camera.scale,
        this.sim.dragBody,
        w,
        h,
        0,
        0,
      ]),
    );
  }
  draw(debug) {
    this.prepareFrame();
    const { device } = this;
    const encoder = device.createCommandEncoder(),
      slot = this.timer.begin();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: this.clearValue,
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      ...this.timer.descriptor(slot),
    });
    pass.setBindGroup(0, this.bind);
    pass.setPipeline(this.bodyPipeline);
    pass.draw(6, this.sim.bodyCount);
    if ((debug || this.drawLinks) && this.linkCount) {
      pass.setPipeline(this.linkPipeline);
      pass.draw(2, this.linkCount);
    }
    if (debug && this.contactCount) {
      pass.setPipeline(this.contactPipeline);
      pass.draw(6, this.contactCount);
    }
    pass.end();
    this.timer.encode(encoder, slot);
    device.queue.submit([encoder.finish()]);
    this.timer.resolve(slot);
  }
  dispose() {
    this.disposed = true;
    for (const b of this.resources) b.destroy();
    this.timer.destroy();
    this.context.unconfigure();
  }
  setColor(index, color) {
    this.colorVersion = (this.colorVersion ?? 0) + 1;
    if (this.colors)
      this.device.queue.writeBuffer(
        this.colors,
        index * 16,
        new Float32Array([...color.slice(0, 3), 1]),
      );
  }
}
