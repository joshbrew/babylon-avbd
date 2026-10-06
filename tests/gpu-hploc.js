import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  sphere,
  hull,
  convexHull,
} from "../reference/three-avbd/src/avbd3d/shapes.ts";
import {
  IgnoreCollision,
  Joint,
} from "../reference/three-avbd/src/avbd3d/ref/forces.ts";
import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import { assert, close } from "./helpers/gpu.js";
import { canonicalGpuTests } from "./gpu-canonical.js";

const pairSet = (pairs) => {
  const result = [];
  for (let i = 0; i < pairs.length; i += 2)
    result.push(`${pairs[i]},${pairs[i + 1]}`);
  assert(new Set(result).size === result.length, "pairs are unique");
  return result.sort().join(";");
};
const options = {
  spatialSort: false,
  capacity: { pairs: 4096, manifolds: 4096, contacts: 32768, colors: 64 },
  colorRounds: 32,
};
async function comparePairs(device, ref, frames = 1, mutate, setup) {
  const solvers = ["grid", "hploc"].map(
    (broadphase) =>
      new AppGpuSolver3D(device, ref, {
        ...options,
        broadphase,
        bvh: { rebuildInterval: 3 },
      }),
  );
  for (const s of solvers) {
    s.params.iterations = 0;
    s.params.gravity = 0;
  }
  setup?.(solvers);
  try {
    for (let frame = 0; frame < frames; frame++) {
      if (mutate) {
        mutate(ref, frame, solvers);
        for (const s of solvers)
          s.rewriteBodies(
            ref.bodies.map((_, i) => i),
            ref.bodies,
          );
      }
      for (const s of solvers) s.step();
      const pairLists = await Promise.all(solvers.map((s) => s.readPairs()));
      assert(
        pairSet(pairLists[0]) === pairSet(pairLists[1]),
        `same complete pair set at frame ${frame}`,
      );
      for (const s of solvers) {
        const c = await s.readCounters();
        assert(!c.overflow && !c.clashes, "valid topology");
        assert((await s.readBodies()).every(Number.isFinite), "finite state");
      }
    }
    return solvers[1].bvh.stats;
  } finally {
    for (const s of solvers) s.destroy();
  }
}
export async function hplocGpuTests(device, test) {
  class TreeSolver extends AppGpuSolver3D {
    constructor(device, ref, options) {
      super(device, ref, { ...options, broadphase: "hploc" });
    }
  }
  await canonicalGpuTests(
    device,
    (name, fn) => test("H-PLOC " + name, fn),
    undefined,
    TreeSolver,
  );
  await test("H-PLOC handles empty, singleton and partial treelets", async () => {
    for (const count of [0, 1, 2, 15, 16, 17, 129]) {
      const ref = new Solver();
      for (let i = 0; i < count; i++)
        new Rigid(ref, [1, 1, 1], 1, 0.7, [i % 8, Math.floor(i / 8), 0.5]);
      await comparePairs(device, ref);
    }
  });
  await test("H-PLOC preserves duplicate Morton keys and coincident bodies", async () => {
    const ref = new Solver();
    for (let i = 0; i < 32; i++) new Rigid(ref, [1, 1, 1], 1, 0.7, [0, 0, 0]);
    await comparePairs(device, ref, 4);
  });
  await test("H-PLOC matches grid for rotated mixed shapes, large statics and masks", async () => {
    const ref = new Solver();
    new Rigid(ref, [80, 80, 2], 0, 0.7, [0, 0, -1]);
    for (let i = 0; i < 36; i++) {
      const p = [(i % 6) * 1.1, Math.floor(i / 6) * 1.1, 0.55];
      if (i % 4 === 0) sphere(ref, 0.6, 1, 0.7, p);
      else if (i % 4 === 1)
        hull(
          ref,
          convexHull([
            -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.7,
          ]),
          1,
          0.7,
          p,
        );
      else if (i % 4 === 2) new Rigid(ref, [1, 1, 1.2], 1, 0.7, p);
      else new Rigid(ref, [1.5, 0.4, 1], 1, 0.7, p);
    }
    new IgnoreCollision(ref, ref.bodies[1], ref.bodies[2]);
    new Joint(
      ref,
      ref.bodies[3],
      ref.bodies[4],
      [0, 0, 0],
      [0, 0, 0],
      1000,
      1000,
    );
    await comparePairs(
      device,
      ref,
      7,
      (ref, frame, solvers) => {
        if (frame === 4)
          for (const solver of solvers) solver.disableConstraint(0);
        for (let i = 1; i < ref.bodies.length; i++) {
          const b = ref.bodies[i],
            angle = frame * 0.3 + i * 0.04;
          b.positionLin[0] = (i % 6) * 1.1 + Math.sin(frame + i) * 0.4;
          b.positionAng.set([
            0,
            Math.sin(angle * 0.5),
            0,
            Math.cos(angle * 0.5),
          ]);
        }
      },
      (solvers) => {
        for (const s of solvers) s.setFilters([5], [1], [0]);
      },
    );
  });
  await test("H-PLOC refits teleports and rotations beyond the initial world bounds", async () => {
    const ref = new Solver();
    for (let i = 0; i < 33; i++)
      new Rigid(ref, [2, 0.2, 0.2], 1, 0.7, [i, 0, 0]);
    const stats = await comparePairs(device, ref, 9, (ref, frame) => {
      for (let i = 0; i < ref.bodies.length; i++) {
        const b = ref.bodies[i];
        b.positionLin.set([
          frame * 1000 + (i % 8) * 0.6,
          Math.floor(i / 8) * 0.6,
          0,
        ]);
        const angle = frame * 0.2;
        b.positionAng.set([0, 0, Math.sin(angle * 0.5), Math.cos(angle * 0.5)]);
      }
    });
    assert(
      stats.builds === 3 && stats.refits === 6,
      "periodic rebuilds and complete refits",
    );
  });
  await test("H-PLOC rebuilds after adding bodies to a live scene", async () => {
    const ref = new Solver();
    new Rigid(ref, [1, 1, 1], 1, 0.7, [0, 0, 0]);
    const solvers = ["grid", "hploc"].map(
      (broadphase) =>
        new AppGpuSolver3D(device, ref, {
          ...options,
          bodyCapacity: 64,
          broadphase,
        }),
    );
    try {
      for (const solver of solvers) {
        solver.params.gravity = 0;
        solver.params.iterations = 0;
        solver.step();
      }
      await device.queue.onSubmittedWorkDone();
      for (const count of [16, 7]) {
        const additions = Array.from(
          { length: count },
          (_, i) => new Rigid(ref, [1, 1, 1], 1, 0.7, [i * 0.25, 0, 0]),
        );
        for (const solver of solvers) {
          assert(solver.addBodies(additions) >= 0, "body append accepted");
          solver.step();
        }
        const pairs = await Promise.all(solvers.map((s) => s.readPairs()));
        assert(
          pairSet(pairs[0]) === pairSet(pairs[1]),
          "new bodies have complete collision coverage",
        );
        for (const solver of solvers) {
          const counters = await solver.readCounters();
          assert(
            !counters.overflow && !counters.clashes,
            "valid appended topology",
          );
        }
      }
      assert(
        solvers[1].bvh.stats.builds === 3,
        "each changed body count rebuilds the tree",
      );
    } finally {
      for (const solver of solvers) solver.destroy();
    }
  });
  for (const failure of ["overflow", "clashes"])
    await test(`H-PLOC ${failure} holds motion and recovers`, async () => {
      const ref = new Solver();
      new Rigid(ref, [80, 80, 2], 0, 0.7, [0, 0, -1]);
      const a = new Rigid(ref, [1, 1, 1], 1, 0.7, [0, 0, 0.5]),
        b = new Rigid(ref, [1, 1, 1], 1, 0.7, [0, 0, 1.5]);
      a.velocityLin[0] = 0.1;
      b.velocityAng[2] = 0.1;
      new Joint(ref, a, b, [0, 0, 0.5], [0, 0, -0.5], 1000, 1000);
      const gpu = new TreeSolver(device, ref, {
        spatialSort: false,
        colorRounds: 32,
      });
      try {
        const before = await gpu.readBodies(),
          joints = await gpu.readJoints(),
          capacity = gpu.contactCapacity;
        if (failure === "overflow") gpu.contactCapacity = 1;
        else {
          gpu.colorCap = 1;
          gpu.colorRounds = 2;
        }
        gpu.step();
        const counters = await gpu.readCounters(),
          held = await gpu.readBodies();
        assert(counters[failure] > 0, "incomplete topology is reported");
        for (let i = 0; i < gpu.bodyCount; i++)
          for (const word of [
            0, 1, 2, 3, 4, 5, 6, 7, 32, 33, 34, 35, 36, 37, 38, 39,
          ])
            assert(
              held[i * 40 + word] === before[i * 40 + word],
              "invalid step holds pose and velocity",
            );
        assert(
          (await gpu.readJoints()).every((v, i) => v === joints[i]),
          "joint forces are held",
        );
        gpu.contactCapacity = capacity;
        gpu.adapt(counters);
        gpu.step();
        const recovered = await gpu.readCounters();
        assert(
          !recovered.overflow && !recovered.clashes,
          "capacity recovery restores a complete step",
        );
        assert(
          (await gpu.readBodies()).every(Number.isFinite),
          "finite recovered state",
        );
      } finally {
        gpu.destroy();
      }
    });
  await test("Detailed GPU timing preserves valid solver state", async () => {
    const ref = new Solver();
    new Rigid(ref, [80, 80, 2], 0, 0.7, [0, 0, -1]);
    new Rigid(ref, [1, 1, 1], 1, 0.7, [0, 0, 0.5]);
    const a = new AppGpuSolver3D(device, ref),
      b = new AppGpuSolver3D(device, ref);
    try {
      for (let i = 0; i < 30; i++) {
        a.step();
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(Error("detailed timing timeout")),
            10000,
          );
          assert(
            b.profileDetailedNextStep((profile) => {
              clearTimeout(timeout);
              assert(
                profile.details.bodySolve >= 0 &&
                  profile.details.contactUpdate >= 0,
                "body and contact times available",
              );
              resolve();
            }),
            "timestamp support",
          );
          b.step();
        });
      }
      const poses = await Promise.all([a.readBodies(), b.readBodies()]);
      for (let i = 0; i < poses[0].length; i++)
        close(
          poses[0][i],
          poses[1][i],
          1e-6,
          "detailed encoder matches pinned dispatch order",
        );
    } finally {
      a.destroy();
      b.destroy();
    }
  });
}
