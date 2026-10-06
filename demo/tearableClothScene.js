import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { Spring } from "../reference/three-avbd/src/avbd3d/ref/forces.ts";
import { clothSolve } from "../src/gpu/gpuClothSolver.js";
import { setInitialSpringMaterial } from "../src/gpu/springMaterial.js";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import {
  addCloth,
  setVisual,
} from "../reference/three-avbd/src/avbd3d/visuals.ts";
import { addTearableCloth } from "./clothTopology.js";
export const tearableClothScene = {
  id: "3d-tearable-cloth",
  name: "Tearable cloth · falling ball",
  dimension: 3,
  gpuOnly: true,
  tearable: true,
  stepsPerFrame: 2,
  description:
    "An elastic sheet hangs from four reinforced corners. Strength increases from the center toward the attachments. Torn fabric stays visible and physical, with no automatic lifetime. Pull out a patch to watch a separated piece fall, or drag the fabric to tear it. Collisions sample the fabric points, not triangle interiors.",
};
// Reinforcement is distributed over a patch rather than concentrated in the
// three springs touching each pin. Evaluate it in the undeformed sheet so the
// material stays attached to the fabric as it stretches and folds.
export function tearableMaterialAt(u, v) {
  const edge = Math.max(Math.abs(2 * u - 1), Math.abs(2 * v - 1));
  const cornerDistance = Math.hypot(Math.min(u, 1 - u), Math.min(v, 1 - v));
  const t = Math.max(0, 1 - cornerDistance / 0.28);
  const reinforcement = t * t * (3 - 2 * t);
  return {
    stiffnessScale: 1 + 3 * reinforcement,
    breakStrain: 0.35 + 0.55 * edge * edge + 1.1 * reinforcement,
  };
}
export function buildTearableCloth(def, solver) {
  solver.dt = 1 / 120;
  solver.iterations = 10;
  new Rigid(solver, [20, 20, 1], 0, 0.6, [0, 0, -0.5]);
  const n = 32,
    s = 0.25,
    mass = 0.02,
    stiffness = 1000,
    anchorStiffness = 4000,
    breakStrain = 0.35;
  const grid = Array.from({ length: n }, (_, x) =>
    Array.from({ length: n }, (_, y) => {
      const corner = (x === 0 || x === n - 1) && (y === 0 || y === n - 1);
      const point = sphere(solver, s / Math.SQRT2, corner ? 0 : 1, 0.5, [
        (x - (n - 1) / 2) * s,
        (y - (n - 1) / 2) * s,
        4,
      ]);
      point.mass = corner ? 0 : mass;
      point.moment.fill(0);
      return point;
    }),
  );
  const horizontal = Array.from({ length: n }, () => []),
    vertical = Array.from({ length: n }, () => []),
    bonds = [];
  const bond = (a, b, k = stiffness) => {
    const halfSpan = ((n - 1) * s) / 2;
    const material = tearableMaterialAt(
      (a.positionLin[0] + b.positionLin[0]) / (4 * halfSpan) + 0.5,
      (a.positionLin[1] + b.positionLin[1]) / (4 * halfSpan) + 0.5,
    );
    const spring = new Spring(
      solver,
      a,
      b,
      [0, 0, 0],
      [0, 0, 0],
      k * material.stiffnessScale,
    );
    setInitialSpringMaterial(spring, { breakStrain: material.breakStrain });
    bonds.push(spring);
    return spring;
  };
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) {
      if (x < n - 1) horizontal[x][y] = bond(grid[x][y], grid[x + 1][y]);
      if (y < n - 1) vertical[x][y] = bond(grid[x][y], grid[x][y + 1]);
    }
  const triangles = [];
  for (let x = 0; x < n - 1; x++)
    for (let y = 0; y < n - 1; y++) {
      const a = grid[x][y],
        b = grid[x + 1][y],
        c = grid[x][y + 1],
        d = grid[x + 1][y + 1];
      const diagonal = bond(b, c, stiffness / 2);
      bond(a, d, stiffness / 2);
      triangles.push(
        {
          bodies: [a, b, c],
          bonds: [horizontal[x][y], vertical[x][y], diagonal],
          uv: [
            x / (n - 1),
            y / (n - 1),
            (x + 1) / (n - 1),
            y / (n - 1),
            x / (n - 1),
            (y + 1) / (n - 1),
          ],
        },
        {
          bodies: [b, d, c],
          bonds: [vertical[x + 1][y], horizontal[x][y + 1], diagonal],
          uv: [
            (x + 1) / (n - 1),
            y / (n - 1),
            (x + 1) / (n - 1),
            (y + 1) / (n - 1),
            x / (n - 1),
            (y + 1) / (n - 1),
          ],
        },
      );
    }
  addCloth(solver, grid);
  addTearableCloth(solver, { grid, triangles, bonds });
  const radius = 0.4,
    ball = sphere(
      solver,
      radius,
      50 / ((4 / 3) * Math.PI * radius ** 3),
      0.3,
      [0.08, 0.05, 7],
    );
  setVisual(ball, { color: 0xef754c });
  return {
    def,
    solver,
    tearable: { bonds, ball, triangles },
    gpuOptions: {
      shaders: { solve: clothSolve },
      capacity: {
        contacts: 32_000,
        pairs: 20_000,
        manifolds: 8_000,
        colors: 16,
      },
      minimumColors: 16,
      minimumColorRounds: 16,
    },
    workload: {
      clothPoints: n * n,
      pinnedPoints: 4,
      stiffness,
      anchorStiffness,
      breakStrain,
      edgeBreakStrain: 0.9,
      cornerBreakStrain: 2,
      reinforcementRadius: 0.28 * (n - 1) * s,
      model: "elastic mass-spring fabric",
    },
    camera: {
      target: [0, 0, 2.3],
      distance: 13,
      azimuth: -110,
      elevation: 0.28,
    },
  };
}
