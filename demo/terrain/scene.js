/**
 * Build static terrain collisions from the same triangles drawn on screen.
 * The demo uses Z up. Collision cooking produces small solid convex pieces;
 * visual.js retains the continuous source mesh for smooth surface rendering.
 * An imported mesh follows this same path instead of the procedural landscape.
 */
import { AvbdScene3D } from "../../src/native/scenes.js";
import { setVisual } from "../../reference/three-avbd/src/avbd3d/visuals.ts";
import { landscapeMesh, landscapeHeight, caveMesh } from "./mesh.js";
import { setTerrainSurface } from "./visual.js";
export const terrainScene = {
  id: "3d-static-terrain",
  name: "Hills, cave and overhang · static terrain",
  dimension: 3,
  terrain: true,
  gpuOnly: true,
  description:
    "Rolling hills and an irregular rock cave render as continuous meshes. Small static collision pieces follow those same triangles and keep the cave interior open. Load your own OBJ or terrain JSON to try imported geometry. Drag a body or orbit to inspect the surfaces.",
};
export function buildTerrainScene(def = terrainScene, imported = null) {
  const scene = new AvbdScene3D({
    up: [0, 0, 1],
    timeStep: 1 / 120,
    iterations: 5,
  });
  const mesh = imported ?? landscapeMesh();
  const ground = imported
    ? scene.addStaticMesh({ ...mesh, thickness: 0.2, friction: 0.65 })
    : scene.addHeightfield({
        heights: mesh.heights,
        columns: mesh.columns,
        rows: mesh.rows,
        spacing: mesh.spacing,
        origin: [-15.4, -15.4, 0],
        upAxis: 2,
        baseHeight: -2,
        friction: 0.65,
      });
  setTerrainSurface(ground, mesh.positions, mesh.indices, 0x8caa78);
  let cave;
  if (!imported) {
    const rock = caveMesh();
    cave = scene.addStaticMesh({ ...rock, thickness: 0.16, friction: 0.6 });
    setTerrainSurface(cave, rock.positions, rock.indices, 0xa49d8c);
  }
  for (let i = 0; i < 120; i++) {
    const position = [
      ((i % 10) - 4.5) * 0.82 - 3,
      ((Math.floor(i / 10) % 6) - 2.5) * 0.85,
      (imported ? imported.height + 2 : 3) + Math.floor(i / 60) * 1.6,
    ];
    const body =
      i % 3 === 0
        ? scene.addSphere(0.32, { position, density: 1, friction: 0.5 })
        : i % 3 === 1
          ? scene.addBox([0.58, 0.58, 0.58], { position, friction: 0.55 })
          : scene.addCapsule(0.2, 0.8, {
              position,
              rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2],
            });
    setVisual(body, { color: [0xe2ab61, 0x689bb5, 0xd27c74][i % 3] });
  }
  for (let i = 0; !imported && i < 8; i++)
    setVisual(
      scene.addSphere(0.35, {
        position: [
          6 + (i % 3) * 0.8,
          -1 + Math.floor(i / 3) * 0.85,
          landscapeHeight(6 + (i % 3) * 0.8, -1 + Math.floor(i / 3) * 0.85) +
            1 +
            i * 0.12,
        ],
        friction: 0.5,
      }),
      { color: 0xf0bc66 },
    );
  return {
    def,
    scene,
    solver: scene.ref,
    terrain: {
      name: imported?.name ?? "Rolling hills and rock cave",
      triangles: mesh.indices.length / 3 + (cave?.bodies.length ?? 0),
      colliders: ground.bodies.length + (cave?.bodies.length ?? 0),
      surfaces: cave ? 2 : 1,
      imported: !!imported,
    },
    gpuParams: { dt: 1 / 120, iterations: 5 },
    gpuOptions: { broadphase: "hploc" },
    camera: {
      distance: 43,
      target: [0, 0, imported ? imported.height * 0.4 : 1.5],
      azimuth: -35,
      elevation: 0.5,
    },
  };
}
