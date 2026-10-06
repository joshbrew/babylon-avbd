import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  Joint,
  Spring,
} from "../../reference/three-avbd/src/avbd3d/ref/forces.ts";
import {
  sphere,
  hull,
  convexHull,
} from "../../reference/three-avbd/src/avbd3d/shapes.ts";
import { SoaSolver2D } from "../../reference/three-avbd/src/avbd2d/soa/solver.ts";
import { CS, STIFF } from "../../reference/three-avbd/src/avbd2d/soa/solver.ts";
import { NativeGpuSolver2D as GpuSolver2D } from "./solver2D.js";
import { parallelParams } from "../../reference/three-avbd/src/avbd2d/ref/solver.ts";
import { NativeGpuSolver3D } from "./solver3D.js";
import { appGpuSolverOptions } from "../gpu/gpuSolverOptions.js";
import { clothSolve } from "../gpu/gpuClothSolver.js";
import {
  setInitialSpringMaterial,
  springMaterial,
} from "../gpu/springMaterial.js";
import {
  angularConstraintOptions,
  setInitialAngularConstraint,
} from "../gpu/angularConstraints.js";
import { capsule } from "../gpu/capsuleShape.js";
import { angleLimits2D, defineAngleLimits2D } from "../gpu/angularLimits2D.js";
import {
  circle2D,
  capsule2D,
  segment2D,
  plane2D,
  hull2D,
  storeShape2D,
} from "../gpu/shapes2D.js";

const vector = (v, n, name) => {
  const a = Array.from(v);
  if (a.length !== n || !a.every(Number.isFinite))
    throw Error(`${name} requires ${n} finite components`);
  return a;
};
const positive = (v, name, zero = false) => {
  if (!Number.isFinite(v) || (zero ? v < 0 : v <= 0))
    throw Error(
      `${name} must be ${zero ? "nonnegative" : "positive"} and finite`,
    );
  return v;
};
const collisionMask = (v) => {
  if (!Number.isInteger(v) || v < 0 || v > 0xffffffff)
    throw Error("Collision masks must be unsigned 32-bit integers");
  return v;
};
function validateBodyOptions3D(options) {
  for (const key of ["allowSleep", "isTrigger"])
    if (options[key] !== undefined && typeof options[key] !== "boolean")
      throw Error(`${key} must be a boolean`);
  const restitution = options.restitution ?? 0;
  if (!Number.isFinite(restitution) || restitution < 0 || restitution > 1)
    throw Error("restitution must be between 0 and 1");
  if (options.mass !== undefined) {
    positive(options.mass, "mass", true);
    if (options.mass > 0 && options.density === 0)
      throw Error("A positive mass needs positive density");
  }
  for (const key of ["velocity", "angularVelocity"])
    if (options[key] !== undefined) vector(options[key], 3, key);
  if (
    options.rotation !== undefined &&
    !Math.hypot(...vector(options.rotation, 4, "rotation"))
  )
    throw Error("rotation must be nonzero");
  collisionMask(options.group ?? 0xffffffff);
  collisionMask(options.collidesWith ?? 0xffffffff);
}
function settings(params, options) {
  if (options.timeStep !== undefined)
    params.dt = positive(options.timeStep, "timeStep");
  if (options.iterations !== undefined) {
    positive(options.iterations, "iterations");
    if (!Number.isInteger(options.iterations))
      throw Error("iterations must be an integer");
    params.iterations = options.iterations;
  }
  if (options.gravity !== undefined) {
    if (!Number.isFinite(options.gravity))
      throw Error("gravity must be finite");
    params.gravity = options.gravity;
  }
}
/** Portable GPU scene builders: no meshes, renderer imports or CPU stepping API. */
export class AvbdScene3D {
  constructor(options = {}) {
    this.ref = new Solver();
    settings(this.ref, options);
    this.up = vector(options.up ?? [0, 1, 0], 3, "up");
    if (Math.abs(Math.hypot(...this.up) - 1) > 1e-5)
      throw Error("up must be a unit vector");
    this.points = false;
    this.handles = new Map();
    this.bodySet = new Set();
  }
  get bodies() {
    return this.ref.bodies;
  }
  get constraints() {
    return [...this.handles.values()];
  }
  assertEditable() {
    if (this.created)
      throw Error(
        "Build this scene before createSolver; use the solver's GPU edit methods afterwards",
      );
  }
  addBox(size, options = {}) {
    this.assertEditable();
    validateBodyOptions3D(options);
    const s = vector(size, 3, "size");
    s.forEach((v) => positive(v, "size"));
    const b = new Rigid(
      this.ref,
      s,
      positive(options.density ?? 1, "density", true),
      positive(options.friction ?? 0.6, "friction", true),
      vector(options.position ?? [0, 0, 0], 3, "position"),
    );
    return this.configure(b, options);
  }
  addSphere(radius, options = {}) {
    this.assertEditable();
    validateBodyOptions3D(options);
    return this.configure(
      sphere(
        this.ref,
        positive(radius, "radius"),
        positive(options.density ?? 1, "density", true),
        positive(options.friction ?? 0.6, "friction", true),
        vector(options.position ?? [0, 0, 0], 3, "position"),
      ),
      options,
    );
  }
  addHull(points, options = {}) {
    this.assertEditable();
    validateBodyOptions3D(options);
    if (points.length % 3 || !Array.from(points).every(Number.isFinite))
      throw Error("Hull points must contain finite xyz triples");
    const shape = convexHull(points);
    if (!shape)
      throw Error("A convex hull requires finite points spanning a volume");
    this.hulls = true;
    return this.configure(
      hull(
        this.ref,
        shape,
        positive(options.density ?? 1, "density", true),
        positive(options.friction ?? 0.6, "friction", true),
        vector(options.position ?? [0, 0, 0], 3, "position"),
      ),
      options,
    );
  }
  addCapsule(radius, height, options = {}) {
    this.assertEditable();
    validateBodyOptions3D(options);
    return this.configure(
      capsule(
        this.ref,
        radius,
        height,
        positive(options.density ?? 1, "density", true),
        positive(options.friction ?? 0.6, "friction", true),
        vector(options.position ?? [0, 0, 0], 3, "position"),
      ),
      options,
    );
  }
  configure(b, options) {
    if (
      options.allowSleep !== undefined &&
      typeof options.allowSleep !== "boolean"
    )
      throw Error("allowSleep must be a boolean");
    b.allowSleep = options.allowSleep ?? true;
    this.sleepOptIn ||= options.allowSleep === true;
    const restitution = options.restitution ?? 0;
    if (!Number.isFinite(restitution) || restitution < 0 || restitution > 1)
      throw Error("restitution must be between 0 and 1");
    b.restitution = restitution;
    if (
      options.isTrigger !== undefined &&
      typeof options.isTrigger !== "boolean"
    )
      throw Error("isTrigger must be a boolean");
    b.isTrigger = options.isTrigger ?? false;
    b.group = options.group ?? 0xffffffff;
    b.collidesWith = options.collidesWith ?? 0xffffffff;
    if (options.mass !== undefined) {
      const mass = positive(options.mass, "mass", true);
      if (b.mass === 0 && mass > 0)
        throw Error("A positive mass needs positive density");
      const ratio = b.mass > 0 ? mass / b.mass : 0;
      b.mass = mass;
      b.moment.forEach((v, i) => (b.moment[i] = v * ratio));
    }
    if (options.rotation) {
      const q = vector(options.rotation, 4, "rotation"),
        l = Math.hypot(...q);
      if (!l) throw Error("rotation must be nonzero");
      b.positionAng.set(q.map((v) => v / l));
    }
    if (options.velocity)
      b.velocityLin.set(vector(options.velocity, 3, "velocity"));
    if (options.angularVelocity)
      b.velocityAng.set(vector(options.angularVelocity, 3, "angularVelocity"));
    this.bodySet.add(b);
    return b;
  }
  addPoint(position, { mass = 0.02, radius = 0.05, friction = 0.5 } = {}) {
    const b = this.addSphere(radius, { position, mass, friction });
    b.moment.fill(0);
    this.points = true;
    return b;
  }
  addFabric({
    columns = 16,
    rows = 16,
    spacing = 0.2,
    origin = [0, 3, 0],
    mass = 0.02,
    stiffness = 1000,
    anchorStiffness = stiffness,
    materialAt,
    breakStrain = Infinity,
    breakForce = Infinity,
    bendingStiffness = Number.isFinite(breakStrain) ||
    Number.isFinite(breakForce)
      ? 0
      : stiffness / 50,
    pinCorners = false,
    pinEdges = !pinCorners,
  } = {}) {
    for (const [name, n] of Object.entries({ columns, rows }))
      if (!Number.isInteger(n) || n < 2)
        throw Error(`${name} must be an integer >= 2`);
    positive(spacing, "spacing");
    positive(mass, "mass");
    positive(stiffness, "stiffness");
    positive(anchorStiffness, "anchorStiffness");
    if (materialAt !== undefined && typeof materialAt !== "function")
      throw Error("materialAt must be a function");
    positive(bendingStiffness, "bendingStiffness", true);
    if (typeof pinCorners !== "boolean" || typeof pinEdges !== "boolean")
      throw Error("Fabric pin options must be boolean");
    const material = springMaterial({ breakStrain, breakForce });
    const p = vector(origin, 3, "origin");
    const key = (a, b) => `${Math.min(a, b)},${Math.max(a, b)}`;
    function* springEdges() {
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < columns; x++) {
          const i = y * columns + x;
          if (x) yield [i, i - 1, stiffness];
          if (y) yield [i, i - columns, stiffness];
          if (x && y) {
            yield [i, i - columns - 1, stiffness / 2];
            yield [i - 1, i - columns, stiffness / 2];
          }
          if (x > 1 && bendingStiffness) yield [i, i - 2, bendingStiffness];
          if (y > 1 && bendingStiffness)
            yield [i, i - 2 * columns, bendingStiffness];
        }
    }
    // Evaluate every caller-supplied material before allocating any bodies or
    // constraints. A rejected profile must not leave a partially built fabric.
    const profiles = new Map();
    if (materialAt)
      for (const [ia, ib] of springEdges()) {
        const profile =
          materialAt(
            ((ia % columns) + (ib % columns)) / (2 * (columns - 1)),
            (Math.floor(ia / columns) + Math.floor(ib / columns)) /
              (2 * (rows - 1)),
          ) ?? {};
        if (typeof profile !== "object" || Array.isArray(profile))
          throw Error("materialAt must return a material object");
        profiles.set(key(ia, ib), {
          scale: positive(
            profile.stiffnessScale ?? 1,
            "materialAt.stiffnessScale",
          ),
          material: springMaterial({ ...material, ...profile }),
        });
      }
    const grid = Array.from({ length: rows }, (_, y) =>
      Array.from({ length: columns }, (_, x) =>
        this.addPoint(
          [
            p[0] + (x - (columns - 1) / 2) * spacing,
            p[1],
            p[2] + (y - (rows - 1) / 2) * spacing,
          ],
          {
            mass:
              (pinEdges &&
                (x === 0 || y === 0 || x === columns - 1 || y === rows - 1)) ||
              (pinCorners &&
                (x === 0 || x === columns - 1) &&
                (y === 0 || y === rows - 1))
                ? 0
                : mass,
            radius: spacing / Math.SQRT2,
          },
        ),
      ),
    );
    const points = grid.flat(),
      pointIndices = new Map(points.map((point, i) => [point, i]));
    const connections = [],
      edges = new Map();
    const link = (a, b, k) => {
      if (a.mass === 0 || b.mass === 0) k *= anchorStiffness / stiffness;
      const ia = pointIndices.get(a),
        ib = pointIndices.get(b);
      const profile = profiles.get(key(ia, ib));
      const connection = this.addSpring(a, b, [0, 0, 0], [0, 0, 0], {
        stiffness: k * (profile?.scale ?? 1),
        ...(profile?.material ?? material),
      });
      edges.set(
        key(pointIndices.get(a), pointIndices.get(b)),
        connections.length,
      );
      connections.push(connection);
      return connection;
    };
    for (const [a, b, k] of springEdges()) link(points[a], points[b], k);
    const triangles = [];
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < columns; x++) {
        if (x && y) {
          const a = (y - 1) * columns + x - 1,
            b = a + 1,
            c = y * columns + x - 1,
            d = c + 1;
          triangles.push(a, c, b, b, c, d);
        }
      }
    const triangleConnections = [];
    for (let i = 0; i < triangles.length; i += 3) {
      const [a, b, c] = triangles.slice(i, i + 3);
      triangleConnections.push(
        edges.get(key(a, b)),
        edges.get(key(b, c)),
        edges.get(key(c, a)),
      );
    }
    return {
      points,
      grid,
      indices: Uint32Array.from(triangles),
      connections,
      triangleConnections: Uint32Array.from(triangleConnections),
    };
  }
  addRope({
    segments = 12,
    length = 12,
    origin = [0, 12, 0],
    width = 0.15,
    endMass = 20,
  } = {}) {
    if (!Number.isInteger(segments) || segments < 1)
      throw Error("segments must be a positive integer");
    positive(length, "length");
    positive(width, "width");
    positive(endMass, "endMass", true);
    const p = vector(origin, 3, "origin"),
      h = length / segments,
      anchor = this.addBox([width, width, width], { mass: 0, position: p }),
      links = [];
    for (let i = 0; i < segments; i++) {
      const b = this.addBox([width, h, width], {
        mass: 1,
        position: [p[0], p[1] - (i + 0.5) * h, p[2]],
      });
      this.addJoint(
        i ? links[i - 1] : anchor,
        b,
        [0, i ? -h / 2 : 0, 0],
        [0, h / 2, 0],
      );
      links.push(b);
    }
    if (endMass) {
      const weight = this.addBox([0.6, 0.6, 0.6], {
        mass: endMass,
        position: [p[0], p[1] - length - 0.3, p[2]],
      });
      this.addJoint(links.at(-1), weight, [0, -h / 2, 0], [0, 0.3, 0]);
      links.push(weight);
    }
    return { anchor, links };
  }
  addRagdoll({ origin = [0, 2, 0], mass = 10 } = {}) {
    const p = vector(origin, 3, "origin");
    positive(mass, "mass");
    const part = (size, at) =>
      this.addBox(size, {
        mass: mass / 10,
        position: at.map((v, i) => v + p[i]),
      });
    const torso = part([0.7, 1.2, 0.35], [0, 2, 0]),
      head = this.addSphere(0.25, {
        mass: mass / 10,
        position: [p[0], p[1] + 2.9, p[2]],
      }),
      bodies = [torso, head];
    this.addJoint(torso, head, [0, 0.6, 0], [0, -0.3, 0]);
    for (const side of [-1, 1]) {
      const upperArm = part([0.3, 0.8, 0.3], [side * 0.5, 1.95, 0]),
        lowerArm = part([0.26, 0.7, 0.26], [side * 0.5, 1.2, 0]);
      this.addJoint(
        torso,
        upperArm,
        [side * 0.35, 0.35, 0],
        [-side * 0.15, 0.4, 0],
      );
      this.addJoint(upperArm, lowerArm, [0, -0.4, 0], [0, 0.35, 0]);
      const upperLeg = part([0.28, 0.8, 0.3], [side * 0.2, 1, 0]),
        lowerLeg = part([0.26, 0.75, 0.28], [side * 0.2, 0.225, 0]);
      this.addJoint(torso, upperLeg, [side * 0.2, -0.6, 0], [0, 0.4, 0]);
      this.addJoint(upperLeg, lowerLeg, [0, -0.4, 0], [0, 0.375, 0]);
      bodies.push(upperArm, lowerArm, upperLeg, lowerLeg);
    }
    return { torso, head, bodies };
  }
  addJoint(
    a,
    b,
    anchorA = [0, 0, 0],
    anchorB = [0, 0, 0],
    {
      linearStiffness = Infinity,
      angularStiffness = 0,
      breakForce = Infinity,
      breakOnPull = false,
    } = {},
  ) {
    this.assertEditable();
    this.checkBodies(a, b);
    for (const v of [linearStiffness, angularStiffness, breakForce])
      if (v !== Infinity) positive(v, "joint stiffness/breakForce", true);
    return this.handle(
      new Joint(
        this.ref,
        a,
        b,
        vector(anchorA, 3, "anchorA"),
        vector(anchorB, 3, "anchorB"),
        linearStiffness,
        angularStiffness,
        breakOnPull && breakForce !== Infinity ? -breakForce : breakForce,
      ),
    );
  }
  addSpring(
    a,
    b,
    anchorA = [0, 0, 0],
    anchorB = [0, 0, 0],
    {
      stiffness = 1000,
      rest = -1,
      breakStrain = Infinity,
      breakForce = Infinity,
    } = {},
  ) {
    this.assertEditable();
    this.checkBodies(a, b);
    if (!a) throw Error("A spring requires two bodies");
    positive(stiffness, "stiffness", true);
    if (rest !== -1) positive(rest, "rest", true);
    const material = springMaterial({ breakStrain, breakForce });
    const force = new Spring(
      this.ref,
      a,
      b,
      vector(anchorA, 3, "anchorA"),
      vector(anchorB, 3, "anchorB"),
      stiffness,
      rest,
    );
    setInitialSpringMaterial(force, material);
    return this.handle(force);
  }
  checkBodies(a, b) {
    if (!b || a === b || !this.bodySet.has(b) || (a && !this.bodySet.has(a)))
      throw Error("Constraint endpoints must be distinct bodies in this scene");
  }
  addMotor(a, b, options = {}) {
    this.assertEditable();
    this.checkBodies(a, b);
    const material = angularConstraintOptions({ ...options, type: "motor" });
    const force = new Joint(this.ref, a, b, [0, 0, 0], [0, 0, 0], Infinity, 0);
    setInitialAngularConstraint(force, material);
    return this.handle(force);
  }
  addHinge(a, b, options = {}) {
    this.assertEditable();
    this.checkBodies(a, b);
    const material = angularConstraintOptions({ ...options, type: "limit" });
    const span = positive(options.span ?? 1, "span");
    const aa = vector(options.anchorA ?? [0, 0, 0], 3, "anchorA"),
      bb = vector(options.anchorB ?? [0, 0, 0], 3, "anchorB");
    const joints = [-1, 1].map((sign) =>
      this.addJoint(
        a,
        b,
        aa.map((v, i) => v + sign * span * 0.5 * material.axisA[i]),
        bb.map((v, i) => v + sign * span * 0.5 * material.axisB[i]),
      ),
    );
    let limit, motor;
    if (options.minAngle !== undefined || options.maxAngle !== undefined) {
      const force = new Joint(
        this.ref,
        a,
        b,
        [0, 0, 0],
        [0, 0, 0],
        Infinity,
        0,
      );
      setInitialAngularConstraint(force, material);
      limit = this.handle(force);
    }
    if (options.motor)
      motor = this.addMotor(a, b, {
        axisA: material.axisA,
        axisB: material.axisB,
        ...options.motor,
      });
    return {
      joints,
      limit,
      motor,
      dispose() {
        for (const c of [...joints, limit, motor]) c?.dispose();
      },
    };
  }
  handle(force) {
    const handle = {
      slot: -1,
      disposed: false,
      dispose: () => {
        if (handle.disposed) return;
        if (!this.gpu) force.destroy();
        else if (!this.gpu.destroyed) this.gpu.releaseJoints([handle.slot]);
        this.handles.delete(force);
        handle.disposed = true;
      },
    };
    handle.destroy = handle.dispose;
    this.handles.set(force, handle);
    return handle;
  }
  createSolver(device, options = {}) {
    this.assertEditable();
    if (this.hulls && device.limits.maxStorageBuffersPerShaderStage < 9)
      throw Error("Hull collisions require nine storage buffer bindings");
    const gpu = new NativeGpuSolver3D(
      device,
      this.ref,
      appGpuSolverOptions(this.ref, {
        ...options,
        ...(this.points
          ? { shaders: { ...options.shaders, solve: clothSolve } }
          : {}),
      }),
    );
    const frames = [];
    this.ref.forces.forEach((force, slot) => {
      this.handles.get(force).slot = slot;
      if (force instanceof Joint && force.stiffnessAng > 0)
        frames.push({ slot });
    });
    gpu.captureConstraintFrames(frames);
    gpu.params.up = [...this.up];
    const filtered = [],
      groups = [],
      masks = [];
    for (const [index, body] of this.ref.bodies.entries()) {
      if (body.group !== 0xffffffff || body.collidesWith !== 0xffffffff) {
        filtered.push(gpu.gpuIndex(index));
        groups.push(body.group);
        masks.push(body.collidesWith);
      }
      if (body.isTrigger) gpu.setSensor(gpu.gpuIndex(index), true);
      if (body.restitution > 0)
        gpu.setRestitution(gpu.gpuIndex(index), body.restitution);
    }
    if (filtered.length) gpu.setFilters(filtered, groups, masks);
    if (options.sleeping || this.sleepOptIn)
      gpu.enableSleeping(
        this.ref,
        options.sleeping === true ? {} : options.sleeping,
      );
    this.gpu = gpu;
    this.created = true;
    return gpu;
  }
}
export class AvbdScene2D {
  constructor(options = {}) {
    this.topology = new SoaSolver2D();
    Object.assign(this.topology.params, parallelParams());
    settings(this.topology.params, options);
    if (options.alpha !== undefined) {
      if (
        !Number.isFinite(options.alpha) ||
        options.alpha < 0 ||
        options.alpha > 1
      )
        throw Error("alpha must be between zero and one");
      this.topology.params.alpha = options.alpha;
    }
    for (const name of ["postStabilize", "matchNearest"])
      if (options[name] !== undefined) {
        if (typeof options[name] !== "boolean")
          throw Error(`${name} must be boolean`);
        this.topology.params[name] = options[name];
      }
  }
  assertEditable() {
    if (this.created)
      throw Error(
        "Build this scene before createSolver; use GPU edit methods afterwards",
      );
  }
  get bodyCount() {
    return this.topology.bodyCount;
  }
  addShape(spec, options = {}) {
    const bodyOptions = spec.options ?? options;
    const index = this.addBox(spec.size, bodyOptions);
    storeShape2D(this.topology, index, spec, bodyOptions.density ?? 1);
    return index;
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
  addBox(
    size,
    {
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
    } = {},
  ) {
    this.assertEditable();
    if (allowSleep !== undefined && typeof allowSleep !== "boolean")
      throw Error("allowSleep must be boolean");
    const s = vector(size, 2, "size");
    s.forEach((v) => positive(v, "size"));
    const p = vector(position, 2, "position");
    if (!Number.isFinite(angle)) throw Error("angle must be finite");
    if (!Number.isFinite(restitution) || restitution < 0 || restitution > 1)
      throw Error("restitution must be between 0 and 1");
    if (typeof isTrigger !== "boolean")
      throw Error("isTrigger must be boolean");
    for (const mask of [group, collidesWith])
      if (!Number.isInteger(mask) || mask < 0 || mask > 0xffffffff)
        throw Error("Collision masks must be unsigned 32-bit integers");
    const index = this.topology.addBody(
      s,
      positive(density, "density", true),
      positive(friction, "friction", true),
      [...p, angle],
      vector(velocity, 3, "velocity"),
    );
    this.restitution ??= new Map();
    if (restitution > 0) this.restitution.set(index, restitution);
    this.sensors ??= new Set();
    if (isTrigger) this.sensors.add(index);
    this.filters ??= new Map();
    if (group !== 0xffffffff || collidesWith !== 0xffffffff)
      this.filters.set(index, [group, collidesWith]);
    this.topology.avbdSleepEligible ??= new Map();
    if (allowSleep !== undefined)
      this.topology.avbdSleepEligible.set(index, allowSleep);
    return index;
  }
  checkBodies(a, b) {
    if (
      !Number.isInteger(a) ||
      !Number.isInteger(b) ||
      a < -1 ||
      a >= this.bodyCount ||
      b < 0 ||
      b >= this.bodyCount ||
      a === b
    )
      throw Error("Invalid 2D constraint endpoints");
  }
  addJoint(
    a,
    b,
    anchorA = [0, 0],
    anchorB = [0, 0],
    { stiffness = [Infinity, Infinity, 0], breakForce = Infinity } = {},
  ) {
    this.assertEditable();
    this.checkBodies(a, b);
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
    const handle = this.topology.addJoint(
      a,
      b,
      vector(anchorA, 2, "anchorA"),
      vector(anchorB, 2, "anchorB"),
      stiffness,
      breakForce,
    );
    return this.constraintHandle(handle.slot, handle);
  }
  constraintHandle(slot, handle = {}) {
    Object.assign(handle, { slot, alive: true, disposed: false });
    handle.dispose = () => {
      if (handle.disposed) return;
      if (this.gpu && !this.gpu.destroyed) this.gpu.disableConstraint(slot);
      else if (!this.gpu)
        this.topology.data.fill(0, slot * CS + STIFF, slot * CS + STIFF + 3);
      handle.alive = false;
      handle.disposed = true;
    };
    handle.destroy = handle.dispose;
    this.topology.handles[slot] = handle;
    return handle;
  }
  addSpring(
    a,
    b,
    anchorA = [0, 0],
    anchorB = [0, 0],
    { stiffness = 1000, rest = 1 } = {},
  ) {
    this.assertEditable();
    this.checkBodies(a, b);
    if (a < 0) throw Error("A spring requires two bodies");
    const slot = this.topology.jointCount;
    this.topology.addSpring(
      a,
      b,
      vector(anchorA, 2, "anchorA"),
      vector(anchorB, 2, "anchorB"),
      positive(stiffness, "stiffness", true),
      positive(rest, "rest", true),
    );
    return this.constraintHandle(slot);
  }
  addMotor(a, b, { speed = 1, maxTorque = 100 } = {}) {
    this.assertEditable();
    this.checkBodies(a, b);
    if (!Number.isFinite(speed)) throw Error("speed must be finite");
    const slot = this.topology.jointCount;
    this.topology.addMotor(a, b, speed, positive(maxTorque, "maxTorque", true));
    return this.constraintHandle(slot);
  }
  addAngularLimit(a, b, options = {}) {
    this.assertEditable();
    this.checkBodies(a, b);
    const limits = angleLimits2D(options);
    const handle = this.topology.addJoint(a, b, [0, 0], [0, 0], [0, 0, 0]);
    defineAngleLimits2D(this.topology, handle.slot, limits);
    const result = this.constraintHandle(handle.slot, handle);
    result.setLimits = (options) => {
      if (result.disposed) throw Error("The angular limit has been disposed");
      if (this.gpu) {
        this.gpu.setAngleLimits(result.slot, options);
      } else
        defineAngleLimits2D(this.topology, result.slot, angleLimits2D(options));
      return result;
    };
    return result;
  }
  addHinge(a, b, anchorA = [0, 0], anchorB = [0, 0], options = {}) {
    this.assertEditable();
    this.checkBodies(a, b);
    const ra = vector(anchorA, 2, "anchorA"),
      rb = vector(anchorB, 2, "anchorB");
    const limits =
      options.minAngle !== undefined || options.maxAngle !== undefined
        ? angleLimits2D(options)
        : null;
    const motor = options.motor;
    if (motor) {
      if (!Number.isFinite(motor.speed ?? 1))
        throw Error("speed must be finite");
      positive(motor.maxTorque ?? 100, "maxTorque", true);
    }
    const joint = this.addJoint(a, b, ra, rb);
    const angularLimit = limits ? this.addAngularLimit(a, b, limits) : null;
    const motorHandle = motor ? this.addMotor(a, b, motor) : null;
    const hinge = {
      joint,
      limits: angularLimit,
      motor: motorHandle,
      disposed: false,
      dispose() {
        if (this.disposed) return;
        this.joint.dispose();
        this.limits?.dispose();
        this.motor?.dispose();
        this.disposed = true;
      },
      destroy() {
        this.dispose();
      },
    };
    return hinge;
  }
  createSolver(device, options = {}) {
    this.assertEditable();
    const gpu = new GpuSolver2D(device, this.topology, options);
    for (const [index, value] of this.restitution ?? [])
      gpu.setRestitution(index, value);
    for (const index of this.sensors ?? []) gpu.setSensor(index, true);
    for (const [index, values] of this.filters ?? [])
      gpu.setFilters([index], [values[0]], [values[1]]);
    this.gpu = gpu;
    this.created = true;
    return gpu;
  }
}
