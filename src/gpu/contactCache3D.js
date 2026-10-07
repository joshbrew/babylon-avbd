// Contact generations share a body record with floating-point pose data. Raw
// integer bits produce subnormal floats, which shader implementations may flush
// to zero. XOR puts all 27 generation bits into finite, normal f32 values.
// The generation width matches sensor manifolds; comparisons handle rollover.
const stamp = `
fn contactGeneration(value: f32) -> u32 {
  return select(0u, bitcast<u32>(value) ^ 0x3f800000u, value != 0.0);
}
fn contactMovedAfter(value: f32, generated: u32) -> bool {
  let age = (contactGeneration(value) - generated) & 0x07ffffffu;
  return age != 0u && age < 0x04000000u;
}
`;
export function portableContactRefs(source) {
  const from = "bodies[i].inertialPos.w = bitcast<f32>(params.step);";
  if (!source.includes(from)) throw Error("Contact reference layout changed");
  return source.replace(
    from,
    "bodies[i].inertialPos.w = bitcast<f32>((params.step & 0x07ffffffu) ^ 0x3f800000u);",
  );
}
export function portableContactCache(source) {
  const from = `  let moved = max(bitcast<u32>(bodies[a].inertialPos.w), bitcast<u32>(bodies[b].inertialPos.w));
  if (count == 0u || generated < moved) { return false; }`;
  if (!source.includes(from)) throw Error("Contact cache layout changed");
  return (
    stamp +
    source.replace(
      from,
      `  let generation = generated & 0x07ffffffu;
  if (count == 0u || contactMovedAfter(bodies[a].inertialPos.w, generation) || contactMovedAfter(bodies[b].inertialPos.w, generation)) { return false; }`,
    )
  );
}
