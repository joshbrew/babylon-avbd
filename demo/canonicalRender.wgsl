struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Camera {vp:mat4x4f,eye:vec4f,light:vec4f}
struct Joint {penLin:vec4f,penAng:vec4f,lamLin:vec4f,lamAng:vec4f,c0Lin:vec4f,c0Ang:vec4f,rA:vec4f,rB:vec4f}
struct Style {paint:vec4f,kind:vec4u}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var<storage,read> joints:array<Joint>;
@group(0) @binding(3) var<storage,read> styles:array<Style>;
override PRE_SCALED:u32=0;
override ENHANCED:u32=0;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn up(v:vec3f)->vec3f{return vec3f(v.x,v.z,v.y);}
struct Output {@builtin(position) clip:vec4f,@location(0) normal:vec3f,@location(1) color:vec3f,@location(2) local:vec3f,@location(3) world:vec3f,@location(4) fixed:f32,@location(5) mortar:f32}
@vertex fn vertexMain(@location(0) p:vec3f,@location(1) n:vec3f,@builtin(instance_index) id:u32)->Output {
 let b=bodies[id]; var o:Output;
 let world=up(b.pos.xyz+rotate(b.rot,select(p*b.size.xyz*.5,p,PRE_SCALED!=0u)));
 o.clip=camera.vp*vec4f(world,1);
 if(PRE_SCALED==0u && (styles[id].kind.x!=0u || (b.angular.w!=0.0 && b.angular.w!=2.0))){o.clip=vec4f(2,2,2,1);}
 o.normal=up(rotate(b.rot,n)); o.local=p;
 o.world=world;o.fixed=select(0.,1.,b.size.w==0.0 && b.moment.w>30.);
 let hue=f32((id*37u)%11u)/11.;
 o.color=select(vec3f(.48+.25*hue,.67-.18*hue,.76-.18*hue),vec3f(.68,.66,.61),b.size.w==0.0);
 if(arrayLength(&bodies)>10000u && b.moment.w<5.){o.color=mix(vec3f(.68,.39,.25),vec3f(.94,.63,.26),clamp(length(b.velocity.xyz)*.025,0.,1.));}
 if(ENHANCED!=0u && b.size.w>0.){
  let palette=array<vec3f,7>(vec3f(.74,.42,.28),vec3f(.9,.68,.4),vec3f(.38,.57,.7),vec3f(.54,.69,.63),vec3f(.64,.52,.68),vec3f(.85,.75,.6),vec3f(.58,.64,.72));
  let hash=(id*1664525u+1013904223u)^(id>>3u);o.color=palette[(hash>>8u)%7u]*(.9+.1*f32(hash%101u)/100.);
 }
 if(styles[id].paint.w>0.){o.color=styles[id].paint.xyz;}
 o.mortar=f32(styles[id].kind.z);
 return o;
}
@fragment fn fragmentMain(o:Output)->@location(0) vec4f {
 let n=normalize(o.normal);
 var light=.4+.6*max(dot(n,normalize(vec3f(-.4,1,-.6))),0.);
 if(ENHANCED!=0u){light=.28+.17*max(n.y,0.)+.65*max(dot(n,normalize(vec3f(-.5,1,-.7))),0.)+.12*max(dot(n,normalize(vec3f(.8,.3,.6))),0.);}
 // A screen-space edge gives boxes a readable outline without an extra draw.
 let d=1.-abs(o.local);let edge=min(min(max(d.x,d.y),max(d.y,d.z)),max(d.x,d.z));
 let line=select(1.,.72,PRE_SCALED==0u && edge<.02);
 let gridWidth=max(fwidth(o.world.xz),vec2f(.001));
 let grid=abs(fract(o.world.xz*.2-.5)-.5)/gridWidth;
 let floorGrid=select(1.,.91,o.fixed>.5 && o.normal.y>.9 && min(grid.x,grid.y)<.25);
 let view=normalize(camera.eye.xyz-o.world);
 let specular=select(0.,.08*pow(max(dot(n,normalize(view+normalize(vec3f(-.5,1,-.7)))),0.),40.),ENHANCED!=0u);
 var color=o.color*line;
 let mortarWidth=max(fwidth(edge),.003);
 if(ENHANCED!=0u && o.mortar>.5 && PRE_SCALED==0u){color=mix(vec3f(.86,.83,.76),o.color,smoothstep(.015-mortarWidth,.015+mortarWidth,edge));}
 return vec4f(color*light*floorGrid+specular,1);
}
@vertex fn lineMain(@location(0) anchor:vec3f,@location(1) info:vec3f)->Output {
 var p=anchor; if(info.x>=0.){let b=bodies[u32(info.x)];p=b.pos.xyz+rotate(b.rot,anchor);}
 var o:Output; o.clip=camera.vp*vec4f(up(p),1);o.normal=vec3f(0,1,0);o.local=vec3f(0);o.color=vec3f(.28,.18,.12);o.world=up(p);o.fixed=0.;o.mortar=0.;
 let j=joints[u32(info.y)];if(j.penLin.w==0. && j.penAng.w==0.){o.clip=vec4f(2,2,2,1);}
 return o;
}
@fragment fn lineFragment(o:Output)->@location(0) vec4f{return vec4f(o.color,1);}
@vertex fn pointMain(@location(0) anchor:vec3f,@location(1) info:vec3f)->Output {
 let b=bodies[u32(info.x)];var o:Output;
 o.world=up(b.pos.xyz+rotate(b.rot,anchor));o.clip=camera.vp*vec4f(o.world,1);
 o.clip.x+=info.y*3./camera.light.x*o.clip.w;o.clip.y+=info.z*3./camera.light.y*o.clip.w;
 o.normal=vec3f(0,1,0);o.local=vec3f(0);o.color=vec3f(.83,.25,.39);o.fixed=0.;o.mortar=0.;return o;
}
