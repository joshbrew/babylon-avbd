import { AvbdScene3D } from "../src/native/scenes.js";
import { convexHull } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import {
  rotateInv,
  vec3,
} from "../reference/three-avbd/src/avbd3d/ref/math.ts";
import { setVisual } from "../reference/three-avbd/src/avbd3d/visuals.ts";
import { makeVoronoiWall } from "./voronoiGeometry.js";

export const voronoiFractureScene = {
  id: "3d-voronoi-demolition",
  name: "Voronoi wall · wrecking ball",
  dimension: 3,
  gpuOnly: true,
  voronoi: true,
  stepsPerFrame: 4,
  description:
    "A suspended wrecking ball strikes a wall made from irregular Voronoi stone pieces. Each shared face has a breakable weld. The fracture pattern runs through the wall's full thickness; released stones collide as convex hulls and remain as debris. Drag the ball or swing it again. Reset rebuilds the wall.",
};
export function buildVoronoiFracture(def = voronoiFractureScene) {
  const scene = new AvbdScene3D({
    timeStep: 1 / 240,
    iterations: 10,
    up: [0, 0, 1],
  });
  const paint = (b, color) => {
    setVisual(b, { color });
    return b;
  };
  const floor = scene.addBox([128, 128, 1], {
    density: 0,
    position: [0, 0, -0.5],
    group: 1,
  });
  const geometry = makeVoronoiWall();
  const pieces = geometry.cells.map((cell, i) => {
    const shape = convexHull(cell.vertices);
    // The hull's vertices live in its principal frame. Restore its original
    // placement using the computed center of mass and frame rotation.
    const body = scene.addHull(cell.vertices, {
      position: shape.center,
      rotation: shape.rotation,
      density: 2.5,
      friction: 0.7,
      group: 2,
      collidesWith: 1 | 2 | 4,
    });
    paint(body, [0xb7a08a, 0xcab8a3, 0xd9caba, 0xa88d75, 0xc5ab92][i % 5]);
    return body;
  });
  const local = (b, p) => {
    const offset = p.map((v, i) => v - b.positionLin[i]);
    const out = vec3();
    rotateInv(out, b.positionAng, offset);
    return Array.from(out);
  };
  const bonds = [];
  geometry.cells.forEach((cell, i) => {
    for (const face of cell.faces) {
      if (face.neighbor !== undefined && face.neighbor > i) {
        const a = pieces[i],
          b = pieces[face.neighbor],
          p = [face.midpoint[0], 0, face.midpoint[1]];
        const handle = scene.addJoint(a, b, local(a, p), local(b, p), {
          angularStiffness: Infinity,
          breakForce: Math.max(35, face.length * geometry.thickness * 100),
        });
        bonds.push({
          handle,
          a: i,
          b: face.neighbor,
          area: face.length * geometry.thickness,
        });
      } else if (face.bottom) {
        const b = pieces[i],
          p = [face.midpoint[0], 0, face.midpoint[1]];
        const handle = scene.addJoint(null, b, p, local(b, p), {
          angularStiffness: Infinity,
          breakForce: face.length * geometry.thickness * 3500,
        });
        bonds.push({
          handle,
          a: -1,
          b: i,
          area: face.length * geometry.thickness,
        });
      }
    }
  });
  const theta = Math.PI / 3,
    anchor = [0, 0, 12],
    direction = [0, -Math.sin(theta), -Math.cos(theta)];
  const along = (d) => anchor.map((v, i) => v + direction[i] * d);
  const rotation = [-Math.sin(theta / 2), 0, 0, Math.cos(theta / 2)];
  const rod = paint(
    scene.addBox([0.13, 0.13, 8], {
      position: along(4),
      rotation,
      mass: 3,
      group: 8,
      collidesWith: 1,
    }),
    0x52616b,
  );
  scene.addJoint(null, rod, anchor, [0, 0, 4]);
  const ball = paint(
    scene.addSphere(1.1, {
      position: along(9),
      mass: 600,
      friction: 0.55,
      group: 4,
      collidesWith: 1 | 2,
    }),
    0x435363,
  );
  scene.addJoint(
    rod,
    ball,
    [0, 0, -4],
    direction.map((v) => -v),
  );
  // Support frame is decorative, excluded from collisions by its group.
  for (const x of [-10, 10])
    paint(
      scene.addBox([0.3, 0.3, 12], {
        density: 0,
        position: [x, 0, 6],
        group: 0,
      }),
      0x65777b,
    );
  paint(
    scene.addBox([20.3, 0.3, 0.3], {
      density: 0,
      position: [0, 0, 12],
      group: 0,
    }),
    0x65777b,
  );
  return {
    def,
    scene,
    solver: scene.ref,
    demolition: { geometry, pieces, bonds, pendulum: [rod, ball], ball, floor },
    gpuParams: { dt: 1 / 240, iterations: 10, gravity: -10 },
    camera: { target: [0, -1, 5], distance: 27, azimuth: -55, elevation: 0.3 },
  };
}
