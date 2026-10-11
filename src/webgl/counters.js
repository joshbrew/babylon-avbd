const header = `#version 300 es
precision highp float;precision highp int;precision highp usampler2D;
uniform usampler2D metadata,filters,neighbors0,neighbors1,neighbors2,neighbors3,values;
uniform uint outputWidth,bodyWidth,bodyCapacity,bodyCount,contactWidth,neighborCapacity,pointsPerPair,count,stride;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
layout(location=0)out uvec4 result;
`;
const countSource =
  header +
  `void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;result=uvec4(0u);if(i>=count)return;uint a=i/neighborCapacity,k=i%neighborCapacity,page=k/15u,slot=k%15u+1u;ivec2 uv=at(page*bodyCapacity+a,bodyWidth);
 uint encoded=slot<4u?texelFetch(neighbors0,uv,0)[int(slot)]:slot<8u?texelFetch(neighbors1,uv,0)[int(slot-4u)]:slot<12u?texelFetch(neighbors2,uv,0)[int(slot-8u)]:texelFetch(neighbors3,uv,0)[int(slot-12u)];if(encoded==0u)return;uint b=encoded-1u;if(a<b&&texelFetch(filters,at(b,bodyWidth),0).z!=0u)return;
 uint contacts=texelFetch(metadata,at(i*pointsPerPair,contactWidth),0).w;result=uvec4(1u,contacts,contacts>0u?1u:0u,0u);}`;
const reduceSource =
  header +
  `void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;result=uvec4(0u);if(i>=count)return;result=texelFetch(values,at(i,outputWidth),0);if(i+stride<count)result+=texelFetch(values,at(i+stride,outputWidth),0);}`;
export class GlCounters {
  constructor(world, dimension) {
    this.world = world;
    this.compute = world.compute;
    this.dimension = dimension;
    this.program = this.compute.program(countSource);
    this.reduce = this.compute.program(reduceSource);
    const n = world.bodyCount * world.broadphase.neighborCapacity,
      width = Math.min(
        this.compute.maxTextureSize,
        Math.max(1, Math.ceil(Math.sqrt(n))),
      ),
      height = Math.max(1, Math.ceil(n / width));
    this.count = n;
    this.textures = [
      this.compute.texture(width, height, true),
      this.compute.texture(width, height, true),
    ];
  }
  async read() {
    const w = this.world,
      b = w.broadphase,
      c = this.compute,
      target = this.textures[0],
      uniforms = {
        outputWidth: ["uniform1ui", target.width],
        bodyWidth: ["uniform1ui", b.width],
        bodyCount: ["uniform1ui", w.bodyCount],
        bodyCapacity: ["uniform1ui", b.capacity],
        contactWidth: ["uniform1ui", w.narrowphase.width],
        neighborCapacity: ["uniform1ui", b.neighborCapacity],
        pointsPerPair: ["uniform1ui", this.dimension === 3 ? 8 : 2],
        count: ["uniform1ui", this.count],
      };
    c.dispatch(
      this.program,
      [target],
      {
        metadata: w.narrowphase.outputs[3],
        filters: w.inputs.filters,
        ...Object.fromEntries(b.neighbors.map((t, k) => ["neighbors" + k, t])),
      },
      uniforms,
    );
    let parity = 0;
    for (let stride = 1; stride < this.count; stride *= 2) {
      c.dispatch(
        this.reduce,
        [this.textures[1 - parity]],
        { values: this.textures[parity] },
        { ...uniforms, stride: ["uniform1ui", stride] },
      );
      parity = 1 - parity;
    }
    // Read one texel rather than downloading the reduction workspace.
    this.summary ??= c.texture(1, 1, true);
    this.publish ??= c.program(
      header + "void main(){result=texelFetch(values,ivec2(0),0);}",
    );
    c.dispatch(this.publish, [this.summary], { values: this.textures[parity] });
    const data = await c.read(this.summary);
    return { pairs: data[0], contacts: data[1], manifolds: data[2] };
  }
  destroy() {
    for (const r of [
      ...this.textures,
      this.summary,
      this.program,
      this.reduce,
      this.publish,
    ])
      this.compute.release(r);
  }
}
