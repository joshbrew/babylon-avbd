import {
  geometry3D,
  add,
  sub,
  scale,
  dot,
  cross,
  unit,
} from "./cpuContacts3D.js";
import { cpuGeometry2D } from "./cpuContacts2D.js";
import { components } from "../runtime.js";

const nearest = (a, b, p) => {
  const e = sub(b, a);
  return add(
    a,
    scale(e, Math.max(0, Math.min(1, dot(sub(p, a), e) / (dot(e, e) || 1)))),
  );
};
function sphere(o, d, c, r) {
  const v = sub(o, c),
    b = dot(v, d),
    disc = b * b - dot(v, v) + r * r;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t < 0) return null;
  return { t, n: unit(sub(add(o, scale(d, t)), c)) };
}
function best(a, b) {
  return b && (!a || b.t < a.t) ? b : a;
}
function capsule(o, d, a, b, r) {
  const ba = sub(b, a),
    oa = sub(o, a),
    bb = dot(ba, ba);
  if (bb < 1e-16) return sphere(o, d, a, r);
  const bd = dot(ba, d),
    bo = dot(ba, oa),
    od = dot(oa, d),
    A = bb - bd * bd,
    B = bb * od - bo * bd,
    C = bb * dot(oa, oa) - bo * bo - r * r * bb,
    disc = B * B - A * C;
  let hit = null;
  if (A > 1e-12 * bb && disc >= 0) {
    const t = (-B - Math.sqrt(disc)) / A,
      y = bo + t * bd;
    if (t >= 0 && y >= 0 && y <= bb)
      hit = { t, n: unit(sub(add(o, scale(d, t)), add(a, scale(ba, y / bb)))) };
  }
  return best(best(hit, sphere(o, d, a, r)), sphere(o, d, b, r));
}
function onFace(p, f) {
  const center = scale(
    f.vertices.reduce((s, v) => add(s, v), [0, 0, 0]),
    1 / f.vertices.length,
  );
  for (let i = 0; i < f.vertices.length; i++) {
    const a = f.vertices[i],
      b = f.vertices[(i + 1) % f.vertices.length],
      side = cross(sub(b, a), f.normal);
    if (
      dot(side, sub(p, a)) * (dot(side, sub(center, a)) >= 0 ? 1 : -1) <
      -1e-6
    )
      return false;
  }
  return true;
}
function poly3(g, o, d, r) {
  if (r === 0) {
    let enter = -Infinity,
      exit = Infinity,
      n = scale(d, -1);
    for (const f of g.faces) {
      const denom = dot(f.normal, d),
        gap = dot(f.normal, sub(f.vertices[0], o));
      if (Math.abs(denom) < 1e-12) {
        if (gap < 0) return null;
      } else {
        const t = gap / denom;
        if (denom < 0) {
          if (t > enter) {
            enter = t;
            n = f.normal;
          }
        } else exit = Math.min(exit, t);
      }
      if (enter > exit) return null;
    }
    return exit < 0
      ? null
      : { t: Math.max(0, enter), n: enter <= 0 ? scale(d, -1) : n };
  }
  let inside = true,
    distance = Infinity,
    hit = null;
  for (const f of g.faces) {
    const signed = dot(f.normal, sub(o, f.vertices[0]));
    if (signed > 0) inside = false;
    if (onFace(sub(o, scale(f.normal, signed)), f))
      distance = Math.min(distance, signed * signed);
    const denom = dot(f.normal, d);
    if (denom < -1e-12) {
      const t = (r - signed) / denom;
      if (t >= 0 && onFace(sub(add(o, scale(d, t)), scale(f.normal, r)), f))
        hit = best(hit, { t, n: f.normal });
    }
  }
  for (const [a, b] of g.edges) {
    const q = sub(o, nearest(a, b, o));
    distance = Math.min(distance, dot(q, q));
    hit = best(hit, capsule(o, d, a, b, r));
  }
  return inside || distance <= r * r ? { t: 0, n: scale(d, -1) } : hit;
}
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
function poly2(g, o, d, r) {
  let inside = true,
    distance = Infinity,
    hit = null;
  for (let k = 0; k < g.vertices.length; k++) {
    const a = g.vertices[k],
      b = g.vertices[(k + 1) % g.vertices.length],
      e = sub(b, a),
      n = unit([e[1], -e[0]]),
      signed = dot2(sub(o, a), n);
    if (signed > 0) inside = false;
    const delta = sub(o, nearest(a, b, o));
    distance = Math.min(distance, dot2(delta, delta));
    const denom = dot2(d, n);
    if (denom < -1e-12) {
      const t = (r - signed) / denom,
        p = sub(add(o, scale(d, t)), scale(n, r)),
        along = dot2(sub(p, a), e),
        tol = 1e-6 * dot2(e, e);
      if (t >= 0 && along >= -tol && along <= dot2(e, e) + tol)
        hit = best(hit, { t, n });
    }
    if (r > 0) hit = best(hit, sphere(o, d, a, r));
  }
  return inside || distance <= r * r ? { t: 0, n: scale(d, -1) } : hit;
}
function shape2(g, o, d, r) {
  if (g.vertices) return poly2(g, o, d, r);
  if (g.kind === 3) {
    const n = [-Math.sin(g.angle), Math.cos(g.angle)],
      gap = dot2(sub(o, g.p), n) - r,
      den = dot2(d, n);
    return gap <= 0
      ? { t: 0, n: scale(d, -1) }
      : den < -1e-12
        ? { t: -gap / den, n }
        : null;
  }
  const a = g.kind === 1 ? g.p : g.spine[0],
    b = g.kind === 1 ? g.p : g.spine[1],
    radius = r + g.radius,
    delta = sub(o, nearest(a, b, o));
  if (dot2(delta, delta) <= radius * radius) return { t: 0, n: scale(d, -1) };
  if (radius > 0) return capsule(o, d, a, b, radius);
  const e = sub(b, a),
    den = d[0] * e[1] - d[1] * e[0];
  if (Math.abs(den) < 1e-12) {
    const v = sub(o, a),
      distance =
        Math.abs(v[0] * e[1] - v[1] * e[0]) / Math.max(Math.hypot(...e), 1e-20);
    if (distance > 1e-6) return null;
    const lo = Math.min(dot2(sub(a, o), d), dot2(sub(b, o), d)),
      hi = Math.max(dot2(sub(a, o), d), dot2(sub(b, o), d));
    return hi < 0 ? null : { t: Math.max(0, lo), n: scale(d, -1) };
  }
  const v = sub(a, o),
    t = (v[0] * e[1] - v[1] * e[0]) / den,
    u = (v[0] * d[1] - v[1] * d[0]) / den;
  return t >= 0 && u >= 0 && u <= 1
    ? { t, n: scale(unit([e[1], -e[0]]), den > 0 ? -1 : 1) }
    : null;
}
/** Analytic sweeps of the actual round/convex shapes, including rounded edges. */
export function cpuCast(
  world,
  origin,
  radius,
  direction,
  {
    maxDistance = 1e30,
    ignore = [],
    collidesWith = 0xffffffff,
    membership,
    includeTriggers = true,
  } = {},
) {
  const n = world.dimension,
    o = components(origin, n, "origin"),
    v = components(direction, n, "direction"),
    len = Math.hypot(...v);
  if (
    !len ||
    !Number.isFinite(radius) ||
    radius < 0 ||
    !Number.isFinite(maxDistance) ||
    maxDistance < 0
  )
    throw Error(
      "Provide a nonzero direction, finite nonnegative radius and distance",
    );
  if (
    !Number.isInteger(collidesWith) ||
    collidesWith < 0 ||
    collidesWith > 0xffffffff
  )
    throw Error("Collision masks must be unsigned 32-bit integers");
  if (
    membership !== undefined &&
    (!Number.isInteger(membership) || membership < 0 || membership > 0xffffffff)
  )
    throw Error("Query membership must be an unsigned 32-bit integer");
  const ignored = new Set(ignore);
  for (const id of ignored) world.liveIndex(id);
  const d = v.map((x) => x / len);
  let result = null;
  for (let i = 0; i < world.bodyCount; i++) {
    if (ignored.has(i)) continue;
    const b = n === 3 ? world.solver.bodies[i] : null;
    const group = b
        ? (b.group ?? 0xffffffff)
        : (world.solver.filters.get(i)?.[0] ?? 0xffffffff),
      trigger = b ? b.isTrigger : world.solver.sensors.has(i),
      mask = b
        ? (b.collidesWith ?? 0xffffffff)
        : (world.solver.filters.get(i)?.[1] ?? 0xffffffff);
    if (!(group & collidesWith) || (!includeTriggers && trigger)) continue;
    if (membership !== undefined && !(mask & membership)) continue;
    let hit;
    if (n === 2) hit = shape2(cpuGeometry2D(world.solver, i), o, d, radius);
    else {
      const g = geometry3D(b);
      if (g.spine) {
        const r = g.radius + radius,
          delta = sub(o, nearest(...g.spine, o));
        hit =
          dot(delta, delta) <= r * r
            ? { t: 0, n: scale(d, -1) }
            : capsule(o, d, ...g.spine, r);
      } else hit = poly3(g, o, d, radius);
    }
    if (!hit || hit.t > maxDistance || (result && hit.t >= result.distance))
      continue;
    const center = add(o, scale(d, hit.t));
    result = {
      index: i,
      distance: hit.t,
      normal: hit.n,
      center,
      point: sub(center, scale(hit.n, radius)),
    };
  }
  return result;
}
