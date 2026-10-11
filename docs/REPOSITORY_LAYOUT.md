# Repository organization

The library lives in `src/`. `scripts/build-library.mjs` uses the Tinybuild
configs to create ESM modules, declarations and the `AVBD` browser global.
The npm package contains the library, guides and license notices. Website
bundles, screenshots, benchmark results and source maps are excluded.

| Location           | Purpose                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `src/index.js`     | Complete public package API.                                                                                           |
| `src/native/`      | Renderer-independent 2D/3D worlds, scene builders and terrain.                                                         |
| `src/babylon/`     | Babylon aggregate integration and direct GPU drawing support.                                                          |
| `src/gpu/`         | WebGPU solvers, HPLOC collision tree, sleeping, buffer management, timers, contact sampling and surface particles.     |
| `src/utils/`       | Shared input mailbox, worker canvas adapter and custom GPU step registration.                                          |
| `src/utilities.js` | Public `avbd-babylon/utils` entry for reusable GPU and worker helpers.                                                 |
| `src/vendor/`      | Attributed solver sources used by the library.                                                                         |
| `src/webgl/`       | Experimental WebGL2 backend, excluded from the npm package.                                                            |
| `demo/`            | Playable scenes organized by demo, with shared controls and renderers. See the [demo source guide](../demo/README.md). |
| `tests/`           | GPU regressions and browser benchmark pages.                                                                           |
| `tests/legacy/`    | Earlier implementations retained as active regression fixtures.                                                        |
| `scripts/`         | Build, validation, benchmark and report tools.                                                                         |
| `test-results/`    | Saved measurements and images used by the README and public reports.                                                   |
| `reference/`       | Pinned upstream sources for attribution and verification.                                                              |

`index.js` is the website entry. `scripts/build.mjs` and
`tinybuild.web.config.js` build it separately from the package, including
the worker and browser benchmark entries. Reusable optimized helpers are
imported from `src/` by both the demos and library consumers.

`npm run clean:results` removes captures that are no longer linked by the
README or public reports. `npm run clean:dist` removes obsolete build outputs
while preserving the complete website and published library.
