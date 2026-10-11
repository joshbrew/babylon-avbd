import { solveWGSL } from "../reference/three-avbd/src/avbd2d/gpu/wgsl-solve.ts";
import { withAngleLimits2D } from "../src/gpu/angularLimits2D.js";
import { wgslToGlsl } from "./wgsl-to-glsl.mjs";

// Build-time only. The GL passes change storage and scheduling; these functions
// retain the production AVBD constraint, fracture, and angular-limit equations.
export function webglSolveSources2D() {
  const wgsl = withAngleLimits2D(solveWGSL);
  const roots = [
    "warmStartBodies",
    "warmStartJoints",
    "solveBody",
    "dualJoint",
    "dualContact",
    "refreshStick",
    "updateVelocities",
  ];
  const storage = {
    bodies: { read: (i) => `loadBody(uint(${i}))`, write: () => "bodyResult" },
    joints: {
      read: (i) => `loadJoint(uint(${i}))`,
      write: () => "jointResult",
    },
    contacts: {
      read: (i) => `loadContact(uint(${i}))`,
      write: () => "contactResult",
    },
    info: { read: (i) => `loadInfo(uint(${i}))` },
    adj: { read: (i) => `loadAdj(uint(${i}))` },
    counters: { read: (i) => `loadCounter(uint(${i}))` },
  };
  const prelude = `
    w_Body loadBody(uint i);w_Joint loadJoint(uint i);w_Contact loadContact(uint i);
    ivec4 loadInfo(uint i);uint loadAdj(uint i);uint loadCounter(uint i);
    w_Body bodyResult;w_Joint jointResult;w_Contact contactResult;
  `;
  const glsl = Object.fromEntries(
    roots.map((root) => [
      root,
      wgslToGlsl(wgsl, {
        roots: [root],
        storage,
        globals: ["params", "pc"],
        prelude,
      }),
    ]),
  );
  return { wgsl, glsl };
}
