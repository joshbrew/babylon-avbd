// Public library entry. Demo pages and experimental solvers are not imported.
export {
  AvbdPhysics,
  AvbdPhysicsAggregate,
  AvbdPhysicsBody,
  AvbdShapeType,
} from "./babylon/babylonAvbd.js";
export {
  AvbdPhysicsConstraint,
  AvbdPhysicsHinge,
} from "./babylon/constraints.js";
export { AvbdScene3D, AvbdScene2D } from "./native/scenes.js";
export { createWebGPUDevice, prepareWebGPUDevice3D } from "./gpu/device.js";
export { createSolverPipeline } from "./native/pipeline.js";
export { cookHeightfield, cookStaticMesh } from "./native/terrain.js";
export * from "./utilities.js";
