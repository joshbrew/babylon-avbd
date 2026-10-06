import { Solver } from "../reference/three-avbd/src/avbd2d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd2d/ref/body.ts";
import { SoaSolver2D } from "../reference/three-avbd/src/avbd2d/soa/solver.ts";
import { SoaSim } from "../reference/three-avbd/src/avbd2d/sim.ts";

// Equal-sized, initially touching boxes expose sustained contact costs rather
// than timing a cloud of separated bodies. Counts exclude the three boundaries.
export const stressScenes2D = [
  { id: "2d-stress-pile-10k", name: "Dense pile 10K", columns: 100, rows: 100 },
  { id: "2d-stress-pile-50k", name: "Dense pile 50K", columns: 500, rows: 100 },
  {
    id: "2d-stress-pile-100k",
    name: "Dense pile 100K",
    columns: 1000,
    rows: 100,
  },
];

export function buildStressScene2D(def) {
  const ref = new Solver();
  ref.iterations = 10;
  const { columns, rows } = def;
  new Rigid(ref, [columns + 4, 1], 0, 0.6, [0, -0.5, 0]);
  for (const sign of [-1, 1])
    new Rigid(ref, [1, rows + 4], 0, 0.6, [
      sign * (columns / 2 + 0.5),
      rows / 2,
      0,
    ]);
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++)
      new Rigid(ref, [1, 1], 1, 0.6, [col - (columns - 1) / 2, row + 0.5, 0]);
  const mirror = new SoaSolver2D({ precision: "f32", order: "colored" });
  mirror.loadFromReference(ref);
  return {
    def,
    sim: new SoaSim(mirror, "GPU stress scene"),
    gpuParams: { dt: 1 / 60, iterations: 10, gravity: -10 },
    // The upstream 2D solver reserves four contacts per allocated body slot.
    // Reserve eight per live box for dense piles; unused slots are not simulated.
    gpuOptions2D: { bodyCapacity: 2 * mirror.bodyCount + 4096 },
  };
}
