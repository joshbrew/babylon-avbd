import {
  rotateInv,
  vec3,
  qmul,
  qinverse,
  quat,
} from "../../../reference/three-avbd/src/avbd3d/ref/math.ts";

// The CPU solver visits pairs sequentially; reuse scratch vectors on the hot path.
const delta = vec3(),
  relativePosition = vec3(),
  inverse = quat(),
  relativeRotation = quat();
const rotationDistance = (a, b) => {
  let minus = 0,
    plus = 0;
  for (let i = 0; i < 4; i++) {
    minus += (a[i] - b[i]) ** 2;
    plus += (a[i] + b[i]) ** 2;
  }
  return 2 * Math.sqrt(Math.min(minus, plus));
};
export function capturePair3D(a, b, epoch) {
  const qa = Array.from(a.positionAng),
    qb = Array.from(b.positionAng);
  return {
    a,
    b,
    epoch,
    qa,
    qb,
    p: Array.from(
      rotateInv(
        vec3(),
        qa,
        b.positionLin.map((v, i) => v - a.positionLin[i]),
      ),
    ),
    q: Array.from(qmul(quat(), qinverse(quat(), qa), qb)),
  };
}
export function canRecycle3D(cache, a, b, options, epoch) {
  if (!cache || cache.a !== a || cache.b !== b || cache.epoch !== epoch)
    return false;
  if (
    rotationDistance(a.positionAng, cache.qa) > options.maxAngle ||
    rotationDistance(b.positionAng, cache.qb) > options.maxAngle
  )
    return false;
  for (let i = 0; i < 3; i++) delta[i] = b.positionLin[i] - a.positionLin[i];
  const p = rotateInv(relativePosition, a.positionAng, delta);
  const q = qmul(
    relativeRotation,
    qinverse(inverse, a.positionAng),
    b.positionAng,
  );
  const extent = Math.max(a.mass > 0 ? a.radius : 0, b.mass > 0 ? b.radius : 0);
  const small = Math.min(
    a.mass > 0 ? Math.min(...a.size) : Infinity,
    b.mass > 0 ? Math.min(...b.size) : Infinity,
  );
  return (
    Math.hypot(p[0] - cache.p[0], p[1] - cache.p[1], p[2] - cache.p[2]) +
      rotationDistance(q, cache.q) * extent <
    Math.min(options.distance, 0.05 * small)
  );
}
const rotate2 = (angle, x, y) => [
  Math.cos(angle) * x - Math.sin(angle) * y,
  Math.sin(angle) * x + Math.cos(angle) * y,
];
export function capturePair2D(s, a, b, count, out) {
  const A = a * 4,
    B = b * 4,
    qa = s.pose[A + 2],
    qb = s.pose[B + 2];
  return {
    epoch: s.contactRecyclingEpoch,
    qa,
    qb,
    p: rotate2(-qa, s.pose[B] - s.pose[A], s.pose[B + 1] - s.pose[A + 1]),
    points: out.slice(0, count * 7),
    count,
  };
}
export function canRecycle2D(c, s, a, b) {
  if (!c || c.epoch !== s.contactRecyclingEpoch) return false;
  const A = a * 4,
    B = b * 4,
    qa = s.pose[A + 2],
    qb = s.pose[B + 2],
    o = s.contactRecycling;
  if (Math.abs(qa - c.qa) > o.maxAngle || Math.abs(qb - c.qb) > o.maxAngle)
    return false;
  const p = rotate2(-qa, s.pose[B] - s.pose[A], s.pose[B + 1] - s.pose[A + 1]);
  const extent = Math.max(
    s.shape[A + 2] > 0 ? Math.hypot(s.shape[A], s.shape[A + 1]) / 2 : 0,
    s.shape[B + 2] > 0 ? Math.hypot(s.shape[B], s.shape[B + 1]) / 2 : 0,
  );
  const small = Math.min(
    s.shape[A + 2] > 0 ? Math.min(s.shape[A], s.shape[A + 1]) : Infinity,
    s.shape[B + 2] > 0 ? Math.min(s.shape[B], s.shape[B + 1]) : Infinity,
  );
  return (
    Math.hypot(p[0] - c.p[0], p[1] - c.p[1]) +
      Math.abs(qb - qa - c.qb + c.qa) * extent <
    Math.min(o.distance, 0.05 * small)
  );
}
