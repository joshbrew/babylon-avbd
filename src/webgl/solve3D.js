const header = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D position,rotation,history,properties,motion,joints,contactStatic,contactPenalty,contactLambda,manifoldGeo;
uniform usampler2D jointInfo,contactKeys,manifoldIds,adjacency,colors;
uniform uint outputWidth,bodyWidth,historyWidth,propertiesWidth,motionWidth,jointWidth,jointInfoWidth,contactWidth,contactStaticWidth,manifoldWidth,adjacencyWidth,manifoldCount,guarded,bodyCapacity;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
`;
export const solveLoaders3D = `
vec4 historyField(uint i,uint field){return texelFetch(history,at(i*4u+field,historyWidth),0);}
vec4 propertyField(uint i,uint field){return texelFetch(properties,at(i*2u+field,propertiesWidth),0);}
vec4 motionField(uint i,uint field){return texelFetch(motion,at(i*2u+field,motionWidth),0);}
w_Body loadBody(uint i){return w_Body(texelFetch(position,at(i,bodyWidth),0),texelFetch(rotation,at(i,bodyWidth),0),
  historyField(i,0u),historyField(i,1u),propertyField(i,0u),propertyField(i,1u),historyField(i,2u),historyField(i,3u),motionField(i,0u),motionField(i,1u));}
vec4 jointField(uint i,uint field){return texelFetch(joints,at(i*8u+field,jointWidth),0);}
w_Joint loadJoint(uint i){return w_Joint(jointField(i,0u),jointField(i,1u),jointField(i,2u),jointField(i,3u),jointField(i,4u),jointField(i,5u),jointField(i,6u),jointField(i,7u));}
w_Contact loadContact(uint i){vec4 a=texelFetch(contactStatic,at(i*2u,contactStaticWidth),0),b=texelFetch(contactStatic,at(i*2u+1u,contactStaticWidth),0);
  return w_Contact(a.xyz,texelFetch(contactKeys,at(i,contactWidth),0).x,b.xyz,b.w,texelFetch(contactPenalty,at(i,contactWidth),0).xyz,a.w,texelFetch(contactLambda,at(i,contactWidth),0).xyz,texelFetch(contactLambda,at(i,contactWidth),0).w);}
w_Manifold loadManifold(uint i){return w_Manifold(texelFetch(manifoldIds,at(i,manifoldWidth),0),texelFetch(manifoldGeo,at(i,manifoldWidth),0));}
ivec4 loadInfo(uint i){return ivec4(texelFetch(jointInfo,at(i,jointInfoWidth),0));}
uint loadAdj(uint i){return texelFetch(adjacency,at(i/4u,adjacencyWidth),0)[int(i%4u)];}
uint loadCounter(uint i){return i==6u?manifoldCount:0u;}
`;
const bodyNames = [
  "pos",
  "rot",
  "initialPos",
  "initialRot",
  "size",
  "moment",
  "inertialPos",
  "inertialRot",
  "vel",
  "angVel",
];
const jointNames = [
  "penLin",
  "penAng",
  "lamLin",
  "lamAng",
  "c0Lin",
  "c0Ang",
  "rA",
  "rB",
];
const stages = {
  warmStartBodies: {
    root: "warmStartBodies",
    kind: "body",
    outputs: ["position", "rotation"],
    values: ["bodyResult.w_pos", "bodyResult.w_rot"],
  },
  warmStartHistory: {
    root: "warmStartBodies",
    kind: "history",
    outputs: ["history"],
    values: [
      ["initialPos", "initialRot", "inertialPos", "inertialRot"]
        .map((n, i) => `${i === 3 ? "" : `field==${i}u?`}bodyResult.w_${n}`)
        .join(":"),
    ],
  },
  warmStartJoints: {
    root: "warmStartJoints",
    kind: "joint",
    outputs: ["joints"],
    values: [
      jointNames
        .map((n, i) => `${i === 7 ? "" : `field==${i}u?`}jointResult.w_${n}`)
        .join(":"),
    ],
  },
  solveBody: {
    root: "glSolveBody",
    kind: "body",
    outputs: ["position", "rotation"],
    values: ["bodyResult.w_pos", "bodyResult.w_rot"],
  },
  dualJoint: {
    root: "dualJoint",
    kind: "joint",
    outputs: ["joints"],
    values: [
      jointNames
        .map((n, i) => `${i === 7 ? "" : `field==${i}u?`}jointResult.w_${n}`)
        .join(":"),
    ],
  },
  dualContact: {
    root: "dualManifold",
    kind: "contact",
    outputs: ["contactPenalty", "contactLambda", "contactKeys"],
    values: [
      "vec4(contactResult.w_pen,0.)",
      "vec4(contactResult.w_lam,contactResult.w_c0z)",
      "uvec4(contactResult.w_key,0u,0u,0u)",
    ],
  },
  updateVelocities: {
    root: "updateVelocities",
    kind: "motion",
    outputs: ["motion"],
    values: ["field==0u?bodyResult.w_vel:bodyResult.w_angVel"],
  },
};
export function solveFragment3D(stage, math) {
  const spec = stages[stage];
  if (!spec) throw Error(`Unknown 3D solve stage: ${stage}`);
  const kind = spec.kind,
    body = ["body", "history", "motion"].includes(kind);
  const decode =
    kind === "joint"
      ? "uint i=index/8u,field=index%8u;"
      : kind === "history"
        ? "uint i=index/4u,field=index%4u;"
        : kind === "motion"
          ? "uint i=index/2u,field=index%2u;"
          : "uint i=index;";
  const count = body
    ? "w_params.w_bodyCount"
    : kind === "joint"
      ? "w_params.w_jointCount"
      : "manifoldCount*8u";
  const record = body
    ? "bodyResult=loadBody(i);"
    : kind === "joint"
      ? "jointResult=loadJoint(i);"
      : "contactResult=loadContact(i);";
  let call =
    stage === "solveBody"
      ? "if(bodyResult.w_size.w>0.&&texelFetch(colors,at(i,bodyWidth),0).x==w_pc.w_color)w_glSolveBody(i);"
      : kind === "contact"
        ? "w_glPoint=i;if((loadManifold(i/8u).w_ids.w&15u)>i%8u)w_dualManifold(i/8u);"
        : kind === "joint"
          ? `w_${spec.root}(${stage === "warmStartJoints" ? "uvec3(i,0u,0u)" : "i"});`
          : `w_${spec.root}(uvec3(i,0u,0u));`;
  return (
    header +
    math +
    solveLoaders3D +
    spec.outputs
      .map(
        (n, i) =>
          `layout(location=${i})out ${n === "contactKeys" ? "uvec4" : "vec4"} out${i};`,
      )
      .join("\n") +
    `
void main(){${spec.outputs.map((n, i) => `out${i}=${n === "contactKeys" ? "uvec4(0u)" : "vec4(0.)"};`).join("")}
  uint index=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;${decode}if(i>=${count})return;
  ${record}if(guarded==0u||texelFetch(colors,at(bodyCapacity,bodyWidth),0).x==0u){${call}}
  ${spec.values.map((v, i) => `out${i}=${v};`).join("")}
}`
  );
}
export class GlSolve3D {
  static create(compute, { math, onCompile } = {}) {
    const solver = new GlSolve3D(compute);
    try {
      for (const [stage, spec] of Object.entries(stages)) {
        if (!math?.[spec.root]) throw Error(`Missing 3D ${spec.root} shader`);
        onCompile?.(stage);
        solver.programs.set(
          stage,
          compute.program(solveFragment3D(stage, math[spec.root])),
        );
      }
      return solver;
    } catch (error) {
      solver.destroy();
      throw error;
    }
  }
  constructor(compute) {
    this.compute = compute;
    this.programs = new Map();
  }
  dispatch(
    stage,
    inputs,
    outputs,
    {
      params = {},
      pass = {},
      manifoldCount = 0,
      guarded = false,
      bodyCapacity = params.bodyCount,
    } = {},
  ) {
    if (this.destroyed) throw Error("WebGL2 3D solve has been destroyed");
    const spec = stages[stage],
      program = this.programs.get(stage);
    if (!program) throw Error(`Unknown 3D stage: ${stage}`);
    const targets = spec.outputs.map((n) => outputs[n]);
    if (targets.some((t) => !t)) throw Error(`Missing ${stage} outputs`);
    const widths = {
      body: inputs.position,
      history: inputs.history,
      properties: inputs.properties,
      motion: inputs.motion,
      joint: inputs.joints,
      jointInfo: inputs.jointInfo,
      contact: inputs.contactPenalty,
      contactStatic: inputs.contactStatic,
      manifold: inputs.manifoldIds,
      adjacency: inputs.adjacency,
    };
    const uniforms = {
      outputWidth: ["uniform1ui", targets[0].width],
      manifoldCount: ["uniform1ui", manifoldCount],
      guarded: ["uniform1ui", Number(guarded)],
      bodyCapacity: ["uniform1ui", bodyCapacity],
    };
    for (const [n, t] of Object.entries(widths))
      uniforms[n + "Width"] = ["uniform1ui", t.width];
    const floats = new Set([
      "dt",
      "gravity",
      "betaLin",
      "betaAng",
      "gamma",
      "alpha",
      "cellSize",
      "maxSmallRadius",
    ]);
    for (const [n, v] of Object.entries(params)) {
      if (["wind", "gust", "up"].includes(n)) {
        const a = Array.from(v);
        while (a.length < 4) a.push(0);
        uniforms["w_params.w_" + n] = ["uniform4fv", a];
      } else if (typeof v === "number")
        uniforms["w_params.w_" + n] = [
          floats.has(n) ? "uniform1f" : "uniform1ui",
          v,
        ];
    }
    for (const [n, v] of Object.entries(pass))
      uniforms["w_pc.w_" + n] = [n === "alpha" ? "uniform1f" : "uniform1ui", v];
    this.compute.dispatch(program, targets, inputs, uniforms);
  }
  destroy() {
    if (this.destroyed) return;
    for (const p of this.programs.values()) this.compute.release(p);
    this.programs.clear();
    this.destroyed = true;
  }
}
