import code from "./capsuleCollision.wgsl";
export function withCapsuleContacts(source) {
  if (source.includes("fn capsuleOf"))
    throw Error("Capsule collision kernel installed twice");
  const signature = "@compute @workgroup_size(64)\nfn narrowphase";
  if (!source.includes(signature))
    throw Error("Pinned capsule narrowphase layout changed");
  const hull = source.includes("struct Poly");
  if (hull) source = source.replace(signature, capsulePoly + "\n" + signature);
  source = source.replace(signature, code + "\n" + signature);
  const poly = hull
    ? " else if(isHull(b)){found=capsulePoly(capsuleOf(a),polyOf(b),&sat);}"
    : "";
  const reversePoly = hull
    ? " else if(isHull(a)){found=capsulePoly(capsuleOf(b),polyOf(a),&sat);}"
    : "";
  return source
    .replace(
      "let anySphere = sphereA || sphereB;",
      "let anySphere = sphereA || sphereB || capsuleA || capsuleB;",
    )
    .replace(
      "  if (sphereA && sphereB) {",
      `  let capsuleA=bodies[a].angVel.w == -1.;let capsuleB=bodies[b].angVel.w == -1.;
  if(capsuleA || capsuleB){
    if(capsuleA && capsuleB){found=capsuleCapsule(capsuleOf(a),capsuleOf(b),&sat);}
    else if(capsuleA){if(sphereB){found=capsuleSphere(capsuleOf(a),B.c,B.h.x,&sat);}${poly} else{found=capsuleBox(capsuleOf(a),B,bodies[b].rot,&sat);}}
    else{if(sphereA){found=capsuleSphere(capsuleOf(b),A.c,A.h.x,&sat);}${reversePoly} else{found=capsuleBox(capsuleOf(b),A,bodies[a].rot,&sat);}
      sat.n=-sat.n;for(var c=0u;c<found.count;c++){let p=found.xA[c];found.xA[c]=found.xB[c];found.xB[c]=p;}}
  } else if (sphereA && sphereB) {`,
    );
}
// Hull faces clip the projected line segment. Face projections and edge/segment
// closest points cover the complete convex surface, including caps at any angle.
const capsulePoly = `
fn capPolyAxis(A:Capsule,P:Poly,axis:vec3f,best:ptr<function,f32>,normal:ptr<function,vec3f>)->bool{
 let l=length(axis);if(l<1.e-8){return true;}let n=axis/l;
 let lo=min(dot(A.a,n),dot(A.b,n))-A.r;let hi=max(dot(A.a,n),dot(A.b,n))+A.r;
 let low=dot(polySupport(P,-n),n);let high=dot(polySupport(P,n),n);
 let positive=hi-low;let negative=high-lo;if(positive<0.||negative<0.){return false;}
 let depth=min(positive,negative);if(depth<*best){*best=depth;*normal=select(-n,n,positive<negative);}return true;
}
fn capsulePoly(A:Capsule,P:Poly,sat:ptr<function,Sat>)->Found{
 var found:Found;var best=3.4e38;var points:SegmentPair;let direction=A.b-A.a;var insideLo=0.;var insideHi=1.;
 for(var f=0u;f<P.nf;f++){
  let plane=facePlane(P,f);let n=plane.xyz;let s=dot(n,A.a)-plane.w;let slope=dot(n,direction);
  if(abs(slope)<1.e-12){if(s>0.){insideLo=2.;}}else if(slope>0.){insideHi=min(insideHi,-s/slope);}else{insideLo=max(insideLo,-s/slope);}
  let count=faceVertCount(P,f);var center=vec3f(0.);for(var j=0u;j<count;j++){center+=vert(P,faceVert(P,f,j));}center/=f32(count);
  var lo=0.;var hi=1.;let projectedA=A.a-n*s;let projectedD=direction-n*slope;
  for(var j=0u;j<count;j++){
   let a=vert(P,faceVert(P,f,j));let b=vert(P,faceVert(P,f,(j+1u)%count));var side=cross(b-a,n);if(dot(side,center-a)>0.){side=-side;}
   let edgeS=dot(side,projectedA-a);let edgeD=dot(side,projectedD);if(abs(edgeD)<1.e-12){if(edgeS>1.e-7){lo=2.;}}else if(edgeD>0.){hi=min(hi,-edgeS/edgeD);}else{lo=max(lo,-edgeS/edgeD);}
   let pair=capSegments(A.a,A.b,a,b);let dist=dot(pair.a-pair.b,pair.a-pair.b);if(dist<best){best=dist;points=pair;}
  }
  if(lo<=hi){var t=.5*(lo+hi);if(abs(slope)>1.e-12){t=clamp(-s/slope,lo,hi);}let p=A.a+t*direction;let q=p-n*(s+t*slope);let dist=dot(p-q,p-q);if(dist<best){best=dist;points=SegmentPair(p,q);}}
 }
 let inside=insideLo<=insideHi;let distance=sqrt(best);if(!inside&&distance>A.r){return found;}var n=vec3f(0.);
 if(!inside&&distance>1.e-8){n=(points.b-points.a)/distance;}else{
  var depth=3.4e38;
  for(var f=0u;f<P.nf;f++){if(!capPolyAxis(A,P,facePlane(P,f).xyz,&depth,&n)){return found;}}
  for(var e=0u;e<P.ne;e++){let edge=edgeOf(P,e);if(!capPolyAxis(A,P,cross(direction,vert(P,edge.y)-vert(P,edge.x)),&depth,&n)){return found;}}
  for(var v=0u;v<P.nv;v++){let vertex=vert(P,v);if(!capPolyAxis(A,P,vertex-capSegmentPoint(A.a,A.b,vertex),&depth,&n)){return found;}}
  points.a=select(A.a,A.b,dot(A.b,n)>dot(A.a,n));points.b=points.a+n*(A.r-depth);
 }
 (*sat).n=n;addFound(&found,points.a+n*A.r,points.b,4u<<24u);return found;
}
`;
