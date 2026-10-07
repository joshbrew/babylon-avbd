// Compatibility kernel: keep the same contact/joint accumulation and 6-DOF
// Newton solve, but give each body one invocation without a workgroup reduction.
// Installed only after the normal kernel fails and this kernel passes on-device.
export function scalarPrimal3D(source) {
  const begin = source.indexOf(
    "/** A partial system per body slot handed between lanes (primal). */",
  );
  const end = source.indexOf("fn accumulate(", begin);
  const doc = source.lastIndexOf("/**", end);
  if (begin < 0 || end < 0 || doc <= begin)
    throw Error("3D primal layout changed; review the compatibility kernel");
  return (
    source.slice(0, begin) +
    `
@compute @workgroup_size(64)
fn primal(@builtin(global_invocation_id) gid: vec3u) {
  let start = color[params.colorStartOffset + pc.color];
  let count = color[params.colorStartOffset + pc.color + 1u] - start;
  if (gid.x >= count || !solverStepValid()) { return; }
  let i = color[params.colorBodiesOffset + start + gid.x];
  finishBody(i, accumulate(i, 0u, 1u));
}

` +
    source.slice(doc)
  );
}
