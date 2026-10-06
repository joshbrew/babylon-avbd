struct Body { pos:vec4f, rot:vec4f, initialPos:vec4f, initialRot:vec4f, size:vec4f, moment:vec4f, inertialPos:vec4f, inertialRot:vec4f, velocity:vec4f, angular:vec4f }
struct Command { header:vec4u, value:vec4f, point:vec4f }
struct Manifold { ids:vec4u, geo:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> commands:array<Command>;
@group(0) @binding(2) var<storage,read> ranges:array<vec2u>;
@group(0) @binding(3) var<storage,read_write> manifolds:array<Manifold>;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn angularImpulse(b:Body,impulse:vec3f)->vec3f {
 let local=rotate(vec4f(-b.rot.xyz,b.rot.w),impulse);
 return rotate(b.rot,local/max(b.moment.xyz,vec3f(1.e-10)));
}
// One invocation owns one body. Preserve command order without atomic pose writes.
@compute @workgroup_size(64) fn edit(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&ranges)){return;}
 let range=ranges[i];let index=commands[range.x].header.x;var b=bodies[index];
 for(var k=range.x;k<range.x+range.y;k++) {
  let c=commands[k];let kind=c.header.y;
  if(kind==0u){b.velocity=vec4f(c.value.xyz,b.velocity.w);}
  else if(kind==1u){b.angular=vec4f(c.value.xyz,b.angular.w);}
  else if(kind==2u||kind==3u) {
   if(b.size.w>0.) {
    let impulse=c.value.xyz*select(1.,c.value.w,kind==3u);
    b.velocity=vec4f(b.velocity.xyz+impulse/b.size.w,b.velocity.w);
    if(c.header.z!=0u){b.angular=vec4f(b.angular.xyz+angularImpulse(b,cross(c.point.xyz-b.pos.xyz,impulse)),b.angular.w);}
   }
  } else if(kind==5u||kind==6u) {
   if(b.size.w>0.){b.angular=vec4f(b.angular.xyz+angularImpulse(b,c.value.xyz*select(1.,c.value.w,kind==6u)),b.angular.w);}
  } else if(kind==4u) {
   b.pos=vec4f(c.value.xyz,b.pos.w);
   if(c.header.z!=0u){b.rot=c.point;}
   // Encode a temporary marker while preserving the sensor flag in this word.
   let marker=select(-(b.initialPos.w+1.),b.initialPos.w,b.initialPos.w<0.);
   b.initialPos=vec4f(b.pos.xyz,marker);b.initialRot=b.rot;
   b.inertialPos=vec4f(b.pos.xyz,b.inertialPos.w);b.inertialRot=b.rot;
  }
 }
 bodies[index]=b;
}
// Only teleport batches run this pass. Retain warm starts on unaffected bodies.
@compute @workgroup_size(64) fn invalidate(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&manifolds)){return;}
 let m=manifolds[i];
 if((m.ids.w&15u)!=0u && (bodies[m.ids.x].initialPos.w<0.||bodies[m.ids.y].initialPos.w<0.)){manifolds[i].ids.w=0u;}
}
@compute @workgroup_size(64) fn clearMarkers(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&ranges)){return;}
 let index=commands[ranges[i].x].header.x;
 if(bodies[index].initialPos.w<0.){bodies[index].initialPos.w=-bodies[index].initialPos.w-1.;}
}
