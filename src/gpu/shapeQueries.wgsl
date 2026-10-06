// GPU queries against current poses. Rounded box/hull sweeps test offset faces
// and rounded edges, so expanding a bounding box cannot create corner hits.
struct Query { origin:vec4f, direction:vec4f }
struct Params { head:vec4u, flags:vec4u, ignored:array<vec4u,4> }
struct Hit { t:f32, n:vec3f }
@group(0) @binding(0) var<storage,read> bodies:array<vec4f>;
@group(0) @binding(1) var<storage,read> hulls:array<vec4u>;
@group(0) @binding(2) var<storage,read> queries:array<Query>;
@group(0) @binding(3) var<storage,read_write> best:array<atomic<u32>>;
@group(0) @binding(4) var<storage,read_write> hits:array<vec4f>;
@group(0) @binding(5) var<uniform> params:Params;
@group(0) @binding(6) var<storage,read> filters:array<vec2u>;
const MISS=Hit(-1.,vec3f(0.));
const DIM=3u;
const STRIDE=10u;
var<private> FACE_VERTS:array<u32,24>=array<u32,24>(1u,3u,7u,5u,0u,2u,6u,4u,2u,3u,7u,6u,0u,1u,5u,4u,4u,5u,7u,6u,0u,1u,3u,2u);
var<private> EDGES:array<vec2u,12>=array<vec2u,12>(vec2u(0u,1u),vec2u(2u,3u),vec2u(4u,5u),vec2u(6u,7u),vec2u(0u,2u),vec2u(1u,3u),vec2u(4u,6u),vec2u(5u,7u),vec2u(0u,4u),vec2u(1u,5u),vec2u(2u,6u),vec2u(3u,7u));
fn turn(q:vec4f,v:vec3f)->vec3f{let t=2.*cross(q.xyz,v);return v+q.w*t+cross(q.xyz,t);}
fn closest(a:vec3f,b:vec3f,p:vec3f)->vec3f{let e=b-a;return a+e*clamp(dot(p-a,e)/max(dot(e,e),1.e-20),0.,1.);}
fn raySphere(o:vec3f,d:vec3f,c:vec3f,r:f32)->Hit{
 let v=o-c;let b=dot(v,d);let disc=b*b-dot(v,v)+r*r;if(disc<0.){return MISS;}let t=-b-sqrt(disc);if(t<0.){return MISS;}
 let p=o+d*t-c;return Hit(t,select(-d,p/max(length(p),1.e-20),length(p)>1.e-10));
}
fn rayCapsule(o:vec3f,d:vec3f,a:vec3f,b:vec3f,r:f32)->Hit{
 let ba=b-a;let oa=o-a;let bb=dot(ba,ba);if(bb<1.e-16){return raySphere(o,d,a,r);}
 let bd=dot(ba,d);let bo=dot(ba,oa);let od=dot(oa,d);let A=bb-bd*bd;let B=bb*od-bo*bd;let C=bb*dot(oa,oa)-bo*bo-r*r*bb;
 var hit=MISS;let disc=B*B-A*C;
 if(A>1.e-12*bb&&disc>=0.){let t=(-B-sqrt(disc))/A;let y=bo+t*bd;
  if(t>=0.&&y>=0.&&y<=bb){let p=o+d*t;hit=Hit(t,normalize(p-(a+ba*y/bb)));}}
 for(var end=0u;end<2u;end++){let c=select(a,b,end==1u);let h=raySphere(o,d,c,r);
  if(h.t>=0.&&(hit.t<0.||h.t<hit.t)){hit=h;}}
 return hit;
}
fn vertex(v:u32,h:vec3f,header:u32,isHull:bool)->vec3f{
 if(isHull){return bitcast<vec4f>(hulls[hulls[header].x+v]).xyz;}
 return vec3f(select(-h.x,h.x,(v&1u)!=0u),select(-h.y,h.y,(v&2u)!=0u),select(-h.z,h.z,(v&4u)!=0u));
}
fn plane(f:u32,h:vec3f,header:u32,isHull:bool)->vec4f{
 if(isHull){return bitcast<vec4f>(hulls[hulls[header].z+2u*f]);}
 let k=f/2u;var n=vec3f(0.);n[k]=select(1.,-1.,(f&1u)!=0u);return vec4f(n,h[k]);
}
fn faceCount(f:u32,header:u32,isHull:bool)->u32{if(isHull){return hulls[hulls[header].z+2u*f+1u].y;}return 4u;}
fn faceVertex(f:u32,j:u32,header:u32,isHull:bool)->u32{
 if(isHull){let index=hulls[hulls[header].z+2u*f+1u].x+j;return hulls[hulls[header+1u].z+index/4u][index%4u];}
 return FACE_VERTS[f*4u+j];
}
fn onFace(p:vec3f,f:u32,h:vec3f,header:u32,isHull:bool)->bool{
 let count=faceCount(f,header,isHull);let normal=plane(f,h,header,isHull).xyz;var center=vec3f(0.);
 for(var j=0u;j<count;j++){center+=vertex(faceVertex(f,j,header,isHull),h,header,isHull);}center/=f32(count);
 for(var j=0u;j<count;j++){let a=vertex(faceVertex(f,j,header,isHull),h,header,isHull);let b=vertex(faceVertex(f,(j+1u)%count,header,isHull),h,header,isHull);let side=cross(b-a,normal);
  if(dot(side,p-a)*select(-1.,1.,dot(side,center-a)>=0.) < -1.e-6){return false;}}
 return true;
}
fn roundedPoly(o:vec3f,d:vec3f,h:vec3f,header:u32,isHull:bool,r:f32)->Hit{
 var nf=6u;var ne=12u;if(isHull){nf=hulls[header].w;ne=hulls[header+1u].y;}
 if(r==0.){
  var enter= -3.4e38;var exit=3.4e38;var normal= -d;
  for(var f=0u;f<nf;f++){let pl=plane(f,h,header,isHull);let denom=dot(pl.xyz,d);let gap=pl.w-dot(pl.xyz,o);
   if(abs(denom)<1.e-12){if(gap<0.){return MISS;}}else{let t=gap/denom;if(denom<0.){if(t>enter){enter=t;normal=pl.xyz;}}else{exit=min(exit,t);}}
   if(enter>exit){return MISS;}}
  if(exit<0.){return MISS;}if(enter<=0.){return Hit(0.,-d);}return Hit(enter,normal);
 }
 var inside=true;var distance=3.4e38;var hit=MISS;
 for(var f=0u;f<nf;f++){
  let pl=plane(f,h,header,isHull);let signed=dot(pl.xyz,o)-pl.w;if(signed>0.){inside=false;}
  let projection=o-pl.xyz*signed;if(onFace(projection,f,h,header,isHull)){distance=min(distance,signed*signed);}
  let denom=dot(pl.xyz,d);if(denom< -1.e-12){let t=(pl.w+r-dot(pl.xyz,o))/denom;
   if(t>=0.&&(hit.t<0.||t<hit.t)&&onFace(o+d*t-pl.xyz*r,f,h,header,isHull)){hit=Hit(t,pl.xyz);}}
 }
 for(var e=0u;e<ne;e++){
  var edge=EDGES[e%12u];if(isHull){edge=hulls[hulls[header+1u].x+e].xy;}
  let a=vertex(edge.x,h,header,isHull);let b=vertex(edge.y,h,header,isHull);let q=o-closest(a,b,o);distance=min(distance,dot(q,q));
  if(r>0.){let candidate=rayCapsule(o,d,a,b,r);if(candidate.t>=0.&&(hit.t<0.||candidate.t<hit.t)){hit=candidate;}}
 }
 if(inside||distance<=r*r){return Hit(0.,-d);}return hit;
}
fn roundedBox2D(o:vec3f,d:vec3f,h:vec3f,r:f32)->Hit{
 let nearest=clamp(o.xy,-h.xy,h.xy);if(dot(o.xy-nearest,o.xy-nearest)<=r*r){return Hit(0.,-d);}var hit=MISS;
 for(var k=0u;k<2u;k++){for(var side=0u;side<2u;side++){
  let sign=select(-1.,1.,side==1u);if(d[k]*sign< -1.e-12){let t=(sign*(h[k]+r)-o[k])/d[k];let p=o+d*t;
   if(t>=0.&&abs(p[1u-k])<=h[1u-k]&&(hit.t<0.||t<hit.t)){var n=vec3f(0.);n[k]=sign;hit=Hit(t,n);}}
 }}
 if(r>0.){for(var k=0u;k<4u;k++){let c=vec3f(select(-h.x,h.x,(k&1u)!=0u),select(-h.y,h.y,(k&2u)!=0u),0.);let candidate=raySphere(o,d,c,r);if(candidate.t>=0.&&(hit.t<0.||candidate.t<hit.t)){hit=candidate;}}}return hit;
}
fn roundedSegmentQuery2D(o:vec3f,d:vec3f,half:f32,r:f32)->Hit {
 let a=vec3f(-half,0.,0.);let b=vec3f(half,0.,0.);let delta=o-closest(a,b,o);
 if(dot(delta,delta)<=r*r){return Hit(0.,-d);}
 if(r>0.){return rayCapsule(o,d,a,b,r);}
 // A zero-thickness line still has a well-defined transverse intersection.
 // A rotated world-space line has f32 transform error. Recognize collinearity
 // at that precision before dividing by an almost-zero perpendicular direction.
 if(abs(d.y)<1e-7&&abs(o.y)<1e-6*max(1.,half)){
  if(abs(o.x)<=half){return Hit(0.,-d);}
  if(o.x< -half&&d.x>0.){return Hit((-half-o.x)/d.x,vec3f(-1.,0.,0.));}
  if(o.x>half&&d.x<0.){return Hit((half-o.x)/d.x,vec3f(1.,0.,0.));}
  return MISS;
 }
 if(abs(d.y)<1e-12){return MISS;}
 let t=-o.y/d.y;let x=o.x+t*d.x;
 if(t<0.||abs(x)>half){return MISS;}
 return Hit(t,vec3f(0.,select(1.,-1.,d.y>0.),0.));
}
fn shapeQuery2D(index:u32,o:vec3f,d:vec3f,size:vec3f,r:f32)->Hit {
 if(params.flags.w==0u){return roundedBox2D(o,d,size*.5,r);}
 let g=bitcast<vec4f>(hulls[index]);
 if(g.x==4.){return polygonQuery2D(o,d,u32(g.z),u32(g.w),r);}
 if(g.x==1.){let radius=g.y+r;if(dot(o,o)<=radius*radius){return Hit(0.,-d);}return raySphere(o,d,vec3f(0.),radius);}
 if(g.x==2.){return roundedSegmentQuery2D(o,d,g.z,g.y+r);}
 if(g.x==3.) {
  if(o.y<=r){return Hit(0.,-d);}if(d.y>=-1e-12){return MISS;}
  return Hit((r-o.y)/d.y,vec3f(0.,1.,0.));
 }
 return roundedBox2D(o,d,size*.5,r);
}
fn polygonQuery2D(o:vec3f,d:vec3f,offset:u32,count:u32,r:f32)->Hit {
 var inside=true;var distance=3.4e38;var hit=MISS;
 for(var k=0u;k<count;k++) {
  let record=bitcast<vec4f>(hulls[offset+k]);let a=vec3f(record.xy,0.);let b=vec3f(bitcast<vec4f>(hulls[offset+(k+1u)%count]).xy,0.);
  let n=vec3f(record.zw,0.);let signed=dot(o-a,n);if(signed>0.){inside=false;}
  let delta=o-closest(a,b,o);distance=min(distance,dot(delta,delta));
  let denom=dot(d,n);
  if(denom< -1e-12) {
   let t=(r-signed)/denom;let p=o+d*t-n*r;let edge=b-a;let along=dot(p-a,edge);
   let tolerance=1e-6*dot(edge,edge);
   if(t>=0.&&along>=-tolerance&&along<=dot(edge,edge)+tolerance&&(hit.t<0.||t<hit.t)){hit=Hit(t,n);}
  }
  if(r>0.){let candidate=raySphere(o,d,a,r);if(candidate.t>=0.&&(hit.t<0.||candidate.t<hit.t)){hit=candidate;}}
 }
 if(inside||distance<=r*r){return Hit(0.,-d);}return hit;
}
fn trace(index:u32,query:Query)->Hit{
 let base=index*STRIDE;var position=bodies[base].xyz;var q=vec4f(0.,0.,0.,1.);var size=vec3f(0.);var shape=0.;
 if(DIM==2u){let angle=position.z;position.z=0.;q=vec4f(0.,0.,sin(angle*.5),cos(angle*.5));size=vec3f(bodies[base+5u].xy,0.);}
 else{q=bodies[base+1u];size=bodies[base+4u].xyz;shape=bodies[base+9u].w;}
 let inv=vec4f(-q.xyz,q.w);let o=turn(inv,query.origin.xyz-position);let d=turn(inv,query.direction.xyz);let r=query.direction.w;var hit=MISS;
 if(DIM==2u){hit=shapeQuery2D(index,o,d,size,r);}
 else if(shape==1.){let radius=size.x*.5+r;if(dot(o,o)<=radius*radius){hit=Hit(0.,-d);}else{hit=raySphere(o,d,vec3f(0.),radius);}}
 else if(shape== -1.){let half=max(0.,size.y*.5-size.x*.5);let a=vec3f(0.,-half,0.);let b=vec3f(0.,half,0.);let radius=size.x*.5+r;let delta=o-closest(a,b,o);if(dot(delta,delta)<=radius*radius){hit=Hit(0.,-d);}else{hit=rayCapsule(o,d,a,b,radius);}}
 else {let hull=shape>=3.;hit=roundedPoly(o,d,size*.5,u32(max(0.,shape-3.)+.5),hull,r);}
 if(hit.t>query.origin.w){return MISS;}hit.n=turn(q,hit.n);return hit;
}
fn ignored(index:u32)->bool{
 if(params.flags.y!=0u&&(filters[index].x&params.head.w)==0u){return true;}
 if(params.flags.y==0u&&params.head.w==0u){return true;}
 let sensor=select(bodies[index*STRIDE+2u].w,bodies[index*STRIDE+1u].w,DIM==2u);
 if(params.flags.x!=0u&&params.flags.z!=0u&&sensor!=0.){return true;}
 for(var k=0u;k<params.head.z;k++){if(params.ignored[k/4u][k%4u]==index){return true;}}return false;
}
@compute @workgroup_size(64)
fn nearest(@builtin(global_invocation_id) id:vec3u){if(id.x>=params.head.x||ignored(id.x)){return;}let h=trace(id.x,queries[id.y]);if(h.t>=0.){atomicMin(&best[id.y*2u],bitcast<u32>(max(0.,h.t)));}}
@compute @workgroup_size(64)
fn owner(@builtin(global_invocation_id) id:vec3u){if(id.x>=params.head.x||ignored(id.x)){return;}let h=trace(id.x,queries[id.y]);if(h.t>=0.&&bitcast<u32>(max(0.,h.t))==atomicLoad(&best[id.y*2u])){atomicMin(&best[id.y*2u+1u],id.x);}}
@compute @workgroup_size(64)
fn finish(@builtin(global_invocation_id) id:vec3u){if(id.x>=params.head.y){return;}let index=atomicLoad(&best[id.x*2u+1u]);if(index==0xffffffffu){hits[id.x*2u]=vec4f(0.,0.,0.,-1.);return;}let h=trace(index,queries[id.x]);hits[id.x*2u]=vec4f(h.n,max(0.,h.t));hits[id.x*2u+1u]=vec4f(bitcast<f32>(index),0.,0.,0.);}
