import { createExperimentalWebglPipeline } from "../../../src/webgl/pipeline.js";
import { SoaSim } from "../../../reference/three-avbd/src/avbd2d/sim.ts";
import { Joint } from "../../../reference/three-avbd/src/avbd3d/ref/forces.ts";

/** Demo drawing downloads are separate from the GPU-only physics step. */
export async function createWebglDemoWorld(built) {
  const pipeline = await createExperimentalWebglPipeline(),
    dimension = built.def.dimension;
  try {
    const scene =
      built.scene ??
      (dimension === 3
        ? { ref: built.solver, up: [0, 0, 1], points: !!built.tearable }
        : { topology: built.sim.solver });
    if (!scene.assertEditable)
      scene.assertEditable = function () {
        if (this.created) throw Error("Scene already initialized");
      };
    const world = pipeline.createSolver(scene);
    Object.assign(world.params, built.gpuParams);
    if (dimension === 3) {
      world.solver.visualSource = built.solver;
      for (const b of world.solver.bodies)
        b.cpuStart = Array.from(b.positionLin);
      world.solver.nativeWorld = world;
      world.createDrag = (body, anchor, point) => {
        const force = new Joint(
            world.solver,
            null,
            body,
            point,
            anchor,
            1000,
            0,
          ),
          slot = world.constraints.length;
        world.constraints.push(force);
        world.rebuild();
        return {
          move: (p) => world.setWorldAnchor(slot, p),
          destroy: () => world.disableConstraint(slot),
        };
      };
    } else {
      world.sim = new SoaSim(world.solver, "WebGL2 GPU AVBD");
      let drag = -1,
        body = -1;
      world.sim.startDrag = (id, local, point) => {
        world.sim.endDrag();
        drag = world.appendJoint(-1, id, point, local, [1000, 1000, 0]);
        body = id;
      };
      world.sim.moveDrag = (x, y) => {
        if (drag >= 0) world.setWorldAnchor(drag, [x, y]);
      };
      world.sim.endDrag = () => {
        if (drag >= 0) world.disableConstraint(drag);
        drag = body = -1;
      };
      Object.defineProperty(world.sim, "dragBody", { get: () => body });
      world.sim.addBox = (size, density, friction, pose, velocity) =>
        world.addBox(size, {
          density,
          friction,
          position: pose.slice(0, 2),
          angle: pose[2],
          velocity,
        });
    }
    world.refreshForDrawing = async () => {
      const data = await world.refreshCpuPoses();
      if (dimension === 2)
        for (let i = 0; i < world.bodyCount; i++)
          world.solver.velocity.set(
            data.subarray(i * 24 + 12, i * 24 + 16),
            i * 4,
          );
      else {
        const joints = await world.readJoints();
        world.constraints.forEach((f, i) => {
          f.broken = joints[i * 32 + 3] === 0 && joints[i * 32 + 7] === 0;
        });
      }
    };
    return { world, pipeline };
  } catch (error) {
    pipeline.destroy();
    throw error;
  }
}
