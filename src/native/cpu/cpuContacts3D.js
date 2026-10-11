import {
  hullOf,
  isSphere,
} from "../../../reference/three-avbd/src/avbd3d/shapes.ts";
import { isCapsule } from "../../gpu/capsuleShape.js";
import {
  rotate,
  rotateInv,
  vec3,
} from "../../../reference/three-avbd/src/avbd3d/ref/math.ts";
import { collide } from "./cpuBoxContacts3D.ts";

export const add = (a, b) => a.map((v, i) => v + b[i]);
export const sub = (a, b) => a.map((v, i) => v - b[i]);
export const scale = (a, s) => a.map((v) => v * s);
export const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const unit = (a) => scale(a, 1 / (Math.hypot(...a) || 1));
export const turn = (q, v) => Array.from(rotate(vec3(), q, v));
const local = (b, p) => rotateInv(vec3(), b.positionAng, sub(p, b.positionLin));
export const world = (b, p) => add(b.positionLin, turn(b.positionAng, p));
const boxFaces = [
  [1, 3, 7, 5],
  [0, 4, 6, 2],
  [2, 6, 7, 3],
  [0, 1, 5, 4],
  [4, 5, 7, 6],
  [0, 2, 3, 1],
];
const boxNormals = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export function geometry3D(body) {
  if (isSphere(body) || isCapsule(body)) {
    const radius = isSphere(body) ? body.size[0] / 2 : body.size[0] / 2;
    const half = isCapsule(body) ? Math.max(0, body.size[1] / 2 - radius) : 0;
    return {
      body,
      radius,
      spine: [world(body, [0, -half, 0]), world(body, [0, half, 0])],
    };
  }
  const h = hullOf(body);
  const vertices = h
    ? Array.from({ length: h.vertices.length / 3 }, (_, i) =>
        world(body, h.vertices.slice(i * 3, i * 3 + 3)),
      )
    : Array.from({ length: 8 }, (_, i) =>
        world(
          body,
          body.size.map((v, k) => (v / 2) * ((i >> k) & 1 ? 1 : -1)),
        ),
      );
  const faces = h
    ? h.faces.map((f) => ({
        vertices: f.verts.map((i) => vertices[i]),
        normal: turn(body.positionAng, f.normal),
      }))
    : boxFaces.map((indices, i) => ({
        vertices: indices.map((k) => vertices[k]),
        normal: turn(body.positionAng, boxNormals[i]),
      }));
  const edges = [];
  const seen = new Set();
  for (const f of faces)
    for (let i = 0; i < f.vertices.length; i++) {
      const a = f.vertices[i],
        b = f.vertices[(i + 1) % f.vertices.length];
      const ia = vertices.indexOf(a),
        ib = vertices.indexOf(b),
        key = `${Math.min(ia, ib)},${Math.max(ia, ib)}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([a, b]);
      }
    }
  return { body, vertices, faces, edges };
}
function support(g, n) {
  const values = g.spine ?? g.vertices;
  let p = values[0];
  for (const v of values) if (dot(v, n) > dot(p, n)) p = v;
  return g.spine ? add(p, scale(n, g.radius)) : p;
}
function nearest(a, b, p) {
  const e = sub(b, a);
  return add(
    a,
    scale(e, Math.max(0, Math.min(1, dot(sub(p, a), e) / (dot(e, e) || 1)))),
  );
}
function closestSegments([p, q], [r, s]) {
  const d1 = sub(q, p),
    d2 = sub(s, r),
    w = sub(p, r),
    a = dot(d1, d1),
    e = dot(d2, d2),
    f = dot(d2, w);
  let u = 0,
    v = 0;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  if (a < 1e-16) v = e > 1e-16 ? clamp(f / e) : 0;
  else {
    const c = dot(d1, w);
    if (e < 1e-16) u = clamp(-c / a);
    else {
      const b = dot(d1, d2),
        den = a * e - b * b;
      u = den > 1e-12 * a * e ? clamp((b * f - c * e) / den) : 0;
      v = (b * u + f) / e;
      if (v < 0) {
        v = 0;
        u = clamp(-c / a);
      } else if (v > 1) {
        v = 1;
        u = clamp((b - c) / a);
      }
    }
  }
  return [add(p, scale(d1, u)), add(r, scale(d2, v))];
}
function clip(points, n, d) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      da = dot(a, n) - d,
      db = dot(b, n) - d;
    if (da <= 1e-8) out.push(a);
    if (da < 0 !== db < 0) out.push(add(a, scale(sub(b, a), da / (da - db))));
  }
  return out;
}
function closestTriangle(p, a, b, c) {
  const ab = sub(b, a),
    ac = sub(c, a),
    ap = sub(p, a),
    d1 = dot(ab, ap),
    d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b),
    d3 = dot(ab, bp),
    d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, scale(ab, d1 / (d1 - d3)));
  const cp = sub(p, c),
    d5 = dot(ab, cp),
    d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, scale(ac, d2 / (d2 - d6)));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return add(b, scale(sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6)));
  const den = 1 / (va + vb + vc);
  return add(a, add(scale(ab, vb * den), scale(ac, vc * den)));
}
function closestSurface(g, p) {
  let best = null,
    dist = Infinity;
  for (const f of g.faces)
    for (let i = 1; i < f.vertices.length - 1; i++) {
      const q = closestTriangle(
          p,
          f.vertices[0],
          f.vertices[i],
          f.vertices[i + 1],
        ),
        d = dot(sub(p, q), sub(p, q));
      if (d < dist) {
        best = q;
        dist = d;
      }
    }
  return best;
}
export function collideCpu3D(a, b, basis, ga, gb) {
  if (
    !isSphere(a) &&
    !isSphere(b) &&
    !isCapsule(a) &&
    !isCapsule(b) &&
    !hullOf(a) &&
    !hullOf(b)
  )
    return collide(a, b, basis, a.solver.faceBias !== false);
  ga ??= geometry3D(a);
  gb ??= geometry3D(b);
  let gap = -Infinity,
    n = [0, 0, 1],
    edgePair = null;
  const consider = (axis, edges = null) => {
    if (Math.hypot(...axis) < 1e-9) return;
    let v = unit(axis),
      g = dot(sub(support(ga, scale(v, -1)), support(gb, v)), v);
    const rev = dot(sub(support(gb, scale(v, -1)), support(ga, v)), v);
    if (rev > g) {
      g = rev;
      v = scale(v, -1);
    }
    if (g > gap + 1e-7) {
      gap = g;
      n = v;
      edgePair = edges;
    }
  };
  for (const g of [ga, gb]) for (const f of g.faces ?? []) consider(f.normal);
  if (ga.edges && gb.edges)
    for (const ea of ga.edges)
      for (const eb of gb.edges)
        consider(cross(sub(ea[1], ea[0]), sub(eb[1], eb[0])), [ea, eb]);
  if (ga.spine && gb.spine) {
    const pair = closestSegments(ga.spine, gb.spine);
    consider(sub(...pair));
  }
  for (const [round, poly] of [
    [ga, gb],
    [gb, ga],
  ])
    if (round.spine && poly.faces) {
      for (const v of poly.vertices)
        consider(sub(v, nearest(...round.spine, v)));
      for (const e of poly.edges) {
        const pair = closestSegments(round.spine, e);
        consider(sub(...pair));
      }
    }
  if (gap === -Infinity) consider(sub(a.positionLin, b.positionLin));
  if (gap > 0) return [];
  if (gap === -Infinity) {
    n = [0, 0, 1];
    gap = -(ga.radius + gb.radius);
  }
  const tangent = unit(cross(n, Math.abs(n[0]) < 0.7 ? [1, 0, 0] : [0, 1, 0]));
  basis.set([...n, ...tangent, ...cross(n, tangent)]);
  let pairs = [];
  if (ga.spine && gb.spine) {
    const [pa, pb] = closestSegments(ga.spine, gb.spine);
    pairs = [[add(pa, scale(n, -ga.radius)), add(pb, scale(n, gb.radius))]];
  } else if (ga.spine || gb.spine) {
    const round = ga.spine ? ga : gb,
      poly = ga.spine ? gb : ga;
    const direction = ga.spine ? scale(n, -1) : n,
      pa = support(round, direction),
      pb = closestSurface(poly, pa);
    pairs = [ga.spine ? [pa, pb] : [pb, pa]];
  } else if (edgePair) {
    pairs = [closestSegments(...edgePair)];
  } else {
    const face = (g, d) =>
      g.faces.reduce(
        (best, f) => (dot(f.normal, d) > dot(best.normal, d) ? f : best),
        g.faces[0],
      );
    const fa = face(ga, scale(n, -1)),
      fb = face(gb, n),
      useA = dot(fa.normal, scale(n, -1)) >= dot(fb.normal, n);
    const ref = useA ? fa : fb,
      inc = face(useA ? gb : ga, scale(ref.normal, -1));
    let polygon = inc.vertices;
    const center = scale(
      ref.vertices.reduce((s, v) => add(s, v), [0, 0, 0]),
      1 / ref.vertices.length,
    );
    for (let i = 0; i < ref.vertices.length && polygon.length; i++) {
      const p = ref.vertices[i],
        q = ref.vertices[(i + 1) % ref.vertices.length];
      let side = unit(cross(sub(q, p), ref.normal));
      if (dot(sub(center, p), side) > 0) side = scale(side, -1);
      polygon = clip(polygon, side, dot(p, side));
    }
    for (const p of polygon) {
      const d = dot(sub(p, ref.vertices[0]), ref.normal);
      if (d <= 1e-6) {
        const projected = sub(p, scale(ref.normal, d));
        pairs.push(useA ? [projected, p] : [p, projected]);
      }
    }
  }
  return pairs.slice(0, 8).map(([pa, pb], i) => ({
    feature: i + 1,
    rA: local(a, pa),
    rB: local(b, pb),
  }));
}
