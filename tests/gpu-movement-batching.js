import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere, sail } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import {
  projectedContactSolve,
  pointLanesContactSolve,
} from "../src/gpu/gpuSolverKernels.js";
import { assert, readBuffer } from "./helpers/gpu.js";
import { IA_CONSTRAINTS } from "../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import { C_MANIFOLDS } from "../reference/three-avbd/src/avbd3d/gpu/layout.ts";
import {
  gpuExecutionPolicy3D,
  setGpuExecutionPolicy3D,
} from "../src/gpu/executionPolicy3D.js";

export async function movementBatchingGpuTests(device, test) {
  await test("GPU movement batching tiles million-manifold dispatches within device limits", async () => {
    const ref = new Solver();
    new Rigid(ref, [1, 1, 1], 1, 0.5, [0, 0, 5]);
    const g = new AppGpuSolver3D(device, ref, { solverMode: "optimized" });
    try {
      g.manifoldCapacity = 4_000_000;
      g.jointCount = 17;
      g.writeParams();
      for (const count of [0, 1, 4095, 4096, 4097, 1_048_577, 3_000_000]) {
        device.queue.writeBuffer(
          g.counterBuffer,
          C_MANIFOLDS * 4,
          new Uint32Array([count]),
        );
        const e = device.createCommandEncoder(),
          p = e.beginComputePass();
        p.setPipeline(g.pipes.argsContacts);
        p.setBindGroup(0, g.groups.args);
        p.dispatchWorkgroups(1);
        p.end();
        device.queue.submit([e.finish()]);
        const args = new Uint32Array(await readBuffer(device, g.argsBuffer));
        const [x, y, z] = args.subarray(IA_CONSTRAINTS, IA_CONSTRAINTS + 3);
        const blocks = Math.ceil(((count + 17) * 4) / 64);
        assert(
          x <= device.limits.maxComputeWorkgroupsPerDimension &&
            y <= device.limits.maxComputeWorkgroupsPerDimension &&
            z === 1,
          "Every dispatch dimension fits the adapter",
        );
        assert(
          x * y >= blocks && x * y - blocks < 256,
          "All constraints covered with bounded padding",
        );
      }
    } finally {
      g.destroy();
    }
  });
  for (const mode of ["optimized", "points"]) {
    await test(`GPU movement batching ${mode} retains every live pose, velocity and constraint value`, async () => {
      const create = (candidate) => {
        const ref = new Solver();
        new Rigid(ref, [40, 40, 1], 0, 0.65, [0, 0, -0.5]);
        for (let i = 0; i < 20; i++) {
          const p = [
            (i % 5) * 2 - 4,
            Math.floor(i / 5) * 2 - 3,
            0.8 + (i % 3) * 0.6,
          ];
          const body =
            i % 3 === 0
              ? sphere(ref, 0.45, 1, 0.65, p)
              : new Rigid(ref, [0.9, 0.7, 1], 1, 0.65, p);
          if (i % 3 !== 0)
            body.positionAng.set([Math.sin(0.12), 0, 0, Math.cos(0.12)]);
          body.velocityLin.set([0.2, -0.05, 0]);
          body.velocityAng.set([0.07, -0.04, 0.03]);
          if (i === 1) sail(body);
        }
        const options = {
          spatialSort: false,
          bodyCapacity: 32,
          colorCap: 16,
          colorRounds: 16,
        };
        if (candidate) options.solverMode = mode;
        else
          options.shaders = {
            solve:
              mode === "points"
                ? pointLanesContactSolve
                : projectedContactSolve,
          };
        const g = new AppGpuSolver3D(device, ref, options);
        Object.assign(g.params, {
          windSpeed: 2,
          windAngle: 0.7,
          windPressure: 0.05,
          windGust: 0.2,
        });
        g.appendJoint(-1, 19, [2, 3, 1.6], [0, 0, 0], 1000, 100);
        g.appendSprings([
          {
            a: 17,
            b: 18,
            rA: [0, 0, 0],
            rB: [0, 0, 0],
            stiffness: 80,
            rest: 2,
          },
        ]);
        g.setRestitution(3, 0.35);
        const motor = g.appendJoint(-1, 17, [0, 0, 1], [0, 0, 0], 100, 100);
        g.setAngularConstraint(motor, {
          type: "motor",
          speed: 0.1,
          maxTorque: 0.5,
        });
        return g;
      };
      const worlds = [create(false), create(true)];
      try {
        for (let step = 1; step <= 240; step++) {
          if (step === 61) for (const g of worlds) g.setSensor(5, true);
          if (step === 121) for (const g of worlds) g.setSensor(5, false);
          if (step === 181) for (const g of worlds) g.releaseJoints([0]);
          for (const g of step % 2 ? worlds : [...worlds].reverse()) g.step();
          if (step === 1 || step % 30 === 0) {
            for (const read of ["readBodies", "readJoints"]) {
              const [a, b] = await Promise.all(worlds.map((g) => g[read]()));
              assert(
                a.length === b.length &&
                  a.every((v, i) => Number.isFinite(v) && v === b[i]),
                `${read} exactly matches at step ${step}`,
              );
            }
            const counters = await Promise.all(
              worlds.map((g) => g.readCounters()),
            );
            assert(
              counters.every((c) => !c.overflow && !c.clashes),
              "Complete contacts and independent solve groups",
            );
          }
        }
        assert(
          worlds[1].parallelDual,
          "Batched contact dispatch remains active after sensor rebuilds",
        );
      } finally {
        worlds.forEach((g) => g.destroy());
      }
    });
  }
  await test("GPU movement batching restores partial tiles, unused capacity and zero-iteration steps", async () => {
    for (const capacity of [63, 64, 65, 95, 127, 129]) {
      const create = (candidate) => {
        const ref = new Solver();
        ref.gravity = 0;
        for (let i = 0; i < capacity - 1; i++) {
          const body = new Rigid(ref, [0.25, 0.25, 0.25], 1, 0.5, [
            i * 2,
            0,
            2,
          ]);
          body.velocityLin.set([0.1, 0.02, -0.01]);
          body.velocityAng.set([0.03, -0.04, 0.05]);
        }
        const g = new AppGpuSolver3D(device, ref, {
          bodyCapacity: capacity,
          spatialSort: false,
          ...(candidate
            ? { solverMode: "points" }
            : { shaders: { solve: pointLanesContactSolve } }),
        });
        const unused = new Float32Array(40).map((_, i) => 100 + i / 4);
        device.queue.writeBuffer(g.bodyBuffer, (capacity - 1) * 160, unused);
        g.params.iterations = 0;
        return { g, ref, unused };
      };
      const worlds = [create(false), create(true)];
      try {
        for (let step = 0; step < 6; step++) {
          if (step === 2) for (const { g } of worlds) g.params.iterations = 4;
          if (step === 4)
            for (const { g, ref } of worlds)
              g.addBody(
                new Rigid(ref, [0.25, 0.25, 0.25], 1, 0.5, [
                  capacity * 2,
                  0,
                  2,
                ]),
              );
          for (const { g } of worlds) g.step();
          const buffers = await Promise.all(
            worlds.map(({ g }) => readBuffer(device, g.bodyBuffer)),
          );
          const [a, b] = buffers.map((data) => new Uint32Array(data));
          assert(
            a.every((v, i) => v === b[i]),
            `All allocated bytes match: capacity ${capacity}, step ${step}`,
          );
          if (step < 4) {
            const tail = new Float32Array(buffers[1]).subarray(
              (capacity - 1) * 40,
            );
            assert(
              tail.every((v, i) => v === worlds[1].unused[i]),
              "Unused records survive in-place rearrangement",
            );
          }
        }
      } finally {
        worlds.forEach(({ g }) => g.destroy());
      }
    }
  });
  for (const failure of ["overflow", "clashes"])
    await test(`GPU movement batching ${failure} restores public body layout before recovery`, async () => {
      const ref = new Solver();
      new Rigid(ref, [20, 20, 2], 0, 0.7, [0, 0, -1]);
      new Rigid(ref, [1, 1, 1], 1, 0.7, [0, 0, 0.5]);
      new Rigid(ref, [1, 1, 1], 1, 0.7, [0, 0, 1.5]);
      const g = new AppGpuSolver3D(device, ref, {
        solverMode: "points",
        spatialSort: false,
      });
      try {
        const before = await g.readBodies(),
          capacity = g.contactCapacity;
        if (failure === "overflow") g.contactCapacity = 1;
        else {
          g.colorCap = 1;
          g.colorRounds = 2;
        }
        g.step();
        const counters = await g.readCounters(),
          after = await g.readBodies();
        assert(counters[failure] > 0, "Incomplete topology is reported");
        for (let i = 0; i < g.bodyCount; i++)
          for (const field of [
            0, 1, 2, 3, 4, 5, 6, 7, 32, 33, 34, 35, 36, 37, 38, 39,
          ])
            assert(
              before[i * 40 + field] === after[i * 40 + field],
              "Invalid step holds pose and velocities in public layout",
            );
        g.contactCapacity = capacity;
        g.adapt(counters);
        g.step();
        const recovered = await g.readCounters();
        assert(
          !recovered.overflow && !recovered.clashes,
          "Recovery resumes complete solving",
        );
        assert(
          (await g.readBodies()).every(Number.isFinite),
          "Recovered records are finite",
        );
      } finally {
        g.destroy();
      }
    });
  await test("GPU movement batching retains mobile compatibility layouts", async () => {
    const previous = gpuExecutionPolicy3D(device);
    try {
      for (const policy of [
        { scalarPrimal: true },
        { portableContactMath: true },
        { dispatchIsolation: true },
      ]) {
        setGpuExecutionPolicy3D(device, policy);
        const ref = new Solver();
        new Rigid(ref, [1, 1, 1], 1, 0.5, [0, 0, 3]);
        const g = new AppGpuSolver3D(device, ref, { solverMode: "points" });
        try {
          assert(
            !g
              .solveSource(pointLanesContactSolve)
              .includes("fn compactBodySlot"),
            "Qualified mobile paths retain ordinary body records",
          );
          g.step();
          assert(
            (await g.readBodies()).every(Number.isFinite),
            "Compatible solver advances",
          );
        } finally {
          g.destroy();
        }
      }
    } finally {
      setGpuExecutionPolicy3D(device, previous);
    }
  });
}
