# Repository organization

The public library entry is `src/index.js`. Its Tinybuild config builds only
the current GPU solver and Babylon adapter into `dist/avbd.js`. The CDN config
builds the same API into `dist/avbd.global.js`. Neither output imports Babylon,
demo pages or the old solver. The package file whitelist includes those two
bundles, maps, types, documentation and the upstream notice.

`index.js` is the separate application entry. It exposes the current laboratory,
castle, mixed collider gallery and collision benchmark. Old cannon and reduced
stress routes are no longer available. The website and browser benchmark share
`scripts/build.mjs` and `tinybuild.web.config.js`.

The library lives under `src/`, the laboratory under `demo/`, and active GPU
regression fixtures under `tests/legacy/`. The root contains package metadata, build
configs and the website shell. Legacy files are excluded from the package
and application routes.

| Destination     | Contents                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/babylon/`  | `babylonAvbd.js`, `.d.ts`, `.wgsl`                                                                                                                                                                                                         |
| `src/gpu/`      | `device.js`, `appGpuSolver3D.js`, `gpuSolverOptions.js`, `gpuSolverKernels.js`, `gpuSolverStep.js`, `solverPolicy.js`, `gpuHploc.js`, `hplocpp.wgsl`, `hplocSort.wgsl`, `gpuTimer.js`, `gpuSleep.js`, `gpuSleep.wgsl`, `gpuClothSolver.js` |
| `demo/`         | Laboratory controls, renderers, scene builders, styles, gallery, collision benchmark and visualization helpers                                                                                                                             |
| `tests/legacy/` | `avbd.js`, `avbd.wgsl`, `gpuStressDemo.js`, `gpuStress.wgsl`, `gpuStressRender.wgsl`; used by active GPU regressions                                                                                                                       |

Imports, builds, tests and documentation use the new paths. Pinned upstream
sources are unchanged. Normal validation is GPU-first; host checks cover package
files and source integrity, which cannot run as GPU shaders.
