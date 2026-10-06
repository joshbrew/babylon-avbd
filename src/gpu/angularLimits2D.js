import {
  CS,
  STIFF,
  FMIN,
  FMAX,
  P0,
  P1,
  P2,
  INFO_STRIDE,
} from "../../reference/three-avbd/src/avbd2d/soa/solver.ts";
import {
  BIG,
  JOINT_FLOATS,
  J_PARAM,
} from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
export const T_LIMIT_2D = 5;
export function angleLimits2D({
  minAngle = -Math.PI,
  maxAngle = Math.PI,
} = {}) {
  if (
    !Number.isFinite(minAngle) ||
    !Number.isFinite(maxAngle) ||
    minAngle > maxAngle
  )
    throw Error("Angle limits require finite minAngle <= maxAngle, in radians");
  return { minAngle, maxAngle };
}
export function defineAngleLimits2D(topology, slot, limits) {
  const o = slot * CS;
  topology.info[slot * INFO_STRIDE] = T_LIMIT_2D;
  topology.data.set([Infinity, Infinity, 0], o + STIFF);
  topology.data.set([-Infinity, 0, 0], o + FMIN);
  topology.data.set([0, Infinity, 0], o + FMAX);
  // addJoint records the initial A-minus-B relative angle in P0.
  topology.data[o + P1] = limits.minAngle;
  topology.data[o + P2] = limits.maxAngle;
}
export function uploadAngleLimits2D(gpu) {
  const t = gpu.topology;
  for (let slot = 0; slot < t.jointCount; slot++) {
    if (t.info[slot * INFO_STRIDE] !== T_LIMIT_2D) continue;
    gpu.device.queue.writeBuffer(
      gpu.jointBuffer,
      (slot * JOINT_FLOATS + J_PARAM) * 4,
      new Float32Array([
        t.data[slot * CS + P0],
        t.data[slot * CS + P1],
        t.data[slot * CS + P2],
        0,
      ]),
    );
  }
}
const replace = (source, from, to) => {
  if (source.split(from).length !== 2)
    throw Error("Pinned 2D angular layout changed");
  return source.replace(from, to);
};
export function withAngleLimits2D(source) {
  source = replace(
    source,
    "case T_JOINT: { return 3u; }",
    "case T_JOINT: { return 3u; }\n    case 5: { return 2u; }",
  );
  const raw = `
fn limitAngle2D(k:Joint,a:i32,b:i32)->f32 {
  var angleA=0.;if(a>=0){angleA=bodies[a].pose.z;}
  return angleA-bodies[b].pose.z-k.param.x;
}
fn limitRows2D(k:Joint,a:i32,b:i32,alpha:f32)->vec3f {
  let angle=limitAngle2D(k,a,b);
  return vec3f(angle-k.param.y,angle-k.param.z,0.)-alpha*k.c0.xyz;
}
`;
  source = replace(
    source,
    "fn jointRowsC(j: u32, alpha: f32) -> vec3f {",
    raw + "\nfn jointRowsC(j: u32, alpha: f32) -> vec3f {",
  );
  source = replace(
    source,
    "  if (t == T_JOINT) {\n    // Hard rows",
    "  if(t==5){return limitRows2D(k,a,b,alpha);}\n  if (t == T_JOINT) {\n    // Hard rows",
  );
  source = replace(
    source,
    "  let C = jointRowsC(j, alpha);",
    `  let C = jointRowsC(j, alpha);
  if(t==5){
    // Unilateral rows only contribute while their force is active. Inside the
    // interval a hinge has no angular stiffness and remains free to rotate.
    let F=clamp(k.pen.xyz*C+k.lam.xyz,k.fmin.xyz,k.fmax.xyz);
    if(F.x!=0.){addRow(acc,vec3f(0.,0.,sg),vec3f(0.),C.x,k.pen.x,k.lam.x,k.stiff.x,k.fmin.x,k.fmax.x);}
    if(F.y!=0.){addRow(acc,vec3f(0.,0.,sg),vec3f(0.),C.y,k.pen.y,k.lam.y,k.stiff.y,k.fmin.y,k.fmax.y);}
    return;
  }`,
  );
  source = replace(
    source,
    "  if (t == T_JOINT) { k.c0 = vec4f(jointC(k, info[j].y, info[j].z), 0.0); }",
    `  if (t == T_JOINT) { k.c0 = vec4f(jointC(k, info[j].y, info[j].z), 0.0); }
  if(t==5){let angle=limitAngle2D(k,info[j].y,info[j].z);k.c0=vec4f(min(0.,angle-k.param.y),max(0.,angle-k.param.z),0.,0.);}`,
  );
  return source;
}
