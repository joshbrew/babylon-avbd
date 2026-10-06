import type { Vector3, Quaternion } from "@babylonjs/core/Maths/math.vector.js";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
import type { Scene } from "@babylonjs/core/scene.js";
import type { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin.js";
export const AvbdShapeType: Readonly<{
  BOX: "box";
  SPHERE: "sphere";
  CAPSULE: "capsule";
  CYLINDER: "cylinder";
  CONVEX_HULL: "convex-hull";
}>;
export type AvbdShape = (typeof AvbdShapeType)[keyof typeof AvbdShapeType];
export type AvbdSolverMode = "auto" | "standard" | "optimized" | "points";
export interface AvbdSolverDecision {
  requested: AvbdSolverMode;
  selected: Exclude<AvbdSolverMode, "auto"> | "custom";
  reason: string;
  bodyCount: number;
  constraintCount: number;
}
export interface AvbdWorldOptions {
  device?: GPUDevice;
  scene?: Scene;
  gravity?: Vector3 | readonly [number, number, number];
  /** Attach fixed-step simulation and disposal to the scene. Defaults to true. */
  autoAttach?: boolean;
  timeStep?: number;
  iterations?: number;
  capacity?: number;
  syncMeshes?: boolean;
  maxSyncedBodies?: number;
  broadphase?: "auto" | "grid" | "hploc";
  solverMode?: AvbdSolverMode;
  bvh?: { rebuildInterval?: number };
  /** Optional conservative GPU sleeping. Impacts and edits wake the world. */
  sleeping?: boolean | { speedThreshold?: number; timeThreshold?: number };
  maxContactPairs?: number;
  maxContactEvents?: number;
}
export interface AvbdAggregateOptions {
  mass?: number;
  friction?: number;
  /** Bounce coefficient 0..1; pair uses the larger coefficient. Defaults to 0. */
  restitution?: number;
  /** Defaults to true when world sleeping is enabled. Explicit true enables sleeping. */
  allowSleep?: boolean;
  isTrigger?: boolean;
  sync?: boolean;
  group?: number;
  collidesWith?: number;
}
export type AvbdVector = Vector3 | readonly [number, number, number];
export interface AvbdConstraintOptions {
  type?: "ball" | "fixed" | "spring" | "motor" | "limit";
  axisA?: AvbdVector;
  axisB?: AvbdVector;
  speed?: number;
  maxTorque?: number;
  minAngle?: number;
  maxAngle?: number;
  anchorA?: AvbdVector;
  anchorB?: AvbdVector;
  stiffness?: number;
  angularStiffness?: number;
  /** Spring tension in newtons; joints use the angular/optional linear break test. */
  breakForce?: number;
  /** Springs only: 0.75 permits 75% tensile extension before breaking. */
  breakStrain?: number;
  breakOnPull?: boolean;
  rest?: number;
}
export interface AvbdContactEvent {
  isTrigger: boolean;
  type: "begin" | "end";
  a: AvbdPhysicsBody;
  b: AvbdPhysicsBody;
  step: number;
  point: [number, number, number];
  normal: [number, number, number];
  impulse: number;
}
export interface AvbdRaycastOptions {
  includeTriggers?: boolean;
  maxDistance?: number;
  ignore?: AvbdPhysicsBody[];
  collidesWith?: number;
}
export interface AvbdRayHit {
  body: AvbdPhysicsBody | null;
  index: number;
  distance: number;
  point: [number, number, number];
  normal: [number, number, number];
}
export interface AvbdSphereCastHit extends AvbdRayHit {
  center: [number, number, number];
}
export class AvbdPhysicsConstraint {
  constructor(
    world: AvbdPhysics,
    a: AvbdPhysicsBody | null,
    b: AvbdPhysicsBody,
    options?: AvbdConstraintOptions,
  );
  readonly type: "ball" | "fixed" | "spring" | "motor" | "limit";
  readonly bodyA: AvbdPhysicsBody | null;
  readonly bodyB: AvbdPhysicsBody;
  readonly disposed: boolean;
  setWorldAnchor(point: AvbdVector): this;
  setMotor(options: { speed?: number; maxTorque?: number }): this;
  readState(): Promise<{
    broken: boolean;
    linearForce: number[];
    angularForce: number[];
  }>;
  dispose(): void;
}
export class AvbdPhysics {
  sphereCast(
    origin: AvbdVector,
    radius: number,
    direction: AvbdVector,
    options?: AvbdRaycastOptions,
  ): Promise<AvbdSphereCastHit | null>;
  sphereCastAll(
    casts: Array<{
      origin: AvbdVector;
      radius: number;
      direction: AvbdVector;
      maxDistance?: number;
    }>,
    options?: AvbdRaycastOptions,
  ): Promise<Array<AvbdSphereCastHit | null>>;
  addMotor(
    a: AvbdPhysicsBody | null,
    b: AvbdPhysicsBody,
    options?: AvbdConstraintOptions,
  ): AvbdPhysicsConstraint;
  addHinge(
    a: AvbdPhysicsBody | null,
    b: AvbdPhysicsBody,
    options?: AvbdHingeOptions,
  ): AvbdPhysicsHinge;
  static create(options?: AvbdWorldOptions): Promise<AvbdPhysics>;
  readonly device: GPUDevice;
  readonly bodyBuffer: GPUBuffer;
  readonly steps: number;
  readonly errors: string[];
  /** Unexpected device loss stops the scene loop and releases the world. Create a new world/device to resume. */
  readonly deviceLost: { reason: string; message: string } | null;
  readonly solverDecision: AvbdSolverDecision;
  setSolverMode(mode: AvbdSolverMode): AvbdSolverDecision;
  setGravity(gravity: AvbdVector): void;
  enableSleeping(options?: {
    speedThreshold?: number;
    timeThreshold?: number;
  }): this;
  initialize(): void;
  step(): void;
  flushCommands(): void;
  addAggregate(
    mesh: AbstractMesh,
    type: AvbdShape | PhysicsShapeType,
    options?: AvbdAggregateOptions,
  ): AvbdPhysicsAggregate;
  addAggregates(
    entries: Array<{
      mesh: AbstractMesh;
      type: AvbdShape | PhysicsShapeType;
      options?: AvbdAggregateOptions;
    }>,
  ): AvbdPhysicsAggregate[];
  attachToScene(scene?: Scene): this;
  addConstraint(
    a: AvbdPhysicsBody | null,
    b: AvbdPhysicsBody,
    options?: AvbdConstraintOptions,
  ): AvbdPhysicsConstraint;
  addJoint(
    a: AvbdPhysicsBody | null,
    b: AvbdPhysicsBody,
    options?: AvbdConstraintOptions,
  ): AvbdPhysicsConstraint;
  addWeld(
    a: AvbdPhysicsBody | null,
    b: AvbdPhysicsBody,
    options?: AvbdConstraintOptions,
  ): AvbdPhysicsConstraint;
  addSpring(
    a: AvbdPhysicsBody,
    b: AvbdPhysicsBody,
    options?: AvbdConstraintOptions,
  ): AvbdPhysicsConstraint;
  onContact(callback: (event: AvbdContactEvent) => void): () => void;
  readContactEvents(): Promise<{
    events: AvbdContactEvent[];
    dropped: number;
    full: boolean;
  }>;
  raycast(
    origin: AvbdVector,
    direction: AvbdVector,
    options?: AvbdRaycastOptions,
  ): Promise<AvbdRayHit | null>;
  raycastAll(
    rays: Array<{
      origin: AvbdVector;
      direction: AvbdVector;
      maxDistance?: number;
    }>,
    options?: AvbdRaycastOptions,
  ): Promise<Array<AvbdRayHit | null>>;
  getRenderBinding(device?: GPUDevice): {
    device: GPUDevice;
    buffer: GPUBuffer;
    stride: number;
    positionOffset: number;
    rotationOffset: number;
    sizeOffset: number;
    count: number;
  };
  wakeAll(): void;
  readSleepStats(): Promise<{ sleeping: number; wakeRequested: boolean }>;
  readonly lastSyncBytes: number | undefined;
  syncMeshes(): Promise<void>;
  /** With bodies: requested order, 40 floats each. Without: GPU slot order. */
  readBodies(bodies?: AvbdPhysicsBody[]): Promise<Float32Array>;
  dispose(): void;
}
export interface AvbdHingeOptions extends AvbdConstraintOptions {
  span?: number;
  motor?: { speed?: number; maxTorque?: number };
}
export class AvbdPhysicsHinge {
  constructor(
    world: AvbdPhysics,
    a: AvbdPhysicsBody | null,
    b: AvbdPhysicsBody,
    options?: AvbdHingeOptions,
  );
  readonly bodyA: AvbdPhysicsBody | null;
  readonly bodyB: AvbdPhysicsBody;
  readonly joints: AvbdPhysicsConstraint[];
  readonly limit?: AvbdPhysicsConstraint;
  readonly motor?: AvbdPhysicsConstraint;
  readonly disposed: boolean;
  dispose(): void;
}
export class AvbdPhysicsAggregate {
  constructor(
    mesh: AbstractMesh,
    type: AvbdShape | PhysicsShapeType,
    options?: AvbdAggregateOptions,
    world?: AvbdPhysics | Scene,
  );
  readonly mesh: AbstractMesh;
  readonly body: AvbdPhysicsBody;
  readonly type: AvbdShape;
  dispose(): void;
}
export class AvbdPhysicsBody {
  readonly gpuIndex: number;
  setLinearVelocity(velocity: AvbdVector): this;
  setAngularVelocity(velocity: AvbdVector): this;
  applyImpulse(impulse: AvbdVector, worldPoint?: AvbdVector): this;
  applyAngularImpulse(impulse: AvbdVector): this;
  /** Apply force for one fixed step (N), optionally at a world point. */
  applyForce(force: AvbdVector, worldPoint?: AvbdVector): this;
  applyTorque(torque: AvbdVector): this;
  setCollisionGroups(group: number, collidesWith?: number): this;
  wakeUp(): this;
  setSleepEnabled(enabled: boolean): this;
  setTrigger(enabled: boolean): this;
  setRestitution(value: number): this;
  readState(): Promise<{
    position: number[];
    rotation: number[];
    linearVelocity: number[];
    angularVelocity: number[];
    mass: number;
    effectiveMass: number;
    sleeping: boolean;
  }>;
  teleport(position: Vector3, rotation?: Quaternion): this;
}
