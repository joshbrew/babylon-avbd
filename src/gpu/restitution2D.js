import { PRELUDE } from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import { Restitution } from "./restitution.js";
const code = `${PRELUDE}
struct Config { count:u32,joints:u32,capacity:u32,list:u32,threshold:f32,dt:f32,pad0:u32,pad1:u32 }
struct Velocity { incoming:vec4f, incomingAngular:vec4f, linear:vec4f, angular:vec4f }
struct Bounce { impulse:f32,delta:f32,reboundSpeed:f32,inverseMass:f32,rA:vec4f,rB:vec4f }
@group(0) @binding(0) var<uniform> cfg:Config;
@group(0) @binding(1) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(2) var<storage,read_write> velocities:array<Velocity>;
@group(0) @binding(3) var<storage,read> materials:array<f32>;
@group(0) @binding(4) var<storage,read> unused:array<Contact>;
@group(0) @binding(5) var<storage,read> contacts:array<Contact>;
@group(0) @binding(6) var<storage,read> adj:array<u32>;
@group(0) @binding(7) var<storage,read> counters:array<u32>;
@group(0) @binding(8) var<storage,read_write> bounce:array<Bounce>;
fn invMass(i:u32)->f32{return select(0.,1./max(bodies[i].shape.z,1.e-20),bodies[i].shape.z>0.);}
fn invMoment(i:u32)->f32{return select(0.,1./max(bodies[i].shape.w,1.e-20),bodies[i].shape.z>0.&&bodies[i].shape.w>0.);}
fn cross2(a:vec2f,b:vec2f)->f32{return a.x*b.y-a.y*b.x;}
fn pointVelocity(i:u32,r:vec2f,incoming:bool)->vec2f{let v=select(velocities[i].linear,velocities[i].incoming,incoming);return v.xy+v.z*vec2f(-r.y,r.x);}
@compute @workgroup_size(64) fn captureIncoming(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=cfg.count){return;}velocities[i].incoming=bodies[i].vel;}
@compute @workgroup_size(64) fn captureSolved(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=cfg.count){return;}velocities[i].linear=bodies[i].vel;}
@compute @workgroup_size(64) fn initialize(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;let count=min(counters[C_CONTACTS],cfg.capacity);if(i>=count){return;}
 bounce[i]=Bounce(0.,0.,0.,0.,vec4f(0.),vec4f(0.));
 let c=contacts[i];let a=c.ids.x;let b=c.ids.y;let e=max(materials[a],materials[b]);
 if(e<=0. || counters[C_OVERFLOW]!=0u || counters[C_CLASHES]!=0u || (c.ids.w&0x80000000u)!=0u){return;}
 // Two face points belong to one pair. Apply a single centroid impulse, so
 // point count cannot multiply bounce strength or introduce spurious spin.
 if(i>0u && all(contacts[i-1u].ids.xy==c.ids.xy)){return;}
 var ra=rot(bodies[a].pose.z,c.anchors.xy);var rb=rot(bodies[b].pose.z,c.anchors.zw);
 if(i+1u<count && all(contacts[i+1u].ids.xy==c.ids.xy)){let d=contacts[i+1u];ra=.5*(ra+rot(bodies[a].pose.z,d.anchors.xy));rb=.5*(rb+rot(bodies[b].pose.z,d.anchors.zw));}
 let n=c.geo.zw;let vn=dot(n,pointVelocity(a,ra,true)-pointVelocity(b,rb,true));if(vn>=-cfg.threshold){return;}
 let ta=cross2(ra,n);let tb=cross2(rb,n);let k=invMass(a)+invMass(b)+ta*ta*invMoment(a)+tb*tb*invMoment(b);if(k<=0.){return;}
 bounce[i]=Bounce(0.,0.,-e*vn,k,vec4f(ra,0.,0.),vec4f(rb,0.,0.));
}
@compute @workgroup_size(64) fn pairs(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=min(counters[C_CONTACTS],cfg.capacity)){return;}var s=bounce[i];if(s.inverseMass<=0.){return;}
 let c=contacts[i];let a=c.ids.x;let b=c.ids.y;let vn=dot(c.geo.zw,pointVelocity(a,s.rA.xy,false)-pointVelocity(b,s.rB.xy,false));
 let degree=max(1u,max(adj[a+1u]-adj[a],adj[b+1u]-adj[b]));let impulse=max(0.,s.impulse+(s.reboundSpeed-vn)/(s.inverseMass*f32(degree)));
 s.delta=impulse-s.impulse;s.impulse=impulse;bounce[i]=s;
}
@compute @workgroup_size(64) fn apply(@builtin(global_invocation_id) id:vec3u){
 let i=id.x;if(i>=cfg.count||bodies[i].shape.z<=0.){return;}var dv=vec3f(0.);
 for(var j=adj[i];j<adj[i+1u];j++){let key=adj[cfg.list+j];if(key<cfg.joints){continue;}let c=contacts[key-cfg.joints];let s=bounce[key-cfg.joints];if(s.inverseMass<=0.){continue;}
 let isA=i==c.ids.x;let impulse=c.geo.zw*s.delta*select(-1.,1.,isA);dv+=vec3f(impulse*invMass(i),cross2(select(s.rB.xy,s.rA.xy,isA),impulse)*invMoment(i));}
 velocities[i].linear+=vec4f(dv,0.);
}
@compute @workgroup_size(64) fn writeBack(@builtin(global_invocation_id) id:vec3u){let i=id.x;if(i>=cfg.count||bodies[i].shape.z<=0.){return;}bodies[i].vel=velocities[i].linear;}
`;
export class Restitution2D extends Restitution {
  constructor(solver) {
    super(solver, { code, dimension: 2 });
  }
}
