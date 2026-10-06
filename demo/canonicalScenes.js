import { scenes as scenes2D } from "../reference/three-avbd/src/avbd2d/ref/scenes.ts";
import { createSim } from "../reference/three-avbd/src/avbd2d/sim.ts";
import { stressScenes2D, buildStressScene2D } from "./stressScenes2D.js";
import { shapeScene2D, buildShapeScene2D } from "./shapeScenes2D.js";
import { policyScenes2D, buildPolicyScene2D } from "./policyScenes2D.js";
import { slingshotScene2D, buildSlingshotScene2D } from "./slingshotScene2D.js";
import { paperScenes, buildPaperScene } from "./paperScenes.js";
import { mixedSizeScenes } from "./mixedSizeScenes.js";
import { castleScene, buildCastleScene } from "./castleScene.js";
import {
  tearableClothScene,
  buildTearableCloth,
} from "./tearableClothScene.js";
import { prepareRigidNet } from "./rigidNetScene.js";
import { featureScenes, buildFeatureScene } from "./featureScenes.js";
import {
  voronoiFractureScene,
  buildVoronoiFracture,
} from "./voronoiFractureScene.js";
import { scenes as scenes3D } from "../reference/three-avbd/src/avbd3d/ref/scenes.ts";
import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { gpuScenes3D } from "../reference/three-avbd/src/avbd3d/bench-scenes.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  sphere,
  hull,
  convexHull,
} from "../reference/three-avbd/src/avbd3d/shapes.ts";

export function createRookProjectile(kind = "sphere") {
  const s = new Solver(),
    density = 10 / (1.8 * 0.5 * 0.9),
    position = [0, -25, 20.5],
    velocity = [0, 60, 1.4];
  if (kind === "sphere")
    return sphere(s, 3.75, density, 0.5, position, velocity);
  if (kind === "box") {
    const b = new Rigid(s, [5, 5, 5], density, 0.5, position, velocity);
    b.velocityAng.set([1, 2, 0.5]);
    return b;
  }
  const points = [];
  if (kind === "capsule") {
    for (const sign of [-1, 1]) {
      points.push(sign * 4.5, 0, 0);
      for (const [x, r] of [
        [2, 2.5],
        [2 + 2.5 / Math.SQRT2, 2.5 / Math.SQRT2],
      ])
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * 2 * Math.PI;
          points.push(sign * x, r * Math.cos(a), r * Math.sin(a));
        }
    }
  } else if (kind === "cylinder") {
    for (const x of [-3.5, 3.5])
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 2 * Math.PI;
        points.push(x, 2.5 * Math.cos(a), 2.5 * Math.sin(a));
      }
  } else throw Error(`Unknown projectile: ${kind}`);
  const shape = convexHull(points),
    b = hull(s, shape, density, 0.5, position, shape.rotation, velocity);
  b.velocityAng.set([0.6, 0.7, 0.2]);
  return b;
}

const extensions = [
  ...mixedSizeScenes,
  {
    name: "100K Rook Impact",
    gpuOnly: true,
    benchmark: true,
    build(s) {
      s.dt = 1 / 60;
      s.iterations = 4;
      s.gravity = -10;
      const brickDensity = 1 / (1.8 * 0.5 * 0.9);
      new Rigid(s, [1200, 500, 2], 0, 0.65, [0, 0, -1]);
      for (let depth = 0; depth < 20; depth++)
        for (let column = 0; column < 100; column++) {
          const height =
            48 +
            (column < 10 || column >= 90 ? 5 : 0) +
            (Math.floor(column / 5) % 2 === 0 ? 2 : 0);
          for (let row = 0; row < height; row++)
            new Rigid(s, [1.8, 0.5, 0.9], brickDensity, 0.65, [
              (column - 49.5) * 1.85 + (row % 2 ? 0.925 : 0),
              (depth - 9.5) * 0.5,
              0.45 + row * 0.9,
            ]);
        }
      s.bodies.push(createRookProjectile());
    },
  },
  {
    name: "Sphere Contacts",
    gpuOnly: true,
    build(s) {
      new Rigid(s, [30, 30, 1], 0, 0.7, [0, 0, -0.5]);
      for (let z = 0; z < 5; z++)
        for (let x = 0; x < 5; x++)
          sphere(s, 0.5, 1, 0.6, [x * 1.15 - 2.3, 0, z * 1.2 + 0.6]);
      new Rigid(s, [2, 2, 2], 1, 0.6, [0, 0, 9], [1, 0, 0]);
    },
  },
  {
    name: "Convex Hulls",
    gpuOnly: true,
    build(s) {
      new Rigid(s, [30, 30, 1], 0, 0.7, [0, 0, -0.5]);
      const shapes = [
        convexHull([-1, -1, -1, 1, -1, -1, 0, 1, -1, 0, 0, 1]),
        convexHull([
          -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, 1,
        ]),
        convexHull([1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1]),
      ];
      for (let i = 0; i < 18; i++) {
        const b = hull(s, shapes[i % 3], 1, 0.6, [
          ((i % 6) - 2.5) * 2.1,
          0,
          Math.floor(i / 6) * 2.8 + 1.8,
        ]);
        b.velocityAng.set([0.2, 0.3, 0.1]);
      }
      sphere(s, 0.7, 3, 0.5, [0, -7, 3], [0, 12, 0]);
    },
  },
];

// parallelParams disables the final stabilization pass for friction stability.
// The cantilever needs that canonical pass to keep recovering in GPU f32;
// extra iterations alone reduce its sag but leave a persistent residual.
export function gpuSceneParams2D(name) {
  return name === "Rod" ? { postStabilize: true } : {};
}

export const canonicalScenes = [
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
  if (def.gpuOnly && backend !== "gpu")
    throw Error(`${def.name} requires the GPU backend.`);
  if (def.shapes) return buildShapeScene2D(def);
  if (def.voronoi) return buildVoronoiFracture(def);
  if (def.featureDemo) return buildFeatureScene(def);
  if (def.policy2D) return buildPolicyScene2D(def);
  if (def.slingshot) return buildSlingshotScene2D(def);
  if (def.stress && def.dimension === 2) return buildStressScene2D(def);
  if (def.dimension === 2)
    return {
      def,
      sim: createSim(backend === "gpu" ? "soa-seq" : backend, def.name),
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
