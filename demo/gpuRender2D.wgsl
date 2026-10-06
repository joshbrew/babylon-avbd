// avbd2d/gpu/layout.ts: six vec4s (96 bytes) per body.
struct Body {pose:vec4f,initial:vec4f,inertial:vec4f,velocity:vec4f,prevVelocity:vec4f,shape:vec4f}
struct Camera {view:vec4f,viewport:vec4f}
struct Link {anchors:vec4f,ids:vec4f}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var<storage,read> links:array<Link>;
@group(0) @binding(3) var<storage,read> contacts:array<vec4f>;
const CORNERS=array<vec2f,6>(vec2f(-.5,-.5),vec2f(.5,-.5),vec2f(.5,.5),vec2f(-.5,-.5),vec2f(.5,.5),vec2f(-.5,.5));
fn rotate(a:f32,p:vec2f)->vec2f{return vec2f(cos(a)*p.x-sin(a)*p.y,sin(a)*p.x+cos(a)*p.y);}
fn clip(p:vec2f)->vec4f{return vec4f((p-camera.view.xy)*camera.view.z*2./camera.viewport.xy,0.,1.);}
struct Output {@builtin(position) position:vec4f,@location(0) local:vec2f,@location(1) color:vec3f,@location(2) size:vec2f}
@vertex fn bodyMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) id:u32)->Output {
 let b=bodies[id];let local=CORNERS[vertex];var o:Output;
 o.position=clip(b.pose.xy+rotate(b.pose.z,local*b.shape.xy));o.local=local;o.size=b.shape.xy*camera.view.z;
 let hue=f32((id*37u)%11u)/11.;
 o.color=select(vec3f(.48+.25*hue,.67-.18*hue,.76-.18*hue),vec3f(.67,.66,.62),b.shape.z==0.);
 if(b.velocity.w!=0.){o.color=mix(o.color,vec3f(.3,.65,.4),.6);}
 if(f32(id)==camera.view.w){o.color=vec3f(.4,.5,.95);}
 return o;
}
@fragment fn bodyFragment(o:Output)->@location(0) vec4f {
 let edge=min((.5-abs(o.local.x))*o.size.x,(.5-abs(o.local.y))*o.size.y);
 return vec4f(o.color*select(1.,.65,edge<1.),1.);
}
@vertex fn linkMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) id:u32)->@builtin(position) vec4f {
 let l=links[id];if(l.ids.z==0.){return vec4f(2,2,2,1);}
 let body=select(l.ids.x,l.ids.y,vertex==1u);var p=select(l.anchors.xy,l.anchors.zw,vertex==1u);
 if(body>=0.){let b=bodies[u32(body)];p=b.pose.xy+rotate(b.pose.z,p);}
 return clip(p);
}
@fragment fn linkFragment()->@location(0) vec4f {return vec4f(.47,.32,.23,1.);}
@vertex fn contactMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) id:u32)->@builtin(position) vec4f {
 let point=contacts[id];let b=bodies[u32(point.z)];var p=clip(b.pose.xy+rotate(b.pose.z,point.xy));
 let corner=CORNERS[vertex]*2.;p.x+=corner.x*3./camera.viewport.x;p.y+=corner.y*3./camera.viewport.y;return p;
}
@fragment fn contactFragment()->@location(0) vec4f {return vec4f(.83,.25,.39,1.);}
