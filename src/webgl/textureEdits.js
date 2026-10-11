const header = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D source,initial,values;uniform usampler2D addresses;
uniform uint sourceWidth,initialWidth,outputWidth,editWidth,count,sourceCount;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
layout(location=0)out vec4 result;
`;
const patch =
  header +
  `void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;vec4 updated=texelFetch(source,at(i,sourceWidth),0);
 uint lo=0u,hi=count;for(int k=0;k<32;k++){if(lo>=hi)break;uint mid=(lo+hi)/2u;if(texelFetch(addresses,at(mid,editWidth),0).x<i)lo=mid+1u;else hi=mid;}
 if(lo<count){uvec4 a=texelFetch(addresses,at(lo,editWidth),0);if(a.x==i){vec4 v=texelFetch(values,at(lo,editWidth),0);for(uint k=0u;k<4u;k++)if((a.y&(1u<<k))!=0u)updated[int(k)]=v[int(k)];}}result=updated;
}`;
const copy =
  header +
  `void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;result=i<sourceCount?texelFetch(source,at(i,sourceWidth),0):texelFetch(initial,at(i,initialWidth),0);}`;
/** Sparse property changes preserve the GPU's current warm-start state. */
export class GlTextureEdits {
  constructor(compute) {
    this.compute = compute;
    this.patchProgram = compute.program(patch);
    this.copyProgram = compute.program(copy);
    this.capacity = 0;
  }
  patch(source, target, entries) {
    if (!entries.length) return;
    const edits = new Map();
    for (const [index, component, value] of entries) {
      let e = edits.get(index);
      if (!e) edits.set(index, (e = { mask: 0, values: [0, 0, 0, 0] }));
      e.mask |= 1 << component;
      e.values[component] = value;
    }
    const list = [...edits].sort((a, b) => a[0] - b[0]),
      c = this.compute;
    if (list.length > this.capacity) {
      c.release(this.addresses);
      c.release(this.values);
      this.width = Math.min(
        c.maxTextureSize,
        Math.max(1, Math.ceil(Math.sqrt(list.length))),
      );
      this.height = Math.ceil(list.length / this.width);
      this.capacity = this.width * this.height;
      this.addresses = c.texture(this.width, this.height, true);
      this.values = c.texture(this.width, this.height);
    }
    c.uploadLinear(
      this.addresses,
      Uint32Array.from(list.flatMap(([id, e]) => [id, e.mask, 0, 0])),
    );
    c.uploadLinear(
      this.values,
      Float32Array.from(list.flatMap(([, e]) => e.values)),
    );
    c.dispatch(
      this.patchProgram,
      [target],
      { source, addresses: this.addresses, values: this.values },
      {
        sourceWidth: ["uniform1ui", source.width],
        outputWidth: ["uniform1ui", target.width],
        editWidth: ["uniform1ui", this.width],
        count: ["uniform1ui", list.length],
      },
    );
  }
  copy(source, initial, target, sourceCount) {
    this.compute.dispatch(
      this.copyProgram,
      [target],
      { source, initial },
      {
        sourceWidth: ["uniform1ui", source.width],
        initialWidth: ["uniform1ui", initial.width],
        outputWidth: ["uniform1ui", target.width],
        sourceCount: ["uniform1ui", sourceCount],
      },
    );
  }
  destroy() {
    for (const r of [
      this.patchProgram,
      this.copyProgram,
      this.addresses,
      this.values,
    ])
      this.compute.release(r);
  }
}
