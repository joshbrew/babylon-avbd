const header = `#version 300 es
precision highp float;precision highp int;
precision highp sampler2D;precision highp usampler2D;
uniform sampler2D pose,shape,previousVelocity,rawNormal,rawA,rawB,previousStatic,previousPenalty,anchors,geo;
uniform usampler2D rawMetadata,filters,previousIds,contactIds,jointAdjacency,scan,neighbors0,neighbors1,neighbors2,neighbors3;
uniform uint bodyCount,bodyCapacity,bodyWidth,neighborCapacity,contactWidth,staticWidth,outputWidth,jointWidth,scanWidth,jointCount,adjacencyCapacity,stride,flags,contactsPerPair,manifoldLists;
uniform float alpha,gamma,vbdStiffness;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
uint invocation(){return uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;}
uint jointWord(uint i){return texelFetch(jointAdjacency,at(i/4u,jointWidth),0)[int(i%4u)];}
uvec4 filterOf(uint i){return texelFetch(filters,at(i,bodyWidth),0);}
uint neighbor(uint body,uint index){
  uint page=index/15u,slot=index%15u+1u;ivec2 uv=at(page*bodyCapacity+body,bodyWidth);
  if(slot<4u)return texelFetch(neighbors0,uv,0)[int(slot)];
  if(slot<8u)return texelFetch(neighbors1,uv,0)[int(slot-4u)];
  if(slot<12u)return texelFetch(neighbors2,uv,0)[int(slot-8u)];
  return texelFetch(neighbors3,uv,0)[int(slot-12u)];
}
bool solves(uint a,uint b){return filterOf(a).w==0u&&filterOf(b).w==0u;}
uint canonical(uint a,uint b,uint k);
uint countAt(uint a,uint k){
  uint encoded=neighbor(a,k);if(encoded==0u||!solves(a,encoded-1u))return 0u;
  uint slot=canonical(a,encoded-1u,k);if(slot==0xffffffffu)return 0u;
  uint count=texelFetch(rawMetadata,at(slot,contactWidth),0).w;return manifoldLists!=0u?min(count,1u):count;
}
uint canonical(uint a,uint b,uint k){
  if(a>b||filterOf(b).z==0u)return (a*neighborCapacity+k)*contactsPerPair;
  for(uint j=0u;j<neighborCapacity;j++)if(neighbor(b,j)==a+1u)return (b*neighborCapacity+j)*contactsPerPair;
  return 0xffffffffu;
}
vec2 turn(float angle,vec2 p){float c=cos(angle),s=sin(angle);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
`;
const assemble =
  header +
  `
layout(location=0)out vec4 outAnchors;layout(location=1)out vec4 outGeo;
layout(location=2)out vec4 outPenalty;layout(location=3)out uvec4 outIds;
void main(){
  outAnchors=vec4(0.);outGeo=vec4(0.);outPenalty=vec4(0.);outIds=uvec4(0u);
  uint i=invocation();if(i>=bodyCount*neighborCapacity*2u)return;
  uvec4 hit=texelFetch(rawMetadata,at(i,contactWidth),0);if(hit.w==0u||!solves(hit.x,hit.y))return;
  if(hit.x<hit.y&&filterOf(hit.y).z!=0u)return;
  vec2 ra=texelFetch(rawA,at(i,contactWidth),0).xy,rb=texelFetch(rawB,at(i,contactWidth),0).xy;
  outAnchors=vec4(ra,rb);outIds=uvec4(hit.xyz,0u);
  int match=-1;float best=3.4e38;
  vec4 A=texelFetch(pose,at(hit.x,bodyWidth),0),B=texelFetch(pose,at(hit.y,bodyWidth),0);
  bool edited=texelFetch(previousVelocity,at(hit.x,bodyWidth),0).w!=0.||texelFetch(previousVelocity,at(hit.y,bodyWidth),0).w!=0.;
  for(uint k=0u;k<neighborCapacity*2u&&!edited;k++){
    uint old=hit.x*neighborCapacity*2u+k;uvec4 ids=texelFetch(previousIds,at(old,contactWidth),0);
    if(ids.x!=hit.x||ids.y!=hit.y||ids.x==ids.y)continue;
    if(ids.z==hit.z){match=int(old);break;}
  }
  if(match<0&&!edited&&(flags&8u)!=0u){
    vec2 sa=texelFetch(shape,at(hit.x,bodyWidth),0).xy,sb=texelFetch(shape,at(hit.y,bodyWidth),0).xy;
    float best=.05*min(min(sa.x,sa.y),min(sb.x,sb.y));
    for(uint k=0u;k<neighborCapacity*2u;k++){
      uint old=hit.x*neighborCapacity*2u+k;uvec4 ids=texelFetch(previousIds,at(old,contactWidth),0);
      if(ids.x!=hit.x||ids.y!=hit.y||ids.x==ids.y)continue;
      float distance=length(texelFetch(previousStatic,at(old*3u,staticWidth),0).xy-ra);
      if(distance<=best){best=distance;match=int(old);}
    }
  }
  if(match>=0){
    uint old=uint(match);outPenalty=texelFetch(previousPenalty,at(old,contactWidth),0);
    if(texelFetch(previousIds,at(old,contactWidth),0).w!=0u)outAnchors=texelFetch(previousStatic,at(old*3u,staticWidth),0);
  }
  vec2 n=texelFetch(rawNormal,at(i,contactWidth),0).xy;
  vec2 d=A.xy+turn(A.z,outAnchors.xy)-B.xy-turn(B.z,outAnchors.zw);
  outGeo=vec4(dot(n,d)+.0005,n.y*d.x-n.x*d.y,n);
  if((flags&1u)!=0u)outPenalty.xy=vec2(vbdStiffness);
  else{
    if((flags&4u)==0u)outPenalty.zw*=alpha*gamma;
    outPenalty.xy=clamp(outPenalty.xy*gamma,vec2(1.),vec2(1.e9));
  }
}`;
const pack =
  header +
  `
layout(location=0)out vec4 result;
void main(){
  uint word=invocation(),i=word/3u,field=word%3u;result=vec4(0.);
  if(i>=bodyCount*neighborCapacity*2u)return;
  if(field==0u)result=texelFetch(anchors,at(i,contactWidth),0);
  else if(field==1u)result=texelFetch(geo,at(i,contactWidth),0);
  else{
    uvec4 ids=texelFetch(contactIds,at(i,contactWidth),0);if(ids.x==ids.y)return;
    result.x=sqrt(texelFetch(pose,at(ids.x,bodyWidth),0).w*texelFetch(pose,at(ids.y,bodyWidth),0).w);
  }
}`;
const degree =
  header +
  `
layout(location=0)out uvec4 result;
void main(){uint i=invocation();result=uvec4(0u);if(i>=bodyCount)return;
  uint count=jointWord(i+1u)-jointWord(i);
  if(filterOf(i).z!=0u)for(uint k=0u;k<neighborCapacity;k++)count+=countAt(i,k);
  result=uvec4(count,0u,0u,0u);
}`;
const prefix =
  header +
  `
layout(location=0)out uvec4 result;
void main(){uint i=invocation();result=texelFetch(scan,at(i,scanWidth),0);
  if(i>=stride)result.x+=texelFetch(scan,at(i-stride,scanWidth),0).x;
}`;
const fill =
  header +
  `
layout(location=0)out uvec4 result;
uint endOf(uint i){return texelFetch(scan,at(i,scanWidth),0).x;}
uint word(uint address){
  if(address<=bodyCount)return address==0u?0u:endOf(address-1u);
  uint index=address-bodyCount-1u,total=bodyCount>0u?endOf(bodyCount-1u):0u;
  if(index>=total)return 0u;
  uint lo=0u,hi=bodyCount;
  for(int j=0;j<32;j++){if(lo>=hi)break;uint mid=lo+(hi-lo)/2u;if(endOf(mid)<=index)lo=mid+1u;else hi=mid;}
  uint a=lo,local=index-(a==0u?0u:endOf(a-1u)),start=jointWord(a),jointLength=jointWord(a+1u)-start;
  if(local<jointLength)return jointWord(bodyCount+1u+start+local);
  local-=jointLength;
  for(uint k=0u;k<neighborCapacity;k++){
    uint n=countAt(a,k);if(local<n){uint b=neighbor(a,k)-1u;uint slot=canonical(a,b,k);return jointCount+(manifoldLists!=0u?slot/contactsPerPair:slot)+local;}local-=n;
  }
  return 0u;
}
void main(){uint first=invocation()*4u;uvec4 value=uvec4(0u);
  for(uint j=0u;j<4u;j++)if(first+j<adjacencyCapacity)value[int(j)]=word(first+j);result=value;
}`;

/** GPU-only contact cache and compact CSR construction. Each dynamic pair has
 * one canonical record shared by both body lists. No atomics or readbacks. */
export class GlContactGraph2D {
  static get sources() {
    return { assemble, pack, degree, prefix, fill };
  }
  static create(
    compute,
    broadphase,
    narrowphase,
    { jointAdjacency, jointCount = 0, jointEntries = 0 } = {},
  ) {
    const graph = new this(compute, broadphase, narrowphase, {
      jointAdjacency,
      jointCount,
      jointEntries,
    });
    try {
      for (const [name, source] of Object.entries(this.sources))
        graph.programs[name] = compute.program(source);
      return graph;
    } catch (error) {
      graph.destroy();
      throw error;
    }
  }
  constructor(
    compute,
    broadphase,
    narrowphase,
    { jointAdjacency, jointCount, jointEntries },
  ) {
    this.compute = compute;
    this.broadphase = broadphase;
    this.narrowphase = narrowphase;
    this.jointAdjacency = jointAdjacency;
    this.jointCount = jointCount;
    this.programs = {};
    this.resources = [];
    const texture = (slots, integer = false) => {
      const width = Math.min(
        compute.maxTextureSize,
        Math.max(1, Math.ceil(Math.sqrt(slots))),
      );
      const t = compute.texture(
        width,
        Math.max(1, Math.ceil(slots / width)),
        integer,
      );
      this.resources.push(t);
      return t;
    };
    try {
      const n = narrowphase;
      this.anchors = compute.texture(n.width, n.height);
      this.resources.push(this.anchors);
      this.geo = compute.texture(n.width, n.height);
      this.resources.push(this.geo);
      this.scan = [
        texture(broadphase.capacity, true),
        texture(broadphase.capacity, true),
      ];
      this.adjacencyCapacity =
        broadphase.bodyCount +
        1 +
        jointEntries +
        n.slots / (n.contactsPerPair === 8 ? 8 : 1);
      this.adjacency = texture(Math.ceil(this.adjacencyCapacity / 4), true);
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  dispatch(inputs, outputs, params) {
    const c = this.compute,
      b = this.broadphase,
      n = this.narrowphase;
    const uniforms = {
      bodyCount: ["uniform1ui", b.bodyCount],
      bodyCapacity: ["uniform1ui", b.capacity],
      bodyWidth: ["uniform1ui", b.width],
      neighborCapacity: ["uniform1ui", b.neighborCapacity],
      contactWidth: ["uniform1ui", n.width],
      staticWidth: ["uniform1ui", inputs.contactStatic.width],
      jointWidth: ["uniform1ui", this.jointAdjacency.width],
      jointCount: ["uniform1ui", this.jointCount],
      scanWidth: ["uniform1ui", this.scan[0].width],
      adjacencyCapacity: ["uniform1ui", this.adjacencyCapacity],
      flags: ["uniform1ui", params.flags ?? 2],
      contactsPerPair: ["uniform1ui", n.contactsPerPair],
      manifoldLists: ["uniform1ui", Number(n.contactsPerPair === 8)],
      alpha: ["uniform1f", params.alpha],
      gamma: ["uniform1f", params.gamma],
      vbdStiffness: ["uniform1f", params.vbdStiffness],
    };
    const common = {
      pose: inputs.pose,
      filters: inputs.filters,
      jointAdjacency: this.jointAdjacency,
      rawNormal: n.outputs[0],
      rawA: n.outputs[1],
      rawB: n.outputs[2],
      rawMetadata: n.outputs[3],
      ...Object.fromEntries(b.neighbors.map((t, i) => ["neighbors" + i, t])),
    };
    const run = (name, targets, textures, extra = {}) =>
      c.dispatch(this.programs[name], targets, textures, {
        ...uniforms,
        outputWidth: ["uniform1ui", targets[0].width],
        ...extra,
      });
    this.assemble(inputs, outputs, common, run, params);
    run("degree", [this.scan[0]], common);
    let cur = 0;
    for (let stride = 1; stride < b.capacity; stride *= 2) {
      run(
        "prefix",
        [this.scan[1 - cur]],
        { scan: this.scan[cur] },
        { stride: ["uniform1ui", stride] },
      );
      cur = 1 - cur;
    }
    run("fill", [this.adjacency], { ...common, scan: this.scan[cur] });
    this.prefix = this.scan[cur];
    return this.adjacency;
  }
  assemble(inputs, outputs, common, run) {
    run(
      "assemble",
      [this.anchors, this.geo, outputs.contactPenalty, outputs.contactIds],
      {
        ...common,
        shape: inputs.shape,
        previousVelocity: inputs.previousVelocity,
        previousStatic: inputs.contactStatic,
        previousPenalty: inputs.contactPenalty,
        previousIds: inputs.contactIds,
      },
    );
    run("pack", [outputs.contactStatic], {
      pose: inputs.pose,
      anchors: this.anchors,
      geo: this.geo,
      contactIds: outputs.contactIds,
    });
  }
  destroy() {
    if (this.destroyed) return;
    for (const t of this.resources) this.compute.release(t);
    for (const p of Object.values(this.programs)) this.compute.release(p);
    this.destroyed = true;
  }
}
