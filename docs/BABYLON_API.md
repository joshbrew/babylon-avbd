# Babylon.js integration

Start with the [integration README](README.md) for a complete scene, bundler setup,
instance rendering examples and reproducible collision/solver benchmarks.

`babylonAvbd.js` provides a small aggregate/body API with Babylon's familiar
mass, friction, velocity, impulse and disposal conventions. It wraps the same
GPU rigid-body solver used by the laboratory. It is not an implementation of
Babylon's complete Physics V2 plugin interface and does not replace
`scene.enablePhysics()` or accept Babylon `PhysicsAggregate` instances.

The standalone `avbd-babylon` ESM and `AVBD` global bundles have no Babylon
runtime imports. Creating a world with a scene attaches fixed-step updates and
disposal automatically. Aggregates accept that scene, a world, or an omitted
last argument when their mesh belongs to the world’s scene. Both `AvbdShapeType`
and the supported Babylon `PhysicsShapeType` enum values work. Pass
`autoAttach: false` when you manage stepping yourself.

`AvbdPhysics.create()` checks 3D floor contacts once per device and automatically
selects a working GPU path. This covers Android drivers that need compatible
contact calculations or smaller hull workgroups. Desktop devices that pass
retain their normal shaders and dispatches. The check adds no per-step readbacks.
For native 3D solvers, use `createWebGPUDevice({validate3D:true})`, or await
`prepareWebGPUDevice3D(device)` before using a renderer-owned device. Preparation
is cached and preserves device ownership. 2D does not require the 3D check.

```js
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { AvbdPhysics, AvbdPhysicsAggregate, AvbdShapeType } from "avbd-babylon";

const physics = await AvbdPhysics.create({
  scene,
  gravity: new Vector3(0, -9.81, 0),
  iterations: 10,
  capacity: 2048,
  solverMode: "auto", // default: choose the measured implementation for the load
});

new AvbdPhysicsAggregate(floor, AvbdShapeType.BOX, { mass: 0 }, scene);
const boxPhysics = new AvbdPhysicsAggregate(
  box,
  AvbdShapeType.BOX,
  { mass: 2, friction: 0.6 },
  scene,
);

// Create the scene in a batch, then compile/allocate the world once.
physics.initialize();
console.log(physics.solverDecision); // selected mode and why it was chosen
// create({ scene }) attaches simulation and disposal automatically.
boxPhysics.body.setLinearVelocity(new Vector3(0, 0, 5));
boxPhysics.body.applyImpulse(new Vector3(3, 0, 0), box.position);

// Aggregate disposal disables its collisions; the mesh remains caller-owned.
// boxPhysics.dispose();
// physics.dispose(); // detaches the observer and releases GPU resources
```

`solverMode` is `"auto"` by default. AVBD selects the GPU contact calculation
from body count and active joints, and shares threads based on contact load in
very large scenes. All layouts retain the same physics settings. The read-only
`physics.solverDecision` explains the choice. `physics.setSolverMode()` accepts
`"standard"`, `"optimized"`, `"points"` or `"auto"` for advanced profiling and
compatibility. These names identify internal implementations, not quality
levels or paper results. Overrides preserve live GPU state; first use may
compile pipelines. Start with the automatic default.

Box, sphere and capsule collisions are native. Capsules use an exact rounded
segment along local Y; height includes both caps and X/Z diameters must match.
`CYLINDER` and `CONVEX_HULL` use a polygonal convex hull, with a 32-vertex limit. Mesh geometry,
positive scaling, centre of mass and principal inertia are captured at creation;
the visual transform is reconstructed from the GPU body's principal frame.
Meshes must have no parent. Bake parent transforms before creating aggregates.
Nonuniform sphere dimensions and unsupported shape types fail explicitly.

AVBD supports restitution from 0 to 1 and non-solving trigger volumes. Zero
restitution adds no bounce passes. The larger coefficient in a pair wins;
impacts below 1 m/s do not bounce. Use `body.setRestitution()` for live changes.
`isTrigger:true` detects dynamic-body overlaps without contact forces;
`body.setTrigger()` changes the mode. Events include `isTrigger`, and masks
apply to sensors too. Static–static pairs are not scanned. CCD,
arbitrary concave meshes and the full Physics V2 plugin
interface are not implemented. Static bodies given velocity move kinematically.

`addHinge(a,b,{axisA,axisB,anchorA,anchorB,minAngle,maxAngle,motor})` constrains
rotation to one axis, with optional angle stops and a torque-limited motor.
Axes/anchors use local mesh frames; angle stops are radians relative to creation,
and motor `speed` is radians/second and `maxTorque` is N·m. Change the drive with
`hinge.motor.setMotor()`; dispose the complete hinge with `hinge.dispose()`.
`addMotor()` drives an angular axis independently.

`raycast()` / `raycastAll()` query current poses. `sphereCast(origin,radius,direction,options)`
and `sphereCastAll()` sweep a sphere against rounded target geometry, including
box and hull corners. Queries accept `maxDistance`, `collidesWith`, `ignore`
(body handles) and `includeTriggers` (default true). Results include distance,
body, normal and target contact point; sphere casts also include the center at
impact. Batched queries return one nearest hit per input. Initial overlaps return
zero distance and a normal opposite travel. Queries are separate from simulation
CCD. Portable solvers expose the same queries using numeric ignored body indices;
2D uses `circleCast()` and two-component coordinates.

`addJoint(a, b, options)` connects ball-socket anchors; a null `a` makes a world
anchor. `addWeld()` also locks angular motion and captures the relative rotation
on the GPU. `addSpring()` accepts stiffness in N/m and optional rest length,
otherwise captured from the live anchors. Anchors use mesh-local coordinates,
with a world position for a null endpoint. `breakForce` enables fracture;
`breakOnPull` also tests linear force. `constraint.readState()` reads one record.
`setWorldAnchor()` moves a world anchor; `dispose()` releases a reusable joint
slot. Body disposal also disposes connected constraints.

Spring `breakStrain` is tensile extension relative to its rest length (0.35
means 35%). Spring `breakForce` measures tension in newtons. Compression does
not fracture springs. These settings work before and after GPU initialization.

World `sleeping:true` enables the GPU policy. Aggregate `allowSleep:false`
keeps that body awake; explicit `allowSleep:true` also enables the policy if
needed. `body.setSleepEnabled(boolean)` changes eligibility and wakes the
world. Impacts, support removal and edits wake bodies conservatively.

`raycast(origin, direction, options)` and batched `raycastAll(rays, options)`
return asynchronous nearest hits with body handles, distance, point and normal.
`ignore` and `collidesWith` filter rays. Direction must be nonzero. These queries
scan bodies on the GPU: use a few interactive casts, rather than large sensor
fleets. `body.setCollisionGroups(group, mask)` changes solver collision masks.

`onContact(callback)` enables GPU begin/end events and returns an unsubscribe
function. Events do not download poses. `maxContactPairs` and `maxContactEvents`
reserve storage; `readContactEvents()` reports dropped events or a full pair
table. End events do not retain an old position. Callbacks run asynchronously.

`sleeping: true` or `{ speedThreshold: 0.03, timeThreshold: 0.5 }` enables an
optional GPU policy. Supported quiet bodies sleep; impacts, moving joint
endpoints and explicit edits wake the world conservatively. Unsupported bodies
under gravity stay awake. `wakeAll()`, `body.wakeUp()` and `readSleepStats()` are
available. Suspended jointed objects are not guaranteed to sleep. Defaults and
paper-comparison benchmarks keep sleeping disabled.

`body.setLinearVelocity()`, `setAngularVelocity()`, `applyImpulse()`,
`applyAngularImpulse()` and `teleport(position, quaternion)` enqueue compact
GPU commands. Commands for the same body are combined before submission;
impulses use the current GPU mass, inertia and position. They never replace a
body with a stale CPU pose. `teleport` retains velocity unless a velocity setter
is also called. New aggregates can be added within reserved capacity after
initialization; disposed body slots are not reused. For repeated spawning,
reserve projectile bodies and teleport them. `applyForce()` and `applyTorque()`
apply forces for one fixed step, using impulses on live GPU state.

Collision search accepts `broadphase: "auto"` (default), `"grid"` or `"hploc"`
when creating a world. Automatic mode uses the GPU tree for large mixed-size
scenes whose grid cells cover many small objects; uniform brick scenes retain
the grid. `bvh: { rebuildInterval: 64 }` sets how often tree ordering is rebuilt.
All bounds are still updated every step. The [tree documentation](HPLOC.md)
describes extra memory, adapter limits and reproducible comparisons.

The default bridge mirrors small scenes to Babylon meshes asynchronously. It
allows one outstanding pose copy and does not wait in the render loop. That
bridge gathers only the mirrored poses (32 bytes each), rather than the whole
world. It still costs GPU readback and CPU mesh updates, so large scenes should use
the direct GPU path:

```js
const physics = await AvbdPhysics.create({
  device, // optionally share a renderer's publicly provided device
  capacity: 100_001,
  syncMeshes: false, // no automatic pose readbacks or per-mesh updates
});
// Build aggregates, with { sync: false } if they need no explicit mesh mirror.
physics.initialize();
const bodyBuffer = physics.bodyBuffer;
const instanceIndex = aggregate.body.gpuIndex;
physics.step(); // exactly one fixed 1/60 s step; does not await the GPU
```

The body buffer uses 40 floats / 160 bytes per body: position at 0, quaternion
(x,y,z,w) at 4, full size at 16, mass at 19, principal moments at 20, linear
velocity at 32 and angular velocity at 36. Spatial sorting means creation order
is not GPU order; always use `body.gpuIndex`. Babylon coordinates are used
directly (y up by default), unlike the canonical lab's z-up scene builders.

Use a renderer that reads this buffer directly, such as the laboratory renderer,
adapted for the world's up axis. Do not create 100,000 automatically synchronized
Babylon mesh transforms. The bridge rejects more than `maxSyncedBodies` (2048
by default). `readBodies()` and `syncMeshes()` are explicit asynchronous tools
for inspection and small-scene interoperability. `readBodies([bodyB, bodyA])`
gathers only those 160-byte records in requested order. `body.readState()` reads
one record. `getRenderBinding(device)` returns the buffer and byte offsets and
checks device identity; it does not bind storage to thin instances automatically.
`readState()` retains physical `mass` and also reports `effectiveMass` (zero
while sleeping) and `sleeping`. Raw body buffers store effective mass at offset 19.

`AvbdScene3D` provides portable GPU builders including `addPoint`, `addFabric`,
`addRope` and `addRagdoll`. `AvbdScene2D` includes GPU boxes, circles, capsules,
convex polygons, finite segments, infinite planes, joints, springs and motors. Both are package exports. Their CPU records prepare metadata; simulation
uses the GPU object returned by `createSolver(device)`. See the root
[README](../README.md) for recipes and coordinate conventions.

The 2D solver uses numeric body indices. After `createSolver(device)`, use
`gpu.setLinearVelocity(index,[x,y])`, `setAngularVelocity(index,radiansPerSecond)`,
`applyImpulse(index,[x,y],worldPoint?)`, `applyForce(index,[x,y],worldPoint?)`
and `teleport(index,[x,y],angle?)`. Commands execute in order using live GPU
poses. `applyAngularImpulse(index,impulse)` and `applyTorque(index,torque)`
use scalar angular values in 2D. All angular velocities are radians/second.
Teleport retains velocity and preserves angle when omitted. A force is
applied for one fixed step. `readBodyState(index)` copies a single body and returns
position, angle, linear/angular velocity, mass and moment. Queries and reads
include pending commands. These vector arguments also accept Babylon `Vector2`.

2D `addJoint()`, `addSpring()` and `addMotor()` return disposable constraint
handles. Build constraints before `createSolver()`; disposal is safe before or
after creation. `gpu.setMotor(handle.slot,{speed,maxTorque})` changes a live drive.
Motor speed is A's angular velocity minus B's, so positive speed with world A
(`-1`) drives B clockwise. Zero torque permits free spin. `gpu.appendJoint()`
exposes the native live-joint operation with explicit local anchors and row
stiffness. Its angular rest angle uses the initial scene poses; use free angular
stiffness for dragging. `gpu.setWorldAnchor(slot,x,y)` only accepts world joints.
`disableConstraint(slot)` releases a live constraint without rebuilding the world.
Handle `disposed` describes manual removal; inspect GPU joint records for fracture.

Native 2D and 3D solvers also provide `gpu.body()`, a renderer-independent live
body handle. Use a builder body reference in 3D or the builder's numeric index in
2D. The handle supports `setLinearVelocity`, `setAngularVelocity`, `applyImpulse`,
`applyForce`, `applyAngularImpulse`, `applyTorque`, `teleport`, `setTrigger`,
`setRestitution`, `setCollisionGroups`, `setSleepEnabled`, `wakeUp` and `readState`.
3D angular values are xyz vectors and rotations are xyzw quaternions; 2D uses
scalar angular values. Poses and impulse lever arms come from live GPU state.

`gpu.bodyIndex(referenceOrHandle)` returns the GPU slot, including initial spatial
sorting. Numeric arguments are GPU slots. Handles are created only when requested;
bulk operations can work directly with references or indices.

`gpu.editBodies(iterable)` validates the batch before enqueueing commands. Each
record has a `body` and optional `position`, `rotation`, `linearVelocity`,
`angularVelocity`, `impulse`, `force`, `worldPoint`, `angularImpulse`, `torque`,
`isTrigger`, `restitution`, `group`, `collidesWith` and `allowSleep`.
Supply `group` when setting `collidesWith`; an omitted mask means all groups.
Within one record, a teleport precedes velocity setters, followed by impulses and
forces. Repeated records preserve per-body order. `step`, reads and queries flush
the queue automatically; `flushEdits()` submits without stepping or waiting.
One grouped dispatch owns each edited body. Teleports also invalidate previous
contacts touching those bodies. CPU staging and GPU upload buffers are reused.
Individual linear/angular setters and velocity-only `editBodies()` batches automatically
use compact velocity uploads; mixed commands keep their per-body order.
Adjacent velocity replacement setters coalesce, while impulses remain ordered.
Native 3D teleport cleanup is encoded in the edit submission. Babylon aggregate
linear/angular edits also use compact uploads; mixed aggregate edits reuse their
command storage. No explicit bulk call is required to batch individual setters.

`gpu.setLinearVelocities(indices, velocities)` submits packed xy/xyz velocity
arrays in one dispatch after earlier commands. Indices must be unique ascending
GPU slots. It reuses GPU buffers and accepts reusable typed arrays without
building command objects. Other velocity components and body properties remain
unchanged. Use it for frequent bulk velocity updates; use `editBodies()` for
mixed commands. Both methods wake sleeping bodies conservatively.

`gpu.setAngularVelocities(indices, values)` accepts one radians/sec component per
2D body or xyz per 3D body. `gpu.setVelocities(indices,{linear,angular})` replaces
either or both fields in one dispatch. These methods validate unique ascending
slots, reuse staging and upload storage, and preserve omitted fields.

Body-property replacements, motor/world-anchor targets and 2D limit changes collect
until a step, body/joint read or geometry query. Repeated edits to one property coalesce. Contiguous
words share direct uploads; sparse words use a GPU scatter dispatch without
overwriting neighboring solver state. Constraint removal/reuse and body replacement
flush earlier patches. `flushEdits()` submits without advancing time.

Normal steps combine queued edits, optional sleep/wake checks, optional bounce
handling and solving into one physics queue submission. Contact-event collection,
readbacks and rendering can submit additional work. Stable solver pass constants
are cached; changes to coloring, iterations or stabilization invalidate the cache.
Ray/shape-cast storage has a separate pool of at most two idle jobs, each about
2 MiB or less. Concurrent requests never share mapped storage.

`gpu.readSelectedBodies(indices,{posesOnly})` downloads only requested records:
40 floats per 3D body or 24 per 2D body; compact poses have 8 or 4 floats.
Small repeated reads reuse an idle staging pool. Concurrent reads receive separate
GPU storage and independent returned arrays. At most two buffers per role remain
idle, each selected-record buffer at most 8 MiB; larger reads release their storage
on completion. World/solver disposal releases the pool.
`readState()` downloads just one live body. Normal `step()` and
`advance(elapsedSeconds,{maxSubSteps,maxFrameTime})` never download poses.
Both dimensions support optional `attachToScene(scene)` / `detachFromScene()`
without importing Babylon. The renderer owns mesh synchronization.

Native 3D body options include `group` and `collidesWith`, and both solvers expose
`setFilters(indices,groups,collidesWith)`. Values must be unsigned 32-bit masks,
one of each per live body. Invalid batches are rejected before applying any edit.

In either dimension, `gpu.watchContacts({indices:[projectileSlot,goalSlot]})` restricts entry/exit events
to pairs touching those bodies, avoiding event traffic for an entire brick pile.
Omit `indices` on the first call to watch all bodies. Later calls without it
preserve the selection; a supplied array replaces it. 2D live spawns are watched
automatically only when watching all bodies. Drain `readContactEvents()` regularly
and inspect its `dropped` count when choosing event capacities.

Both the 2D builder and live solver offer `addBox(size,options)`,
`addCircle(radius,options)`, `addCapsule(radius,length,options)`,
`addHull(points,options)`, `addSegment(start,end,options)` and `addPlane(normal?,offset?,options)`.
Live spawning uses the reserved `bodyCapacity` and throws if full. Capsules run
along local X and their full length includes both caps. Segment endpoints are
world coordinates; optional radius makes a rounded segment. Segments default
to static, and zero-thickness segments cannot be dynamic. Planes are always
static solid half-spaces: the normalized normal points toward the allowed side,
`dot(normal,point) >= offset`. Their default is a floor at y=0. Finite segments
are two-sided. Circles, capsules and segments use analytic contacts and casts;
dynamic disks and capsules use exact area mass/inertia.

2D hulls accept flat xy values or arrays of `[x,y]` points. The convex boundary
has 3–32 vertices after duplicate, collinear and interior points are removed.
Geometry is centered on its area centroid; `position` sets that center of mass,
and `angle` rotates around it. Mass/inertia use exact polygon integrals. Contacts
use edge clipping, and GPU rays and disk sweeps use the actual polygon. Live
hull spawning grows the optional geometry storage within device limits; it does
not change the body buffer layout or reserve extra storage in box-only worlds.

`gpu.attachToScene(scene,{maxSubSteps?,maxFrameTime?,afterStep?})` automatically
steps 2D physics before Babylon rendering and destroys the solver on scene
disposal. Defaults: six catch-up steps and at most 0.05 seconds elapsed per
frame. No poses are downloaded by this loop. `detachFromScene()` removes both
observers without destroying the solver. Destroying a solver also detaches it;
the shared device remains owned by the caller. Drawing remains your choice.

`AvbdScene2D.addHinge(a,b,anchorA?,anchorB?,{minAngle?,maxAngle?,motor?})`
returns `{joint,limits,motor,dispose(),destroy()}`. Bounds are radians of
A-minus-B rotation relative to creation; they are unwrapped and may span multiple
turns. Missing bounds leave angular motion free. Stops use two unilateral AVBD
rows rather than pose clamping. `addAngularLimit(a,b,options)` adds only the
angular rows. Its handle exposes `setLimits(options)` before and after solver
creation; `gpu.setAngleLimits(slot,options)` also changes them live. Equal bounds
lock the relative angle. `gpu.setMotor(hinge.motor.slot,options)` changes a motor.

2D `createSolver(device,{sleeping:true})` enables GPU sleeping. Options can set
positive `speedThreshold` and `timeThreshold`. Body `allowSleep:true` enables the
policy automatically; `false` excludes that body. `gpu.setSleepEnabled(index,bool)`
changes eligibility. `enableSleeping(options)` enables or reconfigures the policy;
`disableSleeping()` wakes all bodies and releases it. `wakeUp(index)` conservatively
wakes the world. `readSleepStats()` returns counts, and `readBodyState(index)`
includes `sleeping`. Supported quiet bodies rest; impacts, lost supports, active
motors and edits wake before movement solving. Sleeping keeps mass/inertia and
collision detection intact. The GPU body flag is `velocity.w`; renderers must
not mistake sleeping for zero mass. No additional buffer is required by the
movement or topology shader; the optional policy owns its state separately.

When sharing a device, the caller owns it; world disposal leaves it alive. A
device created by `AvbdPhysics.create()` belongs to the world and is destroyed
with it. Direct source imports require the repository's WGSL text loader (or equivalent
bundler configuration); the built package already bundles its shaders. The mixed gallery is a complete runnable example at
`/?demo=showcase`.

`createWebGPUDevice({requiredLimits,preferredLimits})` treats required limits as
requirements: unsupported requests fail with the limit name and adapter value.
Preferred maximum capacities adapt downward to the adapter. Requirements override
preferences for the same limit. Babylon world creation uses preferred capacities
so small scenes can run on devices with lower storage limits. Unexpected device
loss stops automatic Babylon stepping, releases the world and records details in
`physics.deviceLost` and `physics.errors`; recreate the world with a new device to
resume. A disposed world does not report its normal device destruction as a failure.
