import {
  AvbdScene2D,
  AvbdScene3D,
  createSolverPipeline,
} from "../dist/native.js";
import { queryMasksContract } from "./query-masks-contract.js";
const pipeline = await createSolverPipeline({ backend: "cpu" });
try {
  for (const dimension of [2, 3]) {
    const scene =
      dimension === 3
        ? new AvbdScene3D({ gravity: 0 })
        : new AvbdScene2D({ gravity: 0 });
    const add = (x, collidesWith) =>
      dimension === 3
        ? scene.addSphere(0.5, {
            position: [x, 0, 0],
            mass: 0,
            group: 4,
            collidesWith,
          })
        : scene.addCircle(0.5, {
            position: [x, 0],
            density: 0,
            group: 4,
            collidesWith,
          });
    const refs = {
      marker: add(-4, 0),
      friendlyOnly: add(0, 2),
      hostileOnly: add(4, 8),
    };
    const solver = pipeline.createSolver(scene);
    try {
      console.log(
        JSON.stringify({
          backend: "cpu",
          dimension,
          ...(await queryMasksContract(
            solver,
            Object.fromEntries(
              Object.entries(refs).map(([key, ref]) => [
                key,
                solver.bodyIndex(ref),
              ]),
            ),
            dimension,
          )),
        }),
      );
    } finally {
      solver.destroy();
    }
  }
} finally {
  pipeline.destroy();
}
