import { Manifold } from "../../../reference/three-avbd/src/avbd3d/ref/manifold.ts";
import {
  Force,
  COLLISION_MARGIN,
  PENALTY_MIN,
  PENALTY_MAX,
} from "../../../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  Joint,
  Spring,
} from "../../../reference/three-avbd/src/avbd3d/ref/forces.ts";
import {
  vec3,
  quat,
  qmul,
  qinverse,
  qsub,
  rotateInv,
} from "../../../reference/three-avbd/src/avbd3d/ref/math.ts";
import { initialAngularConstraint } from "../../gpu/angularConstraints.js";
import { initialSpringMaterial } from "../../gpu/springMaterial.js";
import {
  isSphere,
  hullOf,
} from "../../../reference/three-avbd/src/avbd3d/shapes.ts";
import { isCapsule } from "../../gpu/capsuleShape.js";
import {
  collideCpu3D,
  geometry3D,
  add,
  sub,
  scale,
  dot,
  cross,
  unit,
  turn,
  world,
} from "./cpuContacts3D.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const basisVector = (basis, v) => [
  dot(basis.slice(0, 3), v),
  dot(basis.slice(3, 6), v),
  dot(basis.slice(6, 9), v),
];
export function captureCpuFrame3D(force, spring = false) {
  if (spring) {
    force.rest = Math.hypot(
      ...sub(world(force.bodyA, force.rA), world(force.bodyB, force.rB)),
    );
    return;
  }
  const qa = force.bodyA?.positionAng ?? [0, 0, 0, 1];
  force.cpuRest = qmul(quat(), qinverse(quat(), qa), force.bodyB.positionAng);
  force.evaluateAng = (out) => {
    const target = qmul(
      quat(),
      force.bodyA?.positionAng ?? [0, 0, 0, 1],
      force.cpuRest,
    );
    qsub(out, target, force.bodyB.positionAng);
    for (let i = 0; i < 3; i++) out[i] *= force.torqueArm;
    return out;
  };
}
export class CpuManifold3D extends Manifold {
  initialize() {
    const a = this.bodyA,
      b = this.bodyB;
    if (
      !((a.group ?? 0xffffffff) & (b.collidesWith ?? 0xffffffff)) ||
      !((b.group ?? 0xffffffff) & (a.collidesWith ?? 0xffffffff))
    )
      return false;
    const old = this.contacts;
    const rolling = isSphere(a) || isSphere(b) || isCapsule(a) || isCapsule(b);
    this.friction = Math.sqrt(a.friction * b.friction);
    this.contacts = collideCpu3D(
      a,
      b,
      this.basis,
      this.solver.cpuGeometry.get(a),
      this.solver.cpuGeometry.get(b),
    ).map((c) => {
      const prev = old.find((o) => o.feature === c.feature);
      return {
        feature: c.feature,
        rA: prev?.stick && !rolling ? prev.rA : c.rA,
        rB: prev?.stick && !rolling ? prev.rB : c.rB,
        C0: vec3(),
        penalty: prev ? prev.penalty.slice() : vec3(),
        lambda: prev ? prev.lambda.slice() : vec3(),
        stick: prev?.stick ?? false,
      };
    });
    for (const c of this.contacts) {
      c.C0.set(basisVector(this.basis, sub(world(a, c.rA), world(b, c.rB))));
      c.C0[0] += COLLISION_MARGIN;
      for (let i = 0; i < 3; i++) {
        c.lambda[i] *= this.solver.alpha * this.solver.gamma;
        c.penalty[i] = clamp(
          c.penalty[i] * this.solver.gamma,
          PENALTY_MIN,
          PENALTY_MAX,
        );
      }
      if (this.solver.massPenalty !== false) {
        const mass = Math.min(
          a.mass > 0 ? a.mass : Infinity,
          b.mass > 0 ? b.mass : Infinity,
        );
        c.penalty[0] = Math.max(
          c.penalty[0],
          clamp(mass / this.solver.dt ** 2, PENALTY_MIN, PENALTY_MAX),
        );
      }
    }
    return this.contacts.length > 0;
  }
  updatePrimal(...args) {
    if (!this.bodyA.isTrigger && !this.bodyB.isTrigger)
      super.updatePrimal(...args);
  }
  updateDual(...args) {
    if (!this.bodyA.isTrigger && !this.bodyB.isTrigger)
      super.updateDual(...args);
  }
}

// Angular AVBD rows use the same axes, error correction, penalty ramp and
// torque bounds as angularConstraints.js. No pose clamping is applied.
class CpuAngularForce extends Force {
  constructor(solver, source, options) {
    super(solver, source.bodyA, source.bodyB);
    this.options = { ...options };
    this.pen = [PENALTY_MIN, PENALTY_MIN];
    this.lam = [0, 0];
    this.source = source;
    const axis = options.axisA;
    this.ta = unit(
      Math.abs(axis[0]) > Math.abs(axis[2])
        ? [-axis[1], axis[0], 0]
        : [0, -axis[2], axis[1]],
    );
    const w = this.bodyA ? turn(this.bodyA.positionAng, this.ta) : this.ta;
    let tb = Array.from(rotateInv(vec3(), this.bodyB.positionAng, w));
    tb = sub(tb, scale(options.axisB, dot(tb, options.axisB)));
    this.tb = unit(tb);
  }
  frame() {
    const axis = this.bodyA
        ? turn(this.bodyA.positionAng, this.options.axisA)
        : this.options.axisA,
      ta = this.bodyA ? turn(this.bodyA.positionAng, this.ta) : this.ta,
      tb = turn(this.bodyB.positionAng, this.tb);
    return { axis, angle: Math.atan2(dot(axis, cross(ta, tb)), dot(ta, tb)) };
  }
  initialize() {
    const angle = this.frame().angle;
    this.c0 =
      this.options.type === "motor"
        ? [angle, 0]
        : [
            Math.min(0, angle - this.options.minAngle),
            Math.max(0, angle - this.options.maxAngle),
          ];
    for (let i = 0; i < 2; i++) {
      this.lam[i] *= this.solver.alpha * this.solver.gamma;
      this.pen[i] = clamp(
        this.pen[i] * this.solver.gamma,
        PENALTY_MIN,
        PENALTY_MAX,
      );
    }
    return !this.source.broken;
  }
  evaluate(alpha) {
    const { angle } = this.frame(),
      o = this.options;
    const c =
      o.type === "motor"
        ? [
            Math.atan2(
              Math.sin(angle - this.c0[0]),
              Math.cos(angle - this.c0[0]),
            ) -
              o.speed * this.solver.dt,
            0,
          ]
        : [
            angle - o.minAngle - alpha * this.c0[0],
            angle - o.maxAngle - alpha * this.c0[1],
          ];
    const f = c.map((v, i) => this.pen[i] * v + this.lam[i]);
    return {
      c,
      f:
        o.type === "motor"
          ? [clamp(f[0], -o.maxTorque, o.maxTorque), 0]
          : [Math.min(0, f[0]), Math.max(0, f[1])],
    };
  }
  updatePrimal(body, alpha, sys) {
    const { f } = this.evaluate(alpha),
      o = this.options;
    if (o.type === "motor" && o.maxTorque === 0) return;
    const axis = scale(this.frame().axis, body === this.bodyA ? -1 : 1);
    for (let r = 0; r < (o.type === "motor" ? 1 : 2); r++) {
      if (o.type === "limit" && f[r] === 0) continue;
      for (let i = 0; i < 3; i++) {
        sys.rhsAng[i] += axis[i] * f[r];
        for (let j = 0; j < 3; j++)
          sys.lhsAng[i * 3 + j] += axis[i] * axis[j] * this.pen[r];
      }
    }
  }
  updateDual(alpha) {
    const { c, f } = this.evaluate(alpha);
    this.lam = f;
    for (let i = 0; i < 2; i++)
      this.pen[i] = Math.min(
        PENALTY_MAX,
        this.pen[i] +
          this.solver.betaAng *
            (this.options.type === "motor"
              ? Math.abs(c[i])
              : i === 0
                ? Math.max(0, -c[i])
                : Math.max(0, c[i])),
      );
  }
}
export function prepareCpuForces3D(solver) {
  if (!solver.cpuPrepared) {
    solver.cpuPrepared = true;
    for (const force of [...solver.forces]) {
      const angular = initialAngularConstraint(force);
      if (angular) {
        force.unlinkFromBodies();
        solver.forces.splice(solver.forces.indexOf(force), 1);
        force.cpuAngular = new CpuAngularForce(solver, force, angular);
        continue;
      }
      if (force instanceof Joint && force.stiffnessAng > 0) {
        captureCpuFrame3D(force);
      }
      if (force instanceof Spring) {
        const initialize = force.initialize.bind(force);
        force.initialize = () => {
          if (force.broken) return false;
          const material = initialSpringMaterial(force);
          if (material) {
            const extension = Math.max(
              0,
              Math.hypot(
                ...sub(
                  world(force.bodyA, force.rA),
                  world(force.bodyB, force.rB),
                ),
              ) - force.rest,
            );
            if (
              extension / Math.max(force.rest, 1e-6) > material.breakStrain ||
              extension * force.stiffness > material.breakForce
            ) {
              force.broken = true;
              return false;
            }
          }
          return initialize();
        };
      }
    }
  }
}
export function cpuBroadphase3D(solver) {
  const bodies = solver.bodies;
  solver.cpuGeometry = new Map();
  for (const b of bodies)
    if (isSphere(b) || isCapsule(b) || hullOf(b))
      solver.cpuGeometry.set(b, geometry3D(b));
  const radii = bodies
      .filter((b) => b.mass > 0)
      .slice(0, 1024)
      .map((b) => b.radius)
      .sort((a, b) => a - b),
    cell = Math.max(0.1, (radii[Math.floor(radii.length / 2)] ?? 1) * 2);
  const bins = new Map(),
    large = [],
    seen = new Set();
  const pair = (a, b) => {
    if (a === b || (bodies[a].mass <= 0 && bodies[b].mass <= 0)) return;
    const hi = Math.max(a, b),
      lo = Math.min(a, b),
      key = hi * bodies.length + lo;
    if (seen.has(key)) return;
    seen.add(key);
    const A = bodies[hi],
      B = bodies[lo];
    if (
      !((A.group ?? 0xffffffff) & (B.collidesWith ?? 0xffffffff)) ||
      !((B.group ?? 0xffffffff) & (A.collidesWith ?? 0xffffffff))
    )
      return;
    const r = A.radius + B.radius;
    if (
      dot(
        sub(A.positionLin, B.positionLin),
        sub(A.positionLin, B.positionLin),
      ) <=
        r * r &&
      !A.constrainedTo(B)
    )
      new CpuManifold3D(solver, A, B);
  };
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i],
      lo = b.positionLin.map((v) => Math.floor((v - b.radius) / cell)),
      hi = b.positionLin.map((v) => Math.floor((v + b.radius) / cell));
    if ((hi[0] - lo[0] + 1) * (hi[1] - lo[1] + 1) * (hi[2] - lo[2] + 1) > 128) {
      large.push(i);
      continue;
    }
    for (let x = lo[0]; x <= hi[0]; x++)
      for (let y = lo[1]; y <= hi[1]; y++)
        for (let z = lo[2]; z <= hi[2]; z++) {
          const key = `${x},${y},${z}`,
            list = bins.get(key) ?? [];
          for (const j of list) pair(i, j);
          list.push(i);
          bins.set(key, list);
        }
  }
  for (const i of large) for (let j = 0; j < bodies.length; j++) pair(i, j);
}
