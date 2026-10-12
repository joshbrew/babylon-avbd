import { GaltonFeed } from "../../galton-board/feed.js";
import shader from "./forces.wgsl";
import { addGpuStepPass } from "../../../src/utils/gpuStepPass.js";

/** Demo force fields and actions share the solver's command buffer and poses. */
export class PlayPhysics {
  constructor(device, built, gpu) {
    this.built = built;
    this.play = built.play;
    this.gpu = gpu;
    this.device = device;
    this.time = 0;
    this.active = false;
    this.shake = false;
    this.hideDust = false;
    this.opened = false;
    // Spatial sorting can reorder bodies on upload. Resolve reference handles
    // to GPU slots once; kernels and edit APIs address those live slots.
    const indices = new Map(
      built.solver.bodies.map((b, i) => [b, gpu.gpuIndex(i)]),
    );
    this.index = (b) => indices.get(b);
    this.feeder = built.play.feed
      ? new GaltonFeed(device, built, gpu, this.index)
      : null;
    this.data = new Float32Array(gpu.bodyCount * 4);
    const dust = new Map(this.play.dust.map((b, i) => [b, i + 1])),
      marbles = new Set(this.play.marbles);
    built.solver.bodies.forEach((b) => {
      const area = Math.max(
        b.size[0] * b.size[1],
        b.size[0] * b.size[2],
        b.size[1] * b.size[2],
      );
      this.data.set(
        [dust.get(b) ?? 0, marbles.has(b) ? 1 : 0, area, 0],
        this.index(b) * 4,
      );
    });
    if (!gpu.bodyBuffer) {
      this.originalStep = gpu.step;
      gpu.step = (...args) => {
        this.feeder?.cpuStep();
        this.cpuForces();
        return this.originalStep.apply(gpu, args);
      };
      return;
    }
    this.metadata = device.createBuffer({
      size: this.data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(this.metadata, 0, this.data);
    this.uniform = device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.settings = new Float32Array(8);
    this.pipeline = device.createComputePipeline({
      layout: "auto",
      compute: {
        module: device.createShaderModule({
          label: "Playground wind and marble shake",
          code: shader,
        }),
        entryPoint: "forces",
      },
    });
    this.group = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: gpu.bodyBuffer } },
        { binding: 1, resource: { buffer: this.metadata } },
        { binding: 2, resource: { buffer: this.uniform } },
      ],
    });
    this.before = (encoder) => {
      this.feeder?.encode(encoder);
      this.encode(encoder);
    };
    // Register on this world only. The returned remover is part of disposal,
    // so restarting a scene cannot leave its force field installed.
    this.removeGpuPass = addGpuStepPass(gpu, { before: this.before });
  }
  storm() {
    return [-31 + ((this.time * 3.5) % 62), 10 * Math.sin(this.time * 0.42)];
  }
  action(id = "start") {
    if (id === "restore-pegs") {
      this.pegs?.restore();
      return;
    }
    if (!this.play.actions.some((a) => a.id === id))
      throw Error("Unknown playground action");
    this.gpu.wakeAll?.();
    if (this.play.kind === "3d-tornado-town") {
      this.active = id === "start";
      this.hideDust = !this.active;
      if (this.active) this.time = 0;
    } else if (this.play.kind === "3d-domino-spiral") {
      const first = this.play.dominos[0];
      this.gpu.applyImpulse(this.index(first), [0, 0.65, 0], [2, 0, 1.3]);
    } else if (id === "shake") this.shake = true;
    else if (!this.opened) {
      this.feeder?.start();
      this.gpu.releaseJoints([this.play.gateBond.slot]);
      this.gpu
        .teleport(this.index(this.play.gate), this.play.gateParking)
        .setLinearVelocity(this.index(this.play.gate), [0, 0, 0]);
      this.opened = true;
    }
  }
  encode(encoder) {
    if (!this.active && !this.shake && !this.hideDust) return;
    const dt = this.gpu.params.dt;
    this.settings.set([
      dt,
      this.time,
      +this.active,
      +this.shake,
      ...this.storm(),
      0,
      0,
    ]);
    this.device.queue.writeBuffer(this.uniform, 0, this.settings);
    const pass = encoder.beginComputePass({ label: "Playground forces" });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.group);
    pass.dispatchWorkgroups(Math.ceil(this.gpu.bodyCount / 64));
    pass.end();
    this.time += dt;
    this.shake = this.hideDust = false;
  }
  cpuForces() {
    if (!this.active && !this.shake && !this.hideDust) return;
    const dt = this.gpu.params.dt,
      [sx, sy] = this.storm();
    for (let i = 0; i < this.gpu.bodyCount; i++) {
      const b = this.gpu.solver.bodies[i],
        o = i * 4,
        grain = this.data[o];
      if (grain) {
        const z = 0.25 + ((grain - 1) / 128) * 15,
          r = 0.65 + z * 0.22,
          angle = (grain - 1) * 2.39996 - this.time * (4 - z * 0.12);
        b.positionLin.set(
          this.active
            ? [sx + Math.cos(angle) * r, sy + Math.sin(angle) * r, z]
            : [0, 0, -20],
        );
        continue;
      }
      if (!b.mass) continue;
      const velocity = Array.from(b.velocityLin);
      if (this.shake && this.data[o + 1]) {
        const angle = i * 2.39996;
        velocity[0] += Math.cos(angle) * 3;
        velocity[1] += Math.sin(angle) * 3;
        velocity[2] += 5;
      }
      if (this.active) {
        const dx = b.positionLin[0] - sx,
          dy = b.positionLin[1] - sy,
          r = Math.hypot(dx, dy),
          rx = dx / Math.max(r, 0.2),
          ry = dy / Math.max(r, 0.2);
        const falloff =
          Math.exp((-r * r) / 48) *
          Math.max(0, Math.min(1, 1 - b.positionLin[2] / 26));
        const rate =
          Math.max(
            0.1,
            Math.min(6, (this.data[o + 2] / Math.max(b.mass, 0.001)) * 0.7),
          ) * falloff;
        const flow = [-rx * 6 - ry * 19, -ry * 6 + rx * 19, 23],
          blend = 1 - Math.exp(-rate * dt);
        for (let k = 0; k < 3; k++)
          velocity[k] += (flow[k] - velocity[k]) * blend;
        this.gpu.setAngularVelocity(i, [
          b.velocityAng[0] + ry * falloff * dt * 3,
          b.velocityAng[1] - rx * falloff * dt * 3,
          b.velocityAng[2] + 0.6 * falloff * dt * 3,
        ]);
      }
      if (this.active || this.shake) this.gpu.setLinearVelocity(i, velocity);
    }
    if (this.active) this.time += dt;
    this.shake = this.hideDust = false;
  }
  destroy() {
    if (this.originalStep) this.gpu.step = this.originalStep;
    this.removeGpuPass?.();
    this.feeder?.destroy();
    this.metadata?.destroy();
    this.uniform?.destroy();
  }
}
