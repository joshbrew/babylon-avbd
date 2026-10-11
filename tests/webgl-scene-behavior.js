import { buildCanonicalScene } from "../demo/canonicalScenes.js";
import { createWebglDemoWorld } from "../demo/webglWorld.js";
import { AvbdScene2D } from "../src/index.js";
import { createExperimentalWebglPipeline } from "../src/webgl/pipeline.js";

const check = (condition, message) => {
  if (!condition) throw Error(message);
};
export async function checkGlSceneBehavior() {
  const rows = [],
    pipeline = await createExperimentalWebglPipeline();
  try {
    const scene = new AvbdScene2D({ gravity: 0 }),
      a = scene.addBox([1, 1]),
      b = scene.addBox([1, 1], { position: [0.1, 0] });
    scene.topology.addIgnoreCollision(a, b);
    const c = scene.addBox([1, 1], { position: [3, 0] }),
      d = scene.addBox([1, 1], { position: [3.1, 0] }),
      joint = scene.addJoint(c, d);
    const world = scene.createSolver(pipeline);
    world.step();
    const counters = await world.readCounters();
    check(
      counters.pairs === 0 && counters.contacts === 0,
      "Explicit collision exclusion was ignored",
    );
    rows.push({
      scene: "explicit 2D collision exclusion",
      counters,
      passed: true,
    });
    joint.dispose();
    world.step();
    const released = await world.readCounters();
    check(
      released.contacts > 0,
      "Releasing a joint did not restore collisions",
    );
    rows.push({
      scene: "joint release with explicit exclusions",
      counters: released,
      passed: true,
    });
    world.destroy();
  } finally {
    pipeline.destroy();
  }
  for (const scene of [
    "2d-joint-grid",
    "2d-stack",
    "3d-stack",
    "3d-tearable-cloth",
  ]) {
    globalThis.__GL_BEHAVIOR_PROGRESS__ = scene;
    const built = buildCanonicalScene(scene, "gpu"),
      { world, pipeline } = await createWebglDemoWorld(built);
    try {
      const ids = Array.from({ length: world.bodyCount }, (_, i) => i),
        before = await world.readSelectedBodies(ids, { posesOnly: true });
      const counters = [];
      for (let step = 0; step < 60; step++) {
        world.step();
        if (step % 10 === 9) {
          const status = await world.readCounters();
          check(
            !status.overflow && !status.clashes,
            `${scene}, step ${step + 1}: ${JSON.stringify(status)}`,
          );
          counters.push(status);
        }
      }
      const poses = await world.readSelectedBodies(ids, { posesOnly: true });
      check(poses.every(Number.isFinite), `${scene}: nonfinite state`);
      const stride = world.dimension === 3 ? 8 : 4;
      let displacement = 0;
      for (let i = 0; i < world.bodyCount; i++)
        for (let axis = 0; axis < world.dimension; axis++)
          displacement = Math.max(
            displacement,
            Math.abs(poses[i * stride + axis] - before[i * stride + axis]),
          );
      check(displacement > 1e-4, `${scene}: physics did not advance`);
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        `${scene}: WebGL2 error`,
      );
      rows.push({ scene, steps: 60, displacement, counters, passed: true });
    } finally {
      world.destroy();
      pipeline.destroy();
    }
  }
  return { passed: true, rows };
}
