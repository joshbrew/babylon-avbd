import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { sphere } from "../../reference/three-avbd/src/avbd3d/shapes.ts";

/** Preserve the two-ball paper workload until the player launches all lanes. */
export class PaperBowling {
  constructor(built, gpu, renderer) {
    Object.assign(this, { built, gpu, renderer });
    this.balls = built.solver.bodies.slice(-2);
    this.launchStates = new Map(this.balls.map((b) => [b, this.capture(b)]));
  }
  capture(b) {
    return {
      position: Array.from(b.positionLin),
      rotation: Array.from(b.positionAng),
      linearVelocity: Array.from(b.velocityLin),
      angularVelocity: Array.from(b.velocityAng),
    };
  }
  /** Append missing lane balls once, then reset and launch the existing slots in a batch. */
  launch() {
    const { built, gpu, renderer } = this;
    if (this.balls.length === 2) {
      const source = new Solver(),
        missing = [];
      for (let lane = 0; lane < 16; lane++) {
        const x = (lane - 7.5) * 32;
        if (
          this.balls.some(
            (b) => Math.abs(this.launchStates.get(b).position[0] - x) < 0.1,
          )
        )
          continue;
        const b = sphere(
          source,
          30 / 7,
          50,
          0.5,
          [x, -167.5 - 30 / 7 - 12, 0.5 + 30 / 7],
          [0, 30, 0],
        );
        b.velocityAng.set([-7, 0, 0]);
        b.allowSleep = false;
        missing.push(b);
        this.launchStates.set(b, this.capture(b));
      }
      let first;
      if (gpu.bodyBuffer) first = gpu.addBodies(missing);
      else {
        first = gpu.bodyCount;
        for (const b of missing) {
          b.solver = gpu.solver;
          gpu.solver.bodies.push(b);
        }
      }
      if (first < 0 || gpu.bodyCount - first !== missing.length)
        throw Error(
          "The bowling scene needs capacity for 14 additional balls.",
        );
      if (built.solver.bodies !== gpu.solver?.bodies)
        built.solver.bodies.push(...missing);
      this.balls.push(...missing);
      renderer.visuals?.refresh();
      renderer.babylon?.refresh();
    }
    gpu.editBodies(
      this.balls.map((b) => ({
        body: gpu.gpuIndex(this.built.solver.bodies.indexOf(b)),
        ...this.launchStates.get(b),
      })),
    );
    gpu.flushEdits();
  }
}
