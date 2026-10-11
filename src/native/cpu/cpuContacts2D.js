import { collideBoxes } from "../../../reference/three-avbd/src/avbd2d/soa/collide.ts";
import { shapesOf2D } from "../../gpu/shapes2D.js";
const add = (a, b) => a.map((v, i) => v + b[i]),
  sub = (a, b) => a.map((v, i) => v - b[i]),
  scale = (a, s) => a.map((v) => v * s),
  dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const rot = (a, p) => [
  Math.cos(a) * p[0] - Math.sin(a) * p[1],
  Math.sin(a) * p[0] + Math.cos(a) * p[1],
];
const clamp = (x) => Math.max(0, Math.min(1, x));
const nearest = (a, b, p) =>
  add(
    a,
    scale(
      sub(b, a),
      clamp(dot(sub(p, a), sub(b, a)) / (dot(sub(b, a), sub(b, a)) || 1)),
    ),
  );
export function cpuGeometry2D(t, i) {
  const g = shapesOf2D(t)?.get(i) ?? [0, 0, 0, 0],
    p = Array.from(t.pose.subarray(i * 4, i * 4 + 2)),
    angle = t.pose[i * 4 + 2];
  const transform = (v) => add(p, rot(angle, v));
  const half = [t.shape[i * 4] / 2, t.shape[i * 4 + 1] / 2];
  const vertices =
    g[0] === 4
      ? Array.from({ length: g.vertices.length / 4 }, (_, k) =>
          transform(g.vertices.slice(k * 4, k * 4 + 2)),
        )
      : g[0] === 0
        ? [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1],
          ].map((v) => transform([v[0] * half[0], v[1] * half[1]]))
        : null;
  return {
    kind: g[0],
    p,
    angle,
    vertices,
    radius: g[1],
    spine: [transform([-g[2] || 0, 0]), transform([g[2] || 0, 0])],
  };
}
function support(g, n) {
  if (g.vertices) {
    let best = -Infinity,
      points = [];
    for (const p of g.vertices) {
      const d = dot(p, n);
      if (d > best + 1e-7) {
        best = d;
        points = [p];
      } else if (Math.abs(d - best) < 1e-7) points.push(p);
    }
    return [points[0], points.at(-1)];
  }
  const a = add(g.spine[0], scale(n, g.radius)),
    b = add(g.spine[1], scale(n, g.radius));
  return Math.abs(dot(a, n) - dot(b, n)) < 1e-7
    ? [a, b]
    : dot(a, n) > dot(b, n)
      ? [a, a]
      : [b, b];
}
export function collideCpu2D(t, a, b, out) {
  const A = cpuGeometry2D(t, a),
    B = cpuGeometry2D(t, b),
    pose = t.pose,
    shape = t.shape;
  if (A.kind === 0 && B.kind === 0)
    return collideBoxes(
      ...pose.subarray(a * 4, a * 4 + 3),
      shape[a * 4] / 2,
      shape[a * 4 + 1] / 2,
      ...pose.subarray(b * 4, b * 4 + 3),
      shape[b * 4] / 2,
      shape[b * 4 + 1] / 2,
      out,
    );
  const contacts = [];
  if (A.kind === 3 || B.kind === 3) {
    const planeA = A.kind === 3,
      plane = planeA ? A : B,
      other = planeA ? B : A;
    if (other.kind === 3) return 0;
    const n = rot(plane.angle, [0, 1]),
      face = support(other, scale(n, -1));
    for (const p of face) {
      const gap = dot(sub(p, plane.p), n);
      if (gap <= 0) {
        const q = sub(p, scale(n, gap));
        contacts.push({
          a: planeA ? q : p,
          b: planeA ? p : q,
          n: planeA ? scale(n, -1) : n,
        });
      }
    }
  } else {
    let gap = -Infinity,
      n = [0, 1];
    const consider = (axis) => {
      const len = Math.hypot(...axis);
      if (len < 1e-9) return;
      let v = scale(axis, 1 / len);
      const x = dot(sub(support(A, scale(v, -1))[0], support(B, v)[0]), v),
        y = dot(sub(support(B, scale(v, -1))[0], support(A, v)[0]), v);
      if (Math.max(x, y) > gap + 1e-7) {
        gap = Math.max(x, y);
        n = x >= y ? v : scale(v, -1);
      }
    };
    for (const [g, h] of [
      [A, B],
      [B, A],
    ]) {
      if (g.vertices) {
        for (let i = 0; i < g.vertices.length; i++) {
          const e = sub(g.vertices[(i + 1) % g.vertices.length], g.vertices[i]);
          consider([e[1], -e[0]]);
          if (!h.vertices)
            consider(sub(g.vertices[i], nearest(...h.spine, g.vertices[i])));
        }
      } else {
        consider(rot(g.angle, [0, 1]));
        if (!h.vertices)
          for (const p of g.spine) consider(sub(p, nearest(...h.spine, p)));
      }
    }
    if (gap === -Infinity) consider([0, 1]);
    if (gap > 0) return 0;
    const fa = support(A, scale(n, -1)),
      fb = support(B, n),
      tangent = [-n[1], n[0]];
    const va = fa.map((p) => dot(p, tangent)),
      vb = fb.map((p) => dot(p, tangent));
    const lo = Math.max(Math.min(...va), Math.min(...vb)),
      hi = Math.min(Math.max(...va), Math.max(...vb));
    const at = (face, v) => {
      const delta = dot(sub(face[1], face[0]), tangent);
      return Math.abs(delta) < 1e-9
        ? face[0]
        : add(
            face[0],
            scale(
              sub(face[1], face[0]),
              clamp((v - dot(face[0], tangent)) / delta),
            ),
          );
    };
    for (const coordinate of hi - lo > 1e-6 ? [lo, hi] : [(lo + hi) / 2])
      contacts.push({ a: at(fa, coordinate), b: at(fb, coordinate), n });
  }
  let count = 0;
  for (const c of contacts) {
    if (count && Math.hypot(...sub(c.a, contacts[0].a)) < 1e-7) continue;
    const ra = rot(-A.angle, sub(c.a, A.p)),
      rb = rot(-B.angle, sub(c.b, B.p));
    out.set([0x10000000 + count, ...ra, ...rb, ...c.n], count * 7);
    count++;
    if (count === 2) break;
  }
  return count;
}
