// Shared validation and staging for GPU and CPU packed 3D teleports. No pose
// downloads, per-body objects, or temporary component arrays are required.
export function validatePackedPoses(solver, indices, positions, rotations) {
  if (solver.destroyed) throw Error("The 3D solver has been destroyed");
  if (
    !(indices instanceof Uint32Array) ||
    !(positions instanceof Float32Array) ||
    (rotations !== undefined && !(rotations instanceof Float32Array))
  )
    throw Error("Pose batches require Uint32 indices and Float32 pose arrays");
  if (
    positions.length !== indices.length * 3 ||
    (rotations && rotations.length !== indices.length * 4)
  )
    throw Error("Provide xyz positions and optional xyzw rotations per body");
  let previous = -1;
  for (let i = 0; i < indices.length; i++) {
    solver.liveIndex(indices[i]);
    if (indices[i] <= previous)
      throw Error("Pose batch slots must be unique and ascending");
    previous = indices[i];
  }
  for (let i = 0; i < positions.length; i++)
    if (!Number.isFinite(positions[i]))
      throw Error("Pose positions must be finite");
  if (rotations)
    for (let i = 0; i < rotations.length; i += 4) {
      const length = Math.hypot(
        rotations[i],
        rotations[i + 1],
        rotations[i + 2],
        rotations[i + 3],
      );
      if (!Number.isFinite(length) || length <= 0)
        throw Error("Pose rotations must be finite and nonzero");
    }
}
export function writePackedPose(
  f,
  u,
  slot,
  index,
  positions,
  offset,
  rotations,
  rotationOffset,
) {
  u[slot] = index;
  u[slot + 1] = 4;
  u[slot + 2] = rotations ? 1 : 0;
  u[slot + 3] = 0;
  f[slot + 4] = positions[offset];
  f[slot + 5] = positions[offset + 1];
  f[slot + 6] = positions[offset + 2];
  f[slot + 7] = 0;
  let inverseLength = 1;
  if (rotations)
    inverseLength =
      1 /
      Math.hypot(
        rotations[rotationOffset],
        rotations[rotationOffset + 1],
        rotations[rotationOffset + 2],
        rotations[rotationOffset + 3],
      );
  for (let k = 0; k < 4; k++)
    f[slot + 8 + k] = rotations
      ? rotations[rotationOffset + k] * inverseLength
      : k === 3
        ? 1
        : 0;
}
