// Collision counters are final before the movement passes. Hold an incomplete
// step on the GPU; the caller can inspect counters and grow capacity with adapt().
export function protectStep2D(source) {
  for (const entry of [
    "warmStartJoints",
    "warmStartBodies",
    "primal",
    "primalScan",
    "dual",
    "refreshStick",
    "updateVelocities",
  ]) {
    const signature = `fn ${entry}(@builtin(global_invocation_id) gid: vec3u) {`;
    if (source.split(signature).length !== 2)
      throw Error(
        `Pinned 2D ${entry} signature changed; review the step guard`,
      );
    source = source.replace(
      signature,
      `${signature}\n  if (counters[C_OVERFLOW] != 0u || counters[C_CLASHES] != 0u) { return; }`,
    );
  }
  return source;
}
export function protectTopology2D(source) {
  const fallback = "if (col == NO_COLOR) { col = params.colorCap - 1u; }";
  if (source.split(fallback).length !== 2)
    throw Error(
      "Pinned 2D color-count layout changed; review the capacity guard",
    );
  // Cached colors outside a reduced budget would otherwise never be dispatched.
  return source.replace(
    fallback,
    `${fallback}\n    if (col >= params.colorCap) { atomicAdd(&counters[C_CLASHES], 1u); }`,
  );
}
