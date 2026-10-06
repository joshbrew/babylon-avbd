struct Body { pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f }
struct Command { index:u32,mask:u32,pad0:u32,pad1:u32,velocity:vec4f,angular:vec4f,impulse:vec4f,torque:vec4f,position:vec4f,rotation:vec4f,pointImpulse:vec4f }
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> commands:array<Command>;
fn rotate(q:vec4f,v:vec3f)->vec3f {let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
@compute @workgroup_size(64) fn applyCommands(@builtin(global_invocation_id) id:vec3u){
 let i=id.x+id.y*DISPATCH_STRIDE;
 if(i>=arrayLength(&commands)){return;}
 let c=commands[i];var b=bodies[c.index];
 if((c.mask&1u)!=0u){b.velocity=vec4f(c.velocity.xyz,b.velocity.w);}
 if((c.mask&2u)!=0u){b.angular=vec4f(c.angular.xyz,b.angular.w);}
 if((c.mask&4u)!=0u && b.size.w>0.){
  b.velocity=vec4f(b.velocity.xyz+c.impulse.xyz/b.size.w,b.velocity.w);
  // Sum world-point moments about the live GPU centre, never a stale CPU pose.
  let torque=c.torque.xyz-cross(b.pos.xyz,c.pointImpulse.xyz);
  let local=rotate(vec4f(-b.rot.xyz,b.rot.w),torque);
  b.angular=vec4f(b.angular.xyz+rotate(b.rot,local/max(b.moment.xyz,vec3f(1.e-10))),b.angular.w);
 }
 if((c.mask&8u)!=0u){b.pos=vec4f(c.position.xyz,b.pos.w);b.rot=c.rotation;}
 if((c.mask&16u)!=0u){b.size.w=0.;b.moment=vec4f(vec3f(0),b.moment.w);b.velocity=vec4f(0);b.angular=vec4f(vec3f(0),b.angular.w);}
 bodies[c.index]=b;
}
