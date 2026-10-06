// Sleeping is scheduling metadata in velocity.w; physical mass and inertia stay intact.
struct Body {pose:vec4f,initial:vec4f,inertial:vec4f,vel:vec4f,prev:vec4f,shape:vec4f}
struct Joint {pen:vec4f,lam:vec4f,stiff:vec4f,fmin:vec4f,fmax:vec4f,frac:vec4f,c0:vec4f,anchors:vec4f,param:vec4f}
struct Contact {ids:vec4u,pl:vec4f,anchors:vec4f,geo:vec4f,misc:vec4f}
struct State {quiet:f32,eligible:u32,flags:atomic<u32>,pad:u32}
struct Config {count:u32,joints:u32,capacity:u32,wake:u32,speed:f32,delay:f32,dt:f32,gravity:f32}
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> states:array<State>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> joints:array<Joint>;
@group(0) @binding(4) var<storage,read> contacts:array<Contact>;
@group(0) @binding(5) var<storage,read> counters:array<u32>;
@group(0) @binding(6) var<storage,read_write> globals:array<atomic<u32>>;
@group(0) @binding(7) var<uniform> cfg:Config;
fn asleep(i:u32)->bool{return bodies[i].vel.w!=0.;}
fn speed(i:u32)->f32{return length(bodies[i].vel.xy)+abs(bodies[i].vel.z)*.5*length(bodies[i].shape.xy);}
fn wake(i:u32){bodies[i].vel.w=0.;states[i].quiet=0.;}
fn failed()->bool{return counters[3]!=0u||counters[4]!=0u;}
@compute @workgroup_size(1) fn clear(){atomicStore(&globals[0],0u);atomicStore(&globals[1],0u);}
@compute @workgroup_size(64) fn before(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count){return;}atomicStore(&states[i].flags,0u);
 if(cfg.wake!=0u){wake(i);states[i].pad=0u;}else if(states[i].eligible==0u){wake(i);}
}
// Grounded quiet supports propagate upward between steps. Quiet time need not
// restart independently for every layer, and mutually floating boxes cannot seed it.
fn support(a:u32,b:u32){if(bodies[b].shape.z<=0.||asleep(b)||(states[b].pad!=0u&&speed(b)<=cfg.speed)){atomicOr(&states[a].flags,1u);}}
fn pointVelocity(i:u32,r:vec2f)->vec2f{return bodies[i].vel.xy+bodies[i].vel.z*vec2f(-r.y,r.x);}
fn rotate(angle:f32,p:vec2f)->vec2f{let c=cos(angle);let s=sin(angle);return vec2f(c*p.x-s*p.y,s*p.x+c*p.y);}
@compute @workgroup_size(64) fn contactsWake(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=min(counters[1],cfg.capacity)||failed()){return;}
 let c=contacts[i];if((c.ids.w&0x80000000u)!=0u){return;}
 let a=c.ids.x;let b=c.ids.y;let n=c.geo.zw;
 let va=pointVelocity(a,rotate(bodies[a].pose.z,c.anchors.xy));
 let vb=pointVelocity(b,rotate(bodies[b].pose.z,c.anchors.zw));
 if((asleep(a)||asleep(b))&&(dot(va-vb,n)<-2.*cfg.speed||c.geo.x<-.02||(!asleep(a)&&speed(a)>2.*cfg.speed)||(!asleep(b)&&speed(b)>2.*cfg.speed))){atomicStore(&globals[0],1u);}
 let up=select(1.,-1.,cfg.gravity>0.);
 if(n.y*up>.3){support(a,b);}if(n.y*up<-.3){support(b,a);}
}
@compute @workgroup_size(64) fn jointsWake(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.joints||failed()){return;}let e=info[i];let k=joints[i];
 if(e.x==0||all(k.stiff.xyz==vec3f(0.))){return;}
 let b=u32(e.z);
 // A powered motor never sleeps, even while holding against an angle stop.
 if(e.x==3&&k.fmax.x>0.){atomicOr(&states[b].flags,2u);if(e.y>=0){atomicOr(&states[u32(e.y)].flags,2u);}if(asleep(b)){atomicStore(&globals[0],1u);}return;}
 if(e.y>=0){let a=u32(e.y);if((asleep(a)&&speed(b)>2.*cfg.speed)||(asleep(b)&&speed(a)>2.*cfg.speed)){atomicStore(&globals[0],1u);}}
 if(e.x!=1&&e.x!=2){return;}
 if(e.x==1&&(k.stiff.x<1.e30||k.stiff.y<1.e30)){return;}
 if(e.y<0){atomicOr(&states[b].flags,1u);}else{let a=u32(e.y);support(a,b);support(b,a);}
}
@compute @workgroup_size(64) fn decide(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||failed()||!asleep(i)){return;}
 if(states[i].eligible==0u||(atomicLoad(&states[i].flags)&2u)!=0u||(cfg.gravity!=0.&&(atomicLoad(&states[i].flags)&1u)==0u)){atomicStore(&globals[0],1u);}
}
@compute @workgroup_size(64) fn applyWake(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||failed()){return;}if(atomicLoad(&globals[0])!=0u){wake(i);}
}
@compute @workgroup_size(64) fn rest(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||bodies[i].shape.z<=0.||failed()){return;}
 let flags=atomicLoad(&states[i].flags);
 states[i].pad=select(0u,1u,(flags&1u)!=0u&&speed(i)<=cfg.speed);
 if(states[i].eligible==0u||(flags&2u)!=0u){return;}
 if(!asleep(i)){
  if(speed(i)<=cfg.speed&&(cfg.gravity==0.||(flags&1u)!=0u)){states[i].quiet+=cfg.dt;}else{states[i].quiet=0.;}
  if(states[i].quiet>=cfg.delay){
   bodies[i].vel=vec4f(0.,0.,0.,1.);bodies[i].prev=vec4f(0.);
   bodies[i].initial=vec4f(bodies[i].pose.xyz,bodies[i].initial.w);
   bodies[i].inertial=vec4f(bodies[i].pose.xyz,0.);
  }
 }
 if(asleep(i)){atomicAdd(&globals[1],1u);}
}
