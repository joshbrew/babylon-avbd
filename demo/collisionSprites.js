import shader from "./collisionSprites.wgsl";

// Draws the compute buffer directly: no position copies, per-particle JS or textures.
// A depth-only shield draw lets the overlay share the Babylon camera's occlusion.
export class CollisionSprites {
  constructor(device, canvas, benchmark) {
    this.device = device;
    this.canvas = canvas;
    this.benchmark = benchmark;
    this.context = canvas.getContext("webgpu");
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device,
      format: this.format,
      alphaMode: "premultiplied",
    });
    this.camera = device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const module = device.createShaderModule({
      code: shader,
      label: "GPU collision sprites",
    });
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
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [layout],
    });
    const make = (depth) =>
      device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: { module, entryPoint: depth ? "shieldDepth" : "sprite" },
        fragment: {
          module,
          entryPoint: "fragment",
          targets: [
            {
              format: this.format,
              writeMask: depth ? 0 : GPUColorWrite.ALL,
              blend: {
                color: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
                alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
              },
            },
          ],
        },
        primitive: { topology: "triangle-list", cullMode: "none" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: depth,
          depthCompare: "less-equal",
        },
      });
    this.depthPipeline = make(true);
    this.spritePipeline = make(false);
    this.bind = device.createBindGroup({
      layout,
      entries: [
        benchmark.bulletBuffer,
        benchmark.triangleBuffer,
        this.camera,
      ].map((buffer, binding) => ({ binding, resource: { buffer } })),
    });
  }
  draw(camera, count) {
    const w = Math.max(1, this.canvas.clientWidth | 0),
      h = Math.max(1, this.canvas.clientHeight | 0);
    if (this.canvas.width !== w || this.canvas.height !== h || !this.depth) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.depth?.destroy();
      this.depth = this.device.createTexture({
        size: [w, h],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }
    const params = new Float32Array(20);
    params.set(camera.getTransformationMatrix().toArray());
    // Babylon's WebGL projection has [-1,1] depth; WebGPU requires [0,1].
    for (let column = 0; column < 4; column++)
      params[column * 4 + 2] =
        (params[column * 4 + 2] + params[column * 4 + 3]) * 0.5;
    params.set([w, h, camera.getProjectionMatrix().m[5], 0], 16);
    this.device.queue.writeBuffer(this.camera, 0, params);
    const encoder = this.device.createCommandEncoder(),
      pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: this.context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
        depthStencilAttachment: {
          view: this.depth.createView(),
          depthClearValue: 1,
          depthLoadOp: "clear",
          depthStoreOp: "discard",
        },
      });
    pass.setBindGroup(0, this.bind);
    pass.setPipeline(this.depthPipeline);
    pass.draw(this.benchmark.triCount * 3);
    pass.setPipeline(this.spritePipeline);
    pass.draw(6, count);
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
  dispose() {
    this.camera.destroy();
    this.depth?.destroy();
    this.context.unconfigure();
    this.canvas.remove();
  }
}
