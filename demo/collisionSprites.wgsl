struct Bullet { posLife:vec4f, velRadius:vec4f, seed:vec4u }
struct Triangle { a:vec4f,b:vec4f,c:vec4f }
struct Camera { vp:mat4x4f,viewport:vec4f }
@group(0) @binding(0) var<storage,read> bullets:array<Bullet>;
@group(0) @binding(1) var<storage,read> triangles:array<Triangle>;
@group(0) @binding(2) var<uniform> camera:Camera;
struct Output { @builtin(position) clip:vec4f,@location(0) uv:vec2f }
@vertex fn shieldDepth(@builtin(vertex_index) v:u32)->Output {
 let t=triangles[v/3u];let p=select(select(t.a,t.b,v%3u==1u),t.c,v%3u==2u);
 var o:Output;o.clip=camera.vp*vec4f(p.xyz,1);o.uv=vec2f(0);return o;
}
@vertex fn sprite(@builtin(vertex_index) v:u32,@builtin(instance_index) id:u32)->Output {
 let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(1,1),vec2f(-1,-1),vec2f(1,1),vec2f(-1,1));
 let b=bullets[id];var o:Output;let c=corners[v];o.uv=c;
 o.clip=camera.vp*vec4f(b.posLife.xyz,1);
 // At least a two-pixel radius, preserving visibility when zoomed out.
 let radius=max(b.velRadius.w*camera.viewport.z,max(o.clip.w,0.)*4./camera.viewport.y);
 let offset=c*vec2f(radius*camera.viewport.y/camera.viewport.x,radius);
 o.clip=vec4f(o.clip.xy+offset,o.clip.zw);
 if(b.posLife.w<=0.){o.clip=vec4f(2,2,2,1);}
 return o;
}
@fragment fn fragment(o:Output)->@location(0) vec4f {
 let d=length(o.uv);if(d>1.){discard;}
 let alpha=1.-smoothstep(.7,1.,d);
 return vec4f(vec3f(.25,.78,1.)*alpha,alpha);
}
