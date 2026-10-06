import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine.js";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture.js";
import { Scene } from "@babylonjs/core/scene.js";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh.js";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js";
import "@babylonjs/core/Meshes/thinInstanceMesh.js";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial.js";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage.js";
import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer.js";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer.js";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js";
import { TextureSampler } from "@babylonjs/core/Materials/Textures/textureSampler.js";
import { Constants } from "@babylonjs/core/Engines/constants.js";
import { Color4 } from "@babylonjs/core/Maths/math.color.js";
import { GpuTimer } from "../src/gpu/gpuTimer.js";
import { CanonicalRenderer } from "./canonicalRenderer.js";
import { GpuRenderer2D } from "./gpuRenderer2D.js";
import { babylonShader } from "./babylonShaders.js";
import canonical from "./canonicalRender.wgsl";
import showcase from "./gpuShowcaseRender.wgsl";
import tearable from "./tearableClothRender.wgsl";
import { GpuContactSample, sampledContactShader } from "./gpuContactSample.js";

export async function createBabylonEngine(canvas, enhanced = true) {
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) throw Error("No WebGPU adapter is available for Babylon.");
  const engine = new WebGPUEngine(canvas, {
    antialias: enhanced,
    adaptToDeviceRatio: false,
    powerPreference: "high-performance",
    deviceDescriptor: {
      requiredFeatures: adapter.features.has("timestamp-query")
        ? ["timestamp-query"]
        : [],
      requiredLimits: {
        maxStorageBufferBindingSize: Math.min(
          512 * 1024 * 1024,
          adapter.limits.maxStorageBufferBindingSize,
        ),
        maxBufferSize: Math.min(
          1024 * 1024 * 1024,
          adapter.limits.maxBufferSize,
        ),
        maxStorageBuffersPerShaderStage: Math.min(
          9,
          adapter.limits.maxStorageBuffersPerShaderStage,
        ),
      },
    },
  });
  try {
    await engine.initAsync();
  } catch (error) {
    engine.dispose();
    throw error;
  }
  // Babylon 9 exposes _device as an internal GPU interop field. Keep access here
  // rather than replacing engine internals or creating another physics device.
  if (!engine._device?.queue) {
    engine.dispose();
    throw Error("Babylon GPU device interop is unavailable.");
  }
  engine.enableGPUTimingMeasurements =
    engine._device.features.has("timestamp-query");
  return { engine, device: engine._device, info: adapter.info };
}

// Babylon owns these resources. Each live AVBD storage view is copied on the GPU;
// no body poses or matrices are downloaded or assembled by the CPU to draw.
class BabylonDraw {
  constructor(native, engine, dimension) {
    Object.assign(this, {
      native,
      engine,
      dimension,
      copies: new Map(),
      meshes: [],
      textures: [],
    });
    this.scene = new Scene(engine);
    this.scene.clearColor =
      dimension === 2
        ? new Color4(...Object.values(native.clearValue))
        : new Color4(0.91, 0.92, 0.94, 1);
    this.scene.activeCamera = new FreeCamera(
      "AVBD view",
      Vector3.Zero(),
      this.scene,
    );
    this.scene.skipPointerMovePicking = true;
    this.scene.autoClear = true;
    this.scene.autoClearDepthAndStencil = true;
    this.scene.blockMaterialDirtyMechanism = true;
    this.camera = new UniformBuffer(engine, undefined, true, "AVBD camera");
    if (dimension === 3) {
      this.camera.addUniform("vp", 16);
      this.camera.addUniform("eye", 4);
      this.camera.addUniform("viewport", 4);
    } else {
      this.camera.addUniform("view", 4);
      this.camera.addUniform("viewport", 4);
    }
    this.camera.create();
    this.stats = {
      renderer: "babylon",
      poseDownloads: 0,
      matrixUpdates: 0,
      draws: 0,
      copiedBytes: 0,
      cpuSubmitMs: 0,
    };
    this.copyTimer = new GpuTimer(native.device);
    if (dimension === 3 && native.gpu)
      this.contactSample = new GpuContactSample(native);
    this.renderSize = [engine.getRenderWidth(), engine.getRenderHeight()];
    this.refresh();
  }
  storage(buffer, dynamic = true) {
    let job = this.copies.get(buffer);
    if (!job) {
      const storage = new StorageBuffer(
        this.engine,
        buffer.size,
        undefined,
        "AVBD GPU render view",
      );
      job = { source: buffer, storage, dynamic, fresh: true };
      this.copies.set(buffer, job);
    }
    job.dynamic ||= dynamic;
    return job.storage;
  }
  texture(source) {
    if (!this.fabric) {
      this.fabric = new DynamicTexture(
        "AVBD fabric",
        this.native.visuals.fabricCanvas,
        this.scene,
        false,
      );
      this.fabric.update(false);
      this.textures.push(this.fabric);
    }
    return this.fabric;
  }
  mesh(
    source,
    vertex,
    fragment,
    {
      vertices,
      count,
      ids = [0],
      vertexIds,
      indices,
      buffers,
      constants,
      line = false,
      depth = true,
      texture,
    } = {},
  ) {
    const program = babylonShader(source, vertex, fragment, constants);
    const mesh = new Mesh(`AVBD ${vertex} ${this.meshes.length}`, this.scene);
    const data = new VertexData();
    if (vertices) {
      data.positions = new Float32Array(vertices.length / 2);
      data.normals = new Float32Array(vertices.length / 2);
      for (let i = 0; i < vertices.length / 6; i++) {
        data.positions.set(vertices.subarray(i * 6, i * 6 + 3), i * 3);
        data.normals.set(vertices.subarray(i * 6 + 3, i * 6 + 6), i * 3);
      }
      count = vertices.length / 6;
    } else {
      data.positions = new Float32Array(count * 3);
      data.normals = new Float32Array(count * 3);
    }
    data.indices = indices ?? Uint32Array.from({ length: count }, (_, i) => i);
    data.applyToMesh(mesh);
    mesh.doNotSyncBoundingInfo = true;
    if (vertexIds) mesh.setVerticesData("avbdSlot", vertexIds, false, 1);
    else {
      const matrices = new Float32Array(ids.length * 16);
      for (let i = 0; i < ids.length; i++) {
        const o = i * 16;
        matrices[o] = matrices[o + 5] = matrices[o + 10] = matrices[o + 15] = 1;
      }
      mesh.thinInstanceSetBuffer("matrix", matrices, 16, true);
      mesh.thinInstanceSetBuffer("avbdSlot", Float32Array.from(ids), 1, true);
    }
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.isPickable = false;
    const material = new ShaderMaterial(
      mesh.name,
      this.scene,
      {
        vertexSource: program.vertexCode,
        fragmentSource: program.fragmentCode,
      },
      {
        shaderLanguage: ShaderLanguage.WGSL,
        attributes: ["position", "normal", "avbdSlot"],
        uniforms: [],
        uniformBuffers: program.uniforms,
        storageBuffers: program.storage,
        samplers: program.textures,
        samplerObjects: program.samplers,
        needAlphaBlending:
          this.dimension === 2 &&
          vertex !== "linkMain" &&
          vertex !== "contactMain",
      },
    );
    material.backFaceCulling = false;
    material.disableDepthWrite = !depth || this.dimension === 2;
    if (line) material.fillMode = Constants.MATERIAL_LineListDrawMode;
    material.setUniformBuffer("camera", this.camera);
    for (const name of program.storage) {
      if (!buffers[name]) throw Error(`Missing Babylon shader buffer ${name}`);
      material.setStorageBuffer(
        name,
        this.storage(
          buffers[name],
          name === "bodies" ||
            name === "joints" ||
            name === "contacts" ||
            name === "points" ||
            name === "manifolds" ||
            name === "counters" ||
            name === "links",
        ),
      );
    }
    mesh.avbdBuffers = program.storage.map((name) => buffers[name]);
    for (const name of program.textures)
      material.setTexture(name, this.texture(texture));
    for (const name of program.samplers) {
      const sampler = new TextureSampler();
      sampler.setParameters();
      material.setTextureSampler(name, sampler);
    }
    mesh.material = material;
    mesh.freezeWorldMatrix();
    if (!ids.length) mesh.setEnabled(false);
    this.meshes.push(mesh);
    return mesh;
  }
  refresh() {
    for (const mesh of this.meshes) {
      mesh.material.dispose(false, false);
      mesh.dispose();
    }
    this.meshes.length = 0;
    for (const job of this.copies.values()) job.storage.dispose();
    this.copies.clear();
    this.links = this.points = undefined;
    const r = this.native;
    if (this.dimension === 2) {
      const buffers = {
        bodies: r.sim.solver.bodyBuffer,
        links: r.links,
        contacts: r.contacts,
        geometry: r.sim.solver.shapeBuffer,
        palette: r.colors,
      };
      this.body = this.mesh(
        r.renderSource,
        buffers.geometry ? "shapeMain" : "bodyMain",
        buffers.geometry ? "shapeFragment" : "bodyFragment",
        {
          count: 6,
          ids: Uint32Array.from({ length: r.sim.bodyCount }, (_, i) => i),
          buffers,
        },
      );
      if (r.linkCount)
        this.links = this.mesh(r.renderSource, "linkMain", "linkFragment", {
          count: 2,
          ids: Uint32Array.from({ length: r.linkCount }, (_, i) => i),
          buffers,
          line: true,
        });
      this.points = this.mesh(
        r.renderSource,
        "contactMain",
        "contactFragment",
        {
          count: 6,
          ids: Uint32Array.from({ length: 512 }, (_, i) => i),
          buffers,
          depth: false,
        },
      );
    } else {
      const buffers = {
        bodies: r.buffer,
        joints: r.joints,
        styles: r.visuals.styles,
      };
      this.body = this.mesh(canonical, "vertexMain", "fragmentMain", {
        vertices: r.cubeVertices,
        ids: Uint32Array.from({ length: r.solver.bodies.length }, (_, i) => i),
        buffers,
        constants: { PRE_SCALED: 0, ENHANCED: Number(r.enhanced) },
      });
      // Unique hulls cannot share one instanced geometry. Merge their static
      // vertices instead; each vertex carries the GPU body slot for its hull.
      if (r.special.length) {
        const vertices = new Float32Array(
          r.special.reduce((n, shape) => n + shape.vertices.length, 0),
        );
        const vertexIds = new Float32Array(vertices.length / 6);
        let offset = 0;
        for (const shape of r.special) {
          vertices.set(shape.vertices, offset);
          vertexIds.fill(
            shape.id,
            offset / 6,
            (offset + shape.vertices.length) / 6,
          );
          offset += shape.vertices.length;
        }
        this.mesh(canonical, "vertexMain", "fragmentMain", {
          vertices,
          vertexIds,
          buffers,
          constants: { PRE_SCALED: 1, ENHANCED: Number(r.enhanced) },
        });
      }
      if (r.lineCount)
        this.links = this.mesh(canonical, "lineMain", "lineFragment", {
          vertices: r.lineVertices,
          buffers,
          line: true,
        });
      const v = r.visuals;
      for (const group of v.groups)
        this.mesh(showcase, "shapeMain", "shapeFragment", {
          vertices: v.meshes.get(group.kind).vertices,
          ids: Uint32Array.from({ length: group.count }, (_, i) => i),
          buffers: { ...buffers, instances: group.indices, cloth: v.dummy },
          constants: { KIND: group.kind },
          texture: v.texture,
        });
      if (v.clothCount)
        this.mesh(showcase, "clothMain", "clothFragment", {
          count: v.clothVertexCount,
          indices: v.clothIndexData,
          buffers: { ...buffers, instances: v.dummy, cloth: v.clothMap },
          texture: v.texture,
        });
      if (v.tears.count)
        this.mesh(tearable, "main", "fragment", {
          count: v.tears.count,
          buffers: {
            bodies: r.buffer,
            triangles: v.tears.buffer,
            joints: r.gpu.jointBuffer,
            neighbors: v.tears.adjacency,
          },
          texture: v.texture,
        });
      if (r.gpu)
        this.points = this.mesh(
          sampledContactShader,
          "vertexMain",
          "fragmentMain",
          {
            count: 6,
            ids: Uint32Array.from({ length: 2048 }, (_, i) => i),
            buffers: { points: this.contactSample.buffer },
            depth: false,
          },
        );
    }
    this.signature =
      this.dimension === 2 ? r.sim.bodyCount : r.solver.bodies.length;
    this.liveBuffers = this.sources();
  }
  sources() {
    const r = this.native;
    return this.dimension === 2
      ? [
          r.sim.solver.bodyBuffer,
          r.sim.solver.shapeBuffer,
          r.links,
          r.contacts,
          r.colors,
        ]
      : [
          r.buffer,
          r.joints,
          r.visuals.styles,
          r.visuals.tears.buffer,
          r.gpu?.jointBuffer,
          r.visuals.clothMap,
          ...r.visuals.groups.map((group) => group.indices),
        ];
  }
  async ready() {
    for (const mesh of this.meshes) {
      let timeout;
      try {
        await Promise.race([
          mesh.material.forceCompilationAsync(mesh, {
            useInstances: mesh.hasThinInstances,
          }),
          new Promise((_, reject) => {
            timeout = setTimeout(
              () =>
                reject(
                  Error(
                    `Babylon shader did not become ready: ${mesh.name}; ${mesh.subMeshes[0]?.effect?.getCompilationError() ?? ""}; textures=${Object.values(mesh.material.getActiveTextures()).map((t) => t.isReady())}`,
                  ),
                ),
              15000,
            );
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
      mesh.material.freeze();
    }
  }
  draw(debug) {
    const r = this.native,
      start = performance.now();
    const sources = this.sources();
    if (
      this.signature !==
        (this.dimension === 2 ? r.sim.bodyCount : r.solver.bodies.length) ||
      sources.length !== this.liveBuffers.length ||
      sources.some((buffer, i) => buffer !== this.liveBuffers[i])
    )
      this.refresh();
    const styleBuffer = this.dimension === 2 ? r.colors : r.visuals.styles;
    const styleVersion =
      this.dimension === 2 ? r.colorVersion : r.visuals.styleVersion;
    if (styleVersion !== this.styleVersion) {
      const job = this.copies.get(styleBuffer);
      if (job) job.fresh = true;
      this.styleVersion = styleVersion;
    }
    if (this.links) this.links.setEnabled(debug || r.drawLinks);
    if (this.points) {
      this.points.setEnabled(
        debug && (this.dimension === 3 || r.contactCount > 0),
      );
      if (this.dimension === 2 && r.contactCount)
        this.points.thinInstanceCount = r.contactCount;
    }
    const encoder = r.device.createCommandEncoder(),
      slot = r.timer.begin();
    if (slot)
      encoder
        .beginComputePass({
          timestampWrites: {
            querySet: slot.query,
            beginningOfPassWriteIndex: 0,
          },
        })
        .end();
    const copySlot = this.copyTimer.begin();
    if (copySlot)
      encoder
        .beginComputePass({
          timestampWrites: {
            querySet: copySlot.query,
            beginningOfPassWriteIndex: 0,
          },
        })
        .end();
    if (debug && this.contactSample) this.contactSample.encode(encoder);
    let bytes = 0;
    const active = new Set(
      this.meshes.filter((m) => m.isEnabled()).flatMap((m) => m.avbdBuffers),
    );
    for (const job of this.copies.values())
      if (job.fresh || (job.dynamic && active.has(job.source))) {
        encoder.copyBufferToBuffer(
          job.source,
          0,
          job.storage.getBuffer().underlyingResource,
          0,
          job.source.size,
        );
        job.fresh = false;
        bytes += job.source.size;
      }
    encoder.copyBufferToBuffer(
      this.dimension === 3 ? r.camera : r.uniform,
      0,
      this.camera.getBuffer().underlyingResource,
      0,
      this.dimension === 3 ? 96 : 32,
    );
    if (copySlot)
      encoder
        .beginComputePass({
          timestampWrites: { querySet: copySlot.query, endOfPassWriteIndex: 1 },
        })
        .end();
    this.copyTimer.encode(encoder, copySlot);
    r.device.queue.submit([encoder.finish()]);
    this.copyTimer.resolve(copySlot);
    // The shared camera preparation sizes the canvas first. Force Babylon's
    // attachment resize only when that size changes, including scrollbar changes.
    const { width, height } = r.canvas;
    if (width !== this.renderSize[0] || height !== this.renderSize[1]) {
      this.engine.setSize(width, height, true);
      this.renderSize = [width, height];
    }
    this.engine.beginFrame();
    this.scene.render();
    this.engine.endFrame();
    if (slot) {
      const end = r.device.createCommandEncoder();
      end
        .beginComputePass({
          timestampWrites: { querySet: slot.query, endOfPassWriteIndex: 1 },
        })
        .end();
      r.timer.encode(end, slot);
      r.device.queue.submit([end.finish()]);
      r.timer.resolve(slot);
    }
    Object.assign(this.stats, {
      draws: this.meshes.filter((m) => m.isEnabled()).length,
      copiedBytes: bytes,
      cpuSubmitMs: performance.now() - start,
    });
  }
  dispose() {
    this.scene.dispose();
    this.camera.dispose();
    this.copyTimer.destroy();
    this.contactSample?.dispose();
    for (const job of this.copies.values()) job.storage.dispose();
    this.copies.clear();
  }
}

export class BabylonRenderer3D extends CanonicalRenderer {
  constructor(device, canvas, solver, gpu, { engine, ...options }) {
    super(device, canvas, solver, gpu, {
      ...options,
      contextCanvas: document.createElement("canvas"),
      renderAttachments: false,
    });
    this.babylon = new BabylonDraw(this, engine, 3);
    this.kind = "babylon";
  }
  ready() {
    return this.babylon.ready();
  }
  draw(debug = true) {
    const start = performance.now();
    this.prepareFrame();
    this.babylon.draw(debug);
    this.babylon.stats.cpuSubmitMs = performance.now() - start;
  }
  replaceShape(index, body, refresh = true) {
    super.replaceShape(index, body, refresh);
    this.babylon?.refresh();
  }
  dispose() {
    this.babylon?.dispose();
    super.dispose();
  }
  get renderStats() {
    return {
      ...this.babylon.stats,
      gpuDrawMs:
        this.babylon.engine.gpuTimeInFrameForMainPass?.counter.current / 1e6,
      gpuCopyMs: this.babylon.copyTimer.latestMs,
    };
  }
}
export class BabylonRenderer2D extends GpuRenderer2D {
  constructor(device, canvas, sim, camera, { engine, ...options }) {
    super(device, canvas, sim, camera, {
      ...options,
      contextCanvas: document.createElement("canvas"),
    });
    this.babylon = new BabylonDraw(this, engine, 2);
    this.kind = "babylon";
  }
  ready() {
    return this.babylon.ready();
  }
  draw(debug) {
    const start = performance.now();
    this.prepareFrame();
    this.babylon.draw(debug);
    this.babylon.stats.cpuSubmitMs = performance.now() - start;
  }
  dispose() {
    this.babylon?.dispose();
    super.dispose();
  }
  get renderStats() {
    return {
      ...this.babylon.stats,
      gpuDrawMs:
        this.babylon.engine.gpuTimeInFrameForMainPass?.counter.current / 1e6,
      gpuCopyMs: this.babylon.copyTimer.latestMs,
    };
  }
}
