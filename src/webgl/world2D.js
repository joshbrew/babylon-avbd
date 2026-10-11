import { GlStepTiming } from "./timing.js";
import { GlBroadphase } from "./broadphase.js";
import { GlNarrowphase } from "./narrowphase.js";
import { GlColoring } from "./coloring.js";
import { GlSolve2D } from "./solve2D.js";
import { GlContactGraph2D } from "./contactGraph2D.js";
import { GlBodyEdits } from "./bodyEdits.js";
import { GlRestitution } from "./restitution.js";
import { GlSleeping } from "./sleeping.js";

const boundSource = `#version 300 es
precision highp float;precision highp int;precision highp sampler2D;
uniform sampler2D pose,shape,geometry;uniform uint bodyCount,bodyWidth,geometryWidth;
layout(location=0)out vec4 result;
void main(){uint i=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*bodyWidth;result=vec4(0.);if(i>=bodyCount)return;
  ivec2 uv=ivec2(i%bodyWidth,i/bodyWidth);vec4 p=texelFetch(pose,uv,0),s=texelFetch(shape,uv,0);
  vec4 g=texelFetch(geometry,ivec2(i%geometryWidth,i/geometryWidth),0);
  float radius=g.x==0.?length(s.xy)*.5:g.x==3.?1.e15:g.x==4.?g.y:g.y+g.z;
  result=vec4(p.xy,0.,radius+.001);
}`;
const bodyFields = {
  pose: 0,
  initial: 1,
  inertial: 2,
  velocity: 3,
  previousVelocity: 4,
  shape: 5,
};
const jointFields = {
  jointPenalty: 0,
  jointLambda: 1,
  jointStiffness: 2,
  jointInitial: 6,
};
const stageOutputs = {
  warmStartBodies: ["pose", "initial", "inertial", "velocity"],
  warmStartJoints: [
    "jointPenalty",
    "jointLambda",
    "jointInitial",
    "jointStiffness",
  ],
  solveBody: ["pose"],
  dualJoint: ["jointPenalty", "jointLambda", "jointInitial", "jointStiffness"],
  dualContact: ["contactPenalty", "contactIds"],
  refreshStick: ["contactPenalty", "contactIds"],
  updateVelocities: ["velocity", "previousVelocity"],
};

/** Complete internal GPU step: collision detection, cached contacts, CSR,
 * graph coloring, AVBD iterations and velocities. State stays on WebGL2. */
export class GlWorld2D {
  static create(
    compute,
    {
      bodies,
      joints = new Float32Array(),
      info = new Int32Array(),
      geometry,
      filters,
      params = {},
      contactMath,
      solveMath,
      editMath,
      ...options
    },
  ) {
    const world = new GlWorld2D(compute, {
      bodies,
      joints,
      info,
      geometry,
      filters,
      params,
      ...options,
    });
    try {
      world.narrowphase = GlNarrowphase.create(compute, world.broadphase, {
        dimension: 2,
        math: contactMath,
      });
      world.coloring = GlColoring.create(compute, world.broadphase, {
        contactsPerPair: 2,
        jointAdjacency: world.jointAdjacency,
        jointInfo: world.inputs.jointInfo,
        colorCap: options.colorCap ?? 32,
        rounds: options.colorRounds ?? 64,
        conservativeGraph: options.conservativeGraph ?? false,
      });
      world.graph = GlContactGraph2D.create(
        compute,
        world.broadphase,
        world.narrowphase,
        {
          jointAdjacency: world.jointAdjacency,
          jointCount: world.jointCount,
          jointEntries: world.jointEntries,
        },
      );
      world.solve = GlSolve2D.create(compute, { math: solveMath });
      const n = world.narrowphase;
      for (const name of ["contactPenalty", "contactIds"]) {
        world.inputs[name] = world.resource(
          compute.texture(n.width, n.height, name === "contactIds"),
        );
        world.spare[name] = world.resource(
          compute.texture(n.width, n.height, name === "contactIds"),
        );
      }
      for (const target of [world.inputs, world.spare])
        target.contactStatic = world.texture(n.slots * 3);
      world.boundProgram = world.resource(compute.program(boundSource));
      if (editMath)
        world.edits = GlBodyEdits.create(
          compute,
          world.broadphase,
          2,
          editMath,
        );
      return world;
    } catch (error) {
      world.destroy();
      throw error;
    }
  }
  constructor(
    compute,
    {
      bodies,
      joints,
      info,
      geometry,
      filters,
      params,
      cellSize = 2,
      neighborCapacity = 30,
      ignoredPairs = [],
    },
  ) {
    if (
      !(bodies instanceof Float32Array) ||
      bodies.length % 24 ||
      !(joints instanceof Float32Array) ||
      joints.length % 36 ||
      info.length !== joints.length / 9
    )
      throw Error("Invalid WebGL2 packed scene records");
    this.compute = compute;
    this.bodyCount = bodies.length / 24;
    this.jointCount = joints.length / 36;
    this.params = {
      dt: 1 / 60,
      gravity: -9.81,
      beta: 10000,
      gamma: 0.9,
      alpha: 0.9,
      vbdStiffness: 1e6,
      iterations: 10,
      flags: 2,
      ...params,
      bodyCount: this.bodyCount,
      jointCount: this.jointCount,
      adjListOffset: this.bodyCount + 1,
    };
    this.resources = [];
    this.inputs = {};
    this.spare = {};
    this.stepCount = 0;
    this.initialMasses = Float32Array.from(
      { length: this.bodyCount },
      (_, i) => bodies[i * 24 + 22],
    );
    try {
      const b = (this.broadphase = new GlBroadphase(compute, {
        bodyCount: this.bodyCount,
        dimension: 2,
        cellSize,
        neighborCapacity,
      }));
      const field = (array, count, stride, index) =>
        Float32Array.from(
          { length: count * 4 },
          (_, i) => array[Math.floor(i / 4) * stride + index * 4 + (i % 4)],
        );
      for (const [name, index] of Object.entries(bodyFields)) {
        const data = new Float32Array(b.capacity * 4);
        data.set(field(bodies, this.bodyCount, 24, index));
        this.inputs[name] = this.resource(
          compute.texture(b.width, b.height, false, data),
        );
        this.spare[name] = this.resource(compute.texture(b.width, b.height));
      }
      for (const [name, index] of Object.entries(jointFields)) {
        const data = field(joints, this.jointCount, 36, index);
        this.inputs[name] = this.texture(this.jointCount, false, data);
        this.spare[name] = this.texture(this.jointCount);
      }
      this.inputs.jointStatic = this.texture(
        this.jointCount * 5,
        false,
        Float32Array.from(
          { length: this.jointCount * 20 },
          (_, i) =>
            joints[
              Math.floor(i / 20) * 36 +
                [3, 4, 5, 7, 8][Math.floor((i % 20) / 4)] * 4 +
                (i % 4)
            ],
        ),
      );
      this.spare.jointStatic = this.texture(this.jointCount * 5);
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
      // Explicit collision exclusions are separate from forces: they must not
      // enter the solver's adjacency or consume a constraint slot.
      if (ignoredPairs.length) {
        const collisionInfo = new Int32Array(
          (this.jointCount + ignoredPairs.length) * 4,
        );
        collisionInfo.set(info);
        const collisionLists = lists.map((list) => [...list]);
        ignoredPairs.forEach((key, k) => {
          const a = Math.floor(key / 2 ** 21),
            b = key % 2 ** 21,
            slot = this.jointCount + k;
          collisionInfo.set([-1, a, b, 0], slot * 4);
          collisionLists[a].push(slot);
          collisionLists[b].push(slot);
        });
        const offsets = [0];
        for (const list of collisionLists)
          offsets.push(offsets.at(-1) + list.length);
        this.collisionAdjacency = this.texture(
          Math.ceil((offsets.length + offsets.at(-1)) / 4),
          true,
          new Uint32Array([...offsets, ...collisionLists.flat()]),
        );
        this.collisionInfo = this.texture(
          this.jointCount + ignoredPairs.length,
          true,
          new Uint32Array(collisionInfo.buffer),
        );
      }
      const f = new Uint32Array(b.capacity * 4);
      for (let i = 0; i < this.bodyCount; i++)
        f.set(
          filters?.subarray(i * 4, i * 4 + 4) ?? [
            0xffffffff,
            0xffffffff,
            bodies[i * 24 + 22] > 0 ? 1 : 0,
            0,
          ],
          i * 4,
        );
      this.inputs.filters = this.resource(
        compute.texture(b.width, b.height, true, f),
      );
      const g = geometry ?? new Float32Array(this.bodyCount * 4);
      if (g.length < this.bodyCount * 4 || g.length % 4)
        throw Error("Invalid WebGL2 shape geometry");
      this.inputs.geometry = this.texture(g.length / 4, false, g);
      this.bounds = this.resource(compute.texture(b.width, b.height));
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  resource(t) {
    this.resources.push(t);
    return t;
  }
  texture(slots, integer = false, data) {
    const c = this.compute,
      w = Math.min(c.maxTextureSize, Math.max(1, Math.ceil(Math.sqrt(slots)))),
      h = Math.max(1, Math.ceil(slots / w));
    let padded;
    if (data) {
      padded = integer
        ? new Uint32Array(w * h * 4)
        : new Float32Array(w * h * 4);
      padded.set(data);
    }
    return this.resource(c.texture(w, h, integer, padded));
  }
  run(stage, alpha = this.params.vbd ? 0 : this.params.alpha, color = 0) {
    this.solve.dispatch(stage, this.inputs, this.spare, {
      params: this.params,
      pass: { alpha, color },
      contactCount: this.narrowphase.slots,
      guarded: true,
      bodyCapacity: this.broadphase.capacity,
    });
    for (const name of stageOutputs[stage])
      [this.inputs[name], this.spare[name]] = [
        this.spare[name],
        this.inputs[name],
      ];
  }
  applyCommands(staging) {
    if (!this.edits) throw Error("Body edit shaders are required");
    this.sleeping?.wakeNow();
    this.edits.dispatch(staging, this.inputs, this.spare);
    return this;
  }
  prepareRestitution(math) {
    if (!this.restitution)
      this.restitution = GlRestitution.create(this, 2, math);
    return this.restitution;
  }
  enableSleeping(options) {
    if (!this.sleeping) this.sleeping = GlSleeping.create(this, 2, options);
    return this.sleeping;
  }
  prepareCandidates() {
    const c = this.compute,
      b = this.broadphase;
    c.dispatch(
      this.boundProgram,
      [this.bounds],
      {
        pose: this.inputs.pose,
        shape: this.inputs.shape,
        geometry: this.inputs.geometry,
      },
      {
        bodyCount: ["uniform1ui", this.bodyCount],
        bodyWidth: ["uniform1ui", b.width],
        geometryWidth: ["uniform1ui", this.inputs.geometry.width],
      },
    );
    b.dispatch(this.bounds, this.inputs.filters, {
      jointAdjacency: this.collisionAdjacency ?? this.jointAdjacency,
      jointInfo: this.collisionInfo ?? this.inputs.jointInfo,
      jointMaterials: this.inputs.jointStiffness,
    });
  }
  step() {
    if (this.destroyed) throw Error("WebGL2 world has been destroyed");
    const callback = this.nextProfile;
    this.nextProfile = null;
    if (callback) {
      this.timing ??= new GlStepTiming(this.compute);
      this.timing.begin("collision");
    }
    const c = this.compute,
      b = this.broadphase,
      p = this.params;
    if (
      typeof p.vbd === "boolean" ||
      typeof p.stiffnessRescale === "boolean" ||
      typeof p.postStabilize === "boolean" ||
      typeof p.matchNearest === "boolean"
    )
      p.flags =
        (p.vbd ? 1 : 0) |
        (p.stiffnessRescale ? 2 : 0) |
        (p.postStabilize && !p.vbd ? 4 : 0) |
        (p.matchNearest ? 8 : 0);
    this.prepareCandidates();
    this.narrowphase.dispatch({
      poses: this.inputs.pose,
      rotations: this.inputs.initial,
      sizes: this.inputs.shape,
      geometry: this.inputs.geometry,
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
      this.inputs,
      this.spare,
      p.vbd ? { ...p, alpha: 0 } : p,
    );
    for (const name of ["contactStatic", "contactPenalty", "contactIds"])
      [this.inputs[name], this.spare[name]] = [
        this.spare[name],
        this.inputs[name],
      ];
    if (callback) {
      this.timing.end();
      this.timing.begin("solve");
    }
    this.restitution?.before();
    if (this.jointCount) this.run("warmStartJoints");
    this.run("warmStartBodies");
    const post = (p.flags & 4) !== 0,
      total = p.iterations + (post ? 1 : 0);
    for (let i = 0; i < total; i++) {
      const alpha = post ? (i < p.iterations ? 1 : 0) : p.vbd ? 0 : p.alpha;
      for (let col = 0; col < this.coloring.colorCap; col++)
        this.run("solveBody", alpha, col);
      if (i < p.iterations) {
        if (this.jointCount) this.run("dualJoint", alpha);
        this.run("dualContact", alpha);
      }
      if (i === p.iterations - 1) this.run("updateVelocities");
    }
    if (post) this.run("refreshStick", 0);
    this.restitution?.after();
    this.sleeping?.after();
    this.stepCount++;
    if (callback) {
      this.timing.end();
      this.timing.finish(callback);
    }
  }
  async readBodies() {
    const result = new Float32Array(this.bodyCount * 24);
    await Promise.all(
      Object.entries(bodyFields).map(async ([name, index]) => {
        const data = await this.compute.read(this.inputs[name]);
        for (let i = 0; i < this.bodyCount; i++)
          result.set(data.subarray(i * 4, i * 4 + 4), i * 24 + index * 4);
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
