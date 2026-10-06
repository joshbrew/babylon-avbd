// Exact rounded capsule geometry. Shape -1: radius=size.x/2, segment along Y,
// half-length=size.y/2-radius. No tessellation, endpoint-only collision test,
// shape storage buffer or iterative support search for capsule/sphere/box.
struct Capsule {a:vec3f,b:vec3f,r:f32}
struct SegmentPair {a:vec3f,b:vec3f}
fn capsuleOf(i:u32)->Capsule{
  let radius=bodies[i].size.x*.5;let axis=qrotate(bodies[i].rot,vec3f(0.,max(0.,bodies[i].size.y*.5-radius),0.));
  return Capsule(bodies[i].pos.xyz-axis,bodies[i].pos.xyz+axis,radius);
}
fn capSegmentPoint(a:vec3f,b:vec3f,p:vec3f)->vec3f{let d=b-a;return a+d*clamp(dot(p-a,d)/max(dot(d,d),1.e-20),0.,1.);}
fn capSegments(a:vec3f,b:vec3f,c:vec3f,d:vec3f)->SegmentPair{
  let u=b-a;let v=d-c;let w=a-c;let uu=dot(u,u);let vv=dot(v,v);let uv=dot(u,v);let uw=dot(u,w);let vw=dot(v,w);
  var s=0.;var t=0.;
  if(uu<=1.e-16){t=clamp(vw/max(vv,1.e-20),0.,1.);}
  else if(vv<=1.e-16){s=clamp(-uw/uu,0.,1.);}
  else{let denominator=uu*vv-uv*uv;if(denominator>1.e-8*uu*vv){s=clamp((uv*vw-uw*vv)/denominator,0.,1.);}t=(uv*s+vw)/vv;
    if(t<0.){t=0.;s=clamp(-uw/uu,0.,1.);}else if(t>1.){t=1.;s=clamp((uv-uw)/uu,0.,1.);}}
  return SegmentPair(a+s*u,c+t*v);
}
fn capFallback(axis:vec3f)->vec3f{
  if(length(axis)<1.e-8){return vec3f(1.,0.,0.);}
  let n=normalize(axis);return normalize(select(vec3f(0.,-n.z,n.y),vec3f(-n.y,n.x,0.),abs(n.x)>abs(n.z)));
}
fn capsuleSphere(A:Capsule,c:vec3f,r:f32,sat:ptr<function,Sat>)->Found{
  var found:Found;let p=capSegmentPoint(A.a,A.b,c);let delta=c-p;let distance=length(delta);
  if(distance>A.r+r){return found;}var n=capFallback(A.b-A.a);if(distance>1.e-8){n=delta/distance;}
  (*sat).n=n;addFound(&found,p+n*A.r,c-n*r,4u<<24u);return found;
}
fn capsuleCapsule(A:Capsule,B:Capsule,sat:ptr<function,Sat>)->Found{
  var found:Found;let points=capSegments(A.a,A.b,B.a,B.b);let delta=points.b-points.a;let distance=length(delta);
  if(distance>A.r+B.r){return found;}var n=capFallback(A.b-A.a);let crossing=cross(A.b-A.a,B.b-B.a);
  if(distance>1.e-8){n=delta/distance;}else if(length(crossing)>1.e-8){n=normalize(crossing);}
  (*sat).n=n;
  let da=A.b-A.a;let db=B.b-B.a;
  if(length(da)>1.e-8&&length(db)>1.e-8&&length(cross(normalize(da),normalize(db)))<1.e-4){
    let axis=normalize(da);let lo=max(dot(A.a,axis),min(dot(B.a,axis),dot(B.b,axis)));let hi=min(dot(A.b,axis),max(dot(B.a,axis),dot(B.b,axis)));
    if(hi-lo>1.e-5){for(var j=0u;j<2u;j++){let p=A.a+axis*(select(lo,hi,j==1u)-dot(A.a,axis));let q=capSegmentPoint(B.a,B.b,p);addFound(&found,p+n*A.r,q-n*B.r,(4u<<24u)|j);}return found;}
  }
  addFound(&found,points.a+n*A.r,points.b-n*B.r,4u<<24u);return found;
}
// Piecewise quadratic closest segment/AABB distance. Every face crossing is
// considered, so a long capsule cannot miss an obstacle between its endpoints.
fn capSegmentBox(a:vec3f,b:vec3f,h:vec3f)->SegmentPair{
  let d=b-a;var breaks:array<f32,8>;breaks[0]=0.;breaks[1]=1.;var count=2u;
  for(var k=0u;k<3u;k++){if(abs(d[k])>1.e-12){for(var side=0u;side<2u;side++){let t=(select(-h[k],h[k],side==1u)-a[k])/d[k];if(t>0.&&t<1.){breaks[count]=t;count++;}}}}
  for(var i=1u;i<count;i++){let value=breaks[i];var j=i;while(j>0u&&breaks[j-1u]>value){breaks[j]=breaks[j-1u];j--;}breaks[j]=value;}
  var best=3.4e38;var bestT=.5;var result:SegmentPair;
  for(var j=0u;j+1u<count;j++){
    let lo=breaks[j];let hi=breaks[j+1u];let mid=.5*(lo+hi);let p=a+mid*d;var numerator=0.;var denominator=0.;
    for(var k=0u;k<3u;k++){if(p[k]<-h[k]||p[k]>h[k]){let edge=clamp(p[k],-h[k],h[k]);numerator+=d[k]*(a[k]-edge);denominator+=d[k]*d[k];}}
    var t=mid;if(denominator>1.e-20){t=clamp(-numerator/denominator,lo,hi);}let point=a+t*d;let box=clamp(point,-h,h);let dist=dot(point-box,point-box);
    if(dist<best-1.e-12 || (abs(dist-best)<=1.e-12&&abs(t-.5)<abs(bestT-.5))){best=dist;bestT=t;result=SegmentPair(point,box);}
  }
  return result;
}
fn capBoxAxis(A:Capsule,h:vec3f,axis:vec3f,best:ptr<function,f32>,normal:ptr<function,vec3f>)->bool{
  let l=length(axis);if(l<1.e-8){return true;}let n=axis/l;
  let lo=min(dot(A.a,n),dot(A.b,n))-A.r;let hi=max(dot(A.a,n),dot(A.b,n))+A.r;let extent=dot(abs(n),h);
  let positive=hi+extent;let negative=extent-lo;if(positive<0.||negative<0.){return false;}
  let depth=min(positive,negative);if(depth<*best){*best=depth;*normal=select(-n,n,positive<negative);}return true;
}
fn capsuleBox(A:Capsule,B:Box,q:vec4f,sat:ptr<function,Sat>)->Found{
  var found:Found;let inv=qconj(q);let local=Capsule(qrotate(inv,A.a-B.c),qrotate(inv,A.b-B.c),A.r);
  let closest=capSegmentBox(local.a,local.b,B.h);let delta=closest.b-closest.a;let distance=length(delta);
  if(distance>A.r){return found;}var nLocal=vec3f(0.);var center=closest.a;var onBox=closest.b;
  if(distance>1.e-8){nLocal=delta/distance;}else{
    var depth=3.4e38;
    for(var k=0u;k<3u;k++){var axis=vec3f(0.);axis[k]=1.;if(!capBoxAxis(local,B.h,axis,&depth,&nLocal)){return found;}if(!capBoxAxis(local,B.h,cross(local.b-local.a,axis),&depth,&nLocal)){return found;}}
    for(var k=0u;k<8u;k++){let vertex=vec3f(select(-B.h.x,B.h.x,(k&1u)!=0u),select(-B.h.y,B.h.y,(k&2u)!=0u),select(-B.h.z,B.h.z,(k&4u)!=0u));if(!capBoxAxis(local,B.h,vertex-capSegmentPoint(local.a,local.b,vertex),&depth,&nLocal)){return found;}}
    center=select(local.a,local.b,dot(local.b,nLocal)>dot(local.a,nLocal));onBox=clamp(center,-B.h,B.h);
    let point=center+nLocal*local.r;onBox=point-nLocal*depth;
  }
  let n=qrotate(q,nLocal);(*sat).n=n;
  // Parallel support at both end caps produces a stable two-point manifold.
  var ends:Found;
  for(var j=0u;j<2u;j++){var S:Box;S.c=select(A.a,A.b,j==1u);S.h=vec3f(A.r);let hit=sphereBox(S,B,q);if(hit.hit&&dot(hit.n,n)>.9999){addFound(&ends,hit.onSphere,hit.onBox,(4u<<24u)|j);}}
  if(ends.count==2u){return ends;}
  addFound(&found,B.c+qrotate(q,center)+n*A.r,B.c+qrotate(q,onBox),4u<<24u);return found;
}
