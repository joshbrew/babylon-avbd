function fragment(dimension) {
  return `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D pose,initial,inertial,velocity,previousVelocity,shape,position,rotation,history,properties,motion;
uniform usampler2D indices;uniform uint indexWidth,outputWidth,count,stride,bodyWidth,historyWidth,propertiesWidth,motionWidth;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
layout(location=0)out vec4 result;
void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth,slot=i/stride,field=i%stride;result=vec4(0.);if(slot>=count)return;uint id=texelFetch(indices,at(slot,indexWidth),0).x;
 ${
   dimension === 2
     ? `ivec2 uv=at(id,bodyWidth);if(field==0u)result=texelFetch(pose,uv,0);else if(field==1u)result=texelFetch(initial,uv,0);else if(field==2u)result=texelFetch(inertial,uv,0);else if(field==3u)result=texelFetch(velocity,uv,0);else if(field==4u)result=texelFetch(previousVelocity,uv,0);else result=texelFetch(shape,uv,0);`
     : `if(field==0u)result=texelFetch(position,at(id,bodyWidth),0);else if(field==1u)result=texelFetch(rotation,at(id,bodyWidth),0);else if(field==2u||field==3u||field==6u||field==7u){uint k=field<4u?field-2u:field-4u;result=texelFetch(history,at(id*4u+k,historyWidth),0);}else if(field<6u)result=texelFetch(properties,at(id*2u+field-4u,propertiesWidth),0);else result=texelFetch(motion,at(id*2u+field-8u,motionWidth),0);`
 }
}`;
}
/** GPU gather downloads only the requested body records, in caller order. */
export class GlBodyReadback {
  constructor(compute, dimension) {
    this.compute = compute;
    this.dimension = dimension;
    this.program = compute.program(fragment(dimension));
    this.pending = new Set();
  }
  async read(world, ids, posesOnly) {
    const c = this.compute,
      stride = posesOnly
        ? this.dimension === 3
          ? 2
          : 1
        : this.dimension === 3
          ? 10
          : 6;
    if (!ids.length) return new Float32Array();
    const width = Math.min(c.maxTextureSize, Math.ceil(Math.sqrt(ids.length))),
      height = Math.ceil(ids.length / width),
      data = new Uint32Array(width * height * 4);
    ids.forEach((id, i) => (data[i * 4] = id));
    const indices = c.texture(width, height, true, data),
      outWidth = Math.min(
        c.maxTextureSize,
        Math.ceil(Math.sqrt(ids.length * stride)),
      ),
      output = c.texture(outWidth, Math.ceil((ids.length * stride) / outWidth));
    this.pending.add(indices);
    this.pending.add(output);
    const i = world.inputs,
      uniforms = {
        indexWidth: ["uniform1ui", width],
        outputWidth: ["uniform1ui", outWidth],
        count: ["uniform1ui", ids.length],
        stride: ["uniform1ui", stride],
        bodyWidth: ["uniform1ui", world.broadphase.width],
      };
    for (const n of ["history", "properties", "motion"])
      uniforms[n + "Width"] = ["uniform1ui", i[n]?.width ?? 1];
    try {
      c.dispatch(this.program, [output], { ...i, indices }, uniforms);
      return (await c.read(output)).slice(0, ids.length * stride * 4);
    } finally {
      for (const t of [indices, output]) {
        c.release(t);
        this.pending.delete(t);
      }
    }
  }
  destroy() {
    for (const t of this.pending) this.compute.release(t);
    this.pending.clear();
    this.compute.release(this.program);
  }
}
