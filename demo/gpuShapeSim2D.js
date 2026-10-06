import { GpuSim } from "../reference/three-avbd/src/avbd2d/gpu/sim.ts";
import { shapesOf2D } from "../src/gpu/shapes2D.js";
// Interaction uses the existing asynchronous pose snapshot, with the actual shape silhouette.
export class GpuShapeSim2D extends GpuSim {
  pick(x, y) {
    const shapes = shapesOf2D(this.solver.topology);
    if (!shapes?.size) return super.pick(x, y);
    for (let i = this.bodyCount - 1; i >= 0; i--) {
      const g = shapes.get(i) ?? [0, 0, 0, 0];
      if (!this.isDynamic(i) || g[0] === 3) continue;
      const [px, py, a] = this.pose(i),
        dx = x - px,
        dy = y - py;
      const local = [
        Math.cos(a) * dx + Math.sin(a) * dy,
        -Math.sin(a) * dx + Math.cos(a) * dy,
      ];
      const [w, h] = this.size(i);
      let inside;
      if (g[0] === 1) inside = Math.hypot(...local) <= g[1];
      else if (g[0] === 2)
        inside =
          Math.hypot(Math.max(0, Math.abs(local[0]) - g[2]), local[1]) <= g[1];
      else if (g[0] === 4) {
        inside = true;
        for (let k = 0; k < g.vertices.length; k += 4)
          if (
            (local[0] - g.vertices[k]) * g.vertices[k + 2] +
              (local[1] - g.vertices[k + 1]) * g.vertices[k + 3] >
            0
          ) {
            inside = false;
            break;
          }
      } else
        inside = Math.abs(local[0]) <= w / 2 && Math.abs(local[1]) <= h / 2;
      if (inside) return { body: i, local };
    }
    return null;
  }
}
