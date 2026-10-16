import { capturePair2D, canRecycle2D } from "./contactRecycling.js";
import {
  SoaSolver2D,
  CS,
  INFO_STRIDE,
  C0,
  P0,
  P1,
  P2,
  STIFF,
  PEN,
  LAM,
  FMIN,
  FMAX,
} from "../../../reference/three-avbd/src/avbd2d/soa/solver.ts";
import { shapesOf2D, storeShape2D } from "../../gpu/shapes2D.js";
import { collideCpu2D } from "./cpuContacts2D.js";
import { cpuNarrowphase2D } from "./cpuNarrowphase2D.js";
import { captureIncoming, bounceContacts } from "./restitution.js";

// Pinned SoA hooks are ordinary JavaScript methods. The source-integrity check
// and CPU demo suite protect this adapter without modifying the upstream copy.
export class CpuSolver2D extends SoaSolver2D {
  constructor(topology, scene, backend) {
    super({
      precision: backend === "soa-colored" ? "f32" : "f64",
      order: backend === "soa-colored" ? "colored" : "sequential",
    });
    Object.assign(this, topology);
    this.options = {
      ...this.options,
      precision: backend === "soa-colored" ? "f32" : "f64",
      order: backend === "soa-colored" ? "colored" : "sequential",
    };
    if (this.options.precision === "f64")
      for (const [key, value] of Object.entries(this))
        if (value instanceof Float32Array) this[key] = Float64Array.from(value);
    for (const [i, geometry] of shapesOf2D(topology) ?? []) {
      const mass = this.shape[i * 4 + 2];
      storeShape2D(
        this,
        i,
        {
          geometry,
          area: mass,
          momentPerMass: mass > 0 ? this.shape[i * 4 + 3] / mass : 0,
          radius: this.props[i * 4 + 1],
        },
        1,
      );
    }
    this.filters = new Map(scene?.filters ?? []);
    this.sensors = new Set(scene?.sensors ?? []);
    this.restitution = new Map(scene?.restitution ?? []);
    this.contactPairs = [];
    if (scene) scene.topology = this;
  }
  narrowphase() {
    this.contactPairs = [];
    if (this.contactRecycling) this.nextCollisionCache = new Map();
    cpuNarrowphase2D.call(this);
    if (this.contactRecycling) this.collisionCache = this.nextCollisionCache;
  }
  collideBodies(a, b, out, pairKey) {
    const A = this.filters.get(a) ?? [0xffffffff, 0xffffffff],
      B = this.filters.get(b) ?? [0xffffffff, 0xffffffff];
    if (!(A[0] & B[1]) || !(B[0] & A[1])) return 0;
    let count;
    if (!this.contactRecycling) count = collideCpu2D(this, a, b, out);
    else {
      const key = pairKey ?? `${a},${b}`,
        shapes = shapesOf2D(this),
        typeA = shapes?.get(a)?.[0] ?? 0,
        typeB = shapes?.get(b)?.[0] ?? 0,
        eligible =
          this.contactRecycling &&
          !this.sensors.has(a) &&
          !this.sensors.has(b) &&
          (typeA === 0 || typeA === 4) &&
          (typeB === 0 || typeB === 4),
        cache = eligible ? this.collisionCache?.get(key) : null;
      if (eligible && canRecycle2D(cache, this, a, b)) {
        count = cache.count;
        out.set(cache.points);
        this.nextCollisionCache.set(key, cache);
        this.recyclingStats.recycledPairs++;
      } else {
        count = collideCpu2D(this, a, b, out);
        if (this.contactRecycling) this.recyclingStats.evaluatedPairs++;
        if (eligible && count)
          this.nextCollisionCache.set(
            key,
            capturePair2D(this, a, b, count, out),
          );
      }
    }
    if (count) {
      const n = [out[5], out[6]],
        ra = [0, 0],
        rb = [0, 0];
      for (let c = 0; c < count; c++)
        for (let k = 0; k < 2; k++) {
          ra[k] += out[c * 7 + 1 + k] / count;
          rb[k] += out[c * 7 + 3 + k] / count;
        }
      const angle = this.pose[a * 4 + 2],
        co = Math.cos(angle),
        si = Math.sin(angle);
      this.contactPairs.push({
        a,
        b,
        n,
        ra,
        rb,
        point: [
          this.pose[a * 4] + co * ra[0] - si * ra[1],
          this.pose[a * 4 + 1] + si * ra[0] + co * ra[1],
          0,
        ],
        impulse: 0,
      });
    }
    return this.sensors.has(a) || this.sensors.has(b) ? 0 : count;
  }
  initJoints() {
    // Preserve public slots when constraints break or are released.
    for (let c = 0; c < this.jointCount; c++) {
      const o = c * CS,
        t = this.info[c * INFO_STRIDE];
      if (
        this.data[o + STIFF] === 0 &&
        this.data[o + STIFF + 1] === 0 &&
        this.data[o + STIFF + 2] === 0
      ) {
        if (t !== 0) {
          this.info[c * INFO_STRIDE] = 0;
          this.noCollideDirty = true;
          if (this.handles[c]) this.handles[c].alive = false;
        }
        continue;
      }
      if (t === 1)
        this.jointC(
          this.info[c * INFO_STRIDE + 1],
          this.info[c * INFO_STRIDE + 2],
          o,
          this.pose,
          this.data,
          o + C0,
        );
    }
    for (let c = 0; c < this.jointCount; c++)
      if (this.info[c * INFO_STRIDE] === 5) {
        const o = c * CS,
          a = this.info[c * INFO_STRIDE + 1],
          b = this.info[c * INFO_STRIDE + 2],
          angle =
            (a < 0 ? 0 : this.pose[a * 4 + 2]) -
            this.pose[b * 4 + 2] -
            this.data[o + P0];
        this.data[o + C0] = Math.min(0, angle - this.data[o + P1]);
        this.data[o + C0 + 1] = Math.max(0, angle - this.data[o + P2]);
      }
  }
  warmStartConstraints(post, alpha) {
    const slots = [];
    for (let c = 0; c < this.jointCount; c++)
      if (this.info[c * INFO_STRIDE] === 5) {
        slots.push(c);
        this.info[c * INFO_STRIDE] = 4;
      }
    super.warmStartConstraints(post, alpha);
    for (const c of slots) this.info[c * INFO_STRIDE] = 5;
  }
  evalConstraint(c, alpha, body) {
    if (this.info[c * INFO_STRIDE] !== 5)
      return super.evalConstraint(c, alpha, body);
    const o = c * CS,
      a = this.info[c * INFO_STRIDE + 1],
      b = this.info[c * INFO_STRIDE + 2],
      d = this.data,
      angle =
        (a < 0 ? 0 : this.pose[a * 4 + 2]) - this.pose[b * 4 + 2] - d[o + P0];
    this.eC[0] = angle - d[o + P1] - alpha * d[o + C0];
    this.eC[1] = angle - d[o + P2] - alpha * d[o + C0 + 1];
    this.eG.fill(0);
    this.eJ.fill(0);
    for (let r = 0; r < 2; r++) {
      this.eMin[r] = d[o + FMIN + r];
      this.eMax[r] = d[o + FMAX + r];
      const f = Math.max(
        this.eMin[r],
        Math.min(this.eMax[r], d[o + PEN + r] * this.eC[r] + d[o + LAM + r]),
      );
      if (body >= 0 && f !== 0) this.eJ[r * 3 + 2] = body === a ? 1 : -1;
    }
    return 2;
  }
  step() {
    const incoming = captureIncoming(this, 2);
    super.step();
    bounceContacts(this, 2, incoming);
    const pairs = new Map(this.contactPairs.map((p) => [`${p.a},${p.b}`, p]));
    for (
      let c = this.jointCount;
      c < this.jointCount + this.contactCount;
      c++
    ) {
      const pair = pairs.get(
        `${this.info[c * INFO_STRIDE + 1]},${this.info[c * INFO_STRIDE + 2]}`,
      );
      if (pair)
        pair.impulse += Math.abs(this.data[c * CS + LAM]) * this.params.dt;
    }
  }
}
