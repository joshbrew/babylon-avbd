import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  sphere,
  hull,
  convexHull,
} from "../../reference/three-avbd/src/avbd3d/shapes.ts";
import { AppGpuSolver3D as GpuSolver3D } from "../gpu/appGpuSolver3D.js";
import { createWebGPUDevice, prepareWebGPUDevice3D } from "../gpu/device.js";
import commandShader from "./babylonAvbd.wgsl";
import { VelocityBatch, MotionBatch } from "../native/velocityBatch.js";
import { appGpuSolverOptions } from "../gpu/gpuSolverOptions.js";
import { AvbdPhysicsConstraint, AvbdPhysicsHinge } from "./constraints.js";
import { BodyReadback } from "../gpu/bodyReadback.js";
import { ContactWatch, BEGIN } from "../vendor/three-avbd-lib/contacts.ts";
import { WorldSleeping } from "../gpu/worldSleeping.js";
import { capsule } from "../gpu/capsuleShape.js";

export const AvbdShapeType = Object.freeze({
  BOX: "box",
  SPHERE: "sphere",
  CAPSULE: "capsule",
  CYLINDER: "cylinder",
  CONVEX_HULL: "convex-hull",
});
const xyz = (value) =>
  value && typeof value.x === "number"
    ? [
        value.x,
        value.y,
        value.z,
        ...(typeof value.w === "number" ? [value.w] : []),
      ]
    : Array.from(value);
const sceneWorlds = new WeakMap();
const mask = (value) => {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
    throw Error("Collision masks must be unsigned 32-bit integers");
  return value;
};
const positive = (value, name, zero = false) => {
  if (!Number.isFinite(value) || (zero ? value < 0 : value <= 0))
    throw Error(
      `${name} must be ${zero ? "nonnegative" : "positive"} and finite`,
    );
  return value;
};

/** Familiar aggregate/body API over the actual GPU solver; not a Physics V2 plugin. */
export class AvbdPhysics {
  static async create({ device, ...options } = {}) {
    if (options.scene && sceneWorlds.has(options.scene))
      throw Error("This scene already has an AVBD world");
    const owned = !device;
    if (!device)
      ({ device } = await createWebGPUDevice({
        preferredLimits: {
          maxStorageBuffersPerShaderStage: 9,
          maxStorageBufferBindingSize: 512 * 1024 * 1024,
          maxBufferSize: 1024 * 1024 * 1024,
        },
      }));
    let world;
    try {
      await prepareWebGPUDevice3D(device);
      world = new AvbdPhysics(device, options);
      world.ownsDevice = owned;
      if (world.scene && world.autoAttach) world.attachToScene();
      return world;
    } catch (error) {
      if (world) world.dispose();
      else if (owned) device.destroy();
      throw error;
    }
  }
  constructor(
    device,
    {
      scene,
      gravity = [0, -10, 0],
      timeStep = 1 / 60,
      iterations = 10,
      capacity = 4096,
      syncMeshes = true,
      maxSyncedBodies = 2048,
      broadphase = "auto",
      solverMode = "auto",
      bvh = {},
      autoAttach = true,
      maxContactPairs = 8192,
      maxContactEvents = 4096,
      sleeping = false,
    } = {},
  ) {
    this.device = device;
    this.scene = scene;
    this.autoAttach = autoAttach;
    this.syncEnabled = syncMeshes;
    this.maxSyncedBodies = maxSyncedBodies;
    if (
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      !Number.isInteger(maxSyncedBodies) ||
      maxSyncedBodies < 0
    )
      throw Error("capacity and maxSyncedBodies must be valid integer counts");
    this.capacity = capacity;
    this.collisionOptions = { broadphase, bvh, solverMode };
    this.ref = new Solver();
    this.ref.dt = positive(timeStep, "timeStep");
    if (!Number.isInteger(iterations) || iterations < 1)
      throw Error("iterations must be a positive integer");
    this.ref.iterations = iterations;
    this.aggregates = [];
    this.constraints = new Set();
    this.contactListeners = new Set();
    for (const [name, value] of Object.entries({
      maxContactPairs,
      maxContactEvents,
    }))
      if (!Number.isInteger(value) || value < 1)
        throw Error(`${name} must be a positive integer`);
    this.contactOptions = { maxContactPairs, maxContactEvents };
    this.bodyReadback = new BodyReadback(device);
    this.sleepOptions = sleeping;
    if (
      sleeping !== false &&
      sleeping !== true &&
      (typeof sleeping !== "object" || sleeping === null)
    )
      throw Error("sleeping must be a boolean or options object");
    this.commands = new Map();
    this.steps = 0;
    this.errors = [];
    this.deviceLost = null;
    const weakWorld = new WeakRef(this);
    device.lost.then((info) => {
      const world = weakWorld.deref();
      if (!world || world.disposed) return;
      world.deviceLost = { reason: info.reason, message: info.message };
      world.errors.push(`WebGPU device lost: ${info.message || info.reason}`);
      world.dispose();
    });
    this.setGravity(gravity);
    this.errorListener = (e) => this.errors.push(e.error.message);
    device.addEventListener("uncapturederror", this.errorListener);
    if (scene) sceneWorlds.set(scene, this);
  }
  setGravity(value) {
    const g = xyz(value);
    if (g.length !== 3 || !g.every(Number.isFinite))
      throw Error("gravity requires three finite components");
    const length = Math.hypot(...g);
    this.gravity = -length;
    this.up = length ? g.map((x) => -x / length) : [0, 1, 0];
    if (this.gpu) {
      this.gpu.params.gravity = this.gravity;
      this.gpu.params.up = this.up;
    }
    this.wakeAll();
  }
  get solverDecision() {
    this.initialize();
    return { ...this.gpu.solverDecision };
  }
  setSolverMode(mode) {
    this.initialize();
    const decision = this.gpu.setSolverMode(mode);
    this.collisionOptions.solverMode = mode;
    return { ...decision };
  }
  initialize() {
    this.assertAlive();
    if (this.gpu) return;
    if (
      this.syncEnabled &&
      this.aggregates.filter((a) => a.sync).length > this.maxSyncedBodies
    )
      throw Error(
        "For large scenes use syncMeshes:false and draw the GPU body buffer directly",
      );
    if (this.aggregates.length > this.capacity)
      throw Error(
        `Body capacity ${this.capacity} exceeded; size the world before initialization`,
      );
    this.gpu = new GpuSolver3D(
      this.device,
      this.ref,
      appGpuSolverOptions(this.ref, {
        bodyCapacity: Math.max(1, this.capacity),
        spatialSort: true,
        ...this.collisionOptions,
      }),
    );
    Object.assign(this.gpu.params, { gravity: this.gravity, up: this.up });
    this.gpu.externalBeforeStep = (encoder) => {
      this.sleepManager?.before(encoder);
      this.flushCommands(encoder);
    };
    this.gpu.externalAfterStep = (encoder) => this.sleepManager?.after(encoder);
    const byForce = new Map([...this.constraints].map((c) => [c.force, c]));
    const frames = [];
    let slot = 0;
    for (const force of this.ref.forces) {
      const c = byForce.get(force);
      if (c) {
        c.attach(slot++, false);
        if (c.type === "fixed" || (c.type === "spring" && c.rest === undefined))
          frames.push({ slot: c.slot, spring: c.type === "spring" });
      }
    }
    this.gpu.captureConstraintFrames(frames);
    this.byGpuIndex = new Map(
      this.aggregates.map((a) => [this.gpu.gpuIndex(a.index), a.body]),
    );
    for (const a of this.aggregates)
      if (a.disposed || a.group !== 0xffffffff || a.collidesWith !== 0xffffffff)
        this.gpu.setFilters(
          [this.gpu.gpuIndex(a.index)],
          [a.disposed ? 0 : a.group],
          [a.disposed ? 0 : a.collidesWith],
        );
    for (const a of this.aggregates)
      if (a.isTrigger) this.gpu.setSensor(a.body.gpuIndex, true);
    for (const a of this.aggregates)
      if (a.restitution > 0)
        this.gpu.setRestitution(a.body.gpuIndex, a.restitution);
    if (this.contactListeners.size) this.initializeContacts();
    if (this.sleepOptions)
      this.sleepManager = new WorldSleeping(
        this,
        this.sleepOptions === true ? {} : this.sleepOptions,
      );
  }
  addAggregate(mesh, type, options = {}) {
    return new AvbdPhysicsAggregate(mesh, type, options, this);
  }
  addAggregates(entries) {
    return entries.map(({ mesh, type, options }) =>
      this.addAggregate(mesh, type, options),
    );
  }
  addConstraint(bodyA, bodyB, options = {}) {
    return new AvbdPhysicsConstraint(this, bodyA, bodyB, options);
  }
  addJoint(bodyA, bodyB, options = {}) {
    return this.addConstraint(bodyA, bodyB, {
      ...options,
      type: options.type ?? "ball",
    });
  }
  addWeld(bodyA, bodyB, options = {}) {
    return this.addConstraint(bodyA, bodyB, { ...options, type: "fixed" });
  }
  addSpring(bodyA, bodyB, options = {}) {
    return this.addConstraint(bodyA, bodyB, { ...options, type: "spring" });
  }
  enableSleeping(options = {}) {
    this.assertAlive();
    this.sleepOptions = options;
    if (this.gpu && !this.sleepManager)
      this.sleepManager = new WorldSleeping(this, options);
    return this;
  }
  addMotor(bodyA, bodyB, options = {}) {
    return this.addConstraint(bodyA, bodyB, { ...options, type: "motor" });
  }
  addHinge(bodyA, bodyB, options = {}) {
    return new AvbdPhysicsHinge(this, bodyA, bodyB, options);
  }
  initializeContacts() {
    if (this.contactWatch) return;
    const { maxContactPairs, maxContactEvents } = this.contactOptions;
    this.contactWatch = new ContactWatch(
      this.device,
      this.gpu.bodyBuffer,
      this.capacity,
      maxContactPairs,
      maxContactEvents,
    );
    const active = this.aggregates.filter((a) => !a.disposed);
    this.contactWatch.setWatched(
      active.map((a) => a.body.gpuIndex),
      active.map(() => true),
    );
  }
  /** Optional GPU event passes; registering a listener is what enables them. */
  onContact(callback) {
    this.assertAlive();
    if (typeof callback !== "function")
      throw Error("A contact callback is required");
    this.contactListeners.add(callback);
    if (this.gpu) this.initializeContacts();
    return () => this.contactListeners.delete(callback);
  }
  async readContactEvents() {
    this.initialize();
    this.initializeContacts();
    if (this.contactPending) return this.contactPending;
    this.contactPending = this.contactWatch
      .read()
      .then((result) => ({
        ...result,
        events: result.events.map((e) => ({
          ...e,
          type: e.kind === BEGIN ? "begin" : "end",
          isTrigger: !!(
            this.byGpuIndex.get(e.a)?.aggregate.isTrigger ||
            this.byGpuIndex.get(e.b)?.aggregate.isTrigger
          ),
          a: this.byGpuIndex.get(e.a),
          b: this.byGpuIndex.get(e.b),
        })),
      }))
      .finally(() => (this.contactPending = null));
    return this.contactPending;
  }
  async raycast(origin, direction, options = {}) {
    const [hit] = await this.raycastAll(
      [{ origin, direction, maxDistance: options.maxDistance }],
      options,
    );
    return hit;
  }
  async sphereCast(origin, radius, direction, options = {}) {
    const [hit] = await this.sphereCastAll(
      [{ origin, radius, direction, maxDistance: options.maxDistance }],
      options,
    );
    return hit;
  }
  async sphereCastAll(
    casts,
    { ignore = [], collidesWith = 0xffffffff, includeTriggers = true } = {},
  ) {
    this.assertAlive();
    mask(collidesWith);
    this.initialize();
    this.flushCommands();
    for (const body of ignore)
      if (body.aggregate.world !== this || body.disposed)
        throw Error(
          "Ignored cast bodies must belong to this world and be alive",
        );
    const hits = await this.gpu.sphereCastAll(
      casts.map((c) => ({
        ...c,
        origin: xyz(c.origin),
        direction: xyz(c.direction),
      })),
      { ignore: ignore.map((b) => b.gpuIndex), collidesWith, includeTriggers },
    );
    return hits.map((hit) =>
      hit ? { ...hit, body: this.byGpuIndex.get(hit.index) ?? null } : null,
    );
  }
  async raycastAll(
    rays,
    { ignore = [], collidesWith = 0xffffffff, includeTriggers = true } = {},
  ) {
    mask(collidesWith);
    this.initialize();
    this.flushCommands();
    const checked = rays.map((r) => {
      const origin = xyz(r.origin),
        direction = xyz(r.direction);
      if (
        origin.length !== 3 ||
        direction.length !== 3 ||
        ![...origin, ...direction].every(Number.isFinite) ||
        !Math.hypot(...direction)
      )
        throw Error("A ray requires a finite origin and nonzero direction");
      if (r.maxDistance !== undefined)
        positive(r.maxDistance, "maxDistance", true);
      return { ...r, origin, direction };
    });
    for (const b of ignore)
      if (b.aggregate.world !== this)
        throw Error("Ignored ray bodies must belong to this world");
    const hits = await this.gpu.raycastAll(checked, {
      ignore: ignore.map((b) => b.gpuIndex),
      collidesWith,
      includeTriggers,
    });
    return hits.map((h) =>
      h ? { ...h, body: this.byGpuIndex.get(h.index) ?? null } : null,
    );
  }
  getRenderBinding(device = this.device) {
    this.initialize();
    if (device !== this.device)
      throw Error("Direct GPU rendering must share the physics GPUDevice");
    return {
      device,
      buffer: this.bodyBuffer,
      stride: 160,
      positionOffset: 0,
      rotationOffset: 16,
      sizeOffset: 64,
      count: this.gpu.bodyCount,
    };
  }
  wakeAll() {
    if (this.sleepManager) this.sleepManager.wakeRequested = true;
  }
  async readSleepStats() {
    this.initialize();
    return this.sleepManager
      ? this.sleepManager.readStats()
      : { sleeping: 0, wakeRequested: false };
  }
  assertAlive() {
    if (this.disposed) throw Error("AVBD world is disposed");
  }
  queue(body, mask, key, value) {
    this.assertAlive();
    body.assertAlive();
    const values = xyz(value);
    if (
      values.length !== (key === "rotation" ? 4 : 3) ||
      !values.every(Number.isFinite)
    )
      throw Error(
        `${key} requires ${key === "rotation" ? 4 : 3} finite components`,
      );
    let c = this.commands.get(body);
    if (!c) this.commands.set(body, (c = { mask: 0 }));
    c.mask |= mask;
    c[key] = values;
    this.wakeAll();
    return c;
  }
  flushCommands(encoder) {
    this.initialize();
    this.gpu.flushPropertyEdits(encoder);
    if (!this.commands.size) return;
    if (this.sleepManager?.wakeRequested) this.sleepManager.before(encoder);
    const count = this.commands.size;
    let onlyMask = 0;
    for (const c of this.commands.values()) onlyMask |= c.mask;
    if (onlyMask === 1 || onlyMask === 2) {
      if (!this.velocityIndices || this.velocityIndices.length < count) {
        const capacity = Math.max(
          count,
          (this.velocityIndices?.length ?? 0) * 2,
          64,
        );
        this.velocityIndices = new Uint32Array(capacity);
        this.velocityValues = new Float32Array(capacity * 3);
      }
      let i = 0;
      for (const [body, c] of this.commands) {
        this.velocityIndices[i] =
          body.aggregate.gpuSlot ?? this.gpu.gpuIndex(body.aggregate.index);
        this.velocityValues.set(
          onlyMask === 2 ? c.angular : c.velocity,
          i++ * 3,
        );
      }
      const name = onlyMask === 2 ? "angularVelocityBatch" : "velocityBatch";
      const batch = (this[name] ??= new VelocityBatch(
        this.gpu,
        3,
        onlyMask === 2 ? "angular" : "linear",
      ));
      batch.solver = this.gpu;
      batch.submitValidated(
        this.velocityIndices.subarray(0, count),
        this.velocityValues.subarray(0, count * 3),
        encoder,
      );
      this.lastCommandBatch = {
        bodies: count,
        path:
          onlyMask === 2 ? "packed-angular-velocities" : "packed-velocities",
        uploadedBytes: count * 16,
      };
      this.commands.clear();
      return;
    }
    let motionOnly = true;
    for (const c of this.commands.values())
      if ((c.mask & ~3) !== 0) {
        motionOnly = false;
        break;
      }
    if (motionOnly) {
      if (!this.motionData || this.motionData.length < count * 8) {
        this.motionData = new Uint32Array(
          Math.max(count * 8, (this.motionData?.length ?? 0) * 2, 512),
        );
        this.motionFloats = new Float32Array(this.motionData.buffer);
      }
      let i = 0;
      for (const [body, c] of this.commands) {
        const o = i++ * 8;
        this.motionData[o] =
          body.aggregate.gpuSlot ?? this.gpu.gpuIndex(body.aggregate.index);
        this.motionData[o + 1] = c.mask;
        if (c.velocity) this.motionFloats.set(c.velocity, o + 2);
        if (c.angular) this.motionFloats.set(c.angular, o + 5);
      }
      this.motionBatch ??= new MotionBatch(this.gpu, 3);
      this.motionBatch.submitValidated(
        this.motionData.subarray(0, count * 8),
        encoder,
      );
      this.lastCommandBatch = {
        bodies: count,
        path: "packed-motion",
        uploadedBytes: count * 32,
      };
      this.commands.clear();
      return;
    }
    const byteLength = count * 128;
    const limit = Math.min(
      this.device.limits.maxStorageBufferBindingSize,
      this.device.limits.maxBufferSize,
    );
    if (byteLength > limit)
      throw Error("Body command batch exceeds GPU buffer limits");
    if (!this.commandData || this.commandData.byteLength < byteLength)
      this.commandData = new ArrayBuffer(
        Math.min(
          limit,
          Math.max(byteLength, (this.commandData?.byteLength ?? 0) * 2, 128),
        ),
      );
    const bytes = this.commandData,
      f = new Float32Array(bytes),
      u = new Uint32Array(bytes);
    f.fill(0, 0, count * 32);
    let index = 0;
    for (const [body, c] of this.commands) {
      const o = index++ * 32;
      u[o] = body.aggregate.gpuSlot ?? this.gpu.gpuIndex(body.aggregate.index);
      u[o + 1] = c.mask;
      for (const [key, offset] of [
        ["velocity", 4],
        ["angular", 8],
        ["impulse", 12],
        ["torque", 16],
        ["position", 20],
        ["rotation", 24],
        ["pointImpulse", 28],
      ])
        if (c[key]) f.set(c[key], o + offset);
    }
    this.commands.clear();
    if (!this.commandBuffer || this.commandBuffer.size < byteLength) {
      this.commandBuffer?.destroy();
      this.commandBuffer = this.device.createBuffer({
        size: Math.min(limit, Math.max(byteLength * 2, 128)),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
    }
    this.device.queue.writeBuffer(this.commandBuffer, 0, bytes, 0, byteLength);
    this.commandPipeline ??= this.device.createComputePipeline({
      layout: "auto",
      compute: {
        module: this.device.createShaderModule({
          code: `const DISPATCH_STRIDE = ${this.device.limits.maxComputeWorkgroupsPerDimension * 64}u;\n${commandShader}`,
          label: "AVBD body commands",
        }),
        entryPoint: "applyCommands",
      },
    });
    if (
      !this.commandBinding ||
      this.boundCommandBody !== this.gpu.bodyBuffer ||
      this.boundCommandBuffer !== this.commandBuffer ||
      this.boundCommandBytes !== byteLength
    ) {
      this.commandBinding = this.device.createBindGroup({
        layout: this.commandPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.gpu.bodyBuffer } },
          {
            binding: 1,
            resource: { buffer: this.commandBuffer, size: byteLength },
          },
        ],
      });
      this.boundCommandBody = this.gpu.bodyBuffer;
      this.boundCommandBuffer = this.commandBuffer;
      this.boundCommandBytes = byteLength;
    }
    const e = encoder ?? this.device.createCommandEncoder(),
      pass = e.beginComputePass();
    pass.setPipeline(this.commandPipeline);
    pass.setBindGroup(0, this.commandBinding);
    const groups = Math.ceil(index / 64),
      max = this.device.limits.maxComputeWorkgroupsPerDimension;
    pass.dispatchWorkgroups(Math.min(groups, max), Math.ceil(groups / max));
    pass.end();
    if (!encoder) this.device.queue.submit([e.finish()]);
    this.lastCommandBatch = {
      bodies: count,
      path: "aggregate-commands",
      uploadedBytes: byteLength,
    };
  }
  /** Fixed dt; callers choose step count. Normal stepping never waits for the GPU. */
  step() {
    this.initialize();
    this.gpu.step();
    this.steps++;
    if (this.contactWatch) {
      this.contactWatch.run(
        this.gpu.contactStorage,
        this.gpu.manifoldCapacity,
        this.steps,
        this.ref.dt,
      );
      if (this.contactListeners.size && !this.contactPending)
        this.readContactEvents()
          .then(({ events, dropped, full }) => {
            if (this.disposed) return;
            if (dropped || full)
              this.errors.push(
                `Contact event storage full: ${dropped} events dropped; increase maxContactEvents/maxContactPairs`,
              );
            for (const event of events)
              for (const callback of this.contactListeners) callback(event);
          })
          .catch((e) => {
            if (!this.disposed) this.errors.push(e.message);
          });
    }
    // Small optional pose mirrors support Babylon's WebGL renderer. Never await them here.
    if (this.syncEnabled && !this.syncPending)
      this.syncMeshes().catch((e) => this.errors.push(e.message));
    if (this.steps % 20 === 0 && !this.counterPending) {
      this.counterPending = true;
      this.gpu
        .readCounters()
        .then((c) => {
          if (!this.disposed) {
            this.counters = c;
            this.gpu.adapt(c);
            if (c.overflow || c.clashes)
              this.errors.push(
                `Collision capacity/color conflict: ${JSON.stringify(c)}`,
              );
          }
        })
        .catch((e) => {
          if (!this.disposed) this.errors.push(e.message);
        })
        .finally(() => (this.counterPending = false));
    }
  }
  async syncMeshes() {
    this.initialize();
    this.flushCommands();
    if (this.syncPending) return this.syncPending;
    const mirrors = this.aggregates.filter((a) => a.sync && !a.disposed);
    this.syncPending = this.bodyReadback
      .read(
        this.bodyBuffer,
        mirrors.map((a) => a.body.gpuIndex),
        true,
      )
      .then((poses) => {
        if (this.disposed) return;
        for (let i = 0; i < mirrors.length; i++)
          if (!mirrors[i].disposed) mirrors[i].syncPose(poses, i * 8);
        this.lastSyncBytes = poses.byteLength;
      })
      .finally(() => (this.syncPending = null));
    return this.syncPending;
  }
  get bodyBuffer() {
    this.initialize();
    return this.gpu.bodyBuffer;
  }
  async readBodies(bodies) {
    this.initialize();
    this.flushCommands();
    if (bodies) {
      for (const b of bodies)
        if (b.aggregate.world !== this)
          throw Error("Selected bodies must belong to this world");
      return this.bodyReadback.read(
        this.bodyBuffer,
        bodies.map((b) => b.gpuIndex),
      );
    }
    return this.gpu.readBodies();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.observer && this.scene?.onBeforeRenderObservable.remove(this.observer);
    this.disposeObserver &&
      this.scene?.onDisposeObservable.remove(this.disposeObserver);
    if (this.scene && sceneWorlds.get(this.scene) === this)
      sceneWorlds.delete(this.scene);
    this.device.removeEventListener("uncapturederror", this.errorListener);
    this.gpu?.destroy();
    this.contactWatch?.destroy();
    this.sleepManager?.dispose();
    this.commandBuffer?.destroy();
    this.velocityBatch?.destroy();
    this.angularVelocityBatch?.destroy();
    this.motionBatch?.destroy();
    this.bodyReadback.destroy();
    this.commandData = this.velocityIndices = this.velocityValues = null;
    this.commandBinding = null;
    for (const a of this.aggregates) {
      a.disposed = true;
      a.body.disposed = true;
    }
    this.commands.clear();
    this.contactListeners.clear();
    for (const c of this.constraints) c.disposed = true;
    this.constraints.clear();
    if (this.ownsDevice) this.device.destroy();
  }
  /** Fixed-step scene integration, with bounded catch-up and no awaited readbacks. */
  attachToScene(scene = this.scene) {
    this.assertAlive();
    if (!scene) throw Error("A Babylon scene is required");
    if (this.observer && scene === this.scene) return this;
    if (this.observer)
      throw Error("AVBD world is already attached to another scene");
    this.scene = scene;
    this.disposeObserver = scene.onDisposeObservable.addOnce(() =>
      this.dispose(),
    );
    let accumulator = 0;
    this.observer = scene.onBeforeRenderObservable.add(() => {
      accumulator += Math.min(0.05, scene.getEngine().getDeltaTime() / 1000);
      for (let count = 0; accumulator >= this.ref.dt && count < 3; count++) {
        this.step();
        accumulator -= this.ref.dt;
      }
    });
    return this;
  }
}

export class AvbdPhysicsAggregate {
  constructor(
    mesh,
    type,
    {
      mass = 1,
      friction = 0.6,
      restitution = 0,
      allowSleep,
      isTrigger = false,
      sync = true,
      group = 0xffffffff,
      collidesWith = 0xffffffff,
    } = {},
    world,
  ) {
    world =
      world instanceof AvbdPhysics
        ? world
        : sceneWorlds.get(world ?? mesh.getScene());
    if (!world)
      throw Error(
        "Create an AVBD world for this scene before adding aggregates",
      );
    world.assertAlive();
    if (typeof type === "number")
      type = [
        AvbdShapeType.SPHERE,
        AvbdShapeType.CAPSULE,
        AvbdShapeType.CYLINDER,
        AvbdShapeType.BOX,
        AvbdShapeType.CONVEX_HULL,
      ][type];
    positive(mass, "mass", true);
    positive(friction, "friction", true);
    if (!Number.isFinite(restitution) || restitution < 0 || restitution > 1)
      throw Error("restitution must be between 0 and 1");
    if (mesh.parent)
      throw Error(
        "AVBD aggregate meshes must have no parent; bake the parent transform first",
      );
    if (!Object.values(AvbdShapeType).includes(type))
      throw Error(`Unsupported AVBD shape: ${type}`);
    if (world.aggregates.length >= world.capacity)
      throw Error("AVBD body capacity exceeded");
    this.world = world;
    this.mesh = mesh;
    this.sync = sync;
    this.type = type;
    if (allowSleep !== undefined && typeof allowSleep !== "boolean")
      throw Error("allowSleep must be a boolean");
    this.allowSleep = allowSleep ?? true;
    if (typeof isTrigger !== "boolean")
      throw Error("isTrigger must be a boolean");
    this.isTrigger = isTrigger;
    this.restitution = restitution;
    if (allowSleep === true && !world.sleepOptions) world.enableSleeping();
    this.group = mask(group);
    this.collidesWith = mask(collidesWith);
    if (
      world.gpu &&
      world.syncEnabled &&
      sync &&
      world.aggregates.filter((a) => a.sync && !a.disposed).length >=
        world.maxSyncedBodies
    )
      throw Error(
        "For large scenes use syncMeshes:false and draw the GPU body buffer directly",
      );
    if (
      ![
        AvbdShapeType.BOX,
        AvbdShapeType.SPHERE,
        AvbdShapeType.CAPSULE,
      ].includes(type) &&
      world.device.limits.maxStorageBuffersPerShaderStage < 9
    )
      throw Error(
        "Convex hull collisions require nine storage buffer bindings",
      );
    mesh.computeWorldMatrix(true);
    mesh.refreshBoundingInfo();
    const bounds = mesh.getBoundingInfo().boundingBox,
      scale = mesh.scaling;
    if ([scale.x, scale.y, scale.z].some((x) => x <= 0))
      throw Error(
        "Bake negative or zero mesh scaling before creating an aggregate",
      );
    const size = bounds.maximum.subtract(bounds.minimum).multiply(scale),
      center = bounds.center.multiply(scale);
    const rotation =
      mesh.rotationQuaternion?.clone() || mesh.rotation.toQuaternion();
    this.localCenter = center;
    this.localRotation = rotation.constructor.Identity();
    let rigid;
    if (type === AvbdShapeType.BOX)
      rigid = new Rigid(world.ref, xyz(size), 1, friction, [0, 0, 0]);
    else if (type === AvbdShapeType.SPHERE) {
      if (
        Math.max(size.x, size.y, size.z) - Math.min(size.x, size.y, size.z) >
        1e-4
      )
        throw Error("Sphere aggregate requires uniform dimensions");
      rigid = sphere(world.ref, size.x / 2, 1, friction, [0, 0, 0]);
    } else if (type === AvbdShapeType.CAPSULE) {
      if (Math.abs(size.x - size.z) > 1e-4)
        throw Error(
          "Capsule aggregate requires equal X and Z diameters; bake an upright Y-axis capsule mesh",
        );
      rigid = capsule(world.ref, size.x / 2, size.y, 1, friction, [0, 0, 0]);
    } else {
      const positions = mesh.getVerticesData("position");
      if (!positions) throw Error("Hull aggregate requires mesh positions");
      const points = Float32Array.from(
        positions,
        (v, i) => v * [scale.x, scale.y, scale.z][i % 3],
      );
      const shape = convexHull(points);
      if (!shape)
        throw Error(
          "Hull aggregate requires a closed shape with nonzero volume",
        );
      this.localCenter = new mesh.position.constructor(...shape.center);
      this.localRotation = rotation.constructor.FromArray(shape.rotation);
      rigid = hull(world.ref, shape, 1, friction, [0, 0, 0]);
    }
    const ratio = mass / rigid.mass;
    rigid.mass = mass;
    rigid.moment.forEach((v, i) => (rigid.moment[i] = v * ratio));
    const position = mesh.position.add(
      this.localCenter.applyRotationQuaternion(rotation),
    );
    rigid.positionLin.set(xyz(position));
    rigid.positionAng.set(rotation.multiply(this.localRotation).asArray());
    this.rigid = rigid;
    this.index = world.aggregates.length;
    this.body = new AvbdPhysicsBody(this);
    world.aggregates.push(this);
    mesh.rotationQuaternion = rotation;
    if (world.gpu) {
      this.gpuSlot = world.gpu.addBody(rigid);
      if (this.gpuSlot < 0) throw Error("AVBD body capacity exceeded");
      world.byGpuIndex.set(this.gpuSlot, this.body);
      world.gpu.setFilters([this.gpuSlot], [this.group], [this.collidesWith]);
      if (this.isTrigger || world.gpu.sensorsEnabled)
        world.gpu.setSensor(this.gpuSlot, this.isTrigger);
      if (this.restitution > 0)
        world.gpu.setRestitution(this.gpuSlot, this.restitution);
      world.contactWatch?.setWatched([this.gpuSlot], [true]);
      world.sleepManager?.register(this.gpuSlot, rigid.mass, this.allowSleep);
      world.wakeAll?.();
    }
  }
  syncPose(poses, offset) {
    const o = offset ?? this.body.gpuIndex * 40;
    const q = this.localRotation.constructor
      .FromArray(poses, o + 4)
      .multiply(this.localRotation.conjugate());
    this.mesh.rotationQuaternion.copyFrom(q);
    this.mesh.position.copyFrom(
      new this.mesh.position.constructor(...poses.subarray(o, o + 3)).subtract(
        this.localCenter.applyRotationQuaternion(q),
      ),
    );
  }
  /** Release collision participation without shifting any live GPU index. The mesh is caller-owned. */
  dispose() {
    if (this.disposed) return;
    const world = this.world;
    for (const c of [...world.constraints])
      if (c.bodyA === this.body || c.bodyB === this.body) c.dispose();
    if (world.gpu) {
      const index = this.body.gpuIndex;
      world.queue(this.body, 16, "velocity", [0, 0, 0]);
      world.gpu.setFilters([index], [0], [0]);
      world.gpu.setRestitution(index, 0);
    }
    this.rigid.mass = 0;
    this.rigid.moment.fill(0);
    this.sync = false;
    this.disposed = this.body.disposed = true;
    world.sleepManager?.register(
      this.gpuSlot ?? world.gpu?.gpuIndex(this.index) ?? this.index,
      0,
    );
    world.wakeAll?.();
  }
}

export class AvbdPhysicsBody {
  constructor(aggregate) {
    this.aggregate = aggregate;
  }
  assertAlive() {
    if (this.disposed || this.aggregate.disposed)
      throw Error("AVBD body is disposed");
  }
  get gpuIndex() {
    this.assertAlive();
    const w = this.aggregate.world;
    w.initialize();
    return this.aggregate.gpuSlot ?? w.gpu.gpuIndex(this.aggregate.index);
  }
  setLinearVelocity(value) {
    this.aggregate.world.queue(this, 1, "velocity", value);
    return this;
  }
  setAngularVelocity(value) {
    this.aggregate.world.queue(this, 2, "angular", value);
    return this;
  }
  applyImpulse(impulse, worldPoint) {
    const point = worldPoint ? xyz(worldPoint) : null;
    if (point && (point.length !== 3 || !point.every(Number.isFinite)))
      throw Error("Impulse point requires three finite components");
    const w = this.aggregate.world,
      v = xyz(impulse),
      existing = w.commands.get(this),
      sum = v.map((x, i) => x + (existing?.impulse?.[i] || 0));
    const c = w.queue(this, 4, "impulse", sum);
    if (worldPoint) {
      const t = [
        point[1] * v[2] - point[2] * v[1],
        point[2] * v[0] - point[0] * v[2],
        point[0] * v[1] - point[1] * v[0],
      ];
      const old = c.torque || [0, 0, 0];
      c.torque = xyz(t).map((x, i) => x + old[i]);
      c.pointImpulse = v.map((x, i) => x + (c.pointImpulse?.[i] || 0));
    }
    return this;
  }
  applyAngularImpulse(value) {
    const w = this.aggregate.world,
      old = w.commands.get(this)?.torque || [0, 0, 0];
    w.queue(
      this,
      4,
      "torque",
      xyz(value).map((x, i) => x + old[i]),
    );
    return this;
  }
  applyForce(force, worldPoint) {
    return this.applyImpulse(
      xyz(force).map((x) => x * this.aggregate.world.ref.dt),
      worldPoint,
    );
  }
  applyTorque(torque) {
    return this.applyAngularImpulse(
      xyz(torque).map((x) => x * this.aggregate.world.ref.dt),
    );
  }
  setCollisionGroups(group, collidesWith = 0xffffffff) {
    this.assertAlive();
    const a = this.aggregate,
      g = mask(group),
      m = mask(collidesWith);
    a.group = g;
    a.collidesWith = m;
    if (a.world.gpu)
      a.world.gpu.setFilters([this.gpuIndex], [a.group], [a.collidesWith]);
    a.world.wakeAll?.();
    return this;
  }
  setTrigger(enabled) {
    this.assertAlive();
    if (typeof enabled !== "boolean")
      throw Error("isTrigger must be a boolean");
    const a = this.aggregate;
    a.isTrigger = enabled;
    if (a.world.gpu) a.world.gpu.setSensor(this.gpuIndex, enabled);
    a.world.wakeAll();
    return this;
  }
  setRestitution(value) {
    this.assertAlive();
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw Error("restitution must be between 0 and 1");
    const a = this.aggregate;
    a.restitution = value;
    if (a.world.gpu) a.world.gpu.setRestitution(this.gpuIndex, value);
    a.world.wakeAll();
    return this;
  }
  async readState() {
    const p = await this.aggregate.world.readBodies([this]);
    const mass = this.aggregate.rigid.mass;
    return {
      position: Array.from(p.subarray(0, 3)),
      rotation: Array.from(p.subarray(4, 8)),
      linearVelocity: Array.from(p.subarray(32, 35)),
      angularVelocity: Array.from(p.subarray(36, 39)),
      mass,
      effectiveMass: p[19],
      sleeping: mass > 0 && p[19] === 0,
    };
  }
  wakeUp() {
    this.assertAlive();
    this.aggregate.world.wakeAll();
    return this;
  }
  setSleepEnabled(enabled) {
    this.assertAlive();
    if (typeof enabled !== "boolean")
      throw Error("Sleep eligibility must be a boolean");
    const a = this.aggregate,
      w = a.world;
    a.allowSleep = enabled;
    if (enabled && !w.sleepOptions) w.enableSleeping();
    if (w.gpu) w.sleepManager?.register(this.gpuIndex, a.rigid.mass, enabled);
    w.wakeAll();
    return this;
  }
  teleport(position, rotation = this.aggregate.mesh.rotationQuaternion) {
    const q = rotation.clone().normalize(),
      a = this.aggregate;
    a.world.queue(
      this,
      8,
      "position",
      xyz(position.add(a.localCenter.applyRotationQuaternion(q))),
    );
    a.world.queue(this, 8, "rotation", q.multiply(a.localRotation).asArray());
    return this;
  }
}
