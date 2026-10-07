# Release checks

AVBD 0.2 provides GPU rigid-body physics in 2D and 3D, the Babylon aggregate API,
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

Run `npm run test:mobile-contacts` for the 3D floor-contact portability checks,
including eight/nine storage-buffer limits and both renderers in a mobile layout.
The layout checks use the test computer's GPU. Test the hosted demo on actual
phones as well; its **GPU contact check** sidebar can save a diagnostic report
with floor-contact results, browser details and device limits. Failed devices
test alternatives for contact data/calculations, work sharing and collision search.
A fallback is used only after its known-overlap and falling-shape checks pass.
GPUs that pass the normal path keep the batched execution and automatic scene
selection. The diagnostic report compares the contact inputs, stabilization
setting and calculated forces on the GPU.

For an authorized connected Android phone, start the local demo, unlock the phone
and open a canonical scene in its browser. Forward the browser debugging socket
and reverse the demo port with ADB:

```sh
adb reverse tcp:8080 tcp:8080
adb forward tcp:9223 localabstract:chrome_devtools_remote
node scripts/check-connected-contacts.mjs
```

This checks physical-device floor contacts, 2D/3D package features and both 3D
collision searches. It uses only the existing local demo tab and saves
`test-results/connected-phone-contacts.json`. Mobile viewport tests and physical
phone tests have separate reports.

To compare PC performance with a saved package build, run
`node scripts/check-contact-performance.mjs --baseline=/path/to/avbd.js`.
It runs 10K and 100K native 3D bodies with five iterations, three alternating
repeats and no rendering or sleeping. It checks identical dispatch sequences,
matching selected physics states, GPU times and CPU submission times.

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

After publishing, run `npm run test:published -- 0.2.0` to verify the registry
release. This installs the exact version in a fresh temporary project, verifies
its registry integrity, imports ESM/native and browser-global exports, checks
TypeScript usage, and runs the GPU package feature tests with Babylon installed
explicitly for those integration checks. It uses the downloaded package rather
than a local build and saves `test-results/published-package.json`.
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

The repository's `netlify.toml` runs `npm run build:all` and publishes the root,
so the demo, benchmark pages, assets and reports stay available. `npm run build`
builds the npm library only; use `npm run build:all` or `npm run build:web` before
a manual website upload. Push the Netlify configuration and source changes,
then redeploy. Clearing browser data cannot update an older deployed bundle.

## Publish 0.2.0

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

These remain useful follow-up work rather than supported 0.2 features:

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
