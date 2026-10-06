// App-owned 3D angular constraints. They share AVBD's colored body solve and
// dual updates; no post-step pose clamping or additional storage binding.
// Types 3/4 use Joint.rA/rB.xyz for local axes, c0Lin/c0Ang.xyz for reference
// tangents, rA/rB.w for speed/torque or angle bounds, and pen/lamLin.xy for rows.
const materials = new WeakMap();
export const initialAngularConstraint = (force) => materials.get(force);
export function setInitialAngularConstraint(force, options) {
  materials.set(force, options);
}
const replace = (source, from, to) => {
  if (source.split(from).length !== 2)
    throw Error("Pinned angular solver layout changed");
  return source.replace(from, to);
};
export function withAngularConstraints(source) {
  const helpers = `
fn angularFrame(k:Joint,a:i32,b:i32)->mat3x3f {
  let qa=rotA(a);let axis=qrotate(qa,k.rA.xyz);
  let ta=qrotate(qa,k.c0Lin.xyz);let tb=qrotate(bodies[b].rot,k.c0Ang.xyz);
  return mat3x3f(axis,ta,tb);
}
fn angularAngle(k:Joint,a:i32,b:i32)->f32 {
  let f=angularFrame(k,a,b);
  return atan2(dot(f[0],cross(f[1],f[2])),dot(f[1],f[2]));
}
fn angularRows(k:Joint,a:i32,b:i32,t:i32,alpha:f32)->vec2f {
  let angle=angularAngle(k,a,b);
  if(t==3){
    let delta=atan2(sin(angle-k.c0Lin.w),cos(angle-k.c0Lin.w));
    return vec2f(delta-k.rA.w*params.dt,0.);
  }
  return vec2f(angle-k.rA.w,angle-k.rB.w)-alpha*vec2f(k.c0Lin.w,k.c0Ang.w);
}
fn angularForce(k:Joint,C:vec2f,t:i32)->vec2f {
  let f=k.penLin.xy*C+k.lamLin.xy;
  if(t==3){return vec2f(clamp(f.x,-k.rB.w,k.rB.w),0.);}
  return vec2f(min(0.,f.x),max(0.,f.y));
}
fn addAngular(acc:ptr<function,Acc>,j:u32,alpha:f32,i:u32){
  let a=info[j].y;let b=info[j].z;let t=info[j].x;let k=joints[j];
  if(t==3 && k.rB.w==0.){return;}
  let axis=angularFrame(k,a,b)[0]*select(1.,-1.,i32(i)==a);
  let C=angularRows(k,a,b,t,alpha);let F=angularForce(k,C,t);
  if(t==3 || F.x!=0.){addRow(acc,vec3f(0.),axis,k.penLin.x,F.x);}
  if(t==4 && F.y!=0.){addRow(acc,vec3f(0.),axis,k.penLin.y,F.y);}
}
fn warmAngular(j:u32){
  var k=joints[j];if(k.penLin.w==0.){return;}
  let a=info[j].y;let b=info[j].z;let t=info[j].x;
  let angle=angularAngle(k,a,b);
  k.c0Lin.w=select(min(0.,angle-k.rA.w),angle,t==3);
  k.c0Ang.w=max(0.,angle-k.rB.w);
  k.lamLin=vec4f(k.lamLin.xyz*(params.alpha*params.gamma),k.lamLin.w);
  k.penLin=vec4f(clamp(k.penLin.xyz*params.gamma,vec3f(PENALTY_MIN),vec3f(PENALTY_MAX)),k.penLin.w);
  joints[j]=k;
}
fn dualAngular(j:u32){
  var k=joints[j];if(k.penLin.w==0.){return;}
  let t=info[j].x;let C=angularRows(k,info[j].y,info[j].z,t,pc.alpha);
  let F=angularForce(k,C,t);k.lamLin=vec4f(F,0.,k.lamLin.w);
  let violation=select(vec2f(max(0.,-C.x),max(0.,C.y)),abs(C),t==3);
  k.penLin=vec4f(min(k.penLin.xy+violation*params.betaAng,vec2f(PENALTY_MAX)),k.penLin.zw);
  joints[j]=k;
}
`;
  source = replace(
    source,
    "fn addJoint(acc: ptr<function, Acc>, j: u32, alpha: f32, i: u32) {",
    helpers +
      "\nfn addJoint(acc: ptr<function, Acc>, j: u32, alpha: f32, i: u32) {\n  if(info[j].x==3 || info[j].x==4){if(joints[j].penLin.w!=0.){addAngular(acc,j,alpha,i);}return;}",
  );
  source = replace(
    source,
    "  if (j >= params.jointCount || info[j].x != T_JOINT) { return; }",
    "  if(j>=params.jointCount){return;}\n  if(info[j].x==3 || info[j].x==4){warmAngular(j);return;}\n  if(info[j].x!=T_JOINT){return;}",
  );
  return replace(
    source,
    "fn dualJoint(j: u32) {",
    "fn dualJoint(j: u32) {\n  if(info[j].x==3 || info[j].x==4){dualAngular(j);return;}",
  );
}
export function angularConstraintOptions({
  type,
  axisA = [0, 1, 0],
  axisB = [0, 1, 0],
  speed = 1,
  maxTorque = 100,
  minAngle = -Math.PI,
  maxAngle = Math.PI,
} = {}) {
  const unit = (v) => {
    const a = v && typeof v.x === "number" ? [v.x, v.y, v.z] : Array.from(v);
    const l = Math.hypot(...a);
    if (a.length !== 3 || !a.every(Number.isFinite) || l < 1e-8)
      throw Error("Angular axis requires three finite, nonzero components");
    return a.map((x) => x / l);
  };
  if (type !== "motor" && type !== "limit")
    throw Error("Invalid angular constraint type");
  if (!Number.isFinite(speed) || !Number.isFinite(maxTorque) || maxTorque < 0)
    throw Error("Motor speed must be finite and maxTorque nonnegative");
  if (
    !Number.isFinite(minAngle) ||
    !Number.isFinite(maxAngle) ||
    minAngle < -Math.PI ||
    maxAngle > Math.PI ||
    minAngle > maxAngle
  )
    throw Error("Hinge angles must be ordered within -PI..PI radians");
  return {
    type,
    axisA: unit(axisA),
    axisB: unit(axisB),
    speed,
    maxTorque,
    minAngle,
    maxAngle,
  };
}
