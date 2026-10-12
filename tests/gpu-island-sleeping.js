import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { NativeGpuSolver3D } from "../src/native/solver3D.js";
import { assert, readBuffer } from "./helpers/gpu.js";

export async function islandSleepingGpuTests(device, test) {
  for (const broadphase of ["grid", "hploc"])
    for (const islands of [false, true])
      await test(`GPU sleeping ${broadphase} ${islands ? "island" : "conservative"} resolves the first impact with restored dynamic mass`, async () => {
        const make = () => {
          const ref = new Solver();
          ref.gravity = 0;
          ref.iterations = 10;
          new Rigid(ref, [1, 1, 1], 1, 0, [0, 0, 0]);
          new Rigid(ref, [1, 1, 1], 1, 0, [1, 0, 0]);
          new Rigid(ref, [1, 1, 1], 1, 0, [2, 0, 0]);
          new Rigid(ref, [1, 1, 1], 1, 0, [8, 0, 0]);
          sphere(ref, 0.5, 1, 0, [-2, 0, 0]).allowSleep = false;
          return new NativeGpuSolver3D(device, ref, {
            spatialSort: false,
            broadphase,
            smallGroups: false,
          });
        };
        const awake = make(),
          sleeping = make();
        sleeping.enableSleeping({ islands, timeThreshold: 0.1 });
        try {
          for (let step = 0; step < 30; step++) {
            awake.step();
            sleeping.step();
          }
          assert(
            (await sleeping.readSleepStats()).sleeping === 4,
            "Targets settled",
          );
          // Put the projectile just inside contact, then compare one step with
          // the same fully awake world. Zero gravity removes settling error.
          for (const g of [awake, sleeping]) {
            device.queue.writeBuffer(
              g.bodyBuffer,
              4 * 160,
              new Float32Array([-0.999, 0, 0]),
            );
            device.queue.writeBuffer(
              g.bodyBuffer,
              4 * 160 + 128,
              new Float32Array([6, 0, 0]),
            );
            g.step();
          }
          const [a, b] = await Promise.all([
            awake.readBodies(),
            sleeping.readBodies(),
          ]);
          assert(
            b[32] > 0.5,
            "The sleeping brick moves during the first impact step",
          );
          for (const body of [0, 1, 2, 4])
            for (const offset of [0, 32])
              assert(
                Math.abs(a[body * 40 + offset] - b[body * 40 + offset]) < 1e-4,
                "First-impact position and velocity match an awake target",
              );
          const c = await sleeping.readCounters();
          assert(
            !c.overflow && !c.clashes,
            "Woken contacts are scheduled safely",
          );
          if (islands) {
            const state = new Uint32Array(
              await readBuffer(device, sleeping.sleeping.state),
            );
            assert(
              state[26] !== 0,
              "A separate island remains asleep on the impact frame",
            );
            assert(
              [0, 1, 2].every((i) => !state[i * 8 + 2]),
              "The complete struck island wakes",
            );
          }
          const contacts = await sleeping.readContactList();
          for (const [a, b] of [
            [0, 1],
            [1, 2],
          ])
            assert(
              contacts.some(
                (c) => (c.a === a && c.b === b) || (c.a === b && c.b === a),
              ),
              "Contacts within the newly woken island exist on the first impact frame",
            );
        } finally {
          awake.destroy();
          sleeping.destroy();
        }
      });
  await test("GPU island sleep ignores stale gravity prediction beside an awake resting body", async () => {
    const ref = new Solver();
    ref.iterations = 10;
    new Rigid(ref, [12, 12, 1], 0, 0.6, [0, 0, -0.5]);
    new Rigid(ref, [1, 1, 1], 1, 0.6, [0, 0, 0.5]);
    const top = new Rigid(ref, [1, 1, 1], 1, 0.6, [0, 0, 1.5]);
    top.allowSleep = false;
    const gpu = new NativeGpuSolver3D(device, ref, { spatialSort: false });
    gpu.enableSleeping({ islands: true, timeThreshold: 0.1 });
    try {
      for (let step = 0; step < 300; step++) {
        gpu.step();
        if (step >= 200 && step % 10 === 9) {
          const state = new Uint32Array(
            await readBuffer(device, gpu.sleeping.state),
          );
          assert(
            state[10] !== 0,
            "The supported box stays asleep under an awake resting neighbor",
          );
          assert(state[18] === 0, "The excluded box stays awake");
        }
      }
      device.queue.writeBuffer(
        gpu.bodyBuffer,
        2 * 160 + 128,
        new Float32Array([0, 0, -3]),
      );
      gpu.step();
      const impact = new Uint32Array(
        await readBuffer(device, gpu.sleeping.state),
      );
      assert(
        impact[10] === 0,
        "Actual incoming motion still wakes the supported box",
      );
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU island sleep wakes on a rotating body's contact-point impact", async () => {
    const ref = new Solver();
    ref.gravity = 0;
    new Rigid(ref, [1, 1, 1], 1, 0.6, [-1, 0, 0]);
    new Rigid(ref, [1, 1, 1], 1, 0.6, [5, 0, 0]);
    const rod = new Rigid(ref, [3, 0.2, 0.2], 1, 0.6, [-2, -0.8, 0]);
    rod.allowSleep = false;
    const gpu = new NativeGpuSolver3D(device, ref, { spatialSort: false });
    gpu.enableSleeping({ islands: true, timeThreshold: 0.1 });
    try {
      for (let i = 0; i < 30; i++) gpu.step();
      assert(
        (await gpu.readSleepStats()).sleeping === 2,
        "Targets start asleep",
      );
      // Launch by angular velocity alone: the centre is initially stationary.
      device.queue.writeBuffer(
        gpu.bodyBuffer,
        2 * 160 + 144,
        new Float32Array([0, 0, 8]),
      );
      let woke = false;
      for (let i = 0; i < 20; i++) {
        gpu.step();
        const state = new Uint32Array(
          await readBuffer(device, gpu.sleeping.state),
        );
        woke ||= !state[2];
        assert(state[10] !== 0, "The distant target remains asleep");
      }
      assert(woke, "Rotation wakes the struck target without a linear launch");
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU island startup sleep keeps floating and moving groups awake", async () => {
    const ref = new Solver();
    new Rigid(ref, [30, 20, 1], 0, 0.6, [0, 0, -0.5]);
    new Rigid(ref, [1, 1, 1], 1, 0.6, [-4, 0, 0.5]);
    new Rigid(ref, [1, 1, 1], 1, 0.6, [-4, 0, 1.5]);
    new Rigid(ref, [1, 1, 1], 1, 0.6, [4, 0, 8]);
    const ball = sphere(ref, 0.4, 1, 0.6, [8, 0, 0.4]);
    ball.velocityLin.set([3, 0, 0]);
    const gpu = new NativeGpuSolver3D(device, ref, { spatialSort: false });
    try {
      gpu.enableSleeping({ islands: true, startAsleep: true });
      const state = new Uint32Array(
        await readBuffer(device, gpu.sleeping.state),
      );
      assert(state[10] && state[18], "Both grounded courses start asleep");
      assert(
        !state[26] && !state[34],
        "Floating and moving bodies remain awake",
      );
      const p = await gpu.readBodies();
      gpu.teleport(0, [0, 0, -20]);
      for (let i = 0; i < 60; i++) gpu.step();
      const fallen = await gpu.readBodies();
      assert(
        fallen[42] < p[42] - 1,
        "Startup sleepers wake when support is removed",
      );
    } finally {
      gpu.destroy();
    }
  });
  for (const islands of [false, true])
    await test(`GPU sleeping ${islands ? "island" : "conservative"} anchor updates leave unrelated resting bodies asleep`, async () => {
      const ref = new Solver();
      new Rigid(ref, [30, 20, 1], 0, 0.6, [0, 0, -0.5]);
      new Rigid(ref, [1, 1, 1], 1, 0.6, [-4, 0, 0.5]);
      new Rigid(ref, [1, 1, 1], 1, 0.6, [4, 0, 0.5]);
      const gpu = new NativeGpuSolver3D(device, ref, { spatialSort: false });
      gpu.enableSleeping({ islands, timeThreshold: 0.1, speedThreshold: 0.1 });
      try {
        for (let i = 0; i < 120; i++) gpu.step();
        const initial = await gpu.readBodies();
        assert(
          (await gpu.readSleepStats()).sleeping === 2,
          "Both bodies settled",
        );
        const slot = gpu.appendJoint(-1, 1, [-4, 0, 0.5], [0, 0, 0], 1000, 0);
        assert(
          !gpu.sleeping.wakeRequested,
          "Creating the grab does not request a world wake",
        );
        for (let i = 0; i < 120; i++) {
          gpu.setWorldAnchor(slot, [-4, 0, 0.5]);
          gpu.step();
          if (i < 10 || i % 10 === 9) {
            const state = new Uint32Array(
              await readBuffer(device, gpu.sleeping.state),
            );
            assert(
              state[18] !== 0,
              "Unrelated body remains asleep while holding the anchor",
            );
            assert(state[10] === 0, "Held body stays responsive");
          }
        }
        const after = await gpu.readBodies();
        assert(
          initial.slice(80, 120).every((v, i) => v === after[80 + i]),
          "Resting body keeps its exact pose",
        );
        gpu.releaseJoints([slot]);
        gpu.step();
        const released = new Uint32Array(
          await readBuffer(device, gpu.sleeping.state),
        );
        assert(
          released[18] !== 0,
          "Releasing the grab preserves unrelated sleep",
        );
      } finally {
        gpu.destroy();
      }
    });
  for (const mode of ["grid", "hploc", "grid-joint"])
    await test(`GPU island sleeping ${mode} wakes a connected pile without its neighbor`, async () => {
      const broadphase = mode.split("-")[0];
      const ref = new Solver();
      ref.iterations = 5;
      new Rigid(ref, [40, 20, 1], 0, 0.6, [0, 0, -0.5]);
      // Keep the witness beyond the projectile's 70-step travel distance.
      for (const x of [-3, 10])
        for (let z = 0; z < 3; z++)
          new Rigid(ref, [1, 1, 1], 1, 0.6, [
            mode === "grid-joint" && x === -3 && z === 2 ? -1 : x,
            0,
            mode === "grid-joint" && x === -3 && z === 2 ? 0.5 : z + 0.5,
          ]);
      const ball = sphere(ref, 0.45, 20, 0.6, [-8, 0, 0.45]);
      ball.allowSleep = false;
      const g = new NativeGpuSolver3D(device, ref, {
        spatialSort: false,
        broadphase,
        colorCap: 16,
        colorRounds: 16,
      });
      if (mode === "grid-joint")
        g.appendJoint(1, 3, [1, 0, 0], [-1, 0, 0], 1000, 0);
      g.enableSleeping(ref, {
        islands: true,
        speedThreshold: 0.1,
        timeThreshold: 0.1,
      });
      try {
        for (let i = 0; i < 400; i++) {
          g.step();
          if (i % 20 === 19) await device.queue.onSubmittedWorkDone();
        }
        const before = new Uint32Array(
          await readBuffer(device, g.sleeping.state),
        );
        assert(
          [1, 2, 3, 4, 5, 6].every((i) => before[i * 8 + 2]),
          "Both piles settled",
        );
        if (mode === "grid-joint")
          assert(
            before[3 * 8 + 5] === 1,
            "Joint-only endpoints share a conservative root",
          );
        const rightPose = (await g.readBodies()).slice(4 * 40, 7 * 40);
        // An already awake projectile receives its launch velocity directly to
        // test physical impact waking, independently of explicit edit wakeAll.
        device.queue.writeBuffer(
          g.bodyBuffer,
          7 * 160 + 128,
          new Float32Array([12, 0, 0]),
        );
        let sawGroupWake = false;
        for (let step = 0; step < 70; step++) {
          g.step();
          const state = new Uint32Array(
            await readBuffer(device, g.sleeping.state),
          );
          const awake = [1, 2, 3].filter((i) => !state[i * 8 + 2]).length;
          if (mode === "grid-joint" && awake > 0 && !sawGroupWake)
            assert(
              awake === 3,
              "Joint-only connection wakes immediately with the impacted pile",
            );
          sawGroupWake ||= awake === 3;
          assert(
            [4, 5, 6].every((i) => state[i * 8 + 2]),
            "Shared floor does not join the piles",
          );
          const counters = await g.readCounters();
          assert(
            !counters.overflow && !counters.clashes,
            "Impact scheduling remains valid",
          );
        }
        assert(sawGroupWake, "Impact wakes every brick in the connected pile");
        const after = await g.readBodies();
        assert(
          rightPose.every((v, i) => v === after[4 * 40 + i]),
          "Untouched sleeping pile stays bit exact",
        );
        g.teleport(0, [0, 0, -20]);
        for (let i = 0; i < 60; i++) g.step();
        const fallen = await g.readBodies();
        assert(
          fallen[4 * 40 + 2] < -1,
          "Removing shared support wakes the resting pile",
        );
      } finally {
        g.destroy();
      }
    });
}
