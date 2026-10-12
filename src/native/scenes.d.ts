import type {
  AvbdSolverPipeline,
  AvbdSolver2D,
  AvbdSolver3D,
} from "./pipeline.js";
export type AvbdTuple3 = readonly [number, number, number];
export type AvbdTuple2 = readonly [number, number];
/** Queries return the nearest hit per ray/cast. Ignore lists contain live body slots. */
export interface AvbdQueryOptions {
  maxDistance?: number;
  ignore?: number[];
  collidesWith?: number;
  includeTriggers?: boolean;
}
export interface AvbdNativeRay<V> {
  origin: V;
  direction: V;
  maxDistance?: number;
}
export interface AvbdNativeCast<V> extends AvbdNativeRay<V> {
  radius: number;
}
export interface AvbdQueryHit<V> {
  index: number;
  distance: number;
  normal: V;
  point: V;
  center: V;
}
export type AvbdQuaternion = readonly [number, number, number, number];
export interface AvbdTerrainMaterial {
  friction?: number;
  restitution?: number;
  group?: number;
  collidesWith?: number;
  mass?: 0;
}
export interface AvbdHeightfieldOptions extends AvbdTerrainMaterial {
  heights: ArrayLike<number>;
  columns: number;
  rows: number;
  spacing?: number | AvbdTuple2;
  origin?: AvbdTuple3;
  upAxis?: 0 | 1 | 2;
  /** Local height below every sample; defaults to the minimum height minus 2. */
  baseHeight?: number;
  /** Row-major cells; a nonzero entry leaves a hole. */
  holes?: ArrayLike<number>;
}
export interface AvbdStaticMeshOptions extends AvbdTerrainMaterial {
  /** World-space xyz triples. */
  positions: ArrayLike<number>;
  indices?: ArrayLike<number>;
  /** Backing behind triangle winding, in world units. Defaults to 0.1. */
  thickness?: number;
}
/** Serializable preprocessing output; can be cooked in a separate worker. */
export interface AvbdCookedTerrain {
  kind: "heightfield" | "static-mesh";
  triangleCount: number;
  pieces: Array<{
    shape: object;
    position: AvbdTuple3;
    rotation: AvbdQuaternion;
  }>;
}
export interface AvbdNativeTerrain {
  readonly bodies: AvbdRigid[];
  readonly triangleCount: number;
  readonly kind: "heightfield" | "static-mesh";
  /** Disable collision participation; live indices remain stable. */
  dispose(): void;
}
export function cookHeightfield(
  options: AvbdHeightfieldOptions,
): AvbdCookedTerrain;
export function cookStaticMesh(
  options: AvbdStaticMeshOptions,
): AvbdCookedTerrain;
export interface AvbdNativeState3D {
  position: [number, number, number];
  rotation: [number, number, number, number];
  linearVelocity: [number, number, number];
  angularVelocity: [number, number, number];
  mass: number;
  effectiveMass: number;
  sleeping: boolean;
}
export interface AvbdNativeState2D {
  position: [number, number];
  angle: number;
  linearVelocity: [number, number];
  angularVelocity: number;
  mass: number;
  moment: number;
  sleeping: boolean;
}
/**
 * Lightweight live-body commands. Setters and impulses queue until step(),
 * flushEdits() or a state query; creating a handle does not download a pose.
 */
export interface AvbdNativeBody<V, A, R, S> {
  /** Live GPU slot, including any initial spatial sorting. */
  readonly gpuIndex: number;
  setLinearVelocity(value: V): this;
  setAngularVelocity(value: A): this;
  /** Impulse in world coordinates; an optional world point also changes angular velocity. */
  applyImpulse(value: V, worldPoint?: V): this;
  /** Force for one simulation step. Call each step for continuous force. */
  applyForce(value: V, worldPoint?: V): this;
  applyAngularImpulse(value: A): this;
  /** Torque for one fixed step; call again each step for a sustained torque. */
  applyTorque(value: A): this;
  /** Centre-of-mass position. Preserves velocity and omitted rotation. */
  teleport(position: V, rotation?: R): this;
  /** Detect overlaps without contact response; enable watchContacts() to read events. */
  setTrigger(enabled: boolean): this;
  /** Bounce coefficient in [0, 1]; zero still resolves penetration and friction. */
  setRestitution(value: number): this;
  /** Unsigned bitmasks. Both bodies must accept the other's group to interact. */
  setCollisionGroups(group: number, collidesWith?: number): this;
  /** Per-body eligibility; enabling also enables the world sleep policy when needed. */
  setSleepEnabled(enabled: boolean): this;
  wakeUp(): this;
  /** Explicit asynchronous download of only this body's live state. */
  readState(): Promise<S>;
}
export type AvbdNativeBody3D = AvbdNativeBody<
  AvbdTuple3,
  AvbdTuple3,
  AvbdQuaternion,
  AvbdNativeState3D
>;
export type AvbdNativeBody2D = AvbdNativeBody<
  AvbdTuple2,
  number,
  number,
  AvbdNativeState2D
>;
/**
 * One bulk edit record. Rotation requires position; worldPoint applies to force
 * and impulse. Queue the iterable once instead of issuing many individual calls.
 */
export interface AvbdNativeBodyEdit<B, V, A, R> {
  body: B;
  position?: V;
  rotation?: R;
  linearVelocity?: V;
  angularVelocity?: A;
  impulse?: V;
  force?: V;
  worldPoint?: V;
  angularImpulse?: A;
  torque?: A;
  isTrigger?: boolean;
  restitution?: number;
  /** Supply group with collidesWith; omitted collidesWith means all groups. */
  group?: number;
  collidesWith?: number;
  allowSleep?: boolean;
}
export interface AvbdAdvanceOptions {
  /** Maximum fixed steps per advance() call; default 6. Bounds overload catch-up. */
  maxSubSteps?: number;
  /** Maximum elapsed seconds accepted per call; default 0.05. */
  maxFrameTime?: number;
}
export interface AvbdNativeContactOptions {
  maxPairs?: number;
  maxEvents?: number;
  /** Watch only these live slots; omitted means all current bodies. */
  indices?: number[];
}
export interface AvbdNativeContactResult {
  events: Array<{
    type: "begin" | "end";
    a: number;
    b: number;
    isTrigger: boolean;
    point: [number, number, number];
    normal: [number, number, number];
    impulse: number;
    step: number;
  }>;
  dropped: number;
  full: boolean;
}
export interface AvbdNativeSceneBinding {
  getEngine(): { getDeltaTime(): number };
  onBeforeRenderObservable: {
    add(callback: () => void): unknown;
    remove(observer: any): unknown;
  };
  onDisposeObservable: {
    addOnce(callback: () => void): unknown;
    remove(observer: any): unknown;
  };
}
export interface AvbdSceneOptions {
  /** Signed acceleration along up; negative pulls downward. */
  gravity?: number;
  /** Fixed-step duration in seconds. Frame/render rate is separate. */
  timeStep?: number;
  iterations?: number;
  /** 3D unit up vector; defaults to [0, 1, 0]. */
  up?: AvbdTuple3;
}
export interface AvbdNativeBodyOptions {
  group?: number;
  collidesWith?: number;
  allowSleep?: boolean;
  restitution?: number;
  isTrigger?: boolean;
  density?: number;
  mass?: number;
  friction?: number;
  position?: AvbdTuple3;
  rotation?: AvbdQuaternion;
  velocity?: AvbdTuple3;
  angularVelocity?: AvbdTuple3;
}
/** Scene-builder handle. Poses in this record are initial CPU data, not live GPU state. */
export interface AvbdRigid {
  mass: number;
  size: Float64Array;
  moment: Float64Array;
  radius: number;
  positionLin: Float64Array;
  positionAng: Float64Array;
  velocityLin: Float64Array;
  velocityAng: Float64Array;
}
export interface AvbdGpuCounters {
  pairs: number;
  contacts: number;
  overflow: number;
  clashes: number;
  colors: number;
  manifolds?: number;
}
export interface AvbdGpuParameters {
  dt: number;
  gravity: number;
  iterations: number;
  alpha: number;
  gamma: number;
}
export interface AvbdGpuParameters3D extends AvbdGpuParameters {
  betaLin: number;
  betaAng: number;
  up?: number[];
  startAtRest?: boolean;
  massPenalty?: boolean;
  reuseContacts?: boolean;
}
export interface AvbdGpuParameters2D extends AvbdGpuParameters {
  beta: number;
  postStabilize: boolean;
  matchNearest: boolean;
  stiffnessRescale: boolean;
  vbd: boolean;
  vbdStiffness: number;
}
/** 3D tracks current awake groups and retains sleeping support connections. */
export interface AvbdSleepOptions {
  /**
   * Combined linear and radius-scaled angular motion, world units/second. Default 0.03.
   *
   * Dense 3D contact groups need every awake member quiet and supported before resting.
   */
  speedThreshold?: number;
  /** Seconds continuously below the speed threshold while supported. Default 0.5. */
  timeThreshold?: number;
  /** 3D: automatic for large desktop worlds; false selects whole-world waking. */
  islands?: boolean;
  /** 3D island mode: build contacts once and sleep stationary, supported groups at startup. */
  startAsleep?: boolean;
}
export interface AvbdGpuOptions {
  /**
   * Optional caller-owned storage. Share its GPUDevice with the renderer and
   * keep it alive until the world and renderer have finished using it.
   */
  bodyBuffer?: GPUBuffer;
  bodyCapacity?: number;
  colorRounds?: number;
  spatialSort?: boolean;
  /** auto selects a spatial search from scene characteristics; grid/hploc force a choice. */
  broadphase?: "auto" | "grid" | "hploc";
  solverMode?: "auto" | "standard" | "optimized" | "points";
  /** 3D: automatically fuse closed jointless worlds of at most 32 bodies. */
  smallGroups?: boolean;
  bvh?: { rebuildInterval?: number };
  capacity?: {
    contacts?: number;
    pairs?: number;
    manifolds?: number;
    colors?: number;
    joints?: number;
  };
  /** Reserve coloring capacity when sleeping bodies wake. */
  minimumColors?: number;
  minimumColorRounds?: number;
  sleeping?: boolean | AvbdSleepOptions;
}
export interface AvbdGpuSolver {
  readonly bodyBuffer: GPUBuffer;
  readonly bodyCount: number;
  readonly jointCount: number;
  readonly params: AvbdGpuParameters;
  /** Submit one fixed step without waiting for GPU completion or downloading poses. */
  step(): void;
  /** Elapsed seconds; fixed timestep with bounded catch-up. Returns steps submitted, never waits for GPU or downloads poses. */
  advance(elapsed: number, options?: AvbdAdvanceOptions): number;
  /** Submit pending edits now; step and queries flush automatically. Does not wait for GPU. */
  flushEdits(): void;
  /** Immediate single GPU dispatch, after queued edits. Unique ascending GPU indices; packed xy (2D) or xyz (3D) Float32 values. Buffers are reused. */
  setLinearVelocities(
    indices: ArrayLike<number>,
    velocities: ArrayLike<number>,
  ): this;
  /** Packed radians/sec: one component per 2D body, xyz per 3D body. */
  setAngularVelocities(
    indices: ArrayLike<number>,
    velocities: ArrayLike<number>,
  ): this;
  /** Replace either or both velocity fields in one dispatch. Unique ascending GPU slots. */
  setVelocities(
    indices: ArrayLike<number>,
    values: { linear?: ArrayLike<number>; angular?: ArrayLike<number> },
  ): this;
  /** GPU indices in, packed records out: 40 floats/body in 3D, 24 in 2D. posesOnly: 8 floats in 3D, 4 in 2D. */
  readSelectedBodies(
    indices: ArrayLike<number>,
    options?: { posesOnly?: boolean },
  ): Promise<Float32Array>;
  /** Explicit full-world download in GPU slot order; prefer selected reads for gameplay. */
  readBodies(): Promise<Float32Array>;
  readJoints(): Promise<Float32Array>;
  readCounters(): Promise<AvbdGpuCounters>;
  adapt(counters: AvbdGpuCounters): void;
  disableConstraint(slot: number): void;
  destroy(): void;
}
export interface AvbdGpuSolver3D extends AvbdGpuSolver {
  /** Prefer a scene-builder body; numeric arguments are GPU slots, not reference indices. Handles are created on demand. */
  body(body: AvbdRigid | number): AvbdNativeBody3D;
  bodyIndex(body: AvbdRigid | AvbdNativeBody3D | number): number;
  /** Validates before enqueueing. Within a record: teleport, velocity setters, then impulses/forces. Records execute in order per body. */
  editBodies(
    edits: Iterable<
      AvbdNativeBodyEdit<
        AvbdRigid | AvbdNativeBody3D | number,
        AvbdTuple3,
        AvbdTuple3,
        AvbdQuaternion
      >
    >,
  ): this;
  setLinearVelocity(index: number, velocity: AvbdTuple3): this;
  setAngularVelocity(index: number, velocity: AvbdTuple3): this;
  applyImpulse(
    index: number,
    impulse: AvbdTuple3,
    worldPoint?: AvbdTuple3,
  ): this;
  applyForce(index: number, force: AvbdTuple3, worldPoint?: AvbdTuple3): this;
  applyAngularImpulse(index: number, impulse: AvbdTuple3): this;
  applyTorque(index: number, torque: AvbdTuple3): this;
  teleport(
    index: number,
    position: AvbdTuple3,
    rotation?: AvbdQuaternion,
  ): this;
  readBodyState(index: number): Promise<AvbdNativeState3D>;
  enableSleeping(options?: AvbdSleepOptions): this;
  disableSleeping(): this;
  setSleepEnabled(index: number, enabled: boolean): this;
  watchContacts(options?: AvbdNativeContactOptions): this;
  readContactEvents(): Promise<AvbdNativeContactResult>;
  attachToScene(
    scene: AvbdNativeSceneBinding,
    options?: AvbdAdvanceOptions & {
      afterStep?: (solver: AvbdGpuSolver3D) => void;
    },
  ): this;
  detachFromScene(): this;
  setFilters(
    indices: ArrayLike<number>,
    groups: ArrayLike<number>,
    collidesWith: ArrayLike<number>,
  ): void;
  raycast(
    origin: AvbdTuple3,
    direction: AvbdTuple3,
    options?: AvbdQueryOptions,
  ): Promise<AvbdQueryHit<AvbdTuple3> | null>;
  raycastAll(
    rays: AvbdNativeRay<AvbdTuple3>[],
    options?: AvbdQueryOptions,
  ): Promise<Array<AvbdQueryHit<AvbdTuple3> | null>>;
  sphereCast(
    origin: AvbdTuple3,
    radius: number,
    direction: AvbdTuple3,
    options?: AvbdQueryOptions,
  ): Promise<AvbdQueryHit<AvbdTuple3> | null>;
  sphereCastAll(
    casts: AvbdNativeCast<AvbdTuple3>[],
    options?: AvbdQueryOptions,
  ): Promise<Array<AvbdQueryHit<AvbdTuple3> | null>>;
  setMotor(slot: number, options: { speed?: number; maxTorque?: number }): void;
  readonly params: AvbdGpuParameters3D;
  gpuIndex(referenceIndex: number): number;
  releaseJoints(slots: ArrayLike<number>): void;
  setWorldAnchor(slot: number, point: ArrayLike<number>): void;
  captureConstraintFrames(
    entries: Array<{ slot: number; spring?: boolean }>,
  ): void;
  wakeAll(): void;
  setSpringMaterial(
    slot: number,
    options?: { breakStrain?: number; breakForce?: number },
  ): void;
  setSensor(index: number, enabled: boolean): void;
  setRestitution(index: number, value: number): void;
  readSleepStats(): Promise<{ sleeping: number; wakeRequested: boolean }>;
}
export interface AvbdGpuSolver2D extends AvbdGpuSolver {
  body(index: number): AvbdNativeBody2D;
  bodyIndex(body: AvbdNativeBody2D | number): number;
  editBodies(
    edits: Iterable<
      AvbdNativeBodyEdit<AvbdNativeBody2D | number, AvbdTuple2, number, number>
    >,
  ): this;
  enableSleeping(options?: {
    speedThreshold?: number;
    timeThreshold?: number;
  }): this;
  disableSleeping(): this;
  setSleepEnabled(index: number, enabled: boolean): this;
  wakeAll(): this;
  wakeUp(index: number): this;
  readSleepStats(): Promise<{ sleeping: number; wakeRequested: boolean }>;
  setAngleLimits(slot: number, options: AvbdAngleLimits2D): void;
  /** Optional packed geometry. Hull descriptor: [4, radius, vertex-record offset, count]. Vertices: [x,y,normalX,normalY]. */
  readonly shapeBuffer?: GPUBuffer;
  /** Convex point cloud, 3–32 boundary vertices. Local geometry is centered on its area centroid; position is the center of mass. */
  addHull(
    points: ArrayLike<number> | readonly AvbdTuple2[],
    options?: AvbdNativeBodyOptions2D,
  ): number;
  attachToScene(
    scene: {
      getEngine(): { getDeltaTime(): number };
      onBeforeRenderObservable: {
        add(callback: () => void): unknown;
        remove(observer: any): unknown;
      };
      onDisposeObservable: {
        addOnce(callback: () => void): unknown;
        remove(observer: any): unknown;
      };
    },
    options?: {
      maxSubSteps?: number;
      maxFrameTime?: number;
      afterStep?: (solver: AvbdGpuSolver2D) => void;
    },
  ): this;
  detachFromScene(): this;
  /** Full XY extents; density: 0 makes a static body. */
  addBox(size: AvbdTuple2, options?: AvbdNativeBodyOptions2D): number;
  addCircle(radius: number, options?: AvbdNativeBodyOptions2D): number;
  /** Local X axis; length includes both round caps. */
  addCapsule(
    radius: number,
    length: number,
    options?: AvbdNativeBodyOptions2D,
  ): number;
  addSegment(
    start: AvbdTuple2,
    end: AvbdTuple2,
    options?: AvbdNativeSegmentOptions2D,
  ): number;
  addPlane(
    normal?: AvbdTuple2,
    offset?: number,
    options?: AvbdNativePlaneOptions2D,
  ): number;
  setLinearVelocity(
    index: number,
    velocity: AvbdTuple2 | { x: number; y: number },
  ): this;
  setAngularVelocity(index: number, velocity: number): this;
  applyImpulse(
    index: number,
    impulse: AvbdTuple2 | { x: number; y: number },
    point?: AvbdTuple2 | { x: number; y: number },
  ): this;
  /** Applies force for one simulation step. Call every step for a continuous force. */
  applyForce(
    index: number,
    force: AvbdTuple2 | { x: number; y: number },
    point?: AvbdTuple2 | { x: number; y: number },
  ): this;
  applyAngularImpulse(index: number, impulse: number): this;
  applyTorque(index: number, torque: number): this;
  /** Preserves velocity; omitted angle preserves current rotation. */
  teleport(
    index: number,
    position: AvbdTuple2 | { x: number; y: number },
    angle?: number,
  ): this;
  readBodyState(index: number): Promise<{
    position: [number, number];
    angle: number;
    linearVelocity: [number, number];
    angularVelocity: number;
    mass: number;
    moment: number;
    sleeping: boolean;
  }>;
  raycast(
    origin: AvbdTuple2,
    direction: AvbdTuple2,
    options?: AvbdQueryOptions,
  ): Promise<AvbdQueryHit<AvbdTuple2> | null>;
  raycastAll(
    rays: AvbdNativeRay<AvbdTuple2>[],
    options?: AvbdQueryOptions,
  ): Promise<Array<AvbdQueryHit<AvbdTuple2> | null>>;
  circleCast(
    origin: AvbdTuple2,
    radius: number,
    direction: AvbdTuple2,
    options?: AvbdQueryOptions,
  ): Promise<AvbdQueryHit<AvbdTuple2> | null>;
  circleCastAll(
    casts: AvbdNativeCast<AvbdTuple2>[],
    options?: AvbdQueryOptions,
  ): Promise<Array<AvbdQueryHit<AvbdTuple2> | null>>;
  setRestitution(index: number, value: number): void;
  setSensor(index: number, enabled: boolean): void;
  setFilters(
    indices: ArrayLike<number>,
    groups: ArrayLike<number>,
    collidesWith: ArrayLike<number>,
  ): void;
  /** Initially omitting indices watches every body. A supplied list selects pairs touching those bodies; later omissions preserve that selection. */
  watchContacts(options?: {
    maxPairs?: number;
    maxEvents?: number;
    indices?: number[];
  }): this;
  readContactEvents(): Promise<{
    events: Array<{
      type: "begin" | "end";
      a: number;
      b: number;
      isTrigger: boolean;
      point: [number, number, number];
      normal: [number, number, number];
      impulse: number;
      step: number;
    }>;
    dropped: number;
    full: boolean;
  }>;
  readonly params: AvbdGpuParameters2D;
  setMotor(slot: number, options: { speed?: number; maxTorque?: number }): void;
  appendJoint(
    a: number,
    b: number,
    anchorA: AvbdTuple2,
    anchorB: AvbdTuple2,
    stiffness: AvbdTuple3,
    breakForce?: number,
  ): number;
  setWorldAnchor(slot: number, x: number, y: number): void;
}
export interface AvbdNativeConstraint2D extends AvbdNativeConstraint {
  /** Manual enable/dispose state; fracture state comes from readJoints(). */
  readonly alive: boolean;
}
export interface AvbdAngleLimits2D {
  minAngle?: number;
  maxAngle?: number;
}
export interface AvbdAngularLimit2D extends AvbdNativeConstraint2D {
  setLimits(options: AvbdAngleLimits2D): this;
}
export interface AvbdHinge2D {
  readonly joint: AvbdNativeConstraint2D;
  readonly limits: AvbdAngularLimit2D | null;
  readonly motor: AvbdNativeConstraint2D | null;
  readonly disposed: boolean;
  dispose(): void;
  destroy(): void;
}
export interface AvbdNativeConstraint {
  readonly slot: number;
  readonly disposed: boolean;
  dispose(): void;
  destroy(): void;
}
/**
 * Build renderer-independent 3D topology before createSolver(). Body records are
 * initial state; use live world handles for edits after upload. Defaults to Y up.
 */
export class AvbdScene3D {
  addHeightfield(options: AvbdHeightfieldOptions): AvbdNativeTerrain;
  addStaticMesh(options: AvbdStaticMeshOptions): AvbdNativeTerrain;
  addTerrain(
    cooked: AvbdCookedTerrain,
    options?: AvbdTerrainMaterial,
  ): AvbdNativeTerrain;
  /** Torque-limited angular drive; axes are body-local, or world-space for null A. */
  addMotor(
    a: AvbdRigid | null,
    b: AvbdRigid,
    options?: AvbdNativeAngularOptions,
  ): AvbdNativeConstraint;
  addHinge(
    a: AvbdRigid | null,
    b: AvbdRigid,
    options?: AvbdNativeAngularOptions & {
      anchorA?: AvbdTuple3;
      anchorB?: AvbdTuple3;
      span?: number;
      motor?: { speed?: number; maxTorque?: number };
    },
  ): {
    joints: AvbdNativeConstraint[];
    limit?: AvbdNativeConstraint;
    motor?: AvbdNativeConstraint;
    dispose(): void;
  };
  constructor(options?: AvbdSceneOptions);
  readonly bodies: AvbdRigid[];
  readonly constraints: AvbdNativeConstraint[];
  /** Full XYZ extents; mass: 0 or density: 0 makes a static body. */
  addBox(size: AvbdTuple3, options?: AvbdNativeBodyOptions): AvbdRigid;
  addSphere(radius: number, options?: AvbdNativeBodyOptions): AvbdRigid;
  /** Exact rounded capsule along local Y; height includes both end caps. */
  addCapsule(
    radius: number,
    height: number,
    options?: AvbdNativeBodyOptions,
  ): AvbdRigid;
  /** Builds a centred convex collider aligned to its principal axes.
   * Position/rotation place that principal frame; use aggregates to retain a mesh frame. */
  addHull(
    points: ArrayLike<number>,
    options?: AvbdNativeBodyOptions,
  ): AvbdRigid;
  /** Spherical collision sample with translation only, suitable for spring systems. */
  addPoint(
    position: AvbdTuple3,
    options?: { mass?: number; radius?: number; friction?: number },
  ): AvbdRigid;
  /** Helpers below build y-up geometry. Fabric lies in the x-z plane. */
  addFabric(options?: {
    columns?: number;
    rows?: number;
    spacing?: number;
    origin?: AvbdTuple3;
    mass?: number;
    stiffness?: number;
    pinEdges?: boolean;
    /** Four corner anchors. When true, pinEdges defaults to false. */
    pinCorners?: boolean;
    /** N/m at pinned attachments; defaults to stiffness. Shear links retain half stiffness. */
    anchorStiffness?: number;
    /** Material at a spring's undeformed midpoint, normalized across the sheet.
     * stiffnessScale multiplies stretch/shear/bending stiffness after anchorStiffness.
     * Unspecified fields keep the fabric defaults. */
    materialAt?: (
      u: number,
      v: number,
    ) => {
      stiffnessScale?: number;
      breakStrain?: number;
      breakForce?: number;
    };
    breakStrain?: number;
    breakForce?: number;
    bendingStiffness?: number;
  }): {
    points: AvbdRigid[];
    grid: AvbdRigid[][];
    indices: Uint32Array;
    connections: AvbdNativeConstraint[];
    triangleConnections: Uint32Array;
  };
  /** Rigid links laid out down Y from origin, regardless of the configured up vector. */
  addRope(options?: {
    segments?: number;
    length?: number;
    origin?: AvbdTuple3;
    width?: number;
    endMass?: number;
  }): { anchor: AvbdRigid; links: AvbdRigid[] };
  /** Y-up articulated rigid bodies; rotate/reposition parts for a different layout. */
  addRagdoll(options?: { origin?: AvbdTuple3; mass?: number }): {
    torso: AvbdRigid;
    head: AvbdRigid;
    bodies: AvbdRigid[];
  };
  /**
   * Body-local anchors; null A uses a world-space anchor. Default linear rows are
   * hard and angular rows free; angularStiffness: Infinity makes a weld.
   */
  addJoint(
    a: AvbdRigid | null,
    b: AvbdRigid,
    anchorA?: AvbdTuple3,
    anchorB?: AvbdTuple3,
    options?: {
      linearStiffness?: number;
      angularStiffness?: number;
      breakForce?: number;
      breakOnPull?: boolean;
    },
  ): AvbdNativeConstraint;
  /**
   * Two local anchors; rest: -1 captures initial separation. Finite tensile
   * breakForce or breakStrain enables breaking.
   */
  addSpring(
    a: AvbdRigid,
    b: AvbdRigid,
    anchorA?: AvbdTuple3,
    anchorB?: AvbdTuple3,
    options?: {
      stiffness?: number;
      rest?: number;
      breakStrain?: number;
      breakForce?: number;
    },
  ): AvbdNativeConstraint;
  /**
   * Consume this builder once. Use world.body(handle) to resolve spatially sorted
   * GPU slots; initial body records are not automatically updated from GPU poses.
   */
  createSolver(device: GPUDevice, options?: AvbdGpuOptions): AvbdGpuSolver3D;
  createSolver(
    pipeline: AvbdSolverPipeline,
    options?: AvbdGpuOptions,
  ): AvbdSolver3D;
}
export interface AvbdNativeAngularOptions {
  axisA?: AvbdTuple3;
  axisB?: AvbdTuple3;
  speed?: number;
  maxTorque?: number;
  minAngle?: number;
  maxAngle?: number;
}
export interface AvbdNativeBodyOptions2D {
  allowSleep?: boolean;
  density?: number;
  friction?: number;
  position?: AvbdTuple2;
  angle?: number;
  /** [linear X, linear Y, angular radians/second]. */
  velocity?: AvbdTuple3;
  restitution?: number;
  isTrigger?: boolean;
  group?: number;
  collidesWith?: number;
}
export interface AvbdNativeSegmentOptions2D extends Omit<
  AvbdNativeBodyOptions2D,
  "position" | "angle"
> {
  /** Zero by default. Zero-thickness segments must be static. */
  radius?: number;
}
export type AvbdNativePlaneOptions2D = Omit<
  AvbdNativeBodyOptions2D,
  "position" | "angle" | "density"
> & { density?: 0 };
/**
 * Build XY topology before createSolver(). Returns numeric body indices;
 * world.body(index) provides the object-oriented command facade after upload.
 */
export class AvbdScene2D {
  constructor(
    options?: Omit<AvbdSceneOptions, "up"> & {
      alpha?: number;
      postStabilize?: boolean;
      matchNearest?: boolean;
    },
  );
  readonly bodyCount: number;
  /** Convex point cloud, 3–32 boundary vertices. Position is the area centroid / center of mass. */
  addHull(
    points: ArrayLike<number> | readonly AvbdTuple2[],
    options?: AvbdNativeBodyOptions2D,
  ): number;
  addCircle(radius: number, options?: AvbdNativeBodyOptions2D): number;
  /** Local X axis; length includes both round caps. */
  addCapsule(
    radius: number,
    length: number,
    options?: AvbdNativeBodyOptions2D,
  ): number;
  /** Finite two-sided line, or a rounded segment if radius > 0. */
  addSegment(
    start: AvbdTuple2,
    end: AvbdTuple2,
    options?: AvbdNativeSegmentOptions2D,
  ): number;
  /** Normal is normalized. Allowed side: dot(normal, point) >= offset. */
  addPlane(
    normal?: AvbdTuple2,
    offset?: number,
    options?: AvbdNativePlaneOptions2D,
  ): number;
  addBox(
    size: readonly [number, number],
    options?: AvbdNativeBodyOptions2D,
  ): number;
  /**
   * Body-local anchors; A = -1 anchors to the world. stiffness is [X, Y, rotation];
   * Infinity locks a row and zero frees it. Lock all rows for a 2D weld.
   */
  addJoint(
    a: number,
    b: number,
    anchorA?: readonly [number, number],
    anchorB?: readonly [number, number],
    options?: { stiffness?: AvbdTuple3; breakForce?: number },
  ): AvbdNativeConstraint2D;
  /** Connect two body-local anchors; rest is the unstretched length in world units. */
  addSpring(
    a: number,
    b: number,
    anchorA?: readonly [number, number],
    anchorB?: readonly [number, number],
    options?: { stiffness?: number; rest?: number },
  ): AvbdNativeConstraint2D;
  /** Relative angular drive in radians/second; maxTorque bounds its effort. */
  addMotor(
    a: number,
    b: number,
    options?: { speed?: number; maxTorque?: number },
  ): AvbdNativeConstraint2D;
  addAngularLimit(
    a: number,
    b: number,
    options?: AvbdAngleLimits2D,
  ): AvbdAngularLimit2D;
  addHinge(
    a: number,
    b: number,
    anchorA?: AvbdTuple2,
    anchorB?: AvbdTuple2,
    options?: AvbdAngleLimits2D & {
      motor?: { speed?: number; maxTorque?: number };
    },
  ): AvbdHinge2D;
  createSolver(
    device: GPUDevice,
    options?: {
      bodyBuffer?: GPUBuffer;
      bodyCapacity?: number;
      colorRounds?: number;
      minimumColors?: number;
      sleeping?: boolean | { speedThreshold?: number; timeThreshold?: number };
    },
  ): AvbdGpuSolver2D;
  createSolver(
    pipeline: AvbdSolverPipeline,
    options?: AvbdGpuOptions,
  ): AvbdSolver2D;
}
