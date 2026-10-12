struct Contact {rA:vec3f,key:u32,rB:vec3f,c0x:f32,pen:vec3f,c0y:f32,lam:vec3f,c0z:f32}
@group(0) @binding(7) var<storage,read> contactPoints:array<Contact>;
fn rotated(q:vec4f,r:vec3f)->vec3f {return r+2.*cross(q.xyz,cross(q.xyz,r)+q.w*r);}
fn contactVelocity(i:u32,r:vec3f,previous:bool)->vec3f {
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
fn manifoldImpact(m:Manifold){
  let a=m.ids.x;let b=m.ids.y;
  if(states[a].asleep==states[b].asleep){return;}
  // A rotating face can approach at one corner while its first contact recedes.
  for(var k=0u;k<(m.ids.w&15u);k++){
    let c=contactPoints[m.ids.z+k];
    contactImpact(a,b,m.geo.xyz,c.rA,c.rB);contactImpact(b,a,-m.geo.xyz,c.rB,c.rA);
  }
}
fn contactImpact(a:u32,b:u32,n:vec3f,rA:vec3f,rB:vec3f) {
  if(states[a].asleep==0u || states[b].asleep!=0u){return;}
  let incoming=dot(contactVelocity(b,rB,true)-contactVelocity(a,rA,true),n);
  let outgoing=dot(contactVelocity(b,rB,false)-contactVelocity(a,rA,false),n);
  if(max(incoming,outgoing)>2.*params.speed){signalWake(a);}
}
fn support(a:u32,b:u32) {
  // Grounded, quiet awake bodies can support the next course. This lets a stack
  // accumulate quiet time together instead of stopping one course at a time.
  if(states[b].mass<=0. || states[b].asleep!=0u || ((states[b].pad2&1u)!=0u && speed(b)<=params.speed)) {
    atomicStore(&states[a].support,1u);
  }
}
