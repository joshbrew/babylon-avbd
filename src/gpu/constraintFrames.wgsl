// Capture new constraints from live GPU poses; no stale mesh poses or readback.
struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct Joint { penLin:vec4f,penAng:vec4f,lamLin:vec4f,lamAng:vec4f,c0Lin:vec4f,c0Ang:vec4f,rA:vec4f,rB:vec4f }
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> joints:array<Joint>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> commands:array<vec4u>;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@compute @workgroup_size(64) fn capture(@builtin(global_invocation_id) id:vec3u) {
  if(id.x>=arrayLength(&commands)){return;}
  let slot=commands[id.x].x; let kind=commands[id.x].y;
  let a=info[slot].y; let b=info[slot].z;
  if(kind==0u){
    var inv=vec4f(0.,0.,0.,1.);
    if(a>=0){let q=bodies[a].rot;inv=vec4f(-q.xyz,q.w);}
    let q=bodies[b].rot;
    let rest=normalize(vec4f(inv.w*q.xyz+q.w*inv.xyz+cross(inv.xyz,q.xyz),inv.w*q.w-dot(inv.xyz,q.xyz)));
    joints[slot].c0Lin.w=rest.x; joints[slot].c0Ang.w=rest.y;
    joints[slot].rA.w=rest.z; joints[slot].rB.w=rest.w;
  } else {
    let pa=bodies[a].pos.xyz+rotate(bodies[a].rot,joints[slot].rA.xyz);
    let pb=bodies[b].pos.xyz+rotate(bodies[b].rot,joints[slot].rB.xyz);
    joints[slot].rA.w=length(pa-pb);
  }
}
