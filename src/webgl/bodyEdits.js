const header = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D pose,initial,inertial,velocity,previousVelocity,shape,position,rotation,history,properties,motion,commandValues;
uniform usampler2D commandHeaders,ranges;
uniform uint bodyCount,bodyWidth,outputWidth,historyWidth,propertiesWidth,motionWidth,commandWidth,valuesWidth,rangeWidth;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
`;
const loaders = `
w_Command loadCommand(uint i){return w_Command(texelFetch(commandHeaders,at(i,commandWidth),0),texelFetch(commandValues,at(i*2u,valuesWidth),0),texelFetch(commandValues,at(i*2u+1u,valuesWidth),0));}
uvec2 loadRange(uint i){return texelFetch(ranges,at(i,rangeWidth),0).xy;}
`;
const load2D = `
w_Body loadEditBody(uint i){ivec2 uv=at(i,bodyWidth);return w_Body(texelFetch(pose,uv,0),texelFetch(initial,uv,0),texelFetch(inertial,uv,0),texelFetch(velocity,uv,0),texelFetch(previousVelocity,uv,0),texelFetch(shape,uv,0));}
`;
const load3D = `
vec4 hist(uint i,uint f){return texelFetch(history,at(i*4u+f,historyWidth),0);}
vec4 prop(uint i,uint f){return texelFetch(properties,at(i*2u+f,propertiesWidth),0);}
vec4 mot(uint i,uint f){return texelFetch(motion,at(i*2u+f,motionWidth),0);}
w_Body loadEditBody(uint i){return w_Body(texelFetch(position,at(i,bodyWidth),0),texelFetch(rotation,at(i,bodyWidth),0),hist(i,0u),hist(i,1u),prop(i,0u),prop(i,1u),hist(i,2u),hist(i,3u),mot(i,0u),mot(i,1u));}
`;
const specs2D = {
  body: {
    outputs: ["pose", "initial", "inertial", "velocity"],
    values: ["pose", "initial", "inertial", "velocity"],
    fields: 1,
  },
  previous: { outputs: ["previousVelocity"], values: ["previous"], fields: 1 },
};
const specs3D = {
  body: {
    outputs: ["position", "rotation"],
    values: ["pos", "rot"],
    fields: 1,
  },
  history: {
    outputs: ["history"],
    values: [
      "field==0u?bodyResult.w_initialPos:field==1u?bodyResult.w_initialRot:field==2u?bodyResult.w_inertialPos:bodyResult.w_inertialRot",
    ],
    fields: 4,
    expression: true,
  },
  motion: {
    outputs: ["motion"],
    values: ["field==0u?bodyResult.w_velocity:bodyResult.w_angular"],
    fields: 2,
    expression: true,
  },
};
export function editFragment(dimension, stage, math) {
  const spec = (dimension === 2 ? specs2D : specs3D)[stage];
  return (
    header +
    math +
    loaders +
    (dimension === 2 ? load2D : load3D) +
    spec.outputs
      .map((_, i) => `layout(location=${i})out vec4 out${i};`)
      .join("\n") +
    `
void main(){${spec.outputs.map((_, i) => `out${i}=vec4(0.);`).join("")}
  uint index=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth,i=index/${spec.fields}u,field=index%${spec.fields}u;
  if(i>=bodyCount)return;bodyResult=loadEditBody(i);w_edit(uvec3(i,0u,0u));
  ${spec.values.map((v, i) => `out${i}=${spec.expression ? v : "bodyResult.w_" + v};`).join("")}
}`
  );
}
const clearRanges = `#version 300 es
precision highp int;layout(location=0)out uvec4 result;void main(){result=uvec4(0u);}`;

/** Ordered body commands grouped by target body on the CPU; evaluation uses
 * live GPU poses. Uploads contain commands only, never downloaded body state. */
export class GlBodyEdits {
  static create(compute, broadphase, dimension, math) {
    const edits = new GlBodyEdits(compute, broadphase, dimension);
    try {
      for (const stage of Object.keys(edits.specs))
        edits.programs[stage] = compute.program(
          editFragment(dimension, stage, math),
        );
      edits.programs.clear = compute.program(clearRanges);
      return edits;
    } catch (error) {
      edits.destroy();
      throw error;
    }
  }
  constructor(compute, broadphase, dimension) {
    this.compute = compute;
    this.dimension = dimension;
    this.broadphase = broadphase;
    this.specs = dimension === 2 ? specs2D : specs3D;
    this.programs = {};
    this.resources = [];
    this.capacity = 0;
    this.ranges = compute.texture(broadphase.width, broadphase.height, true);
    this.resources.push(this.ranges);
  }
  reserve(count) {
    if (count <= this.capacity) return;
    const c = this.compute,
      cap = 2 ** Math.ceil(Math.log2(Math.max(16, count)));
    const make = (slots, integer) => {
      const w = Math.min(
        c.maxTextureSize,
        2 ** Math.ceil(Math.log2(Math.sqrt(slots))),
      );
      return c.texture(w, Math.ceil(slots / w), integer);
    };
    const headers = make(cap, true),
      values = make(cap * 2, false);
    if (this.headers) c.release(this.headers);
    if (this.values) c.release(this.values);
    this.headers = headers;
    this.values = values;
    this.capacity = cap;
  }
  dispatch(staging, inputs, spare) {
    if (this.destroyed)
      throw Error("WebGL2 command pipeline has been destroyed");
    const count = staging.count;
    if (!count) return;
    this.reserve(count);
    const grouped = new Map(),
      u = staging.u32;
    for (let k = 0; k < count; k++) {
      const id = u[k * 12];
      if (id >= this.broadphase.bodyCount)
        throw Error("Invalid command body index");
      let list = grouped.get(id);
      if (!list) grouped.set(id, (list = []));
      list.push(k);
    }
    const headers = new Uint32Array(count * 4),
      values = new Float32Array(count * 8),
      ranges = [];
    let index = 0;
    for (const [id, list] of grouped) {
      ranges.push([id, new Uint32Array([index, list.length, 0, 0])]);
      for (const k of list) {
        headers.set(u.subarray(k * 12, k * 12 + 4), index * 4);
        values.set(staging.words.subarray(k * 12 + 4, k * 12 + 12), index * 8);
        index++;
      }
    }
    const c = this.compute,
      b = this.broadphase;
    c.dispatch(this.programs.clear, [this.ranges]);
    c.uploadLinear(this.headers, headers);
    c.uploadLinear(this.values, values);
    // Consecutive edited IDs share uploads. Sparse edits send four words per
    // body instead of a full-body property buffer.
    ranges.sort((a, b) => a[0] - b[0]);
    for (let begin = 0; begin < ranges.length;) {
      let end = begin + 1;
      while (end < ranges.length && ranges[end][0] === ranges[end - 1][0] + 1)
        end++;
      const data = new Uint32Array((end - begin) * 4);
      for (let j = begin; j < end; j++) data.set(ranges[j][1], (j - begin) * 4);
      c.uploadLinear(this.ranges, data, ranges[begin][0]);
      begin = end;
    }
    const textures = {
      ...inputs,
      commandHeaders: this.headers,
      commandValues: this.values,
      ranges: this.ranges,
    };
    const uniforms = {
      bodyCount: ["uniform1ui", b.bodyCount],
      bodyWidth: ["uniform1ui", b.width],
      commandWidth: ["uniform1ui", this.headers.width],
      valuesWidth: ["uniform1ui", this.values.width],
      rangeWidth: ["uniform1ui", this.ranges.width],
      historyWidth: ["uniform1ui", inputs.history?.width ?? 1],
      propertiesWidth: ["uniform1ui", inputs.properties?.width ?? 1],
      motionWidth: ["uniform1ui", inputs.motion?.width ?? 1],
    };
    const names = [];
    for (const [stage, spec] of Object.entries(this.specs)) {
      const targets = spec.outputs.map((n) => spare[n]);
      c.dispatch(this.programs[stage], targets, textures, {
        ...uniforms,
        outputWidth: ["uniform1ui", targets[0].width],
      });
      names.push(...spec.outputs);
    }
    for (const name of names)
      [inputs[name], spare[name]] = [spare[name], inputs[name]];
    this.lastBatch = {
      bodies: grouped.size,
      commands: count,
      uploadedBytes: count * 48 + grouped.size * 16,
      path: "webgl2-ordered-commands",
    };
  }
  destroy() {
    if (this.destroyed) return;
    for (const p of Object.values(this.programs)) this.compute.release(p);
    for (const t of [...this.resources, this.headers, this.values])
      if (t) this.compute.release(t);
    this.destroyed = true;
  }
}
