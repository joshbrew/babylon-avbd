// Preserve the 64-pair indirect dispatch ABI while using 32 threads. Each thread
// handles two pairs; all hull geometry, clipping capacity and contact equations
// stay unchanged. The smaller workgroup avoids a Vulkan pipeline compilation
// failure observed on the physically tested Android driver. Desktop is unchanged.
export function portableHullContacts3D(source) {
  if (!source.includes("struct Poly")) return source;
  const signature =
    "@compute @workgroup_size(64)\nfn narrowphase(@builtin(global_invocation_id) gid: vec3u)";
  if (source.split(signature).length !== 2)
    throw Error("3D hull narrowphase changed; review the compatibility kernel");
  return (
    source.replace(signature, "fn narrowphasePair(gid: vec3u)") +
    `
@compute @workgroup_size(32)
fn narrowphase(@builtin(global_invocation_id) gid: vec3u) {
  for (var offset = 0u; offset < 2u; offset++) {
    narrowphasePair(vec3u(gid.x * 2u + offset, 0u, 0u));
  }
}
`
  );
}
