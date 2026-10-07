import {
  AVBDSolverGPU,
  createWebGPUDevice,
  SHAPE_SPHERE,
  SHAPE_BOX,
  SHAPE_CAPSULE,
  SHAPE_CYLINDER,
  SHAPE_TRIANGLE,
  SHAPE_TRIANGLE_MESH,
} from "./legacy/avbd.js";
import { GPUAABBNeighborBuilder } from "../demo/gpuBroadphase.js";
import { assert, close, readBuffer } from "./helpers/gpu.js";
import { stressTests } from "./gpu-stress.js";
import { canonicalGpuTests } from "./gpu-canonical.js";
import { canonicalGpu2DTests } from "./gpu-canonical2d.js";
import { babylonGpuTests } from "./gpu-babylon.js";
import { packageFeatureGpuTests } from "./gpu-package-features.js";
import { clothGpuTests } from "./gpu-cloth.js";
import { shapeGpu2DTests } from "./gpu-shapes2d.js";
import { hullGpu2DTests } from "./gpu-hulls2d.js";
import { releaseApiGpuTests } from "./gpu-release-api.js";
import { nativeConvenienceGpuTests } from "./gpu-native-convenience.js";
import { editBatchingGpuTests } from "./gpu-edit-batching.js";
import { policyGpu2DTests } from "./gpu-policy2d.js";
import {
  projectedContactSolve,
  pointLanesContactSolve,
} from "../src/gpu/gpuSolverKernels.js";
import { contactSchedulingGpuTests } from "./gpu-contact-scheduling.js";
import { contactPortabilityGpuTests } from "./gpu-contact-portability.js";
import { hplocGpuTests } from "./gpu-hploc.js";
import { solverSelectionGpuTests } from "./gpu-solver-selection.js";
import { startGpuStressDemo } from "./legacy/gpuStressDemo.js";

const output = document.querySelector("#results");
const result = {
  done: false,
  passed: 0,
  failed: 0,
  cases: [],
  validationErrors: [],
};
globalThis.__GPU_TEST_RESULT__ = result;
const lines = [];
const log = (line) => {
  lines.push(line);
  output.textContent = lines.join("\n");
};
let device;
const test = async (name, fn) => {
  const filter = new URLSearchParams(location.search).get("filter");
  if (filter && !name.includes(filter)) return;
  device.pushErrorScope("validation");
  let failure;
  try {
    await fn();
    await device.queue.onSubmittedWorkDone();
  } catch (error) {
    failure = error;
  }
  const validation = await device.popErrorScope();
  if (validation) failure = new Error(validation.message);
  result.cases.push({ name, passed: !failure, error: failure?.message });
  result[failure ? "failed" : "passed"]++;
  log(
    `${failure ? "FAIL" : "PASS"} ${name}${failure ? ": " + failure.message : ""}`,
  );
};

async function withSolver(fn, options = {}) {
  const solver = await AVBDSolverGPU.create(device, {
    bodyCap: 1,
    neighborCap: 1,
    worldMin: [-10, 0, -10],
    worldMax: [10, 20, 10],
    damping: 1,
    iterations: 12,
    contactSlop: 0.001,
    ...options,
  });
  try {
    await fn(solver);
    await device.queue.onSubmittedWorkDone();
  } finally {
    solver.destroy();
  }
}
function upload(
  solver,
  positions,
  { velocities, masses, kinds, shapes, active, accel } = {},
) {
  const count = positions.length / 3;
  solver.setBodies({
    count,
    pos: new Float32Array(positions),
    vel: new Float32Array(velocities ?? count * 3),
    mass: new Float32Array(masses ?? Array(count).fill(1)),
    shapeType: new Uint32Array(kinds ?? Array(count).fill(SHAPE_SPHERE)),
    shapeParam: new Float32Array(
      shapes ??
        Array.from({ length: count * 4 }, (_, i) => (i % 4 === 0 ? 0.2 : 0)),
    ),
    active: active && new Uint8Array(active),
    accel: accel && new Float32Array(accel),
  });
  solver.setNeighbors(new Uint32Array(count + 1), new Uint32Array());
  solver.resetWarmStart();
}

try {
  let adapter;
  ({ adapter, device } = await createWebGPUDevice({
    requiredLimits: { maxStorageBuffersPerShaderStage: 9 },
  }));
  result.hardware =
    adapter.info?.description ||
    adapter.info?.device ||
    adapter.info?.vendor ||
    "Unknown adapter";
  device.addEventListener("uncapturederror", (event) => {
    result.validationErrors.push(event.error.message);
    log("VALIDATION ERROR: " + event.error.message);
  });
  await test("AVBD shader compilation", () =>
    withSolver(async (solver) => {
      const info = await solver.module.getCompilationInfo();
      assert(
        !info.messages.some((m) => m.type === "error"),
        "shader has compilation errors",
      );
    }));
  for (const iterations of [1, 20])
    await test(`AVBD analytic free flight at ${iterations} iterations`, () =>
      withSolver(async (solver) => {
        upload(solver, [0, 5, 0], { velocities: [1, 0, 0], accel: [0, 2, 0] });
        solver.step({ dt: 1 / 120, iterations, globalAccel: [0, -10, 0] });
        const p = await solver.readPositions();
        close(p[0], 1 / 120);
        close(p[1], 5 - 8 / 120 ** 2, 1e-5, "gravity applied once");
      }));
  await test("AVBD floor resting height and frictionless tangent", () =>
    withSolver(async (solver) => {
      upload(solver, [-2, 0.2, 0], { velocities: [1, 0, 0] });
      for (let i = 0; i < 240; i++)
        solver.step({ dt: 1 / 120, globalAccel: [0, -10, 0] });
      const p = await solver.readPositions();
      close(p[1], 0.2, 0.01, "floor height");
      close(p[0], 0, 0.005, "tangential free motion");
    }));
  await test("AVBD static and inactive slots stay fixed", () =>
    withSolver(async (solver) => {
      upload(solver, [0, 5, 0, 1, 5, 0], {
        masses: [0, 1],
        active: [1, 0],
        velocities: [2, 1, 0, 3, 1, 0],
      });
      solver.step({ dt: 1 / 60, globalAccel: [0, -10, 0] });
      const p = await solver.readPositions();
      [0, 5, 0, 1, 5, 0].forEach((v, i) => close(p[i], v));
    }));
  const shapeParams = {
    [SHAPE_SPHERE]: [0.2, 0, 0, 0],
    [SHAPE_BOX]: [0.2, 0.2, 0.2, 0],
    [SHAPE_CAPSULE]: [0.2, 0.3, 1, 0],
  };
  for (const [a, b] of [
    [0, 0],
    [0, 1],
    [0, 3],
    [1, 1],
    [1, 3],
    [3, 3],
  ])
    await test(`AVBD collider pair ${a}/${b} separates symmetrically`, () =>
      withSolver(async (solver) => {
        upload(solver, [-0.18, 3, 0, 0.18, 3, 0], {
          kinds: [a, b],
          shapes: [...shapeParams[a], ...shapeParams[b]],
        });
        solver.setNeighbors(
          new Uint32Array([0, 1, 2]),
          new Uint32Array([1, 0]),
        );
        solver.step({ dt: 1 / 120, globalAccel: [0, 0, 0] });
        const p = await solver.readPositions();
        close(p[0] + p[3], 0, 1e-5, "center of mass");
        assert(
          p[3] - p[0] > 0.39 && p[3] - p[0] < 0.43,
          `separation ${p[3] - p[0]}`,
        );
      }));
  await test("AVBD capacity growth preserves packed bodies and contacts", () =>
    withSolver(async (solver) => {
      upload(solver, [0, 3, 0, 1, 4, 0]);
      solver.setNeighbors(new Uint32Array([0, 1, 2]), new Uint32Array([1, 0]));
      const before = new Uint8Array(
        await readBuffer(device, solver.buffers.bodies, 160),
      );
      solver.ensureCapacity({ bodyCap: 129, neighborCap: 2049 });
      const after = new Uint8Array(
        await readBuffer(device, solver.buffers.bodies, 160),
      );
      assert(
        before.every((v, i) => after[i] === v),
        "body records survive growth",
      );
      const neighbors = new Uint32Array(
        await readBuffer(device, solver.buffers.dynNeighbors, 8),
      );
      assert(
        neighbors[0] === 1 && neighbors[1] === 0,
        "neighbor records survive growth",
      );
    }));
  await test("AVBD body-range update preserves adjacent records", () =>
    withSolver(async (solver) => {
      upload(solver, [0, 3, 0, 1, 4, 0, 2, 5, 0]);
      solver.setBodyRange({
        start: 1,
        count: 1,
        pos: new Float32Array([3, 6, 0]),
      });
      const p = await solver.readPositions();
      [0, 3, 0, 3, 6, 0, 2, 5, 0].forEach((v, i) => close(p[i], v));
    }));
  await test("AVBD warm-start reset clears every pair and world slot", () =>
    withSolver(async (solver) => {
      upload(solver, [0, 3, 0, 1, 3, 0]);
      solver.configureFixedNeighborLayout(8);
      const words = solver.buffers.warmStart.size / 4;
      device.queue.writeBuffer(
        solver.buffers.warmStart,
        0,
        new Float32Array(words).fill(7),
      );
      solver.resetWarmStart();
      assert(
        new Float32Array(
          await readBuffer(device, solver.buffers.warmStart),
        ).every((v) => v === 0),
        "full dual buffer is zero",
      );
      device.queue.writeBuffer(
        solver.buffers.warmStart,
        0,
        new Float32Array(words).fill(7),
      );
      solver.resetWarmStartRange(1, 1);
      const values = new Float32Array(
        await readBuffer(device, solver.buffers.warmStart),
      );
      assert(
        values.subarray(0, solver.neighborCount * 4).every((v) => v === 0),
        "incoming and outgoing pair duals cleared",
      );
      const base = solver.neighborCount * 4;
      assert(
        values.subarray(base, base + 24).every((v) => v === 7),
        "unaffected world duals retained",
      );
      assert(
        values.subarray(base + 24, base + 48).every((v) => v === 0),
        "six reset world contacts cleared",
      );
    }));
  await test("AVBD repeated runs are deterministic after reset", () =>
    withSolver(async (solver) => {
      const run = async () => {
        upload(solver, [-0.18, 3, 0, 0.18, 3, 0]);
        solver.setNeighbors(
          new Uint32Array([0, 1, 2]),
          new Uint32Array([1, 0]),
        );
        for (let i = 0; i < 30; i++)
          solver.step({ dt: 1 / 120, globalAccel: [0, -10, 0] });
        return solver.readPositions();
      };
      const a = await run(),
        b = await run();
      assert(
        a.every((v, i) => v === b[i]),
        "identical input gives identical GPU trajectory",
      );
    }));
  await test("AVBD Jacobi contacts synchronize across multiple workgroups", () =>
    withSolver(async (solver) => {
      const count = 130,
        positions = [],
        offsets = new Uint32Array(count + 1),
        neighbors = new Uint32Array(count);
      for (let i = 0; i < count; i++) {
        const pair = i >> 1;
        positions.push(
          (pair % 10) * 0.7 - 3 + (i % 2 ? 0.18 : -0.18),
          3 + Math.floor(pair / 10) * 0.7,
          0,
        );
        offsets[i] = i;
        neighbors[i] = i ^ 1;
      }
      offsets[count] = count;
      upload(solver, positions);
      solver.setNeighbors(offsets, neighbors);
      solver.step({ dt: 1 / 120, globalAccel: [0, 0, 0] });
      const p = await solver.readPositions();
      for (let i = 0; i < count; i += 2) {
        close(
          p[i * 3] + p[(i + 1) * 3],
          positions[i * 3] + positions[(i + 1) * 3],
          1e-5,
          `pair ${i / 2} center`,
        );
        assert(p[(i + 1) * 3] - p[i * 3] > 0.39, `pair ${i / 2} separation`);
      }
    }));
  await test("GPU broadphase matches mixed-shape brute force on all axes", () =>
    withSolver(async (solver) => {
      const count = 30,
        positions = [],
        kinds = [],
        shapes = [],
        active = [],
        extents = [];
      for (let i = 0; i < count; i++) {
        const kind = [
          SHAPE_SPHERE,
          SHAPE_BOX,
          SHAPE_CAPSULE,
          SHAPE_CYLINDER,
          SHAPE_TRIANGLE,
          SHAPE_TRIANGLE_MESH,
        ][i % 6];
        const axis = Math.floor(i / 6) % 3;
        positions.push(
          (i % 5) * 0.31 - 0.5,
          3 + (Math.floor(i / 5) % 3) * 0.31,
          Math.floor(i / 15) * 0.31,
        );
        kinds.push(kind);
        active.push(i % 13 === 0 ? 0 : 1);
        const p =
          kind === SHAPE_SPHERE
            ? [0.2, 0, 0, 0]
            : [SHAPE_CAPSULE, SHAPE_CYLINDER].includes(kind)
              ? [0.12, 0.5, axis, 0]
              : [0.2, 0.15, 0.18, 0];
        shapes.push(...p);
        const h =
          kind === SHAPE_SPHERE
            ? [0.2, 0.2, 0.2]
            : [SHAPE_CAPSULE, SHAPE_CYLINDER].includes(kind)
              ? [0.12, 0.12, 0.12]
              : p.slice(0, 3);
        if (kind === SHAPE_CAPSULE) h[axis] += 0.5;
        if (kind === SHAPE_CYLINDER) h[axis] = 0.5;
        extents.push(h);
      }
      upload(solver, positions, { kinds, shapes, active });
      solver.configureFixedNeighborLayout(count);
      const buffers = solver.getGpuBuffers();
      const bp = await GPUAABBNeighborBuilder.create(device, {
        bodyBuffer: buffers.bodies,
        neighborBuffer: buffers.neighbors,
        bodyCapacity: count,
        maxNeighbors: count,
        padding: 0,
      });
      try {
        bp.build(count);
        const neighbors = new Uint32Array(
          await readBuffer(device, buffers.neighbors, count * count * 4),
        );
        for (let a = 0; a < count; a++) {
          const actual = [
            ...neighbors.subarray(a * count, (a + 1) * count),
          ].filter((id) => id !== 0xffffffff);
          const expected = [];
          for (let b = 0; b < count; b++)
            if (
              a !== b &&
              active[a] &&
              active[b] &&
              extents[a].every(
                (h, k) =>
                  Math.abs(positions[a * 3 + k] - positions[b * 3 + k]) <=
                  h + extents[b][k],
              )
            )
              expected.push(b);
          assert(
            JSON.stringify(actual) === JSON.stringify(expected),
            `body ${a}: ${actual} vs ${expected}`,
          );
        }
        const stats = new Uint32Array(await readBuffer(device, bp.stats));
        assert(stats[0] > 0 && stats[1] === 0, "pairs counted, no overflow");
        solver.step({ dt: 1 / 120, globalAccel: [0, 0, 0] });
        assert(
          (await solver.readPositions()).every(Number.isFinite),
          "GPU-generated neighbors feed AVBD directly",
        );
      } finally {
        bp.destroy();
      }
    }));
  await test("GPU broadphase reports overflow and clears stale slots", () =>
    withSolver(async (solver) => {
      upload(solver, [0, 3, 0, 0, 3, 0, 0, 3, 0]);
      solver.configureFixedNeighborLayout(1);
      const buffers = solver.getGpuBuffers();
      const bp = await GPUAABBNeighborBuilder.create(device, {
        bodyBuffer: buffers.bodies,
        neighborBuffer: buffers.neighbors,
        bodyCapacity: 3,
        maxNeighbors: 1,
        padding: 0,
      });
      try {
        bp.build(3);
        const stats = new Uint32Array(await readBuffer(device, bp.stats));
        assert(stats[0] === 3 && stats[1] === 3, `overflow counters ${stats}`);
        solver.setBodyRange({
          start: 0,
          count: 3,
          active: new Uint8Array([0, 0, 0]),
        });
        bp.build(3);
        assert(
          new Uint32Array(
            await readBuffer(device, buffers.neighbors, 12),
          ).every((v) => v === 0xffffffff),
          "stale neighbors cleared",
        );
      } finally {
        bp.destroy();
      }
    }));
  await stressTests(device, test);
  await canonicalGpuTests(device, test);
  await canonicalGpuTests(device, (name, fn) => test("Optimized " + name, fn), {
    solve: projectedContactSolve,
  });
  await canonicalGpuTests(
    device,
    (name, fn) => test("Parallel points " + name, fn),
    {
      solve: pointLanesContactSolve,
    },
  );
  await contactSchedulingGpuTests(device, test);
  await contactPortabilityGpuTests(device, test);
  await hplocGpuTests(device, test);
  await solverSelectionGpuTests(device, test);
  await canonicalGpu2DTests(device, test);
  await babylonGpuTests(device, test);
  await packageFeatureGpuTests(device, test);
  await clothGpuTests(device, test);
  await shapeGpu2DTests(device, test);
  await hullGpu2DTests(device, test);
  await nativeConvenienceGpuTests(device, test);
  await editBatchingGpuTests(device, test);
  await releaseApiGpuTests(device, test);
  await policyGpu2DTests(device, test);
  await test("100K application renders, resets and switches every projectile collider", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    let app;
    const frames = async () => {
      for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    };
    try {
      app = await startGpuStressDemo({ root });
      root.querySelector('[data-action="auto"]').checked = false;
      const selector = root.querySelector('[data-action="collider"]');
      for (const kind of ["sphere", "box", "capsule"]) {
        selector.value = kind;
        selector.dispatchEvent(new Event("change"));
        root.querySelector('[data-action="shoot"]').click();
        await frames();
        await app.waitForIdle();
        const stats = root.querySelector(".gpu-stress-stats").textContent;
        assert(
          stats.includes("100,000 blocks") &&
            stats.includes(`Projectile ${kind}`),
          `${kind}: actual scene rendered`,
        );
        assert(
          stats.includes("Contact cache") &&
            stats.includes("GPU physics incl grid"),
          "cache and complete timing visible",
        );
      }
      root.querySelector('[data-action="reset"]').click();
      await frames();
      await app.waitForIdle();
    } finally {
      app?.dispose();
      root.remove();
    }
  });
} catch (error) {
  result.failed++;
  log("FAIL setup: " + error.stack);
} finally {
  if (device) {
    await device.queue.onSubmittedWorkDone();
    device.destroy();
  }
  result.failed += result.validationErrors.length;
  result.done = true;
  log(
    `${result.failed ? "GPU TESTS FAILED" : "ALL GPU TESTS PASSED"}: ${result.passed} passed, ${result.failed} failed`,
  );
  document.body.dataset.testStatus = result.failed ? "failed" : "passed";
}
