const header = `#version 300 es
precision highp float;precision highp int;
precision highp sampler2D;precision highp usampler2D;
uniform sampler2D pose,initial,inertial,velocity,previousVelocity,shape;
uniform sampler2D jointStatic,jointPenalty,jointLambda,jointInitial,jointStiffness;
uniform sampler2D contactStatic,contactPenalty;
uniform usampler2D jointInfo,contactIds,adjacency,colors;
uniform uint outputWidth,bodyWidth,jointWidth,contactWidth,adjacencyWidth,jointStaticWidth,contactStaticWidth,contactCount;
uniform uint guarded,bodyCapacity;
`;
export const solveLoaders2D = `
ivec2 at(uint i,uint width){return ivec2(i%width,i/width);}
w_Body loadBody(uint i){ivec2 uv=at(i,bodyWidth);return w_Body(
  texelFetch(pose,uv,0),texelFetch(initial,uv,0),texelFetch(inertial,uv,0),
  texelFetch(velocity,uv,0),texelFetch(previousVelocity,uv,0),texelFetch(shape,uv,0));}
vec4 jointField(uint i,uint field){return texelFetch(jointStatic,at(i*5u+field,jointStaticWidth),0);}
w_Joint loadJoint(uint i){ivec2 uv=at(i,jointWidth);return w_Joint(
  texelFetch(jointPenalty,uv,0),texelFetch(jointLambda,uv,0),texelFetch(jointStiffness,uv,0),
  jointField(i,0u),jointField(i,1u),jointField(i,2u),texelFetch(jointInitial,uv,0),jointField(i,3u),jointField(i,4u));}
vec4 contactField(uint i,uint field){return texelFetch(contactStatic,at(i*3u+field,contactStaticWidth),0);}
w_Contact loadContact(uint i){ivec2 uv=at(i,contactWidth);return w_Contact(
  texelFetch(contactIds,uv,0),texelFetch(contactPenalty,uv,0),contactField(i,0u),contactField(i,1u),contactField(i,2u));}
ivec4 loadInfo(uint i){return ivec4(texelFetch(jointInfo,at(i,jointWidth),0));}
uint loadAdj(uint i){return texelFetch(adjacency,at(i/4u,adjacencyWidth),0)[int(i%4u)];}
uint loadCounter(uint i){return i==1u?contactCount:0u;}
`;
const stages = {
  warmStartBodies: {
    kind: "body",
    outputs: ["pose", "initial", "inertial", "velocity"],
    values: [
      "bodyResult.w_pose",
      "bodyResult.w_initial",
      "bodyResult.w_inertial",
      "bodyResult.w_vel",
    ],
    call: "if(bodyResult.w_vel.w==0.)w_warmStartBodies(uvec3(i,0u,0u));",
  },
  solveBody: {
    kind: "body",
    outputs: ["pose"],
    values: ["bodyResult.w_pose"],
    call: "if(bodyResult.w_shape.z>0.&&bodyResult.w_vel.w==0.&&texelFetch(colors,at(i,bodyWidth),0).x==w_pc.w_color)w_solveBody(i);",
  },
  updateVelocities: {
    kind: "body",
    outputs: ["velocity", "previousVelocity"],
    values: ["bodyResult.w_vel", "bodyResult.w_prevVel"],
    call: "if(bodyResult.w_vel.w==0.)w_updateVelocities(uvec3(i,0u,0u));",
  },
  warmStartJoints: {
    kind: "joint",
    outputs: ["jointPenalty", "jointLambda", "jointInitial", "jointStiffness"],
    values: [
      "jointResult.w_pen",
      "jointResult.w_lam",
      "jointResult.w_c0",
      "jointResult.w_stiff",
    ],
    call: "w_warmStartJoints(uvec3(i,0u,0u));",
  },
  dualJoint: {
    kind: "joint",
    outputs: ["jointPenalty", "jointLambda", "jointInitial", "jointStiffness"],
    values: [
      "jointResult.w_pen",
      "jointResult.w_lam",
      "jointResult.w_c0",
      "jointResult.w_stiff",
    ],
    call: "w_dualJoint(i);",
  },
  dualContact: {
    kind: "contact",
    outputs: ["contactPenalty", "contactIds"],
    values: ["contactResult.w_pl", "contactResult.w_ids"],
    call: "if(contactResult.w_ids.x!=contactResult.w_ids.y)w_dualContact(i);",
  },
  refreshStick: {
    kind: "contact",
    outputs: ["contactPenalty", "contactIds"],
    values: ["contactResult.w_pl", "contactResult.w_ids"],
    call: "if(contactResult.w_ids.x!=contactResult.w_ids.y)w_refreshStick(uvec3(i,0u,0u));",
  },
};
export function solveFragment2D(stage, math) {
  const spec = stages[stage];
  if (!spec) throw Error(`Unknown 2D solve stage: ${stage}`);
  const record =
    spec.kind === "body"
      ? "bodyResult=loadBody(i);"
      : spec.kind === "joint"
        ? "jointResult=loadJoint(i);"
        : "contactResult=loadContact(i);";
  const count =
    spec.kind === "body"
      ? "w_params.w_bodyCount"
      : spec.kind === "joint"
        ? "w_params.w_jointCount"
        : "contactCount";
  // Only adaptive body prediction reads previousVelocity. Avoid keeping its
  // sampler active through a returned struct in constraint passes: WebGL2
  // guarantees 16 fragment samplers, and some drivers retain unused fields.
  const stageLoaders = ["warmStartBodies", "updateVelocities"].includes(stage)
    ? solveLoaders2D
    : solveLoaders2D.replace("texelFetch(previousVelocity,uv,0)", "vec4(0.)");
  return (
    header +
    math +
    stageLoaders +
    spec.outputs
      .map(
        (name, i) =>
          `layout(location=${i})out ${name === "contactIds" ? "uvec4" : "vec4"} out${i};`,
      )
      .join("\n") +
    `
  void main(){
    ${spec.outputs.map((name, i) => `out${i}=${name === "contactIds" ? "uvec4(0u)" : "vec4(0.)"};`).join("")}
    uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;
    if(i>=${count})return;
    ${record}
    if(guarded==0u||texelFetch(colors,at(bodyCapacity,bodyWidth),0).x==0u){${spec.call}}
    ${spec.values.map((value, i) => `out${i}=${value};`).join("")}
  }`
  );
}

/** Internal AVBD solve stages. Caller supplies GPU topology and ping-pong
 * outputs; no contact detection or constraint evaluation occurs on the CPU.
 * The public WebGL2 world awaits complete topology, caching and feature parity.
 */
export class GlSolve2D {
  static create(compute, { math, onCompile } = {}) {
    const solver = new GlSolve2D(compute);
    try {
      for (const stage of Object.keys(stages)) {
        if (!math?.[stage]) throw Error(`Missing generated ${stage} shader`);
        onCompile?.(stage);
        solver.programs.set(
          stage,
          compute.program(solveFragment2D(stage, math[stage])),
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
      params,
      pass,
      contactCount = 0,
      adjacencyWidth,
      guarded = false,
      bodyCapacity,
    } = {},
  ) {
    if (this.destroyed) throw Error("WebGL2 solve stages have been destroyed");
    const spec = stages[stage],
      program = this.programs.get(stage);
    if (!program) throw Error(`Unknown or uncompiled solve stage: ${stage}`);
    const targets = spec.outputs.map((name) => outputs[name]);
    if (targets.some((t) => !t)) throw Error(`Missing ${stage} output texture`);
    const uniforms = {
      outputWidth: ["uniform1ui", targets[0].width],
      bodyWidth: ["uniform1ui", inputs.pose.width],
      jointWidth: ["uniform1ui", inputs.jointPenalty.width],
      contactWidth: ["uniform1ui", inputs.contactPenalty.width],
      adjacencyWidth: ["uniform1ui", adjacencyWidth ?? inputs.adjacency.width],
      jointStaticWidth: ["uniform1ui", inputs.jointStatic.width],
      contactStaticWidth: ["uniform1ui", inputs.contactStatic.width],
      contactCount: ["uniform1ui", contactCount],
      guarded: ["uniform1ui", Number(guarded)],
      bodyCapacity: ["uniform1ui", bodyCapacity ?? params?.bodyCount ?? 0],
    };
    const integers = new Set([
      "flags",
      "bodyCount",
      "jointCount",
      "colorCap",
      "tableMask",
      "largeCount",
      "noCollideCount",
      "pairCapacity",
      "contactCapacity",
      "hashMask",
      "adjFillOffset",
      "adjListOffset",
      "gridCursorOffset",
      "gridSortedOffset",
      "gridCellOffset",
      "stateBOffset",
      "colorHistOffset",
      "colorStartOffset",
      "colorGroups",
      "colorBodiesOffset",
      "rounds",
      "pad0",
      "pad1",
      "pad2",
    ]);
    for (const [name, value] of Object.entries(params ?? {}))
      uniforms[`w_params.w_${name}`] = [
        integers.has(name) ? "uniform1ui" : "uniform1f",
        value,
      ];
    for (const [name, value] of Object.entries(pass ?? {}))
      uniforms[`w_pc.w_${name}`] = [
        name === "alpha" ? "uniform1f" : "uniform1ui",
        value,
      ];
    this.compute.dispatch(program, targets, inputs, uniforms);
    return outputs;
  }
  destroy() {
    if (this.destroyed) return;
    for (const p of this.programs.values()) this.compute.release(p);
    this.programs.clear();
    this.destroyed = true;
  }
}
