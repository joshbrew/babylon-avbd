struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct State { mass:f32, quiet:f32, asleep:u32, support:atomic<u32>, eligible:u32, parent:atomic<u32>, wake:atomic<u32>, pad2:u32 }
struct Manifold { ids:vec4u, geo:vec4f }
struct Params { count:u32,joints:u32,manifolds:u32,forceWake:u32,speed:f32,delay:f32,dt:f32,gravity:f32,up:vec3f,pairs:u32 }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read_write> states:array<State>;
@group(0) @binding(2) var<storage,read> info:array<vec4i>;
@group(0) @binding(3) var<storage,read> manifolds:array<Manifold>;
@group(0) @binding(4) var<storage,read_write> counters:array<u32>;
@group(0) @binding(5) var<storage,read_write> globals:array<atomic<u32>>;
@group(0) @binding(6) var<uniform> params:Params;
fn speed(i:u32)->f32 {return length(bodies[i].velocity.xyz)+length(bodies[i].angular.xyz)*bodies[i].moment.w;}
fn wake(i:u32) {if(states[i].mass>0.){bodies[i].size.w=states[i].mass;states[i].asleep=0u;states[i].quiet=0.;states[i].pad2=0u;}}
@compute @workgroup_size(64) fn before(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count){return;}
  if((params.forceWake&1u)!=0u||atomicLoad(&globals[0])!=0u){wake(i);atomicStore(&states[i].parent,i);}
  else if((states[i].pad2&10u)!=0u){let held=states[i].pad2&2u;wake(i);states[i].pad2|=held;}
  // Rebuild live connectivity after bodies wake or separate. Only sleeping
  // subtrees need history, since their static/static contact pairs are omitted.
  if(states[i].asleep==0u){atomicStore(&states[i].parent,i);}
  if((params.forceWake&2u)!=0u && speed(i)<=params.speed && states[i].eligible!=0u){states[i].pad2|=4u;}
  atomicStore(&states[i].wake,0u);
  atomicStore(&states[i].support,0u);
}
@compute @workgroup_size(1) fn clear() {atomicStore(&globals[0],0u);atomicStore(&globals[1],0u);atomicStore(&globals[2],0u);atomicStore(&globals[3],0u);}
// Gather old roots before before() resets awake parents. Separate dispatches
// prevent another workgroup from clearing a wake request before it is consumed.
@compute @workgroup_size(64) fn requestWake(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=params.count || states[i].asleep==0u || (states[i].pad2&2u)==0u){return;}
  let r=root(i);if(r<params.count){atomicOr(&states[r].wake,8u);}
}
@compute @workgroup_size(64) fn gatherWake(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=params.count){return;}
  let r=root(i);if(r<params.count && (atomicLoad(&states[r].wake)&8u)!=0u){states[i].pad2|=8u;}
}
fn impact(a:u32,b:u32) {
  if(states[a].asleep!=0u && states[b].asleep==0u && speed(b)>2.*params.speed){signalWake(a);}
}
fn signalWake(i:u32){atomicStore(&globals[3],1u);let r=root(i);if(r<params.count){atomicOr(&states[r].wake,1u);}else{atomicStore(&globals[0],1u);}}
@compute @workgroup_size(64) fn contacts(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=min(counters[6],params.manifolds)){return;}
  let m=manifolds[i];if((m.ids.w&15u)==0u || (m.ids.w&0x80000000u)!=0u){return;}
  let a=m.ids.x;let b=m.ids.y;
  manifoldImpact(m,false);
  let up=dot(m.geo.xyz,params.up.xyz);
  if(up>0.3){support(a,b);}
  if(up < -0.3){support(b,a);}
  if((params.forceWake&2u)!=0u){
    if(states[b].mass<=0. && speed(b)<=params.speed && up>0.3 && states[a].mass>0.){atomicOr(&states[root(a)].wake,2u);}
    if(states[a].mass<=0. && speed(a)<=params.speed && up< -0.3 && states[b].mass>0.){atomicOr(&states[root(b)].wake,2u);}
  }
}
// Restore the complete old sleeping island before topology and warm starting.
// The spatial structures retain every body, so only pair/contact generation
// needs a conditional refresh when static sleepers become dynamic again.
@compute @workgroup_size(64) fn applyImpact(@builtin(global_invocation_id) id:vec3u){
  if(atomicLoad(&globals[3])==0u && atomicLoad(&globals[0])==0u){return;}
  let i=id.x;if(i>=params.count || states[i].asleep==0u){return;}
  let r=root(i);
  if(r>=params.count || atomicLoad(&globals[0])!=0u || (atomicLoad(&states[min(r,params.count-1u)].wake)&1u)!=0u){
    wake(i);atomicAdd(&globals[2],1u);
  }
}
@compute @workgroup_size(64) fn joints(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.joints){return;}let j=info[i];if(j.x==0||j.y<0){return;}
  impact(u32(j.y),u32(j.z));impact(u32(j.z),u32(j.y));
}
@compute @workgroup_size(64) fn rest(@builtin(global_invocation_id) id:vec3u) {
  let i=id.x;if(i>=params.count||states[i].mass<=0.){return;}
  if(states[i].eligible==0u){wake(i);return;}
  let r=root(i);
  let flags=atomicLoad(&states[min(r,params.count-1u)].wake);
  if(r>=params.count || (flags&1u)!=0u || atomicLoad(&globals[0])!=0u || counters[3]!=0u || counters[4]!=0u){wake(i);return;}
  let initiallyQuiet=(states[i].pad2&4u)!=0u;
  let held=(states[i].pad2&2u)!=0u;
  states[i].pad2=select(0u,1u,speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u));
  if(states[i].asleep==0u){
    if(speed(i)<=params.speed && (params.gravity==0. || atomicLoad(&states[i].support)!=0u)) {states[i].quiet+=params.dt;}
    else {states[i].quiet=0.;}
    if(!held && ((states[i].quiet>=params.delay && (flags&4u)==0u) || ((params.forceWake&2u)!=0u && initiallyQuiet && (flags&6u)==2u))){
      states[i].asleep=1u;bodies[i].size.w=0.;bodies[i].velocity=vec4f(0.);bodies[i].angular=vec4f(vec3f(0.),bodies[i].angular.w);
    }
  }
  if(states[i].asleep!=0u){atomicAdd(&globals[1],1u);}
}
// Startup sleep is restricted to contact islands connected to stationary solid
// support, with no moving or sleep-excluded member. Floating groups stay awake.
@compute @workgroup_size(64) fn activity(@builtin(global_invocation_id) id:vec3u){
  let i=id.x;if(i>=params.count||states[i].mass<=0.){return;}
  var busy=false;
  if((params.forceWake&2u)!=0u){busy=(states[i].pad2&4u)==0u;}
  else if(states[i].asleep==0u){
    busy=speed(i)>params.speed;
    if(states[i].eligible!=0u && (states[i].pad2&2u)==0u){
      busy=busy || states[i].quiet+params.dt<params.delay || (params.gravity!=0. && atomicLoad(&states[i].support)==0u);
    }
  }
  if(busy){let r=root(i);if(r<params.count){atomicOr(&states[r].wake,4u);}}
}

// Dynamic connectivity is conservative: unions persist while asleep because
// collision detection intentionally omits pairs of sleeping bodies. The
// awake bodies rebuild their links each step. Shared static ground never joins
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
