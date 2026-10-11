const header = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;
uniform uint bodyCount, capacity, textureWidth;
uniform float cellSize;
uniform sampler2D bounds;
uniform usampler2D filters;
ivec2 address(uint i) {return ivec2(i%textureWidth,i/textureWidth);}
uint invocation() {return uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*textureWidth;}
vec4 body(uint i) {return texelFetch(bounds,address(i),0);}
uvec4 filterOf(uint i) {return texelFetch(filters,address(i),0);}
uint cellHash(ivec3 c) {
  uvec3 v=uvec3(c);
  return ((v.x*73856093u)^(v.y*19349663u)^(v.z*83492791u))&0x7fffffffu;
}
`;
const initialize = `${header}
layout(location=0) out uvec4 record;
void main() {
  uint i=invocation();
  if(i>=bodyCount){record=uvec4(0xffffffffu);return;}
  vec4 b=body(i);
  uint key=b.w>cellSize*.5?0xfffffffeu:cellHash(ivec3(floor(b.xyz/cellSize)));
  record=uvec4(key,i,0u,0u);
}`;
const sort = `${header}
uniform usampler2D records;
uniform uint stage, stride;
layout(location=0) out uvec4 record;
bool lessThanRecord(uvec4 a,uvec4 b) {return a.x<b.x||(a.x==b.x&&a.y<b.y);}
void main() {
  uint i=invocation(),j=i^stride;
  uvec4 a=texelFetch(records,address(i),0),b=texelFetch(records,address(j),0);
  bool takeMin=((i&stride)==0u)==((i&stage)==0u);
  record=(lessThanRecord(a,b)==takeMin)?a:b;
}`;
function candidates(dimension) {
  return `${header}
uniform usampler2D records;
uniform usampler2D jointInfo,jointAdjacency;
uniform sampler2D jointMaterials;
uniform uint jointListsEnabled,jointDimension,jointInfoWidth,jointAdjacencyWidth,jointMaterialsWidth;
layout(location=0) out uvec4 out0;
layout(location=1) out uvec4 out1;
layout(location=2) out uvec4 out2;
layout(location=3) out uvec4 out3;
uint count=0u, page;
uvec4 loadRecord(uint i) {return texelFetch(records,address(i),0);}
uint lowerBound(uint key) {
  uint lo=0u,hi=capacity;
  for(int k=0;k<32;k++) {
    if(lo>=hi)break;
    uint mid=lo+(hi-lo)/2u;
    if(loadRecord(mid).x<key)lo=mid+1u;else hi=mid;
  }
  return lo;
}
void append(uint j) {
  uint slot=1u+count-page*15u;
  count++;
  switch(slot) {
    ${Array.from({ length: 15 }, (_, i) => `case ${i + 1}u: out${Math.floor((i + 1) / 4)}.${"xyzw"[(i + 1) % 4]}=j+1u;break;`).join("\n")}
  }
}
void testPair(uint i,uint j) {
  if(j==i)return;
  uvec4 a=filterOf(i),b=filterOf(j);
  if((a.x&b.y)==0u||(b.x&a.y)==0u)return;
  if(jointListsEnabled!=0u){
    uint firstWord=i/4u,lastWord=(i+1u)/4u;
    uint first=texelFetch(jointAdjacency,ivec2(firstWord%jointAdjacencyWidth,firstWord/jointAdjacencyWidth),0)[int(i%4u)];
    uint last=texelFetch(jointAdjacency,ivec2(lastWord%jointAdjacencyWidth,lastWord/jointAdjacencyWidth),0)[int((i+1u)%4u)];
    for(uint k=first;k<last;k++){
      uint word=bodyCount+1u+k,slot=texelFetch(jointAdjacency,ivec2((word/4u)%jointAdjacencyWidth,(word/4u)/jointAdjacencyWidth),0)[int(word%4u)];
      ivec4 info=ivec4(texelFetch(jointInfo,ivec2(slot%jointInfoWidth,slot/jointInfoWidth),0));
      if(info.x==0||!((info.y==int(i)&&info.z==int(j))||(info.y==int(j)&&info.z==int(i))))continue;
      if(info.x==-1)return;
      uint at=jointDimension==2u?slot:slot*8u;
      vec4 material=texelFetch(jointMaterials,ivec2(at%jointMaterialsWidth,at/jointMaterialsWidth),0);
      if(jointDimension==2u){if(any(notEqual(material.xyz,vec3(0.))))return;}
      else{
        vec4 angular=texelFetch(jointMaterials,ivec2((at+1u)%jointMaterialsWidth,(at+1u)/jointMaterialsWidth),0);
        if(material.w!=0.||angular.w!=0.)return;
      }
    }
  }
  vec4 A=body(i),B=body(j);
  vec3 d=A.xyz-B.xyz;
  float r=A.w+B.w;
  if(dot(d,d)<=r*r)append(j);
}
void cell(uint i,ivec3 c) {
  uint key=cellHash(c),start=lowerBound(key);
  for(uint k=start;k<capacity;k++) {
    uvec4 r=loadRecord(k);
    if(r.x!=key)break;
    // Hash collisions are filtered by the complete signed cell coordinate.
    if(all(equal(ivec3(floor(body(r.y).xyz/cellSize)),c)))testPair(i,r.y);
  }
}
void main() {
  uint index=invocation(),i=index%capacity;
  page=index/capacity;
  out0=uvec4(0u);out1=uvec4(0u);out2=uvec4(0u);out3=uvec4(0u);
  // Static bodies are represented in every dynamic body's adjacency. They do
  // not need their own solve list, including a floor spanning the whole scene.
  if(i>=bodyCount||filterOf(i).z==0u)return;
  vec4 b=body(i);
  if(b.w>cellSize*.5) {
    // Large dynamic shapes may span many grid cells. Testing all other bodies
    // is conservative and cannot miss a small body beside a large collider.
    for(uint j=0u;j<bodyCount;j++)testPair(i,j);
  } else {
    ivec3 c=ivec3(floor(b.xyz/cellSize));
    for(int z=${dimension === 2 ? 0 : -1};z<=${dimension === 2 ? 0 : 1};z++)
      for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)cell(i,c+ivec3(x,y,z));
    for(uint k=lowerBound(0xfffffffeu);k<capacity;k++) {
      uvec4 r=loadRecord(k);
      if(r.x!=0xfffffffeu)break;
      testPair(i,r.y);
    }
  }
  out0.x=count;
}`;
}

/** GPU-resident grid sorting and per-body candidate adjacency, 2D or 3D.
 * bounds: RGBA32F (center.xyz, conservative radius).
 * filters: RGBA32UI (membership, collidesWith, dynamic, reserved).
 * Each page holds a complete candidate count and 15 IDs encoded as index+1.
 * Counts above neighborCapacity are explicit overflow, never silent truncation.
 */
export class GlBroadphase {
  constructor(
    compute,
    { bodyCount, dimension = 3, cellSize = 2, neighborCapacity = 30 } = {},
  ) {
    if (!Number.isInteger(bodyCount) || bodyCount < 0 || bodyCount > 2 ** 28)
      throw Error("Invalid WebGL2 body count");
    if (
      ![2, 3].includes(dimension) ||
      !Number.isFinite(cellSize) ||
      cellSize <= 0 ||
      !Number.isInteger(neighborCapacity) ||
      neighborCapacity < 1
    )
      throw Error("Invalid WebGL2 broadphase options");
    this.compute = compute;
    this.bodyCount = bodyCount;
    this.cellSize = cellSize;
    this.capacity = 2 ** Math.ceil(Math.log2(Math.max(1, bodyCount)));
    this.width = Math.min(
      2 ** Math.floor(Math.log2(compute.maxTextureSize)),
      2 ** Math.ceil(Math.log2(Math.sqrt(this.capacity))),
    );
    this.height = this.capacity / this.width;
    this.pages = Math.ceil(neighborCapacity / 15);
    this.neighborCapacity = this.pages * 15;
    this.resources = [];
    try {
      const resource = (r) => (this.resources.push(r), r);
      this.records = Array.from({ length: 2 }, () =>
        resource(compute.texture(this.width, this.height, true)),
      );
      this.neighbors = Array.from({ length: 4 }, () =>
        resource(compute.texture(this.width, this.height * this.pages, true)),
      );
      this.initialize = resource(compute.program(initialize));
      this.sort = resource(compute.program(sort));
      this.find = resource(compute.program(candidates(dimension)));
      this.emptyJointInfo = resource(
        compute.texture(1, 1, true, new Uint32Array(4)),
      );
      this.emptyJointAdjacency = resource(
        compute.texture(1, 1, true, new Uint32Array(4)),
      );
      this.dimension = dimension;
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  dispatch(bounds, filters, joints = {}) {
    if (this.destroyed) throw Error("WebGL2 broadphase has been destroyed");
    for (const t of [bounds, filters])
      if (t.width !== this.width || t.height !== this.height)
        throw Error("Broadphase input textures have incompatible dimensions");
    if (bounds.integer || !filters.integer)
      throw Error(
        "Broadphase requires float bounds and unsigned integer filters",
      );
    const uniforms = {
        bodyCount: ["uniform1ui", this.bodyCount],
        capacity: ["uniform1ui", this.capacity],
        textureWidth: ["uniform1ui", this.width],
        cellSize: ["uniform1f", this.cellSize],
        jointListsEnabled: ["uniform1ui", Number(!!joints.jointAdjacency)],
        jointDimension: ["uniform1ui", this.dimension],
        jointInfoWidth: ["uniform1ui", joints.jointInfo?.width ?? 1],
        jointAdjacencyWidth: ["uniform1ui", joints.jointAdjacency?.width ?? 1],
        jointMaterialsWidth: [
          "uniform1ui",
          joints.jointMaterials?.width ?? bounds.width,
        ],
      },
      c = this.compute;
    c.dispatch(
      this.initialize,
      [this.records[0]],
      { bounds, filters },
      uniforms,
    );
    let current = 0;
    for (let stage = 2; stage <= this.capacity; stage *= 2)
      for (let stride = stage / 2; stride >= 1; stride /= 2) {
        c.dispatch(
          this.sort,
          [this.records[1 - current]],
          { records: this.records[current] },
          {
            ...uniforms,
            stage: ["uniform1ui", stage],
            stride: ["uniform1ui", stride],
          },
        );
        current = 1 - current;
      }
    this.sorted = this.records[current];
    c.dispatch(
      this.find,
      this.neighbors,
      {
        bounds,
        filters,
        records: this.sorted,
        jointInfo: joints.jointInfo ?? this.emptyJointInfo,
        jointAdjacency: joints.jointAdjacency ?? this.emptyJointAdjacency,
        jointMaterials: joints.jointMaterials ?? bounds,
      },
      uniforms,
    );
    return this.neighbors;
  }
  destroy() {
    if (this.destroyed) return;
    for (const r of this.resources) this.compute.release(r);
    this.resources.length = 0;
    this.destroyed = true;
  }
}
