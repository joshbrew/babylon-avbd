# Integrating AVBD into a Babylon.js project

Use `AvbdPhysics` for GPU collision detection and rigid-body simulation, with
Babylon meshes for the interactive view. The aggregate/body methods follow
familiar Babylon conventions: mass, friction, velocities, impulses and disposal.
AVBD computes body motion and contacts on the GPU; Babylon renders the results.
This adapter has its own world; it does not implement Babylon's full
Physics V2 plugin interface or install through `scene.enablePhysics()`.

**Jump to:**

- [Install the library](#install-the-library)
- [A complete small scene](#a-complete-small-scene)
- [Move, launch and reuse bodies](#move-launch-and-reuse-bodies)
- [Choose a rendering path](#choose-a-rendering-path)
- [Reproduce the collision and solver benchmarks](#reproduce-the-collision-and-solver-benchmarks)
- [Current shape and API support](#current-shape-and-api-support)
- [Choosing collision detection](#choosing-collision-detection)

## Install the library

The package is named `avbd-babylon`. For a local build, run `npm install` and
`npm run build` in this repository. From your
Babylon project, run `npm install /absolute/path/to/avbd` or install the archive
created by `npm pack`. Import from `avbd-babylon` using your normal bundler.
The ESM output already contains the solver and shader strings. No TypeScript
source compilation or WGSL loader is needed in your project. The package has
no Babylon runtime imports; it uses the mesh objects your project provides.

`npm run build` builds only the library. `npm run build:web` builds the lab and
browser tests. `npm start` builds the library and serves the lab together.
`npm run build:cdn` creates `dist/avbd.global.js`, which exposes `globalThis.AVBD`.
Host that file yourself and load it with a normal script tag; use
`const { AvbdPhysics, AvbdPhysicsAggregate, AvbdShapeType } = AVBD`.
There is no public CDN release URL yet.

WebGPU
needs a supported browser and localhost or HTTPS. The default world requests
9 storage bindings, a 512 MiB storage binding limit and a 1 GiB buffer limit;
unsupported adapters fail during creation. Babylon drawing can use either its
WebGL or WebGPU engine when using the small-scene mesh bridge.

## A complete small scene

This example expects `<canvas id="canvas"></canvas>` styled to fill the page.
Use your project's existing Babylon dependency.

```js
// src/main.js
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  MeshBuilder,
  Vector3,
} from "@babylonjs/core";
import { AvbdPhysics, AvbdPhysicsAggregate, AvbdShapeType } from "avbd-babylon";

const canvas = document.getElementById("canvas");
const engine = new Engine(canvas, true);
const scene = new Scene(engine);
const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,
  Math.PI / 3,
  12,
  new Vector3(0, 2, 0),
  scene,
);
camera.attachControl(canvas, true);
new HemisphericLight("light", new Vector3(0, 1, 0), scene);

const floor = MeshBuilder.CreateBox(
  "floor",
  { width: 20, height: 1, depth: 20 },
  scene,
);
floor.position.y = -0.5;
const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
box.position.y = 4;

const physics = await AvbdPhysics.create({
  scene,
  gravity: new Vector3(0, -9.81, 0),
  timeStep: 1 / 60,
  iterations: 10,
  capacity: 64,
});
new AvbdPhysicsAggregate(floor, AvbdShapeType.BOX, { mass: 0 }, scene);
const fallingBox = new AvbdPhysicsAggregate(
  box,
  AvbdShapeType.BOX,
  { mass: 2, friction: 0.6 },
  scene,
);

// The world attaches to the scene and allocates on its first simulation step.
// Create aggregates before the render loop starts.
fallingBox.body.setAngularVelocity(new Vector3(0, 1, 0.5));

engine.runRenderLoop(() => scene.render());
const resize = () => engine.resize();
window.addEventListener("resize", resize);
window.addEventListener(
  "pagehide",
  () => {
    window.removeEventListener("resize", resize);
    physics.dispose();
    scene.dispose();
    engine.dispose();
  },
  { once: true },
);
```

The fixed-step observer allows up to three catch-up steps per rendered frame.
Mesh poses arrive asynchronously; do not await them in the render loop. `create({ scene })` attaches automatically and disposes with the scene. For a
custom simulation loop, pass `autoAttach: false` and call `step()` yourself.
`attachToScene()` is also available and does not attach a second observer when
called again for the same scene.

## Move, launch and reuse bodies

```js
fallingBox.body.setLinearVelocity(new Vector3(0, 0, 5));
fallingBox.body.applyImpulse(new Vector3(3, 0, 0), box.position);
fallingBox.body.applyAngularImpulse(new Vector3(0, 2, 0));

// Teleport retains existing velocities; reset them explicitly for a fresh launch.
fallingBox.body.teleport(new Vector3(0, 3, -5));
fallingBox.body.setLinearVelocity(new Vector3(0, 0, 12));
fallingBox.body.setAngularVelocity(Vector3.Zero());
```

Commands are combined and applied against the current GPU state. They do not
upload a stale CPU pose. Create projectile slots before initialization and reuse
them for spawning. `aggregate.dispose()` disables its collision participation;
the caller still owns the mesh. Dispose the world before disposing its scene.

## Choose a rendering path

| Scene size and needs                | Rendering path                                       | Cost to watch                             |
| ----------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Small interactive scenes            | Default Babylon mesh bridge                          | Pose readback and individual mesh updates |
| Repeated geometry, moderate counts  | Instances or thin instances with a batched pose copy | CPU matrix updates and uploading matrices |
| Tens of thousands of moving objects | Draw directly from the live GPU body buffer          | GPU rendering and collision/solver work   |

Babylon [instances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances)
share source geometry and material. [Thin instances](https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/thinInstances)
store repeated transforms in buffers and avoid a separate scene object for every
visible copy. Group objects by geometry and material. Instancing reduces drawing
overhead; it does not reduce the number of physics contacts.

For a moderate number of identical, origin-centred unit boxes, this bridge copies
all poses once and updates a single thin-instance matrix buffer. Here `physics`
was created with `syncMeshes: false`, and `boxes` contains box aggregates created
with `sync: false`. Their original visual meshes should be hidden; `source` is
an independent unit-box mesh at the origin with identity rotation and scale.

```js
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";

physics.initialize();
const indices = boxes.map((aggregate) => aggregate.body.gpuIndex);
const matrices = new Float32Array(boxes.length * 16);
const matrix = Matrix.Identity();
const position = Vector3.Zero();
const rotation = Quaternion.Identity();
const scale = Vector3.One();
let pending = false;

source.thinInstanceSetBuffer("matrix", matrices, 16, false);
scene.onBeforeRenderObservable.add(() => {
  if (pending) return;
  pending = true;
  physics
    .readBodies()
    .then((poses) => {
      for (let i = 0; i < indices.length; i++) {
        const offset = indices[i] * 40;
        position.set(poses[offset], poses[offset + 1], poses[offset + 2]);
        rotation.set(...poses.subarray(offset + 4, offset + 8));
        Matrix.ComposeToRef(scale, rotation, position, matrix);
        matrix.copyToArray(matrices, i * 16);
      }
      source.thinInstanceBufferUpdated("matrix");
      source.thinInstanceRefreshBoundingInfo();
    })
    .catch(console.error)
    .finally(() => {
      pending = false;
    });
});
```

This is a CPU bridge for moderate counts. It still copies the full body buffer,
calculates matrices and uploads them. Bounding updates also cost CPU time. For
known contained motion, a deliberately conservative bounding volume can avoid
rebuilding bounds each update; ensure it covers all moving instances.
For hulls or meshes with offset origins, reconstruct the mesh transform using
the aggregate's local centre and principal rotation as the adapter does; the
unit-box example does not handle those offsets.

For a large scene:

```js
const physics = await AvbdPhysics.create({
  capacity: 100_001,
  iterations: 4,
  syncMeshes: false,
});
// Create all bodies before initialize(), with { sync: false }.
physics.initialize();
const bodyBuffer = physics.bodyBuffer;
const gpuIndex = aggregate.body.gpuIndex;
physics.step(); // One fixed step; submission does not await completion.
```

A custom WebGPU renderer can read `bodyBuffer` on the **same GPUDevice** and draw
instances from live poses. Buffers cannot be shared across devices. The adapter
does not automatically connect this storage buffer to Babylon thin instances,
and it does not access Babylon private engine fields. If your renderer exposes
a device you own, pass it to `AvbdPhysics.create({ device, ... })`. A caller-owned
device stays alive when the world is disposed.

Thin instances do not automatically create colliders. The aggregate API takes
one mesh per physics body, which has a startup cost for very large scenes.
For 100K bodies, the laboratory's native body/scene builders avoid creating
100K Babylon mesh objects; see [canonicalScenes.js](../demo/canonicalScenes.js).
Import `AvbdScene2D` or `AvbdScene3D` from `avbd-babylon/native` for the same
renderer-independent integration. Both expose live body handles, bulk commands,
packed velocity uploads, selected pose reads, triggers, masks, restitution,
sleeping and contact events. See the package README's
[native examples](../README.md#native-physics-with-any-renderer).
The direct-buffer renderer and small-scene aggregate bridge are separate
integration paths.

See [canonicalRenderer.js](../demo/canonicalRenderer.js) and
[canonicalRender.wgsl](../demo/canonicalRender.wgsl) for the direct rendering path,
and [mixedColliderDemo.js](../demo/mixedColliderDemo.js) for the Babylon mesh bridge.
The laboratory scene builders use z up; the Babylon adapter uses y up by
default. Match your renderer's coordinates to the world you create.

The 3D body stride is 40 floats / 160 bytes: position at 0, quaternion xyzw at 4,
size at 16, mass at 19, principal inertia at 20, linear velocity at 32 and angular
velocity at 36. Spatial sorting changes GPU order. Use `body.gpuIndex` after
initialization rather than assuming creation order equals buffer order.

Use shared geometry/materials and a small number of draw calls. For independent
solver measurements, omit drawing entirely. For whole-app comparisons, keep
resolution, antialiasing, shadows, materials and camera fixed. Enhanced colors,
lighting and 4× MSAA are interactive presentation options in this app;
`quality=benchmark` disables them. Keeping physics settings fixed makes a
rendering optimization easier to identify.

## Reproduce the collision and solver benchmarks

Start this repository with `npm start`, then open
[/tests/performance.html](http://127.0.0.1:8080/tests/performance.html).
Select a scene and play it before measuring. The preview closes during a run
and restarts afterward. “Run all scenes” measures the complete scene catalog, including
10K, 50K and 100K dense 2D piles.

For a repeatable solver-only run, use this JavaScript in the benchmark page's
developer console after it is ready. `__PERFORMANCE__` is the repository's test
harness, not part of the Babylon world API.

```js
const measurements = [];
await __BENCHMARK_VIEW__.suspendPreview();
try {
  for (const scene of [
    "2d-stress-pile-10k",
    "2d-stress-pile-50k",
    "2d-stress-pile-100k",
    "showcase-box-columns-100k",
    "showcase-brick-ring-110k",
  ]) {
    for (let repeat = 0; repeat < 3; repeat++) {
      const result = await __PERFORMANCE__.run(scene, "production", 60, 60);
      measurements.push({ ...result, repeat });
    }
  }
  console.table(
    measurements.map((r) => ({
      scene: r.scene,
      objects: r.bodyCount,
      contacts: r.peakContacts,
      iterations: r.params.iterations,
      collisionMs: r.summary.collision.mean,
      movementMs: r.summary.solve.mean,
      physicsMs: r.summary.total.mean,
      slowerStepsMs: r.summary.total.p95,
    })),
  );
  const data = { adapter: __PERFORMANCE__.info, measurements };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    }),
  );
  const download = document.createElement("a");
  download.href = url;
  download.download = "avbd-replication.json";
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
} finally {
  await __BENCHMARK_VIEW__.preview.load(document.getElementById("scene").value);
}
```

Each run starts fresh, warms up for 60 steps and records 60 distinct GPU
timestamp samples. Every step checks contact capacity and scheduling conflicts.
The 2D stress scenes use touching boxes, gravity, friction and ten iterations,
without sleeping. The 3D showcase uses each scene's recorded settings. Compare
collision time with contact count; equal body counts across dimensions do not
guarantee equal collision work.

For controlled engineering profiles, use `scripts/profile-solver.mjs` or
`scripts/profile-paired.mjs`. Set `AVBD_PROFILE_SCENES`,
`AVBD_PROFILE_VARIANTS`, `AVBD_PROFILE_WARMUP`, `AVBD_PROFILE_SAMPLES` and
`AVBD_PROFILE_REPEATS` explicitly. Public benchmark controls use the production
automatic choice.

GPU work layout selection is automatic in `AppGpuSolver3D` and the Babylon
adapter. Body count and active joints select the contact calculation; contact
load selects thread sharing for very large scenes. The 100K columns preset
shares face-contact points across threads. Dense rigid scenes above 250K bodies
with at least 1.75 manifolds per body use eight threads per body. The same large
scenes cache sorting keys for contact lists of up to sixteen entries; longer
lists retain their general sorting path. Deformable shaders remain intact.

```js
const world = await AvbdPhysics.create({ scene }); // automatic by default
// Create aggregates before the render loop.
world.initialize();
console.log(world.solverDecision); // implementation and reason
```

Body and joint changes are reconsidered before the next step. Contact-load
adaptation reuses existing capacity-counter readbacks rather than adding a
per-frame pose copy. Positions, velocities, friction, rotation and iteration
counts are retained. The policy follows measurements on the test laptop;
results on other GPUs may differ. Advanced `setSolverMode()` overrides remain
available for controlled engineering measurements and compatibility. The
browser benchmark runs the production automatic choice.

Web Workers can keep scene construction and command submission from blocking
the page. They do not divide the already-parallel GPU kernels among CPU threads.
The current API runs on the caller's thread. A complete worker integration would
own the GPU solver and an OffscreenCanvas renderer together, send inputs and
small status messages, and draw directly from the GPU body buffer. Copying every
body's pose between threads each frame would defeat that design. Worker-based
Babylon drawing also requires a compatible Babylon engine setup and replacing
DOM-dependent controls with forwarded input messages. The root [README worker example](../README.md#worker-integration) shows the
OffscreenCanvas setup and message forwarding. Use the benchmark's `setup` and
`summary.submission` fields to
judge the CPU cost separately from GPU physics.

Both GPU solvers hold poses and velocities if a step runs
out of contact storage or has conflicting solve groups. The host can then grow
capacity without advancing an incomplete movement solve. Counters still report
the failure: a held step does not pass correctness checks. This safeguard does
not change valid-step equations or remove the need to reserve enough capacity.

`npm run test:web` also checks screenshots, controls, benchmark preview lifecycle,
navigation, and six-second dense 2D motion. Keep other GPU workloads closed.

Lower GPU milliseconds are better; higher app FPS is better. Physics timings
separate collision checks, contact setup, scheduling and movement calculations.
They exclude drawing, sleeping, CPU submission and copying results back.
Instrumented timing passes add overhead. The “CPU + wait” column includes GPU
work and readback, so it is not an isolated CPU cost. Report GPU model, driver,
scene, timestep, iterations, sample counts and contact counts with comparisons.

The premade reports were recorded on an **NVIDIA GeForce RTX 4070 Laptop GPU**.
They are saved examples; running the browser benchmark measures your own GPU.

The [solver report](http://127.0.0.1:8080/test-results/solver-performance.html)
includes the [AVBD paper](https://graphics.cs.utah.edu/research/projects/avbd/Augmented_VBD-SIGGRAPH25.pdf)
comparison. Its RTX 4090 / DirectX / LBVH results and this browser's
RTX 4070 Laptop / WebGPU / spatial-grid results have different hardware and
timing boundaries. They are workload context, not a same-hardware speed ratio.

## Current shape and API support

Boxes, spheres and capsules have native collision geometry. Capsules use exact
rounded segments along local Y. Cylinders and custom hulls use polygonal convex
hulls, limited to 32 vertices. Meshes must be root
meshes with positive scale; bake parent or negative transforms first. Colliders
capture geometry, mass properties and transforms at creation. Sphere dimensions
must be uniform.

The adapter supports restitution, friction, velocity and impulse commands,
teleports, collision masks, contact/trigger events, GPU raycasts, per-body sleep
eligibility, ball joints, welds, elastic or breakable springs, 3D hinges with
angle stops and torque-limited motors. Both dimensions expose GPU raycasts;
3D sphere casts and 2D circle casts include rounded corner tests. It has no
complete Physics V2 plugin or concave mesh collider.
Static bodies with velocity move kinematically. Portable builders include 3D
ropes, ragdolls and fabric. Automatic mesh synchronization is limited to 2048
bodies by default; large scenes should draw GPU poses directly.
For full method signatures and ownership rules, see [BABYLON_API.md](BABYLON_API.md).

## Choosing collision detection

`AvbdPhysics.create` accepts `broadphase: "auto"` (default), `"grid"` or
`"hploc"`. Automatic selection uses a GPU tree for large scenes with varied
collider sizes or many linked thin plates, such as the ragdoll net.
Small scenes and uniform block scenes retain the grid. Measure your own workload;
body count alone does not predict which method is faster.

```js
const physics = await AvbdPhysics.create({
  scene,
  capacity: 50000,
  syncMeshes: false,
  broadphase: "auto",
  bvh: { rebuildInterval: 64 },
});
```

The tree refits every collider each step, including rotations and teleports.
Rebuilds improve its quality; refitting preserves coverage between rebuilds.
The same narrowphase, friction and rotational AVBD equations handle its pairs.
See [GPU tree design and limits](HPLOC.md) for implementation details.

For a controlled comparison, open `/tests/performance.html`. Its collision
selector compares the grid and tree without changing solving rounds. Both
methods are also available in the playable laboratory.

```js
try {
  const pair = await __PERFORMANCE__.runPaired(
    "3d-mixed-sizes-50k",
    ["grid", "hploc"],
    60,
    60,
  );
  console.table(
    pair.results.map((r) => ({
      collisions: r.broadphase,
      collisionMs: r.summary.collision.mean,
      physicsMs: r.summary.total.mean,
      firstStepMs: r.startup.total,
    })),
  );
} finally {
  await __BENCHMARK_VIEW__.preview.load(document.querySelector("#scene").value);
}
```

Use `grid-detail` / `hploc-detail` to split collision preparation, nearby-pair
search, exact contact checks, body solving and contact-force updates. These
extra timers add pass boundaries, so compare matching modes. Paired runs keep
two independent simulations in memory; their absolute times are separate from
the single-world paper comparison. Raw JSON retains startup, rebuild spikes,
all samples, buffer bytes, selection decisions and noisy timing flags.
