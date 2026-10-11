const header = `#version 300 es
precision highp float;precision highp int;precision highp usampler2D;
uniform usampler2D filters,neighbors0,neighbors1,neighbors2,neighbors3,contactMetadata,jointInfo,jointAdjacency,colors,status;
uniform uint bodyCount,bodyCapacity,bodyWidth,outputWidth,neighborCapacity,contactsPerPair,contactWidth,jointInfoWidth,jointAdjacencyWidth,jointListOffset,colorCap,conservativeGraph;
layout(location=0)out uvec4 result;
ivec2 at(uint i,uint width){return ivec2(i%width,i/width);}
uint invocation(){return uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;}
uvec4 filterOf(uint i){return texelFetch(filters,at(i,bodyWidth),0);}
bool isDynamic(uint i){return i<bodyCount&&filterOf(i).z!=0u;}
uvec4 colorOf(uint i){return texelFetch(colors,at(i,bodyWidth),0);}
uint jointWord(uint i){return texelFetch(jointAdjacency,at(i/4u,jointAdjacencyWidth),0)[int(i%4u)];}
uint neighbor(uint body,uint index){
  uint page=index/15u,slot=index%15u+1u;ivec2 uv=at(page*bodyCapacity+body,bodyWidth);
  if(slot<4u)return texelFetch(neighbors0,uv,0)[int(slot)];
  if(slot<8u)return texelFetch(neighbors1,uv,0)[int(slot-4u)];
  if(slot<12u)return texelFetch(neighbors2,uv,0)[int(slot-8u)];
  return texelFetch(neighbors3,uv,0)[int(slot-12u)];
}
uint hash32(uint x){x^=x>>16u;x*=0x7feb352du;x^=x>>15u;x*=0x846ca68bu;x^=x>>16u;return x;}
bool precedes(uint a,uint b){uint pa=hash32(a),pb=hash32(b);return pa>pb||(pa==pb&&a>b);}
const uint pending=0xffffffffu,stationary=0xfffffffeu;
`;
const graph = `
uvec2 used=uvec2(0u);bool blocked=false;uint problems=0u;
void visit(uint i,uint j,bool verify){
  if(j==i||!isDynamic(j))return;
  uint col=colorOf(j).x;
  if(verify){if(col==colorOf(i).x)problems|=2u;return;}
  if(col<64u)used[int(col/32u)]|=1u<<(col%32u);
  else if(col==pending&&precedes(j,i))blocked=true;
}
void visitGraph(uint i,bool verify){
  if(filterOf(i).w==0u){
    for(uint k=0u;k<neighborCapacity;k++){
      uint encoded=neighbor(i,k);if(encoded==0u)continue;uint j=encoded-1u;
      if(filterOf(j).w!=0u)continue;
      uint contact=(i*neighborCapacity+k)*contactsPerPair;
      if(conservativeGraph!=0u||texelFetch(contactMetadata,at(contact,contactWidth),0).w!=0u)visit(i,j,verify);
    }
  }
  uint end=jointWord(i+1u);
  for(uint k=jointWord(i);k<end;k++){
    uint index=jointWord(jointListOffset+k);ivec4 joint=ivec4(texelFetch(jointInfo,at(index,jointInfoWidth),0));
    if(joint.x==0)continue;
    int other=joint.y==int(i)?joint.z:joint.y;
    if(other>=0)visit(i,uint(other),verify);
  }
}
`;
const initialize =
  header +
  `void main(){uint i=invocation();result=uvec4(isDynamic(i)?pending:stationary,0u,0u,0u);}`;
const round =
  header +
  graph +
  `
void main(){uint i=invocation();result=colorOf(i);if(!isDynamic(i)||result.x!=pending)return;
  visitGraph(i,false);if(blocked)return;
  for(uint col=0u;col<colorCap;col++)if((used[int(col/32u)]&(1u<<(col%32u)))==0u){result.x=col;return;}
}`;
const validate =
  header +
  graph +
  `
void main(){uint i=invocation();result=uvec4(0u);if(!isDynamic(i))return;
  uint col=colorOf(i).x;if(col>=colorCap)problems|=1u;else visitGraph(i,true);
  uint count=texelFetch(neighbors0,at(i,bodyWidth),0).x;if(count>neighborCapacity)problems|=4u;
  result=uvec4(problems,col<colorCap?col+1u:0u,0u,0u);
}`;
const reduce =
  header +
  `
uniform uint reductionStride;
void main(){uint i=invocation();uvec4 a=texelFetch(status,at(i,bodyWidth),0);uint j=i+reductionStride;
  uvec4 b=j<bodyCapacity?texelFetch(status,at(j,bodyWidth),0):uvec4(0u);
  result=uvec4(a.x|b.x,max(a.y,b.y),0u,0u);
}`;
const publish =
  header +
  `
void main(){uint i=invocation();result=i<bodyCapacity?colorOf(i):uvec4(0u);
  if(i==bodyCapacity)result=texelFetch(status,ivec2(0),0);
}`;

/** Parallel GPU coloring for contacts and persistent constraints in either
 * dimension. Candidate overflow, unresolved colors and conflicting colors are
 * reduced on the GPU. A solve must hold while the published status is nonzero.
 * jointAdjacency is a static CSR of joint IDs; collision adjacency stays on GPU.
 * filters.w is a non-solving sensor marker; filters.z marks active dynamics.
 */
export class GlColoring {
  static create(
    compute,
    broadphase,
    {
      contactsPerPair,
      jointAdjacency,
      jointInfo,
      colorCap = 64,
      rounds = 64,
      conservativeGraph = false,
    } = {},
  ) {
    const coloring = new GlColoring(compute, broadphase, {
      contactsPerPair,
      jointAdjacency,
      jointInfo,
      colorCap,
      rounds,
      conservativeGraph,
    });
    try {
      for (const [name, source] of Object.entries({
        initialize,
        round,
        validate,
        reduce,
        publish,
      })) {
        const program = compute.program(source);
        coloring.resources.push(program);
        coloring.programs[name] = program;
      }
      return coloring;
    } catch (error) {
      coloring.destroy();
      throw error;
    }
  }
  constructor(
    compute,
    broadphase,
    {
      contactsPerPair,
      jointAdjacency,
      jointInfo,
      colorCap,
      rounds,
      conservativeGraph,
    },
  ) {
    if (
      ![2, 8].includes(contactsPerPair) ||
      !Number.isInteger(colorCap) ||
      colorCap < 1 ||
      colorCap > 64 ||
      !Number.isInteger(rounds) ||
      rounds < 1
    )
      throw Error("Invalid WebGL2 coloring options");
    this.compute = compute;
    this.broadphase = broadphase;
    this.contactsPerPair = contactsPerPair;
    this.colorCap = colorCap;
    this.rounds = rounds;
    // Candidate adjacency is reciprocal even when rounded contact clipping
    // accepts a boundary point in only one direction.
    this.conservativeGraph = conservativeGraph;
    this.resources = [];
    this.programs = {};
    const resource = (value) => (this.resources.push(value), value),
      b = broadphase;
    try {
      this.colors = Array.from({ length: 2 }, () =>
        resource(compute.texture(b.width, b.height, true)),
      );
      this.status = Array.from({ length: 2 }, () =>
        resource(compute.texture(b.width, b.height, true)),
      );
      this.published = resource(compute.texture(b.width, b.height + 1, true));
      this.jointListOffset = b.bodyCount + 1;
      if (jointAdjacency) {
        this.jointAdjacency = jointAdjacency;
        this.jointInfo = jointInfo;
      } else {
        this.jointAdjacency = resource(
          compute.texture(
            Math.max(1, Math.ceil(this.jointListOffset / 4)),
            1,
            true,
            new Uint32Array(
              Math.max(4, Math.ceil(this.jointListOffset / 4) * 4),
            ),
          ),
        );
        this.jointInfo = resource(
          compute.texture(1, 1, true, new Uint32Array(4)),
        );
      }
      if (!this.jointAdjacency.integer || !this.jointInfo?.integer)
        throw Error("Joint coloring inputs must be integer textures");
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  dispatch(filters, contactMetadata) {
    if (this.destroyed) throw Error("WebGL2 coloring has been destroyed");
    const c = this.compute,
      b = this.broadphase;
    if (
      !filters.integer ||
      filters.width !== b.width ||
      filters.height !== b.height ||
      !contactMetadata.integer
    )
      throw Error("Invalid coloring input textures");
    const uniforms = {
      bodyCount: ["uniform1ui", b.bodyCount],
      bodyCapacity: ["uniform1ui", b.capacity],
      bodyWidth: ["uniform1ui", b.width],
      outputWidth: ["uniform1ui", b.width],
      neighborCapacity: ["uniform1ui", b.neighborCapacity],
      contactsPerPair: ["uniform1ui", this.contactsPerPair],
      contactWidth: ["uniform1ui", contactMetadata.width],
      jointInfoWidth: ["uniform1ui", this.jointInfo.width],
      jointAdjacencyWidth: ["uniform1ui", this.jointAdjacency.width],
      jointListOffset: ["uniform1ui", this.jointListOffset],
      colorCap: ["uniform1ui", this.colorCap],
      conservativeGraph: ["uniform1ui", Number(this.conservativeGraph)],
    };
    const inputs = {
      filters,
      contactMetadata,
      jointAdjacency: this.jointAdjacency,
      jointInfo: this.jointInfo,
      ...Object.fromEntries(
        b.neighbors.map((texture, i) => [`neighbors${i}`, texture]),
      ),
    };
    c.dispatch(this.programs.initialize, [this.colors[0]], inputs, uniforms);
    let cur = 0;
    for (let r = 0; r < this.rounds; r++) {
      c.dispatch(
        this.programs.round,
        [this.colors[1 - cur]],
        { ...inputs, colors: this.colors[cur] },
        uniforms,
      );
      cur = 1 - cur;
    }
    c.dispatch(
      this.programs.validate,
      [this.status[0]],
      { ...inputs, colors: this.colors[cur] },
      uniforms,
    );
    let state = 0;
    for (let stride = 1; stride < b.capacity; stride *= 2) {
      c.dispatch(
        this.programs.reduce,
        [this.status[1 - state]],
        { status: this.status[state] },
        { ...uniforms, reductionStride: ["uniform1ui", stride] },
      );
      state = 1 - state;
    }
    c.dispatch(
      this.programs.publish,
      [this.published],
      { colors: this.colors[cur], status: this.status[state] },
      uniforms,
    );
    this.validation = this.status[state];
    return this.published;
  }
  destroy() {
    if (this.destroyed) return;
    for (const resource of this.resources) this.compute.release(resource);
    this.resources.length = 0;
    this.destroyed = true;
  }
}
