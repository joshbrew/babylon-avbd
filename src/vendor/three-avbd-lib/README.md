# Adapted upstream host utilities

These MIT-licensed files retain three-avbd attribution. The unchanged upstream
copies and their source hashes remain in `reference/three-avbd/`.

- `solver3D.ts` is the 3D GPU host adapter, adapted from
  `reference/three-avbd/src/avbd3d/gpu/solver.ts`. Its initial buffer-capacity
  estimate applies body collision masks and leaves disabled bodies out of its
  candidate grid. This keeps large inactive queues from slowing initialization.
  Candidate rejection uses scalar values to avoid allocating arrays for every
  tested pair in mixed-size scenes.
  Reference-pose and topology shader overrides let the package compile each
  initial pipeline once, including worlds that start with sensors. The imported
  GPU equations follow the pinned source. Package-specific scheduling and
  collision extensions live in `src/gpu/`.
- `contacts.ts` provides GPU contact reporting used by the native public API.
