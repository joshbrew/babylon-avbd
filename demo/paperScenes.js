import { brickGables } from "../reference/three-avbd/src/avbd3d/bench-scenes.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { Joint, Spring } from "../reference/three-avbd/src/avbd3d/ref/forces.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { addCloth } from "../reference/three-avbd/src/avbd3d/visuals.ts";
import { clothSolve } from "../src/gpu/gpuClothSolver.js";

export const paperScenes = [3, 4]
  .map((iterations) => ({
    id: `paper-walls-510k-${iterations}`,
    name: `Half-million brick walls · ${iterations} iterations`,
    dimension: 3,
    gpuOnly: true,
    paper: true,
    iterations,
    description:
      "Two heavy balls roll through 1,088 triangular walls containing 505,920 bricks. This is a reconstruction of the paper's roughly 510K-object example. Three and four iterations are available because the paper lists both.",
  }))
  .concat({
    id: "paper-cloth-35k",
    solverKind: "deformable",
    name: "Deformable cloth + 35K blocks",
    dimension: 3,
    gpuOnly: true,
    paper: true,
    iterations: 10,
    description:
      "35,000 joined blocks fall onto fabric made of 10,000 points. Elastic links let the fabric bend and stretch. Fabric and blocks push on each other in the same GPU solver. Contacts use small spheres at the fabric points, rather than its triangles; this is not an exact copy of the paper's cloth model.",
  });

export function clothPoint(solver, position, mass, radius) {
  const point = sphere(solver, radius, mass > 0 ? 1 : 0, 0.5, position);
  point.mass = mass;
  point.moment.fill(0);
  return point;
}

// A mass-spring sheet: stretch, shear and two-edge bending links. Points have
// three translational degrees of freedom; drawing triangles carry no rigid
// inertia. The contact radius covers gaps between adjacent points in the rest
// mesh. Stretched/folded triangle contacts and CCD are not provided by this model.
export function buildCloth(
  solver,
  { n = 100, spacing = 0.3, height = 8, mass = 0.02, stiffness = 5000 } = {},
) {
  const grid = Array.from({ length: n }, (_, x) =>
    Array.from({ length: n }, (_, y) => {
      const edge = x === 0 || y === 0 || x === n - 1 || y === n - 1;
      return clothPoint(
        solver,
        [(x - (n - 1) / 2) * spacing, (y - (n - 1) / 2) * spacing, height],
        edge ? 0 : mass,
        spacing / Math.SQRT2,
      );
    }),
  );
  const link = (a, b, k) => new Spring(solver, a, b, [0, 0, 0], [0, 0, 0], k);
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) {
      if (x > 0) link(grid[x][y], grid[x - 1][y], stiffness);
      if (y > 0) link(grid[x][y], grid[x][y - 1], stiffness);
      if (x > 0 && y > 0) {
        link(grid[x][y], grid[x - 1][y - 1], stiffness / 2);
        link(grid[x - 1][y], grid[x][y - 1], stiffness / 2);
      }
      if (x > 1) link(grid[x][y], grid[x - 2][y], stiffness / 50);
      if (y > 1) link(grid[x][y], grid[x][y - 2], stiffness / 50);
    }
  addCloth(solver, grid);
  return grid;
}

export function buildPaperScene(def, solver) {
  solver.dt = 1 / 60;
  solver.iterations = def.iterations;
  solver.gravity = -10;
  if (def.id.startsWith("paper-walls")) {
    brickGables(solver);
    // The scene's ground represents solid terrain, not a one-metre platform.
    // Keep its top at z=.5 while giving fast impact debris a deep solid volume
    // to contact in this discrete collision solver. No body poses are clamped.
    const floor = solver.bodies[0];
    const terrain = new Rigid(
      solver,
      [floor.size[0], floor.size[1], 20],
      0,
      floor.friction,
      [0, 0, -9.5],
    );
    solver.bodies.pop();
    solver.bodies[0] = terrain;
    return {
      def,
      solver,
      camera: {
        target: [0, -130, 7],
        distance: 110,
        azimuth: -115,
        elevation: 0.4,
      },
      workload: {
        bricks: 505920,
        balls: 2,
        iterations: def.iterations,
        exactPaperScene: false,
        groundThickness: 20,
      },
    };
  }
  new Rigid(solver, [160, 160, 1], 0, 0.5, [0, 0, 0]);
  buildCloth(solver);
  // 700 articulated patches, 5x5x2 cubes each. A connected subset of face
  // joints (102 for 500 patches, 105 for 200) gives 72,000 rigid joints.
  // These are reproducible test geometry, not the paper's unpublished assets.
  const c = 0.4;
  let patch = 0,
    rigidJoints = 0;
  for (let layer = 0; layer < 7; layer++)
    for (let gx = 0; gx < 10; gx++)
      for (let gy = 0; gy < 10; gy++, patch++) {
        const cells = [];
        const at = (x, y, z) => cells[(x * 5 + y) * 2 + z];
        for (let x = 0; x < 5; x++)
          for (let y = 0; y < 5; y++)
            for (let z = 0; z < 2; z++)
              cells.push(
                new Rigid(solver, [c, c, c], 1, 0.5, [
                  (gx - 4.5) * 2.5 + (x - 2) * c,
                  (gy - 4.5) * 2.5 + (y - 2) * c,
                  10 + layer * 1.4 + z * c,
                ]),
              );
        const join = (a, b, axis) => {
          const r = [0, 0, 0];
          r[axis] = c / 2;
          new Joint(
            solver,
            a,
            b,
            r,
            r.map((v) => -v),
          );
          rigidJoints++;
        };
        for (let x = 0; x < 5; x++)
          for (let y = 0; y < 5; y++)
            for (let z = 0; z < 2; z++) {
              // The omitted top-layer edges are redundant; all nodes remain connected.
              if (x > 0 && !(patch < 500 && z === 1 && y === 0 && x <= 3))
                join(at(x - 1, y, z), at(x, y, z), 0);
              if (y > 0) join(at(x, y - 1, z), at(x, y, z), 1);
              if (z > 0) join(at(x, y, z - 1), at(x, y, z), 2);
            }
      }
  return {
    def,
    solver,
    gpuOptions: {
      shaders: { solve: clothSolve },
      capacity: {
        colors: 32,
        contacts: 600000,
        pairs: 400000,
        manifolds: 200000,
      },
      colorRounds: 32,
    },
    workload: {
      rigidBodies: 35000,
      rigidJoints,
      clothVertices: 10000,
      clothTriangles: 19602,
      clothSprings: solver.forces.filter((f) => f instanceof Spring).length,
      exactPaperScene: false,
      contactModel: "sampled sphere contacts",
    },
    camera: { target: [0, 0, 8], distance: 53, azimuth: -115, elevation: 0.5 },
  };
}
