import { GlContactGraph2D } from "./contactGraph2D.js";
const header = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D pose,rotation,history,properties,motion,rawNormal,rawA,rawB,previousStatic,previousPenalty,previousLambda,anchors,geo;
uniform usampler2D filters,rawMetadata,previousManifolds,previousKeys;
uniform uint bodyCount,bodyWidth,neighborCapacity,contactWidth,staticWidth,propertiesWidth,motionWidth,historyWidth,manifoldWidth,outputWidth,flags,step;
uniform float alpha,gamma,dt;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
uint invocation(){return uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;}
vec3 turn(vec4 q,vec3 p){return p+2.*cross(q.xyz,cross(q.xyz,p)+q.w*p);}
mat3 basisOf(vec3 n){vec3 b=abs(n.x)>abs(n.z)?vec3(-n.y,n.x,0.):vec3(0.,-n.z,n.y);b=normalize(b);return mat3(n,b,cross(n,b));}
uvec4 hit;uint i;vec4 A,B;int match;
bool loadHit(){
  i=invocation();if(i>=bodyCount*neighborCapacity*8u)return false;
  hit=texelFetch(rawMetadata,at(i,contactWidth),0);if(hit.w==0u)return false;
  uvec4 fa=texelFetch(filters,at(hit.x,bodyWidth),0),fb=texelFetch(filters,at(hit.y,bodyWidth),0);
  if(fa.w!=0u||fb.w!=0u||(hit.x<hit.y&&fb.z!=0u))return false;
  A=texelFetch(pose,at(hit.x,bodyWidth),0);B=texelFetch(pose,at(hit.y,bodyWidth),0);return true;
}
void findPrevious(){
  match=-1;
  if(texelFetch(history,at(hit.x*4u,historyWidth),0).w<0.||texelFetch(history,at(hit.y*4u,historyWidth),0).w<0.)return;
  for(uint k=0u;k<neighborCapacity;k++){
    uint m=hit.x*neighborCapacity+k;uvec4 ids=texelFetch(previousManifolds,at(m,manifoldWidth),0);
    if(ids.x!=hit.x||ids.y!=hit.y||(ids.w&15u)==0u)continue;
    for(uint p=0u;p<(ids.w&15u);p++){
      uint c=ids.z+p,key=texelFetch(previousKeys,at(c,contactWidth),0).x;
      if((key&0x7fffffffu)==hit.z){match=int(c);return;}
    }
    if((flags&1u)!=0u){
      vec3 sa=texelFetch(properties,at(hit.x*2u,propertiesWidth),0).xyz,sb=texelFetch(properties,at(hit.y*2u,propertiesWidth),0).xyz;
      float best=.05*min(min(min(sa.x,sa.y),sa.z),min(min(sb.x,sb.y),sb.z));
      vec3 anchor=texelFetch(rawA,at(i,contactWidth),0).xyz;
      for(uint p=0u;p<(ids.w&15u);p++){
        uint c=ids.z+p;float distance=length(texelFetch(previousStatic,at(c*2u,staticWidth),0).xyz-anchor);
        if(distance<=best){best=distance;match=int(c);}
      }
    }
    return;
  }
}
`;
const assemble =
  header +
  `
layout(location=0)out vec4 outA;layout(location=1)out vec4 outB;
layout(location=2)out vec4 outLambda;layout(location=3)out uvec4 outKey;
void main(){
  outA=vec4(0.);outB=vec4(0.);outLambda=vec4(0.);outKey=uvec4(0u);if(!loadHit())return;findPrevious();
  vec3 a=texelFetch(rawA,at(i,contactWidth),0).xyz,b=texelFetch(rawB,at(i,contactWidth),0).xyz;
  if(match>=0){
    uint old=uint(match),key=texelFetch(previousKeys,at(old,contactWidth),0).x;
    outLambda.xyz=texelFetch(previousLambda,at(old,contactWidth),0).xyz;
    float ka=texelFetch(motion,at(hit.x*2u+1u,motionWidth),0).w,kb=texelFetch(motion,at(hit.y*2u+1u,motionWidth),0).w;
    if((key&0x80000000u)!=0u&&ka!=1.&&kb!=1.&&ka!=-1.&&kb!=-1.){a=texelFetch(previousStatic,at(old*2u,staticWidth),0).xyz;b=texelFetch(previousStatic,at(old*2u+1u,staticWidth),0).xyz;}
    outKey.x=key&0x80000000u;
  }
  vec3 normal=texelFetch(rawNormal,at(i,contactWidth),0).xyz;
  vec3 d=A.xyz+turn(texelFetch(rotation,at(hit.x,bodyWidth),0),a)-B.xyz-turn(texelFetch(rotation,at(hit.y,bodyWidth),0),b);
  mat3 basis=basisOf(normal);vec3 c=vec3(dot(basis[0],d)+.01,dot(basis[1],d),dot(basis[2],d));
  outA=vec4(a,c.y);outB=vec4(b,c.x);outLambda=vec4(outLambda.xyz*(alpha*gamma),c.z);outKey=uvec4(hit.z|outKey.x,0u,0u,0u);
}`;
const penalty =
  header +
  `
layout(location=0)out vec4 result;
void main(){result=vec4(0.);if(!loadHit())return;findPrevious();
  if(match>=0)result.xyz=texelFetch(previousPenalty,at(uint(match),contactWidth),0).xyz;
  result.xyz=clamp(result.xyz*gamma,vec3(1.),vec3(1.e10));
  if((flags&16u)!=0u){
    float a=texelFetch(properties,at(hit.x*2u,propertiesWidth),0).w,b=texelFetch(properties,at(hit.y*2u,propertiesWidth),0).w;
    float mass=a>0.&&b>0.?min(a,b):max(a,b);result.x=max(result.x,clamp(mass/(dt*dt),1.,1.e10));
  }
}`;
const pack =
  header +
  `
layout(location=0)out vec4 result;
void main(){uint word=invocation(),point=word/2u;result=vec4(0.);if(point>=bodyCount*neighborCapacity*8u)return;
  result=(word%2u==0u)?texelFetch(anchors,at(point,contactWidth),0):texelFetch(geo,at(point,contactWidth),0);
}`;
const manifolds =
  header +
  `
layout(location=0)out uvec4 ids;layout(location=1)out vec4 geometry;
void main(){uint m=invocation();ids=uvec4(0u);geometry=vec4(0.);if(m>=bodyCount*neighborCapacity)return;
  uvec4 h=texelFetch(rawMetadata,at(m*8u,contactWidth),0);if(h.w==0u)return;
  uvec4 a=texelFetch(filters,at(h.x,bodyWidth),0),b=texelFetch(filters,at(h.y,bodyWidth),0);
  if(a.w!=0u||b.w!=0u||(h.x<h.y&&b.z!=0u))return;
  ids=uvec4(h.x,h.y,m*8u,h.w|(step<<4u));
  geometry=vec4(texelFetch(rawNormal,at(m*8u,contactWidth),0).xyz,sqrt(texelFetch(pose,at(h.x,bodyWidth),0).w*texelFetch(pose,at(h.y,bodyWidth),0).w));
}`;
export class GlContactGraph3D extends GlContactGraph2D {
  static get sources() {
    return { ...super.sources, assemble, penalty, pack, manifolds };
  }
  assemble(inputs, outputs, common, run, params) {
    const uniforms = {
      rotation: inputs.rotation,
      history: inputs.history,
      properties: inputs.properties,
      motion: inputs.motion,
      previousManifolds: inputs.manifoldIds,
      previousKeys: inputs.contactKeys,
      previousStatic: inputs.contactStatic,
      previousPenalty: inputs.contactPenalty,
      previousLambda: inputs.contactLambda,
    };
    const extra = {
      propertiesWidth: ["uniform1ui", inputs.properties.width],
      motionWidth: ["uniform1ui", inputs.motion.width],
      historyWidth: ["uniform1ui", inputs.history.width],
      manifoldWidth: ["uniform1ui", inputs.manifoldIds.width],
      dt: ["uniform1f", params.dt],
      step: ["uniform1ui", params.step],
    };
    run(
      "assemble",
      [this.anchors, this.geo, outputs.contactLambda, outputs.contactKeys],
      { ...common, ...uniforms },
      extra,
    );
    run("penalty", [outputs.contactPenalty], { ...common, ...uniforms }, extra);
    run("pack", [outputs.contactStatic], {
      anchors: this.anchors,
      geo: this.geo,
    });
    run("manifolds", [outputs.manifoldIds, outputs.manifoldGeo], common, extra);
  }
}
