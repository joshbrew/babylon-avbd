import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { GpuSolver3D } from "../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import { Joint } from "../reference/three-avbd/src/avbd3d/ref/forces.ts";
import {
  projectedContactSolve,
  pointLanesContactSolve,
} from "../src/gpu/gpuSolverKernels.js";
import { assert, close } from "./helpers/gpu.js";

const make = (contacts) => {
  const s = new Solver();
  if (contacts) {
    const ground = new Rigid(s, [80, 80, 2], 0, 0.7, [0, 0, -1]);
    ground.velocityLin.set([0.15, -0.08, 0]);
    ground.velocityAng.set([0, 0, 0.02]);
  }
  for (let i = 0; i < 8; i++) {
    const position = [3 * (i % 4), 3 * Math.floor(i / 4), contacts ? 0.5 : 10];
    const b =
      i % 2
        ? sphere(s, 0.5, 1 + i, 0.7, position)
        : new Rigid(s, [1, 1, 1], 1 + i, 0.7, position);
    b.velocityLin.set([0.1, -0.2, contacts ? 0 : 0.3]);
    b.velocityAng.set([0.01, -0.02, 0.03]);
  }
  return s;
};
export async function contactSchedulingGpuTests(device, test) {
  await test("GPU cached adjacency preserves short and long contact lists and joints", async () => {
    const scene = () => {
      const s = make(true);
      const slab = new Rigid(s, [12, 12, 1], 100, 0.7, [0, 0, 2]);
      for (let i = 0; i < 36; i++)
        new Rigid(s, [1, 1, 1], 1, 0.7, [
          ((i % 6) - 2.5) * 1.5,
          (Math.floor(i / 6) - 2.5) * 1.5,
          3,
        ]);
      new Joint(s, s.bodies[1], slab, [0, 0, 0], [-4, 0, -1.5], 1000, 1000);
      return s;
    };
    const worlds = [false, true].map(
      (cacheAdjacencyKeys) =>
        new AppGpuSolver3D(device, scene(), {
          cacheAdjacencyKeys,
          spatialSort: false,
          colorRounds: 32,
          capacity: { colors: 32 },
        }),
    );
    try {
      for (let step = 0; step < 120; step++) {
        for (const gpu of worlds) gpu.step();
        const counters = await Promise.all(
          worlds.map((gpu) => gpu.readCounters()),
        );
        assert(
          counters.every((c) => !c.overflow && !c.clashes),
          "complete sorted topology",
        );
        if (step % 10 && step !== 119) continue;
        const states = await Promise.all(worlds.map((gpu) => gpu.readBodies()));
        for (let word = 0; word < states[0].length; word++)
          close(
            states[1][word],
            states[0][word],
            1e-6,
            `cached adjacency step ${step}, word ${word}`,
          );
        const joints = await Promise.all(worlds.map((gpu) => gpu.readJoints()));
        for (let word = 0; word < joints[0].length; word++)
          close(
            joints[1][word],
            joints[0][word],
            1e-6,
            `cached joint word ${word}`,
          );
      }
    } finally {
      worlds.forEach((gpu) => gpu.destroy());
    }
  });
  await test("GPU step protection leaves valid physics unchanged", async () => {
    const base = new GpuSolver3D(device, make(true), { spatialSort: false }),
      safe = new AppGpuSolver3D(device, make(true), { spatialSort: false });
    try {
      for (let step = 0; step < 120; step++) {
        base.step();
        safe.step();
        if (step % 10 && step !== 119) continue;
        const states = await Promise.all([
          base.readBodies(),
          safe.readBodies(),
        ]);
        for (let word = 0; word < states[0].length; word++)
          close(
            states[1][word],
            states[0][word],
            1e-6,
            `valid protected step ${step}, word ${word}`,
          );
      }
    } finally {
      base.destroy();
      safe.destroy();
    }
  });
  for (const failure of ["overflow", "clashes"])
    await test(`GPU ${failure} holds poses, velocities and joints until capacity recovers`, async () => {
      const s = new Solver();
      new Rigid(s, [80, 80, 2], 0, 0.7, [0, 0, -1]);
      const a = new Rigid(s, [1, 1, 1], 1, 0.7, [0, 0, 0.5]);
      const b = new Rigid(s, [1, 1, 1], 1, 0.7, [0, 0, 1.5]);
      new Joint(s, a, b, [0, 0, 0.5], [0, 0, -0.5], 1000, 1000);
      a.velocityLin[0] = 0.1;
      b.velocityAng[2] = 0.1;
      const gpu = new AppGpuSolver3D(device, s, {
        spatialSort: false,
        colorRounds: 32,
      });
      try {
        const before = await gpu.readBodies(),
          joints = await gpu.readJoints();
        const capacity = gpu.contactCapacity;
        if (failure === "overflow") gpu.contactCapacity = 1;
        else {
          gpu.colorCap = 1;
          gpu.colorRounds = 2;
        }
        gpu.step();
        const counters = await gpu.readCounters();
        assert(counters[failure] > 0, `forced ${failure} is reported`);
        const held = await gpu.readBodies(),
          heldJoints = await gpu.readJoints();
        for (let i = 0; i < gpu.bodyCount; i++)
          for (const field of [
            0, 1, 2, 3, 4, 5, 6, 7, 32, 33, 34, 35, 36, 37, 38, 39,
          ])
            assert(
              held[i * 40 + field] === before[i * 40 + field],
              `held body ${i}, field ${field}`,
            );
        assert(
          heldJoints.every((value, i) => value === joints[i]),
          "invalid step does not warm or update joint forces",
        );
        if (failure === "overflow") gpu.contactCapacity = capacity;
        gpu.adapt(counters);
        gpu.step();
        const recovered = await gpu.readCounters(),
          after = await gpu.readBodies();
        assert(
          !recovered.overflow && !recovered.clashes,
          "capacity recovery completes the solve",
        );
        assert(
          after.every(Number.isFinite) &&
            after.some((value, i) => value !== held[i]),
          "physics resumes with finite state",
        );
      } finally {
        gpu.destroy();
      }
    });
  for (const contacts of [false, true])
    await test(`parallel contact points preserve ${contacts ? "friction, rotation and kinematic velocities" : "free fall and adaptive warm starts"}`, async () => {
      for (const lanes of [
        [1, 1, 1],
        [2 ** 31, 1, 1],
        [2 ** 31, 2 ** 31, 1],
        [2 ** 31, 2 ** 31, 2 ** 31],
      ]) {
        const solvers = [projectedContactSolve, pointLanesContactSolve].map(
          (solve) => {
            const gpu = new GpuSolver3D(device, make(contacts), {
              spatialSort: false,
              shaders: { solve },
            });
            gpu.primalLanes = lanes;
            return gpu;
          },
        );
        try {
          for (let step = 0; step < 120; step++) {
            for (const gpu of solvers) gpu.step();
            if (step % 10 && step !== 119) continue;
            const states = await Promise.all(
              solvers.map((gpu) => gpu.readBodies()),
            );
            assert(
              states.every((state) => state.every(Number.isFinite)),
              "finite states with both scheduling modes",
            );
            for (let word = 0; word < states[0].length; word++)
              close(
                states[1][word],
                states[0][word],
                2e-4,
                `step ${step}, lanes ${lanes}, word ${word}`,
              );
            for (const gpu of solvers) {
              const c = await gpu.readCounters();
              assert(
                !c.overflow && !c.clashes,
                "complete, conflict-free contact solve",
              );
            }
          }
        } finally {
          for (const gpu of solvers) gpu.destroy();
        }
      }
    });
  await test("parallel-point GPU solve remains finite with a heavy slab on a light thin box", async () => {
    const s = new Solver();
    new Rigid(s, [80, 80, 2], 0, 0.7, [0, 0, -1]);
    new Rigid(s, [2, 0.2, 0.1], 0.001, 0.7, [0, 0, 0.05]);
    new Rigid(s, [4, 4, 0.4], 1000, 0.7, [0, 0, 0.3]);
    const gpu = new GpuSolver3D(device, s, {
      shaders: { solve: pointLanesContactSolve },
      colorRounds: 32,
    });
    try {
      for (let step = 0; step < 600; step++) {
        gpu.step();
        const c = await gpu.readCounters();
        assert(!c.overflow && !c.clashes, "stress contact topology");
        if (step % 20 === 0) gpu.adapt(c);
      }
      const state = await gpu.readBodies();
      assert(
        state.every(Number.isFinite),
        "finite state at a million-to-one mass ratio",
      );
      for (let i = 1; i < gpu.bodyCount; i++) {
        const o = i * 40;
        assert(state[o + 2] > -0.1, "body stays above the floor");
        close(
          Math.hypot(...state.subarray(o + 4, o + 8)),
          1,
          2e-4,
          "normalized rotation",
        );
      }
    } finally {
      gpu.destroy();
    }
  });
}
