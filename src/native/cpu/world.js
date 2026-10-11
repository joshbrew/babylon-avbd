import { CpuSolver3D } from "./cpuSolver3D.ts";
import { CpuSolver2D } from "./cpuSolver2D.js";
import { prepareCpuForces3D, captureCpuFrame3D } from "./cpuPhysics3D.js";
import { turn, cross } from "./cpuContacts3D.js";
import {
  isSphere,
  isSail,
  hullOf,
} from "../../../reference/three-avbd/src/avbd3d/shapes.ts";
import { isCapsule } from "../../gpu/capsuleShape.js";
import {
  CS,
  STIFF,
  P0,
  FMIN,
  FMAX,
  PEN,
  LAM,
  FRAC,
  C0,
  RA,
  RB,
} from "../../../reference/three-avbd/src/avbd2d/soa/solver.ts";
import {
  installNativeRuntime,
  attachToScene,
  detachFromScene,
  components,
} from "../runtime.js";
import { CommandStaging } from "../../gpu/bodyCommands2D.js";
import {
  angleLimits2D,
  defineAngleLimits2D,
} from "../../gpu/angularLimits2D.js";
import { angularConstraintOptions } from "../../gpu/angularConstraints.js";
import { cpuCast } from "./queries.js";
import { CpuSleeping } from "./sleeping.js";
import {
  springMaterial,
  setInitialSpringMaterial,
  initialSpringMaterial as springMaterialForPacking,
} from "../../gpu/springMaterial.js";

/** CPU execution of the native scene contract. No renderer or graphics device. */
export class NativeCpuSolver {
  constructor(scene, dimension, options = {}) {
    this.backend = "cpu";
    this.dimension = dimension;
    this.scene = scene;
    this.stepCount = 0;
    this.pending = new CommandStaging();
    this.events = [];
    this.previous = new Map();
    this.watched = null;
    if (dimension === 3) {
      this.solver = Object.assign(new CpuSolver3D(), scene.ref);
      this.solver.up = [...(scene.up ?? [0, 0, 1])];
      this.nativeRef = scene.ref;
      this.constraints = this.solver.forces.slice();
      for (const b of this.solver.bodies) b.solver = this.solver;
      for (const f of this.constraints) f.solver = this.solver;
      this.constraints.forEach((f, i) => {
        const h = scene.handles?.get(f);
        if (h) h.slot = i;
      });
      prepareCpuForces3D(this.solver);
    } else {
      this.solver = new CpuSolver2D(
        scene.topology,
        scene,
        options.order === "colored" ? "soa-colored" : "soa-seq",
      );
      this.topology = this.solver;
      this.builder = Object.assign(
        Object.create(Object.getPrototypeOf(scene)),
        {
          topology: this.solver,
          filters: this.solver.filters,
          sensors: this.solver.sensors,
          restitution: this.solver.restitution,
        },
      );
    }
    this.params = dimension === 3 ? this.solver : this.solver.params;
    installNativeRuntime(
      this,
      dimension === 3 ? { bodies: this.solver.bodies } : null,
      dimension,
      {
        setVelocities: this.setPackedVelocities,
        readSelectedBodies: this.readSelectedBodies,
      },
    );
    if (
      options.sleeping ||
      scene.sleepOptIn ||
      [...(scene.topology?.avbdSleepEligible?.values() ?? [])].some(Boolean)
    )
      this.enableSleeping(options.sleeping === true ? {} : options.sleeping);
  }
  get bodyCount() {
    return this.dimension === 3
      ? this.solver.bodies.length
      : this.solver.bodyCount;
  }
  get jointCount() {
    return this.dimension === 3
      ? this.constraints.length
      : this.solver.jointCount;
  }
  gpuIndex(index) {
    this.liveIndex(index);
    return index;
  }
  liveIndex(index) {
    this.assertLive();
    if (!Number.isInteger(index) || index < 0 || index >= this.bodyCount)
      throw Error("A live body index is required");
  }
  assertLive() {
    if (this.destroyed) throw Error("The solver has been destroyed");
  }
  prepareBodyCommands() {
    this.wakeAll();
    return {
      enqueueValidated: (commands) => {
        this.pending.reserve(this.pending.count + commands.count);
        this.pending.u32.set(
          commands.u32.subarray(0, commands.count * 12),
          this.pending.count * 12,
        );
        this.pending.count += commands.count;
      },
    };
  }
  setLinearVelocity(index, value) {
    return this.editBodies([{ body: index, linearVelocity: value }]);
  }
  setAngularVelocity(index, value) {
    return this.editBodies([{ body: index, angularVelocity: value }]);
  }
  applyImpulse(index, value, worldPoint) {
    return this.editBodies([{ body: index, impulse: value, worldPoint }]);
  }
  applyForce(index, value, worldPoint) {
    return this.editBodies([{ body: index, force: value, worldPoint }]);
  }
  applyAngularImpulse(index, value) {
    return this.editBodies([{ body: index, angularImpulse: value }]);
  }
  applyTorque(index, value) {
    return this.editBodies([{ body: index, torque: value }]);
  }
  teleport(index, position, rotation) {
    return this.editBodies([{ body: index, position, rotation }]);
  }
  setPackedVelocities(indices, values) {
    const ids = Array.from(indices),
      linear = values?.linear,
      angular = values?.angular;
    const n = this.dimension,
      a = n === 3 ? 3 : 1;
    if (linear === undefined && angular === undefined)
      throw Error("Provide linear or angular velocities");
    let previous = -1;
    ids.forEach((id) => {
      this.liveIndex(id);
      if (id <= previous)
        throw Error(
          "Velocity batch indices must be unique and ascending GPU slots",
        );
      previous = id;
    });
    for (const [v, stride] of [
      [linear, n],
      [angular, a],
    ])
      if (v !== undefined) {
        if (
          v.length !== ids.length * stride ||
          !Array.from(v).every((x) => Number.isFinite(Math.fround(x)))
        )
          throw Error("Provide finite packed velocity components per body");
      }
    const l = linear === undefined ? null : Array.from(linear),
      av = angular === undefined ? null : Array.from(angular);
    const edits = ids.map((body, i) => ({
      body,
      ...(l === null ? {} : { linearVelocity: l.slice(i * n, (i + 1) * n) }),
      ...(av === null
        ? {}
        : { angularVelocity: n === 3 ? av.slice(i * a, (i + 1) * a) : av[i] }),
    }));
    this.editBodies(edits);
    this.flushEdits();
    return this;
  }
  flushEdits() {
    if (this.destroyed) throw Error("The solver has been destroyed");
    const { words: f, u32: u, count } = this.pending,
      s = this.solver,
      n = this.dimension;
    for (let k = 0; k < count; k++) {
      const o = k * 12,
        id = u[o],
        kind = u[o + 1],
        point = u[o + 2] !== 0;
      const b = n === 3 ? s.bodies[id] : null;
      const velocity =
        b?.velocityLin ?? s.velocity.subarray(id * 4, id * 4 + 2);
      const mass = b?.mass ?? s.shape[id * 4 + 2];
      const position = b?.positionLin ?? s.pose.subarray(id * 4, id * 4 + 2);
      const angular = (v) => {
        if (mass <= 0) return;
        if (n === 2)
          s.velocity[id * 4 + 2] += v[0] / Math.max(1e-10, s.shape[id * 4 + 3]);
        else {
          const q = b.positionAng,
            local = turn([-q[0], -q[1], -q[2], q[3]], v);
          const delta = turn(
            q,
            local.map((x, i) => x / Math.max(1e-10, b.moment[i])),
          );
          for (let i = 0; i < 3; i++) b.velocityAng[i] += delta[i];
        }
      };
      if (kind === 0) velocity.set(f.subarray(o + 4, o + 4 + n));
      else if (kind === 1) {
        if (b) b.velocityAng.set(f.subarray(o + 4, o + 7));
        else s.velocity[id * 4 + 2] = f[o + 4];
      } else if (kind === 4) {
        position.set(f.subarray(o + 4, o + 4 + n));
        if (b) {
          if (point) b.positionAng.set(f.subarray(o + 8, o + 12));
          b.initialLin.set(position);
          b.inertialLin.set(position);
          b.initialAng.set(b.positionAng);
          b.inertialAng.set(b.positionAng);
          for (const force of [...b.forces])
            if (force.contacts) force.destroy();
        } else {
          if (point) s.pose[id * 4 + 2] = f[o + 6];
          s.initial.set(s.pose.subarray(id * 4, id * 4 + 4), id * 4);
          s.inertial.set(s.pose.subarray(id * 4, id * 4 + 4), id * 4);
          s.prevCount = 0;
        }
      } else if (kind === 2 || kind === 3) {
        if (mass <= 0) continue;
        const impulse = Array.from(
          f.subarray(o + 4, o + 4 + n),
          (x) => x * (kind === 3 ? f[o + 7] : 1),
        );
        for (let i = 0; i < n; i++) velocity[i] += impulse[i] / mass;
        if (point) {
          const r = Array.from(
            f.subarray(o + 8, o + 8 + n),
            (x, i) => x - position[i],
          );
          angular(
            n === 3
              ? cross(r, impulse)
              : [r[0] * impulse[1] - r[1] * impulse[0]],
          );
        }
      } else if (kind === 5 || kind === 6)
        angular(
          Array.from(
            f.subarray(o + 4, o + 4 + (n === 3 ? 3 : 1)),
            (x) => x * (kind === 6 ? f[o + 7] : 1),
          ),
        );
    }
    this.pending.count = 0;
  }
  step() {
    this.flushEdits();
    this.solver.step();
    this.sleeping?.after();
    this.stepCount++;
    this.captureEvents();
  }
  attachToScene(scene, options) {
    return attachToScene.call(this, scene, options);
  }
  detachFromScene() {
    return detachFromScene.call(this);
  }
  setFilters(indices, groups, masks) {
    const ids = Array.from(indices),
      g = Array.from(groups),
      m = Array.from(masks);
    if (g.length !== ids.length || m.length !== ids.length)
      throw Error("Provide one group and mask per body");
    ids.forEach((i) => this.liveIndex(i));
    for (const v of [...g, ...m])
      if (!Number.isInteger(v) || v < 0 || v > 0xffffffff)
        throw Error("Collision masks must be unsigned 32-bit integers");
    ids.forEach((id, i) => {
      if (this.dimension === 3)
        Object.assign(this.solver.bodies[id], {
          group: g[i],
          collidesWith: m[i],
        });
      else this.solver.filters.set(id, [g[i], m[i]]);
    });
    this.wakeAll();
  }
  setSensor(id, enabled) {
    this.liveIndex(id);
    if (typeof enabled !== "boolean")
      throw Error("Trigger flag must be boolean");
    if (this.dimension === 3) this.solver.bodies[id].isTrigger = enabled;
    else if (enabled) this.solver.sensors.add(id);
    else this.solver.sensors.delete(id);
    this.wakeAll();
  }
  setRestitution(id, value) {
    this.liveIndex(id);
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw Error("restitution must be between 0 and 1");
    if (this.dimension === 3) this.solver.bodies[id].restitution = value;
    else this.solver.restitution.set(id, value);
    this.wakeAll();
  }
  setMotor(slot, options) {
    this.assertLive();
    if (this.dimension === 3) {
      const f = this.constraints[slot];
      if (!f?.cpuAngular) throw Error("A motor constraint is required");
      Object.assign(
        f.cpuAngular.options,
        angularConstraintOptions({ ...f.cpuAngular.options, ...options }),
      );
    } else {
      const s = this.solver,
        o = slot * CS;
      if (
        !Number.isInteger(slot) ||
        slot < 0 ||
        slot >= s.jointCount ||
        s.info[slot * 4] !== 3
      )
        throw Error("A motor constraint is required");
      const speed = options.speed ?? s.data[o + P0],
        torque = options.maxTorque ?? s.data[o + FMAX];
      if (!Number.isFinite(speed) || !Number.isFinite(torque) || torque < 0)
        throw Error("Provide finite motor speed and nonnegative torque");
      s.data[o + P0] = speed;
      s.data[o + FMIN] = -torque;
      s.data[o + FMAX] = torque;
    }
    this.wakeAll();
  }
  setAngleLimits(slot, options) {
    this.assertLive();
    if (this.dimension !== 2) throw Error("Use a 3D hinge constraint");
    if (this.solver.info[slot * 4] !== 5)
      throw Error("An angular limit is required");
    defineAngleLimits2D(this.solver, slot, angleLimits2D(options));
    this.wakeAll();
  }
  releaseJoints(slots) {
    for (const slot of slots) this.disableConstraint(slot);
  }
  disableConstraint(slot) {
    this.assertLive();
    if (!Number.isInteger(slot) || slot < 0 || slot >= this.jointCount)
      throw Error("A live constraint slot is required");
    if (this.dimension === 3) {
      const f = this.constraints[slot];
      f.broken = true;
      (f.cpuAngular ?? f).destroy();
    } else {
      this.solver.disable(slot);
      this.solver.info[slot * 4] = 0;
      this.solver.noCollideDirty = true;
    }
    this.wakeAll();
  }
  setWorldAnchor(slot, point, y) {
    this.assertLive();
    if (this.dimension === 2) {
      const s = this.solver;
      if (
        !Number.isInteger(slot) ||
        slot < 0 ||
        slot >= s.jointCount ||
        s.info[slot * 4 + 1] !== -1
      )
        throw Error("A world-anchor constraint is required");
      s.data.set(components([point, y], 2, "point"), slot * CS + 21);
    } else {
      const f = this.constraints[slot];
      if (!f || f.bodyA) throw Error("A world-anchor constraint is required");
      f.rA.set(components(point, 3, "point"));
    }
    this.wakeAll();
  }
  addBox(...args) {
    return this.addDynamic("addBox", args);
  }
  addCircle(...args) {
    return this.addDynamic("addCircle", args);
  }
  addCapsule(...args) {
    return this.addDynamic("addCapsule", args);
  }
  addHull(...args) {
    return this.addDynamic("addHull", args);
  }
  addSegment(...args) {
    return this.addDynamic("addSegment", args);
  }
  addPlane(...args) {
    return this.addDynamic("addPlane", args);
  }
  addDynamic(method, args) {
    if (this.destroyed) throw Error("The solver has been destroyed");
    if (this.dimension !== 2)
      throw Error("Build 3D bodies before creating the solver");
    this.wakeAll();
    const sleeping = this.sleeping
      ? {
          speedThreshold: this.sleeping.speedThreshold,
          timeThreshold: this.sleeping.timeThreshold,
        }
      : null;
    const id = this.builder[method](...args);
    if (sleeping) this.enableSleeping(sleeping);
    return id;
  }
  appendJoint(a, b, ra, rb, stiffness, breakForce = Infinity) {
    this.assertLive();
    if (this.dimension !== 2)
      throw Error("Build 3D constraints before creating the solver");
    this.wakeAll();
    return this.builder.addJoint(a, b, ra, rb, { stiffness, breakForce }).slot;
  }
  captureConstraintFrames(entries) {
    this.assertLive();
    if (this.dimension !== 3)
      throw Error("Constraint frame capture requires a 3D world");
    const frames = Array.from(entries);
    for (const { slot, spring } of frames) {
      const force = this.constraints[slot];
      if (
        !Number.isInteger(slot) ||
        !force ||
        force.broken ||
        force.cpuAngular ||
        (spring ? force.rest === undefined : force.stiffnessAng === undefined)
      )
        throw Error("A live spring or joint slot is required");
    }
    this.flushEdits();
    for (const { slot, spring } of frames)
      captureCpuFrame3D(this.constraints[slot], spring);
    if (frames.length) this.wakeAll();
  }
  setSpringMaterial(slot, options = {}) {
    this.assertLive();
    const f = this.constraints[slot];
    if (!f || f.rest === undefined)
      throw Error("A spring constraint is required");
    setInitialSpringMaterial(f, springMaterial(options));
    this.wakeAll();
  }
  packBodyRecords(indices, posesOnly = false) {
    const s = this.solver,
      n = this.dimension,
      stride = posesOnly ? (n === 3 ? 8 : 4) : n === 3 ? 40 : 24,
      count = indices?.length ?? this.bodyCount,
      out = new Float32Array(count * stride);
    for (let j = 0; j < count; j++) {
      const i = indices?.[j] ?? j,
        o = j * stride;
      if (posesOnly) {
        if (n === 3) {
          const b = s.bodies[i];
          out.set(b.positionLin, o);
          out[o + 3] = b.friction;
          out.set(b.positionAng, o + 4);
        } else {
          out.set(s.pose.subarray(i * 4, i * 4 + 4), o);
          out[o + 3] = s.props[i * 4];
        }
        continue;
      }
      if (n === 3) {
        const b = s.bodies[i];
        out.set(b.positionLin, o);
        out[o + 3] = b.friction;
        out.set(b.positionAng, o + 4);
        out.set(b.initialLin, o + 8);
        out[o + 11] = Number(!!b.isTrigger);
        out.set(b.initialAng, o + 12);
        out.set(b.size, o + 16);
        out[o + 19] = b.sleeping ? 0 : b.mass;
        out.set(b.moment, o + 20);
        out[o + 23] = b.radius;
        out.set(b.inertialLin, o + 24);
        out.set(b.inertialAng, o + 28);
        out.set(b.velocityLin, o + 32);
        out[o + 35] = b.prevVelocityLin.reduce((v, x, k) => v + x * s.up[k], 0);
        out.set(b.velocityAng, o + 36);
        out[o + 39] = isSphere(b)
          ? 1
          : isCapsule(b)
            ? -1
            : hullOf(b)
              ? 3
              : isSail(b)
                ? 2
                : 0;
      } else {
        out.set(s.pose.subarray(i * 4, i * 4 + 4), o);
        out[o + 3] = s.props[i * 4];
        out.set(s.initial.subarray(i * 4, i * 4 + 4), o + 4);
        out.set(s.inertial.subarray(i * 4, i * 4 + 4), o + 8);
        out.set(s.velocity.subarray(i * 4, i * 4 + 4), o + 12);
        out.set(s.prevVelocity.subarray(i * 4, i * 4 + 4), o + 16);
        out.set(s.shape.subarray(i * 4, i * 4 + 4), o + 20);
      }
    }
    return out;
  }
  async readBodies() {
    this.flushEdits();
    return this.packBodyRecords();
  }
  async readSelectedBodies(indices, { posesOnly = false } = {}) {
    const ids = Array.from(indices);
    ids.forEach((i) => this.liveIndex(i));
    this.flushEdits();
    return this.packBodyRecords(ids, posesOnly);
  }
  async readBodyState(id) {
    this.liveIndex(id);
    this.flushEdits();
    const s = this.solver;
    if (this.dimension === 3) {
      const b = s.bodies[id],
        sleeping = this.sleeping?.asleep.has(id) ?? false;
      return {
        position: Array.from(b.positionLin),
        rotation: Array.from(b.positionAng),
        linearVelocity: Array.from(b.velocityLin),
        angularVelocity: Array.from(b.velocityAng),
        mass: b.mass,
        effectiveMass: sleeping ? 0 : b.mass,
        sleeping,
      };
    }
    return {
      position: Array.from(s.pose.subarray(id * 4, id * 4 + 2)),
      angle: s.pose[id * 4 + 2],
      linearVelocity: Array.from(s.velocity.subarray(id * 4, id * 4 + 2)),
      angularVelocity: s.velocity[id * 4 + 2],
      mass: s.shape[id * 4 + 2],
      moment: s.shape[id * 4 + 3],
      sleeping: this.sleeping?.asleep.has(id) ?? false,
    };
  }
  async readJoints() {
    this.flushEdits();
    return this.packJointRecords();
  }
  packJointRecords() {
    const stride = this.dimension === 3 ? 32 : 36,
      out = new Float32Array(this.jointCount * stride),
      finite = (x) => (x === Infinity ? 3e38 : x === -Infinity ? -3e38 : x);
    if (this.dimension === 2) {
      const d = this.solver.data;
      for (let i = 0; i < this.jointCount; i++) {
        const o = i * 36,
          s = i * CS;
        [PEN, LAM, STIFF, FMIN, FMAX, FRAC, C0].forEach((at, block) => {
          for (let r = 0; r < 3; r++)
            out[o + block * 4 + r] = finite(d[s + at + r]);
        });
        out.set([d[s + RA], d[s + RA + 1], d[s + RB], d[s + RB + 1]], o + 28);
        out.set([d[s + P0], d[s + P0 + 1], d[s + P0 + 2], 0], o + 32);
      }
    } else
      this.constraints.forEach((f, i) => {
        const o = i * 32;
        if (f.cpuAngular) {
          const a = f.cpuAngular,
            p = a.options;
          out.set(a.pen, o);
          out[o + 3] = f.broken ? 0 : 1;
          out.set(a.lam, o + 8);
          out.set(a.ta, o + 16);
          out.set(a.tb, o + 20);
          out.set(p.axisA, o + 24);
          out.set(p.axisB, o + 28);
          out[o + 19] = a.c0?.[0] ?? 0;
          out[o + 23] = a.c0?.[1] ?? 0;
          out[o + 27] = p.type === "motor" ? p.speed : p.minAngle;
          out[o + 31] = p.type === "motor" ? p.maxTorque : p.maxAngle;
          return;
        }
        for (const [key, at] of [
          ["penaltyLin", 0],
          ["penaltyAng", 4],
          ["lambdaLin", 8],
          ["lambdaAng", 12],
          ["C0Lin", 16],
          ["C0Ang", 20],
          ["rA", 24],
          ["rB", 28],
        ])
          if (f[key]) out.set(f[key], o + at);
        out[o + 3] = f.broken ? 0 : finite(f.stiffnessLin ?? f.stiffness ?? 0);
        out[o + 7] = f.broken ? 0 : finite(f.stiffnessAng ?? 0);
        out[o + 11] = finite(f.fracture ?? 0);
        out[o + 15] = f.torqueArm ?? 0;
        out[o + 27] = f.rest ?? 0;
        if (f.cpuRest) {
          out[o + 19] = f.cpuRest[0];
          out[o + 23] = f.cpuRest[1];
          out[o + 27] = f.cpuRest[2];
          out[o + 31] = f.cpuRest[3];
        }
        if (f.rest !== undefined) {
          const material = springMaterialForPacking(f);
          out[o + 11] = Number.isFinite(material?.breakStrain)
            ? material.breakStrain
            : 0;
          out[o + 15] = Number.isFinite(material?.breakForce)
            ? material.breakForce
            : 0;
        }
      });
    return out;
  }
  async readCounters() {
    this.assertLive();
    const contacts =
      this.dimension === 2
        ? this.solver.contactCount
        : this.solver.forces.reduce((n, f) => n + (f.contacts?.length ?? 0), 0);
    const manifolds =
      this.dimension === 2
        ? this.solver.contactPairs.length
        : this.solver.forces.filter((f) => f.contacts?.length).length;
    return {
      pairs: manifolds,
      contacts,
      manifolds,
      joints: this.jointCount,
      overflow: 0,
      clashes: 0,
      colors: 0,
      sleeping: this.sleeping?.asleep.size ?? 0,
    };
  }
  adapt() {}
  watchContacts({
    indices,
    maxPairs = this.maxPairs ?? 8192,
    maxEvents = this.maxEvents ?? 4096,
  } = {}) {
    this.assertLive();
    if (
      !Number.isInteger(maxEvents) ||
      maxEvents < 1 ||
      !Number.isInteger(maxPairs) ||
      maxPairs < 1
    )
      throw Error("Contact capacities must be positive integers");
    if (indices !== undefined) {
      indices.forEach((i) => this.liveIndex(i));
      this.watched = new Set(indices);
    } else
      this.watched ??= new Set(
        Array.from({ length: this.bodyCount }, (_, i) => i),
      );
    this.maxEvents = maxEvents;
    this.maxPairs = maxPairs;
    return this;
  }
  captureEvents() {
    if (!this.watched) return;
    const ids =
      this.dimension === 3
        ? new Map(this.solver.bodies.map((b, i) => [b, i]))
        : null;
    const pairs =
      this.dimension === 2
        ? this.solver.contactPairs
        : this.solver.forces
            .filter((f) => f.contacts?.length)
            .map((f) => {
              const point = Array.from(f.bodyA.positionLin);
              for (const contact of f.contacts) {
                const r = turn(f.bodyA.positionAng, contact.rA);
                for (let k = 0; k < 3; k++)
                  point[k] += r[k] / f.contacts.length;
              }
              return {
                a: ids.get(f.bodyA),
                b: ids.get(f.bodyB),
                point,
                normal: Array.from(f.basis.slice(0, 3)),
                impulse:
                  f.bodyA.isTrigger || f.bodyB.isTrigger
                    ? 0
                    : f.contacts.reduce(
                        (n, c) => n + Math.abs(c.lambda[0]) * this.params.dt,
                        0,
                      ),
              };
            });
    this.trackContactPairs(pairs);
  }
  trackContactPairs(pairs) {
    const next = new Map();
    const emit = (p, type) => {
      if (this.events.length < (this.maxEvents ?? 4096))
        this.events.push({
          ...p,
          normal: p.normal ?? [...p.n, 0],
          type,
          kind: type === "begin" ? 1 : 2,
          step: this.stepCount,
          isTrigger:
            p.isTrigger ??
            (this.dimension === 3
              ? !!(
                  this.solver.bodies[p.a].isTrigger ||
                  this.solver.bodies[p.b].isTrigger
                )
              : this.solver.sensors.has(p.a) || this.solver.sensors.has(p.b)),
        });
      else this.dropped = (this.dropped ?? 0) + 1;
    };
    const active = new Set(),
      added = [];
    for (const p of pairs) {
      if (!this.watched.has(p.a) && !this.watched.has(p.b)) continue;
      const key = `${Math.max(p.a, p.b)},${Math.min(p.a, p.b)}`;
      active.add(key);
      if (this.previous.has(key) && next.size < this.maxPairs) next.set(key, p);
      else added.push([key, p]);
    }
    // Keep tracked contacts first so a crowded sensor does not repeatedly
    // report begin/end events as its bounded pair table fills.
    for (const [key, p] of added) {
      if (next.has(key)) continue;
      if (next.size >= this.maxPairs) {
        this.pairFull = true;
        continue;
      }
      next.set(key, p);
      if (!this.previous.has(key)) emit(p, "begin");
    }
    for (const [key, p] of this.previous)
      if (!active.has(key)) emit({ ...p, impulse: 0 }, "end");
    this.previous = next;
  }
  async readContactEvents() {
    this.watchContacts();
    const result = {
      events: this.events,
      dropped: this.dropped ?? 0,
      full: !!this.dropped || !!this.pairFull,
    };
    this.events = [];
    this.dropped = 0;
    this.pairFull = false;
    return result;
  }
  async raycast(origin, direction, options) {
    return this.sphereCast(origin, 0, direction, options);
  }
  async circleCast(origin, radius, direction, options) {
    return this.sphereCast(origin, radius, direction, options);
  }
  async sphereCast(origin, radius, direction, options) {
    this.flushEdits();
    return cpuCast(this, origin, radius, direction, options);
  }
  async raycastAll(rays, options) {
    return Promise.all(
      rays.map((r) =>
        this.raycast(r.origin, r.direction, {
          ...options,
          maxDistance: r.maxDistance ?? options?.maxDistance,
        }),
      ),
    );
  }
  async sphereCastAll(casts, options) {
    return Promise.all(
      casts.map((c) =>
        this.sphereCast(c.origin, c.radius, c.direction, {
          ...options,
          maxDistance: c.maxDistance ?? options?.maxDistance,
        }),
      ),
    );
  }
  async circleCastAll(casts, options) {
    return this.sphereCastAll(casts, options);
  }
  setSleepEnabled(id, enabled) {
    this.liveIndex(id);
    if (typeof enabled !== "boolean") throw Error("Sleep flag must be boolean");
    if (this.dimension === 3) this.solver.bodies[id].allowSleep = enabled;
    else {
      this.solver.avbdSleepEligible ??= new Map();
      this.solver.avbdSleepEligible.set(id, enabled);
    }
    if (enabled && !this.sleeping) this.enableSleeping();
    this.wakeAll();
    return this;
  }
  enableSleeping(options = {}) {
    this.assertLive();
    this.disableSleeping();
    this.sleeping = new CpuSleeping(this, options);
    return this;
  }
  disableSleeping() {
    this.sleeping?.wake();
    this.sleeping = null;
    return this;
  }
  async readSleepStats() {
    this.assertLive();
    return { sleeping: this.sleeping?.asleep.size ?? 0, wakeRequested: false };
  }
  wakeUp(id) {
    this.liveIndex(id);
    return this.wakeAll();
  }
  wakeAll() {
    this.sleeping?.wake();
    return this;
  }
  destroy() {
    if (this.destroyed) return;
    this.detachFromScene();
    this.disableSleeping();
    this.pending.count = 0;
    this.events = [];
    this.previous.clear();
    this.destroyed = true;
  }
}
