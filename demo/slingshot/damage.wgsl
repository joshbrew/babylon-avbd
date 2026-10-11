struct Body {pose:vec4f,initial:vec4f,inertial:vec4f,vel:vec4f,prev:vec4f,shape:vec4f}
struct Contact {ids:vec4u,pl:vec4f,anchors:vec4f,geo:vec4f,misc:vec4f}
struct Joint {pen:vec4f,lam:vec4f,stiff:vec4f,fmin:vec4f,fmax:vec4f,frac:vec4f,c0:vec4f,anchors:vec4f,param:vec4f}
struct Health {loss:atomic<u32>,owner:u32,kind:u32,pad:u32}
struct Config {count:u32,joints:u32,capacity:u32,list:u32,dt:f32,armed:u32,pad0:u32,pad1:u32}
@group(0) @binding(0) var<uniform> cfg:Config;
@group(0) @binding(1) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(2) var<storage,read> contacts:array<Contact>;
@group(0) @binding(3) var<storage,read> adj:array<u32>;
@group(0) @binding(4) var<storage,read_write> health:array<Health>;
@group(0) @binding(5) var<storage,read_write> loads:array<f32>;
@group(0) @binding(6) var<storage,read_write> incoming:array<vec4f>;
@group(0) @binding(7) var<storage,read> counters:array<u32>;
@group(0) @binding(8) var<storage,read_write> filters:array<vec2u>;
@group(0) @binding(9) var<storage,read_write> palette:array<vec4f>;
@group(0) @binding(10) var<storage,read_write> joints:array<Joint>;
@group(0) @binding(11) var<storage,read> info:array<vec4i>;
fn dead(i:u32)->bool{return health[i].kind!=0u&&atomicLoad(&health[health[i].owner].loss)>=65536u;}
fn turn(a:f32,p:vec2f)->vec2f{return vec2f(cos(a)*p.x-sin(a)*p.y,sin(a)*p.x+cos(a)*p.y);}
fn velocity(i:u32,r:vec2f)->vec2f{return incoming[i].xy+incoming[i].z*vec2f(-r.y,r.x);}
@compute @workgroup_size(64) fn capture(@builtin(global_invocation_id) id:vec3u){if(id.x<cfg.count){incoming[id.x]=bodies[id.x].vel;}}
// Each body gathers its own adjacency. Only the owner's fixed-point damage
// counter is shared between limbs; atomic addition makes simultaneous hits safe.
@compute @workgroup_size(64) fn accumulate(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||health[i].kind==0u||dead(i)||counters[3]!=0u||counters[4]!=0u){return;}
 let mass=max(bodies[i].shape.z,1.e-6);var force=0.;var energy=0.;
 for(var j=adj[i];j<adj[i+1u];j++){
  let key=adj[cfg.list+j];if(key<cfg.joints||key-cfg.joints>=cfg.capacity){continue;}
  let c=contacts[key-cfg.joints];if((c.ids.w&0x80000000u)!=0u){continue;}
  let a=c.ids.x;let b=c.ids.y;if(health[a].owner==health[b].owner){continue;}
  let load=abs(c.pl.z);force+=load;
  let ra=turn(bodies[a].initial.z,c.anchors.xy);let rb=turn(bodies[b].initial.z,c.anchors.zw);
  let closing=max(0.,-dot(velocity(a,ra)-velocity(b,rb),c.geo.zw)-2.5);
  energy+=load*cfg.dt*closing/mass;
 }
 if(cfg.armed==0u){loads[i]=max(loads[i],force);return;}
 // Normal support loads are learned while the undamaged fort settles. Extra
 // compression consumes health continuously, including contacts that stay.
 let enemy=health[i].kind==2u;
 let impact=energy/select(70.,12.,enemy);
 let crushing=max(0.,force-loads[i]-mass*select(200.,80.,enemy))*cfg.dt/(mass*select(160.,40.,enemy));
 let lost=min(1.,impact+crushing+select(0.,1.,bodies[i].pose.y< -10.));
 if(lost>0.){atomicAdd(&health[health[i].owner].loss,u32(ceil(lost*65536.)));}
}
@compute @workgroup_size(64) fn removeBodies(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||!dead(i)){return;}
 filters[i]=vec2u(0u);palette[i].w=0.;bodies[i].shape=vec4f(bodies[i].shape.xy,0.,0.);
 bodies[i].vel=vec4f(0.);bodies[i].prev=vec4f(0.);
 bodies[i].initial=vec4f(bodies[i].pose.xyz,0.);bodies[i].inertial=bodies[i].initial;
}
@compute @workgroup_size(64) fn removeJoints(@builtin(global_invocation_id) id:vec3u){
 let j=id.x;if(j>=cfg.joints){return;}let ends=info[j];
 var removed=dead(u32(ends.z));if(ends.y>=0){removed=removed||dead(u32(ends.y));}
 if(removed){joints[j].pen=vec4f(0.);joints[j].lam=vec4f(0.);joints[j].stiff=vec4f(0.);}
}
