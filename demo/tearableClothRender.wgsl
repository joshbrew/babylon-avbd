struct Body {pos:vec4f,rot:vec4f,initialPos:vec4f,initialRot:vec4f,size:vec4f,moment:vec4f,inertialPos:vec4f,inertialRot:vec4f,velocity:vec4f,angular:vec4f}
struct Camera {vp:mat4x4f,eye:vec4f,viewport:vec4f}
struct Triangle {ids:vec4u,links:vec4u,uvAB:vec4f,uvC:vec4f,restA:vec4f,restB:vec4f,restC:vec4f,padding:vec4f}
@group(0) @binding(0) var<storage,read> bodies:array<Body>;
@group(0) @binding(1) var<uniform> camera:Camera;
@group(0) @binding(2) var<storage,read> triangles:array<Triangle>;
@group(0) @binding(3) var<storage,read> joints:array<vec4f>;
@group(0) @binding(4) var fabric:texture_2d<f32>;
@group(0) @binding(5) var samplerState:sampler;
@group(0) @binding(6) var<storage,read> neighbors:array<u32>;
fn up(v:vec3f)->vec3f{return vec3f(v.x,v.z,v.y);}
struct Output {@builtin(position) clip:vec4f,@location(0) normal:vec3f,@location(1) uv:vec2f}
fn intact(t:Triangle)->bool {
  return joints[t.ids.w*8u].w>0. && joints[t.links.x*8u].w>0. && joints[t.links.y*8u].w>0.;
}
fn normalAt(point:u32)->vec3f {
  var n=vec3f(0.);
  let start=neighbors[point*2u];let count=neighbors[point*2u+1u];
  for(var i=0u;i<count;i++) {
    let t=triangles[neighbors[start+i]];
    if(intact(t)) {
      let a=bodies[t.ids.x].pos.xyz;let b=bodies[t.ids.y].pos.xyz;let c=bodies[t.ids.z].pos.xyz;
      n+=cross(b-a,c-a);
    }
  }
  return select(vec3f(0.,0.,1.),n/max(length(n),.00001),length(n)>.00001);
}
fn rotate(q:vec4f,v:vec3f)->vec3f {return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
fn edgeSlot(t:Triangle,a:u32,b:u32)->u32 {
  let lo=min(a,b);let hi=max(a,b);
  if(lo==0u&&hi==1u){return t.ids.w;}
  if(lo==0u&&hi==2u){return t.links.x;}
  return t.links.y;
}
fn rest(t:Triangle,i:u32)->vec3f {
  if(i==0u){return t.restA.xyz;}if(i==1u){return t.restB.xyz;}return t.restC.xyz;
}
fn uv(t:Triangle,i:u32)->vec2f {
  if(i==0u){return t.uvAB.xy;}if(i==1u){return t.uvAB.zw;}return t.uvC.xy;
}
// An unbroken edge uses its elastic displacement. A broken edge retains this
// point's share of the original material, oriented by its surviving neighbor.
// With no neighbors, the finite patch follows the live particle pose. Nothing
// is culled, aged out, or stretched to a distant disconnected particle.
fn materialEdge(t:Triangle,corner:u32,other:u32,connected:u32,n:vec3f)->vec3f {
  let point=t.ids[corner];let delta=rest(t,other)-rest(t,corner);
  if(joints[edgeSlot(t,corner,other)*8u].w>0.){
    return bodies[t.ids[other]].pos.xyz-bodies[point].pos.xyz;
  }
  if(joints[edgeSlot(t,corner,connected)*8u].w==0.){
    return rotate(bodies[point].rot,delta);
  }
  let original=normalize(rest(t,connected)-rest(t,corner));
  let displacement=bodies[t.ids[connected]].pos.xyz-bodies[point].pos.xyz;
  if(length(displacement)<.00001){return rotate(bodies[point].rot,delta);}
  let tangent=normalize(displacement);
  var side=cross(n,tangent);
  if(length(side)<.00001){side=cross(select(vec3f(0.,1.,0.),vec3f(1.,0.,0.),abs(tangent.x)<.8),tangent);}
  side=normalize(side);
  return tangent*dot(delta,original)+side*dot(delta,cross(vec3f(0.,0.,1.),original));
}
@vertex fn main(@builtin(vertex_index) vertex:u32)->Output {
  let t=triangles[vertex/18u];let corner=(vertex%18u)/6u;
  let next=(corner+1u)%3u;let previous=(corner+2u)%3u;
  let point=t.ids[corner];let n=normalAt(point);
  let a=bodies[point].pos.xyz;
  let ab=materialEdge(t,corner,next,previous,n);
  let ac=materialEdge(t,corner,previous,next,n);
  let cornerUV=uv(t,corner);let uvAB=uv(t,next)-cornerUV;let uvAC=uv(t,previous)-cornerUV;
  let local=vertex%6u;
  var p=a;var tex=cornerUV;
  if(local==1u){p=a+ab*.5;tex+=uvAB*.5;}
  if(local==2u||local==4u){p=a+(ab+ac)/3.;tex+=(uvAB+uvAC)/3.;}
  if(local==5u){p=a+ac*.5;tex+=uvAC*.5;}
  var o:Output;o.normal=up(n);o.uv=tex;
  o.clip=camera.vp*vec4f(up(p),1.);
  return o;
}
@fragment fn fragment(o:Output,@builtin(front_facing) front:bool)->@location(0) vec4f {
  let n=normalize(o.normal)*select(-1.,1.,front);let light=.5+.5*max(dot(n,normalize(vec3f(-.4,1,-.6))),0.);
  return vec4f(textureSample(fabric,samplerState,o.uv).rgb*light,1);
}
