import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { NativeGpuSolver3D } from "../src/native/solver3D.js";
import { assert, readBuffer } from "./helpers/gpu.js";

export async function islandSleepingGpuTests(device, test) {
  for (const mode of ["grid", "hploc", "grid-joint"])
    await test(`GPU island sleeping ${mode} wakes a connected pile without its neighbor`, async () => {
      const broadphase = mode.split("-")[0];
      const ref = new Solver();
      ref.iterations = 5;
      new Rigid(ref, [40, 20, 1], 0, 0.6, [0, 0, -0.5]);
      for (const x of [-3, 4])
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
          assert(before[3 * 8 + 5] === 1, "Joint-only endpoints share a conservative root");
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
          if (step % 2 !== 1) continue;
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
