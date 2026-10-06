struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct Joint {penLin:vec4f,penAng:vec4f,lamLin:vec4f,lamAng:vec4f,c0Lin:vec4f,c0Ang:vec4f,rA:vec4f,rB:vec4f}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> joints:array<Joint>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> slots:array<u32>;
fn rotate(q:vec4f,v:vec3f)->vec3f{let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@compute @workgroup_size(64) fn capture(@builtin(global_invocation_id) id:vec3u){
  if(id.x>=arrayLength(&slots)){return;}let j=slots[id.x];let a=info[j].y;let b=info[j].z;
  var qa=vec4f(0.,0.,0.,1.);if(a>=0){qa=bodies[a].rot;}
  let qb=bodies[b].rot;let axis=joints[j].rA.xyz;
  let tangent=normalize(select(vec3f(0.,-axis.z,axis.y),vec3f(-axis.y,axis.x,0.),abs(axis.x)>abs(axis.z)));
  let world=rotate(qa,tangent);let axisB=normalize(joints[j].rB.xyz);
  var tangentB=rotate(vec4f(-qb.xyz,qb.w),world);
  tangentB-=axisB*dot(tangentB,axisB);
  if(length(tangentB)<1.e-6){tangentB=select(vec3f(0.,-axisB.z,axisB.y),vec3f(-axisB.y,axisB.x,0.),abs(axisB.x)>abs(axisB.z));}
  joints[j].c0Lin=vec4f(tangent,0.);joints[j].c0Ang=vec4f(normalize(tangentB),0.);
}
