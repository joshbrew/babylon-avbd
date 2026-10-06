import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import { assert, close } from "./helpers/gpu.js";

export async function solverSelectionGpuTests(device, test) {
  await test("GPU solver mode switches preserve live state and moving-platform contacts", async () => {
    const ref = new Solver();
    const floor = new Rigid(ref, [30, 30, 2], 0, 0.7, [0, 0, -1]);
    floor.velocityLin[0] = 0.1;
    for (let i = 0; i < 6; i++) {
      const body = new Rigid(ref, [1, 1, 1], 1, 0.7, [2 * i, 0, 0.5]);
      body.velocityAng.set([0.02, -0.03, 0.01]);
    }
    const gpu = new AppGpuSolver3D(device, ref, { spatialSort: false });
    try {
      for (const mode of [
        "optimized",
        "points",
        "standard",
        "auto",
        "points",
        "auto",
      ]) {
        const before = await gpu.readBodies();
        const buffer = gpu.bodyBuffer,
          contacts = gpu.contactBuffer;
        gpu.setSolverMode(mode);
        const after = await gpu.readBodies();
        assert(
          gpu.bodyBuffer === buffer && gpu.contactBuffer === contacts,
          "switch retains all state buffers",
        );
        assert(
          after.every((v, i) => v === before[i]),
          "switch itself never resets poses, forces or velocities",
        );
        for (let step = 0; step < 30; step++) gpu.step();
        const counters = await gpu.readCounters(),
          bodies = await gpu.readBodies();
        assert(
          !counters.overflow && !counters.clashes,
          "switch maintains complete independent contacts",
        );
        assert(bodies.every(Number.isFinite), "all body fields stay finite");
        for (let i = 1; i < 7; i++)
          close(
            bodies[i * 40 + 2],
            0.5,
            0.06,
            "box stays supported by moving platform",
          );
      }
      assert(
        gpu.solverDecision.selected === "standard",
        "auto restores small-scene policy",
      );
      assert(
        gpu.solvePipelineCache.size === 3,
        "switches reuse the three compiled implementations",
      );
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU automatic solver reselects for appended bodies and released or reused joints", async () => {
    const ref = new Solver();
    ref.gravity = 0;
    for (let i = 0; i < 49_999; i++)
      sphere(ref, 0.2, 1, 0.5, [2 * (i % 250), 2 * Math.floor(i / 250), 10]);
    const gpu = new AppGpuSolver3D(device, ref, {
      bodyCapacity: 50_000,
      spatialSort: false,
      broadphase: "grid",
    });
    try {
      gpu.params.gravity = 0;
      assert(
        gpu.solverDecision.selected === "standard",
        "below threshold uses standard",
      );
      const added = sphere(ref, 0.2, 1, 0.5, [500, 400, 10]);
      gpu.addBody(added);
      gpu.step();
      assert(
        gpu.solverDecision.selected === "optimized",
        "crossing threshold selects optimized",
      );
      const slot = gpu.appendJoint(0, 1, [1, 0, 0], [-1, 0, 0], 1000, 1000);
      gpu.step();
      assert(
        gpu.solverDecision.selected === "standard",
        "a joint changes automatic choice",
      );
      gpu.releaseJoints([slot]);
      gpu.step();
      assert(
        gpu.solverDecision.selected === "optimized",
        "released joints no longer block optimized",
      );
      gpu.appendJoints([{ a: 0, b: 1, rA: [1, 0, 0], rB: [-1, 0, 0] }], 1000);
      gpu.step();
      assert(
        gpu.solverDecision.selected === "standard",
        "reused joint slots count as connected load",
      );
      const counters = await gpu.readCounters();
      assert(
        !counters.overflow && !counters.clashes,
        "live-load changes solve safely",
      );
      assert(
        (await gpu.readBodies()).every(Number.isFinite),
        "state stays finite",
      );
    } finally {
      gpu.destroy();
    }
  });
}
