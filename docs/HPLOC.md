# GPU tree collision detection

`GpuHploc` in `gpuHploc.js` builds and traverses a GPU bounding-volume hierarchy.
Its pairs feed the existing narrowphase and AVBD solver. Shapes, friction,
rotation, solving rounds and contact equations stay the same; pinned upstream
sources remain unchanged.

This is a portable hierarchical PLOC treelet variant, based on the clustering
family described in [H-PLOC](https://gpuopen.com/download/HPLOC.pdf), **not** the
paper's single-launch wave implementation. `hplocpp.wgsl` builds the tree;
`hplocSort.wgsl` sorts keys.

## Algorithm

1. Compute world AABBs from live GPU positions, quaternions and collider sizes.
2. Reduce scene bounds on the GPU, generate 30-bit Morton keys and sort them
   with stable radix passes. No fixed scene coordinates or lost duplicate keys.
3. Merge mutual nearest neighbours by surface-area cost in 16-cluster treelets.
   Construct hierarchy levels until one root remains. Dispatch boundaries
   publish global writes; barriers publish local merges. There are no
   cross-workgroup spin waits or relaxed-atomic publication assumptions.
4. Build escape links for stackless traversal. Dynamic queries find static and
   kinematic leaves; giant ground slabs do not traverse the whole tree.
5. Refit **every leaf and internal bound every step**. Rebuild ordering and
   clustering every 64 steps by default. Refitting preserves coverage after
   teleports; rebuilding improves traversal quality.

Pair acceptance reuses the grid's masks, disabled-joint handling, bounding
spheres, world AABBs, face-axis rejection and overflow accounting. Dynamic
pairs are emitted once; dynamic/static pairs are emitted from the dynamic
body. Hulls retain the canonical hull narrowphase.

## Selection and limits

`AppGpuSolver3D` and `AvbdPhysics.create` accept `broadphase: "auto"`, `"grid"`
or `"hploc"`, and `bvh: { rebuildInterval: 64 }`. The lab and browser benchmark
have the same choices. Explicit selections let you compare on your GPU.

Automatic selection uses a tree for at least 10,000 bodies when either:

- Grid cells are at least four times a typical body's bounding-sphere diameter.
- At least a quarter of dynamic bodies are thin plates, and there is at least
  one active constraint per body. This covers the rigid ragdoll net.

For this policy, a thin plate has a shortest dimension no more than 40% of its
middle dimension, with the middle dimension at least half the longest. Rods,
spheres and convex hulls do not qualify as plates. Shape metadata is checked
when bodies or active constraint counts change; positions are not downloaded.

Body count alone does not select a tree. Adapter dispatch/storage limits are checked; automatic mode
keeps the grid when unsupported. Explicit unsupported requests fail clearly.

This is a conservative policy based on the measured 1K, 10K and 50K mixed-size workloads and the 24K ragdoll net,
not a universal crossover point. Scene layout, size distribution and GPU matter.

Extra buffers store nodes, links, sorting and clustering. JSON records primary
buffer bytes, rebuild/refit counts and the first GPU step. Startup GPU time
excludes CPU scene creation and shader compilation. Warm timing includes
periodic rebuilds, but excludes the first build; inspect both. Grid buffers
remain available for selection changes. This path adds no sleeping.
Reported primary bytes exclude prefix-scan scratch, small uniforms and pipelines.

## Replication and checks

Open `/tests/performance.html` and close other GPU workloads. Paired comparison
alternates execution order every step and preserves each scene's settings.
Every step checks overflow and solve-group conflicts.

```js
try {
  const result = await __PERFORMANCE__.runPaired(
    "3d-mixed-sizes-50k",
    ["grid", "hploc"],
    60,
    60,
  );
  console.table(
    result.results.map((r) => ({
      method: r.broadphase,
      collisionMs: r.summary.collision.mean,
      physicsMs: r.summary.total.mean,
      extraBytes: r.bvh?.extraBytes ?? 0,
    })),
  );
} finally {
  await __BENCHMARK_VIEW__.preview.load(document.querySelector("#scene").value);
}
```

Use `grid-detail` / `hploc-detail` to separate build/refit, pair search,
narrowphase, body solving and contact-force updates. Extra pass boundaries
affect timing, so compare matching detailed modes. Raw data retains rebuild
spikes and noisy samples. An unchanged solve-stage difference over 10% is flagged.

For the ragdoll net, compare `"showcase-ragdolls-on-cloth-24k"` with
`["grid", "hploc"]`, 1440 warmup steps and 60 samples. This measures the scene
after six simulated seconds at its full 240 Hz collision rate. Saved paired
results on the RTX 4070 Laptop GPU use the same timestep and five AVBD iterations;
see `test-results/solver-ragdoll-settled.json`. The separate
`node scripts/check-ragdoll-net.mjs` regression checks every quarter-second
through 30 simulated seconds with automatic selection. It checks whole limbs
below the sheet and partial capsule/triangle intersections deeper than 5 mm.
The net uses overlapping plates and excludes its eight immediate neighbors
from self-collisions; distant folds still collide.

Tests compare unique, complete pair sets against the grid for empty and partial
treelets, duplicate keys, rotated hulls and boxes, spheres, giant statics,
ignored and released joints, filters, teleports and added bodies. Physical regressions cover floor support,
joints, sleeping and support removal; browser checks exercise motion and drawing.

`node scripts/check-hploc-motion.mjs` checks 360 steps of the 10K/50K mixed-size
scenes, 110K ring, 100K columns and half-million walls with the tree forced.
It checks every step's capacity and scheduling counters, measures floor support
and rotation, and captures four screenshots per scene. `npm run test:web`
includes this check alongside all scene and benchmark views.

