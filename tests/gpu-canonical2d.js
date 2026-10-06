import { GpuSolver2D } from "../reference/three-avbd/src/avbd2d/gpu/solver.ts";
import { buildScene2D } from "../reference/three-avbd/src/avbd2d/gpu/sim.ts";
import { parallelParams } from "../reference/three-avbd/src/avbd2d/ref/solver.ts";
import { assert } from "./helpers/gpu.js";
import { gpuSceneParams2D } from "../demo/canonicalScenes.js";

// The same physical thresholds as the pinned avbd2d-behavior suite, executed
// against actual WebGPU buffers rather than the CPU colored approximation.
export async function canonicalGpu2DTests(device, test) {
  async function withScene(name, params, run) {
    const mirror = buildScene2D(name);
    Object.assign(
      mirror.params,
      parallelParams(),
      gpuSceneParams2D(name),
      params,
    );
    const gpu = new GpuSolver2D(device, mirror);
    const step = async (n) => {
      for (let i = 0; i < n; i++) {
        gpu.step();
        if (i % 20 === 19) {
          const c = await gpu.readCounters();
          assert(
            !c.overflow && !c.clashes,
            `${name}: valid contact/color capacity`,
          );
          gpu.adapt(c);
        }
      }
    };
    try {
      await run(gpu, step, mirror);
    } finally {
      await device.queue.onSubmittedWorkDone();
      gpu.destroy();
    }
  }
  await test("canonical 2D GPU stack stays standing for ten seconds", () =>
    withScene("Stack", {}, async (gpu, step) => {
      await step(600);
      const b = await gpu.readBodies(),
        o = (gpu.bodyCount - 1) * 24,
        stats = await gpu.readStats(b);
      assert(
        Math.abs(b[o + 1] - 20) < 0.05 && Math.abs(b[o]) < 0.01,
        `top at ${b[o]}, ${b[o + 1]}`,
      );
      assert(stats.kineticEnergy < 1e-3, `energy ${stats.kineticEnergy}`);
    }));
  await test("canonical 2D GPU pyramid settles without collapsing", () =>
    withScene("Pyramid", {}, async (gpu, step, mirror) => {
      await step(600);
      const b = await gpu.readBodies(),
        stats = await gpu.readStats(b);
      let top = -Infinity;
      for (let i = 0; i < gpu.bodyCount; i++)
        if (mirror.dynamic[i]) top = Math.max(top, b[i * 24 + 1]);
      assert(top > 7.9, `top ${top}`);
      assert(stats.kineticEnergy < 0.05, `energy ${stats.kineticEnergy}`);
    }));
  await test("canonical 2D GPU static friction holds the thirty degree slope", () =>
    withScene("Static Friction", {}, async (gpu, step, mirror) => {
      await step(300);
      const before = await gpu.readBodies();
      await step(900);
      const after = await gpu.readBodies();
      for (let i = 0; i < gpu.bodyCount; i++)
        if (mirror.dynamic[i]) {
          const o = i * 24,
            d = Math.hypot(after[o] - before[o], after[o + 1] - before[o + 1]);
          assert(d < 0.005, `box ${i} crept ${d}`);
        }
    }));
  for (const rescale of [false, true])
    await test(`canonical 2D GPU dynamic friction ${rescale ? "recovers Coulomb distance" : "decreases stopping distance with friction"}`, () =>
      withScene(
        "Dynamic Friction",
        { stiffnessRescale: rescale },
        async (gpu, step, mirror) => {
          const initial = await gpu.readBodies();
          await step(600);
          const b = await gpu.readBodies(),
            travel = [];
          for (let i = 0; i < gpu.bodyCount; i++)
            if (mirror.dynamic[i]) travel.push(b[i * 24] - initial[i * 24]);
          for (let i = 1; i < travel.length; i++)
            assert(travel[i] > travel[i - 1], `friction order ${travel}`);
          if (rescale)
            for (let i = 0; i < 10; i++) {
              const expected = 100 / (20 * Math.sqrt((5 - i * 0.5) * 0.5));
              assert(
                Math.abs(travel[i] - expected) / expected < 0.05,
                `box ${i}: travelled ${travel[i]}, expected ${expected}`,
              );
            }
        },
      ));
  await test("canonical 2D GPU motor reaches its angular speed under torque limit", () =>
    withScene("Motor", {}, async (gpu, step) => {
      await step(240);
      const b = await gpu.readBodies();
      assert(Math.abs(b[24 + 14] + 20) < 0.01, `omega ${b[38]}`);
      assert(Math.abs(b[26]) > 1, "visible rotation");
    }));
  await test("canonical 2D GPU cantilever recovers after its initial sag", () =>
    withScene("Rod", {}, async (gpu, step) => {
      const o = (gpu.bodyCount - 1) * 24;
      await step(300);
      const sag5 = 10 - (await gpu.readBodies())[o + 1];
      assert(sag5 < 0.12, `initial sag ${sag5}`);
      await step(1500);
      const sag30 = 10 - (await gpu.readBodies())[o + 1];
      assert(sag30 < sag5 * 0.75, `final sag ${sag30}, initial ${sag5}`);
    }));
  await test("canonical 2D GPU heavy rope retains hard anchors", () =>
    withScene("Hanging Rope", {}, async (gpu, step) => {
      await step(60);
      let worst = 0;
      for (let i = 0; i < 27; i++) {
        await step(20);
        worst = Math.max(worst, (await gpu.readStats()).maxJointError);
      }
      assert(worst < 0.05, `worst anchor error ${worst}`);
    }));
  await test("canonical 2D GPU fracture releases joints under falling load", () =>
    withScene("Fracture", {}, async (gpu, step) => {
      const initial = (await gpu.readStats()).joints;
      await step(300);
      const final = (await gpu.readStats()).joints;
      assert(final < initial, `${initial} -> ${final} joints`);
    }));
  await test("canonical 2D GPU supports spawned bodies, cursor joints and release", () =>
    withScene("Ground", {}, async (gpu, step) => {
      const id = gpu.bodyCount;
      gpu.addBody([1, 1], 1, 0.5, [0, 1, 0], [0, 0, 0]);
      const slot = gpu.appendJoint(-1, id, [3, 4], [0, 0], [1000, 1000, 0]);
      await step(120);
      let b = await gpu.readBodies();
      assert(
        Math.hypot(b[id * 24] - 3, b[id * 24 + 1] - 4) < 0.5,
        "body reaches cursor",
      );
      gpu.disableConstraint(slot);
      await step(120);
      b = await gpu.readBodies();
      assert(b[id * 24 + 1] < 1, "released body falls");
    }));
}
