import { restitutionWGSL } from "../src/gpu/restitution.js";
import { restitutionWGSL2D } from "../src/gpu/restitution2D.js";
import { wgslToGlsl } from "./wgsl-to-glsl.mjs";
export function webglRestitutionSources(dimension) {
  const wgsl = dimension === 2 ? restitutionWGSL2D : restitutionWGSL;
  const storage = {
    bodies: { read: (i) => `loadBody(uint(${i}))`, write: () => "bodyResult" },
    velocities: {
      read: (i) => `loadVelocity(uint(${i}))`,
      write: () => "velocityResult",
    },
    materials: { read: (i) => `loadMaterial(uint(${i}))` },
    manifolds: { read: (i) => `loadManifold(uint(${i}))` },
    contacts: { read: (i) => `loadContact(uint(${i}))` },
    adj: { read: (i) => `loadAdj(uint(${i}))` },
    counters: { read: (i) => `loadCounter(uint(${i}))` },
    bounce: {
      read: (i) => `loadBounce(uint(${i}))`,
      write: () => "bounceResult",
    },
  };
  const prelude = `w_Body loadBody(uint i);w_Velocity loadVelocity(uint i);float loadMaterial(uint i);${dimension === 3 ? "w_Manifold loadManifold(uint i);" : ""}w_Contact loadContact(uint i);uint loadAdj(uint i);uint loadCounter(uint i);w_Bounce loadBounce(uint i);
w_Body bodyResult;w_Velocity velocityResult;w_Bounce bounceResult;`;
  return {
    wgsl,
    glsl: Object.fromEntries(
      [
        "captureIncoming",
        "captureSolved",
        "initialize",
        "pairs",
        "apply",
        "writeBack",
      ].map((root) => [
        root,
        wgslToGlsl(wgsl, { roots: [root], storage, prelude, globals: ["cfg"] }),
      ]),
    ),
  };
}
