import { turn, cross, dot, sub } from "./cpuContacts3D.js";

// Same velocity-level contact response as the GPU backend: manifold centroids,
// angular effective mass, an impact threshold of 1 m/s and 12 relaxed Jacobi rounds.
export function captureIncoming(solver, dimension) {
  const active =
    dimension === 3
      ? solver.bodies.some((body) => body.restitution > 0)
      : [...solver.restitution.values()].some((value) => value > 0);
  if (!active) return null;
  if (dimension === 2) return Float64Array.from(solver.velocity);
  const values = new Float64Array(solver.bodies.length * 6);
  solver.bodies.forEach((body, i) => {
    values.set(body.velocityLin, i * 6);
    values.set(body.velocityAng, i * 6 + 3);
  });
  return values;
}

export function bounceContacts(solver, dimension, incoming) {
  if (!incoming) return;
  const count = dimension === 3 ? solver.bodies.length : solver.bodyCount;
  const stride = dimension === 3 ? 6 : 4;
  const velocity =
    dimension === 3 ? new Float64Array(count * stride) : solver.velocity;
  if (dimension === 3)
    solver.bodies.forEach((body, i) => {
      velocity.set(body.velocityLin, i * stride);
      velocity.set(body.velocityAng, i * stride + 3);
    });
  const inverseMass = (i) =>
    dimension === 3
      ? solver.bodies[i].mass > 0 && !solver.bodies[i].sleeping
        ? 1 / solver.bodies[i].mass
        : 0
      : solver.dynamic[i]
        ? 1 / solver.shape[i * 4 + 2]
        : 0;
  const inverseInertia = (i, torque) => {
    if (!inverseMass(i)) return dimension === 3 ? [0, 0, 0] : 0;
    if (dimension === 2)
      return solver.shape[i * 4 + 3] > 0 ? torque / solver.shape[i * 4 + 3] : 0;
    const body = solver.bodies[i],
      q = body.positionAng;
    const local = turn([-q[0], -q[1], -q[2], q[3]], torque);
    return turn(
      q,
      local.map((v, k) => (body.moment[k] > 0 ? v / body.moment[k] : 0)),
    );
  };
  const pointVelocity = (values, i, r) => {
    const o = i * stride;
    return dimension === 3
      ? sub(values.subarray(o, o + 3), cross(r, values.subarray(o + 3, o + 6)))
      : [
          values[o] - values[o + 2] * r[1],
          values[o + 1] + values[o + 2] * r[0],
        ];
  };
  const torque = (r, n) =>
    dimension === 3 ? cross(r, n) : r[0] * n[1] - r[1] * n[0];
  const scalar = (a, b) => (dimension === 3 ? dot(a, b) : a * b);
  let contacts;
  if (dimension === 3) {
    const ids = new Map(solver.bodies.map((body, i) => [body, i]));
    contacts = solver.forces
      .filter(
        (f) => f.contacts?.length && !f.bodyA.isTrigger && !f.bodyB.isTrigger,
      )
      .map((f) => {
        const centroid = (body, key) => {
          const r = [0, 0, 0];
          for (const c of f.contacts) {
            const p = turn(body.positionAng, c[key]);
            for (let k = 0; k < 3; k++) r[k] += p[k] / f.contacts.length;
          }
          return r;
        };
        return {
          a: ids.get(f.bodyA),
          b: ids.get(f.bodyB),
          n: f.basis.slice(0, 3),
          ra: centroid(f.bodyA, "rA"),
          rb: centroid(f.bodyB, "rB"),
          e: Math.max(f.bodyA.restitution ?? 0, f.bodyB.restitution ?? 0),
        };
      });
  } else {
    const rotate = (i, r) => {
      const c = Math.cos(solver.pose[i * 4 + 2]),
        s = Math.sin(solver.pose[i * 4 + 2]);
      return [c * r[0] - s * r[1], s * r[0] + c * r[1]];
    };
    contacts = solver.contactPairs
      .filter((p) => !solver.sensors.has(p.a) && !solver.sensors.has(p.b))
      .map((p) => ({
        ...p,
        ra: rotate(p.a, p.ra),
        rb: rotate(p.b, p.rb),
        e: Math.max(
          solver.restitution.get(p.a) ?? 0,
          solver.restitution.get(p.b) ?? 0,
        ),
      }));
  }
  const degree = new Uint32Array(count);
  if (dimension === 3)
    solver.bodies.forEach((body, i) => {
      degree[i] = body.forces.length;
    });
  else
    for (let i = 0; i < count; i++)
      degree[i] = solver.adjStart[i + 1] - solver.adjStart[i];
  const pairs = [];
  for (const p of contacts) {
    if (p.e <= 0) continue;
    const vn = dot(
      p.n,
      sub(
        pointVelocity(incoming, p.a, p.ra),
        pointVelocity(incoming, p.b, p.rb),
      ),
    );
    if (vn >= -1) continue;
    const ta = torque(p.ra, p.n),
      tb = torque(p.rb, p.n);
    const inertiaA = inverseInertia(p.a, ta),
      inertiaB = inverseInertia(p.b, tb);
    const k =
      inverseMass(p.a) +
      inverseMass(p.b) +
      scalar(ta, inertiaA) +
      scalar(tb, inertiaB);
    if (k > 0)
      pairs.push({
        ...p,
        inertiaA,
        inertiaB,
        k,
        target: -p.e * vn,
        impulse: 0,
      });
  }
  const delta = new Float64Array(velocity.length);
  for (let round = 0; round < 12 && pairs.length; round++) {
    delta.fill(0);
    for (const p of pairs) {
      const vn = dot(
        p.n,
        sub(
          pointVelocity(velocity, p.a, p.ra),
          pointVelocity(velocity, p.b, p.rb),
        ),
      );
      const impulse = Math.max(
        0,
        p.impulse +
          (p.target - vn) / (p.k * Math.max(1, degree[p.a], degree[p.b])),
      );
      const change = impulse - p.impulse;
      p.impulse = impulse;
      for (const [i, sign, inertia] of [
        [p.a, 1, p.inertiaA],
        [p.b, -1, p.inertiaB],
      ]) {
        const o = i * stride,
          mass = inverseMass(i);
        for (let k = 0; k < dimension; k++)
          delta[o + k] += sign * change * mass * p.n[k];
        if (dimension === 3)
          for (let k = 0; k < 3; k++)
            delta[o + 3 + k] += sign * change * inertia[k];
        else delta[o + 2] += sign * change * inertia;
      }
    }
    for (let k = 0; k < velocity.length; k++) velocity[k] += delta[k];
  }
  if (dimension === 3)
    solver.bodies.forEach((body, i) => {
      body.velocityLin.set(velocity.subarray(i * stride, i * stride + 3));
      body.velocityAng.set(velocity.subarray(i * stride + 3, i * stride + 6));
    });
}
