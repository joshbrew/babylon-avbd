# Demo source guide

Start with a demo's `scene.js` for its bodies, constraints, solver settings and
camera. Demos with their own page controls also have an `index.js`; their shaders,
styles and helpers live beside them. Related parameterized tests share a
`scenes.js` rather than copying the same builder for every size or dimension.

| Demo                                                | Configuration and construction                               | Controls or supporting code                                                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 40,000-marble Galton board                          | [galton-board/scene.js](galton-board/scene.js)               | [Hopper release](galton-board/feed.js), [GPU hopper and bin counts](galton-board/feed.wgsl), [distribution chart](galton-board/statistics.js)                                                                 |
| Tornado town                                        | [tornado-town/scene.js](tornado-town/scene.js)               | [Shared forces and actions](shared/playground/physics.js)                                                                                                                                                     |
| Domino spiral                                       | [domino-spiral/scene.js](domino-spiral/scene.js)             | [Shared forces and actions](shared/playground/physics.js)                                                                                                                                                     |
| Ships and buoyancy                                  | [naval/scene.js](naval/scene.js)                             | [Page initialization](naval/index.js), [water and buoyancy](naval/water.js), [GPU forces](naval/water.wgsl)                                                                                                   |
| Slingshot siege                                     | [slingshot/scene.js](slingshot/scene.js)                     | [Page initialization](slingshot/index.js), [worker controls](slingshot/controls2D.js), [trajectory](slingshot/aim.js), [impact and crushing damage](slingshot/damage.js), [GPU health shader](slingshot/damage.wgsl)                                                  |
| Castle siege                                        | [castle/scene.js](castle/scene.js)                           | Shared lab viewer                                                                                                                                                                                             |
| 100K rook impact                                    | [rook-impact/scene.js](rook-impact/scene.js)                 | Projectile creation is in the same file                                                                                                                                                                       |
| Tearable fabric                                     | [tearable-cloth/scene.js](tearable-cloth/scene.js)           | [Renderer](tearable-cloth/renderer.js), [tear topology](tearable-cloth/topology.js)                                                                                                                           |
| Ragdolls on a rigid net                             | [rigid-net/scene.js](rigid-net/scene.js)                     | Configures contacts for the [upstream scene builder](../reference/three-avbd/src/avbd3d/bench-scenes.ts)                                                                                                      |
| Terrain, caves and overhangs                        | [terrain/scene.js](terrain/scene.js)                         | [Mesh generation/import](terrain/mesh.js), [surface drawing](terrain/visual.js)                                                                                                                               |
| Voronoi demolition                                  | [voronoi-demolition/scene.js](voronoi-demolition/scene.js)   | [Fracture geometry](voronoi-demolition/geometry.js)                                                                                                                                                           |
| Hinges, motors, triggers and masks                  | [features/scenes.js](features/scenes.js)                     | Shared 2D/3D settings and lab controls                                                                                                                                                                        |
| 2D shapes                                           | [shapes-2d/scene.js](shapes-2d/scene.js)                     | Circles, capsules and segments                                                                                                                                                                                |
| 2D sleeping, anchors and hinge stops                | [policies-2d/scenes.js](policies-2d/scenes.js)               | Shared lab viewer                                                                                                                                                                                             |
| 10K–100K 2D stress scenes                           | [stress-2d/scenes.js](stress-2d/scenes.js)                   | Size presets share one builder                                                                                                                                                                                |
| Mixed-size stress scenes                            | [mixed-sizes/scenes.js](mixed-sizes/scenes.js)               | 1K, 10K and 50K presets                                                                                                                                                                                       |
| Sphere contacts                                     | [sphere-contacts/scene.js](sphere-contacts/scene.js)         | Shared lab viewer                                                                                                                                                                                             |
| Custom convex hulls                                 | [convex-hulls/scene.js](convex-hulls/scene.js)               | Shared lab viewer                                                                                                                                                                                             |
| Half-million walls and deformable fabric            | [paper-benchmarks/scenes.js](paper-benchmarks/scenes.js)     | Reconstructed paper workloads and measurement settings                                                                                                                                                        |
| Mixed collider gallery                              | [mixed-colliders/index.js](mixed-colliders/index.js)         | Babylon meshes and collider setup in one entry point                                                                                                                                                          |
| D20 particle collision benchmark                    | [collision-benchmark/index.js](collision-benchmark/index.js) | [Reusable particle engine](../src/gpu/surfaceParticles.js), [collision shader](../src/gpu/surfaceParticles.wgsl), [sprite drawing](collision-benchmark/sprites.js) |
| Canonical 2D/3D tests and large brick rings/columns | [Lab registry](lab/scenes.js)                                | [Upstream 2D builders](../reference/three-avbd/src/avbd2d/ref/scenes.ts), [3D builders](../reference/three-avbd/src/avbd3d/ref/scenes.ts), [large scenes](../reference/three-avbd/src/avbd3d/bench-scenes.ts) |

## How a scene starts

1. The website's [entry point](../index.js) picks a demo from `?demo=...`.
2. The [lab registry](lab/scenes.js) selects the builder from `?scene=...`.
   Builders return the world, optional camera, GPU parameters and scene controls.
3. The [lab controller](lab/index.js) creates the chosen solver and renderer,
   connects controls, steps physics and draws. Its [view](lab/view.js) and
   [styles](lab/style.css) are beside it.
4. Worker demos use the same builders through
   [createSimulationSession](shared/runtime/simulationSession.js).
   [SimulationRuntime](shared/runtime/simulationRuntime.js) handles stepping,
   drawing, controls and measurement in either the page or a worker.

To change the Galton board, edit its count, hopper and peg geometry, timestep
and iteration count in [galton-board/scene.js](galton-board/scene.js). Its hopper
holds the visible marbles until the gate opens, then enables them together;
gravity and AVBD collisions control their release and destinations. The narrow
central outlet and vertical throat feed the first peg, rather than spreading
the incoming marbles across several columns.
The same scene module is used by the main viewer, Babylon rendering, workers and
the browser tests.

The main scene browser and naval scene default to a dedicated worker when
supported, with page controls retained. Add `scope=main` to use the main thread.
Worker loading reports its current stage; shared input is optional when the
site supports it. Specialized laboratory editors are linked from the sidebar.

The showcase exposes **Physics steps / second** beside solver iterations.
Changing it updates the live fixed timestep without rebuilding the scene;
**Use scene's default step rate** restores its configured value. An explicit
choice is saved as `hz=120` in the URL and survives execution/renderer changes.
More steps help fast impacts; fewer reduce physics work. Automatic frame
scheduling still aims for real time and limits catch-up when the device is busy.
Benchmark measurements hold these settings fixed and report the selected timestep.

The Galton board's [peg controller](galton-board/pegs.js) picks static pegs
without downloading all marble poses. It batches animated teleports and
collision-mask changes; coral caps mark retracted pegs. Mouse and touch work
with direct WebGPU, Babylon rendering and dedicated workers.

The [bowling controller](paper-benchmarks/bowling.js) adds fourteen balls only
when requested, preserving the original two-ball paper benchmark. Each AVBD
scene exposes a Sleeping toggle; [sleepPolicy.js](shared/runtime/sleepPolicy.js)
defines the initial policy.

## Shared code and benchmarks

- Reusable solver code lives in [../src/](../src/). The active HPLOC tree builder,
  traversal and sorting shaders are in [../src/gpu/](../src/gpu/); demo folders
  configure and display the package rather than supplying its collision engine.
- Particle sweeps, buffer recycling, GPU timestamps, contact sampling, startup
  constraint coloring and the shared-input mailbox are package utilities. See
  [the public imports and examples](../README.md#reusable-gpu-and-worker-utilities).
- [shared/rendering/](shared/rendering/) contains direct WebGPU, Babylon and CPU
  renderers. [shared/physics/](shared/physics/) contains demo backend adapters.
- [shared/playground/](shared/playground/) contains primitive construction helpers
  and the common action controller. Individual playground geometry stays in its
  own demo folder.
- [Benchmark sample code](../README.md#benchmark-sample-code) links to copyable
  examples and the measurement sources. [tests/README.md](../tests/README.md)
  lists commands; recorded results live in [test-results/](../test-results/).

The demo folders are website source. The published package is built separately
from `src/` and does not include these viewer or benchmark files.
