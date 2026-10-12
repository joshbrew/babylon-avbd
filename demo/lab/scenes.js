/**
 * Scene catalogue and builder routing used by the viewer and browser tests.
 * Definitions describe the UI; builders return initial topology plus camera
 * and solver options. Keep creation here independent of a canvas or DOM so
 * worker sessions and benchmark sessions construct the same physics world.
 */
import { playScenes, buildPlayScene } from "../playgrounds/index.js";
import { scenes as scenes2D } from "../../reference/three-avbd/src/avbd2d/ref/scenes.ts";
import { createSim } from "../../reference/three-avbd/src/avbd2d/sim.ts";
import { parallelParams } from "../../reference/three-avbd/src/avbd2d/ref/solver.ts";
import { stressScenes2D, buildStressScene2D } from "../stress-2d/scenes.js";
import { shapeScene2D, buildShapeScene2D } from "../shapes-2d/scene.js";
import { policyScenes2D, buildPolicyScene2D } from "../policies-2d/scenes.js";
import { slingshotScene2D, buildSlingshotScene2D } from "../slingshot/scene.js";
import { paperScenes, buildPaperScene } from "../paper-benchmarks/scenes.js";
import { mixedSizeScenes } from "../mixed-sizes/scenes.js";
import { castleScene, buildCastleScene } from "../castle/scene.js";
import {
  tearableClothScene,
  buildTearableCloth,
} from "../tearable-cloth/scene.js";
import { prepareRigidNet } from "../rigid-net/scene.js";
import { terrainScene, buildTerrainScene } from "../terrain/scene.js";
import { featureScenes, buildFeatureScene } from "../features/scenes.js";
import {
  voronoiFractureScene,
  buildVoronoiFracture,
} from "../voronoi-demolition/scene.js";
import { scenes as scenes3D } from "../../reference/three-avbd/src/avbd3d/ref/scenes.ts";
import { Solver } from "../../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { gpuScenes3D } from "../../reference/three-avbd/src/avbd3d/bench-scenes.ts";
import { rookImpactScene } from "../rook-impact/scene.js";
export { createRookProjectile } from "../rook-impact/scene.js";
import { sphereContactScene } from "../sphere-contacts/scene.js";
import { convexHullScene } from "../convex-hulls/scene.js";
const extensions = [
  ...mixedSizeScenes,
  rookImpactScene,
  sphereContactScene,
  convexHullScene,
];
// parallelParams disables the final stabilization pass for friction stability.
// The cantilever needs that canonical pass to keep recovering in GPU f32;
// extra iterations alone reduce its sag but leave a persistent residual.
export function gpuSceneParams2D(name) {
  return name === "Rod" ? { postStabilize: true } : {};
}

export const canonicalScenes = [
  ...playScenes,
  terrainScene,
  voronoiFractureScene,
  ...featureScenes,
  ...policyScenes2D,
  slingshotScene2D,
  shapeScene2D,
  castleScene,
  tearableClothScene,
  ...paperScenes,
  ...stressScenes2D.map((s) => ({
    ...s,
    dimension: 2,
    gpuOnly: true,
    stress: true,
  })),
  ...gpuScenes3D.map((s) => ({
    id: `showcase-${slug(s.name)}`,
    dimension: 3,
    name: s.name,
    gpuOnly: true,
    showcase: true,
  })),
  ...scenes2D.map((s) => ({
    id: `2d-${slug(s.name)}`,
    dimension: 2,
    name: s.name,
    canonical: true,
  })),
  ...scenes3D.map((s) => ({
    id: `3d-${slug(s.name)}`,
    dimension: 3,
    name: s.name,
    canonical: true,
  })),
  ...extensions.map((s) => ({
    id: `3d-${slug(s.name)}`,
    dimension: 3,
    name: s.name,
    gpuOnly: true,
    benchmark: !!s.benchmark,
    stress: !!s.stress,
    description: s.description,
  })),
].map((s) => ({
  ...s,
  ...(s.id === "showcase-ragdolls-on-cloth-24k"
    ? {
        timeStep: 1 / 240,
        stepsPerFrame: 4,
        iterations: 5,
        description:
          "Ragdolls fall onto a flexible net of linked, overlapping rigid plates. Neighboring plates move together without colliding with each other; distant folds still collide. Physics runs at 240 steps per second. This is a rigid net, not a triangle-based fabric collider.",
      }
    : {}),
  ...(s.id === "showcase-box-columns-100k" ? { iterations: 5 } : {}),
  solverKind: s.solverKind ?? (s.dimension === 2 ? "2d" : "rigid"),
}));
function slug(s) {
  return s.toLowerCase().replaceAll(" ", "-").replace(/[()]/g, "");
}
export function buildCanonicalScene(id, backend = "ref") {
  const def = canonicalScenes.find((s) => s.id === id);
  if (!def) throw Error(`Unknown scene: ${id}`);
  if (def.playDemo) return buildPlayScene(def);
  if (def.terrain) return buildTerrainScene(def);
  if (def.shapes) return buildShapeScene2D(def);
  if (def.voronoi) return buildVoronoiFracture(def);
  if (def.featureDemo) return buildFeatureScene(def);
  if (def.policy2D) return buildPolicyScene2D(def);
  if (def.slingshot) return buildSlingshotScene2D(def);
  if (def.stress && def.dimension === 2) return buildStressScene2D(def);
  if (def.dimension === 2)
    return {
      def,
      // Keep CPU/GPU comparisons on the same timestep and solver settings.
      sim: createSim(backend === "gpu" ? "soa-seq" : backend, def.name, {
        ...parallelParams(),
        ...gpuSceneParams2D(def.name),
      }),
      gpuParams: gpuSceneParams2D(def.name),
    };
  const solver = new Solver();
  if (def.castle) return buildCastleScene(def, solver);
  if (def.tearable) return buildTearableCloth(def, solver);
  if (def.paper) return buildPaperScene(def, solver);
  if (def.showcase) {
    const source = gpuScenes3D.find((s) => s.name === def.name);
    const options = { ...source.options };
    source.build(solver, options);
    const rigidNet =
      def.id === "showcase-ragdolls-on-cloth-24k"
        ? prepareRigidNet(solver)
        : undefined;
    const gpuParams = {
      ...(typeof source.params === "function"
        ? source.params(options)
        : source.params),
      ...(def.iterations !== undefined ? { iterations: def.iterations } : {}),
    };
    for (const [key, value] of Object.entries(gpuParams ?? {}))
      if (key in solver) solver[key] = value;
    if (def.timeStep) solver.dt = def.timeStep;
    return {
      def,
      solver,
      gpuParams,
      rigidNet,
      camera:
        typeof source.camera === "function"
          ? source.camera(options)
          : source.camera,
    };
  }
  [...scenes3D, ...extensions].find((s) => s.name === def.name).build(solver);
  return { def, solver };
}
