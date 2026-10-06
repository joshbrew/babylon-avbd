struct Body {pose:vec4f,initial:vec4f,inertial:vec4f,velocity:vec4f,previous:vec4f,shape:vec4f}
struct Command { header:vec4u, value:vec4f, point:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> commands:array<Command>;
@group(0) @binding(2) var<storage,read> ranges:array<vec2u>;
// Each invocation owns one body; commands for that body execute in submission order.
@compute @workgroup_size(64)
fn edit(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&ranges)){return;}
 let range=ranges[i];let index=commands[range.x].header.x;var b=bodies[index];
 for(var k=range.x;k<range.x+range.y;k++) {
  let c=commands[k];let kind=c.header.y;
  if(kind==0u){b.velocity=vec4f(c.value.xy,b.velocity.zw);}
  else if(kind==1u){b.velocity.z=c.value.x;}
  else if(kind==2u||kind==3u) {
   if(b.shape.z>0.) {
    let impulse=c.value.xy*select(1.,c.value.w,kind==3u);
    b.velocity=vec4f(b.velocity.xy+impulse/b.shape.z,b.velocity.zw);
    if(c.header.z!=0u&&b.shape.w>0.) {
     let arm=c.point.xy-b.pose.xy;
     b.velocity.z+=(arm.x*impulse.y-arm.y*impulse.x)/b.shape.w;
    }
   }
  } else if(kind==5u||kind==6u) {
   if(b.shape.w>0.){b.velocity.z+=c.value.x*select(1.,c.value.w,kind==6u)/b.shape.w;}
  } else if(kind==4u) {
   b.pose=vec4f(c.value.xy,select(b.pose.z,c.value.z,c.header.z!=0u),b.pose.w);
   b.initial=vec4f(b.pose.xyz,b.initial.w);b.inertial=vec4f(b.pose.xyz,0.);
   // Contacts from before the teleport must not supply old friction anchors or forces.
   b.previous.w=1.;
  }
 }
 bodies[index]=b;
}

