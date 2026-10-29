import { AvbdScene3D, createSolverPipeline } from "../dist/native.js";
import { contactLifetimesContract } from "./contact-lifetimes-contract.js";
const pipeline = await createSolverPipeline({ backend: "cpu" });
const scene = new AvbdScene3D({ gravity: 0 });
const player = scene.addSphere(1.2, { mass: 0, group: 32, collidesWith: 8 });
const bullet = scene.addSphere(0.2, {
  mass: 1,
  group: 8,
  collidesWith: 32,
  isTrigger: true,
});
const solver = pipeline.createSolver(scene);
try {
  console.log(
    JSON.stringify({
      backend: "cpu",
      ...(await contactLifetimesContract(
        solver,
        solver.bodyIndex(player),
        solver.bodyIndex(bullet),
      )),
    }),
  );
} finally {
  pipeline.destroy();
}
