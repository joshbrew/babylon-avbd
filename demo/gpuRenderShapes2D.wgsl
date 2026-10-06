@group(0) @binding(4) var<storage,read> geometry:array<vec4f>;
struct ShapeOutput {
 @builtin(position) position:vec4f,@location(0) local:vec2f,@location(1) color:vec3f,
 @location(2) size:vec2f,@location(3) geometry:vec4f,@location(4) scale:f32,@location(5) trigger:f32
}
@vertex fn shapeMain(@builtin(vertex_index) vertex:u32,@builtin(instance_index) id:u32)->ShapeOutput {
 let b=bodies[id];let g=geometry[id];let scale=camera.view.z;var size=b.shape.xy;var center=b.pose.xy;
 if(g.x==1.){size=vec2f(2.*g.y);}
 else if(g.x==2.){size=vec2f(2.*(g.y+g.z),max(2.*g.y,2./scale));}
 else if(g.x==3.) {
  let tangent=rotate(b.pose.z,vec2f(1.,0.));
  center+=tangent*dot(camera.view.xy-center,tangent);
  size=vec2f(2.*length(camera.viewport.xy)/scale,2./scale);
 }
 let local=CORNERS[vertex]*(size+vec2f(3./scale));var out:ShapeOutput;
 out.position=clip(center+rotate(b.pose.z,local));out.local=local;out.size=size;out.geometry=g;out.scale=scale;out.trigger=b.initial.w;
 let hue=f32((id*37u)%11u)/11.;
 out.color=select(vec3f(.48+.25*hue,.67-.18*hue,.76-.18*hue),vec3f(.50,.49,.45),b.shape.z==0.);
 if(b.velocity.w!=0.){out.color=mix(out.color,vec3f(.3,.65,.4),.6);}
 if(f32(id)==camera.view.w){out.color=vec3f(.4,.5,.95);}
 return out;
}
@fragment fn shapeFragment(out:ShapeOutput)->@location(0) vec4f {
 let g=out.geometry;let p=out.local;var distance=0.;
 if(g.x==1.){distance=length(p)-g.y;}
 else if(g.x==2.){distance=length(p-vec2f(clamp(p.x,-g.z,g.z),0.))-max(g.y,1./out.scale);}
 else if(g.x==3.){distance=abs(p.y)-1./out.scale;}
 else if(g.x==4.) {
  var signed= -3.4e38;var nearest=3.4e38;
  for(var k=0u;k<u32(g.w);k++) {
   let record=geometry[u32(g.z)+k];let a=record.xy;let b=geometry[u32(g.z)+(k+1u)%u32(g.w)].xy;let edge=b-a;
   signed=max(signed,dot(p-a,record.zw));
   nearest=min(nearest,length(p-a-edge*clamp(dot(p-a,edge)/dot(edge,edge),0.,1.)));
  }
  distance=select(signed,nearest,signed>0.);
 }
 else{let q=abs(p)-out.size*.5;distance=length(max(q,vec2f(0.)))+min(max(q.x,q.y),0.);}
 let pixel=distance*out.scale;let alpha=1.-smoothstep(-.5,.5,pixel);
 if(alpha<=0.){discard;}
 var color=out.color*select(1.,.65,pixel> -1.5);
 // A local-axis marker makes rolling and spinning disks visible.
 if(g.x==1.&&p.x>0.&&p.x<g.y*.72&&abs(p.y)*out.scale<.7){color*=.65;}
 return vec4f(color,alpha*select(1.,.22,out.trigger!=0.));
}
