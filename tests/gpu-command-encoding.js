import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { GpuSolver2D } from "../reference/three-avbd/src/avbd2d/gpu/solver.ts";
import { GpuSolver3D } from "../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import { assert } from "./helpers/gpu.js";
import { encodeGpuSolverStep } from "../src/gpu/gpuSolverStep.js";
import { encodeGpuSolverStep2D } from "../src/gpu/gpuSolverStep2D.ts";

export function createEncodingFixture(device, dimension) {
  const scene =
    dimension === 2
      ? new AvbdScene2D({ iterations: 5 })
      : new AvbdScene3D({ iterations: 5, up: [0, 0, 1] });
  scene.addBox(dimension === 2 ? [30, 1] : [30, 30, 1], {
    ...(dimension === 2 ? { density: 0 } : { mass: 0 }),
    position: dimension === 2 ? [0, -0.5] : [0, 0, -0.5],
  });
  const bodies = [];
  for (let i = 0; i < 30; i++) {
    const options = {
      position:
        dimension === 2
          ? [(i % 6) * 0.9 - 2.25, 0.4 + Math.floor(i / 6) * 0.9]
          : [(i % 6) * 0.9 - 2.25, 0, 0.4 + Math.floor(i / 6) * 0.9],
      velocity: dimension === 2 ? [0.15, 0, 0.03] : [0.15, 0.03, 0],
      ...(dimension === 3 ? { angularVelocity: [0.03, 0.02, 0.01] } : {}),
    };
    bodies.push(
      i % 3 === 0
        ? dimension === 2
          ? scene.addCircle(0.35, options)
          : scene.addSphere(0.35, options)
        : scene.addBox(dimension === 2 ? [0.7, 0.7] : [0.7, 0.7, 0.7], options),
    );
  }
  if (dimension === 2) scene.addJoint(-1, bodies.at(-1), [2.25, 4], [0, 0]);
  else scene.addJoint(null, bodies.at(-1), [2.25, 0, 4], [0, 0, 0]);
  return scene.createSolver(device, {
    spatialSort: false,
    colorCap: 16,
    colorRounds: 16,
  });
}

export async function commandEncodingGpuTests(device, test) {
  for (const dimension of [2, 3])
    await test(`GPU command encoding ${dimension}D preserves exact state across combined and split passes`, async () => {
      const baseline = createEncodingFixture(device, dimension),
        current = createEncodingFixture(device, dimension),
        prototype =
          dimension === 2 ? GpuSolver2D.prototype : GpuSolver3D.prototype;
      try {
        let offsets;
        const encode = () =>
          dimension === 2
            ? encodeGpuSolverStep2D.call(current)
            : encodeGpuSolverStep(current);
        for (let step = 0; step < 240; step++) {
          for (const g of [baseline, current]) {
            g.splitPasses = step >= 60 && step < 120;
            if (dimension === 2) {
              g.params.postStabilize = step >= 120 && step < 180;
              g.params.vbd = step >= 180;
            }
          }
          if (step % 2) {
            prototype.step.call(baseline);
            encode();
          } else {
            encode();
            prototype.step.call(baseline);
          }
          if (!step) offsets = current.passOffsets;
          assert(
            current.passOffsets === offsets,
            "Dynamic-offset storage is reused",
          );
          if (step % 30 !== 29) continue;
          for (const read of ["readBodies", "readJoints"]) {
            const [a, b] = await Promise.all([
              baseline[read](),
              current[read](),
            ]);
            assert(
              a.length === b.length &&
                a.every((v, i) => Number.isFinite(v) && v === b[i]),
              `${read} exactly matches after step ${step + 1}`,
            );
          }
          const counts = await Promise.all([
            baseline.readCounters(),
            current.readCounters(),
          ]);
          assert(
            counts.every((c) => !c.overflow && !c.clashes),
            "Complete contacts with independent solve groups",
          );
        }
      } finally {
        baseline.destroy();
        current.destroy();
      }
    });
}
