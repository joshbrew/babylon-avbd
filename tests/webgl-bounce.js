import { GlCompute } from "../src/webgl/compute.js";
import { GlWorld2D } from "../src/webgl/world2D.js";
import { GlWorld3D } from "../src/webgl/world3D.js";
import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { createSolverPipeline } from "../src/native/pipeline.js";
const check = (v, m) => {
  if (!v) throw Error(m);
};
export async function checkGlBounce(sources) {
  const compute = new GlCompute(
      document
        .createElement("canvas")
        .getContext("webgl2", {
          antialias: false,
          depth: false,
          stencil: false,
        }),
    ),
    pipeline = await createSolverPipeline({ validate3D: false }),
    rows = [],
    errors = [];
  pipeline.device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let world, gpu;
  try {
    for (const dimension of [2, 3]) {
      globalThis.__GL_BOUNCE_PROGRESS__ = `${dimension}D restitution setup`;
      const scene =
        dimension === 2
          ? new AvbdScene2D({ iterations: 10 })
          : new AvbdScene3D({ iterations: 10 });
      scene.addBox(dimension === 2 ? [10, 1] : [10, 1, 10], {
        position: dimension === 2 ? [0, -0.5] : [0, -0.5, 0],
        density: 0,
      });
      if (dimension === 2)
        scene.addCircle(0.3, {
          position: [0, 1],
          velocity: [0, -5, 0],
          restitution: 0.8,
        });
      else
        scene.addSphere(0.3, {
          position: [0, 1, 0],
          velocity: [0, -5, 0],
          restitution: 0.8,
        });
      gpu = scene.createSolver(pipeline);
      const bodies = await gpu.readBodies(),
        id = dimension === 2 ? 1 : gpu.gpuIndex(1);
      const geometry =
        dimension === 2
          ? new Float32Array([0, 0, 0, 0, 1, 0.3, 0, 0])
          : undefined;
      const Type = dimension === 2 ? GlWorld2D : GlWorld3D;
      world = await Type.create(compute, {
        bodies,
        geometry,
        params: { ...gpu.params, flags: dimension === 2 ? 2 : 26 },
        contactMath: sources[dimension].contact.glsl,
        solveMath: sources[dimension].solve.glsl,
        colorCap: 4,
        colorRounds: 8,
        neighborCapacity: 15,
      });
      const restitution = await world.prepareRestitution(
        sources[dimension].bounce.glsl,
      );
      restitution.set(id, 0.8);
      let upward = 0,
        maxDifference = 0;
      for (let step = 0; step < 60; step++) {
        world.step();
        gpu.step();
        if (step % 5 === 4) {
          globalThis.__GL_BOUNCE_PROGRESS__ = `${dimension}D rebound ${step + 1}/60`;
          const [actual, expected] = await Promise.all([
              world.readBodies(),
              gpu.readBodies(),
            ]),
            stride = dimension === 2 ? 24 : 40,
            vel = dimension === 2 ? 13 : 33,
            o = id * stride;
          check(
            actual.every(Number.isFinite),
            "Restitution produced nonfinite state",
          );
          upward = Math.max(upward, actual[o + vel]);
          maxDifference = Math.max(
            maxDifference,
            Math.abs(actual[o + 1] - expected[o + 1]),
          );
          check(
            (await world.readStatus()).problems === 0,
            "Restitution graph failure",
          );
        }
      }
      check(upward > 2, `${dimension}D restitution did not bounce (${upward})`);
      check(
        maxDifference < 0.04,
        `${dimension}D restitution differs from WebGPU (${maxDifference})`,
      );
      rows.push({
        dimension,
        steps: 60,
        upwardSpeed: upward,
        maxPositionDifference: maxDifference,
        passed: true,
      });
      world.destroy();
      world = null;
      gpu.destroy();
      gpu = null;
    }
    return { passed: true, rows, errors };
  } finally {
    world?.destroy();
    gpu?.destroy();
    pipeline.destroy();
    compute.destroy();
  }
}
