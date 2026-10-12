/**
 * The 100K-brick impact workload and its interchangeable projectile shapes.
 * Construction uses Z up; the launch direction is +Y. Projectile factories
 * return a separate initial body record for the runtime to upload into the
 * existing projectile slot, keeping the large tower allocated between shots.
 */
import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  sphere,
  hull,
  convexHull,
} from "../../reference/three-avbd/src/avbd3d/shapes.ts";
export function createRookProjectile(kind = "sphere") {
  const s = new Solver(),
    density = 10 / (1.8 * 0.5 * 0.9),
    position = [0, -25, 20.5],
    velocity = [0, 60, 1.4];
  if (kind === "sphere")
    return sphere(s, 3.75, density, 0.5, position, velocity);
  if (kind === "box") {
    const b = new Rigid(s, [5, 5, 5], density, 0.5, position, velocity);
    b.velocityAng.set([1, 2, 0.5]);
    return b;
  }
  const points = [];
  if (kind === "capsule") {
    for (const sign of [-1, 1]) {
      points.push(sign * 4.5, 0, 0);
      for (const [x, r] of [
        [2, 2.5],
        [2 + 2.5 / Math.SQRT2, 2.5 / Math.SQRT2],
      ])
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * 2 * Math.PI;
          points.push(sign * x, r * Math.cos(a), r * Math.sin(a));
        }
    }
  } else if (kind === "cylinder") {
    for (const x of [-3.5, 3.5])
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 2 * Math.PI;
        points.push(x, 2.5 * Math.cos(a), 2.5 * Math.sin(a));
      }
  } else throw Error(`Unknown projectile: ${kind}`);
  const shape = convexHull(points),
    b = hull(s, shape, density, 0.5, position, shape.rotation, velocity);
  b.velocityAng.set([0.6, 0.7, 0.2]);
  return b;
}

export const rookImpactScene = {
  name: "100K Rook Impact",
  gpuOnly: true,
  benchmark: true,
  build(s) {
    s.dt = 1 / 60;
    s.iterations = 4;
    s.gravity = -10;
    const brickDensity = 1 / (1.8 * 0.5 * 0.9);
    new Rigid(s, [1200, 500, 2], 0, 0.65, [0, 0, -1]);
    for (let depth = 0; depth < 20; depth++)
      for (let column = 0; column < 100; column++) {
        const height =
          48 +
          (column < 10 || column >= 90 ? 5 : 0) +
          (Math.floor(column / 5) % 2 === 0 ? 2 : 0);
        for (let row = 0; row < height; row++)
          new Rigid(s, [1.8, 0.5, 0.9], brickDensity, 0.65, [
            (column - 49.5) * 1.85 + (row % 2 ? 0.925 : 0),
            (depth - 9.5) * 0.5,
            0.45 + row * 0.9,
          ]);
      }
    s.bodies.push(createRookProjectile());
  },
};
