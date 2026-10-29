# Native updates, pooled contacts and query masks

Run `npm start` at the repository root, then open
[native-updates.html](native-updates.html). Choose **WebGPU** or **CPU compatibility**
explicitly. No Babylon renderer, game objects, or external CDN is required.

For a terminal-only CPU check:

```sh
npm run example:native-updates
```

This is a compatibility example, not a GPU benchmark. The browser button runs
the same [example module](native-updates.js) with real WebGPU. With a published
package and an ESM bundler, import from `avbd-babylon/native` as the module does.
The repository HTML uses an import map pointing to the built package.

## What the example demonstrates

- `setPoses(indices, positions, rotations?)`: resolve live slots with
  `bodyIndex()`, sort slots and their pose records together, reuse typed arrays,
  and omit rotations on subsequent position-only updates. The batch normalizes
  nonzero XYZW quaternions and preserves velocities, filters and sensor flags.
  `step()` or `flushEdits()` submits commands; there is no implicit completion
  wait or body-pose download. Native 3D GPU and CPU worlds support this API.
- `resetContactHistory(indices)`: reuse an overlapping body's slot without
  suppressing its new begin event. The sample deliberately leaves old events
  queued, records the new birth step, and rejects those old events. A real pool
  must also validate lease identity/generation and both participants' lifetimes.
  This is distinct from the solver's **relative-motion contact recycling**
  optimization; it does not clear unrelated contact pairs.
- `membership` plus `collidesWith` on queries: optional bilateral filtering.
  One-way scene probes can see a marker whose collision acceptance mask is zero;
  a payload sweep skips that marker. Omitting membership preserves existing
  one-way semantics; zero explicitly misses. Native 2D uses `circleCast()` with
  two-component coordinates. Babylon world queries accept the same options.
- Batch `maxDistance` and per-input overrides: short casts cannot hit distant
  targets, while one input can opt into a longer range without extending peers.
- `contactReadbackAllocations`: repeated GPU event drains reuse one staging
  buffer. The CPU backend reports zero. Contact reporting is optional; it is
  not allocated in scenes that never request it.

Transforms are **teleports**, and queries are explicit GPU scans, not automatic
simulation CCD. Keep fast-object sweeps bounded and batched. Check `full` and
`dropped` before using contact events. For a continuous beam or sensor, track
begin/end and apply your own fixed-step policy; a begin event is not a damage
tick every frame. Static/static pairs intentionally do not generate contacts,
so stationary trigger payloads still use dynamic participation.

The example awaits its explicit reads and destroys its pipeline. If passing a
renderer-owned GPUDevice, keep that device alive yourself. API reference and
copyable snippets: [BABYLON_API.md](../docs/BABYLON_API.md).
