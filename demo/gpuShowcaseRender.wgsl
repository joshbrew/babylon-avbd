struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Camera {vp:mat4x4f,eye:vec4f,viewport:vec4f}
struct Style {paint:vec4f,kind:vec4u}
struct ClothVertex {neighbors:vec4u,extra:vec4u}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var<storage,read> styles:array<Style>;
@group(0) @binding(3) var<storage,read> instances:array<u32>;
@group(0) @binding(4) var<storage,read> cloth:array<ClothVertex>;
@group(0) @binding(5) var clothTexture:texture_2d<f32>;
@group(0) @binding(6) var clothSampler:sampler;
override KIND:u32=1;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn up(v:vec3f)->vec3f{return vec3f(v.x,v.z,v.y);}
struct Output {@builtin(position) clip:vec4f,@location(0) normal:vec3f,@location(1) color:vec3f,@location(2) uv:vec2f,@location(3) metal:f32}
@vertex fn shapeMain(@location(0) vertex:vec3f,@location(1) normal:vec3f,@builtin(instance_index) instance:u32)->Output {
 let id=instances[instance];let b=bodies[id];let style=styles[id];var p=vertex;var n=normal;
 if(KIND==1u){p*=b.size.x*.5;}
 if(KIND==2u){let r=min(b.size.y,b.size.z)*.5;let halfLength=max(0.,b.size.x*.5-r);p=vertex*r+vec3f(sign(vertex.x)*halfLength,0,0);}
 if(KIND>=3u){p*=b.size.x*bitcast<f32>(styles[id].kind.w);
  if(KIND==4u){p=vec3f(p.x,-p.z,p.y);n=vec3f(n.x,-n.z,n.y);}
  if(KIND==5u){p=vec3f(p.z,p.x,p.y);n=vec3f(n.z,n.x,n.y);}
 }
 var o:Output;let world=up(b.pos.xyz+rotate(b.rot,p));o.clip=camera.vp*vec4f(world,1);o.normal=up(rotate(b.rot,n));
 o.color=select(vec3f(.59,.67,.73),style.paint.xyz,style.paint.w>0.);o.uv=vec2f(0);o.metal=f32(style.kind.y);return o;
}
@fragment fn shapeFragment(o:Output)->@location(0) vec4f {
 let n=normalize(o.normal);let diffuse=.38+.62*max(dot(n,normalize(vec3f(-.4,1,-.6))),0.);
 let shine=pow(max(dot(n,normalize(vec3f(.3,1,-.3))),0.),32.)*.35*o.metal;
 return vec4f(o.color*diffuse+vec3f(shine),1);
}
@vertex fn clothMain(@builtin(vertex_index) id:u32)->Output {
 let v=cloth[id];let p=bodies[v.neighbors.x].pos.xyz;
 let dx=bodies[v.neighbors.z].pos.xyz-bodies[v.neighbors.y].pos.xyz;
 let dy=bodies[v.extra.x].pos.xyz-bodies[v.neighbors.w].pos.xyz;
 let crossNormal=cross(dx,dy);let n=crossNormal/max(length(crossNormal),.00001);
 // Extend the boundary to cover the outer half-plates, as in the original viewer.
 let uv=bitcast<vec2f>(v.extra.yz);var edge=vec3f(0);
 if(uv.x==0.){edge-=dx*.5;}if(uv.x==1.){edge+=dx*.5;}
 if(uv.y==0.){edge-=dy*.5;}if(uv.y==1.){edge+=dy*.5;}
 var o:Output;o.clip=camera.vp*vec4f(up(p+edge+n*.052),1);o.normal=up(n);o.color=vec3f(1);o.uv=uv;o.metal=0.;return o;
}
@fragment fn clothFragment(o:Output,@builtin(front_facing) front:bool)->@location(0) vec4f {
 let n=normalize(o.normal)*select(-1.,1.,front);let light=.5+.5*max(dot(n,normalize(vec3f(-.4,1,-.6))),0.);
 return vec4f(textureSample(clothTexture,clothSampler,o.uv).rgb*light,1);
}
