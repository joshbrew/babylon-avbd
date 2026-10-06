# First release checks

AVBD 0.1 provides GPU rigid-body physics in 2D and 3D, the Babylon aggregate API,
portable scene builders and the browser demos. The package ships ESM, the `AVBD`
browser global, declarations, documentation and license notices. It has no runtime
dependencies; Babylon 9 is an optional peer for the integration API.

## Validate the package

```sh
npm ci
npm run build:all
npm run test:complete
npm run test:web
npm run clean:results
npm run clean:dist
npm pack
```

`test:complete` checks pinned sources, real GPU physics, the packed package,
public TypeScript usage and executable README examples. `test:web` checks the
playable scenes, screenshots, controls and reports. A Chromium browser with
WebGPU is required for GPU tests; unsupported hardware fails explicitly. GPU
workloads run sequentially. Type and packaging checks do not need a GPU.

Run `npm run benchmark:native` to refresh the three-repeat 2D/3D measurements
for bulk movement/spin, property edits, grouped queries, selected reads and
sleeping. The browser performance page uses the same package APIs as the demos.
Measured edit records and query hits must match before results are accepted.
API timings exclude solving and drawing; scene benchmarks report those costs
separately.

Run `npm run test:renderers` to check Babylon drawing for every canonical
scene and the slingshot. Refresh the saved renderer comparison with
`npm run benchmark:renderers -- --all`, with other GPU workloads closed.
This compares direct WebGPU and Babylon on identical physics states and
reports drawing, GPU copies and CPU work separately. Keep the generated
renderer report, measurements and linked screenshots when hosting the demos.

Release builds omit source maps. Use `--sourcemap` for local debugging; maps
are excluded from the npm package. Website bundles import the Babylon
components used by the demos, including their shader and rendering
registrations. All demo routes and effects remain available.

Run cleanup after validation. `clean:results` keeps reports, screenshots linked
from reports or the README, measurement inputs and current validation summaries. `clean:dist`
keeps package outputs and assets referenced by every browser page, including
the GPU test page; it removes generated test wrappers and local debug maps.
Both commands check their target paths and operate within their output folders.
Preview either cleanup with `node scripts/clean-results.mjs` or
`node scripts/clean-dist.mjs`.

The package check installs the tarball in a temporary project and imports it
without Babylon or a DOM. It verifies the production file list, both builds,
optional-peer behavior, strict portable TypeScript usage and upstream notices.
`avbd-babylon/native` provides portable imports without Babylon type dependencies.
Packed files exclude the website,
benchmark outputs, test fixtures, development tools and dependency directories.
The explicit `package.json` file list and `.npmignore` keep those files out of
the npm tarball. They remain in the repository so the complete multi-page demo
and saved reports can be hosted separately.

For browser hosting, serve the complete website output and its pages/assets,
not only `index.html`. `tests/performance.html` is a separate page. Generated
reports live under `test-results/`; include them deliberately if publishing
premade results. Those saved results identify the RTX 4070 Laptop GPU. Live
benchmarks measure the visitor's machine. The paper's desktop RTX 4090 figures
are separate comparisons with different hardware and reconstructed workloads.

## Publish 0.1.0

Push the sources, documentation and `test-results/` screenshots to the public
[repository](https://github.com/joshbrew/babylon-avbd) before publishing npm.
The README uses relative paths for images and result files, so they resolve in
the repository and local editors. Those assets stay outside the npm tarball.
The package's `prepack` script builds both ESM and
the browser global automatically.

```sh
npm login
npm publish --access public
```

In Windows PowerShell, use `npm.cmd login` and `npm.cmd publish --access public`
if the PowerShell npm launcher is unavailable.

The npm account must be allowed to publish `avbd-babylon`. Successful local
package checks do not log in or publish a release.

## API scope

Both dimensions support boxes, rounded primitives, convex hulls, friction,
bounce, masks, sensors, queries, body commands and constraints. 3D has Babylon
aggregates, sleeping, hinge angle stops, ropes, ragdolls and fabric helpers.
2D has sleeping, hinge angle stops, portable builders, disposable joints/springs/motors and Babylon scene
attachment for timing and cleanup. Attachment does not create rendering meshes.
See the [feature table](../README.md#feature-coverage) for exact coverage.

These remain useful follow-up work rather than supported 0.1 features:

- **Concave mesh collisions:** custom hulls fill cavities. Terrain and hollow
  objects need suitable convex pieces.
- **Continuous collision detection:** contacts are discrete. Use smaller
  timesteps for fast objects; sphere/circle casts are queries, not automatic CCD.
- **Full Babylon Physics V2 integration:** use AVBD aggregates, not
  `scene.enablePhysics()` with a Havok plugin.

## Ownership and failure handling

Dispose aggregate/constraint handles when removing them. Disposing a Babylon
scene releases its attached world; portable solvers use `destroy()`. Caller-owned
devices remain caller-owned. GPU device loss stops the Babylon loop and reports
the reason; resume with a new device and world.

Incomplete collision storage or conflicting solve groups hold physics poses
and joint forces. Inspect `readCounters()` and use `adapt()` to recover capacity.
Such a held step is a reported failure, not a successful simulation step. Zero
overflow and zero conflicts are required in release benchmark results.

The MIT package license and upstream notices ship with the tarball. Attribution
includes Steven Bobyn, Chris Giles and Erin Catto; pinned upstream files remain
unchanged.

## Verify the published release

Run `npm run test:published -- 0.1.0` to install the exact registry release into a fresh temporary project and check its integrity, dependency-free native usage, ESM/global exports, TypeScript declarations, and GPU 2D/3D Babylon package feature tests. Results are saved in `test-results/published-package.json`.
