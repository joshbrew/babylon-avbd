import { GlCompute } from "../src/webgl/compute.js";
import { GlWorld2D } from "../src/webgl/world2D.js";
import { GlWorld3D } from "../src/webgl/world3D.js";
import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { createSolverPipeline } from "../src/native/pipeline.js";
const check = (v, m) => {
  if (!v) throw Error(m);
};
export async function checkGlWorld(sources) {
  const compute = new GlCompute(
    document
      .createElement("canvas")
      .getContext("webgl2", { antialias: false, depth: false, stencil: false }),
  );
  const pipeline = await createSolverPipeline({ validate3D: false });
  const errors = [];
  pipeline.device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let world, gpu;
  const rows = [];
  const progress = async (stage) => {
    globalThis.__GL_WORLD_PROGRESS__ = stage;
    await new Promise((r) => setTimeout(r, 10));
  };
  try {
    if (!sources.only3D) {
      await progress("Create 2D GPU worlds");
      const scene = new AvbdScene2D({ iterations: 10, gravity: -9.81 });
      scene.addBox([12, 1], { position: [0, -0.5], density: 0, friction: 0.7 });
      for (let i = 0; i < 4; i++)
        scene.addBox([0.8, 0.8], {
          position: [0, 0.4 + i * 0.81],
          friction: 0.7,
        });
      scene.addBox([0.8, 0.8], { position: [3, 2], friction: 0.7 });
      gpu = scene.createSolver(pipeline);
      const bodies = await gpu.readBodies(),
        joints = await gpu.readJoints();
      world = await GlWorld2D.create(compute, {
        bodies,
        joints,
        info: scene.topology.info.slice(0, gpu.jointCount * 4),
        params: { ...gpu.params, flags: 2 },
        contactMath: sources.contact.glsl,
        solveMath: sources.solve.glsl,
        colorCap: 12,
        colorRounds: 32,
        neighborCapacity: 15,
      });
      for (let step = 0; step < 180; step++) {
        world.step();
        gpu.step();
        if (step % 15 === 14) {
          await progress(`2D settling ${step + 1}/180`);
          const status = await world.readStatus();
          check(
            status.problems === 0,
            `GPU graph failed at step ${step + 1}: ${JSON.stringify(status)}`,
          );
        }
      }
      const [gl, wg] = await Promise.all([
        world.readBodies(),
        gpu.readBodies(),
      ]);
      check(gl.every(Number.isFinite), "WebGL2 produced nonfinite body state");
      let maxDifference = 0;
      for (let i = 1; i < world.bodyCount; i++) {
        const o = i * 24;
        check(
          gl[o + 1] > 0.32,
          `Body ${i} fell through the floor (${gl[o + 1]})`,
        );
        check(
          Math.abs(gl[o + 13]) < 0.2,
          `Body ${i} did not settle (${gl[o + 13]})`,
        );
        maxDifference = Math.max(
          maxDifference,
          Math.hypot(gl[o] - wg[o], gl[o + 1] - wg[o + 1]),
        );
      }
      check(
        maxDifference < 0.08,
        `Settled WebGL2/WebGPU positions differ by ${maxDifference}`,
      );
      rows.push({
        scene: "2D box stack and falling box",
        steps: 180,
        bodyCount: world.bodyCount,
        maxPositionDifference: maxDifference,
        status: await world.readStatus(),
        passed: true,
      });
      world.destroy();
      world = null;
      gpu.destroy();
      gpu = null;
    }
    await progress("Create 3D GPU worlds");
    const scene3 = new AvbdScene3D({ iterations: 10 });
    scene3.addBox([12, 1, 12], {
      position: [0, -0.5, 0],
      density: 0,
      friction: 0.7,
    });
    for (let i = 0; i < 3; i++)
      scene3.addBox([0.8, 0.8, 0.8], {
        position: [0, 0.4 + i * 0.81, 0],
        friction: 0.7,
      });
    scene3.addSphere(0.4, { position: [3, 2, 0], friction: 0.7 });
    scene3.addCapsule(0.25, 1.2, {
      position: [-3, 2, 0],
      friction: 0.7,
      rotation: [0, 0, Math.sin(0.2), Math.cos(0.2)],
    });
    const anchored = [];
    if (sources.joints) {
      const link = scene3.addBox([0.3, 1, 0.3], { position: [-4, 4, 3] });
      anchored.push(link);
      scene3.addJoint(null, link, [-4, 4.5, 3], [0, 0.5, 0]);
      const weight = scene3.addSphere(0.3, { position: [-4, 3.1, 3] });
      anchored.push(weight);
      scene3.addJoint(link, weight, [0, -0.5, 0], [0, 0.4, 0]);
      const welded = scene3.addBox([0.6, 0.4, 0.3], {
        position: [0, 4, 3],
        rotation: [0, Math.sin(0.2), 0, Math.cos(0.2)],
      });
      anchored.push(welded);
      scene3.addJoint(null, welded, [0, 4, 3], [0, 0, 0], {
        angularStiffness: Infinity,
      });
      const hinge = scene3.addBox([1, 0.3, 0.3], { position: [4, 4, 3] });
      anchored.push(hinge);
      scene3.addHinge(null, hinge, {
        anchorA: [4, 4, 3],
        axisA: [0, 1, 0],
        axisB: [0, 1, 0],
        minAngle: -0.6,
        maxAngle: 0.6,
        motor: { speed: 1, maxTorque: 5 },
      });
      const pin = scene3.addSphere(0.1, { position: [2, 4, 3], density: 0 }),
        spring = scene3.addSphere(0.15, { position: [2, 3, 3] });
      anchored.push(spring);
      scene3.addSpring(pin, spring, [0, 0, 0], [0, 0, 0], {
        stiffness: 1000,
        rest: 1,
        breakStrain: 2,
      });
    }
    if (sources.hulls) {
      const vertices = Array.from({ length: 8 }, (_, i) => [
        i & 1 ? 0.4 : -0.4,
        i & 2 ? 0.4 : -0.4,
        i & 4 ? 0.4 : -0.4,
      ]).flat();
      scene3.addHull(vertices, { position: [4.5, 3, 0] });
      scene3.addHull(vertices, { position: [-3, 0.4, 0] });
      scene3.addHull(vertices, { position: [3, 0.4, 0] });
    }
    gpu = scene3.createSolver(pipeline);
    const hulls = sources.hulls
      ? new Uint32Array(await gpu.read(gpu.hullStorage, gpu.hullStorage.size))
      : undefined;
    const anchoredIds = new Set(
      anchored.map((b) => gpu.gpuIndex(scene3.ref.bodies.indexOf(b))),
    );
    world = await GlWorld3D.create(compute, {
      bodies: await gpu.readBodies(),
      joints: await gpu.readJoints(),
      info: gpu.info.slice(0, gpu.jointCount * 4),
      hulls,
      params: { ...gpu.params, flags: 26 },
      contactMath: sources.contact3D.glsl,
      solveMath: sources.solve3D.glsl,
      colorCap: 12,
      colorRounds: 32,
      neighborCapacity: 15,
    });
    for (let step = 0; step < 180; step++) {
      world.step();
      gpu.step();
      if (step % 15 === 14) {
        await progress(`3D settling ${step + 1}/180`);
        const status = await world.readStatus();
        check(
          status.problems === 0,
          `3D GPU graph failed: ${JSON.stringify(status)}`,
        );
      }
    }
    const [gl3, wg3] = await Promise.all([
      world.readBodies(),
      gpu.readBodies(),
    ]);
    check(
      gl3.every(Number.isFinite),
      "3D WebGL2 produced nonfinite body state",
    );
    let difference3 = 0;
    for (let i = 0; i < world.bodyCount; i++)
      if (gl3[i * 40 + 19] > 0) {
        const o = i * 40;
        check(
          gl3[o + 1] > 0.19,
          `3D body ${i} fell through floor (${gl3[o + 1]})`,
        );
        if (!anchoredIds.has(i))
          check(
            Math.abs(gl3[o + 33]) < 0.25,
            `3D body ${i} did not settle (${gl3[o + 33]})`,
          );
        difference3 = Math.max(
          difference3,
          Math.hypot(
            gl3[o] - wg3[o],
            gl3[o + 1] - wg3[o + 1],
            gl3[o + 2] - wg3[o + 2],
          ),
        );
      }
    check(
      difference3 < 0.3,
      `3D settled GPU positions differ by ${difference3}`,
    );
    rows.push({
      scene: "3D stack, sphere and rotating capsule",
      hulls: !!sources.hulls,
      joints: world.jointCount,
      steps: 180,
      bodyCount: world.bodyCount,
      maxPositionDifference: difference3,
      status: await world.readStatus(),
      passed: true,
    });
    return { passed: true, rows, errors };
  } finally {
    world?.destroy();
    gpu?.destroy();
    pipeline.destroy();
    compute.destroy();
  }
}
