function sources(dimension) {
  const header = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;precision highp usampler2D;
uniform sampler2D states,velocity,previousVelocity,shape,pose,initial,inertial,position,rotation,properties,motion,history,jointMaterials,jointStatic,rawNormal;
uniform usampler2D eligibility,flags,globalState,filters,rawMetadata,jointInfo,jointAdjacency,neighbors0,neighbors1,neighbors2,neighbors3,colors;
uniform uint bodyCount,bodyCapacity,bodyWidth,outputWidth,neighborCapacity,contactWidth,jointInfoWidth,jointAdjacencyWidth,jointMaterialsWidth,jointStaticWidth,propertiesWidth,motionWidth,historyWidth,stride,forceWake;
uniform float speedLimit,delay,dt,gravity;uniform vec3 up;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
uint invocation(){return uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth;}
vec4 stateOf(uint i){return texelFetch(states,at(i,bodyWidth),0);}
vec4 motionOf(uint i,uint field){return texelFetch(motion,at(i*2u+field,motionWidth),0);}
float speedOf(uint i){${dimension === 2 ? "vec4 v=texelFetch(velocity,at(i,bodyWidth),0);return length(v.xy)+abs(v.z)*.5*length(texelFetch(shape,at(i,bodyWidth),0).xy);" : "return length(motionOf(i,0u).xyz)+length(motionOf(i,1u).xyz)*texelFetch(properties,at(i*2u+1u,propertiesWidth),0).w;"}}
uint jointWord(uint i){return texelFetch(jointAdjacency,at(i/4u,jointAdjacencyWidth),0)[int(i%4u)];}
uint neighbor(uint body,uint index){uint page=index/15u,slot=index%15u+1u;ivec2 uv=at(page*bodyCapacity+body,bodyWidth);
  if(slot<4u)return texelFetch(neighbors0,uv,0)[int(slot)];if(slot<8u)return texelFetch(neighbors1,uv,0)[int(slot-4u)];if(slot<12u)return texelFetch(neighbors2,uv,0)[int(slot-8u)];return texelFetch(neighbors3,uv,0)[int(slot-12u)];}
bool failed(){return texelFetch(colors,at(bodyCapacity,bodyWidth),0).x!=0u;}
vec4 nextState(uint i,bool rest){
  vec4 s=stateOf(i);if(s.x<=0.)return s;
  bool eligible=texelFetch(eligibility,at(i,bodyWidth),0).x!=0u;
  uint f=texelFetch(flags,at(i,bodyWidth),0).x;
  if(!rest){if(texelFetch(globalState,ivec2(0),0).x!=0u||!eligible){s.y=0.;s.z=0.;s.w=0.;}return s;}
  if(failed())return s;
  float speed=speedOf(i);bool supported=(f&1u)!=0u;
  s.w=supported&&speed<=speedLimit?1.:0.;
  if(!eligible||(f&2u)!=0u){s.y=0.;s.z=0.;return s;}
  if(s.z==0.){s.y=speed<=speedLimit&&(gravity==0.||supported)?s.y+dt:0.;if(s.y>=delay)s.z=1.;}
  return s;
}
`;
  const analyze =
    header +
    `
layout(location=0)out uvec4 result;
void main(){uint i=invocation();result=uvec4(0u);if(i>=bodyCount)return;vec4 s=stateOf(i);if(s.x<=0.)return;
  uint f=0u;bool wake=forceWake!=0u;float ownSpeed=speedOf(i);
  if(texelFetch(filters,at(i,bodyWidth),0).w==0u)for(uint k=0u;k<neighborCapacity;k++){
    uint encoded=neighbor(i,k);if(encoded==0u)continue;uint other=encoded-1u;if(texelFetch(filters,at(other,bodyWidth),0).w!=0u)continue;
    uint c=(i*neighborCapacity+k)*${dimension === 2 ? 2 : 8}u;if(texelFetch(rawMetadata,at(c,contactWidth),0).w==0u)continue;
    vec4 otherState=stateOf(other);float otherSpeed=speedOf(other);
    if((s.z!=0.||otherState.z!=0.)&&(ownSpeed>2.*speedLimit||otherSpeed>2.*speedLimit))wake=true;
    vec3 normal=texelFetch(rawNormal,at(c,contactWidth),0).xyz;
    if(dot(normal,up)>.3&&(otherState.x==0.||otherState.z!=0.||(otherState.w!=0.&&otherSpeed<=speedLimit)))f|=1u;
  }
  for(uint k=jointWord(i);k<jointWord(i+1u);k++){
    uint slot=jointWord(bodyCount+1u+k);ivec4 info=ivec4(texelFetch(jointInfo,at(slot,jointInfoWidth),0));if(info.x==0)continue;
    ${
      dimension === 2
        ? `vec4 material=texelFetch(jointMaterials,at(slot,jointMaterialsWidth),0);if(all(equal(material.xyz,vec3(0.))))continue;
    bool powered=info.x==3&&texelFetch(jointStatic,at(slot*5u+1u,jointStaticWidth),0).x>0.;
    bool hard=info.x==1&&material.x>=1.e30&&material.y>=1.e30;`
        : `vec4 material=texelFetch(jointMaterials,at(slot*8u,jointMaterialsWidth),0);if(material.w==0.)continue;
    bool powered=info.x==3&&texelFetch(jointMaterials,at(slot*8u+7u,jointMaterialsWidth),0).w>0.;bool hard=info.x==1&&material.w>=1.e30;`
    }
    if(powered){f|=2u;if(s.z!=0.)wake=true;}
    int other=info.y==int(i)?info.z:info.y;
    if(other<0){if(hard)f|=1u;continue;}
    vec4 otherState=stateOf(uint(other));float otherSpeed=speedOf(uint(other));
    if((s.z!=0.&&otherSpeed>2.*speedLimit)||(otherState.z!=0.&&ownSpeed>2.*speedLimit))wake=true;
    if(hard&&(otherState.x==0.||otherState.z!=0.||(otherState.w!=0.&&otherSpeed<=speedLimit)))f|=1u;
  }
  if(s.z!=0.&&(texelFetch(eligibility,at(i,bodyWidth),0).x==0u||(f&2u)!=0u||(gravity!=0.&&(f&1u)==0u)))wake=true;
  result=uvec4(f,wake?1u:0u,0u,0u);
}`;
  const reduce =
    header +
    `
layout(location=0)out uvec4 result;
void main(){uint i=invocation();uvec4 a=texelFetch(flags,at(i,bodyWidth),0),b=uvec4(0u);if(i+stride<bodyCapacity)b=texelFetch(flags,at(i+stride,bodyWidth),0);result=uvec4(a.y|b.y,a.y|b.y,a.z+b.z,0u);}`;
  const state = (rest) =>
    header +
    `layout(location=0)out vec4 result;void main(){uint i=invocation();result=i<bodyCount?nextState(i,${rest ? "true" : "false"}):vec4(0.);}`;
  const body = (rest) =>
    dimension === 2
      ? header +
        `
layout(location=0)out vec4 outVelocity;layout(location=1)out vec4 outInitial;layout(location=2)out vec4 outInertial;
void main(){uint i=invocation();outVelocity=vec4(0.);outInitial=vec4(0.);outInertial=vec4(0.);if(i>=bodyCount)return;
  vec4 s=nextState(i,${rest ? "true" : "false"});ivec2 uv=at(i,bodyWidth);outVelocity=texelFetch(velocity,uv,0);outInitial=texelFetch(initial,uv,0);outInertial=texelFetch(inertial,uv,0);
  if(s.x<=0.)return;if(s.z!=0.){outVelocity=vec4(0.,0.,0.,1.);outInitial=vec4(texelFetch(pose,uv,0).xyz,outInitial.w);outInertial=vec4(texelFetch(pose,uv,0).xyz,0.);}else outVelocity.w=0.;
}`
      : header +
        `
layout(location=0)out vec4 outProperties;layout(location=1)out vec4 outMotion;
void main(){uint index=invocation(),i=index/2u,field=index%2u;outProperties=vec4(0.);outMotion=vec4(0.);if(i>=bodyCount)return;
  vec4 s=nextState(i,${rest ? "true" : "false"});outProperties=texelFetch(properties,at(index,propertiesWidth),0);outMotion=texelFetch(motion,at(index,motionWidth),0);
  if(field==0u)outProperties.w=s.z!=0.?0.:s.x;
  if(s.z!=0.)outMotion=field==0u?vec4(0.):vec4(0.,0.,0.,outMotion.w);
}`;
  const history =
    dimension === 2
      ? header +
        `
layout(location=0)out vec4 result;void main(){uint i=invocation();result=vec4(0.);if(i>=bodyCount)return;result=texelFetch(previousVelocity,at(i,bodyWidth),0);if(nextState(i,true).z!=0.)result=vec4(0.);}`
      : header +
        `
layout(location=0)out vec4 result;void main(){uint index=invocation(),i=index/4u,field=index%4u;result=vec4(0.);if(i>=bodyCount)return;result=texelFetch(history,at(index,historyWidth),0);
  if(nextState(i,true).z!=0.){if(field==0u||field==2u){vec4 p=texelFetch(position,at(i,bodyWidth),0);result=vec4(p.xyz,result.w);}else result=texelFetch(rotation,at(i,bodyWidth),0);}}`;
  const count =
    header +
    `layout(location=0)out uvec4 result;void main(){uint i=invocation();result=uvec4(0u,0u,i<bodyCount&&stateOf(i).z!=0.?1u:0u,0u);}`;
  const publish =
    header +
    `layout(location=0)out uvec4 result;void main(){uvec4 v=texelFetch(flags,ivec2(0),0);result=uvec4(v.y,v.y,v.z,0u);}`;
  return {
    analyze,
    reduce,
    wakeState: state(false),
    restState: state(true),
    wakeBody: body(false),
    restBody: body(true),
    history,
    count,
    publish,
  };
}
/** Conservative, per-body opt-in GPU sleeping. Supports propagate from resting
 * contacts and hard anchors; impacts, powered motors, edits and lost supports
 * wake the world. Physical mass is retained in a separate state texture. */
export class GlSleeping {
  static create(
    world,
    dimension,
    { speed = 0.08, delay = 0.75, eligible } = {},
  ) {
    if (
      !Number.isFinite(speed) ||
      speed <= 0 ||
      !Number.isFinite(delay) ||
      delay <= 0
    )
      throw Error("Sleep speed and delay must be positive");
    const policy = new GlSleeping(world, dimension, { speed, delay, eligible });
    try {
      for (const [name, source] of Object.entries(sources(dimension)))
        policy.programs[name] = world.compute.program(source);
      return policy;
    } catch (error) {
      policy.destroy();
      throw error;
    }
  }
  constructor(world, dimension, { speed, delay, eligible }) {
    this.world = world;
    this.dimension = dimension;
    this.compute = world.compute;
    this.speed = speed;
    this.delay = delay;
    this.forceWake = true;
    this.programs = {};
    this.resources = [];
    const b = world.broadphase,
      c = this.compute,
      make = (integer = false, data) => {
        const t = c.texture(b.width, b.height, integer, data);
        this.resources.push(t);
        return t;
      };
    const states = new Float32Array(b.capacity * 4),
      bits = new Uint32Array(b.capacity * 4);
    for (let i = 0; i < world.bodyCount; i++) {
      states[i * 4] = world.initialMasses[i];
      bits[i * 4] = Number(eligible?.[i] !== false);
    }
    this.states = [make(false, states), make()];
    this.stateParity = 0;
    this.eligibility = make(true, bits);
    this.flags = make(true);
    this.reductions = [make(true), make(true)];
    this.summary = c.texture(1, 1, true);
    this.resources.push(this.summary);
  }
  setEligible(id, enabled) {
    if (
      !Number.isInteger(id) ||
      id < 0 ||
      id >= this.world.bodyCount ||
      typeof enabled !== "boolean"
    )
      throw Error("Sleep eligibility requires a live body and boolean");
    this.compute.uploadLinear(
      this.eligibility,
      new Uint32Array([Number(enabled), 0, 0, 0]),
      id,
    );
    this.wake();
    return this;
  }
  wake() {
    this.forceWake = true;
    return this;
  }
  wakeNow() {
    this.compute.uploadLinear(this.summary, new Uint32Array([1, 1, 0, 0]));
    this.apply(false);
    return this.wake();
  }
  uniforms(target) {
    const w = this.world,
      i = w.inputs,
      b = w.broadphase;
    const widths = {
      jointInfo: i.jointInfo,
      jointAdjacency: w.jointAdjacency,
      jointMaterials: this.dimension === 2 ? i.jointStiffness : i.joints,
      jointStatic: i.jointStatic,
      properties: i.properties,
      motion: i.motion,
      history: i.history,
    };
    const result = {
      bodyCount: ["uniform1ui", w.bodyCount],
      bodyCapacity: ["uniform1ui", b.capacity],
      bodyWidth: ["uniform1ui", b.width],
      outputWidth: ["uniform1ui", target.width],
      neighborCapacity: ["uniform1ui", b.neighborCapacity],
      contactWidth: ["uniform1ui", w.narrowphase.width],
      forceWake: ["uniform1ui", Number(this.forceWake)],
      speedLimit: ["uniform1f", this.speed],
      delay: ["uniform1f", this.delay],
      dt: ["uniform1f", w.params.dt],
      gravity: ["uniform1f", w.params.gravity],
      up: [
        "uniform3fv",
        this.dimension === 2
          ? [0, w.params.gravity > 0 ? -1 : 1, 0]
          : Array.from(w.params.up).slice(0, 3),
      ],
    };
    for (const [name, t] of Object.entries(widths))
      result[name + "Width"] = ["uniform1ui", t?.width ?? 1];
    return result;
  }
  textures() {
    const w = this.world,
      i = w.inputs;
    return Object.fromEntries(
      Object.entries({
        ...i,
        colors: i.colors ?? w.coloring.published,
        states: this.states[this.stateParity],
        eligibility: this.eligibility,
        flags: this.flags,
        globalState: this.summary,
        jointAdjacency: w.jointAdjacency,
        jointMaterials: this.dimension === 2 ? i.jointStiffness : i.joints,
        rawMetadata: w.narrowphase.outputs[3],
        rawNormal: w.narrowphase.outputs[0],
        ...Object.fromEntries(
          w.broadphase.neighbors.map((t, k) => ["neighbors" + k, t]),
        ),
      }).filter(([, t]) => t !== undefined),
    );
  }
  reduce(source) {
    const c = this.compute,
      b = this.world.broadphase;
    let input = source,
      cur = 0;
    for (let stride = 1; stride < b.capacity; stride *= 2) {
      const target = this.reductions[cur];
      c.dispatch(
        this.programs.reduce,
        [target],
        { flags: input },
        { ...this.uniforms(target), stride: ["uniform1ui", stride] },
      );
      input = target;
      cur = 1 - cur;
    }
    c.dispatch(
      this.programs.publish,
      [this.summary],
      { flags: input },
      this.uniforms(this.summary),
    );
  }
  before() {
    const c = this.compute;
    const textures = this.textures();
    c.dispatch(
      this.programs.analyze,
      [this.flags],
      Object.fromEntries(
        Object.entries(textures).filter(([n]) => n !== "flags"),
      ),
      this.uniforms(this.flags),
    );
    this.reduce(this.flags);
    this.apply(false);
    this.forceWake = false;
  }
  apply(rest) {
    const w = this.world,
      i = w.inputs,
      s = w.spare,
      c = this.compute,
      textures = this.textures(),
      stateTarget = this.states[1 - this.stateParity];
    const names =
      this.dimension === 2
        ? ["velocity", "initial", "inertial"]
        : ["properties", "motion"];
    const targets = names.map((n) => s[n]);
    c.dispatch(
      this.programs[rest ? "restBody" : "wakeBody"],
      targets,
      textures,
      this.uniforms(targets[0]),
    );
    if (rest) {
      const name = this.dimension === 2 ? "previousVelocity" : "history";
      c.dispatch(
        this.programs.history,
        [s[name]],
        textures,
        this.uniforms(s[name]),
      );
      names.push(name);
    }
    c.dispatch(
      this.programs[rest ? "restState" : "wakeState"],
      [stateTarget],
      textures,
      this.uniforms(stateTarget),
    );
    for (const name of names) [i[name], s[name]] = [s[name], i[name]];
    this.stateParity = 1 - this.stateParity;
  }
  after() {
    this.apply(true);
  }
  async readStats() {
    const target = this.reductions[0];
    this.compute.dispatch(
      this.programs.count,
      [target],
      { states: this.states[this.stateParity] },
      this.uniforms(target),
    );
    // Start the reduction in the other texture to avoid feedback.
    this.reductions.reverse();
    try {
      this.reduce(target);
    } finally {
      this.reductions.reverse();
    }
    const data = await this.compute.read(this.summary);
    return { sleeping: data[2], wakeRequested: this.forceWake };
  }
  destroy() {
    if (this.destroyed) return;
    for (const p of Object.values(this.programs)) this.compute.release(p);
    for (const t of this.resources) this.compute.release(t);
    this.destroyed = true;
  }
}
