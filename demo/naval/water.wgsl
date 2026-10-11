struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Joint {penLin:vec4f,penAng:vec4f,lamLin:vec4f,lamAng:vec4f,c0Lin:vec4f,c0Ang:vec4f,rA:vec4f,rB:vec4f}
struct Piece {ids:vec4u,material:vec4f} // body, team, weld slot, is keel; displaced volume, water thickness, strength, sail area
struct State {health:f32,support:f32,breaks:f32,hits:f32}
struct Shot {ids:vec4u,blast:vec4f,previous:vec4f} // body, team, fired tick, impact tick
struct Settings {step:vec4f,water:vec4f,roots:vec4u,fire:vec4u}
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> pieces:array<Piece>;
@group(0) @binding(2) var<storage,read_write> states:array<State>;
@group(0) @binding(3) var<storage,read_write> joints:array<Joint>;
@group(0) @binding(4) var<storage,read_write> shots:array<Shot>;
@group(0) @binding(5) var<storage,read> waterIn:array<vec4f>;
@group(0) @binding(6) var<storage,read_write> waterOut:array<vec4f>;
@group(0) @binding(7) var<uniform> settings:Settings;
@group(0) @binding(8) var<storage,read_write> filters:array<vec2u>;
@group(0) @binding(9) var<storage,read_write> drives:array<vec4f>;
const N=128u;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn inverse(q:vec4f,v:vec3f)->vec3f{return rotate(vec4f(-q.xyz,q.w),v);}
fn sampleWater(p:vec2f)->vec4f {
 let uv=clamp((p/settings.water.x+.5)*f32(N)-.5,vec2f(0.),vec2f(f32(N)-1.001));
 let ij=vec2u(uv);let f=fract(uv);let i=ij.y*N+ij.x;
 return mix(mix(waterIn[i],waterIn[i+1u],f.x),mix(waterIn[i+N],waterIn[i+N+1u],f.x),f.y);
}
fn flux(q:vec3f,axis:u32)->vec3f {
 let h=max(q.x,.1);let u=q.yz/h;let speed=u[axis];
 var f=vec3f(q[axis+1u],q.y*speed,q.z*speed);
 f[axis+1u]+=.5*9.81*h*h;return f;
}
fn interfaceFlux(a:vec3f,b:vec3f,axis:u32)->vec3f {
 let speed=max(abs(a[axis+1u]/max(a.x,.1))+sqrt(9.81*max(a.x,.1)),abs(b[axis+1u]/max(b.x,.1))+sqrt(9.81*max(b.x,.1)));
 return .5*(flux(a,axis)+flux(b,axis)-speed*(b-a));
}
// Conservative finite-volume shallow-water fluxes, with a damped boundary wave maker.
@compute @workgroup_size(8,8) fn waves(@builtin(global_invocation_id) id:vec3u) {
 if(any(id.xy>=vec2u(N))){return;}
 let i=id.y*N+id.x;let q=waterIn[i].xyz;let dt=settings.step.x;let dx=settings.water.x/f32(N);
 let x0=select(id.x-1u,0u,id.x==0u);let x1=min(id.x+1u,N-1u);
 let y0=select(id.y-1u,0u,id.y==0u);let y1=min(id.y+1u,N-1u);
 var r=q-dt/dx*(interfaceFlux(q,waterIn[id.y*N+x1].xyz,0u)-interfaceFlux(waterIn[id.y*N+x0].xyz,q,0u)
  +interfaceFlux(q,waterIn[y1*N+id.x].xyz,1u)-interfaceFlux(waterIn[y0*N+id.x].xyz,q,1u));
 let p=(vec2f(id.xy)+.5)/f32(N)*settings.water.x-settings.water.x*.5;
 // Momentum disturbances approximate hull wakes; they do not add water mass.
 for(var team=0u;team<2u;team++) {
  let root=bodies[settings.roots[team]];let d=p-root.pos.xy;
  let radial=exp(-dot(d,d)*.35);let wet=clamp(1.-abs(root.pos.z)*.25,0.,1.);
  r.y+=dt*radial*wet*(root.velocity.x*1.2+d.x*root.velocity.z*.45);
  r.z+=dt*radial*wet*(root.velocity.y*1.2+d.y*root.velocity.z*.45);
 }
 for(var s=0u;s<arrayLength(&shots);s++) {
  let shot=shots[s];let age=(settings.step.z-f32(shot.ids.w))*settings.step.x;
  if(shot.ids.w!=0u && age<.18 && abs(shot.blast.z)<2.) {
   let d=p-shot.blast.xy;let k=exp(-dot(d,d)*.8)*(1.-age/.18);
   r=vec3f(r.x,r.yz+d*k*dt*8.);
  }
 }
 let edge=min(min(id.x,N-1u-id.x),min(id.y,N-1u-id.y));
 let sponge=pow(1.-clamp(f32(edge)/12.,0.,1.),2.);
 let phase=p.x*.3+p.y*.13-settings.step.y*1.7;
 let boundaryHeight=settings.water.y+settings.water.z*sin(phase);
 r=mix(r,vec3f(boundaryHeight,settings.water.z*sqrt(9.81*settings.water.y)*sin(phase),0.),sponge*dt*3.);
 r=vec3f(max(r.x,.2),r.yz*exp(-.08*dt));
 waterOut[i]=vec4f(r,0.);
}
fn segmentBox(start:vec3f,end:vec3f,b:Body,radius:f32)->f32 {
 let a=inverse(b.rot,start-b.pos.xyz);let d=inverse(b.rot,end-start);let half=b.size.xyz*.5+radius;
 var lo=0.;var hi=1.;
 for(var k=0u;k<3u;k++) {
  if(abs(d[k])<.00001){if(abs(a[k])>half[k]){return 2.;}}
  else {let t0=(-half[k]-a[k])/d[k];let t1=(half[k]-a[k])/d[k];lo=max(lo,min(t0,t1));hi=min(hi,max(t0,t1));}
 }
 return select(2.,lo,hi>=lo);
}
// Cannon aiming and swept impact detection read the live GPU poses.
@compute @workgroup_size(64) fn cannons(@builtin(global_invocation_id) id:vec3u) {
 if(id.x>=arrayLength(&shots)){return;}
 var shot=shots[id.x];var b=bodies[shot.ids.x];let tick=u32(settings.step.z);
 let team=shot.ids.y;let request=settings.fire[team];
 if(request!=0u && id.x==settings.fire[team+2u]) {
  let root=bodies[settings.roots[team]];let enemy=bodies[settings.roots[1u-team]];
  if(root.pos.z < -1.5 || enemy.pos.z < -3.){return;}
  let side=select(1.,-1.,team==1u);let lane=f32((tick/90u)%3u)-1.;
  let muzzle=root.pos.xyz+rotate(root.rot,vec3f(side*2.,lane*1.45,1.5));
  let aim=enemy.pos.xyz+rotate(enemy.rot,vec3f(-side*1.25,lane*1.45,.55));
  let travel=length(aim.xy-muzzle.xy)/24.;let velocity=(aim-muzzle)/travel+vec3f(0.,0.,4.905*travel);
  b.pos=vec4f(muzzle,b.pos.w);b.rot=vec4f(0,0,0,1);b.initialPos=vec4f(muzzle,0.);b.initialRot=b.rot;
  b.inertialPos=vec4f(muzzle,0.);b.inertialRot=b.rot;b.velocity=vec4f(velocity,0.);b.angular=vec4f(0.);
  shot.ids.z=tick;shot.ids.w=0u;shot.blast=vec4f(0.);shot.previous=vec4f(muzzle,.5*b.size.w*dot(velocity,velocity));
 } else if(shot.ids.z!=0u && shot.ids.w==0u) {
  let start=shot.previous.xyz;let end=b.pos.xyz+b.velocity.xyz*settings.step.x;
  var hit=2.;
  for(var j=0u;j<arrayLength(&pieces);j++) {
   let piece=pieces[j];if(piece.ids.y==team){continue;}
   let candidate=segmentBox(start,end,bodies[piece.ids.x],.23);
   hit=min(hit,candidate);
  }
  if(hit<=1.) {shot.ids.w=tick;shot.blast=vec4f(mix(start,end,hit),shot.previous.w);}
  else if(b.pos.z<sampleWater(b.pos.xy).x-settings.water.y){shot.ids.w=tick;shot.blast=vec4f(b.pos.xyz,1.);}
  shot.previous=vec4f(b.pos.xyz,shot.previous.w);
 }
 shots[id.x]=shot;bodies[shot.ids.x]=b;
}
@compute @workgroup_size(64) fn damage(@builtin(global_invocation_id) id:vec3u) {
 if(id.x>=arrayLength(&pieces)){return;}
 let piece=pieces[id.x];let b=bodies[piece.ids.x];var state=states[id.x];
 // The AVBD weld can also fracture under actual contact loads (grounding,
 // ramming or dragging). Detached pieces keep their material buoyancy.
 if(piece.ids.z!=0xffffffffu && state.health>0.) {
  let joint=joints[piece.ids.z];
  if(joint.penLin.w==0. && joint.penAng.w==0.) {state.health=0.;state.hits+=1.;}
 }
 for(var i=0u;i<arrayLength(&shots);i++) {
  let shot=shots[i];if(shot.ids.y==piece.ids.y || shot.ids.w!=u32(settings.step.z)){continue;}
  let local=inverse(b.rot,shot.blast.xyz-b.pos.xyz);
  let gap=length(max(abs(local)-b.size.xyz*.5,vec3f(0.)));
  if(gap<1.35) {state.health-=shot.blast.w*.35*(1.-gap/1.35);state.hits+=1.;}
 }
 if(state.health<=0. && piece.ids.z!=0xffffffffu) {
  // Disable both rows and their warm starts; leave the body and slot alive.
  var joint=joints[piece.ids.z];joint.penLin=vec4f(0.);joint.penAng=vec4f(0.);joint.lamLin=vec4f(0.);joint.lamAng=vec4f(0.);joints[piece.ids.z]=joint;
  filters[piece.ids.x]=vec2u(4u,0xffffffffu);
 }
 states[id.x]=state;
}
@compute @workgroup_size(64) fn support(@builtin(global_invocation_id) id:vec3u) {
 if(id.x>=arrayLength(&pieces)){return;}
 let piece=pieces[id.x];if(piece.ids.w==0u){return;}
 var broken=0.;var total=0.;var attached=0.;
 for(var i=0u;i<arrayLength(&pieces);i++) {
  if(pieces[i].ids.y!=piece.ids.y || pieces[i].material.w>0.){continue;}
  total+=pieces[i].material.x;
  if(states[i].health>0. || pieces[i].ids.w!=0u){attached+=pieces[i].material.x;}else{broken+=1.;}
 }
 var state=states[id.x];state.breaks=broken;state.support=clamp(attached/max(total,.00001),0.,1.);
 states[id.x]=state;
}
@compute @workgroup_size(64) fn helm(@builtin(global_invocation_id) id:vec3u) {
 if(id.x>=2u){return;}
 let root=bodies[settings.roots[id.x]];
 let destination=vec2f(select(-7.5,7.5,id.x==1u),10.);
 let delta=destination-root.pos.xy;
 let running=settings.roots[id.x+2u]>u32(settings.step.z) && root.pos.z > -1.5;
 drives[id.x]=vec4f(delta/max(length(delta),.001)*9.,0.,select(0.,1.,running));
}
@compute @workgroup_size(64) fn buoyancy(@builtin(global_invocation_id) id:vec3u) {
 if(id.x>=arrayLength(&pieces)){return;}
 let piece=pieces[id.x];var b=bodies[piece.ids.x];let state=states[id.x];
 let volume=piece.material.x;var force=vec3f(0.);var torque=vec3f(0.);
 let vertical=select(max(.15,abs(rotate(b.rot,vec3f(0,0,b.size.z)).z)),piece.material.y,piece.material.y>0.);
 var immersion=0.;
 for(var i=0u;i<4u;i++) {
  let offset=rotate(b.rot,vec3f(select(-.25,.25,(i&1u)!=0u)*b.size.x,select(-.25,.25,(i&2u)!=0u)*b.size.y,0.));
  let p=b.pos.xyz+offset;let w=sampleWater(p.xy);let wet=clamp(.5+(w.x-settings.water.y-p.z)/vertical,0.,1.);
  immersion+=wet*.25;
  let flow=vec3f(w.yz/max(w.x,.2),0.);let relative=b.velocity.xyz+cross(b.angular.xyz,offset)-flow;
  // Exponential drag integration is bounded for light pieces and small inertia.
  let dragRate=select(2.6,8.,piece.material.w>0.);
  let drag=(1.-exp(-settings.step.x*wet*dragRate))*b.size.w/(4.*settings.step.x);
  let f=vec3f(0,0,9.81*volume*wet*.25)-relative*drag;
  force+=f;torque+=cross(offset,f);
 }
 b.velocity=vec4f(b.velocity.xyz+force*settings.step.x/max(b.size.w,.001),b.velocity.w);
 if(piece.material.w>0.) {
  let gust=1.5+.6*sin(settings.step.y*1.8+b.pos.y*.8+b.pos.z*.4);
  let wind=vec3f(gust, .3*sin(settings.step.y*.7),0.);
  let airForce=(wind-b.velocity.xyz)*piece.material.w*.035*(1.-immersion);
  b.velocity=vec4f(b.velocity.xyz+airForce*settings.step.x/max(b.size.w,.001),b.velocity.w);
 }
 let localTorque=inverse(b.rot,torque);let spin=rotate(b.rot,localTorque/max(b.moment.xyz,vec3f(.001)));
 b.angular=vec4f((b.angular.xyz+spin*settings.step.x)*exp(-settings.step.x*1.1),b.angular.w);
 // A short user-requested run toward the shore. Detached debris has no drive.
 let drive=drives[piece.ids.y];
 if(drive.w>0. && state.health>0. && piece.material.w==0.) {
  b.velocity=vec4f(mix(b.velocity.xy,drive.xy,1.-exp(-4.*settings.step.x)),b.velocity.zw);
 }
 bodies[piece.ids.x]=b;
}
