# Pinned canonical AVBD reference

Unmodified mathematical solver sources, six test files and all 33 C++ oracle
fixtures from [sbobyn/three-avbd](https://github.com/sbobyn/three-avbd/tree/b3675dea83c78aba9644b059975f48285bf02a47/tests),
commit `b3675dea83c78aba9644b059975f48285bf02a47`, retrieved 2026-10-03.

This is both the mathematical baseline and the canonical web laboratory's
runtime dependency. The lab directly imports all 33 CPU scene builders and the
full 2D and 3D GPU solvers. The older playground and reduced stress engines remain
separate. The original assertions and tolerances
are preserved: 2D reference and sequential f64 trajectories within `1e-7`, 3D
reference trajectories within `1e-9`, with exact force counts at each sample.
The 39 test declarations expand to 60 tests across the CPU backends.

`sources.json` records Git blob SHA-1 hashes for the original 65 upstream files, including
the licenses. Our integrity test verifies their exact bytes on every run.
`.gitattributes` prevents Git line-ending conversion from invalidating them.
Updating the baseline requires deliberately updating the commit, sources, hashes
and coverage map together. Do not relax assertions or regenerate golden data to
make an implementation pass.

`runtime-sources.json` additionally verifies the nine unmodified GPU/runtime
dependencies. `scripts/vendor-runtime.mjs` retrieves only this pinned commit
and verifies bytes against GitHub's Git tree before writing them.

`demo-sources.json` verifies six additional unmodified files: the thirteen-scene
GPU showcase catalog and cosmetic visual metadata, plus the 2D GPU adapter,
solver and collision/solve shaders. `scripts/vendor-demos.mjs` verifies their
Git blob hashes at the same pinned commit before writing them. Rendering and
the cantilever's post-stabilization preset live in application-owned files.

Included dependencies are the mathematical and GPU sources needed by the app and tests;
no upstream UI, rendering package, installer or generated bundle is included.
Tests run without fetching code or fixtures from the network.

The MIT license and all third-party notices are preserved in `LICENSE` and
`THIRD_PARTY_NOTICES.md`.
