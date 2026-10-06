import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import {
  Rigid,
  COLLISION_MARGIN,
} from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { GpuSolver3D } from "../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import { GpuSleep } from "../src/gpu/gpuSleep.js";
import { assert, readBuffer } from "./helpers/gpu.js";
export async function canonicalGpuTests(
  device,
  test,
  shaders,
  SolverClass = GpuSolver3D,
) {
  await test("canonical GPU world joint pulls and releases a body", async () => {
    const s = new Solver();
    new Rigid(s, [1, 1, 1], 1, 0.5, [0, 0, 1]);
    s.gravity = 0;
    const gpu = new SolverClass(device, s, { spatialSort: false, shaders });
    try {
      const slot = gpu.appendJoint(-1, 0, [4, 0, 3], [0, 0, 0], 1000, 0);
      for (let i = 0; i < 120; i++) {
        gpu.step();
        if (i % 20 === 0) await device.queue.onSubmittedWorkDone();
      }
      let b = await gpu.readBodies();
      assert(
        b[0] > 3.7 && Math.abs(b[2] - 3) < 0.3,
        "world joint reaches target",
      );
      gpu.disableConstraint(slot);
      const j = await gpu.readJoints();
      assert(j[3] === 0 && j[7] === 0, "release disables constraint");
    } finally {
      gpu.destroy();
    }
  });
  await test("canonical GPU resting contact respects the floor contact margin", async () => {
    const s = new Solver();
    new Rigid(s, [100, 100, 1], 0, 0.5, [0, 0, 0]);
    new Rigid(s, [1, 1, 1], 1, 0.5, [0, 0, 4]);
    const gpu = new SolverClass(device, s, { spatialSort: false, shaders });
    try {
      for (let i = 0; i < 240; i++) {
        gpu.step();
        if (i % 20 === 0) await device.queue.onSubmittedWorkDone();
      }
      const b = await gpu.readBodies();
      // Two half-heights sum to 1. The normal contact row allows one margin
      // of overlap (signed separation + margin), with small solve tolerance.
      const restingHeight = 1 - COLLISION_MARGIN;
      assert(
        Math.abs(b[42] - restingHeight) < 0.01,
        `GPU z ${b[42]}, expected resting height ${restingHeight}`,
      );
      const c = await gpu.readCounters();
      assert(
        c.contacts >= 4 && !c.overflow && !c.clashes,
        "resting contact topology valid",
      );
    } finally {
      gpu.destroy();
    }
  });
  const make = () => {
    const s = new Solver();
    new Rigid(s, [100, 100, 1], 0, 0.65, [0, 0, -0.5]);
    new Rigid(s, [1, 0.5, 0.9], 1, 0.65, [0, 0, 0.45]);
    new Rigid(s, [1, 0.5, 0.9], 1, 0.65, [0, 0, 1.35]);
    sphere(s, 0.5, 100, 0.5, [0, -10, 1.35], [0, 30, 0]);
    return s;
  };
  await test("GPU sleeping batches passes without changing impact or support state", async () => {
    const worlds = [false, true].map((batchPasses) => {
      const ref = make(),
        gpu = new SolverClass(device, ref, { spatialSort: false, shaders });
      return { gpu, sleep: new GpuSleep(device, ref, gpu, { batchPasses }) };
    });
    try {
      for (let step = 0; step < 60; step++) {
        for (const { gpu, sleep } of worlds) {
          sleep.before();
          gpu.step();
          sleep.after();
        }
        await device.queue.onSubmittedWorkDone();
        const poses = await Promise.all(worlds.map((w) => w.gpu.readBodies()));
        for (let i = 0; i < poses[0].length; i++)
          assert(
            Math.abs(poses[0][i] - poses[1][i]) < 1e-6,
            `Step ${step}: body word ${i} changed`,
          );
        const states = await Promise.all(
          worlds.map((w) =>
            readBuffer(device, w.sleep.state).then((b) => new Uint32Array(b)),
          ),
        );
        assert(
          states[0].every((x, i) => x === states[1][i]),
          `Step ${step}: sleep/support state changed`,
        );
      }
    } finally {
      for (const { gpu, sleep } of worlds) {
        sleep.dispose();
        gpu.destroy();
      }
    }
  });
  await test("GPU sleeping preserves poses and real masses, then wakes reciprocal impact bodies", async () => {
    const s = make(),
      gpu = new SolverClass(device, s, { spatialSort: false, shaders }),
      sleep = new GpuSleep(device, s, gpu);
    try {
      let b = await gpu.readBodies();
      assert(
        b[59] === 0 && b[99] === 0 && b[139] > 0,
        "bricks asleep, sphere dynamic",
      );
      const state = new Float32Array(await readBuffer(device, sleep.state));
      assert(
        Math.abs(state[8] - s.bodies[1].mass) < 1e-7 &&
          Math.abs(state[16] - s.bodies[2].mass) < 1e-7,
        "physical mass preserved",
      );
      for (let i = 0; i < 30; i++) {
        sleep.before();
        gpu.step();
        sleep.after();
        await device.queue.onSubmittedWorkDone();
      }
      b = await gpu.readBodies();
      assert(b[99] > 0, "impacted brick restored to its real mass");
      assert(
        Math.hypot(b[80], b[81], b[82] - 1.35) > 0.02,
        "hit produced displacement",
      );
      assert(b.every(Number.isFinite), "finite state");
      assert((await sleep.readAwake()) > 0, "awake counter");
    } finally {
      sleep.dispose();
      gpu.destroy();
    }
  });
  await test("GPU sleeping wakes a dependent when a support moves away", async () => {
    const s = make();
    s.bodies.at(-1).velocityLin.fill(0);
    const gpu = new SolverClass(device, s, { spatialSort: false, shaders }),
      sleep = new GpuSleep(device, s, gpu);
    try {
      const moved = new Solver(),
        b = new Rigid(moved, [1, 0.5, 0.9], 1, 0.65, [4, 0, 0.45]);
      gpu.rewriteBodies([1], [b]);
      sleep.before();
      gpu.step();
      sleep.after();
      const data = await gpu.readBodies();
      assert(
        data[99] > 0 && data[82] < 1.35,
        "unsupported upper brick wakes and falls",
      );
    } finally {
      sleep.dispose();
      gpu.destroy();
    }
  });
  await test("GPU sleeping rejects an unsupported initial configuration", async () => {
    const s = make();
    s.bodies[2].positionLin[2] = 5;
    const gpu = new SolverClass(device, s, { spatialSort: false, shaders });
    try {
      let failed = false;
      try {
        new GpuSleep(device, s, gpu);
      } catch (e) {
        failed = /Unsupported initial/.test(e.message);
      }
      assert(failed, "unsupported body cannot be silently frozen");
    } finally {
      gpu.destroy();
    }
  });
}
