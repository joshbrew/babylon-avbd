import { solveLoaders2D } from "./solve2D.js";
import { solveLoaders3D } from "./solve3D.js";
const header = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D pose,initial,inertial,velocity,previousVelocity,shape,jointStatic,jointPenalty,jointLambda,jointInitial,jointStiffness,contactStatic,contactPenalty;
uniform sampler2D position,rotation,history,properties,motion,joints,contactLambda,manifoldGeo,velocities,materials,bounce;
uniform usampler2D jointInfo,contactIds,contactKeys,manifoldIds,adjacency,colors;
uniform uint outputWidth,bodyWidth,historyWidth,propertiesWidth,motionWidth,jointWidth,jointInfoWidth,jointStaticWidth,contactWidth,contactStaticWidth,manifoldWidth,adjacencyWidth,velocityWidth,bounceWidth,materialWidth,bodyCapacity,guarded,manifoldCount,contactCount;
`;
const common = `
vec4 velocityField(uint i,uint field){return texelFetch(velocities,at(i*4u+field,velocityWidth),0);}
w_Velocity loadVelocity(uint i){return w_Velocity(velocityField(i,0u),velocityField(i,1u),velocityField(i,2u),velocityField(i,3u));}
float loadMaterial(uint i){return texelFetch(materials,at(i,materialWidth),0).x;}
vec4 bounceField(uint i,uint field){return texelFetch(bounce,at(i*3u+field,bounceWidth),0);}
w_Bounce loadBounce(uint i){vec4 b=bounceField(i,0u);return w_Bounce(b.x,b.y,b.z,b.w,bounceField(i,1u),bounceField(i,2u));}
`;
const stages = {
  captureIncoming: "velocity",
  captureSolved: "velocity",
  initialize: "bounce",
  pairs: "bounce",
  apply: "velocity",
  writeBack: "body",
};
export function restitutionFragment(dimension, stage, math) {
  const kind = stages[stage],
    fields =
      kind === "velocity" ? 4 : kind === "bounce" ? 3 : dimension === 3 ? 2 : 1;
  let loaders =
    dimension === 2
      ? solveLoaders2D
      : "ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}\n" + solveLoaders3D;
  loaders = loaders.replace(
    /uint loadCounter\(uint i\)\{[^}]*\}/,
    `uint loadCounter(uint i){uint problems=texelFetch(colors,at(bodyCapacity,bodyWidth),0).x;if(i==3u)return problems&4u;if(i==4u)return problems&3u;return i==${dimension === 2 ? 1 : 6}u?${dimension === 2 ? "contactCount" : "manifoldCount"}:0u;}`,
  );
  const value =
    kind === "velocity"
      ? "field==0u?velocityResult.w_incoming:field==1u?velocityResult.w_incomingAngular:field==2u?velocityResult.w_linear:velocityResult.w_angular"
      : kind === "bounce"
        ? "field==0u?vec4(bounceResult.w_impulse,bounceResult.w_delta,bounceResult.w_reboundSpeed,bounceResult.w_inverseMass):field==1u?bounceResult.w_rA:bounceResult.w_rB"
        : dimension === 3
          ? "field==0u?bodyResult.w_vel:bodyResult.w_angVel"
          : "bodyResult.w_vel";
  const record =
    kind === "velocity"
      ? "velocityResult=loadVelocity(i);"
      : kind === "bounce"
        ? "bounceResult=loadBounce(i);"
        : "bodyResult=loadBody(i);";
  return (
    header +
    math +
    loaders +
    common +
    `
layout(location=0)out vec4 result;
void main(){uint index=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth,i=index/${fields}u,field=index%${fields}u;result=vec4(0.);
  if(i>=${kind === "bounce" ? "w_cfg.w_capacity" : "w_cfg.w_count"})return;${record}
  if(guarded==0u||texelFetch(colors,at(bodyCapacity,bodyWidth),0).x==0u)w_${stage}(uvec3(i,0u,0u));
  result=${value};
}`
  );
}
/** Optional normal restitution using the same centroid impulses and relaxed
 * pair/body iterations as WebGPU. No float atomics or CPU contact solving. */
export class GlRestitution {
  static create(world, dimension, math) {
    const r = new GlRestitution(world, dimension);
    try {
      for (const stage of Object.keys(stages))
        r.programs[stage] = world.compute.program(
          restitutionFragment(dimension, stage, math[stage]),
        );
      return r;
    } catch (error) {
      r.destroy();
      throw error;
    }
  }
  constructor(world, dimension) {
    this.world = world;
    this.dimension = dimension;
    this.compute = world.compute;
    this.resources = [];
    this.programs = {};
    this.active = new Set();
    const c = this.compute,
      b = world.broadphase;
    const texture = (slots) => {
      const width = Math.min(
          c.maxTextureSize,
          Math.max(1, Math.ceil(Math.sqrt(slots))),
        ),
        height = Math.max(1, Math.ceil(slots / width)),
        t = c.texture(width, height);
      this.resources.push(t);
      return t;
    };
    this.velocities = [
      texture(world.bodyCount * 4),
      texture(world.bodyCount * 4),
    ];
    this.capacity = world.narrowphase.slots / (dimension === 3 ? 8 : 1);
    this.bounce = [texture(this.capacity * 3), texture(this.capacity * 3)];
    this.materials = texture(b.capacity);
    this.velocityParity = 0;
    this.bounceParity = 0;
  }
  set(index, value) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.world.bodyCount ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    )
      throw Error(
        "Restitution requires a live body and a value from zero to one",
      );
    if (value > 0) this.active.add(index);
    else this.active.delete(index);
    this.compute.uploadLinear(
      this.materials,
      new Float32Array([value, 0, 0, 0]),
      index,
    );
    return this;
  }
  run(stage) {
    const w = this.world,
      c = this.compute,
      i = w.inputs,
      kind = stages[stage],
      v = this.velocityParity,
      b = this.bounceParity;
    const target =
      kind === "velocity"
        ? this.velocities[1 - v]
        : kind === "bounce"
          ? this.bounce[1 - b]
          : w.spare[this.dimension === 3 ? "motion" : "velocity"];
    const widths = {
      body: i.pose ?? i.position,
      history: i.history,
      properties: i.properties,
      motion: i.motion,
      joint: i.jointPenalty ?? i.joints,
      jointInfo: i.jointInfo,
      jointStatic: i.jointStatic,
      contact: i.contactPenalty,
      contactStatic: i.contactStatic,
      manifold: i.manifoldIds,
      adjacency: i.adjacency,
      velocity: this.velocities[v],
      bounce: this.bounce[b],
      material: this.materials,
    };
    const uniforms = {
      outputWidth: ["uniform1ui", target.width],
      bodyCapacity: ["uniform1ui", w.broadphase.capacity],
      guarded: ["uniform1ui", 1],
      contactCount: ["uniform1ui", w.narrowphase.slots],
      manifoldCount: ["uniform1ui", w.narrowphase.slots / 8],
    };
    for (const [name, texture] of Object.entries(widths))
      uniforms[name + "Width"] = ["uniform1ui", texture?.width ?? 1];
    for (const [name, value] of Object.entries({
      count: w.bodyCount,
      joints: w.jointCount,
      capacity: this.capacity,
      list: w.bodyCount + 1,
      threshold: 1,
      dt: w.params.dt,
      pad0: 0,
      pad1: 0,
    }))
      uniforms["w_cfg.w_" + name] = [
        name === "threshold" || name === "dt" ? "uniform1f" : "uniform1ui",
        value,
      ];
    c.dispatch(
      this.programs[stage],
      [target],
      {
        ...i,
        velocities: this.velocities[v],
        bounce: this.bounce[b],
        materials: this.materials,
      },
      uniforms,
    );
    if (kind === "velocity") this.velocityParity = 1 - v;
    else if (kind === "bounce") this.bounceParity = 1 - b;
    else {
      const name = this.dimension === 3 ? "motion" : "velocity";
      [w.inputs[name], w.spare[name]] = [w.spare[name], w.inputs[name]];
    }
  }
  before() {
    if (this.active.size) this.run("captureIncoming");
  }
  after() {
    if (!this.active.size) return;
    this.run("captureSolved");
    this.run("initialize");
    for (let i = 0; i < 12; i++) {
      this.run("pairs");
      this.run("apply");
    }
    this.run("writeBack");
  }
  destroy() {
    if (this.destroyed) return;
    for (const t of this.resources) this.compute.release(t);
    for (const p of Object.values(this.programs)) this.compute.release(p);
    this.destroyed = true;
  }
}
