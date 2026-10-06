import { solveWGSL } from "../../reference/three-avbd/src/avbd3d/gpu/wgsl-solve.ts";

// App-owned kernel variants. The pinned reference module remains byte-for-byte intact.
// Scalar triple-product identity: dot(cross(r,n),dw) = dot(n,cross(dw,r)).
// Evaluate relative point displacement once, then project it onto the contact basis.
const original = `  e.C = vec3f(
    k.c0x * keep + dot(n, A.dLin) - dot(n, B.dLin) + dot(cross(e.rAW, n), A.dAng) + dot(cross(e.rBW, -n), B.dAng),
    k.c0y * keep + dot(t1, A.dLin) - dot(t1, B.dLin) + dot(cross(e.rAW, t1), A.dAng) + dot(cross(e.rBW, -t1), B.dAng),
    k.c0z * keep + dot(t2, A.dLin) - dot(t2, B.dLin) + dot(cross(e.rAW, t2), A.dAng) + dot(cross(e.rBW, -t2), B.dAng));`;
if (solveWGSL.split(original).length !== 2)
  throw Error(
    "Pinned contact evaluation changed; review the app kernel variant",
  );
export const projectedContactSolve = solveWGSL.replace(
  original,
  `  let delta = A.dLin - B.dLin + cross(A.dAng, e.rAW) - cross(B.dAng, e.rBW);
  e.C = vec3f(k.c0x, k.c0y, k.c0z) * keep + vec3f(dot(n, delta), dot(t1, delta), dot(t2, delta));`,
);
function replaceOnce(source, from, to) {
  if (source.split(from).length !== 2)
    throw Error("Pinned solve layout changed; review the app kernel variant");
  return source.replace(from, to);
}

// Lanes share a manifold and read adjacent points. This coalesces contact reads
// and divides a four-point face contact across threads rather than assigning
// every point in that face to one thread. Joint rows still execute once.
export const pointLanesContactSolve = (() => {
  let source = replaceOnce(
    projectedContactSolve,
    "  var e = adj[i] + lane;",
    "  let begin = adj[i];\n  var e = begin;",
  );
  source = replaceOnce(
    source,
    "    if (c == cEnd) {\n",
    "    if (c >= cEnd) {\n",
  );
  source = replaceOnce(
    source,
    `      e += lanes;
      if (id < params.jointCount) {
        addJoint(&acc, id, pc.alpha, i);`,
    `      e++;
      if (id < params.jointCount) {
        if ((e - begin - 1u) % lanes != lane) { continue; }
        addJoint(&acc, id, pc.alpha, i);`,
  );
  source = replaceOnce(
    source,
    `      isA = i == mf.ids.x;`,
    `      c = mf.ids.z + lane;
      cEnd = mf.ids.z + pairCount(mf);
      if (c >= cEnd) { continue; }
      isA = i == mf.ids.x;`,
  );
  source = replaceOnce(
    source,
    `      c = mf.ids.z;
      cEnd = mf.ids.z + pairCount(mf);
      if (c == cEnd) { continue; }`,
    "",
  );
  source = replaceOnce(source, "    c++;", "    c += lanes;");
  return source;
})();

// Topology counters are finalized before the solve dispatches. An incomplete
// contact list or clashing solve groups must never move bodies. Keep poses and
// physical velocities intact while the host grows storage/coloring capacity.
// No extra buffer, readback, pass or workgroup barrier is needed.
export function protectSolverStep(source = solveWGSL) {
  source = replaceOnce(
    source,
    "fn manifoldCount() -> u32 {",
    `fn solverStepValid() -> bool {
  return counters[C_OVERFLOW] == 0u && counters[C_CLASHES] == 0u;
}


fn manifoldCount() -> u32 {`,
  );
  for (const [entry, builtin] of [
    ["warmStartJoints", "global_invocation_id"],
    ["warmStartBodies", "global_invocation_id"],
    ["dual", "global_invocation_id"],
    ["updateVelocities", "global_invocation_id"],
  ]) {
    const signature = `fn ${entry}(@builtin(${builtin}) gid: vec3u) {`;
    source = replaceOnce(
      source,
      signature,
      `${signature}\n  if (!solverStepValid()) { return; }`,
    );
  }
  // Every thread still reaches the original reduction barriers. Invalid steps
  // simply have no live body accumulators or pose writes.
  return replaceOnce(
    source,
    "  let live = k < count;",
    "  let live = k < count && solverStepValid();",
  );
}

// Four unused joint scalars carry the rest quaternion. Springs keep rA.w as
// their rest length; only angular joint rows read this quaternion. Legacy
// records are all zero, which retains the upstream identity restTarget.
export function withJointRestFrames(source) {
  source = replaceOnce(
    source,
    "  return qsub(rotA(a), bodies[b].rot) * k.lamAng.w;",
    `  let rest = vec4f(k.c0Lin.w, k.c0Ang.w, k.rA.w, k.rB.w);
  var restTarget = rotA(a);
  if (dot(rest, rest) > 0.5) {
    restTarget = vec4f(restTarget.w * rest.xyz + rest.w * restTarget.xyz + cross(restTarget.xyz, rest.xyz),
      restTarget.w * rest.w - dot(restTarget.xyz, rest.xyz));
  }
  return qsub(restTarget, bodies[b].rot) * k.lamAng.w;`,
  );
  source = replaceOnce(
    source,
    "k.c0Lin = vec4f(jointLinC(k, a, b), 0.0);",
    "k.c0Lin = vec4f(jointLinC(k, a, b), k.c0Lin.w);",
  );
  return replaceOnce(
    source,
    "k.c0Ang = vec4f(jointAngC(k, a, b), 0.0);",
    "k.c0Ang = vec4f(jointAngC(k, a, b), k.c0Ang.w);",
  );
}
