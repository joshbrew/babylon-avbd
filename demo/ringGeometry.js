// Perpendicular chain-mail rings touch on the inside of their two wires.
// Derive their scale from the joint's rest spacing, rather than box extents.
export function chainRingScales(solver, visualOf, ring) {
  const scales = new Map();
  for (const joint of solver.forces) {
    const a = joint.bodyA,
      b = joint.bodyB;
    if (!a || !b) continue;
    const av = visualOf(a)?.shape,
      bv = visualOf(b)?.shape;
    const standing = (v) => v === "ringX" || v === "ringY";
    if (!(
      (av === "ringFlat" && standing(bv)) ||
      (bv === "ringFlat" && standing(av))
    ))
      continue;
    const ra = av === "ringFlat" ? ring.flat : ring.link;
    const rb = bv === "ringFlat" ? ring.flat : ring.link;
    const spacing = Math.hypot(
      ...a.positionLin.map((v, i) => v - b.positionLin[i]),
    );
    const insideSpan =
      a.size[0] * (ra - ring.wire) + b.size[0] * (rb - ring.wire);
    if (spacing > 0 && insideSpan > 0) {
      const scale = spacing / insideSpan;
      // Mesh dimensions are captured at construction, before GPU simulation.
      scales.set(a, scale);
      scales.set(b, scale);
    }
  }
  return scales;
}
