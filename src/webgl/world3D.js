import { GlStepTiming } from "./timing.js";
import { GlBroadphase } from "./broadphase.js";
import { GlNarrowphase } from "./narrowphase.js";
import { GlColoring } from "./coloring.js";
import { GlContactGraph3D } from "./contactGraph3D.js";
import { GlSolve3D } from "./solve3D.js";
import { GlBodyEdits } from "./bodyEdits.js";
import { GlRestitution } from "./restitution.js";
import { GlSleeping } from "./sleeping.js";
const boundsSource = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D position,properties,motion;uniform uint bodyCount,bodyWidth,propertiesWidth,motionWidth;
layout(location=0)out vec4 bounds;layout(location=1)out vec4 sizes;
ivec2 at(uint i,uint w){return ivec2(i%w,i/w);}
void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*bodyWidth;bounds=vec4(0.);sizes=vec4(0.);if(i>=bodyCount)return;
  vec4 s=texelFetch(properties,at(i*2u,propertiesWidth),0),m=texelFetch(properties,at(i*2u+1u,propertiesWidth),0);
  float kind=texelFetch(motion,at(i*2u+1u,motionWidth),0).w;
  bounds=vec4(texelFetch(position,at(i,bodyWidth),0).xyz,m.w+.02);sizes=vec4(s.xyz,kind==2.?0.:kind);
}`;
const outputs = {
  warmStartBodies: ["position", "rotation"],
  warmStartHistory: ["history"],
  warmStartJoints: ["joints"],
  solveBody: ["position", "rotation"],
  dualJoint: ["joints"],
  dualContact: ["contactPenalty", "contactLambda", "contactKeys"],
  updateVelocities: ["motion"],
};
const bodyGroups = {
  position: [0],
  rotation: [1],
  history: [2, 3, 6, 7],
  properties: [4, 5],
  motion: [8, 9],
};
export class GlWorld3D {
  static create(compute, options) {
    const w = new GlWorld3D(compute, options);
    try {
      const {
        contactMath,
        solveMath,
        colorCap = 32,
        colorRounds = 64,
      } = options;
      w.narrowphase = GlNarrowphase.create(compute, w.broadphase, {
        dimension: 3,
        math: contactMath,
      });
      w.coloring = GlColoring.create(compute, w.broadphase, {
        contactsPerPair: 8,
        jointAdjacency: w.jointAdjacency,
        jointInfo: w.inputs.jointInfo,
        colorCap,
        rounds: colorRounds,
        conservativeGraph: options.conservativeGraph ?? false,
      });
      w.graph = GlContactGraph3D.create(compute, w.broadphase, w.narrowphase, {
        jointAdjacency: w.jointAdjacency,
        jointCount: w.jointCount,
        jointEntries: w.jointEntries,
      });
      w.solve = GlSolve3D.create(compute, { math: solveMath });
      const n = w.narrowphase;
      for (const target of [w.inputs, w.spare]) {
        for (const name of ["contactPenalty", "contactLambda", "contactKeys"])
          target[name] = w.resource(
            compute.texture(n.width, n.height, name === "contactKeys"),
          );
        target.contactStatic = w.texture(n.slots * 2);
        target.manifoldIds = w.texture(n.slots / 8, true);
        target.manifoldGeo = w.texture(n.slots / 8);
      }
      w.boundsProgram = w.resource(compute.program(boundsSource));
      return w;
    } catch (error) {
      w.destroy();
      throw error;
    }
  }
  constructor(
    compute,
    {
      bodies,
      joints = new Float32Array(),
      info = new Int32Array(),
      filters,
      hulls,
      params = {},
      cellSize = 2,
      neighborCapacity = 30,
    },
  ) {
    if (
      !(bodies instanceof Float32Array) ||
      bodies.length % 40 ||
      !(joints instanceof Float32Array) ||
      joints.length % 32 ||
      info.length !== joints.length / 8
    )
      throw Error("Invalid 3D packed scene records");
    this.compute = compute;
    this.resources = [];
    this.inputs = {};
    this.spare = {};
    this.bodyCount = bodies.length / 40;
    this.jointCount = joints.length / 32;
    this.stepCount = 0;
    this.initialMasses = Float32Array.from(
      { length: this.bodyCount },
      (_, i) => bodies[i * 40 + 19],
    );
    this.params = {
      dt: 1 / 60,
      gravity: -9.81,
      betaLin: 1e5,
      betaAng: 1e5,
      gamma: 0.9,
      alpha: 0.9,
      iterations: 10,
      flags: 26,
      wind: [0, 0, 0, 0],
      gust: [0, 0, 0, 0],
      up: [0, 1, 0, 0],
      ...params,
      bodyCount: this.bodyCount,
      jointCount: this.jointCount,
      adjListOffset: this.bodyCount + 1,
      step: 0,
    };
    try {
      const b = (this.broadphase = new GlBroadphase(compute, {
        bodyCount: this.bodyCount,
        dimension: 3,
        cellSize,
        neighborCapacity,
      }));
      for (const [name, fields] of Object.entries(bodyGroups)) {
        const data = Float32Array.from(
          { length: this.bodyCount * fields.length * 4 },
          (_, i) =>
            bodies[
              Math.floor(i / (fields.length * 4)) * 40 +
                fields[Math.floor((i % (fields.length * 4)) / 4)] * 4 +
                (i % 4)
            ],
        );
        if (fields.length === 1) {
          const padded = new Float32Array(b.capacity * 4);
          padded.set(data);
          this.inputs[name] = this.resource(
            compute.texture(b.width, b.height, false, padded),
          );
          this.spare[name] = this.resource(compute.texture(b.width, b.height));
        } else {
          this.inputs[name] = this.texture(
            this.bodyCount * fields.length,
            false,
            data,
          );
          this.spare[name] = this.texture(this.bodyCount * fields.length);
        }
      }
      this.inputs.joints = this.texture(this.jointCount * 8, false, joints);
      this.spare.joints = this.texture(this.jointCount * 8);
      this.inputs.jointInfo = this.texture(
        this.jointCount,
        true,
        new Uint32Array(info.buffer, info.byteOffset, info.length),
      );
      const lists = Array.from({ length: this.bodyCount }, () => []);
      for (let i = 0; i < this.jointCount; i++)
        if (info[i * 4])
          for (const id of [info[i * 4 + 1], info[i * 4 + 2]])
            if (id >= 0 && id < this.bodyCount) lists[id].push(i);
      const starts = [0];
      for (const list of lists) starts.push(starts.at(-1) + list.length);
      this.jointEntries = starts.at(-1);
      this.jointAdjacency = this.texture(
        Math.ceil((starts.length + this.jointEntries) / 4),
        true,
        new Uint32Array([...starts, ...lists.flat()]),
      );
      const f = new Uint32Array(b.capacity * 4);
      for (let i = 0; i < this.bodyCount; i++)
        f.set(
          filters?.subarray(i * 4, i * 4 + 4) ?? [
            0xffffffff,
            0xffffffff,
            bodies[i * 40 + 19] > 0 ? 1 : 0,
            0,
          ],
          i * 4,
        );
      this.inputs.filters = this.resource(
        compute.texture(b.width, b.height, true, f),
      );
      this.bounds = this.resource(compute.texture(b.width, b.height));
      this.collisionSizes = this.resource(compute.texture(b.width, b.height));
      this.geometry = this.texture(1, false, new Float32Array(4));
      if (hulls) this.hulls = this.texture(hulls.length / 4, true, hulls);
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  resource(r) {
    this.resources.push(r);
    return r;
  }
  texture(slots, integer = false, data) {
    const c = this.compute,
      width = Math.min(
        c.maxTextureSize,
        Math.max(1, Math.ceil(Math.sqrt(slots))),
      ),
      height = Math.max(1, Math.ceil(slots / width));
    let padded;
    if (data) {
      padded = integer
        ? new Uint32Array(width * height * 4)
        : new Float32Array(width * height * 4);
      padded.set(data);
    }
    return this.resource(c.texture(width, height, integer, padded));
  }
  swap(names) {
    for (const name of names)
      [this.inputs[name], this.spare[name]] = [
        this.spare[name],
        this.inputs[name],
      ];
  }
  prepareEdits(math) {
    if (!this.edits)
      this.edits = GlBodyEdits.create(this.compute, this.broadphase, 3, math);
    return this;
  }
  prepareRestitution(math) {
    if (!this.restitution)
      this.restitution = GlRestitution.create(this, 3, math);
    return this.restitution;
  }
  enableSleeping(options) {
    if (!this.sleeping) this.sleeping = GlSleeping.create(this, 3, options);
    return this.sleeping;
  }
  applyCommands(staging) {
    if (!this.edits) throw Error("Prepare the body edit shaders first");
    this.sleeping?.wakeNow();
    this.edits.dispatch(staging, this.inputs, this.spare);
    return this;
  }
  run(stage, swap = true, color = 0) {
    this.solve.dispatch(stage, this.inputs, this.spare, {
      params: this.params,
      pass: { color, alpha: this.params.alpha },
      manifoldCount: this.narrowphase.slots / 8,
      guarded: true,
      bodyCapacity: this.broadphase.capacity,
    });
    if (swap) this.swap(outputs[stage]);
  }
  prepareCandidates() {
    const c = this.compute,
      b = this.broadphase;
    c.dispatch(
      this.boundsProgram,
      [this.bounds, this.collisionSizes],
      {
        position: this.inputs.position,
        properties: this.inputs.properties,
        motion: this.inputs.motion,
      },
      {
        bodyCount: ["uniform1ui", this.bodyCount],
        bodyWidth: ["uniform1ui", b.width],
        propertiesWidth: ["uniform1ui", this.inputs.properties.width],
        motionWidth: ["uniform1ui", this.inputs.motion.width],
      },
    );
    b.dispatch(this.bounds, this.inputs.filters, {
      jointAdjacency: this.jointAdjacency,
      jointInfo: this.inputs.jointInfo,
      jointMaterials: this.inputs.joints,
    });
  }
  step() {
    if (this.destroyed) throw Error("WebGL2 3D world has been destroyed");
    const callback = this.nextProfile;
    this.nextProfile = null;
    if (callback) {
      this.timing ??= new GlStepTiming(this.compute);
      this.timing.begin("collision");
    }
    const c = this.compute,
      b = this.broadphase,
      p = this.params;
    p.step = this.stepCount + 1;
    if (
      typeof p.startAtRest === "boolean" ||
      typeof p.massPenalty === "boolean"
    )
      p.flags =
        (p.matchNearest ? 1 : 0) |
        (p.faceBias ? 2 : 0) |
        (p.reuseContacts ? 4 : 0) |
        (p.startAtRest ? 8 : 0) |
        (p.massPenalty ? 16 : 0);
    this.prepareCandidates();
    this.narrowphase.dispatch({
      poses: this.inputs.position,
      rotations: this.inputs.rotation,
      sizes: this.collisionSizes,
      geometry: this.geometry,
      hulls: this.hulls,
    });
    if (callback) {
      this.timing.end();
      this.timing.begin("coloring");
    }
    this.sleeping?.before();
    this.inputs.colors = this.coloring.dispatch(
      this.inputs.filters,
      this.narrowphase.outputs[3],
    );
    if (callback) {
      this.timing.end();
      this.timing.begin("adjacency");
    }
    this.inputs.adjacency = this.graph.dispatch(
      { ...this.inputs, pose: this.inputs.position },
      this.spare,
      p,
    );
    this.swap([
      "contactStatic",
      "contactPenalty",
      "contactLambda",
      "contactKeys",
      "manifoldIds",
      "manifoldGeo",
    ]);
    if (callback) {
      this.timing.end();
      this.timing.begin("solve");
    }
    this.restitution?.before();
    if (this.jointCount) this.run("warmStartJoints");
    this.run("warmStartBodies", false);
    this.run("warmStartHistory", false);
    this.swap(["position", "rotation", "history"]);
    for (let i = 0; i < p.iterations; i++) {
      for (let col = 0; col < this.coloring.colorCap; col++)
        this.run("solveBody", true, col);
      if (this.jointCount) this.run("dualJoint");
      this.run("dualContact");
    }
    this.run("updateVelocities");
    this.restitution?.after();
    this.sleeping?.after();
    this.stepCount++;
    if (callback) {
      this.timing.end();
      this.timing.finish(callback);
    }
  }
  async readBodies() {
    const result = new Float32Array(this.bodyCount * 40);
    await Promise.all(
      Object.entries(bodyGroups).map(async ([name, fields]) => {
        const data = await this.compute.read(this.inputs[name]);
        for (let i = 0; i < this.bodyCount; i++)
          for (let j = 0; j < fields.length; j++)
            result.set(
              data.subarray(
                (i * fields.length + j) * 4,
                (i * fields.length + j + 1) * 4,
              ),
              i * 40 + fields[j] * 4,
            );
      }),
    );
    return result;
  }
  async readStatus() {
    const data = await this.compute.read(this.coloring.published);
    return {
      problems: data[this.broadphase.capacity * 4],
      colors: data[this.broadphase.capacity * 4 + 1],
    };
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const name of [
      "timing",
      "sleeping",
      "restitution",
      "edits",
      "solve",
      "graph",
      "coloring",
      "narrowphase",
      "broadphase",
    ])
      this[name]?.destroy();
    for (const r of this.resources ?? []) this.compute.release(r);
    this.resources = [];
  }
}
