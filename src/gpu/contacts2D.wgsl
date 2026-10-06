// Analytic circles and capsules, finite two-sided segments and solid half-space planes.
// Kind 4 stores bounding radius, vertex-record offset and vertex count.
@group(0) @binding(7) var<storage,read> geometry:array<vec4f>;
struct Face2D { a:vec2f, b:vec2f, feature:u32 }
struct Axis2D { gap:f32, normal:vec2f }
fn inverse2D(angle:f32,p:vec2f)->vec2f { return rot(-angle,p); }
fn spine2D(i:u32)->Face2D {
 let b=bodies[i];let half=geometry[i].z;
 let extent=rot(b.pose.z,vec2f(half,0.));
 return Face2D(b.pose.xy-extent,b.pose.xy+extent,0u);
}
fn nearest2D(a:vec2f,b:vec2f,p:vec2f)->vec2f {
 let edge=b-a;return a+edge*clamp(dot(p-a,edge)/max(dot(edge,edge),1e-20),0.,1.);
}
fn vertex2D(i:u32,k:u32)->vec2f {
 if(geometry[i].x==4.){return bodies[i].pose.xy+rot(bodies[i].pose.z,geometry[u32(geometry[i].z)+k].xy);}
 let b=bodies[i];let half=b.shape.xy*.5;
 let bits=select(k,5u-k,k>=2u);
 return b.pose.xy+rot(b.pose.z,vec2f(select(-half.x,half.x,(bits&1u)!=0u),select(-half.y,half.y,(bits&2u)!=0u)));
}
fn polygon2D(i:u32)->bool{return geometry[i].x==0.||geometry[i].x==4.;}
fn vertices2D(i:u32)->u32{return select(4u,u32(geometry[i].w),geometry[i].x==4.);}
fn edge2D(i:u32,k:u32)->Face2D{return Face2D(vertex2D(i,k),vertex2D(i,(k+1u)%vertices2D(i)),k+1u);}
fn outward2D(face:Face2D)->vec2f{let e=face.b-face.a;return normalize(vec2f(e.y,-e.x));}
fn facing2D(i:u32,n:vec2f)->Face2D{
 var best= -3.4e38;var face=edge2D(i,0u);
 for(var k=0u;k<vertices2D(i);k++){let f=edge2D(i,k);let score=dot(outward2D(f),n);if(score>best){best=score;face=f;}}
 return face;
}
// Support may be an entire face. Keeping two points gives flat contacts a stable torque arm.
fn support2D(i:u32,n:vec2f)->Face2D {
 let b=bodies[i];let g=geometry[i];let local=inverse2D(b.pose.z,n);
 if(g.x==1.) { let p=b.pose.xy+n*g.y;return Face2D(p,p,1u); }
 if(g.x==2.) {
  let s=spine2D(i);let offset=n*g.y;
  if(abs(local.x)<1e-5){return Face2D(s.a+offset,s.b+offset,3u);}
  let p=select(s.a,s.b,local.x>0.)+offset;
  return Face2D(p,p,select(1u,2u,local.x>0.));
 }
 if(g.x==4.) {
  var best= -3.4e38;var v=0u;
  for(var k=0u;k<u32(g.w);k++){let score=dot(geometry[u32(g.z)+k].xy,local);if(score>best){best=score;v=k;}}
  let next=(v+1u)%u32(g.w);let prev=(v+u32(g.w)-1u)%u32(g.w);
  let tolerance=1e-6*max(g.y,1e-6);
  if(abs(dot(geometry[u32(g.z)+next].xy,local)-best)<tolerance){return edge2D(i,v);}
  if(abs(dot(geometry[u32(g.z)+prev].xy,local)-best)<tolerance){return edge2D(i,prev);}
  let p=vertex2D(i,v);return Face2D(p,p,65u+v);
 }
 let h=b.shape.xy*.5;let sx=select(-1.,1.,local.x>0.);let sy=select(-1.,1.,local.y>0.);
 var a=vec2f(sx*h.x,sy*h.y);var c=a;var key=1u+select(0u,1u,local.x>0.)+select(0u,2u,local.y>0.);
 if(abs(local.x)<1e-5){a.x=-h.x;c.x=h.x;key=select(5u,6u,local.y>0.);}
 else if(abs(local.y)<1e-5){a.y=-h.y;c.y=h.y;key=select(7u,8u,local.x>0.);}
 return Face2D(b.pose.xy+rot(b.pose.z,a),b.pose.xy+rot(b.pose.z,c),key);
}
fn consider2D(a:u32,b:u32,axis:vec2f,best:ptr<function,Axis2D>) {
 let len=length(axis);if(len<1e-8){return;}let n=axis/len;
 let gap=dot(support2D(a,-n).a-support2D(b,n).a,n);
 let reverse=dot(support2D(b,-n).a-support2D(a,n).a,n);
 var signed=gap;var normal=n;if(reverse>gap){signed=reverse;normal=-n;}
 if(signed>(*best).gap+1e-6){(*best)=Axis2D(signed,normal);}
}
fn closestSpines2D(a:Face2D,b:Face2D)->vec2f {
 let u=a.b-a.a;let v=b.b-b.a;let w=a.a-b.a;
 let aa=dot(u,u);let bb=dot(u,v);let cc=dot(v,v);let dd=dot(u,w);let ee=dot(v,w);
 var s=0.;var t=0.;
 if(aa<1e-16&&cc<1e-16){return w;}
 if(aa<1e-16){t=clamp(ee/cc,0.,1.);}
 else if(cc<1e-16){s=clamp(-dd/aa,0.,1.);}
 else {
  let denominator=aa*cc-bb*bb;
  if(denominator>1e-8*aa*cc){s=clamp((bb*ee-cc*dd)/denominator,0.,1.);}
  t=(bb*s+ee)/cc;
  if(t<0.){t=0.;s=clamp(-dd/aa,0.,1.);}
  else if(t>1.){t=1.;s=clamp((bb-dd)/aa,0.,1.);}
 }
 return a.a+u*s-b.a-v*t;
}
fn onFace2D(face:Face2D,tangent:vec2f,coordinate:f32)->vec2f {
 let delta=dot(face.b-face.a,tangent);
 if(abs(delta)<1e-8){return face.a;}
 return mix(face.a,face.b,clamp((coordinate-dot(face.a,tangent))/delta,0.,1.));
}
fn contact2D(a:u32,b:u32,wa:vec2f,wb:vec2f,n:vec2f,key:u32)->ContactOut {
 return ContactOut(key,inverse2D(bodies[a].pose.z,wa-bodies[a].pose.xy),inverse2D(bodies[b].pose.z,wb-bodies[b].pose.xy),n);
}
// Clip the incident edge to the reference face, preserving two independent torque arms.
fn polygonContacts2D(a:u32,b:u32,n:vec2f)->Collision {
 var out:Collision;
 let fa=facing2D(a,-n);let fb=facing2D(b,n);
 let referenceA=dot(outward2D(fa),-n)>=dot(outward2D(fb),n);
 var referenceFace=fb;if(referenceA){referenceFace=fa;}let rn=outward2D(referenceFace);
 let incident=facing2D(select(a,b,referenceA),-rn);
 let tangent=normalize(referenceFace.b-referenceFace.a);let extent=length(referenceFace.b-referenceFace.a);
 let start=dot(incident.a-referenceFace.a,tangent);let delta=dot(incident.b-incident.a,tangent);
 var lo=0.;var hi=1.;
 if(abs(delta)<1e-8){if(start<0.||start>extent){return out;}}
 else{let u=-start/delta;let v=(extent-start)/delta;lo=max(0.,min(u,v));hi=min(1.,max(u,v));if(lo>hi){return out;}}
 let count=select(1u,2u,(hi-lo)*length(incident.b-incident.a)>1e-6);
 for(var k=0u;k<count;k++){
  let point=mix(incident.a,incident.b,select(lo,hi,k==1u));let gap=dot(point-referenceFace.a,rn);
  if(gap>1e-6){continue;}let projected=point-rn*gap;
  let wa=select(point,projected,referenceA);let wb=select(projected,point,referenceA);
  out.c[out.count]=contact2D(a,b,wa,wb,n,0x30000000u|(referenceFace.feature<<8u)|(incident.feature<<16u)|select(0u,4u,referenceA)|k);out.count++;
 }
 return out;
}
fn planeContacts2D(a:u32,b:u32)->Collision {
 var out:Collision;let planeA=geometry[a].x==3.;let p=select(b,a,planeA);let other=select(a,b,planeA);
 if(geometry[other].x==3.){return out;}
 let n=rot(bodies[p].pose.z,vec2f(0.,1.));let origin=bodies[p].pose.xy;
 let face=support2D(other,-n);let count=select(1u,2u,length(face.b-face.a)>1e-6);
 for(var k=0u;k<count;k++) {
  let point=select(face.a,face.b,k==1u);let gap=dot(point-origin,n);
  if(gap>0.){continue;}let onPlane=point-n*gap;
  let wa=select(point,onPlane,planeA);let wb=select(onPlane,point,planeA);
  out.c[out.count]=contact2D(a,b,wa,wb,select(n,-n,planeA),0x20000000u|(face.feature<<8u)|k);
  out.count++;
 }
 return out;
}
fn collideShapes2D(a:u32,b:u32)->Collision {
 let ga=geometry[a];let gb=geometry[b];let A=bodies[a];let B=bodies[b];
 if(ga.x==0.&&gb.x==0.){return collideBoxes(A.pose.xyz,A.shape.xy*.5,B.pose.xyz,B.shape.xy*.5);}
 if(ga.x==3.||gb.x==3.){return planeContacts2D(a,b);}
 var out:Collision;var best=Axis2D(-3.4e38,vec2f(0.,1.));
 // Face normals plus vertex-to-spine directions are the complete SAT axes for a box
 // versus a swept disk. Two swept disks use their closest spines and side normals.
 for(var side=0u;side<2u;side++) {
  let i=select(a,b,side==1u);let j=select(b,a,side==1u);let g=geometry[i];
  if(polygon2D(i)) {
   for(var k=0u;k<vertices2D(i);k++){consider2D(a,b,outward2D(edge2D(i,k)),&best);}
   if(!polygon2D(j)) {
    let spine=spine2D(j);
    for(var k=0u;k<vertices2D(i);k++){let v=vertex2D(i,k);consider2D(a,b,v-nearest2D(spine.a,spine.b,v),&best);}
   }
  } else if(g.x==2.&&g.z>0.){consider2D(a,b,rot(bodies[i].pose.z,vec2f(0.,1.)),&best);}
 }
 if(!polygon2D(a)&&!polygon2D(b)){consider2D(a,b,closestSpines2D(spine2D(a),spine2D(b)),&best);}
 if(best.gap== -3.4e38){consider2D(a,b,vec2f(0.,1.),&best);}
 if(best.gap>0.){return out;}
 if(polygon2D(a)&&polygon2D(b)){return polygonContacts2D(a,b,best.normal);}
 let n=best.normal;let tangent=vec2f(-n.y,n.x);let fa=support2D(a,-n);let fb=support2D(b,n);
 let ta=vec2f(dot(fa.a,tangent),dot(fa.b,tangent));let tb=vec2f(dot(fb.a,tangent),dot(fb.b,tangent));
 let lo=max(min(ta.x,ta.y),min(tb.x,tb.y));let hi=min(max(ta.x,ta.y),max(tb.x,tb.y));
 // At a rounded corner both faces reduce to points, whose tangent projections coincide.
 let count=select(1u,2u,hi-lo>1e-5);
 for(var k=0u;k<count;k++) {
  let coordinate=select(lo,hi,k==1u);
  out.c[k]=contact2D(a,b,onFace2D(fa,tangent,coordinate),onFace2D(fb,tangent,coordinate),n,
    0x10000000u|(fa.feature<<8u)|(fb.feature<<16u)|k);
 }
 out.count=count;return out;
}
