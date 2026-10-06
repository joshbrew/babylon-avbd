import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { makeCubeVertices } from "./cubeGeometry.js";
import { hullOf, isSphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import {
  Joint,
  Spring,
} from "../reference/three-avbd/src/avbd3d/ref/forces.ts";
import shader from "./canonicalRender.wgsl";
import contactShader from "./gpuContactRender.wgsl";
import { GpuShowcaseVisuals } from "./gpuShowcaseVisuals.js";
import { GpuTimer } from "../src/gpu/gpuTimer.js";
import { initialAngularConstraint } from "../src/gpu/angularConstraints.js";
import {
  rotateInv,
  vec3,
} from "../reference/three-avbd/src/avbd3d/ref/math.ts";

export function packBodies(solver) {
  const f = new Float32Array(Math.max(1, solver.bodies.length) * 40);
  solver.bodies.forEach((b, i) => {
    const o = i * 40;
    f.set(b.positionLin, o);
    f[o + 3] = b.friction;
    f.set(b.positionAng, o + 4);
    f.set(b.size, o + 16);
    f[o + 19] = b.mass;
    f.set(b.moment, o + 20);
    f[o + 23] = b.radius;
    f.set(b.velocityLin, o + 32);
    f.set(b.velocityAng, o + 36);
    f[o + 39] = isSphere(b) ? 1 : hullOf(b) ? 3 : 0;
  });
  return f;
}

export class CanonicalRenderer {
  constructor(
    device,
    canvas,
    solver,
    gpu,
    { enhanced = true, contextCanvas = canvas, renderAttachments = true } = {},
  ) {
    this.device = device;
    this.canvas = canvas;
    this.resources = [];
    this.yaw = -0.35;
    this.pitch = 0.32;
    this.gpu = gpu;
    this.solver = solver;
    this.enhanced = enhanced;
    this.renderAttachments = renderAttachments;
    this.sampleCount = enhanced ? 4 : 1;
    this.context = contextCanvas.getContext("webgpu");
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device,
      format: this.format,
      alphaMode: "opaque",
    });
    this.buffer =
      gpu?.bodyBuffer ||
      this.bufferOf(
        packBodies(solver),
        GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      );
    this.camera = this.bufferOf(
      new Float32Array(24),
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    );
    const forces = solver.forces.filter(
      (f) => f instanceof Joint || f instanceof Spring,
    );
    this.forces = forces;
    this.joints = this.bufferOf(
      new Float32Array(Math.max(1, forces.length) * 32),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    );
    this.visuals = new GpuShowcaseVisuals(this);
    const module = device.createShaderModule({
      label: "Canonical scene rendering",
      code: shader,
    });
    this.layout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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
      ],
    });
    this.bind = device.createBindGroup({
      layout: this.layout,
      entries: [
        { binding: 0, resource: { buffer: this.buffer } },
        { binding: 1, resource: { buffer: this.camera } },
        { binding: 2, resource: { buffer: this.joints } },
        { binding: 3, resource: { buffer: this.visuals.styles } },
      ],
    });
    const pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.layout],
    });
    const vertexBuffers = [
      {
        arrayStride: 24,
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },
          { shaderLocation: 1, offset: 12, format: "float32x3" },
        ],
      },
    ];
    const make = (scaled, line = false, points = false) =>
      device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module,
          entryPoint: points ? "pointMain" : line ? "lineMain" : "vertexMain",
          buffers: vertexBuffers,
          constants: { PRE_SCALED: scaled, ENHANCED: enhanced ? 1 : 0 },
        },
        fragment: {
          module,
          entryPoint: line || points ? "lineFragment" : "fragmentMain",
          targets: [{ format: this.format }],
          constants: { PRE_SCALED: scaled, ENHANCED: enhanced ? 1 : 0 },
        },
        primitive: {
          topology: line ? "line-list" : "triangle-list",
          cullMode: line || points ? "none" : "back",
        },
        multisample: { count: this.sampleCount },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: !line && !points,
          depthCompare: points ? "always" : "less-equal",
        },
      });
    this.cubePipeline = make(0);
    this.shapePipeline = make(1);
    this.linePipeline = make(1, true);
    this.pointPipeline = make(1, false, true);
    if (gpu) {
      this.contactBindings = [];
      this.contactLayout = device.createBindGroupLayout({
        entries: [0, 1, 2, 3, 4].map((binding) => ({
          binding,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: binding === 1 ? "uniform" : "read-only-storage" },
        })),
      });
      const contacts = device.createShaderModule({
        label: "GPU contact visualization",
        code: contactShader,
      });
      this.contactPipeline = device.createRenderPipeline({
        label: "GPU contact markers",
        layout: device.createPipelineLayout({
          bindGroupLayouts: [this.contactLayout],
        }),
        vertex: { module: contacts, entryPoint: "vertexMain" },
        fragment: {
          module: contacts,
          entryPoint: "fragmentMain",
          targets: [{ format: this.format }],
        },
        primitive: { topology: "triangle-list" },
        multisample: { count: this.sampleCount },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: false,
          depthCompare: "always",
        },
      });
    }
    const cubes = orientVertices(makeCubeVertices());
    this.cubeVertices = cubes;
    this.cube = this.bufferOf(cubes, GPUBufferUsage.VERTEX);
    this.cubeCount = cubes.length / 6;
    this.special = [];
    solver.bodies.forEach((body, index) =>
      this.replaceShape(index, body, false),
    );
    const index = new Map(
      solver.bodies.map((b, i) => [b, gpu ? gpu.refToGpu[i] : i]),
    );
    const lines = [];
    forces.forEach((f, i) => {
      // Angular rows store axes instead of position anchors; drawing them as
      // anchor links creates misleading spokes to the world origin.
      if (initialAngularConstraint(f)) return;
      lines.push(
        ...f.rA,
        f.bodyA ? index.get(f.bodyA) : -1,
        i,
        0,
        ...f.rB,
        index.get(f.bodyB),
        i,
        0,
      );
    });
    this.lineVertices = new Float32Array(lines.length ? lines : 6);
    this.line = this.bufferOf(this.lineVertices, GPUBufferUsage.VERTEX);
    this.lineCount = lines.length / 6;
    this.timer = new GpuTimer(device);
    this.updateJointVisibility();
    this.fit();
    this.pointer = null;
    this.pointerEpoch = 0;
    this.onDown = (e) => {
      const epoch = ++this.pointerEpoch;
      this.pointer = {
        x: e.clientX,
        y: e.clientY,
        pending: e.button === 0 && !e.altKey,
      };
      canvas.setPointerCapture(e.pointerId);
      if (this.pointer.pending)
        this.pick(e)
          .then((hit) => {
            if (!this.pointer || this.disposed || epoch !== this.pointerEpoch)
              return;
            this.pointer.pending = false;
            if (!hit) return;
            const ray = this.ray(e);
            const world = ray.origin.map(
              (v, i) => v + ray.direction[i] * hit.t,
            );
            if (gpu) {
              this.sleep?.wakeBody(hit.index);
              const slot = gpu.appendJoint(
                -1,
                hit.index,
                world,
                hit.local,
                1000,
                0,
              );
              this.drag = { slot, t: hit.t };
            } else {
              const joint = new Joint(
                solver,
                null,
                solver.bodies[hit.index],
                world,
                hit.local,
                1000,
                0,
              );
              this.drag = { joint, t: hit.t };
            }
          })
          .catch((error) => console.error(error));
    };
    this.onMove = (e) => {
      if (!this.pointer) return;
      if (this.drag) {
        const ray = this.ray(e),
          world = ray.origin.map((v, i) => v + ray.direction[i] * this.drag.t);
        if (this.drag.joint) this.drag.joint.rA.set(world);
        else gpu.setWorldAnchor(this.drag.slot, world);
        return;
      }
      if (this.pointer.pending) return;
      this.yaw -= (e.clientX - this.pointer.x) * 0.006;
      this.pitch = Math.max(
        0.05,
        Math.min(1.3, this.pitch + (e.clientY - this.pointer.y) * 0.006),
      );
      this.pointer = { x: e.clientX, y: e.clientY };
    };
    this.onUp = () => {
      this.pointer = null;
      this.pointerEpoch++;
      if (this.drag) {
        this.drag.joint?.destroy();
        if (gpu) gpu.disableConstraint(this.drag.slot);
        this.drag = null;
      }
    };
    this.onContext = (e) => e.preventDefault();
    this.onWheel = (e) => {
      e.preventDefault();
      this.distance = Math.max(2, this.distance * Math.exp(e.deltaY * 0.001));
    };
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
    canvas.addEventListener("contextmenu", this.onContext);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }
  bufferOf(data, usage) {
    const b = this.device.createBuffer({
      size: Math.max(4, data.byteLength),
      usage: usage | GPUBufferUsage.COPY_SRC,
      mappedAtCreation: true,
    });
    new Uint8Array(b.getMappedRange()).set(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    );
    b.unmap();
    this.resources.push(b);
    return b;
  }
  replaceShape(index, body, refresh = true) {
    if (refresh) this.visuals.refresh();
    const id = this.gpu ? this.gpu.gpuIndex(index) : index,
      old = this.special.find((s) => s.id === id);
    if (old) {
      old.buffer.destroy();
      this.resources = this.resources.filter((b) => b !== old.buffer);
      this.special = this.special.filter((s) => s !== old);
    }
    let vertices;
    const shape = hullOf(body);
    if (shape) {
      const values = [];
      for (const face of shape.faces)
        for (let k = 1; k < face.verts.length - 1; k++)
          for (const i of [face.verts[0], face.verts[k], face.verts[k + 1]])
            values.push(
              ...shape.vertices.slice(i * 3, i * 3 + 3),
              ...face.normal,
            );
      vertices = new Float32Array(values);
    }
    if (vertices) {
      vertices = orientVertices(vertices);
      this.special.push({
        buffer: this.bufferOf(vertices, GPUBufferUsage.VERTEX),
        vertices,
        count: vertices.length / 6,
        id,
      });
    }
  }
  async updateJointVisibility() {
    if (this.gpu) {
      if (this.forces.length) {
        const data = await this.gpu.readJoints();
        if (!this.disposed)
          this.device.queue.writeBuffer(
            this.joints,
            0,
            data.subarray(0, this.forces.length * 32),
          );
      }
      return;
    }
    const j = new Float32Array(Math.max(1, this.forces.length) * 32);
    this.forces.forEach((f, i) => {
      if (!f.broken) {
        j[i * 32 + 3] = Math.min(1e30, f.stiffnessLin ?? f.stiffness ?? 1);
        j[i * 32 + 7] = Math.min(1e30, f.stiffnessAng ?? 0);
      }
    });
    this.device.queue.writeBuffer(this.joints, 0, j);
  }
  async updateContacts() {
    if (this.gpu) return;
    let points;
    {
      const indices = new Map(this.solver.bodies.map((b, i) => [b, i]));
      points = [];
      for (const f of this.solver.forces)
        if (f.contacts)
          for (const c of f.contacts)
            points.push({ anchor: c.rA, body: indices.get(f.bodyA) });
    }
    this.pointCount = points.length * 6;
    if (!this.pointCount) return;
    const data = new Float32Array(this.pointCount * 6);
    let offset = 0;
    for (const p of points)
      for (const corner of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        data.set([...p.anchor, p.body, ...corner], offset);
        offset += 6;
      }
    if (!this.points || this.points.size < data.byteLength) {
      this.points?.destroy();
      this.points = this.device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
    }
    this.device.queue.writeBuffer(this.points, 0, data);
  }
  contactBindGroup() {
    const { manifolds, contacts, counters } = this.gpu.contactStorage;
    let cached = this.contactBindings.find(
      (c) =>
        c.manifolds === manifolds &&
        c.contacts === contacts &&
        c.counters === counters,
    );
    if (!cached) {
      cached = {
        manifolds,
        contacts,
        counters,
        group: this.device.createBindGroup({
          layout: this.contactLayout,
          entries: [
            this.buffer,
            this.camera,
            manifolds,
            contacts,
            counters,
          ].map((buffer, binding) => ({ binding, resource: { buffer } })),
        }),
      };
      this.contactBindings.push(cached);
      if (this.contactBindings.length > 2) this.contactBindings.shift();
    }
    return cached.group;
  }
  fit(poses = null) {
    const b = this.solver.bodies
      .map((body, index) => ({ body, index }))
      .filter(({ body }) => body.mass > 0 || Math.max(...body.size) < 60);
    const lo = [Infinity, Infinity, Infinity],
      hi = [-Infinity, -Infinity, -Infinity];
    for (const { body, index } of b) {
      const o = (this.gpu ? this.gpu.gpuIndex(index) : index) * 40;
      const p = poses ? poses.subarray(o, o + 3) : body.positionLin;
      const [x, y, z, w] = poses
        ? poses.subarray(o + 4, o + 8)
        : body.positionAng;
      const [sx, sy, sz] = body.size;
      const extent = [
        (Math.abs(1 - 2 * (y * y + z * z)) * sx +
          Math.abs(2 * (x * y - z * w)) * sy +
          Math.abs(2 * (x * z + y * w)) * sz) /
          2,
        (Math.abs(2 * (x * y + z * w)) * sx +
          Math.abs(1 - 2 * (x * x + z * z)) * sy +
          Math.abs(2 * (y * z - x * w)) * sz) /
          2,
        (Math.abs(2 * (x * z - y * w)) * sx +
          Math.abs(2 * (y * z + x * w)) * sy +
          Math.abs(1 - 2 * (x * x + y * y)) * sz) /
          2,
      ];
      for (let a = 0; a < 3; a++) {
        lo[a] = Math.min(lo[a], p[a] - extent[a]);
        hi[a] = Math.max(hi[a], p[a] + extent[a]);
      }
    }
    if (!b.length) {
      lo.splice(0, 3, -5, -5, 0);
      hi.splice(0, 3, 5, 5, 5);
    }
    lo[2] = Math.min(0, lo[2]);
    this.target = new Vector3(
      (lo[0] + hi[0]) / 2,
      (lo[2] + hi[2]) / 2,
      (lo[1] + hi[1]) / 2,
    );
    this.distance = Math.max(
      12,
      Math.hypot(...hi.map((v, i) => v - lo[i])) * 1.45,
    );
  }
  setCamera({ distance, target, azimuth, elevation }) {
    this.distance = distance;
    if (target) this.target = new Vector3(target[0], target[2], target[1]);
    if (azimuth !== undefined) this.yaw = ((azimuth + 90) * Math.PI) / 180;
    if (elevation !== undefined) this.pitch = elevation;
  }
  ray(e) {
    const r = this.canvas.getBoundingClientRect(),
      x = ((e.clientX - r.left) / r.width) * 2 - 1,
      y = 1 - ((e.clientY - r.top) / r.height) * 2,
      inv = this.vp.clone().invert();
    const a = Vector3.TransformCoordinates(new Vector3(x, y, 0), inv),
      b = Vector3.TransformCoordinates(new Vector3(x, y, 1), inv),
      d = b.subtract(a).normalize();
    return { origin: [a.x, a.z, a.y], direction: [d.x, d.z, d.y] };
  }
  async pick(e) {
    const ray = this.ray(e),
      f = this.gpu ? await this.gpu.readBodies() : packBodies(this.solver);
    let best = null;
    for (let i = 0; i < this.solver.bodies.length; i++) {
      if (this.solver.bodies[i].mass <= 0) continue;
      const index = this.gpu ? this.gpu.gpuIndex(i) : i,
        o = index * 40,
        p = f.subarray(o, o + 3),
        q = f.subarray(o + 4, o + 8),
        d = p.map((v, k) => v - ray.origin[k]),
        along = d.reduce((s, v, k) => s + v * ray.direction[k], 0);
      if (
        along < 0 ||
        d.reduce((s, v) => s + v * v, 0) - along * along > f[o + 23] ** 2
      )
        continue;
      const origin = rotateInv(
          vec3(),
          q,
          ray.origin.map((v, k) => v - p[k]),
        ),
        direction = rotateInv(vec3(), q, ray.direction);
      let lo = 0,
        hi = Infinity;
      for (let k = 0; k < 3; k++) {
        const h = f[o + 16 + k] / 2;
        if (Math.abs(direction[k]) < 1e-10) {
          if (Math.abs(origin[k]) > h) {
            hi = -1;
            break;
          }
        } else {
          const t0 = (-h - origin[k]) / direction[k],
            t1 = (h - origin[k]) / direction[k];
          lo = Math.max(lo, Math.min(t0, t1));
          hi = Math.min(hi, Math.max(t0, t1));
        }
      }
      if (hi >= lo && (!best || lo < best.t))
        best = {
          index,
          t: lo,
          local: Array.from(origin, (v, k) => v + direction[k] * lo),
        };
    }
    return best;
  }
  prepareFrame() {
    const { device, canvas } = this;
    const width = Math.max(1, Math.floor(canvas.clientWidth)),
      height = Math.max(1, Math.floor(canvas.clientHeight));
    if (
      canvas.width !== width ||
      canvas.height !== height ||
      (this.renderAttachments && !this.depth)
    ) {
      canvas.width = width;
      canvas.height = height;
      if (this.renderAttachments) {
        this.depth?.destroy();
        this.msaa?.destroy();
        this.depth = device.createTexture({
          size: [width, height],
          format: "depth24plus",
          sampleCount: this.sampleCount,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        if (this.sampleCount > 1)
          this.msaa = device.createTexture({
            size: [width, height],
            format: this.format,
            sampleCount: this.sampleCount,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
          });
      }
    }
    if (!this.gpu) {
      device.queue.writeBuffer(this.buffer, 0, packBodies(this.solver));
      this.updateJointVisibility();
    }
    const eye = this.target.add(
      new Vector3(
        Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance,
        Math.sin(this.pitch) * this.distance,
        -Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance,
      ),
    );
    const vp = Matrix.LookAtLH(eye, this.target, Vector3.Up()).multiply(
      Matrix.PerspectiveFovLH(
        0.78,
        width / height,
        0.05,
        Math.max(500, this.distance * 5),
        true,
      ),
    );
    this.vp = vp;
    const camera = new Float32Array(24);
    camera.set(vp.toArray());
    camera.set([eye.x, eye.y, eye.z, 1], 16);
    camera.set([width, height, 0, 0], 20);
    device.queue.writeBuffer(this.camera, 0, camera);
  }
  draw(debug = true) {
    this.prepareFrame();
    const { device } = this;
    const e = device.createCommandEncoder(),
      slot = this.timer.begin();
    const p = e.beginRenderPass({
      colorAttachments: [
        {
          view:
            this.msaa?.createView() ??
            this.context.getCurrentTexture().createView(),
          ...(this.msaa
            ? { resolveTarget: this.context.getCurrentTexture().createView() }
            : {}),
          clearValue: { r: 0.91, g: 0.92, b: 0.94, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depth.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
      ...(slot
        ? {
            timestampWrites: {
              querySet: slot.query,
              beginningOfPassWriteIndex: 0,
              endOfPassWriteIndex: 1,
            },
          }
        : {}),
    });
    p.setBindGroup(0, this.bind);
    p.setPipeline(this.cubePipeline);
    p.setVertexBuffer(0, this.cube);
    p.draw(this.cubeCount, this.solver.bodies.length);
    p.setPipeline(this.shapePipeline);
    for (const shape of this.special) {
      p.setVertexBuffer(0, shape.buffer);
      p.draw(shape.count, 1, 0, shape.id);
    }
    this.visuals.draw(p);
    p.setBindGroup(0, this.bind);
    if (debug && this.lineCount) {
      p.setPipeline(this.linePipeline);
      p.setVertexBuffer(0, this.line);
      p.draw(this.lineCount);
    }
    if (debug && this.gpu) {
      p.setPipeline(this.contactPipeline);
      p.setBindGroup(0, this.contactBindGroup());
      p.draw(6, 2048);
    } else if (debug && this.pointCount) {
      p.setPipeline(this.pointPipeline);
      p.setVertexBuffer(0, this.points);
      p.draw(this.pointCount);
    }
    p.end();
    this.timer.encode(e, slot);
    device.queue.submit([e.finish()]);
    this.timer.resolve(slot);
  }
  dispose() {
    this.disposed = true;
    this.onUp();
    for (const [event, fn] of [
      ["pointerdown", this.onDown],
      ["pointermove", this.onMove],
      ["pointerup", this.onUp],
      ["wheel", this.onWheel],
      ["pointercancel", this.onUp],
      ["contextmenu", this.onContext],
    ])
      this.canvas.removeEventListener(event, fn);
    for (const b of this.resources) b.destroy();
    this.depth?.destroy();
    this.msaa?.destroy();
    this.points?.destroy();
    this.visuals.dispose();
    this.timer.destroy();
    this.context.unconfigure();
  }
}

function orientVertices(v) {
  for (let o = 0; o < v.length; o += 18) {
    const ax = v[o + 6] - v[o],
      ay = v[o + 7] - v[o + 1],
      az = v[o + 8] - v[o + 2],
      bx = v[o + 12] - v[o],
      by = v[o + 13] - v[o + 1],
      bz = v[o + 14] - v[o + 2];
    const dot =
      (ay * bz - az * by) * v[o + 3] +
      (az * bx - ax * bz) * v[o + 4] +
      (ax * by - ay * bx) * v[o + 5];
    if (dot < 0) {
      const b = v.slice(o + 6, o + 12);
      v.copyWithin(o + 6, o + 12, o + 18);
      v.set(b, o + 12);
    }
  }
  return v;
}
