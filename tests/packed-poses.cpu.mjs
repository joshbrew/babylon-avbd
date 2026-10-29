import { AvbdScene3D, createSolverPipeline } from "../dist/native.js";
import { packedPoseContract } from "./packed-poses-contract.js";
const pipeline = await createSolverPipeline({ backend: "cpu" });
const scene = new AvbdScene3D({ gravity: 0 });
const refs = Array.from({ length: 4 }, (_, i) =>
  scene.addSphere(0.5, {
    position: [i * 3, 0, 0],
    mass: 2,
    group: 4,
    collidesWith: 2,
    isTrigger: i === 1,
  }),
);
const solver = pipeline.createSolver(scene);
try {
  const ids = Uint32Array.from(refs, (body) => solver.bodyIndex(body)).sort();
  console.log(
    JSON.stringify({
      backend: "cpu",
      ...(await packedPoseContract(solver, ids)),
    }),
  );
} finally {
  pipeline.destroy();
}
