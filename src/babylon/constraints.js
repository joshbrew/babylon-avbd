import {
  Joint,
  Spring,
} from "../../reference/three-avbd/src/avbd3d/ref/forces.ts";
import {
  setInitialSpringMaterial,
  springMaterial,
} from "../gpu/springMaterial.js";
import {
  angularConstraintOptions,
  setInitialAngularConstraint,
} from "../gpu/angularConstraints.js";

function vector(value, name) {
  const v =
    value && typeof value.x === "number"
      ? [value.x, value.y, value.z]
      : Array.from(value);
  if (v.length !== 3 || !v.every(Number.isFinite))
    throw Error(`${name} requires three finite components`);
  return v;
}
function stiffness(value, name) {
  if (value !== Infinity && (!Number.isFinite(value) || value < 0))
    throw Error(`${name} must be nonnegative or Infinity`);
  return value;
}
// Anchors follow Babylon mesh-local coordinates, even when a convex collider's
// centre and principal inertia frame differ from its visible mesh's frame.
function anchor(body, value) {
  const v = vector(value, "anchor");
  if (!body) return v;
  const a = body.aggregate,
    V = a.mesh.position.constructor;
  return new V(...v)
    .subtract(a.localCenter)
    .applyRotationQuaternion(a.localRotation.conjugate())
    .asArray();
}
export class AvbdPhysicsConstraint {
  constructor(world, a, b, options = {}) {
    world.assertAlive();
    for (const body of [a, b])
      if (body) {
        body.assertAlive();
        if (body.aggregate.world !== world)
          throw Error("Constraint bodies must belong to this world");
      }
    if (!b || a === b)
      throw Error("A constraint needs a body B and distinct endpoints");
    const type = options.type ?? "ball";
    if (!["ball", "fixed", "spring", "motor", "limit"].includes(type))
      throw Error(
        "Constraint type must be ball, fixed, spring, motor or limit",
      );
    if (type === "spring" && !a)
      throw Error(
        "A spring requires two bodies; use a static aggregate for a world anchor",
      );
    this.world = world;
    this.bodyA = a;
    this.bodyB = b;
    this.type = type;
    if (type === "motor" || type === "limit") {
      const axis = (body, v) =>
        body
          ? new body.aggregate.mesh.position.constructor(...vector(v, "axis"))
              .applyRotationQuaternion(body.aggregate.localRotation.conjugate())
              .asArray()
          : vector(v, "axis");
      this.angularMaterial = angularConstraintOptions({
        ...options,
        type,
        axisA: axis(a, options.axisA ?? [0, 1, 0]),
        axisB: axis(b, options.axisB ?? [0, 1, 0]),
      });
    }
    this.anchorA = anchor(a, options.anchorA ?? [0, 0, 0]);
    this.anchorB = anchor(b, options.anchorB ?? [0, 0, 0]);
    this.linear =
      type === "spring"
        ? stiffness(options.stiffness ?? 1000, "stiffness")
        : stiffness(options.stiffness ?? Infinity, "stiffness");
    this.angular =
      type === "fixed"
        ? stiffness(options.angularStiffness ?? Infinity, "angularStiffness")
        : 0;
    this.breakForce = stiffness(options.breakForce ?? Infinity, "breakForce");
    if (this.breakForce === 0) throw Error("breakForce must be positive");
    this.material = springMaterial({
      breakForce: this.breakForce,
      breakStrain: options.breakStrain,
    });
    if (type !== "spring" && options.breakStrain !== undefined)
      throw Error("breakStrain applies to springs only");
    this.breakOnPull = options.breakOnPull ?? false;
    this.rest = options.rest;
    if (
      this.rest !== undefined &&
      (!Number.isFinite(this.rest) || this.rest < 0)
    )
      throw Error("Spring rest length must be nonnegative and finite");
    if (type === "spring" && !Number.isFinite(this.linear))
      throw Error("Spring stiffness must be finite");
    if (world.gpu) {
      world.flushCommands();
      this.attach();
    } else
      this.force =
        type === "spring"
          ? new Spring(
              world.ref,
              a.aggregate.rigid,
              b.aggregate.rigid,
              this.anchorA,
              this.anchorB,
              this.linear,
              this.rest ?? -1,
            )
          : new Joint(
              world.ref,
              a?.aggregate.rigid ?? null,
              b.aggregate.rigid,
              this.anchorA,
              this.anchorB,
              this.linear,
              this.angular,
              this.breakForce,
            );
    if (this.force && type === "spring")
      setInitialSpringMaterial(this.force, this.material);
    if (this.force && this.angularMaterial)
      setInitialAngularConstraint(this.force, this.angularMaterial);
    world.constraints.add(this);
    world.wakeAll?.();
  }
  attach(slot, capture = true) {
    const gpu = this.world.gpu;
    if (slot !== undefined) this.slot = slot;
    else if (this.type === "spring")
      [this.slot] = gpu.appendSprings([
        {
          a: this.bodyA.gpuIndex,
          b: this.bodyB.gpuIndex,
          rA: this.anchorA,
          rB: this.anchorB,
          stiffness: this.linear,
          rest: this.rest ?? 0,
        },
      ]);
    else
      this.slot = gpu.appendJoint(
        this.bodyA?.gpuIndex ?? -1,
        this.bodyB.gpuIndex,
        this.anchorA,
        this.anchorB,
        this.linear,
        this.angular,
      );
    if (this.angularMaterial)
      gpu.setAngularConstraint(this.slot, this.angularMaterial);
    if (
      this.type === "spring" &&
      (Number.isFinite(this.material.breakStrain) ||
        Number.isFinite(this.material.breakForce))
    )
      gpu.setSpringMaterial(this.slot, this.material);
    if (this.type !== "spring" && Number.isFinite(this.breakForce)) {
      const force = Number.isFinite(this.breakForce) ? this.breakForce : 1e30;
      gpu.device.queue.writeBuffer(
        gpu.jointBuffer,
        (this.slot * 32 + 11) * 4,
        new Float32Array([this.breakOnPull ? -force : force]),
      );
    }
    if (
      capture &&
      (this.type === "fixed" ||
        (this.type === "spring" && this.rest === undefined))
    )
      gpu.captureConstraintFrames([
        { slot: this.slot, spring: this.type === "spring" },
      ]);
  }
  assertAlive() {
    this.world.assertAlive();
    if (this.disposed) throw Error("Constraint is disposed");
  }
  setWorldAnchor(value) {
    this.assertAlive();
    if (this.bodyA || this.type === "spring")
      throw Error("Only world-anchored joints have a movable world anchor");
    this.anchorA = vector(value, "world anchor");
    if (this.world.gpu) this.world.gpu.setWorldAnchor(this.slot, this.anchorA);
    else this.force.rA.set(this.anchorA);
    this.world.wakeAll?.();
    return this;
  }
  async readState() {
    this.assertAlive();
    this.world.initialize();
    const gpu = this.world.gpu,
      d = this.world.device,
      staging = d.createBuffer({
        size: 128,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    try {
      const encoder = d.createCommandEncoder();
      encoder.copyBufferToBuffer(
        gpu.jointBuffer,
        this.slot * 128,
        staging,
        0,
        128,
      );
      d.queue.submit([encoder.finish()]);
      await staging.mapAsync(GPUMapMode.READ);
      const data = new Float32Array(staging.getMappedRange().slice(0));
      return {
        broken: data[3] === 0 && data[7] === 0,
        linearForce: Array.from(data.subarray(8, 11)),
        angularForce: Array.from(data.subarray(12, 15)),
      };
    } finally {
      staging.destroy();
    }
  }
  setMotor(options) {
    this.assertAlive();
    if (this.type !== "motor")
      throw Error("setMotor requires a motor constraint");
    this.angularMaterial = angularConstraintOptions({
      ...this.angularMaterial,
      ...options,
    });
    if (this.world.gpu) this.world.gpu.setMotor(this.slot, options);
    else setInitialAngularConstraint(this.force, this.angularMaterial);
    this.world.wakeAll();
    return this;
  }
  dispose() {
    if (this.disposed) return;
    if (!this.world.disposed) {
      if (this.world.gpu) this.world.gpu.releaseJoints([this.slot]);
      else this.force.destroy();
      this.world.wakeAll?.();
    }
    this.world.constraints.delete(this);
    this.disposed = true;
  }
}

/** Two ball anchors constrain the axis; AVBD angular rows optionally stop/drive twist. */
export class AvbdPhysicsHinge {
  constructor(world, a, b, options = {}) {
    const material = angularConstraintOptions({ ...options, type: "limit" });
    const span = options.span ?? 1;
    if (!Number.isFinite(span) || span <= 0)
      throw Error("Hinge span must be positive");
    const aa = vector(options.anchorA ?? [0, 0, 0], "anchorA"),
      bb = vector(options.anchorB ?? [0, 0, 0], "anchorB");
    if (options.motor)
      angularConstraintOptions({
        ...options.motor,
        type: "motor",
        axisA: material.axisA,
        axisB: material.axisB,
      });
    this.world = world;
    this.bodyA = a;
    this.bodyB = b;
    this.disposed = false;
    this.joints = [-1, 1].map((sign) =>
      world.addJoint(a, b, {
        anchorA: aa.map((v, i) => v + sign * span * 0.5 * material.axisA[i]),
        anchorB: bb.map((v, i) => v + sign * span * 0.5 * material.axisB[i]),
        stiffness: options.stiffness ?? Infinity,
      }),
    );
    if (options.minAngle !== undefined || options.maxAngle !== undefined)
      this.limit = world.addConstraint(a, b, { ...material, type: "limit" });
    if (options.motor)
      this.motor = world.addMotor(a, b, {
        axisA: material.axisA,
        axisB: material.axisB,
        ...options.motor,
      });
  }
  dispose() {
    if (this.disposed) return;
    for (const c of [...this.joints, this.limit, this.motor]) c?.dispose();
    this.disposed = true;
  }
}
