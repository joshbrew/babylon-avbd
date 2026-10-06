# GPU validation and browser benchmarks

Normal validation runs physics on the GPU. Package, type and source-integrity
checks run on the host because they inspect files and JavaScript APIs.

| Command                          | Scope                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `npm test`                       | GPU numerical and stability regressions                                               |
| `npm run test:complete`          | GPU suite, package, pinned-source integrity and live Babylon example                  |
| `npm run test:web`               | All GPU scene views, benchmarks, motion, controls, screenshots and reports            |
| `npm run test:package`           | ESM/global bundles, declarations and production dependencies                          |
| `npm run test:types`             | Public declarations with real Babylon types and portable API consumers                |
| `npm run test:castle`            | Mortar settling, local impacts, rotating debris and responsive layout                 |
| `npm run test:cloth`             | Thirty-second limb/net checks, central cloth tearing and screenshots                  |
| `npm run test:features`          | 2D/3D hinge stops, motor reversal/braking, sensors, live masks and casts              |
| `npm run test:renderers`         | Every canonical scene and the slingshot in Babylon; shared-state renderer benchmark checks |
| `npm run benchmark:renderers`    | Direct WebGPU versus Babylon: GPU drawing/copies, CPU submission and completion; three repeats |
| `npm run test:fracture`          | Voronoi partition, breakable face bonds, wrecking-ball impact and persistent rubble   |
| `npm run test:reference`         | Explicitly requested upstream CPU comparison; excluded from normal validation         |
| `npm run benchmark:native` | 2D/3D movement/spin, property edits, grouped queries, sleeping and selected reads; three repeats |
| `npm run benchmark:native-edits` | 100K motion updates, 10K property edits and 64 ray queries in 2D/3D; API overhead and GPU completion |

Set `AVBD_TEST_BROWSER` to a Chromium executable if browser discovery fails.
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
and concurrent query-pool reuse/disposal. Native API benchmarks measure 100K motion
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
poses and valid rotations. Its visual triangles disappear from live GPU
joint state. These scenes collide with rigid patches; they do not claim
continuous triangle collision detection.

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

`npm run benchmark:sleeping` runs the separate sleeping and selective-pose-copy
comparisons through the browser controls, with three independent repeats and
screenshots. The resting stacks have 16,384 boxes in 3D and 10,000 in 2D; times include sleep/wake and
support checks. Results report asleep counts, awake overhead and settled pose
differences. This benchmark does not change the always-awake paper comparison.
