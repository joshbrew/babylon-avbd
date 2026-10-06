const sub = (a, b) => a.map((v, k) => v - b[k]);
const dot = (a, b) => a.reduce((s, v, k) => s + v * b[k], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const clamp = (v) => Math.max(0, Math.min(1, v));
const distance2 = (a, b) => dot(sub(a, b), sub(a, b));
function pointTriangle2(p, a, b, c) {
  const ab = sub(b, a),
    ac = sub(c, a),
    ap = sub(p, a),
    d1 = dot(ab, ap),
    d2 = dot(ac, ap);
  const areaNormal = cross(ab, ac);
  if (dot(areaNormal, areaNormal) < 1e-20)
    return Math.min(
      segments2(p, p, a, b),
      segments2(p, p, b, c),
      segments2(p, p, c, a),
    );
  if (d1 <= 0 && d2 <= 0) return distance2(p, a);
  const bp = sub(p, b),
    d3 = dot(ab, bp),
    d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return distance2(p, b);
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0)
    return distance2(
      p,
      a.map((v, k) => v + (ab[k] * d1) / (d1 - d3)),
    );
  const cp = sub(p, c),
    d5 = dot(ab, cp),
    d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return distance2(p, c);
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0)
    return distance2(
      p,
      a.map((v, k) => v + (ac[k] * d2) / (d2 - d6)),
    );
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return distance2(
      p,
      b.map((v, k) => v + ((c[k] - v) * (d4 - d3)) / (d4 - d3 + d5 - d6)),
    );
  const n = cross(ab, ac),
    nn = dot(n, n);
  return nn > 1e-20
    ? dot(ap, n) ** 2 / nn
    : Math.min(distance2(p, a), distance2(p, b), distance2(p, c));
}
function segments2(p, q, a, b) {
  const d1 = sub(q, p),
    d2 = sub(b, a),
    r = sub(p, a),
    aa = dot(d1, d1),
    e = dot(d2, d2),
    f = dot(d2, r);
  let s = 0,
    t = 0;
  if (aa <= 1e-20) t = e > 1e-20 ? clamp(f / e) : 0;
  else {
    const c = dot(d1, r);
    if (e <= 1e-20) s = clamp(-c / aa);
    else {
      const bb = dot(d1, d2),
        den = aa * e - bb * bb;
      s = den > 1e-20 ? clamp((bb * f - c * e) / den) : 0;
      t = (bb * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / aa);
      } else if (t > 1) {
        t = 1;
        s = clamp((bb - c) / aa);
      }
    }
  }
  return distance2(
    p.map((v, k) => v + d1[k] * s),
    a.map((v, k) => v + d2[k] * t),
  );
}
// Full 3D distance, including nearly vertical folds and triangles whose interior
// intersects a limb between the sampled axial points.
export function segmentTriangleDistance(p, q, [a, b, c]) {
  const direction = sub(q, p),
    ab = sub(b, a),
    ac = sub(c, a),
    h = cross(direction, ac),
    determinant = dot(ab, h);
  if (Math.abs(determinant) > 1e-12) {
    const s = sub(p, a),
      u = dot(s, h) / determinant,
      r = cross(s, ab),
      v = dot(direction, r) / determinant,
      t = dot(ac, r) / determinant;
    if (u >= 0 && v >= 0 && u + v <= 1 && t >= 0 && t <= 1) return 0;
  }
  return Math.sqrt(
    Math.max(
      0,
      Math.min(
        pointTriangle2(p, a, b, c),
        pointTriangle2(q, a, b, c),
        segments2(p, q, a, b),
        segments2(p, q, b, c),
        segments2(p, q, c, a),
      ),
    ),
  );
}
