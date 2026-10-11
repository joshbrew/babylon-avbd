import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { NativeGpuSolver3D } from "../src/native/solver3D.js";
import { assert } from "./helpers/gpu.js";

export async function smallGroupGpuTests(device, test) {
  for (const count of [1, 9, 16, 32, 33])
    await test(`GPU small group ${count} bodies retains the complete state and fallback`, async () => {
      const create = (smallGroups) => {
        const ref = new Solver();
        ref.iterations = 5;
        new Rigid(ref, [30, 30, 1], 0, 0.6, [0, 0, -0.5]);
        for (let i = 1; i < count; i++) {
          const p = [
            ((i - 1) % 4) * 0.8,
            (Math.floor((i - 1) / 4) % 2) * 0.8,
            0.4 + Math.floor((i - 1) / 8) * 0.8,
          ];
          const b =
            i % 3
              ? new Rigid(ref, [0.8, 0.8, 0.8], 1, 0.6, p)
              : sphere(ref, 0.4, 1, 0.6, p);
          b.velocityLin.set([0.1, -0.02, 0]);
          b.velocityAng.set([0.03, 0, 0.01]);
        }
        return new NativeGpuSolver3D(device, ref, {
          smallGroups,
          spatialSort: false,
          colorCap: 16,
          colorRounds: 16,
        });
      };
      const a = create(false),
        b = create(true);
      try {
        let peak = 0;
        for (let step = 0; step < 240; step++) {
          for (const g of [a, b]) {
            if (step === 40) g.params.iterations = 0;
            if (step === 41) g.params.iterations = 3;
            if (step === 60 && count > 1) g.setRestitution(1, 0.5);
            if (step === 80 && count > 1) g.setSensor(1, true);
            if (step === 100 && count > 1) g.setSensor(1, false);
            if (step === 120 && count > 1) g.teleport(1, [0, 0, 4]);
            if (step === 140 && count > 1) g.setLinearVelocity(1, [0, 0, -2]);
            if (step === 160 && count > 1)
              g.appendJoint(-1, 1, [0, 0, 3], [0, 0, 0], 1000, 0);
          }
          (step % 2 ? [a, b] : [b, a]).forEach((g) => g.step());
          if (step % 20 !== 19) continue;
          const x = await a.readBodies(),
            y = await b.readBodies();
          assert(
            x.every((v, i) => v === y[i]),
            `Every pose and velocity matches after step ${step}`,
          );
          const c = await b.readCounters();
          peak = Math.max(peak, c.contacts);
          assert(
            !c.overflow && !c.clashes,
            "No lost contacts or coloring conflicts",
          );
          assert(
            !!b.smallGroupPipeline ===
              (count <= 32 && (count === 1 || step < 160)),
            "Automatic size and joint fallback",
          );
        }
        if (count === 32)
          assert(
            peak > 64,
            "Dense contacts exceed a fixed shared contact array",
          );
      } finally {
        a.destroy();
        b.destroy();
      }
    });
}
