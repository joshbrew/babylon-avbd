struct Camera {vp:mat4x4f,eye:vec4f,light:vec4f}
struct Settings {step:vec4f,water:vec4f,roots:vec4u,fire:vec4u}
struct Shot {ids:vec4u,blast:vec4f,previous:vec4f}
@group(0) @binding(0) var<storage,read> water:array<vec4f>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var<uniform> settings:Settings;
@group(0) @binding(3) var<storage,read> shots:array<Shot>;
struct Out {@builtin(position) clip:vec4f,@location(0) world:vec3f,@location(1) normal:vec3f,@location(2) foam:f32}
const N=128u;
@vertex fn waterVertex(@builtin(vertex_index) v:u32)->Out {
 let corners=array<vec2u,6>(vec2u(0,0),vec2u(0,1),vec2u(1,0),vec2u(1,0),vec2u(0,1),vec2u(1,1));
 let cell=v/6u;let xy=vec2u(cell%(N-1u),cell/(N-1u))+corners[v%6u];let i=xy.y*N+xy.x;
 let dx=settings.water.x/f32(N);let x0=select(xy.x-1u,0u,xy.x==0u);let x1=min(xy.x+1u,N-1u);
 let y0=select(xy.y-1u,0u,xy.y==0u);let y1=min(xy.y+1u,N-1u);
 let dh=vec2f(water[xy.y*N+x1].x-water[xy.y*N+x0].x,water[y1*N+xy.x].x-water[y0*N+xy.x].x)/(2.*dx);
 let p=(vec2f(xy)+.5)/f32(N)*settings.water.x-settings.water.x*.5;
 var o:Out;o.world=vec3f(p.x,water[i].x-settings.water.y,p.y);o.normal=normalize(vec3f(-dh.x,1.,-dh.y));
 o.clip=camera.vp*vec4f(o.world,1.);o.foam=length(dh);return o;
}
@fragment fn waterFragment(o:Out)->@location(0) vec4f {
 let n=normalize(o.normal);let view=normalize(camera.eye.xyz-o.world);let sun=normalize(vec3f(-.4,1.,-.5));
 let fresnel=pow(1.-max(dot(n,view),0.),4.);
 let shimmer=pow(max(dot(n,normalize(view+sun)),0.),100.);
 let bands=.5+.5*sin(o.world.x*.65+o.world.z*.25+settings.step.y*.4);
 var color=mix(vec3f(.07,.42,.52),vec3f(.26,.68,.70),bands*.22+fresnel*.65);
 color+=vec3f(1.,.9,.65)*shimmer*.7;
 let foam=smoothstep(.12,.32,o.foam);color=mix(color,vec3f(.78,.93,.88),foam*.7);
 return vec4f(color,.93);
}
// Short-lived spray is drawn from shot records; hull fragments never expire.
@vertex fn sprayVertex(@builtin(vertex_index) v:u32,@builtin(instance_index) instance:u32)->Out {
 let shot=shots[instance/20u];let particle=instance%20u;
 let age=(settings.step.z-f32(shot.ids.w))*settings.step.x;
 let phase=f32(particle)*2.39996;let radius=.4+f32(particle%5u)*.12;
 let dir=vec3f(cos(phase)*radius,sin(phase)*radius,1.2+f32(particle%4u)*.35);
 let p=shot.blast.xyz+dir*age*4.+vec3f(0,0,-4.905*age*age);
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));
 var o:Out;o.world=vec3f(p.x,p.z,p.y);o.normal=vec3f(0,1,0);o.foam=age;
 o.clip=camera.vp*vec4f(o.world,1.);o.clip=vec4f(o.clip.xy+corners[v]*.09*vec2f(camera.vp[0][0],camera.vp[1][1]),o.clip.zw);
 if(shot.ids.w==0u||age>1.3||age<0.){o.clip=vec4f(2,2,2,1);}
 return o;
}
@fragment fn sprayFragment(o:Out)->@location(0) vec4f{return vec4f(.93,.96,.87,max(0.,1.-o.foam/1.3));}
