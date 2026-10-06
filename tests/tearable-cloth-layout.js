import { buildCanonicalScene } from "../demo/canonicalScenes.js";
export function tearableBondLayout() {
  const { solver, tearable } = buildCanonicalScene("3d-tearable-cloth", "gpu");
  return tearable.bonds.map((bond) => {
    const a = bond.bodyA,
      b = bond.bodyB;
    const x = (a.positionLin[0] + b.positionLin[0]) / 2;
    const y = (a.positionLin[1] + b.positionLin[1]) / 2;
    return {
      slot: solver.forces.indexOf(bond),
      x,
      y,
      edge: Math.max(Math.abs(x), Math.abs(y)) / 3.875,
      anchor: a.mass === 0 || b.mass === 0,
      a: solver.bodies.indexOf(a),
      b: solver.bodies.indexOf(b),
    };
  });
}
