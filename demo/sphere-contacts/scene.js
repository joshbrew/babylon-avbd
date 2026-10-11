import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  sphere,
  hull,
  convexHull,
} from "../../reference/three-avbd/src/avbd3d/shapes.ts";
export const sphereContactScene = {
  name: "Sphere Contacts",
  gpuOnly: true,
  build(s) {
    new Rigid(s, [30, 30, 1], 0, 0.7, [0, 0, -0.5]);
    for (let z = 0; z < 5; z++)
      for (let x = 0; x < 5; x++)
        sphere(s, 0.5, 1, 0.6, [x * 1.15 - 2.3, 0, z * 1.2 + 0.6]);
    new Rigid(s, [2, 2, 2], 1, 0.6, [0, 0, 9], [1, 0, 0]);
  },
};
