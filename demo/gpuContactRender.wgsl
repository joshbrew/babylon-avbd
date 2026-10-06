// Read the canonical solver's completed contact buffers directly. These layouts
// match avbd3d/gpu/layout.ts; no contact data is copied to the CPU for this view.
struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Camera {vp:mat4x4f,eye:vec4f,light:vec4f}
struct Manifold {ids:vec4u,geo:vec4f}
struct Contact {rA:vec4f,rB:vec4f,pen:vec4f,lambda:vec4f}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var<storage,read> manifolds:array<Manifold>;
@group(0) @binding(3) var<storage,read> contacts:array<Contact>;
@group(0) @binding(4) var<storage,read> counters:array<u32>;
const CORNERS=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,1));
const MAX_MANIFOLDS=512u;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@vertex fn vertexMain(@builtin(vertex_index) v:u32,@builtin(instance_index) instance:u32)->@builtin(position) vec4f {
 let hidden=vec4f(2,2,2,1);
 let count=min(counters[6],arrayLength(&manifolds));
 let slot=instance/4u;
 if(slot>=min(count,MAX_MANIFOLDS)){return hidden;}
 // Sample across the entire contact region when it exceeds the display budget.
 let index=select(slot,slot*count/MAX_MANIFOLDS,count>MAX_MANIFOLDS);
 let m=manifolds[index];let point=instance%4u;let k=m.ids.z+point;
 if(point>=(m.ids.w&15u)||k>=min(counters[1],arrayLength(&contacts))||m.ids.x>=arrayLength(&bodies)){return hidden;}
 let b=bodies[m.ids.x];let p=b.pos.xyz+rotate(b.rot,contacts[k].rA.xyz);
 var clip=camera.vp*vec4f(p.x,p.z,p.y,1);
 clip.x+=CORNERS[v].x*3./camera.light.x*clip.w;
 clip.y+=CORNERS[v].y*3./camera.light.y*clip.w;
 return clip;
}
@fragment fn fragmentMain()->@location(0) vec4f {return vec4f(.83,.25,.39,1);}
