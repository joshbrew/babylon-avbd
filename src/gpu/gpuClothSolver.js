import { solveWGSL } from "../../reference/three-avbd/src/avbd3d/gpu/wgsl-solve.ts";

// Cloth points share collision detection, coloring and the AVBD iteration with
// rigid bodies. Zero angular inertia identifies a translation-only point; it
// never enters the rigid 6x6 solve. No extra GPU bindings or pose copies.
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2)
    throw Error("Pinned solver changed; review the cloth kernel integration");
  return source.replace(before, after);
}
let source = replaceOnce(
  solveWGSL,
  "  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }",
  `  if (j >= params.jointCount) { return; }
  if (info[j].x == T_SPRING) {
    // Finite material stiffness: Eq. 16, with no hard-constraint multiplier.
    joints[j].penLin.x = min(joints[j].penLin.w, max(PENALTY_MIN, joints[j].penLin.x * params.gamma));
    return;
  }
  if (info[j].x != T_JOINT) { return; }`,
);
source = replaceOnce(
  source,
  "    let stiffness = k.penLin.w;",
  "    let stiffness = k.penLin.x;",
);
source = replaceOnce(
  source,
  "    addRow(acc, n * sg, cross(r, n) * sg, stiffness, stiffness * (len - k.rA.w));",
  `    let force = stiffness * (len - k.rA.w);
    addRow(acc, n * sg, cross(r, n) * sg, stiffness, force);
    // Eq. 17: positive diagonal lumping of the geometric Hessian's column
    // norms. For C=|xA-xB|-L, G=(force/len)(I-n*n^T).
    let g = abs(force / len) * sqrt(max(vec3f(0.0), vec3f(1.0) - n*n));
    (*acc).lin += mat3x3f(vec3f(g.x,0.0,0.0), vec3f(0.0,g.y,0.0), vec3f(0.0,0.0,g.z));`,
);
source = replaceOnce(
  source,
  "  if (t != T_JOINT) { return; }",
  `  if (t == T_SPRING) {
    let a = info[j].y;
    let b = info[j].z;
    let C = length(anchorA(joints[j], a) - (qrotate(bodies[b].rot, joints[j].rB.xyz) + bodies[b].pos.xyz)) - joints[j].rA.w;
    joints[j].penLin.x = min(joints[j].penLin.w, joints[j].penLin.x + params.betaLin * abs(C));
    return;
  }
  if (t != T_JOINT) { return; }`,
);
source = replaceOnce(
  source,
  "fn finishBody(i: u32, acc: Acc) {",
  `fn finishBody(i: u32, acc: Acc) {
  if (all(bodies[i].moment.xyz == vec3f(0.0))) {
    // LDL^T of the point's 3x3 SPD system, using the same pivot floor as
    // rigid bodies. Contact friction moves the point; it cannot spin it.
    let d1 = acc.lin[0][0];
    let l21 = acc.lin[0][1] / d1;
    let l31 = acc.lin[0][2] / d1;
    let d2 = max(acc.lin[1][1] - l21*l21*d1, acc.lin[1][1]*PIVOT_FLOOR);
    let l32 = (acc.lin[1][2] - l31*l21*d1) / d2;
    let d3 = max(acc.lin[2][2] - l31*l31*d1 - l32*l32*d2, acc.lin[2][2]*PIVOT_FLOOR);
    let y1 = acc.rLin.x;
    let y2 = acc.rLin.y - l21*y1;
    let y3 = acc.rLin.z - l31*y1 - l32*y2;
    let v3 = y3/d3;
    let v2 = y2/d2 - l32*v3;
    let v1 = y1/d1 - l21*v2 - l31*v3;
    bodies[i].pos = vec4f(bodies[i].pos.xyz - vec3f(v1,v2,v3), bodies[i].pos.w);
    return;
  }`,
);

export const clothSolve = source;
