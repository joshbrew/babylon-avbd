/** Conservative connected-island sleeping. Any edit or incoming impact wakes all. */
export class CpuSleeping {
  constructor(world, { speedThreshold = 0.08, timeThreshold = 0.6 } = {}) {
    if (
      !Number.isFinite(speedThreshold) ||
      speedThreshold <= 0 ||
      !Number.isFinite(timeThreshold) ||
      timeThreshold <= 0
    )
      throw Error("Sleep thresholds must be positive and finite");
    this.world = world;
    this.speedThreshold = speedThreshold;
    this.timeThreshold = timeThreshold;
    this.time = new Float64Array(world.bodyCount);
    this.asleep = new Set();
  }
  wake() {
    const w = this.world;
    for (const i of this.asleep)
      if (w.dimension === 3) w.solver.bodies[i].sleeping = false;
      else w.solver.dynamic[i] = Number(w.solver.shape[i * 4 + 2] > 0);
    this.asleep.clear();
    this.time.fill(0);
  }
  after() {
    const w = this.world,
      s = w.solver,
      n = w.bodyCount,
      root = Int32Array.from({ length: n }, (_, i) => i),
      support = new Set(),
      edges = [];
    const mass = (i) =>
      w.dimension === 3 ? s.bodies[i].mass : s.shape[i * 4 + 2];
    const find = (i) => {
      while (root[i] !== i) {
        root[i] = root[root[i]];
        i = root[i];
      }
      return i;
    };
    const link = (a, b) => {
      if (a < 0) {
        support.add(b);
        return;
      }
      if (mass(a) <= 0) support.add(b);
      else if (mass(b) <= 0) support.add(a);
      else root[find(a)] = find(b);
      edges.push([a, b]);
    };
    if (w.dimension === 3) {
      const ids = new Map(s.bodies.map((b, i) => [b, i]));
      for (const f of s.forces)
        if (!f.broken && !f.bodyA?.isTrigger && !f.bodyB?.isTrigger)
          link(f.bodyA ? ids.get(f.bodyA) : -1, ids.get(f.bodyB));
    } else {
      for (const p of s.contactPairs)
        if (!s.sensors.has(p.a) && !s.sensors.has(p.b)) link(p.a, p.b);
      for (let j = 0; j < s.jointCount; j++)
        if (s.data[j * 32 + 6] || s.data[j * 32 + 7] || s.data[j * 32 + 8])
          link(s.info[j * 4 + 1], s.info[j * 4 + 2]);
    }
    const supported = new Set([...support].map(find)),
      stable = new Map();
    for (let i = 0; i < n; i++)
      if (mass(i) > 0) {
        const r = find(i),
          b = w.dimension === 3 ? s.bodies[i] : null,
          allowed = b
            ? b.allowSleep !== false
            : s.avbdSleepEligible?.get(i) !== false;
        const speed = b
          ? Math.hypot(...b.velocityLin, ...b.velocityAng)
          : Math.hypot(...s.velocity.subarray(i * 4, i * 4 + 3));
        if (!stable.has(r)) stable.set(r, supported.has(r));
        stable.set(r, stable.get(r) && allowed && speed <= this.speedThreshold);
      }
    for (let i = 0; i < n; i++)
      if (mass(i) > 0) {
        this.time[i] = stable.get(find(i)) ? this.time[i] + w.params.dt : 0;
        if (this.time[i] >= this.timeThreshold) {
          this.asleep.add(i);
          if (w.dimension === 3) {
            s.bodies[i].sleeping = true;
            s.bodies[i].velocityLin.fill(0);
            s.bodies[i].velocityAng.fill(0);
          } else {
            s.dynamic[i] = 0;
            s.velocity.fill(0, i * 4, i * 4 + 4);
          }
        }
      }
    // An awake neighbour touching an existing sleeping island may move its support.
    // Wake conservatively before the next step, rather than freeze a moving stack.
    if (
      edges.some(
        ([a, b]) =>
          a >= 0 &&
          mass(a) > 0 &&
          mass(b) > 0 &&
          this.asleep.has(a) !== this.asleep.has(b),
      )
    )
      this.wake();
  }
}
