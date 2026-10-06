import { AvbdScene2D } from "../src/native/scenes.js";
import { SoaSim } from "../reference/three-avbd/src/avbd2d/sim.ts";
export const shapeScene2D = {
  id: "2d-mixed-shapes",
  name: "Mixed 2D colliders",
  dimension: 2,
  gpuOnly: true,
  shapes: true,
  stepsPerFrame: 2,
  description:
    "Circles, capsules, boxes and convex polygons fall onto line ramps and an infinite floor. Collisions, rotation and friction run on the GPU. Drag a body to move it, or right-click to add a box.",
};
export function buildShapeScene2D(def) {
  const scene = new AvbdScene2D({
    timeStep: 1 / 120,
    iterations: 10,
    gravity: -10,
  });
  scene.addPlane();
  scene.addPlane([1, 0], -14);
  scene.addPlane([-1, 0], -14);
  scene.addSegment([-13, 7], [-4, 4]);
  scene.addSegment([4, 4], [13, 7]);
  scene.addSegment([-3, 2], [3, 2], { radius: 0.18 });
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 12; col++) {
      const options = {
        position: [(col - 5.5) * 2.1, 8.5 + row * 1.8],
        angle: (((col + row) % 5) - 0.5) * 0.16,
        friction: 0.5,
      };
      if ((row + col) % 4 === 0) scene.addCircle(0.48, options);
      else if ((row + col) % 4 === 1) scene.addCapsule(0.28, 1.5, options);
      else if ((row + col) % 4 === 2) scene.addBox([0.95, 0.85], options);
      else
        scene.addHull(
          [
            [-0.6, -0.4],
            [0.45, -0.5],
            [0.7, 0.2],
            [0, 0.65],
            [-0.55, 0.3],
          ],
          options,
        );
    }
  return {
    def,
    sim: new SoaSim(scene.topology, "GPU shapes"),
    gpuParams: { dt: 1 / 120, iterations: 10, gravity: -10 },
    gpuOptions2D: { bodyCapacity: scene.bodyCount + 4096 },
  };
}
