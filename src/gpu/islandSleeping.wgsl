struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct State { mass:f32, quiet:f32, asleep:u32, support:atomic<u32>, eligible:u32, parent:atomic<u32>, wake:atomic<u32>, pad2:u32 }
struct Manifold { ids:vec4u, geo:vec4f }
struct Params { count:u32,joints:u32,manifolds:u32,forceWake:u32,speed:f32,delay:f32,dt:f32,gravity:f32,up:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> states:array<State>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> manifolds:array<Manifold>;
@group(0) @binding(4) var<storage,read> counters:array<u32>;
@group(0) @binding(5) var<storage,read_write> globals:array<atomic<u32>>;
@group(0) @binding(6) var<uniform> params:Params;
fn speed(i:u32)->f32 {return length(bodies[i].velocity.xyz)+length(bodies[i].angular.xyz)*bodies[i].moment.w;}
fn wake(i:u32) {if(states[i].mass>0.){bodies[i].size.w=states[i].mass;states[i].asleep=0u;states[i].quiet=0.;}}
@compute @workgroup_size(64) fn before(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count){return;}
  if(params.forceWake!=0u||atomicLoad(&globals[0])!=0u){wake(i);atomicStore(&states[i].parent,i);}
  atomicStore(&states[i].wake,0u);
  atomicStore(&states[i].support,0u);
}
@compute @workgroup_size(1) fn clear() {atomicStore(&globals[0],0u);atomicStore(&globals[1],0u);}
fn impact(a:u32,b:u32) {
  if(states[a].asleep!=0u && states[b].asleep==0u && speed(b)>2.*params.speed){let r=root(a);if(r<params.count){atomicStore(&states[r].wake,1u);}else{atomicStore(&globals[0],1u);}}
}
@compute @workgroup_size(64) fn contacts(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}
  let a=m.ids.x;let b=m.ids.y;impact(a,b);impact(b,a);
  let up=dot(m.geo.xyz,params.up.xyz);
  if(bodies[b].size.w==0. && up>0.3){atomicStore(&states[a].support,1u);}
  if(bodies[a].size.w==0. && up < -0.3){atomicStore(&states[b].support,1u);}
}
@compute @workgroup_size(64) fn joints(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.joints){return;}let j=info[i];if(j.x==0||j.y<0){return;}
  impact(u32(j.y),u32(j.z));impact(u32(j.z),u32(j.y));
}
@compute @workgroup_size(64) fn rest(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count||states[i].mass<=0.){return;}
  if(states[i].eligible==0u){wake(i);return;}
  let r=root(i);
  if(r>=params.count || atomicLoad(&states[min(r,params.count-1u)].wake)!=0u || atomicLoad(&globals[0])!=0u || counters[3]!=0u || counters[4]!=0u){wake(i);return;}
  if(states[i].asleep==0u){
    if(speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u)) {states[i].quiet+=params.dt;}
    else {states[i].quiet=0.;}
    if(states[i].quiet>=params.delay){
      states[i].asleep=1u;bodies[i].size.w=0.;bodies[i].velocity=vec4f(0.);bodies[i].angular=vec4f(vec3f(0.),bodies[i].angular.w);
    }
  }
  if(states[i].asleep!=0u){atomicAdd(&globals[1],1u);}
}

// Dynamic connectivity is conservative: unions persist while asleep because
// collision detection intentionally omits pairs of sleeping bodies. Explicit
// edits wake the world and reset this history. Shared static ground never joins
// otherwise independent piles. No thread waits for another workgroup.
fn root(index:u32)->u32 {
  var i=index;
  for(var attempt=0u;attempt<256u;attempt++) {
    if(i>=params.count){atomicStore(&globals[0],1u);return params.count;}
    let p=atomicLoad(&states[i].parent);
    if(p==i){return i;}
    if(p>i){atomicStore(&globals[0],1u);return params.count;}
    let gp=atomicLoad(&states[p].parent);
    atomicMin(&states[i].parent,gp);
    i=gp;
  }
  // Excessive depth is a safe wake-all fallback, never a cross-group wait.
  atomicStore(&globals[0],1u);return params.count;
}
fn connect(a:u32,b:u32) {
  if(a>=params.count || b>=params.count || states[a].mass<=0. || states[b].mass<=0.){return;}
  for(var attempt=0u;attempt<256u;attempt++) {
    let ra=root(a);let rb=root(b);
    if(ra==rb || ra>=params.count || rb>=params.count){return;}
    let hi=max(ra,rb);let lo=min(ra,rb);
    let result=atomicCompareExchangeWeak(&states[hi].parent,hi,lo);
    if(result.exchanged){return;}
  }
  atomicStore(&globals[0],1u);
}
@compute @workgroup_size(64) fn connectContacts(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}
  connect(m.ids.x,m.ids.y);
}
@compute @workgroup_size(64) fn connectJoints(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=params.joints){return;}let j=info[i];
  if(j.x!=0 && j.y>=0 && j.z>=0){connect(u32(j.y),u32(j.z));}
}
