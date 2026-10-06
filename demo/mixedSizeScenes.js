// A deliberately varied collider workload: many small objects and long beams.
// Beyond the grid's large-object budget, beams make its cells much larger than
// most objects. Both collision paths simulate the same geometry and settings.
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
export const mixedSizeScenes = [1000, 10000, 50000].map((count) => ({
  name: `Mixed Sizes ${count / 1000}K`,
  gpuOnly: true,
  stress: true,
  description: `${count.toLocaleString()} boxes, spheres and long beams. Compare grid and tree collision detection using the same four solving rounds. Beams fall onto smaller objects.`,
  build(s) {
    s.iterations = 4;
    s.dt = 1 / 60;
    s.gravity = -10;
    const side = Math.ceil(Math.sqrt(count)),
      width = side * 0.8 + 40;
    new Rigid(s, [width, width, 2], 0, 0.65, [0, 0, -1]);
    for (let i = 0; i < count; i++) {
      const x = ((i % side) - (side - 1) / 2) * 0.8,
        y = (Math.floor(i / side) - (side - 1) / 2) * 0.8;
      if (i % 100 === 0) new Rigid(s, [16, 0.3, 0.3], 1, 0.65, [x, y, 3]);
      else if (i % 3 === 0) sphere(s, 0.25, 1, 0.65, [x, y, 0.25]);
      else new Rigid(s, [0.5, 0.5, 0.5], 1, 0.65, [x, y, 0.25]);
    }
  },
}));
