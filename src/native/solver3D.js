import { AppGpuSolver3D } from "../gpu/appGpuSolver3D.js";
import { BodyCommands2D } from "../gpu/bodyCommands2D.js";
import shader from "./bodyCommands3D.wgsl";
import { BodyReadback } from "../gpu/bodyReadback.js";
import { ContactWatch, BEGIN } from "../vendor/three-avbd-lib/contacts.ts";
import {
  attachToScene,
  detachFromScene,
  components,
  installNativeRuntime,
} from "./runtime.js";
// Reuse the 2D command uploader and persistent buffers with a 3D kernel.
class BodyCommands3D extends BodyCommands2D {
  constructor(solver) {
    super(solver, shader, 3);
  }
  encodeAfterEdits(e, count) {
    if (!this.hasTeleports) return;
    const s = this.solver,
      d = s.device;
    if (!this.invalidate) {
      const module = d.createShaderModule({
        code: `const DISPATCH_STRIDE = ${d.limits.maxComputeWorkgroupsPerDimension * 64}u;\n${shader}`,
      });
      this.invalidate = d.createComputePipeline({
        layout: "auto",
        compute: { module, entryPoint: "invalidate" },
      });
      this.clearMarkers = d.createComputePipeline({
        layout: "auto",
        compute: { module, entryPoint: "clearMarkers" },
      });
    }
    if (
      this.invalidateBody !== s.bodyBuffer ||
      this.invalidateManifolds !== s.contactStorage.manifolds
    ) {
      this.invalidateGroup = d.createBindGroup({
        layout: this.invalidate.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: s.bodyBuffer } },
          { binding: 3, resource: { buffer: s.contactStorage.manifolds } },
        ],
      });
      this.invalidateBody = s.bodyBuffer;
      this.invalidateManifolds = s.contactStorage.manifolds;
    }
    let p = e.beginComputePass();
    p.setPipeline(this.invalidate);
    p.setBindGroup(0, this.invalidateGroup);
    const groups = Math.ceil(s.manifoldCapacity / 64),
      max = d.limits.maxComputeWorkgroupsPerDimension;
    // The invalidation shader uses a 2D dispatch for large contact capacities.
    p.dispatchWorkgroups(Math.min(groups, max), Math.ceil(groups / max));
    p.end();
    if (
      this.markerBody !== s.bodyBuffer ||
      this.markerCommands !== this.commands ||
      this.markerRanges !== this.ranges ||
      this.markerBytes !== count * 8
    ) {
      this.markerGroup = d.createBindGroup({
        layout: this.clearMarkers.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: s.bodyBuffer } },
          { binding: 1, resource: { buffer: this.commands } },
          { binding: 2, resource: { buffer: this.ranges, size: count * 8 } },
        ],
      });
      this.markerBody = s.bodyBuffer;
      this.markerCommands = this.commands;
      this.markerRanges = this.ranges;
      this.markerBytes = count * 8;
    }
    p = e.beginComputePass();
    p.setPipeline(this.clearMarkers);
    p.setBindGroup(0, this.markerGroup);
    const clearGroups = Math.ceil(count / 64);
    p.dispatchWorkgroups(
      Math.min(clearGroups, max),
      Math.ceil(clearGroups / max),
    );
    p.end();
  }
}

/** Native conveniences are lazy: no edit or event buffers until requested. */
export class NativeGpuSolver3D extends AppGpuSolver3D {
  constructor(device, ref, options) {
    super(device, ref, options);
    this.nativeRef = ref;
    installNativeRuntime(this, { bodies: ref.bodies }, 3);
  }
  rigidAt(index) {
    if (!this.nativeBodies) {
      this.nativeBodies = [];
      this.nativeRef.bodies.forEach(
        (b, i) => (this.nativeBodies[this.gpuIndex(i)] = b),
      );
    }
    return this.nativeBodies[index];
  }
  rewriteBodies(indices, bodies) {
    super.rewriteBodies(indices, bodies);
    if (this.nativeBodies)
      for (let i = 0; i < indices.length; i++)
        this.nativeBodies[indices[i]] = bodies[i];
  }
  liveIndex(index) {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    if (!Number.isInteger(index) || index < 0 || index >= this.bodyCount)
      throw Error("A live 3D GPU body index is required");
  }
  queueBodyCommand(index, kind, value, point, hasPoint = false) {
    this.liveIndex(index);
    this.prepareBodyCommands();
    this.bodyCommands.enqueue(index, kind, value, point, hasPoint);
    return this;
  }
  prepareBodyCommands() {
    this.wakeAll();
    return (this.bodyCommands ??= new BodyCommands3D(this));
  }
  setLinearVelocity(index, v) {
    return this.queueBodyCommand(index, 0, components(v, 3, "velocity"));
  }
  setAngularVelocity(index, v) {
    return this.queueBodyCommand(
      index,
      1,
      components(v, 3, "angular velocity"),
    );
  }
  applyImpulse(index, v, point) {
    return this.queueBodyCommand(
      index,
      2,
      components(v, 3, "impulse"),
      point === undefined ? undefined : components(point, 3, "point"),
      point !== undefined,
    );
  }
  applyForce(index, v, point) {
    return this.queueBodyCommand(
      index,
      3,
      [...components(v, 3, "force"), this.params.dt],
      point === undefined ? undefined : components(point, 3, "point"),
      point !== undefined,
    );
  }
  applyAngularImpulse(index, v) {
    return this.queueBodyCommand(index, 5, components(v, 3, "angular impulse"));
  }
  applyTorque(index, v) {
    return this.queueBodyCommand(index, 6, [
      ...components(v, 3, "torque"),
      this.params.dt,
    ]);
  }
  teleport(index, position, rotation) {
    const p = components(position, 3, "position");
    let q;
    if (rotation !== undefined) {
      q = components(rotation, 4, "rotation");
      const l = Math.hypot(...q);
      if (!l) throw Error("rotation must be nonzero");
      q = q.map((v) => v / l);
    }
    return this.queueBodyCommand(index, 4, p, q, q !== undefined);
  }
  flushEdits() {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    this.flushPropertyEdits();
    if (this.sleeping?.wakeRequested) this.sleeping.before();
    this.bodyCommands?.flush();
  }
  readBodies() {
    this.flushEdits();
    return super.readBodies();
  }
  readSelectedBodies(indices, { posesOnly = false } = {}) {
    const selected =
      indices instanceof Uint32Array ? indices : Array.from(indices);
    selected.forEach((i) => this.liveIndex(i));
    this.flushEdits();
    this.bodyReadback ??= new BodyReadback(this.device);
    return this.bodyReadback.read(this.bodyBuffer, selected, posesOnly);
  }
  async readBodyState(index) {
    const p = await this.readSelectedBodies([index]),
      mass = this.rigidAt(index)?.mass ?? p[19];
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
  raycastAll(...args) {
    this.flushEdits();
    return super.raycastAll(...args);
  }
  sphereCastAll(...args) {
    this.flushEdits();
    return super.sphereCastAll(...args);
  }
  watchContacts({ maxPairs = 8192, maxEvents = 4096, indices } = {}) {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    if (indices !== undefined) {
      if (!Array.isArray(indices))
        throw Error("Watched indices must be an array");
      indices.forEach((i) => this.liveIndex(i));
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
      );
      if (indices === undefined)
        indices = Array.from({ length: this.bodyCount }, (_, i) => i);
    }
    if (indices !== undefined) {
      const selected = new Set(indices);
      this.contactWatch.setWatched(
        Array.from({ length: this.bodyCount }, (_, i) => i),
        Array.from({ length: this.bodyCount }, (_, i) => selected.has(i)),
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
  setSensor(index, enabled) {
    super.setSensor(index, enabled);
    this.triggers ??= new Set();
    if (enabled) this.triggers.add(index);
    else this.triggers.delete(index);
  }
  setSleepEnabled(index, enabled) {
    this.liveIndex(index);
    if (typeof enabled !== "boolean") throw Error("Sleep flag must be boolean");
    const b = this.rigidAt(index);
    if (!b) throw Error("Sleep eligibility requires a scene body");
    b.allowSleep = enabled;
    if (enabled && !this.sleeping) this.enableSleeping();
    this.sleeping?.register(index, b.mass, enabled);
    this.wakeAll();
    return this;
  }
  enableSleeping(refOrOptions = {}, options = {}) {
    const ref = refOrOptions.bodies ? refOrOptions : this.nativeRef;
    super.enableSleeping(ref, refOrOptions.bodies ? options : refOrOptions);
    return this;
  }
  disableSleeping() {
    this.flushEdits();
    if (this.sleeping) {
      this.sleeping.wakeRequested = true;
      this.sleeping.before();
      this.sleeping.dispose();
      this.sleeping = null;
    }
    return this;
  }
  attachToScene(scene, options) {
    return attachToScene.call(this, scene, options);
  }
  detachFromScene() {
    return detachFromScene.call(this);
  }
  step() {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    super.step();
    this.contactWatch?.run(
      this.contactStorage,
      this.manifoldCapacity,
      this.stepCount,
      this.params.dt,
    );
  }
  destroy() {
    if (this.destroyed) return;
    this.detachFromScene();
    this.bodyCommands?.destroy();
    this.contactWatch?.destroy();
    super.destroy();
    this.destroyed = true;
  }
}
