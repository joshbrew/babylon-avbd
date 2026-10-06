import { clothsOf } from "../reference/three-avbd/src/avbd3d/visuals.ts";
import { IgnoreCollision } from "../reference/three-avbd/src/avbd3d/ref/forces.ts";

// The continuous drawing must not bridge empty collision space between patches.
// Overlap the plates at their seams, and exclude the eight immediate neighbors:
// they form one material patch, so their overlap is not a self-collision. Distant
// patches still collide when the net folds. Keep total fabric mass unchanged.
export function prepareRigidNet(solver) {
  const grid = clothsOf(solver)[0];
  const pitch = Math.abs(grid[1][0].positionLin[0] - grid[0][0].positionLin[0]);
  const width = pitch + 0.02;
  for (const row of grid)
    for (const body of row) {
      body.size[0] = body.size[1] = width;
      const [x, y, z] = body.size;
      body.radius = Math.hypot(x, y, z) / 2;
      body.moment.set([
        (body.mass * (y * y + z * z)) / 12,
        (body.mass * (x * x + z * z)) / 12,
        (body.mass * (x * x + y * y)) / 12,
      ]);
    }
  for (let x = 0; x < grid.length - 1; x++)
    for (let y = 0; y < grid[0].length - 1; y++) {
      new IgnoreCollision(solver, grid[x][y], grid[x + 1][y + 1]);
      new IgnoreCollision(solver, grid[x + 1][y], grid[x][y + 1]);
    }
  return {
    pitch,
    plateWidth: width,
    seamOverlap: width - pitch,
    neighborExclusion: "eight adjacent plates",
  };
}
