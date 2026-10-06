import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { Spring } from "../reference/three-avbd/src/avbd3d/ref/forces.ts";
import { GpuSolver3D } from "../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import { clothPoint, buildCloth } from "../demo/paperScenes.js";
import { clothSolve } from "../src/gpu/gpuClothSolver.js";
import { assert, close } from "./helpers/gpu.js";
import { AvbdScene3D } from "../src/index.js";

const options = {
  spatialSort: false,
  shaders: { solve: clothSolve },
  capacity: { colors: 32 },
  colorRounds: 32,
};
async function steps(gpu, n) {
  for (let i = 0; i < n; i++) {
    gpu.step();
    const c = await gpu.readCounters();
    assert(
      !c.overflow && !c.clashes,
      "cloth contacts fit and colors have no conflicts",
    );
  }
  const b = await gpu.readBodies();
  assert(b.every(Number.isFinite), "finite cloth state");
  return b;
}
export async function clothGpuTests(device, test) {
  await test("fabric material varies across the sheet and reaches the GPU spring rows", async () => {
    const scene = new AvbdScene3D({ timeStep: 1 / 120 });
    let evaluations = 0;
    const fabric = scene.addFabric({
      columns: 8,
      rows: 8,
      pinCorners: true,
      bendingStiffness: 0,
      materialAt: (u, v) => {
        assert(
          u >= 0 && u <= 1 && v >= 0 && v <= 1,
          "undeformed midpoint coordinates",
        );
        evaluations++;
        const edge = Math.max(Math.abs(2 * u - 1), Math.abs(2 * v - 1));
        return {
          stiffnessScale: 1 + 3 * edge ** 2,
          breakStrain: 0.35 + 0.55 * edge ** 2,
        };
      },
    });
    assert(
      evaluations === fabric.connections.length,
      "each physical spring receives a material",
    );
    const gpu = scene.createSolver(device, {
      capacity: { colors: 16 },
      minimumColors: 16,
      minimumColorRounds: 16,
    });
    try {
      const rows = await gpu.readJoints();
      for (const [force, handle] of scene.handles) {
        const u =
          (force.bodyA.positionLin[0] + force.bodyB.positionLin[0]) /
            (4 * 0.7) +
          0.5;
        const v =
          (force.bodyA.positionLin[2] + force.bodyB.positionLin[2]) /
            (4 * 0.7) +
          0.5;
        const edge = Math.max(Math.abs(2 * u - 1), Math.abs(2 * v - 1));
        close(
          rows[handle.slot * 32 + 3],
          force.stiffness,
          0.001,
          "profile stiffness uploaded",
        );
        close(
          rows[handle.slot * 32 + 11],
          0.35 + 0.55 * edge ** 2,
          1e-6,
          "profile fracture threshold uploaded",
        );
      }
      await steps(gpu, 120);
    } finally {
      gpu.destroy();
    }
    for (const materialAt of [
      false,
      () => ({ stiffnessScale: -1 }),
      () => ({ breakStrain: 0 }),
      () => {
        throw Error("caller profile failed");
      },
    ]) {
      let rejected = false;
      const invalidScene = new AvbdScene3D();
      const existing = invalidScene.addBox([1, 1, 1]);
      try {
        invalidScene.addFabric({ columns: 2, rows: 2, materialAt });
      } catch {
        rejected = true;
      }
      assert(rejected, "invalid material profile rejected before GPU upload");
      assert(
        invalidScene.bodies.length === 1 &&
          invalidScene.bodies[0] === existing &&
          invalidScene.handles.size === 0,
        "failed profile leaves no partial fabric",
      );
    }
  });
  await test("four-corner fabric leaves its edges free and a middle cut drops both halves", async () => {
    const results = [];
    for (const cut of [false, true]) {
      const scene = new AvbdScene3D({ timeStep: 1 / 120, iterations: 10 });
      const fabric = scene.addFabric({
        columns: 8,
        rows: 8,
        spacing: 0.4,
        origin: [0, 6, 0],
        mass: 0.02,
        stiffness: 1000,
        anchorStiffness: 4000,
        pinCorners: true,
        bendingStiffness: 0,
      });
      const initial = fabric.points.map((p) => [...p.positionLin]);
      assert(
        fabric.points.filter((p) => p.mass === 0).length === 4,
        "exactly four pinned corners",
      );
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          const corner = (x === 0 || x === 7) && (y === 0 || y === 7);
          close(
            fabric.grid[y][x].mass,
            corner ? 0 : 0.02,
            1e-8,
            "all non-corner edges remain dynamic",
          );
        }
      const gpu = scene.createSolver(device, {
        capacity: { colors: 16 },
        minimumColors: 16,
        minimumColorRounds: 16,
      });
      try {
        await steps(gpu, 240);
        if (cut) {
          // Cut every stretch/shear link crossing the middle. No long-range
          // bending links may bridge a tear and keep the halves attached.
          let count = 0;
          for (const [force, handle] of scene.handles) {
            if (
              force.bodyA.positionLin[2] < 0 !==
              force.bodyB.positionLin[2] < 0
            ) {
              gpu.disableConstraint(handle.slot);
              count++;
            }
          }
          assert(
            count === 22,
            "complete middle cut including diagonal springs",
          );
        }
        const state = await steps(gpu, 600);
        for (let i = 0; i < fabric.points.length; i++)
          if (fabric.points[i].mass === 0) {
            const o = gpu.gpuIndex(scene.bodies.indexOf(fabric.points[i])) * 40;
            for (let k = 0; k < 3; k++)
              close(
                state[o + k],
                initial[i][k],
                1e-6,
                "corner anchor stays fixed",
              );
          }
        const heights = [
          [0, 3],
          [7, 3],
          [3, 3],
          [4, 4],
        ].map(
          ([x, y]) =>
            state[
              gpu.gpuIndex(scene.bodies.indexOf(fabric.grid[y][x])) * 40 + 1
            ],
        );
        results.push(heights);
      } finally {
        gpu.destroy();
      }
    }
    assert(
      results[0][0] < 5.95 && results[0][1] < 5.95,
      "free perimeter sags even before a cut",
    );
    for (let i = 0; i < 4; i++)
      assert(
        results[1][i] < results[0][i] - 0.3,
        `middle cut drops free edges and centers: ${JSON.stringify(results)}`,
      );
    const defaultFabric = new AvbdScene3D().addFabric({ columns: 5, rows: 5 });
    assert(
      defaultFabric.points.filter((p) => p.mass === 0).length === 16,
      "existing edge-pinned default remains available",
    );
  });
  await test("dense-scene coloring budget survives quiet counter adaptation", async () => {
    const s = new Solver();
    clothPoint(s, [0, 0, 10], 0.02, 0.1);
    const gpu = new AppGpuSolver3D(device, s, {
      ...options,
      minimumColors: 16,
      minimumColorRounds: 16,
    });
    try {
      for (let i = 0; i < 20; i++) {
        gpu.step();
        const c = await gpu.readCounters();
        gpu.adapt(c);
        assert(!c.overflow && !c.clashes, "valid adapted step");
        assert(
          gpu.colorCap >= 16 && gpu.colorRounds >= 16,
          "minimum coloring budget retained",
        );
      }
    } finally {
      gpu.destroy();
    }
  });
  await test("cloth spring uses geometric stiffness and caps its AVBD penalty", async () => {
    const s = new Solver();
    s.gravity = 0;
    s.iterations = 1;
    const a = clothPoint(s, [0, 0, 0], 0, 0.05),
      b = clothPoint(s, [1, 1, 1], 0.02, 0.05);
    new Spring(s, a, b, [0, 0, 0], [0, 0, 0], 50, 1);
    const gpu = new GpuSolver3D(device, s, options);
    try {
      const state = await steps(gpu, 1),
        len = Math.sqrt(3),
        force = len - 1;
      const geometric = (force / len) * Math.sqrt(2 / 3),
        inertia = b.mass / (s.dt * s.dt);
      const expected = 1 - force / (inertia + 1 + geometric) / len;
      for (const i of [40, 41, 42])
        close(state[i], expected, 2e-6, "3D spring Newton step");
      const joints = await gpu.readJoints();
      close(joints[0], 50, 0, "finite stiffness cap after dual ramp");
      close(joints[8], 0, 0, "no finite-spring lambda");
    } finally {
      gpu.destroy();
    }
  });
  await test("cloth point follows analytic free fall without angular motion", async () => {
    const s = new Solver();
    s.iterations = 10;
    clothPoint(s, [0, 0, 10], 0.02, 0.1);
    const gpu = new GpuSolver3D(device, s, options);
    try {
      const b = await steps(gpu, 30);
      close(
        b[2],
        10 + (s.gravity * s.dt * s.dt * 30 * 31) / 2,
        2e-4,
        "semi-implicit free fall",
      );
      close(b[7], 1, 0, "point orientation");
      for (const i of [4, 5, 6, 36, 37, 38])
        close(b[i], 0, 0, "no angular degrees of freedom");
    } finally {
      gpu.destroy();
    }
  });
  await test("cloth finite spring agrees with a closed-form implicit step", async () => {
    const s = new Solver();
    s.gravity = 0;
    s.iterations = 1;
    const a = clothPoint(s, [0, 0, 0], 0, 0.05),
      b = clothPoint(s, [2, 0, 0], 0.02, 0.05);
    new Spring(s, a, b, [0, 0, 0], [0, 0, 0], 1, 1);
    const gpu = new GpuSolver3D(device, s, options);
    try {
      const state = await steps(gpu, 1),
        inertia = b.mass / (s.dt * s.dt);
      close(
        state[40],
        (inertia * 2 + 1) / (inertia + 1),
        2e-6,
        "implicit spring position",
      );
      close(state[0], 0, 0, "fixed anchor");
      const joints = await gpu.readJoints();
      close(joints[0], 1, 0, "penalty does not exceed material stiffness");
      close(
        joints[8],
        0,
        0,
        "finite springs have no hard-constraint multiplier",
      );
    } finally {
      gpu.destroy();
    }
  });
  await test("cloth point has floor support and sliding friction without rolling", async () => {
    const s = new Solver();
    s.iterations = 10;
    new Rigid(s, [20, 20, 1], 0, 0.6, [0, 0, 0]);
    const p = clothPoint(s, [0, 0, 1], 0.02, 0.1);
    p.velocityLin[0] = 1;
    const gpu = new GpuSolver3D(device, s, options);
    try {
      const b = await steps(gpu, 180);
      assert(b[42] > 0.57 && b[42] < 0.63, "point rests on its contact radius");
      assert(Math.abs(b[72]) < 0.02, "friction stops sliding");
      close(b[47], 1, 0, "friction cannot spin a point");
    } finally {
      gpu.destroy();
    }
  });
  await test("deformable cloth catches a rotating rigid block and keeps its border fixed", async () => {
    const run = async (loaded) => {
      const s = new Solver();
      s.iterations = 10;
      new Rigid(s, [30, 30, 1], 0, 0.5, [0, 0, 0]);
      const grid = buildCloth(s, {
        n: 16,
        spacing: 0.3,
        height: 3,
        stiffness: 5000,
      });
      if (loaded) {
        const b = new Rigid(s, [0.8, 0.8, 0.8], 1, 0.5, [0, 0, 4]);
        b.velocityAng.set([0.2, 0.3, 0.1]);
      }
      const gpu = new GpuSolver3D(device, s, options);
      try {
        const b = await steps(gpu, 240);
        for (let x = 0; x < 16; x++)
          for (let y = 0; y < 16; y++) {
            const o = (1 + x * 16 + y) * 40;
            close(b[o + 7], 1, 0, "cloth has no rigid rotations");
            if (x === 0 || y === 0 || x === 15 || y === 15)
              close(b[o + 2], 3, 0, "border stays fixed");
          }
        const middle = (1 + 8 * 16 + 8) * 40;
        if (loaded) {
          const box = b.subarray(257 * 40, 258 * 40);
          assert(
            box[2] > b[middle + 2] + 0.2,
            "cloth supports the block above the fabric",
          );
          assert(
            Math.hypot(...box.subarray(4, 7)) > 0.01,
            "rigid block still rotates",
          );
        }
        return b[middle + 2];
      } finally {
        gpu.destroy();
      }
    };
    const empty = await run(false),
      loaded = await run(true);
    assert(
      empty < 2.99 && loaded < empty - 0.005,
      `fabric sags under added load: empty ${empty}, loaded ${loaded}`,
    );
  });
}
