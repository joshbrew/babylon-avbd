import { solveWGSL } from "../reference/three-avbd/src/avbd3d/gpu/wgsl-solve.ts";
import { clothSolve } from "../src/gpu/gpuClothSolver.js";
import { withJointRestFrames } from "../src/gpu/gpuSolverKernels.js";
import { withAngularConstraints } from "../src/gpu/angularConstraints.js";
import { withSpringFracture } from "../src/gpu/springMaterial.js";
import { wgslToGlsl } from "./wgsl-to-glsl.mjs";

export function webglSolveSources3D({ cloth = false } = {}) {
  // Normalize the guard for the shared angular-row injection. The cloth
  // kernel already checked the count before its spring warm-start branch.
  const base = cloth
    ? clothSolve.replace(
        "  if (info[j].x != T_JOINT) { return; }",
        "  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }",
      )
    : solveWGSL;
  let wgsl = withJointRestFrames(
    withAngularConstraints(withSpringFracture(base)),
  );
  // Each fragment owns one contact point. The dual's point loop has no
  // inter-point dependency, so selecting a single point retains its equations.
  const loop = "for (var c = mf.ids.z; c < end; c++) {";
  if (wgsl.split(loop).length !== 2)
    throw Error("3D contact dual layout changed");
  wgsl = wgsl.replace(loop, loop + "\nif(c!=glPoint){continue;}");
  wgsl +=
    "\nvar<private> glPoint:u32;\nfn glSolveBody(i:u32){finishBody(i,accumulate(i,0u,1u));}\n";
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
    manifolds: { read: (i) => `loadManifold(uint(${i}))` },
    info: { read: (i) => `loadInfo(uint(${i}))` },
    adj: { read: (i) => `loadAdj(uint(${i}))` },
    counters: { read: (i) => `loadCounter(uint(${i}))` },
  };
  const prelude = `w_Body loadBody(uint i);w_Joint loadJoint(uint i);w_Contact loadContact(uint i);w_Manifold loadManifold(uint i);
ivec4 loadInfo(uint i);uint loadAdj(uint i);uint loadCounter(uint i);
w_Body bodyResult;w_Joint jointResult;w_Contact contactResult;`;
  const roots = [
    "warmStartBodies",
    "warmStartJoints",
    "glSolveBody",
    "dualJoint",
    "dualManifold",
    "updateVelocities",
  ];
  return {
    wgsl,
    glsl: Object.fromEntries(
      roots.map((root) => [
        root,
        wgslToGlsl(wgsl, {
          roots: [root],
          storage,
          prelude,
          globals: ["params", "pc", "glPoint"],
        }),
      ]),
    ),
  };
}
