struct Contact {rA:vec3f,key:u32,rB:vec3f,c0x:f32,pen:vec3f,c0y:f32,lam:vec3f,c0z:f32}
@group(0) @binding(7) var<storage,read> contactPoints:array<Contact>;
@group(0) @binding(8) var<storage,read_write> refreshArgs:array<u32>;
fn rotated(q:vec4f,r:vec3f)->vec3f {return r+2.*cross(q.xyz,cross(q.xyz,r)+q.w*r);}
fn contactVelocity(i:u32,r:vec3f,previous:bool)->vec3f {
  // Prediction is skipped while asleep. The last inertial target can retain
  // gravity from the last awake step, which must not be counted as an impact.
  if(states[i].asleep!=0u){return vec3f(0.);}
  var v=bodies[i].velocity.xyz;
  var w=bodies[i].angular.xyz;
  var q=bodies[i].rot;
  if(previous){
    // The inertial target retains the incoming velocity after the solve. Remove
    // this step's gravity increment so resting contacts do not count as impacts.
    v=(bodies[i].inertialPos.xyz-bodies[i].initialPos.xyz)/params.dt;
    if(bodies[i].size.w>0.){v-=params.up.xyz*(params.gravity*params.dt);}
    let a=bodies[i].inertialRot;let b=bodies[i].initialRot;
    w=2.*(-a.w*b.xyz+b.w*a.xyz-cross(a.xyz,b.xyz))/(dot(b,b)*params.dt);
    q=b;
  }
  return v+cross(w,rotated(q,r));
}
fn manifoldImpact(m:Manifold,beforeSolve:bool){
  let a=m.ids.x;let b=m.ids.y;
  if(states[a].asleep==states[b].asleep){return;}
  // A rotating face can approach at one corner while its first contact recedes.
  for(var k=0u;k<(m.ids.w&15u);k++){
    let c=contactPoints[m.ids.z+k];
    contactImpact(a,b,m.geo.xyz,c.rA,c.rB,beforeSolve);contactImpact(b,a,-m.geo.xyz,c.rB,c.rA,beforeSolve);
  }
}
fn contactImpact(a:u32,b:u32,n:vec3f,rA:vec3f,rB:vec3f,beforeSolve:bool) {
  if(states[a].asleep==0u || states[b].asleep!=0u){return;}
  // Before prediction, velocity is already the incoming velocity. Inertial
  // targets still belong to the previous step and must not be read here.
  var incoming=0.;
  if(!beforeSolve){incoming=dot(contactVelocity(b,rB,true)-contactVelocity(a,rA,true),n);}
  let outgoing=dot(contactVelocity(b,rB,false)-contactVelocity(a,rA,false),n);
  if(max(incoming,outgoing)>2.*params.speed){signalWake(a);}
}
@compute @workgroup_size(64) fn impactContacts(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}
  manifoldImpact(m,true);
}
@compute @workgroup_size(64) fn impactJoints(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=params.joints){return;}let j=info[i];if(j.x==0||j.y<0){return;}
  impact(u32(j.y),u32(j.z));impact(u32(j.z),u32(j.y));
}
@compute @workgroup_size(1) fn preparePairs(){
  let changed=atomicLoad(&globals[2])!=0u;
  refreshArgs[0]=select(0u,(params.count+63u)/64u,changed);
  refreshArgs[1]=1u;refreshArgs[2]=1u;
  if(changed){counters[0]=0u;counters[1]=0u;counters[6]=0u;}
}
@compute @workgroup_size(1) fn prepareWake(){
  let requested=atomicLoad(&globals[0])!=0u || atomicLoad(&globals[3])!=0u;
  refreshArgs[0]=select(0u,(params.count+63u)/64u,requested);
  refreshArgs[1]=1u;refreshArgs[2]=1u;
}
@compute @workgroup_size(1) fn prepareNarrowphase(){
  refreshArgs[3]=select(0u,(min(counters[0],params.pairs)+63u)/64u,atomicLoad(&globals[2])!=0u);
  refreshArgs[4]=1u;refreshArgs[5]=1u;
}
fn support(a:u32,b:u32) {
  // Grounded, quiet awake bodies can support the next course. This lets a stack
  // accumulate quiet time together instead of stopping one course at a time.
  if(states[b].mass<=0. || states[b].asleep!=0u || ((states[b].pad2&1u)!=0u && speed(b)<=params.speed)) {
    atomicStore(&states[a].support,1u);
  }
}
