// MIT: adapted from the pinned three-avbd SoA CPU solver; see reference/three-avbd/LICENSE.
import {
  CS,
  INFO_STRIDE,
  T_CONTACT,
  STIFF,
  FMIN,
  FMAX,
  FRAC,
  RA,
  RB,
  P0,
  P1,
  P2,
  PEN,
  LAM,
  STICK,
  C0,
  NEAREST_FRACTION,
} from "../../../reference/three-avbd/src/avbd2d/soa/solver.ts";
import { PAIR_SHIFT } from "../../../reference/three-avbd/src/avbd2d/soa/broadphase.ts";
import {
  CONTACT_OUT_STRIDE,
  OUT_FEATURE,
  OUT_RA,
  OUT_RB,
  OUT_N,
} from "../../../reference/three-avbd/src/avbd2d/soa/collide.ts";
import { COLLISION_MARGIN } from "../../../reference/three-avbd/src/avbd2d/ref/body.ts";
const rot = (a, x, y) => [
  Math.cos(a) * x - Math.sin(a) * y,
  Math.sin(a) * x + Math.cos(a) * y,
];
export const cpuNarrowphase2D = function () {
  const { pose, shape, props } = this;
  const pairs = this.broadphase.pairs;
  const out = this.contactOut;

  for (let k = 0; k < this.broadphase.pairCount; k++) {
    const key = pairs[k];
    const a = Math.floor(key / PAIR_SHIFT);
    const b = key - a * PAIR_SHIFT;
    const count = this.collideBodies(a, b, out);
    if (count === 0) continue;

    // Last step's contacts for this pair (sorted by key)
    let lo = 0;
    let hi = this.prevCount;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.prevKeys[mid] < key) lo = mid + 1;
      else hi = mid;
    }
    const prevFirst = lo;

    const friction = Math.sqrt(props[a * 4] * props[b * 4]);
    for (let i = 0; i < count; i++) {
      const c = this.jointCount + this.contactCount++;
      this.info = this.grow(this.info, (c + 1) * INFO_STRIDE);
      this.data = this.grow(this.data, (c + 1) * CS);
      const d = this.data;
      const o = c * CS;
      const w = i * CONTACT_OUT_STRIDE;
      const feature = out[w + OUT_FEATURE];
      this.info.set([T_CONTACT, a, b, feature], c * INFO_STRIDE);

      d.fill(0, o, o + CS);
      d[o + STIFF] = d[o + STIFF + 1] = Infinity;
      d[o + FMIN] = -Infinity;
      d[o + FMAX] = 0;
      d[o + FRAC] = d[o + FRAC + 1] = Infinity;
      d[o + RA] = out[w + OUT_RA];
      d[o + RA + 1] = out[w + OUT_RA + 1];
      d[o + RB] = out[w + OUT_RB];
      d[o + RB + 1] = out[w + OUT_RB + 1];
      d[o + P0] = friction;
      d[o + P1] = out[w + OUT_N];
      d[o + P2] = out[w + OUT_N + 1];

      // Warm start from the matching contact (same pair, same feature) of last step; with
      // matchNearest, fall back to the pair's contact nearest in A-local anchor position
      let match = -1;
      for (
        let j = prevFirst;
        j < this.prevCount && this.prevKeys[j] === key;
        j++
      ) {
        if (this.prevInfo[j * INFO_STRIDE + 3] === feature) match = j;
      }
      if (match < 0 && this.params.matchNearest) {
        let best =
          NEAREST_FRACTION *
          Math.min(
            shape[a * 4],
            shape[a * 4 + 1],
            shape[b * 4],
            shape[b * 4 + 1],
          );
        for (
          let j = prevFirst;
          j < this.prevCount && this.prevKeys[j] === key;
          j++
        ) {
          const dist = Math.hypot(
            this.prevData[j * CS + RA] - d[o + RA],
            this.prevData[j * CS + RA + 1] - d[o + RA + 1],
          );
          if (dist <= best) {
            best = dist;
            match = j;
          }
        }
      }
      if (match >= 0) {
        const po = match * CS;
        d[o + PEN] = this.prevData[po + PEN];
        d[o + PEN + 1] = this.prevData[po + PEN + 1];
        d[o + LAM] = this.prevData[po + LAM];
        d[o + LAM + 1] = this.prevData[po + LAM + 1];
        // Static friction last step: keep the old anchors
        if (this.prevData[po + STICK]) {
          d[o + RA] = this.prevData[po + RA];
          d[o + RA + 1] = this.prevData[po + RA + 1];
          d[o + RB] = this.prevData[po + RB];
          d[o + RB + 1] = this.prevData[po + RB + 1];
        }
      }

      // C(x-) in the contact basis (normal, tangent)
      const [rAx, rAy] = rot(pose[a * 4 + 2], d[o + RA], d[o + RA + 1]);
      const [rBx, rBy] = rot(pose[b * 4 + 2], d[o + RB], d[o + RB + 1]);
      const nx = d[o + P1];
      const ny = d[o + P2];
      const dx = pose[a * 4] + rAx - pose[b * 4] - rBx;
      const dy = pose[a * 4 + 1] + rAy - pose[b * 4 + 1] - rBy;
      d[o + C0] = nx * dx + ny * dy + COLLISION_MARGIN;
      d[o + C0 + 1] = ny * dx - nx * dy;
    }
  }
};
