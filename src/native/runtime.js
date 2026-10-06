import { BodyReadback } from "../gpu/bodyReadback.js";
import { CommandStaging } from "../gpu/bodyCommands2D.js";
import { VelocityBatch, MotionBatch } from "./velocityBatch.js";

const mask = (v) => {
  if (!Number.isInteger(v) || v < 0 || v > 0xffffffff)
    throw Error("Collision masks must be unsigned 32-bit integers");
  return v;
};
export function components(value, count, name) {
  const a =
    value && typeof value.x === "number"
      ? [
          value.x,
          value.y,
          ...(count >= 3 ? [value.z] : []),
          ...(count === 4 ? [value.w] : []),
        ]
      : Array.isArray(value) ||
          (ArrayBuffer.isView(value) && !(value instanceof DataView))
        ? value
        : Array.from(value ?? []);
  if (a.length !== count || !a.every(Number.isFinite))
    throw Error(`${name} requires ${count} finite components`);
  return a;
}

const editKeys = [
  "linearVelocity",
  "angularVelocity",
  "impulse",
  "force",
  "",
  "angularImpulse",
  "torque",
];
/** Validate a whole batch before changing the pending command queue. No body handles required. */
function editBodies(edits, dimension) {
  if (this.destroyed) throw Error("The solver has been destroyed");
  const active = this.editInProgress;
  const commands = active
    ? new CommandStaging()
    : (this.editStaging ??= new CommandStaging());
  this.editInProgress = true;
  try {
    return stageEdits.call(this, edits, dimension, commands);
  } finally {
    this.editInProgress = active;
  }
}
function stageEdits(edits, dimension, commands) {
  commands.count = 0;
  let properties;
  const angular = (v, name) => {
    if (dimension === 3) return components(v, 3, name);
    if (!Number.isFinite(v)) throw Error(`${name} must be finite`);
    return [v, 0, 0];
  };
  for (const edit of edits) {
    const index = this.bodyIndex(edit.body);
    const { isTrigger, restitution, group, collidesWith, allowSleep } = edit;
    if (
      isTrigger !== undefined ||
      restitution !== undefined ||
      group !== undefined ||
      collidesWith !== undefined ||
      allowSleep !== undefined
    ) {
      if (isTrigger !== undefined && typeof isTrigger !== "boolean")
        throw Error("isTrigger must be a boolean");
      if (allowSleep !== undefined && typeof allowSleep !== "boolean")
        throw Error("allowSleep must be a boolean");
      if (
        restitution !== undefined &&
        (!Number.isFinite(restitution) || restitution < 0 || restitution > 1)
      )
        throw Error("restitution must be between 0 and 1");
      if (collidesWith !== undefined && group === undefined)
        throw Error("A collision-mask edit requires group as well");
      if (group !== undefined) mask(group);
      if (collidesWith !== undefined) mask(collidesWith);
      (properties ??= []).push({
        index,
        isTrigger: isTrigger,
        restitution: restitution,
        group: group,
        collidesWith: collidesWith ?? 0xffffffff,
        allowSleep: allowSleep,
      });
    }
    const point =
      edit.worldPoint === undefined
        ? undefined
        : components(edit.worldPoint, dimension, "worldPoint");
    // Documented order: teleport, replace velocities, then add impulses and forces.
    if (edit.position !== undefined) {
      const p = components(edit.position, dimension, "position");
      let q;
      if (edit.rotation !== undefined) {
        q =
          dimension === 3
            ? components(edit.rotation, 4, "rotation")
            : [edit.rotation];
        if (dimension === 3) {
          const l = Math.hypot(...q);
          if (!l) throw Error("rotation must be nonzero");
          q = q.map((v) => v / l);
        } else if (!Number.isFinite(edit.rotation))
          throw Error("angle must be finite");
      }
      commands.append(
        index,
        4,
        p,
        dimension === 3 ? q : undefined,
        q !== undefined,
      );
      if (dimension === 2)
        commands.words[(commands.count - 1) * 12 + 6] = q?.[0] ?? 0;
    } else if (edit.rotation !== undefined)
      throw Error(
        "A rotation edit requires position; use teleport for a full pose",
      );
    for (let kind = 0; kind < editKeys.length; kind++) {
      if (kind === 4) continue;
      const key = editKeys[kind];
      if (edit[key] === undefined) continue;
      const isAngular = kind === 1 || kind >= 5;
      const v = isAngular
        ? angular(edit[key], key)
        : components(edit[key], dimension, key);
      commands.append(
        index,
        kind,
        v,
        kind === 2 || kind === 3 ? point : undefined,
        (kind === 2 || kind === 3) && point !== undefined,
      );
      if (kind === 3 || kind === 6)
        commands.words[(commands.count - 1) * 12 + 7] = this.params.dt;
    }
  }
  if (this.destroyed)
    throw Error("The solver was destroyed while reading body edits");
  if (commands.count) this.prepareBodyCommands().enqueueValidated(commands);
  for (const p of properties ?? []) {
    if (p.isTrigger !== undefined) this.setSensor(p.index, p.isTrigger);
    if (p.restitution !== undefined)
      this.setRestitution(p.index, p.restitution);
    if (p.group !== undefined)
      this.setFilters([p.index], [p.group], [p.collidesWith]);
    if (p.allowSleep !== undefined) this.setSleepEnabled(p.index, p.allowSleep);
  }
  return this;
}
/** Allocated only for bodies explicitly requested by the application. */
class NativeBody {
  constructor(solver, index) {
    this.solver = solver;
    this.index = index;
  }
  get gpuIndex() {
    this.solver.liveIndex(this.index);
    return this.index;
  }
  setLinearVelocity(v) {
    this.solver.setLinearVelocity(this.gpuIndex, v);
    return this;
  }
  setAngularVelocity(v) {
    this.solver.setAngularVelocity(this.gpuIndex, v);
    return this;
  }
  applyImpulse(v, p) {
    this.solver.applyImpulse(this.gpuIndex, v, p);
    return this;
  }
  applyForce(v, p) {
    this.solver.applyForce(this.gpuIndex, v, p);
    return this;
  }
  applyAngularImpulse(v) {
    this.solver.applyAngularImpulse(this.gpuIndex, v);
    return this;
  }
  applyTorque(v) {
    this.solver.applyTorque(this.gpuIndex, v);
    return this;
  }
  teleport(p, r) {
    this.solver.teleport(this.gpuIndex, p, r);
    return this;
  }
  setTrigger(enabled) {
    this.solver.setSensor(this.gpuIndex, enabled);
    this.solver.wakeAll();
    return this;
  }
  setRestitution(value) {
    this.solver.setRestitution(this.gpuIndex, value);
    this.solver.wakeAll();
    return this;
  }
  setCollisionGroups(group, collidesWith = 0xffffffff) {
    this.solver.setFilters(
      [this.gpuIndex],
      [mask(group)],
      [mask(collidesWith)],
    );
    this.solver.wakeAll();
    return this;
  }
  setSleepEnabled(enabled) {
    this.solver.setSleepEnabled(this.gpuIndex, enabled);
    return this;
  }
  wakeUp() {
    this.solver.liveIndex(this.index);
    this.solver.wakeAll();
    return this;
  }
  readState() {
    return this.solver.readBodyState(this.gpuIndex);
  }
}
function stepSettings(solver, { maxSubSteps = 6, maxFrameTime = 0.05 } = {}) {
  if (
    !Number.isInteger(maxSubSteps) ||
    maxSubSteps < 1 ||
    !Number.isFinite(maxFrameTime) ||
    maxFrameTime <= 0
  )
    throw Error("Stepping limits must be positive");
  const dt = solver.params.dt;
  if (!Number.isFinite(dt) || dt <= 0)
    throw Error("Simulation timestep must be positive and finite");
  return { dt, maxSubSteps, maxFrameTime };
}
function advanceSteps(solver, elapsed, options, afterStep) {
  if (solver.destroyed) throw Error("The solver has been destroyed");
  if (!Number.isFinite(elapsed) || elapsed < 0)
    throw Error("elapsed must be finite nonnegative seconds");
  const { dt, maxSubSteps, maxFrameTime } = stepSettings(solver, options);
  solver.timeAccumulator = Math.min(
    maxSubSteps * dt,
    (solver.timeAccumulator ?? 0) + Math.min(maxFrameTime, elapsed),
  );
  let count = 0;
  while (solver.timeAccumulator + 1e-12 >= dt && count < maxSubSteps) {
    solver.step();
    solver.timeAccumulator = Math.max(0, solver.timeAccumulator - dt);
    count++;
    afterStep?.(solver);
  }
  return count;
}
export function advance(elapsed, options) {
  return advanceSteps(this, elapsed, options);
}
export function attachToScene(scene, { afterStep, ...options } = {}) {
  if (this.destroyed) throw Error("The solver has been destroyed");
  if (
    !scene?.onBeforeRenderObservable?.add ||
    !scene?.onDisposeObservable?.addOnce ||
    !scene?.getEngine
  )
    throw Error("A Babylon scene is required");
  if (afterStep !== undefined && typeof afterStep !== "function")
    throw Error("afterStep must be a function");
  // Validate options before registering observers.
  stepSettings(this, options);
  if (this.sceneBinding) {
    if (this.sceneBinding.scene === scene) return this;
    throw Error("The solver is already attached to another scene");
  }
  const before = scene.onBeforeRenderObservable.add(() => {
    advanceSteps(
      this,
      Math.max(0, scene.getEngine().getDeltaTime() / 1000),
      options,
      afterStep,
    );
  });
  const dispose = scene.onDisposeObservable.addOnce(() => this.destroy());
  this.sceneBinding = { scene, before, dispose };
  return this;
}
export function detachFromScene() {
  const b = this.sceneBinding;
  if (b) {
    b.scene.onBeforeRenderObservable.remove(b.before);
    b.scene.onDisposeObservable.remove(b.dispose);
    this.sceneBinding = null;
    this.timeAccumulator = 0;
  }
  return this;
}

export function installNativeRuntime(gpu, scene, dimension) {
  gpu.advance = advance;
  let handles, indices;
  gpu.bodyIndex = function (bodyOrIndex) {
    if (this.destroyed) throw Error("The solver has been destroyed");
    let index = bodyOrIndex;
    if (bodyOrIndex instanceof NativeBody) {
      if (bodyOrIndex.solver !== this)
        throw Error("Body belongs to another solver");
      return bodyOrIndex.gpuIndex;
    }
    if (typeof index !== "number" && dimension === 3) {
      if (!indices) {
        indices = new WeakMap();
        scene.bodies.forEach((body, i) => indices.set(body, this.gpuIndex(i)));
      }
      index = indices.get(bodyOrIndex);
    }
    this.liveIndex(index);
    return index;
  };
  gpu.body = function (bodyOrIndex) {
    const index = this.bodyIndex(bodyOrIndex);
    handles ??= new Map();
    if (!handles.has(index)) handles.set(index, new NativeBody(this, index));
    return handles.get(index);
  };
  gpu.editBodies = function (edits) {
    return editBodies.call(this, edits, dimension);
  };
  gpu.setLinearVelocities = function (indices, values) {
    if (this.destroyed) throw Error("The solver has been destroyed");
    this.velocityBatch ??= new VelocityBatch(this, dimension);
    this.velocityBatch.set(indices, values);
    return this;
  };
  gpu.setVelocities = function (indices, values) {
    if (this.destroyed) throw Error("The solver has been destroyed");
    if (values?.angular === undefined && values?.linear !== undefined)
      return this.setLinearVelocities(indices, values.linear);
    if (values?.linear === undefined && values?.angular !== undefined)
      return this.setAngularVelocities(indices, values.angular);
    this.motionBatch ??= new MotionBatch(this, dimension);
    this.motionBatch.set(indices, values);
    return this;
  };
  gpu.setAngularVelocities = function (indices, values) {
    if (this.destroyed) throw Error("The solver has been destroyed");
    this.angularVelocityBatch ??= new VelocityBatch(this, dimension, "angular");
    this.angularVelocityBatch.set(indices, values);
    return this;
  };
  const destroy = gpu.destroy;
  gpu.destroy = function () {
    if (this.destroyed) return;
    this.velocityBatch?.destroy();
    this.angularVelocityBatch?.destroy();
    this.motionBatch?.destroy();
    this.bodyReadback?.destroy();
    this.editStaging = null;
    destroy.call(this);
    handles?.clear();
    indices = null;
    scene = null;
  };
  if (dimension === 2)
    gpu.readSelectedBodies = function (indices, { posesOnly = false } = {}) {
      const selected =
        indices instanceof Uint32Array ? indices : Array.from(indices);
      selected.forEach((i) => this.liveIndex(i));
      this.flushEdits();
      this.bodyReadback ??= new BodyReadback(this.device);
      return this.bodyReadback.read(this.bodyBuffer, selected, posesOnly, 6);
    };
  return gpu;
}
