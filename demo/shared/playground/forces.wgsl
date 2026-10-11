struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Settings {step:vec4f,storm:vec4f}
@group(0) @binding(0) var<storage,read_write> bodies:array<Body>;
@group(0) @binding(1) var<storage,read> kinds:array<vec4f>;
@group(0) @binding(2) var<uniform> settings:Settings;
@compute @workgroup_size(64) fn forces(@builtin(global_invocation_id) id:vec3u) {
 let i=id.x;if(i>=arrayLength(&kinds)){return;}
 var b=bodies[i];let kind=kinds[i];let dt=settings.step.x;let time=settings.step.y;
 if(kind.x>0.) {
  let grain=kind.x-1.;let z=.25+grain/128.*15.;let r=.65+z*.22;
  let angle=grain*2.39996-time*(4.-z*.12);
  let pos=vec3f(settings.storm.xy+vec2f(cos(angle),sin(angle))*r,z);
  b.pos=vec4f(select(vec3f(0.,0.,-20.),pos,settings.step.z>0.),b.pos.w);
  b.initialPos=b.pos;b.inertialPos=b.pos;bodies[i]=b;return;
 }
 if(b.size.w<=0.){return;}
 if(settings.step.w>0. && kind.y>0.) {
  let angle=f32(i)*2.39996;
  b.velocity=vec4f(b.velocity.xyz+vec3f(cos(angle)*3.,sin(angle)*3.,5.),b.velocity.w);
 }
 if(settings.step.z>0.) {
  let delta=b.pos.xy-settings.storm.xy;let r=length(delta);let radial=delta/max(r,.2);
  let falloff=exp(-r*r/48.)*clamp(1.-b.pos.z/26.,0.,1.);
  let flow=vec3f(-radial*6.+vec2f(-radial.y,radial.x)*19.,23.);
  // Bounded air drag scales with projected area/mass. Gravity, contacts and
  // weld fracture remain in the AVBD step following this force pass.
  let rate=clamp(kind.z/max(b.size.w,.001)*.7,.1,6.)*falloff;
  b.velocity=vec4f(mix(b.velocity.xyz,flow,1.-exp(-rate*dt)),b.velocity.w);
  b.angular=vec4f(b.angular.xyz+vec3f(radial.y,-radial.x,.6)*falloff*dt*3.,b.angular.w);
 }
 bodies[i]=b;
}
