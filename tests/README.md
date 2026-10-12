# GPU validation and browser benchmarks

Numerical and stability validation runs physics on the GPU. Shared API checks
also run CPU compatibility worlds. Package, type and source-integrity checks
run on the host because they inspect files and JavaScript APIs.

| Command                             | Scope                                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                          | GPU numerical and stability regressions                                                                                                                               |
| `npm run test:sleeping`              | Local grab waking, rotating impacts, startup sleeping, long 28K-ring settling and the 34K jointed drop through landing and settling |
| `npm run test:complete`             | GPU suite, shared pipeline contract, package, pinned-source integrity and live Babylon example                                                                        |
| `npm run test:pipelines`            | Same 2D/3D package application calls on CPU and WebGPU: bulk edits, queries, joints, triggers, bounce, sleeping, scene attachment and disposal                        |
| `npm run test:cpu`                  | CPU compatibility scene views, controls, screenshots and physics measurements                                                                                         |
| `npm run test:web`                  | All GPU scene views, benchmarks, motion, controls, screenshots and reports                                                                                            |
| `npm run test:package`              | ESM/global bundles, declarations and production dependencies                                                                                                          |
| `npm run test:types`                | Public declarations with real Babylon types and portable API consumers                                                                                                |
| `npm run test:playgrounds`          | Tornado debris and mortar breakage, domino chain propagation, 40,000-marble normal-distribution checks, worker/rendering controls, stable forts and slingshot victory |
| `npm run test:castle`               | Mortar settling, local impacts, rotating debris and responsive layout                                                                                                 |
| `npm run test:cloth`                | Thirty-second limb/net checks, central cloth tearing and screenshots                                                                                                  |
| `npm run test:features`             | 2D/3D hinge stops, motor reversal/braking, sensors, live masks and casts                                                                                              |
| `npm run test:mobile-contacts`      | 3D floor contacts, device-verified fallback selection, 8/9 binding limits and mobile drawing                                                                          |
| `npm run test:connected-phone`      | Physical Android GPU: prepared native/Babylon APIs, floor contacts, 2D/3D features and grid/HPLOC++ collisions                                                        |
| `npm run test:connected-demos`      | Physical Android: ten production scenes, screenshots, short GPU/completion timings, hinges, sensors, terrain, cloth and 40K marble flow                               |
| `npm run test:renderers`            | Every canonical scene and the slingshot in Babylon; shared-state renderer benchmark checks                                                                            |
| `npm run benchmark:renderers`       | Direct WebGPU versus Babylon: GPU drawing/copies, CPU submission and completion; three repeats                                                                        |
| `npm run test:fracture`             | Voronoi partition, breakable face bonds, wrecking-ball impact and persistent rubble                                                                                   |
| `npm run test:reference`            | Explicitly requested upstream CPU comparison; excluded from normal validation                                                                                         |
| `npm run benchmark:native`          | 2D/3D movement/spin, property edits, grouped queries, sleeping and selected reads; three repeats                                                                      |
| `npm run benchmark:connected-sleep` | 505,923-body walls: all-awake overhead and later impacts with whole-world versus automatic connected-group waking; two alternating paired runs                        |
| `npm run benchmark:small-groups`    | 9- and 32-body closed worlds: automatic workgroup movement versus separate dispatches, three paired runs and exact final body-state comparisons                       |
| `npm run benchmark:native-edits`    | 100K motion updates, 10K property edits and 64 ray queries in 2D/3D; API overhead and GPU completion                                                                  |

The [benchmark source index](../README.md#benchmark-sample-code) links to the
copyable examples, scene builders and measurement runners. The
[demo source guide](../demo/README.md) shows where each demo is configured and initialized.

Set `AVBD_TEST_BROWSER` to a Chromium executable if browser discovery fails.

`node scripts/check-galton-startup.mjs` measures startup of the 40,000-marble
playground and verifies default worker execution, an explicit main-thread choice,
and automatic fallback when workers are unavailable. It also checks that page
dependencies stay small before starting the worker. `test:playgrounds` also
checks that at least 99.5% of marbles reach the bins, compares GPU counts with real
body positions, and measures the shape of the distribution.

`check-galton-pegs.mjs` checks mouse and touch retraction, restoration and live
poses with direct drawing, Babylon, shared-input workers and CPU compatibility.
`check-lab-timing.mjs` checks fixed-step clocks at 30–240 display frames per second
and bounded catch-up under load. `check-lab-sleep.mjs` checks live sleeping
toggles, large-scene defaults and bowling balls in all sixteen wall lanes.
`check-sleep-stability.mjs --drag` follows the 28K brick ring for 900 steps and
checks that creating a grab and repeatedly updating its anchor leave a distant,
disconnected sleeper asleep with unchanged poses. GPU regressions also check
grab release and stale gravity predictions beside an awake resting body.
`check-jointed-settling.mjs` measures GPU collision and movement time while the
34K jointed drop lands, comparing sleeping off, whole-world waking and automatic
group sleeping. It checks contact capacity and solve-group conflicts on every
step, then measures the rendered worker view separately. These longer checks run
through `test:sleeping` and `test:web`; the live toggle checks also run through
`test:playgrounds`.

`check-lab-step-rate.mjs` checks live physics step-rate changes, retained poses,
scene defaults and URL settings with CPU, WebGPU, Babylon and worker execution.
The showcase exposes steps per second beside solving iterations. Both settings
remain fixed while a benchmark measurement runs.

`check-runtime-efficiency.mjs` also checks that workers finish explicit GPU
cleanup before termination, with a bounded fallback for an unresponsive worker.

`node scripts/check-demo-startup.mjs --all` initializes every scene in a paused
worker and saves setup times separately from frame performance. Browser and driver
caches can warm during the run. `node scripts/check-slingshot-input.mjs` uses real
browser mouse, touch and keyboard events to check aiming, the trajectory line,
release, touch cancellation and reloading in direct, Babylon and worker views.

`npm run test:terrain` checks terrain cooking, floor and roof contacts, mesh
imports and Babylon transforms. `npm run test:workers` also checks paused
redrawing, camera input, resizing, queue backpressure, shared status readbacks
and pixel-identical batched rendering. `npm run benchmark:hploc-refit` measures
the leaf-bound update separately at 2K, 100K and 510K bodies; its timings describe
that kernel rather than the whole physics step.

The runner uses an isolated temporary profile and a real WebGPU adapter. Missing
WebGPU, validation errors or failed assertions fail the command; they are not
silently skipped. Results and screenshots are generated under `test-results/`.

Run `node scripts/clean-results.mjs` to preview obsolete artifacts, or
`npm run clean:results` to remove them. Cleanup keeps current validation
summaries, the published reports, their measurement inputs and every image linked
from the reports or main README. Generate reports with `npm run test:web` before cleaning. Deletions are
restricted to `test-results/`; package sources and demo assets are untouched.

`npm run clean:dist` removes generated validation wrappers and local debug
maps after testing. It retains the package builds and assets referenced by
`index.html` and all browser test pages. Test commands regenerate their own
temporary bundles when needed. Preview with `node scripts/clean-dist.mjs`.

After fixing a report or screenshot check, resume the browser suite with
`npm run test:web -- --from=check-improvements` (or another check name).
This preserves preceding passed checks from the saved suite report. Run the
whole suite again after solver or scene changes that affect those checks.

## Physics coverage

Renderer comparisons use one physics world on one GPU device. Both renderers
draw each completed step with the same camera, geometry and visual shaders;
their order alternates. Measurements use 960 × 540 pixels
and one engine/device throughout an all-scene run, with fresh physics worlds
for each scene and repeat. Repeated runs are combined in the visible bars;
their individual timings remain available in the details. Antialiasing
and debug overlays are off. Babylon uses thin instances and merged hull geometry,
with GPU storage copies instead of CPU pose downloads or matrix updates.
The check verifies finite poses, contact capacity and unchanged selected body
records. Drawing, GPU copies, CPU submission and queue completion are reported
separately. They do not measure displayed FPS. Use
`npm run benchmark:renderers -- --all` for every canonical workload.
Saved results identify the RTX 4070 Laptop GPU; visitor runs use their own GPU.

GPU tests check analytic free fall, resting heights, friction, angular inertia,
collider pairs, rotations, mixed stacks, sleeping, support removal and local
100K-wall impacts. Canonical 2D GPU checks cover stacks, pyramids, friction,
motors, cantilevers, heavy ropes, fracture and dragging. Shape checks cover
analytic 2D circle/capsule contacts, finite lines, infinite planes, shape casts,
exact area mass/inertia and live GPU body commands. Convex polygon checks cover
point-cloud construction, centroid inertia, all mixed collider pairings in both
index orders, clipped resting contacts, exact ray/disk casts and live geometry
storage growth. Native 2D Babylon checks verify fixed stepping, single attachment,
detachment and scene-owned solver disposal. Shared native 2D/3D checks verify
ordered command batches, automatic packing of object setters, adjacent setter
coalescing, packed velocity uploads, CPU/GPU buffer reuse, concurrent selected reads,
live off-centre impulses, teleport contact invalidation, preservation of sensor
flags, masks, sleeping and renderer-independent fixed stepping. A ten-second mixed-shape
scene check also verifies containment, desktop/mobile drawing and its playable
benchmark preview. Fabric checks cover
spring stiffness, implicit movement, anchors and rigid-object impacts. Babylon
checks exercise aggregates, scene stepping, disposal, forces, teleports, hulls
and collision filters against live GPU state.

Batching checks additionally cover linear/angular masks, reusable packed motion
arrays, atomic property validation, sparse mask/trigger updates before queries,
single-submission native and Babylon stepping with sleep and bounce enabled,
motor warm-start preservation, removal ordering, cached pass-constant invalidation,
and concurrent query-pool reuse/disposal. Closed small-world tests compare every
body field through zero iterations, dense contacts, bounce, triggers, teleports
and the automatic fallback when joints are added. Connected-group sleep tests
check complete pile waking, unchanged neighboring sleepers on a shared floor,
and support removal with grid and HPLOC collisions. Sleep and bounce uniform checks compare
all body fields and sleep records against unconditional uploads while changing
the timestep, gravity, support, masks and contact capacity. Native API benchmarks measure 100K motion
edits, 10K property changes with per-body versus grouped flushing, and 64 separate
versus grouped rays. These API/query measurements exclude solving and rendering.

Release API checks cover atomic validation, native 3D masks, disposable 2D
constraints, live motor reversal and zero torque, required/preferred device
limits and stopping the Babylon scene loop after device loss. Both dimensions
hold movement and joint forces on collision overflow or solve-group conflicts,
then resume after capacity recovery. 2D protection is also tested with sensors
and restitution enabled. Package checks install the actual tarball in a temporary
consumer and verify that Babylon is not automatically installed.

2D policy checks cover grounded stacks, sleeping exclusions, live spawning,
same-step reciprocal impacts, impulses, support removal, masks, sensor floors,
unsupported slow falls and powered joints. Angular checks cover both stops,
live edits, equal-angle locks, free full turns, two-body angular momentum and
post stabilization. Browser checks exercise both policy scenes and the slingshot
demo at 1K/5K/10K bricks, including pointer launch, reloading, sleep toggling and
desktop/mobile screenshots. The package benchmark also compares sleeping off/on
for a 10,000-box 2D stack, including the cost of checks while everything is awake.

The ragdoll-net regression uses the production 1/240-second timestep and
checks for wholly submerged limbs, ragdolls straddling the visible sheet,
and capsule-to-triangle intersections deeper than 5 mm every quarter-second
through 30 simulated seconds. The tearable sheet check requires an
intact, stretched sheet before impact, a central tear with all four attachments
and the outer fabric intact, the ball passing through, finite
poses and valid rotations. Detached fabric checks require retained material,
mass and live bodies as the pieces fall and settle on the floor. These scenes
use discrete collisions with rigid patches.

Storage growth, resets, warm starts and deterministic repeated runs are checked.
Forced contact overflows and conflicting solve groups must hold motion until
capacity recovers. The optimized contact layouts retain friction, rotations,
joint forces and solving rounds. Cached adjacency checks exercise short lists,
long-list fallback and joints against the independent sorting implementation.

HPLOC++ tests cover empty and partial treelets, duplicate Morton keys, mixed
rotated shapes, filters, large statics, teleports, added bodies and capacity
recovery. Pair sets are checked against the grid. See [tree design](../docs/HPLOC.md).
The five active GPU fixtures under `tests/legacy/` provide additional independent
regressions; unused CPU engines and retired demo code are not required.

Pinned sources, fixtures and the six upstream test files under
`reference/three-avbd/` are preserved and checked against their recorded hashes.
The upstream CPU suite is available for explicit comparisons only. Browser
scene checks supplement numerical assertions; they do not claim line coverage
or prove that every possible scene is stable.

## Browser scene and performance checks

`npm run benchmark:particles` measures the D20 surface-only particle test with
sprites visible, searches for sustained 60 FPS, and repeats counts near the
boundary. GPU collision and sprite passes are timed separately. Results and
the method are saved in [the particle capacity report](../test-results/particle-capacity.html).
`tests/gpu-utilities.js` checks exact particle state across one- and two-dimensional
dispatches, partial groups, valid counters, surface hits and invalid uploads.

`npm run test:workers` checks CPU and GPU worker trajectories, Babylon rendering,
pointer ordering and operation without shared-memory headers.
`npm run benchmark:workers` compares matched main-thread, message-worker and
shared-input execution; open [the interactive comparison](workers.html) to play
or measure a selected scene. GPU timestamps, CPU work and page delay are separate.
Recorded results name the measured hardware; shared input is optional.

`npm run test:terrain` validates heightfields and concave mesh terrain, floor/roof
contacts, raycasts and removal on CPU, GPU grid and HPLOC paths. It also checks
Babylon registration, imported OBJ geometry, smooth source-mesh drawing, worker
execution and terrain screenshots. `npm run test:naval` checks
floating, settling under sail forces, local damage, material buoyancy, sinking and persistent fragments, with desktop
and narrow-layout captures. Naval water physics requires WebGPU.

`npm run benchmark:naval` measures the grid and HPLOC collision paths with the
same water resolution, timestep, iterations and ship geometry. Physics GPU time,
water GPU time and drawing GPU time are measured separately. Browser timings
vary; repeat runs before comparing small differences.

`check-scenes.mjs` visits the full GPU catalog, advances each scene, checks
finite positions, rotations and solver counters, and saves screenshots and
frame/physics/drawing timings. Dedicated checks cover the castle, 100K local
impact, dense 2D scenes, half-million walls, fabric, mixed colliders and D20
particle sprites. Preview checks verify that playing stops before measurement
and resumes afterward. Report checks verify navigation, plain-English labels,
loaded screenshots and desktop/mobile layout.

Open `/tests/performance.html` after `npm start`. Choose a scene and play it,
or run one scene or the whole catalog. The app automatically selects the GPU
work layout and collision path. Timestamp-query support is required for GPU
measurements. Each fixed step is measured separately with drawing and sleeping
disabled; every step checks contact storage and solve-group conflicts.
Downloads include GPU stages, CPU submission, initial scene construction,
solver settings, chosen work layouts and correctness counters. CPU submission
is elapsed time in `gpu.step()`; it can include browser/driver overhead and is
not the GPU timestamp or a pure JavaScript instruction count.

The saved reports identify their RTX 4070 Laptop GPU. A live run measures the
current computer. The AVBD paper's desktop RTX 4090 numbers are separate and
use reconstructed scenes, not an identical hardware/asset comparison.

Internal profiling tools `profile-solver.mjs` and `profile-paired.mjs` retain
engineering overrides. Paired runs alternate order every step and preserve all
samples. Do not run GPU workloads concurrently. `AVBD_PROFILE_SCENES`,
`AVBD_PROFILE_VARIANTS`, `AVBD_PROFILE_WARMUP`, `AVBD_PROFILE_SAMPLES` and
`AVBD_PROFILE_REPEATS` configure these tools. Public benchmarks use production
automatic selection rather than presenting competing solver versions.

`npm run benchmark:gpu-uploads` measures CPU preparation and uploads for the
WebGPU solver's settings in both dimensions. It isolates that overhead from GPU
physics and drawing. Stable 2D settings need no upload; a normal 3D step uploads
the changing generation word. Live setting changes still update their exact
GPU values. The GPU regression suite checks the serialized words against the
pinned layouts, including changed flags, wind, timestep and replacement buffers.

`npm run benchmark:gpu-scheduling` measures stable GPU color bucketing in 2D and
3D, with 256, 1,024, 2,416, 100K and 510K bodies, varied color counts and sparse/dense moving
sets. It compares every rank, histogram word and counter against the pinned
kernel before timing. Large worlds select bitset ranks automatically. The body
ordering, collision work, equations and iteration count remain the same. These
are kernel timings, not total physics or frame-rate improvements.

`node scripts/benchmark-workers.mjs --gpu` refreshes just the WebGPU worker
comparisons and preserves the existing CPU compatibility rows.

`npm run benchmark:movement` compares movement-solver batching with the same
contact equations, timestep and iterations in 100K columns, the 110K ring and
the half-million walls. Two runs reverse GPU-world creation order and alternate
execution order every step. Every resulting body-state value must match exactly;
every step checks contact capacity and conflicting solve groups. GPU timestamps
separate moving bodies from updating contact forces, with drawing and sleeping
disabled. Results are saved in `test-results/movement-solve-performance.json`.
Large rigid worlds select parallel point updates automatically; the shared-point
layout also uses compact symmetric Newton matrices and packs frequently read
pose fields during solving. GPU regressions check the restored public buffer
byte for byte, including partial tiles, unused capacity and appended bodies.
They also cover zero iterations, failed-step recovery, wind, joints, motors,
springs, bounce, sensor rebuilds, mode changes, mobile compatibility layouts
and million-manifold dispatch limits.

`npm run benchmark:gpu-encoding` measures CPU command setup for the WebGPU
feature encoder in 2D and 3D. It compares reused typed and plain offset arrays
with identical bindings, dispatches and resulting body fields. Alternating
four-step batches wait for GPU completion before the next sample. The first
60 batches warm up the code; the next 60 are measured. These are small CPU
costs, separate from GPU physics and frame rate. Results are saved in
`test-results/command-encoding-performance.json`. GPU regressions also compare
the feature encoder against the pinned encoder through combined/split passes,
joint contacts, VBD and post stabilization. Repeated buffer bindings are skipped
within a pass and restored after scan, tree and sleeping helpers.

WebGL2 is an experimental repository/demo backend, excluded from the npm
package. The package contract runs only CPU and WebGPU; `npm run test:webgl`
also runs the shared contract separately against experimental WebGL2.

`npm run test:webgl-collisions` compares GPU WebGL2 broadphase and shape
contacts with exhaustive pairs and the WebGPU equations, including masks,
large shapes, cell boundaries and overflow.

`npm run test:webgl` checks graph coloring, solver stages, complete settling
worlds, hulls, capsules, joints, welds, motors, springs, ordered body edits,
nonzero restitution and sleeping/waking in both dimensions. Shared API checks
also exercise triggers, masking, shape queries, live weld-frame capture and fabric.
`npm run test:webgl-scenes` checks controls, finite poses, collision counters and
screenshots across the 2D/3D benchmark previews. WebGL2 worlds retain every contact
point and the selected equations, timestep and iteration count. Large scenes
can exceed the contact-texture memory budget; they are reported explicitly.

`npm run test:compatibility` builds the package and website, then runs the shared
API, CPU demos and WebGL2 checks. Browser benchmarks select the backend separately
from drawing. WebGL2's GPU elapsed queries are separate from submission/completion
time; unsupported GPU timers leave those fields empty.

`npm run test:cpu` includes the slingshot's CPU and WebGPU paths. The checks launch
and boost a ball, add a new ball and constraint, verify finite live poses, and
capture each renderer. CPU scene drawing also covers rounded rope links and
chainmail rings at the same dimensions as the WebGPU scene.

`npm run benchmark:sleeping` runs the separate sleeping and selective-pose-copy
comparisons through the browser controls, with three independent repeats and
screenshots. The resting stacks have 16,384 boxes in 3D and 10,000 in 2D; times include sleep/wake and
support checks. Results report asleep counts, awake overhead and settled pose
differences. This benchmark does not change the always-awake paper comparison.

`npm run test:compatibility-performance` checks backend selection, GPU timer labels,
playable previews and measurements without WebGPU. The `--package` option on
`check-backend-contract.mjs` checks the built ESM package rather than source imports.

WebGL2 scene checks include all 33 original demos and the added collider, hinge,
trigger, cloth and demolition examples. The behavior checks verify 60 advancing
steps in the joint grid, both stack dimensions and tearable cloth; explicit 2D
collision exclusions are checked separately. These checks cover finite runs;
the largest workloads use WebGPU and may exceed WebGL2's contact-texture budget.

`npm run benchmark:backends` records the same 2D stack, 2D joint grid, 3D stack
and 3D pyramid on WebGPU, experimental WebGL2 and CPU. Each backend uses 60 warmup steps,
60 measured steps and three fresh-world repeats; order rotates between repeats.
Drawing and sleeping are disabled. GPU elapsed time and JavaScript CPU time are
reported separately from submission, initialization and completed-step waiting.
The raw runs and combined summaries are saved in `test-results/backend-comparison.json`;
the README compares the mean physics times side by side.
