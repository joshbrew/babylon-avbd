/**
 * Convex-shape collision workload. Hull generation is scene setup work;
 * the live solver receives cooked shapes and body poses. The renderer must
 * draw each hull in its collision frame to keep contact locations aligned.
 */
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  sphere,
  hull,
  convexHull,
} from "../../reference/three-avbd/src/avbd3d/shapes.ts";
export const convexHullScene = {
  name: "Convex Hulls",
  gpuOnly: true,
  build(s) {
    new Rigid(s, [30, 30, 1], 0, 0.7, [0, 0, -0.5]);
    const shapes = [
      convexHull([-1, -1, -1, 1, -1, -1, 0, 1, -1, 0, 0, 1]),
      convexHull([
        -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1,
      ]),
      convexHull([1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1]),
    ];
    for (let i = 0; i < 18; i++) {
      const b = hull(s, shapes[i % 3], 1, 0.6, [
        ((i % 6) - 2.5) * 2.1,
        0,
        Math.floor(i / 6) * 2.8 + 1.8,
      ]);
      b.velocityAng.set([0.2, 0.3, 0.1]);
    }
    sphere(s, 0.7, 3, 0.5, [0, -7, 3], [0, 12, 0]);
  },
};
