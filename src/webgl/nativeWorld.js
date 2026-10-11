import { NativeCpuSolver } from "../native/cpu/world.js";
import { GlWorld2D } from "./world2D.js";
import { GlWorld3D } from "./world3D.js";
import { GlTextureEdits } from "./textureEdits.js";
import { sceneRecords } from "./sceneRecords.js";
import math from "./generatedMath.js";
import { cpuCast } from "../native/cpu/queries.js";
import { GlBodyReadback } from "./bodyReadback.js";
import { GlConstraintFrames } from "./constraintFrames.js";
import { GlCounters } from "./counters.js";

/** Shared native commands and static scene metadata, with all collision and
 * AVBD steps executed by WebGL2. The inherited CPU solver is never stepped. */
export class NativeGlSolver extends NativeCpuSolver {
  constructor(compute, scene, dimension, options = {}) {
    super(scene, dimension, {});
    this.backend = "webgl2";
    this.compute = compute;
    this.options = options;
    this.propertyQueue = new Map();
    this.patcher = new GlTextureEdits(compute);
    try {
      this.createWorld();
      this.validateInitialCapacity();
      if (this.requestedSleep || options.sleeping)
        this.enableSleeping(
          options.sleeping === true
            ? {}
            : (options.sleeping ?? this.requestedSleep),
        );
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  validateInitialCapacity() {
    for (let attempt = 0; attempt < 8; attempt++) {
      const world = this.glWorld;
      world.prepareCandidates();
      world.coloring.dispatch(
        world.inputs.filters,
        world.narrowphase.outputs[3],
      );
      const [problems] = this.compute.readInitialStatus(
        world.coloring.validation,
      );
      if (!problems) return;
      if (problems & 4)
        this.options.neighborCapacity = world.broadphase.neighborCapacity * 2;
      if (problems & 3 && !(problems & 4)) {
        this.options.colorCap = 64;
        this.options.colorRounds = Math.min(
          1024,
          (this.options.colorRounds ?? 64) * 2,
        );
      }
      if (attempt === 7)
        throw Error(
          "WebGL2 could not allocate collision storage and independent solve groups for this scene. Use WebGPU.",
        );
      world.destroy();
      this.glWorld = null;
      this.createWorld();
    }
  }
  createWorld() {
    const dimension = this.dimension,
      records = sceneRecords(this),
      sources = math[dimension];
    const radii = Array.from(
      this.dimension === 2 ? { length: this.bodyCount } : this.solver.bodies,
      (_, i) =>
        dimension === 2
          ? Math.hypot(
              records.bodies[i * 24 + 20],
              records.bodies[i * 24 + 21],
            ) * 0.5
          : records.bodies[i * 40 + 23],
    )
      .filter((r, i) => records.filters[i * 4 + 2] && r > 0)
      .sort((a, b) => a - b);
    const cellSize =
      this.options.cellSize ??
      Math.max(0.01, 2 * (radii[Math.floor(radii.length / 2)] ?? 1));
    const kinds = new Set(
      Array.from({ length: this.bodyCount }, (_, i) =>
        dimension === 2
          ? records.geometry[i * 4]
          : records.bodies[i * 40 + 39] >= 3
            ? 3
            : records.bodies[i * 40 + 39],
      ),
    );
    const enabled =
      dimension === 2
        ? kinds.size === 1 && kinds.has(0)
          ? ["box"]
          : Object.keys(sources.contact)
        : [
            ...(kinds.has(0) ? ["box"] : []),
            ...(kinds.has(1) ? ["spheres"] : []),
            ...(kinds.has(0) && kinds.has(1) ? ["spherebox"] : []),
            ...(kinds.has(-1) ? ["caps"] : []),
            ...(kinds.has(-1) && kinds.has(1) ? ["capsphere"] : []),
            ...(kinds.has(-1) && kinds.has(0) ? ["capbox"] : []),
            ...(kinds.has(3) ? ["poly"] : []),
            ...(kinds.has(3) && kinds.has(1) ? ["spherepoly"] : []),
            ...(kinds.has(3) && kinds.has(-1) ? ["cappoly"] : []),
          ];
    const contactMath = Object.fromEntries(
      enabled.map((name) => [name, sources.contact[name]]),
    );
    const neighbors =
      Math.ceil((this.options.neighborCapacity ?? 30) / 15) * 15;
    const estimatedBytes =
      this.bodyCount *
      neighbors *
      (dimension === 3 ? 2048 : 512 + (contactMath.axes ? 2112 : 0));
    const budget = this.options.maxTextureBytes ?? 2 * 1024 ** 3;
    if (!Number.isFinite(budget) || budget <= 0)
      throw Error("maxTextureBytes must be positive and finite");
    if (estimatedBytes > budget)
      throw Error(
        `WebGL2 contact textures need approximately ${(estimatedBytes / 1024 ** 3).toFixed(2)} GiB, above the ${(budget / 1024 ** 3).toFixed(2)} GiB budget. Use WebGPU for this scene, or increase maxTextureBytes only if the device has enough memory.`,
      );
    this.glWorld = (dimension === 2 ? GlWorld2D : GlWorld3D).create(
      this.compute,
      {
        ...records,
        params: { ...this.params },
        contactMath,
        solveMath: this.scene.points
          ? (sources.cloth ?? sources.solve)
          : sources.solve,
        editMath: dimension === 2 ? sources.edits : undefined,
        cellSize,
        neighborCapacity: this.options.neighborCapacity ?? 30,
        colorCap:
          this.options.colorCap ?? Math.min(32, Math.max(1, this.bodyCount)),
        colorRounds: this.options.colorRounds ?? 64,
        conservativeGraph: true,
      },
    );
    this.params = this.glWorld.params;
    this.filterRecords = records.filters;
    if (dimension === 3) this.glWorld.prepareEdits(sources.edits);
    else this.solver.params = this.params;
    for (let i = 0; i < this.bodyCount; i++) {
      const value =
        dimension === 3
          ? this.solver.bodies[i].restitution
          : this.solver.restitution.get(i);
      if (value)
        this.glWorld.prepareRestitution(sources.restitution).set(i, value);
    }
  }
  queue(name, index, component, value) {
    let list = this.propertyQueue.get(name);
    if (!list) this.propertyQueue.set(name, (list = []));
    list.push([index, component, value]);
  }
  flushProperties() {
    for (const [name, entries] of this.propertyQueue) {
      const w = this.glWorld;
      this.patcher.patch(w.inputs[name], w.spare[name], entries);
      [w.inputs[name], w.spare[name]] = [w.spare[name], w.inputs[name]];
    }
    this.propertyQueue.clear();
  }
  flushEdits() {
    this.assertLive();
    this.flushProperties();
    if (this.pending.count) {
      this.glWorld.applyCommands(this.pending);
      this.pending.count = 0;
    }
    return this;
  }
  profileNextStep(callback) {
    if (typeof callback !== "function")
      throw Error("Timing callback must be a function");
    this.glWorld.nextProfile = callback;
  }
  step() {
    this.flushEdits();
    this.glWorld.step();
    this.stepCount++;
    if (this.watched) this.captureGpuEvents();
  }
  setFilters(indices, groups, masks) {
    const ids = Array.from(indices),
      g = Array.from(groups),
      m = Array.from(masks);
    super.setFilters(ids, g, m);
    ids.forEach((id, k) => {
      this.filterRecords[id * 4] = g[k];
      this.filterRecords[id * 4 + 1] = m[k];
      this.uploadFilter(id);
    });
  }
  uploadFilter(id) {
    this.compute.uploadLinear(
      this.glWorld.inputs.filters,
      this.filterRecords.subarray(id * 4, id * 4 + 4),
      id,
    );
  }
  setSensor(id, value) {
    super.setSensor(id, value);
    this.filterRecords[id * 4 + 3] = Number(value);
    this.uploadFilter(id);
  }
  setRestitution(id, value) {
    super.setRestitution(id, value);
    this.glWorld
      .prepareRestitution(math[this.dimension].restitution)
      .set(id, value);
  }
  setMotor(slot, options) {
    super.setMotor(slot, options);
    const data = this.packJointRecords();
    if (this.dimension === 3) {
      this.queue("joints", slot * 8 + 6, 3, data[slot * 32 + 27]);
      this.queue("joints", slot * 8 + 7, 3, data[slot * 32 + 31]);
    } else
      for (const [field, offset] of [
        [4, 32],
        [0, 12],
        [1, 16],
      ])
        this.queue(
          "jointStatic",
          slot * 5 + field,
          0,
          data[slot * 36 + offset],
        );
  }
  setAngleLimits(slot, options) {
    super.setAngleLimits(slot, options);
    const data = this.packJointRecords();
    for (const k of [0, 1, 2])
      this.queue("jointStatic", slot * 5 + 4, k, data[slot * 36 + 32 + k]);
  }
  setWorldAnchor(slot, ...point) {
    super.setWorldAnchor(slot, ...point);
    const data = this.packJointRecords(),
      field = this.dimension === 3 ? 6 : 3,
      stride = this.dimension === 3 ? 32 : 36,
      offset = this.dimension === 3 ? 24 : 28;
    for (let k = 0; k < this.dimension; k++)
      this.queue(
        this.dimension === 3 ? "joints" : "jointStatic",
        slot * (this.dimension === 3 ? 8 : 5) + field,
        k,
        data[slot * stride + offset + k],
      );
  }
  disableConstraint(slot) {
    super.disableConstraint(slot);
    const info = this.glWorld.inputs.jointInfo;
    this.compute.uploadLinear(info, new Uint32Array([0, 0, 0, 0]), slot);
    if (this.glWorld.collisionInfo)
      this.compute.uploadLinear(
        this.glWorld.collisionInfo,
        new Uint32Array([0, 0, 0, 0]),
        slot,
      );
  }
  setSpringMaterial(slot, options) {
    super.setSpringMaterial(slot, options);
    const data = this.packJointRecords();
    for (const [field, offset] of [
      [2, 11],
      [3, 15],
    ])
      this.queue("joints", slot * 8 + field, 3, data[slot * 32 + offset]);
  }
  enableSleeping(options = {}) {
    if (!this.glWorld) {
      this.requestedSleep = options;
      return this;
    }
    this.disableSleeping();
    const eligible = Array.from({ length: this.bodyCount }, (_, i) =>
      this.dimension === 3
        ? this.solver.bodies[i].allowSleep !== false
        : this.solver.avbdSleepEligible?.get(i) !== false,
    );
    this.sleeping = this.glWorld.enableSleeping({
      speed: options.speedThreshold ?? 0.03,
      delay: options.timeThreshold ?? 0.5,
      eligible,
    });
    return this;
  }
  disableSleeping() {
    if (this.glWorld?.sleeping) {
      this.glWorld.sleeping.wakeNow();
      this.glWorld.sleeping.destroy();
      this.glWorld.sleeping = null;
    }
    this.sleeping = null;
    return this;
  }
  setSleepEnabled(id, value) {
    this.liveIndex(id);
    if (typeof value !== "boolean") throw Error("Sleep flag must be boolean");
    if (this.dimension === 3) this.solver.bodies[id].allowSleep = value;
    else {
      this.solver.avbdSleepEligible ??= new Map();
      this.solver.avbdSleepEligible.set(id, value);
    }
    if (value && !this.sleeping) this.enableSleeping();
    this.sleeping?.setEligible(id, value);
    return this;
  }
  async readSleepStats() {
    return this.sleeping
      ? this.sleeping.readStats()
      : { sleeping: 0, wakeRequested: false };
  }
  async readBodies() {
    this.flushEdits();
    return this.glWorld.readBodies();
  }
  async readSelectedBodies(indices, { posesOnly = false } = {}) {
    const ids = Array.from(indices);
    ids.forEach((i) => this.liveIndex(i));
    this.flushEdits();
    this.gather ??= new GlBodyReadback(this.compute, this.dimension);
    return this.gather.read(this.glWorld, ids, posesOnly);
  }
  async readBodyState(id) {
    this.liveIndex(id);
    const data = await this.readSelectedBodies([id]);
    return this.dimension === 3
      ? {
          position: Array.from(data.slice(0, 3)),
          rotation: Array.from(data.slice(4, 8)),
          linearVelocity: Array.from(data.slice(32, 35)),
          angularVelocity: Array.from(data.slice(36, 39)),
          mass: this.solver.bodies[id].mass,
          effectiveMass: data[19],
          sleeping: data[19] === 0 && this.solver.bodies[id].mass > 0,
        }
      : {
          position: Array.from(data.slice(0, 2)),
          angle: data[2],
          linearVelocity: Array.from(data.slice(12, 14)),
          angularVelocity: data[14],
          mass: data[22],
          moment: data[23],
          sleeping: data[15] !== 0,
        };
  }
  async readJoints() {
    this.flushEdits();
    const w = this.glWorld;
    if (this.dimension === 3)
      return (await this.compute.read(w.inputs.joints)).slice(
        0,
        this.jointCount * 32,
      );
    const out = new Float32Array(this.jointCount * 36),
      fields = [
        ["jointPenalty", [0]],
        ["jointLambda", [1]],
        ["jointStiffness", [2]],
        ["jointStatic", [3, 4, 5, 7, 8]],
        ["jointInitial", [6]],
      ];
    await Promise.all(
      fields.map(async ([name, indices]) => {
        const data = await this.compute.read(w.inputs[name]);
        for (let i = 0; i < this.jointCount; i++)
          indices.forEach((index, k) =>
            out.set(
              data.subarray(
                (i * indices.length + k) * 4,
                (i * indices.length + k + 1) * 4,
              ),
              i * 36 + index * 4,
            ),
          );
      }),
    );
    return out;
  }
  async readCounters() {
    this.assertLive();
    this.counters ??= new GlCounters(this.glWorld, this.dimension);
    const [status, counts, sleep] = await Promise.all([
      this.glWorld.readStatus(),
      this.counters.read(),
      this.readSleepStats(),
    ]);
    return {
      ...counts,
      joints: this.jointCount,
      overflow: status.problems & 4 ? 1 : 0,
      clashes: status.problems & 3 ? 1 : 0,
      colors: status.colors,
      sleeping: sleep.sleeping,
    };
  }
  adapt(counters) {
    if (!counters?.overflow && !counters?.clashes) return;
    this.options.neighborCapacity = counters.overflow
      ? (this.options.neighborCapacity ?? 30) * 2
      : this.options.neighborCapacity;
    if (counters.clashes && !counters.overflow) {
      this.options.colorCap = 64;
      this.options.colorRounds = Math.min(
        1024,
        (this.options.colorRounds ?? 64) * 2,
      );
    }
    this.rebuild();
  }
  /** Explicit queries download poses; collision detection during step stays GPU-only. */
  async sphereCast(origin, radius, direction, options) {
    await this.refreshCpuPoses();
    return cpuCast(this, origin, radius, direction, options);
  }
  async raycastAll(rays, options) {
    await this.refreshCpuPoses();
    return rays.map((r) =>
      cpuCast(this, r.origin, 0, r.direction, {
        ...options,
        maxDistance: r.maxDistance ?? options?.maxDistance,
      }),
    );
  }
  async sphereCastAll(casts, options) {
    await this.refreshCpuPoses();
    return casts.map((c) =>
      cpuCast(this, c.origin, c.radius, c.direction, {
        ...options,
        maxDistance: c.maxDistance ?? options?.maxDistance,
      }),
    );
  }
  async refreshCpuPoses() {
    const data = await this.readBodies();
    if (this.dimension === 3)
      this.solver.bodies.forEach((b, i) => {
        b.positionLin.set(data.subarray(i * 40, i * 40 + 3));
        b.positionAng.set(data.subarray(i * 40 + 4, i * 40 + 8));
      });
    else
      for (let i = 0; i < this.bodyCount; i++)
        this.solver.pose.set(data.subarray(i * 24, i * 24 + 4), i * 4);
    return data;
  }
  captureGpuEvents() {
    const w = this.glWorld,
      c = this.compute,
      step = this.stepCount,
      filters = this.filterRecords.slice();
    const snapshot = Promise.all([
      c.read(w.narrowphase.outputs[3]),
      c.read(w.narrowphase.outputs[0]),
      c.read(w.narrowphase.outputs[1]),
      c.read(w.inputs.pose ?? w.inputs.position),
      this.dimension === 3 ? c.read(w.inputs.rotation) : Promise.resolve(null),
      c.read(this.dimension === 3 ? w.inputs.manifoldIds : w.inputs.contactIds),
      c.read(
        this.dimension === 3 ? w.inputs.contactLambda : w.inputs.contactPenalty,
      ),
    ]).then(
      (data) => ({ data }),
      (error) => ({ error }),
    );
    this.eventRead = (this.eventRead ?? Promise.resolve()).then(async () => {
      const result = await snapshot;
      if (this.destroyed) return;
      if (result.error) throw result.error;
      const [ids, normals, anchors, poses, rotations, solvedIds, lambda] =
          result.data,
        pairs = [];
      const seen = new Set(),
        impulses = new Map();
      for (let k = 0; k < solvedIds.length; k += 4) {
        const a = solvedIds[k],
          b = solvedIds[k + 1];
        if (a === b) continue;
        const key = Math.max(a, b) + "," + Math.min(a, b);
        let impulse = 0;
        if (this.dimension === 2)
          impulse = Math.abs(lambda[k + 2]) * w.params.dt;
        else
          for (let p = 0; p < (solvedIds[k + 3] & 15); p++)
            impulse +=
              Math.abs(lambda[(solvedIds[k + 2] + p) * 4]) * w.params.dt;
        impulses.set(key, (impulses.get(key) ?? 0) + impulse);
      }
      for (let k = 0; k < ids.length; k += 4) {
        const a = ids[k],
          b = ids[k + 1];
        if (!ids[k + 3] || (!this.watched?.has(a) && !this.watched?.has(b)))
          continue;
        const key = Math.max(a, b) + "," + Math.min(a, b);
        if (seen.has(key)) continue;
        seen.add(key);
        let point;
        if (this.dimension === 2) {
          const angle = poses[a * 4 + 2],
            x = anchors[k],
            y = anchors[k + 1];
          point = [
            poses[a * 4] + Math.cos(angle) * x - Math.sin(angle) * y,
            poses[a * 4 + 1] + Math.sin(angle) * x + Math.cos(angle) * y,
            0,
          ];
        } else {
          const q = rotations.subarray(a * 4, a * 4 + 4),
            v = anchors.subarray(k, k + 3),
            cross = (u, v) => [
              u[1] * v[2] - u[2] * v[1],
              u[2] * v[0] - u[0] * v[2],
              u[0] * v[1] - u[1] * v[0],
            ],
            t = cross(q, v).map((x) => 2 * x),
            r = cross(q, t);
          point = Array.from(
            v,
            (x, j) => poses[a * 4 + j] + x + q[3] * t[j] + r[j],
          );
        }
        pairs.push({
          a,
          b,
          point,
          isTrigger: !!(filters[a * 4 + 3] || filters[b * 4 + 3]),
          normal: Array.from(normals.subarray(k, k + 3)),
          impulse: impulses.get(key) ?? 0,
        });
      }
      // The shared bounded begin/end tracker consumes GPU-produced pairs only.
      const previousStep = this.stepCount;
      this.stepCount = step;
      super.trackContactPairs(pairs);
      this.stepCount = previousStep;
    });
    this.eventRead.catch((error) => {
      this.eventError = error;
    });
  }
  async readContactEvents() {
    this.watchContacts();
    await this.eventRead;
    if (this.eventError) throw this.eventError;
    return super.readContactEvents();
  }
  rebuild() {
    this.flushEdits();
    const old = this.glWorld,
      oldSleep = this.sleeping
        ? {
            speedThreshold: this.sleeping.speed,
            timeThreshold: this.sleeping.delay,
          }
        : null;
    this.sleeping?.wakeNow();
    this.sleeping = null;
    this.counters?.destroy();
    this.counters = null;
    this.createWorld();
    const next = this.glWorld,
      groups =
        this.dimension === 3
          ? {
              position: 1,
              rotation: 1,
              history: 4,
              properties: 2,
              motion: 2,
              joints: 8,
            }
          : {
              pose: 1,
              initial: 1,
              inertial: 1,
              velocity: 1,
              previousVelocity: 1,
              shape: 1,
              jointPenalty: 1,
              jointLambda: 1,
              jointStiffness: 1,
              jointInitial: 1,
            };
    for (const [name, stride] of Object.entries(groups)) {
      const count = name.startsWith("joint") ? old.jointCount : old.bodyCount;
      this.patcher.copy(
        old.inputs[name],
        next.inputs[name],
        next.spare[name],
        count * stride,
      );
      [next.inputs[name], next.spare[name]] = [
        next.spare[name],
        next.inputs[name],
      ];
    }
    old.destroy();
    if (oldSleep) this.enableSleeping(oldSleep);
    return this;
  }
  addDynamic(method, args) {
    const id = super.addDynamic(method, args);
    this.rebuild();
    return id;
  }
  appendJoint(...args) {
    const slot = super.appendJoint(...args);
    this.rebuild();
    return slot;
  }
  rewriteBodies(ids, bodies) {
    if (this.dimension !== 3 || ids.length !== bodies.length)
      throw Error("Provide one replacement per 3D body");
    ids.forEach((i) => this.liveIndex(i));
    ids.forEach((id, k) => {
      const old = this.solver.bodies[id],
        next = bodies[k];
      for (const f of old.forces) {
        if (f.bodyA === old) f.bodyA = next;
        if (f.bodyB === old) f.bodyB = next;
        next.forces.push(f);
      }
      next.solver = this.solver;
      this.solver.bodies[id] = next;
    });
    this.rebuild();
    const data = sceneRecords(this).bodies,
      groups = {
        position: [0],
        rotation: [1],
        history: [2, 3, 6, 7],
        properties: [4, 5],
        motion: [8, 9],
      };
    for (const id of ids)
      for (const [name, fields] of Object.entries(groups))
        fields.forEach((field, k) => {
          for (let c = 0; c < 4; c++)
            this.queue(
              name,
              id * fields.length + k,
              c,
              data[id * 40 + field * 4 + c],
            );
        });
    this.flushEdits();
    this.wakeAll();
    return this;
  }
  captureConstraintFrames(entries) {
    this.assertLive();
    if (this.dimension !== 3)
      throw Error("Constraint frames require a 3D world");
    const frames = Array.from(entries);
    for (const { slot, spring } of frames) {
      const f = this.constraints[slot];
      if (
        !Number.isInteger(slot) ||
        !f ||
        f.broken ||
        f.cpuAngular ||
        (spring ? f.rest === undefined : f.stiffnessAng === undefined)
      )
        throw Error("A live spring or joint is required");
    }
    this.flushEdits();
    this.frames ??= new GlConstraintFrames(this.compute);
    this.frames.capture(this.glWorld, frames);
    this.wakeAll();
  }
  destroy() {
    if (this.destroyed) return;
    this.detachFromScene();
    this.gather?.destroy();
    this.frames?.destroy();
    this.counters?.destroy();
    this.glWorld?.destroy();
    this.patcher?.destroy();
    this.pending.count = 0;
    this.events = [];
    this.previous.clear();
    this.destroyed = true;
  }
}
