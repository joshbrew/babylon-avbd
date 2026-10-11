import { NativeCpuSolver } from "../src/native/cpu/world.js";
import { SoaSim } from "../reference/three-avbd/src/avbd2d/sim.ts";

/** Lab adapter: production CPU execution plus renderer metadata. */
export class CpuWorld extends NativeCpuSolver {
  constructor(built, backend) {
    const dimension = built.def.dimension;
    const scene =
      built.scene ??
      (dimension === 3
        ? { ref: built.solver, up: [0, 0, 1] }
        : { topology: built.sim.solver });
    super(scene, dimension, {
      order: backend === "soa-colored" ? "colored" : "sequential",
    });
    Object.assign(this.params, built.gpuParams);
    if (dimension === 3) {
      this.solver.visualSource = built.solver;
      for (const b of this.solver.bodies)
        b.cpuStart = Array.from(b.positionLin);
    } else this.sim = new SoaSim(this.solver, "CPU AVBD");
  }
  rewriteBodies(ids, bodies) {
    ids.forEach((id, i) => {
      const old = this.solver.bodies[id],
        next = bodies[i];
      for (const f of old.forces) {
        if (f.bodyA === old) f.bodyA = next;
        if (f.bodyB === old) f.bodyB = next;
        next.forces.push(f);
      }
      next.solver = this.solver;
      this.solver.bodies[id] = next;
    });
    this.wakeAll();
  }
}
