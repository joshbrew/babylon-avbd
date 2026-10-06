import { GpuSolver2D } from "../../reference/three-avbd/src/avbd2d/gpu/solver.ts";
import { Restitution2D } from "./restitution2D.js";
import { protectStep2D, protectTopology2D } from "./protectStep2D.js";
import {
  Sleeping2D,
  sleepOptions2D,
  withSleepingSolve2D,
  withSleepingTopology2D,
} from "./sleeping2D.js";
import { encodeGpuSolverStep2D } from "./gpuSolverStep2D.ts";
import {
  T_LIMIT_2D,
  angleLimits2D,
  withAngleLimits2D,
  uploadAngleLimits2D,
} from "./angularLimits2D.js";
import {
  broadphaseWGSL,
  contactsWGSL,
} from "../../reference/three-avbd/src/avbd2d/gpu/wgsl-collision.ts";
import { solveWGSL } from "../../reference/three-avbd/src/avbd2d/gpu/wgsl-solve.ts";
import { topologyWGSL } from "../../reference/three-avbd/src/avbd2d/gpu/wgsl-topology.ts";
import { ContactWatch, BEGIN } from "../vendor/three-avbd-lib/contacts.ts";
import { ShapeQueries } from "./shapeQueries.js";
import shapeContacts from "./contacts2D.wgsl";
import {
  shapesOf2D,
  circle2D,
  capsule2D,
  segment2D,
  plane2D,
  hull2D,
  storeShape2D,
} from "./shapes2D.js";
import { PAIR_SHIFT } from "../../reference/three-avbd/src/avbd2d/soa/broadphase.ts";
import { BodyCommands2D, vector2D } from "./bodyCommands2D.js";
import { propertyEdits } from "./bufferEdits.js";
import { writePassConstants } from "./passConstants.js";
import {
  CS,
  STIFF,
  FMIN,
  FMAX,
  P0,
  P1,
  P2,
  INFO_STRIDE,
  T_JOINT,
  T_MOTOR,
} from "../../reference/three-avbd/src/avbd2d/soa/solver.ts";
import {
  JOINT_FLOATS,
  J_FMIN,
  J_FMAX,
  J_PARAM,
  J_ANCHORS,
  argsWGSL,
} from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
export class AppGpuSolver2D extends GpuSolver2D {
  writePassConstants(iterations, alphaFor) {
    writePassConstants.call(this, iterations, alphaFor);
  }
  // Compile once through the app hook so the box-only path gets the same step
  // protection as the optional shape/sensor pipelines. Buffer layouts stay pinned.
  createPipelines() {
    const L = this.layouts;
    this.compile(
      broadphaseWGSL,
      [L.broad],
      ["beginFrame", "gridCount", "gridScatter", "findPairs"],
    );
    this.compile(contactsWGSL, [L.contacts], ["hashInsert", "narrowphase"]);
    this.compile(
      topologyWGSL,
      [L.topo],
      [
        "degreeJoints",
        "degreeContacts",
        "fillJoints",
        "fillContacts",
        "sortAdjacency",
        "colorCompact",
        "colorMark",
        "colorRoundAB",
        "colorRoundBA",
        "colorCount",
        "colorStarts",
        "colorScatter",
      ],
    );
    this.compile(
      solveWGSL,
      [L.solve, L.pass],
      [
        "warmStartJoints",
        "warmStartBodies",
        "primal",
        "primalScan",
        "dual",
        "refreshStick",
        "updateVelocities",
      ],
    );
    this.compile(
      argsWGSL,
      [L.args],
      ["argsPrev", "argsPairs", "argsContacts", "argsColors"],
    );
  }
  constructor(device, topology, options = {}) {
    if (options.sleeping !== undefined && options.sleeping !== false)
      sleepOptions2D(options.sleeping);
    super(device, topology, options);
    this.sleepEligible = new Map(topology.avbdSleepEligible ?? []);
    uploadAngleLimits2D(this);
    if (shapesOf2D(topology)?.size) this.enableShapes();
    if (
      options.sleeping ||
      [...this.sleepEligible.values()].some((v) => v === true)
    )
      this.enableSleeping(options.sleeping || {});
  }
  enableShapes() {
    if (this.shapeBuffer) return;
    this.syncShapeGeometry();
    this.shapeContactLayout = this.makeLayout([
      "uniform",
      "read-only-storage",
      "read-only-storage",
      "storage",
      "read-only-storage",
      "storage",
      "storage",
      "read-only-storage",
    ]);
    this.compileBroadphase();
    this.compileContacts();
    this.bindContacts();
    this.staticsDirty = true;
  }
  geometryBytes(extra = 0) {
    let floats = (this.geometryRecords ?? this.bodyCapacity) * 4 + extra;
    if (this.geometryRecords === undefined)
      for (const record of shapesOf2D(this.topology)?.values() ?? [])
        floats += record.vertices?.length ?? 0;
    const bytes = floats * 4;
    if (
      bytes >
      Math.min(
        this.device.limits.maxStorageBufferBindingSize,
        this.device.limits.maxBufferSize,
        0x1000000 * 16,
      )
    )
      throw Error("2D hull geometry exceeds this GPU's storage capacity");
    return bytes;
  }
  // Topology edits upload geometry once; simulation steps reuse the same packed buffer.
  syncShapeGeometry() {
    const bytes = this.geometryBytes();
    const data = new Float32Array(bytes / 4);
    this.packedShapes = new Map();
    let offset = this.bodyCapacity;
    for (const [index, record] of shapesOf2D(this.topology) ?? []) {
      const descriptor = Array.from(record);
      if (record.vertices) {
        descriptor[2] = offset;
        data.set(record.vertices, offset * 4);
        offset += record.vertices.length / 4;
      }
      data.set(descriptor, index * 4);
      this.packedShapes.set(index, descriptor);
    }
    this.geometryRecords = offset;
    this.shapeBuffer = this.createShapeBuffer(bytes);
    this.device.queue.writeBuffer(this.shapeBuffer, 0, data);
  }
  createShapeBuffer(bytes) {
    const limit = Math.min(
      this.device.limits.maxStorageBufferBindingSize,
      this.device.limits.maxBufferSize,
      0x1000000 * 16,
    );
    return this.device.createBuffer({
      label: "2D collider geometry",
      size: Math.min(
        limit,
        Math.max(bytes, Math.ceil((bytes * 1.5) / 16) * 16),
      ),
      usage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
    });
  }
  appendShapeGeometry(index, record) {
    const bytes = this.geometryBytes(record.vertices?.length ?? 0);
    if (this.shapeBuffer.size < bytes) {
      const previous = this.shapeBuffer;
      this.shapeBuffer = this.createShapeBuffer(bytes);
      const encoder = this.device.createCommandEncoder();
      encoder.copyBufferToBuffer(
        previous,
        0,
        this.shapeBuffer,
        0,
        this.geometryRecords * 16,
      );
      this.device.queue.submit([encoder.finish()]);
      previous.destroy();
      this.bindFilters();
      this.bindContacts();
    }
    const descriptor = Array.from(record);
    if (record.vertices) {
      descriptor[2] = this.geometryRecords;
      this.device.queue.writeBuffer(
        this.shapeBuffer,
        this.geometryRecords * 16,
        new Float32Array(record.vertices),
      );
      this.geometryRecords += record.vertices.length / 4;
    }
    this.packedShapes.set(index, descriptor);
    this.device.queue.writeBuffer(
      this.shapeBuffer,
      index * 16,
      new Float32Array(descriptor),
    );
  }
  makeLayout(types) {
    return this.device.createBindGroupLayout({
      entries: types.map((type, binding) => ({
        binding,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type },
      })),
    });
  }
  contactSource() {
    let code = contactsWGSL;
    if (this.shapeBuffer)
      code = code
        .replace(
          "@compute @workgroup_size(64)\nfn narrowphase",
          shapeContacts + "\n@compute @workgroup_size(64)\nfn narrowphase",
        )
        .replace(
          "let col = collideBoxes(A.pose.xyz, A.shape.xy * 0.5, B.pose.xyz, B.shape.xy * 0.5);",
          "let col = collideShapes2D(a,b);",
        );
    if (this.sensorsEnabled)
      code = code
        .replace(
          "rec.ids = vec4u(a, b, o.feature, 0u);",
          "rec.ids = vec4u(a,b,o.feature,select(0u,0x80000000u,A.initial.w!=0.||B.initial.w!=0.));",
        )
        .replace(
          "if (j >= 0) {",
          "if (j >= 0 && rec.ids.w==0u && (prevContacts[j].ids.w&0x80000000u)==0u) {",
        );
    if (this.bodyCommands)
      code = code.replace(
        "if (j >= 0",
        "if (A.prevVel.w==0. && B.prevVel.w==0. && j >= 0",
      );
    return code;
  }
  compileContacts() {
    this.compile(
      this.contactSource(),
      [this.shapeContactLayout ?? this.layouts.contacts],
      ["hashInsert", "narrowphase"],
    );
  }
  bindContacts() {
    if (!this.shapeBuffer) return;
    this.groups.contacts = this.contactBuffers.map((buffer, k) =>
      this.device.createBindGroup({
        layout: this.shapeContactLayout,
        entries: [
          this.paramsBuffer,
          this.bodyBuffer,
          this.pairBuffer,
          buffer,
          this.contactBuffers[1 - k],
          this.tableBuffer,
          this.counterBuffer,
          this.shapeBuffer,
        ].map((buffer, binding) => ({ binding, resource: { buffer } })),
      }),
    );
  }
  compileBroadphase() {
    const types = [
      "uniform",
      "read-only-storage",
      "storage",
      "storage",
      "storage",
      "read-only-storage",
      "read-only-storage",
    ];
    let code = broadphaseWGSL;
    if (this.shapeBuffer) {
      types.push("read-only-storage");
      code = code
        .replace(
          "fn radius(i: u32) -> f32 {\n  return 0.5 * length(bodies[i].shape.xy);\n}",
          "@group(0) @binding(7) var<storage,read> geometry:array<vec4f>;\nfn radius(i:u32)->f32{let g=geometry[i];if(g.x==4.){return g.y;}if(g.x==1.||g.x==2.){return g.y+g.z;}return .5*length(bodies[i].shape.xy);}",
        )
        .replace(
          "return radius(i) > params.maxSmallRadius;",
          "return geometry[i].x==3. || radius(i) > params.maxSmallRadius;",
        )
        .replace(
          "if (dot(d, d) > r * r) { return; }",
          "if(geometry[a].x==3.||geometry[b].x==3.) {\nlet plane=select(b,a,geometry[a].x==3.);let other=select(a,b,geometry[a].x==3.);let normal=rot(bodies[plane].pose.z,vec2f(0.,1.));\nif(dot(bodies[other].pose.xy-bodies[plane].pose.xy,normal)>radius(other)){return;}\n} else if(dot(d,d)>r*r){return;}",
        );
    }
    if (this.filters) {
      const binding = types.length;
      types.push("read-only-storage");
      code = code.replace(
        "fn ignored(hi: u32, lo: u32) -> bool {",
        `@group(0) @binding(${binding}) var<storage,read> filters:array<vec2u>;\nfn ignored(hi:u32,lo:u32)->bool{\nif((filters[hi].x&filters[lo].y)==0u || (filters[lo].x&filters[hi].y)==0u){return true;}`,
      );
    }
    this.filterLayout = this.makeLayout(types);
    this.compile(
      code,
      [this.filterLayout],
      ["beginFrame", "gridCount", "gridScatter", "findPairs"],
    );
    this.bindFilters();
  }
  uploadBodies(first = 0, count = this.topology.bodyCount - first) {
    this.flushPropertyEdits();
    super.uploadBodies(first, count);
    for (let i = first; i < first + count; i++)
      this.sleeping?.register(i, this.sleepEligible?.get(i) !== false);
    if (!this.shapeBuffer && !this.triggers?.size) return;
    const geometry =
      this.shapeBuffer && count > 0 ? new Float32Array(count * 4) : null;
    const records = this.packedShapes;
    for (let index = first; index < first + count; index++) {
      const record = records?.get(index);
      if (geometry && record) geometry.set(record, (index - first) * 4);
      if (this.triggers?.has(index))
        this.device.queue.writeBuffer(
          this.bodyBuffer,
          index * 96 + 28,
          new Float32Array([1]),
        );
    }
    if (geometry)
      this.device.queue.writeBuffer(this.shapeBuffer, first * 16, geometry);
  }
  uploadStatics() {
    if (!this.shapeBuffer) return super.uploadStatics();
    const s = this.topology,
      records = shapesOf2D(s),
      finite = [];
    for (let i = 0; i < this.bodyCount; i++)
      if (records?.get(i)?.[0] !== 3) finite.push(s.props[i * 4 + 1]);
    finite.sort((a, b) => a - b);
    const median = finite[finite.length >> 1] ?? 1;
    let maxSmall = 0,
      minLarge = Infinity;
    for (const r of finite)
      if (r <= 4 * median) maxSmall = Math.max(maxSmall, r);
    for (const r of finite) if (r > maxSmall) minLarge = Math.min(minLarge, r);
    const threshold =
      minLarge === Infinity ? maxSmall * 1.5 : (maxSmall + minLarge) / 2;
    this.maxSmallRadius = threshold;
    this.cellSize = Math.max(2 * maxSmall * (1 + 1e-4), 1e-3);
    const large = [],
      entries = [];
    for (let i = 0; i < this.bodyCount; i++)
      if (records?.get(i)?.[0] === 3 || s.props[i * 4 + 1] > threshold)
        large.push(i);
    for (let c = 0; c < s.jointCount; c++) {
      const a = s.info[c * 4 + 1],
        b = s.info[c * 4 + 2];
      if (a >= 0) entries.push([Math.max(a, b), Math.min(a, b), c]);
    }
    for (const key of s.ignoredPairs()) {
      const hi = Math.floor(key / PAIR_SHIFT);
      entries.push([hi, key - hi * PAIR_SHIFT, 0xffffffff]);
    }
    entries.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    this.largeCount = large.length;
    this.noCollideCount = entries.length;
    const data = new Uint32Array(
      Math.max(large.length + 3 * entries.length, 4),
    );
    data.set(large);
    entries.forEach((e, k) => data.set(e, large.length + 3 * k));
    if (this.staticBuffer.size < data.byteLength) {
      this.staticBuffer.destroy();
      this.staticBuffer = this.device.createBuffer({
        label: "2D boundaries",
        size: data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.rebuildBindings();
    }
    this.device.queue.writeBuffer(this.staticBuffer, 0, data);
    this.staticsDirty = false;
  }
  async raycast(origin, direction, options = {}) {
    const [hit] = await this.raycastAll(
      [{ origin, direction, maxDistance: options.maxDistance }],
      options,
    );
    return hit;
  }
  raycastAll(rays, options = {}) {
    this.flushEdits();
    this.shapeQueries ??= new ShapeQueries(this, 2);
    return this.shapeQueries.cast(
      rays.map((r) => ({ ...r, radius: 0 })),
      options,
    );
  }
  async circleCast(origin, radius, direction, options = {}) {
    const [hit] = await this.circleCastAll(
      [{ origin, radius, direction, maxDistance: options.maxDistance }],
      options,
    );
    return hit;
  }
  circleCastAll(casts, options = {}) {
    this.flushEdits();
    this.shapeQueries ??= new ShapeQueries(this, 2);
    return this.shapeQueries.cast(casts, options);
  }
  liveIndex(index) {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (!Number.isInteger(index) || index < 0 || index >= this.bodyCount)
      throw Error("A live 2D body index is required");
  }
  queueBodyCommand(index, kind, value, point, hasPoint = false) {
    this.liveIndex(index);
    this.prepareBodyCommands().enqueue(index, kind, value, point, hasPoint);
    return this;
  }
  prepareBodyCommands() {
    this.wakeAll();
    if (!this.bodyCommands) {
      this.bodyCommands = new BodyCommands2D(this);
      this.compileContacts();
    }
    return this.bodyCommands;
  }
  setLinearVelocity(index, velocity) {
    return this.queueBodyCommand(index, 0, vector2D(velocity, "velocity"));
  }
  setAngularVelocity(index, velocity) {
    if (!Number.isFinite(velocity))
      throw Error("Angular velocity must be finite");
    return this.queueBodyCommand(index, 1, [velocity, 0, 0, 0]);
  }
  applyImpulse(index, impulse, point) {
    return this.queueBodyCommand(
      index,
      2,
      vector2D(impulse, "impulse"),
      point === undefined ? undefined : vector2D(point, "point"),
      point !== undefined,
    );
  }
  applyForce(index, force, point) {
    return this.queueBodyCommand(
      index,
      3,
      [...vector2D(force, "force"), 0, this.params.dt],
      point === undefined ? undefined : vector2D(point, "point"),
      point !== undefined,
    );
  }
  applyAngularImpulse(index, impulse) {
    if (!Number.isFinite(impulse))
      throw Error("Angular impulse must be finite");
    return this.queueBodyCommand(index, 5, [impulse, 0, 0, 0]);
  }
  applyTorque(index, torque) {
    if (!Number.isFinite(torque)) throw Error("Torque must be finite");
    return this.queueBodyCommand(index, 6, [torque, 0, 0, this.params.dt]);
  }
  teleport(index, position, angle) {
    if (angle !== undefined && !Number.isFinite(angle))
      throw Error("Angle must be finite");
    return this.queueBodyCommand(
      index,
      4,
      [...vector2D(position, "position"), angle ?? 0, 0],
      undefined,
      angle !== undefined,
    );
  }
  readBodies() {
    this.flushEdits();
    return super.readBodies();
  }
  async readBodyState(index) {
    this.liveIndex(index);
    this.flushEdits();
    const d = this.device,
      staging = d.createBuffer({
        size: 96,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    try {
      const e = d.createCommandEncoder();
      e.copyBufferToBuffer(this.bodyBuffer, index * 96, staging, 0, 96);
      d.queue.submit([e.finish()]);
      await staging.mapAsync(GPUMapMode.READ);
      const f = new Float32Array(staging.getMappedRange());
      return {
        position: [f[0], f[1]],
        angle: f[2],
        linearVelocity: [f[12], f[13]],
        angularVelocity: f[14],
        mass: f[22],
        moment: f[23],
        sleeping: f[15] !== 0,
      };
    } finally {
      staging.destroy();
    }
  }
  addBox(size, options = {}) {
    return this.addShape({ size: Array.from(size) }, options);
  }
  addCircle(radius, options = {}) {
    return this.addShape(circle2D(radius), options);
  }
  addHull(points, options = {}) {
    return this.addShape(hull2D(points), options);
  }
  addCapsule(radius, length, options = {}) {
    return this.addShape(capsule2D(radius, length), options);
  }
  addSegment(start, end, options = {}) {
    return this.addShape(segment2D(start, end, options));
  }
  addPlane(normal = [0, 1], offset = 0, options = {}) {
    return this.addShape(plane2D(normal, offset, options));
  }
  addShape(spec, options = {}) {
    options = spec.options ?? options;
    const {
      density = 1,
      friction = 0.6,
      position = [0, 0],
      angle = 0,
      velocity = [0, 0, 0],
      restitution = 0,
      isTrigger = false,
      group = 0xffffffff,
      collidesWith = 0xffffffff,
      allowSleep,
    } = options;
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (allowSleep !== undefined && typeof allowSleep !== "boolean")
      throw Error("allowSleep must be boolean");
    if (this.bodyCount >= this.bodyCapacity)
      throw Error(
        "2D body capacity reached; reserve bodyCapacity when creating the solver",
      );
    if (
      spec.size.length !== 2 ||
      !spec.size.every((v) => Number.isFinite(v) && v > 0) ||
      !Number.isFinite(density) ||
      density < 0 ||
      !Number.isFinite(friction) ||
      friction < 0 ||
      !Number.isFinite(angle)
    )
      throw Error(
        "Body dimensions must be positive, density and friction nonnegative, and angle finite",
      );
    if (velocity.length !== 3 || !Array.from(velocity).every(Number.isFinite))
      throw Error("Velocity requires [x, y, angular] finite components");
    if (
      typeof isTrigger !== "boolean" ||
      !Number.isFinite(restitution) ||
      restitution < 0 ||
      restitution > 1
    )
      throw Error(
        "isTrigger must be boolean and restitution between zero and one",
      );
    if (
      [group, collidesWith].some(
        (v) => !Number.isInteger(v) || v < 0 || v > 0xffffffff,
      )
    )
      throw Error("Collision masks must be unsigned 32-bit integers");
    const p = vector2D(position, "position");
    if (spec.geometry) this.geometryBytes(spec.geometry.vertices?.length ?? 0);
    const index = super.addBody(
      spec.size,
      density,
      friction,
      [...p, angle],
      Array.from(velocity),
    );
    if (spec.geometry) {
      storeShape2D(this.topology, index, spec, density);
      if (this.shapeBuffer) this.appendShapeGeometry(index, spec.geometry);
      else this.enableShapes();
      this.uploadBodies(index, 1);
    }
    if (restitution) this.setRestitution(index, restitution);
    if (isTrigger) this.setSensor(index, true);
    if (group !== 0xffffffff || collidesWith !== 0xffffffff)
      this.setFilters([index], [group], [collidesWith]);
    this.contactWatch?.setWatched(
      [index],
      [!this.watchedIndices || this.watchedIndices.has(index)],
    );
    this.sleepEligible.set(index, allowSleep ?? true);
    if (allowSleep === true && !this.sleeping) this.enableSleeping();
    this.sleeping?.register(index, allowSleep !== false);
    this.wakeAll();
    return index;
  }
  setRestitution(index, value) {
    this.liveIndex(index);
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.bodyCount ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    )
      throw Error(
        "Restitution requires a live body index and a coefficient in 0..1",
      );
    if (value > 0 && !this.restitution)
      this.restitution = new Restitution2D(this);
    this.restitution?.set(index, value);
    this.wakeAll();
  }
  constraintSlot(slot, type) {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= this.jointCount ||
      this.topology.handles[slot]?.disposed
    )
      throw Error("A live 2D constraint slot is required");
    if (type !== undefined && this.topology.info[slot * INFO_STRIDE] !== type)
      throw Error("The constraint has a different type");
    return slot;
  }
  setMotor(slot, { speed, maxTorque } = {}) {
    this.constraintSlot(slot, T_MOTOR);
    if (
      (speed !== undefined && !Number.isFinite(speed)) ||
      (maxTorque !== undefined &&
        (!Number.isFinite(maxTorque) || maxTorque < 0))
    )
      throw Error("Motor speed must be finite and maximum torque nonnegative");
    const cpu = slot * CS,
      gpu = slot * JOINT_FLOATS;
    if (speed !== undefined) {
      this.topology.data[cpu + P0] = speed;
      propertyEdits(this).float(this.jointBuffer, gpu + J_PARAM, speed);
    }
    if (maxTorque !== undefined) {
      this.topology.data[cpu + FMIN] = -maxTorque;
      this.topology.data[cpu + FMAX] = maxTorque;
      propertyEdits(this).float(this.jointBuffer, gpu + J_FMIN, -maxTorque);
      propertyEdits(this).float(this.jointBuffer, gpu + J_FMAX, maxTorque);
    }
    this.wakeAll();
  }
  setAngleLimits(slot, options) {
    this.constraintSlot(slot, T_LIMIT_2D);
    const limits = angleLimits2D(options);
    this.topology.data[slot * CS + P1] = limits.minAngle;
    this.topology.data[slot * CS + P2] = limits.maxAngle;
    propertyEdits(this).float(
      this.jointBuffer,
      slot * JOINT_FLOATS + J_PARAM + 1,
      limits.minAngle,
    );
    propertyEdits(this).float(
      this.jointBuffer,
      slot * JOINT_FLOATS + J_PARAM + 2,
      limits.maxAngle,
    );
    // Old stop forces must not pull a body toward the previous interval.
    for (let k = 4; k < 8; k++)
      propertyEdits(this).float(this.jointBuffer, slot * JOINT_FLOATS + k, 0);
    this.wakeAll();
  }
  setWorldAnchor(slot, x, y) {
    this.constraintSlot(slot, T_JOINT);
    if (
      this.topology.info[slot * INFO_STRIDE + 1] !== -1 ||
      !Number.isFinite(x) ||
      !Number.isFinite(y)
    )
      throw Error("A world joint and finite xy anchor are required");
    propertyEdits(this).float(
      this.jointBuffer,
      slot * JOINT_FLOATS + J_ANCHORS,
      x,
    );
    propertyEdits(this).float(
      this.jointBuffer,
      slot * JOINT_FLOATS + J_ANCHORS + 1,
      y,
    );
    this.wakeAll();
  }
  disableConstraint(slot) {
    if (this.topology.handles[slot]?.disposed) return;
    this.constraintSlot(slot);
    this.flushPropertyEdits();
    super.disableConstraint(slot);
    this.wakeAll();
    const handle = this.topology.handles[slot];
    if (handle) {
      handle.alive = false;
      handle.disposed = true;
    }
  }
  appendJoint(a, b, anchorA, anchorB, stiffness, breakForce = Infinity) {
    if (a !== -1) this.liveIndex(a);
    this.liveIndex(b);
    if (a === b) throw Error("Constraint endpoints must differ");
    const ra = vector2D(anchorA, "anchorA"),
      rb = vector2D(anchorB, "anchorB");
    if (
      !stiffness ||
      stiffness.length !== 3 ||
      Array.from(stiffness).some(
        (v) => v !== Infinity && (!Number.isFinite(v) || v < 0),
      ) ||
      (breakForce !== Infinity &&
        (!Number.isFinite(breakForce) || breakForce < 0))
    )
      throw Error(
        "Joint stiffness and break force must be nonnegative or Infinity",
      );
    this.flushPropertyEdits();
    const slot = super.appendJoint(
      a,
      b,
      ra,
      rb,
      Array.from(stiffness),
      breakForce,
    );
    this.wakeAll();
    return slot;
  }
  setFilters(indices, groups, collidesWith) {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (
      indices.length !== groups.length ||
      indices.length !== collidesWith.length
    )
      throw Error("Each body index needs a group and collision mask");
    const mask = (v) => {
      if (!Number.isInteger(v) || v < 0 || v > 0xffffffff)
        throw Error("Collision masks must be unsigned 32-bit integers");
      return v;
    };
    const values = Array.from(indices, (index, k) => {
      this.liveIndex(index);
      return [index, mask(groups[k]), mask(collidesWith[k])];
    });
    this.wakeAll();
    if (!this.filters) {
      const d = this.device;
      this.filters = d.createBuffer({
        size: this.bodyCapacity * 8,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      d.queue.writeBuffer(
        this.filters,
        0,
        new Uint32Array(this.bodyCapacity * 2).fill(0xffffffff),
      );
      this.compileBroadphase();
    }
    const edits = propertyEdits(this);
    for (const [index, group, mask] of values) {
      edits.uint(this.filters, index * 2, group);
      edits.uint(this.filters, index * 2 + 1, mask);
    }
  }
  bindFilters() {
    if (!this.filterLayout) return;
    this.groups.broad = this.device.createBindGroup({
      layout: this.filterLayout,
      entries: [
        this.paramsBuffer,
        this.bodyBuffer,
        this.gridBuffer,
        this.pairBuffer,
        this.counterBuffer,
        this.staticBuffer,
        this.jointBuffer,
        ...(this.shapeBuffer ? [this.shapeBuffer] : []),
        ...(this.filters ? [this.filters] : []),
      ].map((buffer, binding) => ({ binding, resource: { buffer } })),
    });
  }
  rebuildBindings() {
    super.rebuildBindings();
    this.bindFilters();
    this.bindContacts();
  }
  setSensor(index, enabled) {
    this.liveIndex(index);
    if (typeof enabled !== "boolean")
      throw Error("Sensor flag must be boolean");
    this.wakeAll();
    if (enabled && !this.sensorsEnabled) {
      this.sensorsEnabled = true;
      const d = this.device;
      const init = d.createComputePipeline({
        layout: "auto",
        compute: {
          module: d.createShaderModule({
            code: "@group(0) @binding(0) var<storage,read_write> data:array<vec4f>; @compute @workgroup_size(64) fn clear(@builtin(global_invocation_id) id:vec3u){if(id.x*6u+1u<arrayLength(&data)){data[id.x*6u+1u].w=0.;}}",
          }),
          entryPoint: "clear",
        },
      });
      const group = d.createBindGroup({
        layout: init.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: this.bodyBuffer } }],
      });
      const e = d.createCommandEncoder(),
        p = e.beginComputePass();
      p.setPipeline(init);
      p.setBindGroup(0, group);
      p.dispatchWorkgroups(Math.ceil(this.bodyCount / 64));
      p.end();
      d.queue.submit([e.finish()]);
      this.compileContacts();
      const solve = solveWGSL
        .replace(
          "b.initial = b.pose;",
          "b.initial = vec4f(b.pose.xyz,b.initial.w);",
        )
        .replace(
          "fn addContact(acc: ptr<function, Acc>, c: u32, alpha: f32, i: u32) {",
          "fn addContact(acc: ptr<function, Acc>, c: u32, alpha: f32, i: u32) {\n if((contacts[c].ids.w&0x80000000u)!=0u){return;}",
        )
        .replace(
          "fn dualContact(c: u32) {",
          "fn dualContact(c: u32) {\n if((contacts[c].ids.w&0x80000000u)!=0u){return;}",
        )
        .replace(
          "  let k = contacts[c];\n  let bound",
          "  let k = contacts[c];\n  if((k.ids.w&0x80000000u)!=0u){return;}\n  let bound",
        );
      this.compile(
        solve,
        [this.layouts.solve, this.layouts.pass],
        [
          "warmStartJoints",
          "warmStartBodies",
          "primal",
          "primalScan",
          "dual",
          "refreshStick",
          "updateVelocities",
        ],
      );
      const topology = topologyWGSL.replaceAll(
        "if (gid.x >= topoCount()) { return; }",
        "if (gid.x >= topoCount()) { return; }\n if((contacts[gid.x].ids.w&0x80000000u)!=0u){return;}",
      );
      this.compile(
        topology,
        [this.layouts.topo],
        ["degreeContacts", "fillContacts"],
      );
    }
    if (this.sensorsEnabled)
      propertyEdits(this).float(
        this.bodyBuffer,
        index * 24 + 7,
        enabled ? 1 : 0,
      );
    this.triggers ??= new Set();
    if (enabled) this.triggers.add(index);
    else this.triggers.delete(index);
  }
  compile(code, layouts, entries) {
    if (code.includes("fn warmStartBodies("))
      code = protectStep2D(withSleepingSolve2D(withAngleLimits2D(code)));
    if (code.includes("fn dynamicBody(")) code = withSleepingTopology2D(code);
    if (code.includes("fn colorCount(")) code = protectTopology2D(code);
    const d = this.device,
      module = d.createShaderModule({ code }),
      layout = d.createPipelineLayout({ bindGroupLayouts: layouts });
    for (const entryPoint of entries)
      this.pipes[entryPoint] = d.createComputePipeline({
        layout,
        compute: { module, entryPoint },
      });
  }
  watchContacts({ maxPairs = 8192, maxEvents = 4096, indices } = {}) {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (indices !== undefined) {
      if (!Array.isArray(indices))
        throw Error("Watched indices must be an array of live body indices");
      for (const index of indices) this.liveIndex(index);
    }
    for (const n of [maxPairs, maxEvents])
      if (!Number.isInteger(n) || n < 1)
        throw Error("Contact capacities must be positive integers");
    if (!this.contactWatch) {
      this.contactWatch = new ContactWatch(
        this.device,
        this.bodyBuffer,
        this.bodyCapacity,
        maxPairs,
        maxEvents,
        2,
      );
      if (indices === undefined)
        this.contactWatch.setWatched(
          Array.from({ length: this.bodyCount }, (_, i) => i),
          Array(this.bodyCount).fill(true),
        );
    }
    if (indices !== undefined) {
      this.watchedIndices = new Set(indices);
      this.contactWatch.setWatched(
        Array.from({ length: this.bodyCount }, (_, i) => i),
        Array.from({ length: this.bodyCount }, (_, i) =>
          this.watchedIndices.has(i),
        ),
      );
    }
    return this;
  }
  async readContactEvents() {
    this.watchContacts();
    const result = await this.contactWatch.read();
    return {
      ...result,
      events: result.events.map((e) => ({
        ...e,
        type: e.kind === BEGIN ? "begin" : "end",
        isTrigger: !!(this.triggers?.has(e.a) || this.triggers?.has(e.b)),
      })),
    };
  }
  step() {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (
      this.sleeping ||
      this.restitution?.active.size ||
      this.bodyCommands?.pending.size ||
      this.propertyEdits?.pending
    )
      encodeGpuSolverStep2D.call(this);
    else super.step();
    if (this.contactWatch)
      this.contactWatch.run(
        {
          manifolds: this.contactBuffers[1 - this.parity],
          contacts: this.contactBuffers[1 - this.parity],
          counters: this.counterBuffer,
        },
        this.contactCapacity,
        (this.eventStep = (this.eventStep ?? 0) + 1),
        this.params.dt,
      );
  }
  encodeStepPrelude(encoder) {
    this.flushPropertyEdits(encoder);
    this.sleeping?.before(encoder);
    this.bodyCommands?.flush(encoder);
    this.restitution?.before(encoder);
  }
  encodeStepPostlude(encoder) {
    this.restitution?.after(encoder);
    this.sleeping?.after(encoder);
  }
  destroy() {
    this.passConstantCache = null;
    this.propertyEdits?.destroy();
    if (this.destroyed) return;
    this.detachFromScene();
    this.shapeQueries?.destroy();
    this.restitution?.destroy();
    this.filters?.destroy();
    this.shapeBuffer?.destroy();
    this.bodyCommands?.destroy();
    this.contactWatch?.destroy();
    this.sleeping?.destroy();
    super.destroy();
  }
  enableSleeping(options = {}) {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (!this.sleeping) this.sleeping = new Sleeping2D(this, options);
    else this.sleeping.options = sleepOptions2D(options);
    return this;
  }
  disableSleeping() {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (this.sleeping) {
      this.sleeping.wakeRequested = true;
      this.sleeping.before();
      this.sleeping.destroy();
      this.sleeping = null;
    }
    return this;
  }
  setSleepEnabled(index, enabled) {
    this.liveIndex(index);
    if (typeof enabled !== "boolean") throw Error("Sleep flag must be boolean");
    this.sleepEligible.set(index, enabled);
    if (enabled && !this.sleeping) this.enableSleeping();
    this.sleeping?.register(index, enabled);
    this.wakeAll();
    return this;
  }
  wakeAll() {
    if (this.sleeping) this.sleeping.wakeRequested = true;
    return this;
  }
  wakeUp(index) {
    this.liveIndex(index);
    return this.wakeAll();
  }
  async readSleepStats() {
    return this.sleeping
      ? this.sleeping.readStats()
      : { sleeping: 0, wakeRequested: false };
  }
  flushEdits() {
    this.flushPropertyEdits();
    if (this.sleeping?.wakeRequested) this.sleeping.before();
    this.bodyCommands?.flush();
  }
  flushPropertyEdits(encoder) {
    this.propertyEdits?.flush(encoder);
  }
  readJoints() {
    this.flushPropertyEdits();
    return super.readJoints();
  }
  /** Fixed GPU steps without readbacks. The Babylon scene owns solver disposal. */
  attachToScene(
    scene,
    { maxSubSteps = 6, maxFrameTime = 0.05, afterStep } = {},
  ) {
    if (this.destroyed) throw Error("The 2D solver has been destroyed");
    if (
      !scene?.onBeforeRenderObservable?.add ||
      !scene?.onDisposeObservable?.addOnce ||
      !scene?.getEngine
    )
      throw Error("A Babylon scene is required");
    if (
      !Number.isInteger(maxSubSteps) ||
      maxSubSteps < 1 ||
      !Number.isFinite(maxFrameTime) ||
      maxFrameTime <= 0 ||
      (afterStep !== undefined && typeof afterStep !== "function")
    )
      throw Error(
        "Scene stepping requires positive frame limits and an optional afterStep function",
      );
    if (this.sceneBinding) {
      if (this.sceneBinding.scene === scene) return this;
      throw Error("The 2D solver is already attached to another scene");
    }
    let accumulator = 0;
    const before = scene.onBeforeRenderObservable.add(() => {
      const dt = this.params.dt;
      if (!(dt > 0) || !Number.isFinite(dt))
        throw Error("Simulation timestep must be positive and finite");
      const elapsed = scene.getEngine().getDeltaTime() / 1000;
      accumulator = Math.min(
        maxSubSteps * dt,
        accumulator + Math.min(maxFrameTime, Math.max(0, elapsed)),
      );
      for (
        let count = 0;
        accumulator + 1e-12 >= dt && count < maxSubSteps;
        count++
      ) {
        this.step();
        accumulator = Math.max(0, accumulator - dt);
        afterStep?.(this);
        if (!this.sceneBinding || this.destroyed) break;
      }
    });
    const dispose = scene.onDisposeObservable.addOnce(() => this.destroy());
    this.sceneBinding = { scene, before, dispose };
    return this;
  }
  detachFromScene() {
    const binding = this.sceneBinding;
    if (binding) {
      binding.scene.onBeforeRenderObservable.remove(binding.before);
      binding.scene.onDisposeObservable.remove(binding.dispose);
      this.sceneBinding = null;
    }
    return this;
  }
}
