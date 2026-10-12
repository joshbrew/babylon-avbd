import shader from "./damage.wgsl";
import { CS, STIFF } from "../../reference/three-avbd/src/avbd2d/soa/solver.ts";

/** Game health stays on the GPU; only the score is downloaded periodically. */
export class SiegeDamage {
  constructor(gpu, built, renderer) {
    Object.assign(this, { gpu, built, renderer, armed: false });
    this.capacity = gpu.bodyCapacity ?? gpu.bodyCount + 64;
    this.words = new Uint32Array(this.capacity * 4);
    for (let i = 0; i < this.capacity; i++) this.words[i * 4 + 1] = i;
    for (const i of built.bricks) this.words[i * 4 + 2] = 1;
    for (const i of built.targets) this.words[i * 4 + 2] = 2;
    for (const parts of built.ragdolls) {
      const owner = parts.find((i) => built.targets.includes(i));
      for (const i of parts) {
        this.words[i * 4 + 1] = owner;
        this.words[i * 4 + 2] = 2;
      }
    }
    this.resources = [];
    this.latestTargets = built.targets.map((id) => ({ id, health: 1 }));
    if (!gpu.bodyBuffer) {
      this.installCpu();
      return;
    }
    const d = gpu.device;
    const buffer = (size, usage) => {
      const b = d.createBuffer({ size, usage });
      this.resources.push(b);
      return b;
    };
    const storage =
      GPUBufferUsage.STORAGE |
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC;
    this.health = buffer(this.words.byteLength, storage);
    d.queue.writeBuffer(this.health, 0, this.words);
    this.loads = buffer(gpu.bodyCapacity * 4, storage);
    this.incoming = buffer(gpu.bodyCapacity * 16, storage);
    this.config = buffer(32, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    const module = d.createShaderModule({
      label: "Siege impact and crushing damage",
      code: shader,
    });
    this.pipelines = Object.fromEntries(
      ["capture", "accumulate", "removeBodies", "removeJoints"].map(
        (entryPoint) => [
          entryPoint,
          d.createComputePipeline({
            layout: "auto",
            compute: { module, entryPoint },
          }),
        ],
      ),
    );
    this.previousBefore = gpu.externalBeforeStep;
    this.previousAfter = gpu.externalAfterStep;
    this.before = (encoder) => {
      this.previousBefore?.(encoder);
      this.configure();
      this.dispatch(encoder, "capture");
    };
    this.after = (encoder) => {
      this.previousAfter?.(encoder);
      this.dispatch(encoder, "accumulate");
      this.dispatch(encoder, "removeBodies");
      this.dispatch(encoder, "removeJoints");
    };
    gpu.externalBeforeStep = this.before;
    gpu.externalAfterStep = this.after;
    renderer.dynamicColors = true;
  }
  /** Begin damage accounting when play starts, keeping setup/settling out of the score. */
  arm() {
    this.armed = true;
  }
  configure() {
    const g = this.gpu,
      values = [
        g.bodyCount,
        g.jointCount,
        g.contactCapacity,
        2 * g.bodyCapacity + 1,
        g.params.dt,
        Number(this.armed),
      ];
    const key = values.join("/");
    if (key === this.configKey) return;
    this.configKey = key;
    const bytes = new ArrayBuffer(32),
      u = new Uint32Array(bytes);
    u.set(values.slice(0, 4));
    new Float32Array(bytes)[4] = values[4];
    u[5] = values[5];
    g.device.queue.writeBuffer(this.config, 0, bytes);
  }
  dispatch(encoder, name) {
    const g = this.gpu;
    const all = [
      this.config,
      g.bodyBuffer,
      g.contactBuffers[1 - g.parity],
      g.adjBuffer,
      this.health,
      this.loads,
      this.incoming,
      g.counterBuffer,
      g.filters,
      this.renderer.colors,
      g.jointBuffer,
      g.infoBuffer,
    ];
    const indices = {
      capture: [0, 1, 6],
      accumulate: [0, 1, 2, 3, 4, 5, 6, 7],
      removeBodies: [0, 1, 4, 8, 9],
      removeJoints: [0, 4, 10, 11],
    }[name];
    const selected = indices.map((i) => all[i]);
    this.groups ??= {};
    let cached = this.groups[name];
    if (!cached || selected.some((b, i) => b !== cached.buffers[i])) {
      cached = this.groups[name] = {
        buffers: selected,
        group: g.device.createBindGroup({
          layout: this.pipelines[name].getBindGroupLayout(0),
          entries: indices.map((i) => ({
            binding: i,
            resource: { buffer: all[i] },
          })),
        }),
      };
    }
    const pass = encoder.beginComputePass({ label: `Siege damage ${name}` });
    pass.setPipeline(this.pipelines[name]);
    pass.setBindGroup(0, cached.group);
    pass.dispatchWorkgroups(
      Math.ceil((name === "removeJoints" ? g.jointCount : g.bodyCount) / 64),
    );
    pass.end();
  }
  async read() {
    if (this.health)
      this.words = new Uint32Array(
        await this.gpu.read(this.health, this.words.byteLength),
      );
    const health = (id) =>
      Math.max(0, 1 - this.words[this.words[id * 4 + 1] * 4] / 65536);
    this.latestTargets = this.built.targets.map((id) => ({
      id,
      health: health(id),
    }));
    return {
      targets: this.latestTargets,
      destroyedBricks: this.built.bricks.filter((id) => health(id) === 0)
        .length,
    };
  }
  installCpu() {
    const g = this.gpu,
      s = g.solver;
    this.baseline = new Float32Array(this.capacity);
    this.removed = new Set();
    this.originalStep = g.step;
    g.step = (...args) => {
      const incoming = s.velocity.slice();
      const result = this.originalStep.apply(g, args);
      const forces = new Float32Array(this.capacity),
        energy = new Float32Array(this.capacity);
      for (const c of s.contactPairs) {
        if (s.sensors.has(c.a) || s.sensors.has(c.b)) continue;
        const closing = Math.max(
          0,
          -(
            (incoming[c.a * 4] - incoming[c.b * 4]) * c.n[0] +
            (incoming[c.a * 4 + 1] - incoming[c.b * 4 + 1]) * c.n[1]
          ) - 2.5,
        );
        for (const i of [c.a, c.b]) {
          forces[i] += c.impulse / g.params.dt;
          energy[i] +=
            (c.impulse * closing) / Math.max(s.shape[i * 4 + 2], 1e-6);
        }
      }
      for (let i = 0; i < g.bodyCount; i++) {
        const o = i * 4,
          kind = this.words[o + 2];
        if (!kind || this.removed.has(i)) continue;
        if (!this.armed) {
          this.baseline[i] = Math.max(this.baseline[i], forces[i]);
          continue;
        }
        const mass = Math.max(s.shape[i * 4 + 2], 1e-6),
          enemy = kind === 2;
        const lost = Math.min(
          1,
          energy[i] / (enemy ? 12 : 70) +
            (Math.max(
              0,
              forces[i] - this.baseline[i] - mass * (enemy ? 80 : 200),
            ) *
              g.params.dt) /
              (mass * (enemy ? 40 : 160)) +
            (s.pose[i * 4 + 1] < -10 ? 1 : 0),
        );
        if (lost > 0)
          this.words[this.words[o + 1] * 4] += Math.ceil(lost * 65536);
      }
      const removed = [];
      for (let i = 0; i < g.bodyCount; i++) {
        if (
          !this.words[i * 4 + 2] ||
          this.removed.has(i) ||
          this.words[this.words[i * 4 + 1] * 4] < 65536
        )
          continue;
        this.removed.add(i);
        removed.push(i);
        s.shape[i * 4 + 2] = 0;
        s.shape[i * 4 + 3] = 0;
        s.dynamic[i] = 0;
        s.velocity.fill(0, i * 4, i * 4 + 4);
        this.renderer.setColor(i, [0, 0, 0, 0]);
      }
      if (removed.length) {
        g.setFilters(
          removed,
          removed.map(() => 0),
          removed.map(() => 0),
        );
        for (let j = 0; j < s.jointCount; j++)
          if (
            this.removed.has(s.info[j * 4 + 1]) ||
            this.removed.has(s.info[j * 4 + 2])
          ) {
            s.data.fill(0, j * CS + STIFF, j * CS + STIFF + 3);
            g.disableConstraint(j);
          }
      }
      return result;
    };
  }
  destroy() {
    const g = this.gpu;
    if (this.before && g.externalBeforeStep === this.before)
      g.externalBeforeStep = this.previousBefore;
    if (this.after && g.externalAfterStep === this.after)
      g.externalAfterStep = this.previousAfter;
    if (this.originalStep) g.step = this.originalStep;
    for (const b of this.resources) b.destroy();
  }
}
