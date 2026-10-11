import shader from "./water.wgsl";
import renderShader from "./waterRender.wgsl";
import { GpuTimer } from "../../src/gpu/gpuTimer.js";
import { NAVAL_DT, NAVAL_GRID, NAVAL_SPAN, NAVAL_DEPTH } from "./scene.js";
import { seedConstraintColoring } from "../../src/gpu/constraintColoring.js";
import { addGpuStepPass } from "../../src/utils/gpuStepPass.js";

/** Demo-owned coupling. Nothing is installed on other solver instances. */
export class NavalWater {
  constructor(device, scene, gpu, renderer) {
    this.device = device;
    this.scene = scene;
    this.gpu = gpu;
    seedConstraintColoring(gpu, scene.world.ref);
    this.renderer = renderer;
    this.resources = [];
    this.tick = 0;
    this.sea = 0.18;
    this.auto = true;
    this.pendingFire = [false, false];
    this.round = [0, 0];
    this.ramUntil = [0, 0];
    this.timer = new GpuTimer(device);
    const index = (body) => gpu.gpuIndex(scene.world.bodies.indexOf(body));
    this.roots = scene.ships.map((ship) => index(ship.root));
    const metadata = new ArrayBuffer(scene.pieces.length * 32);
    const u = new Uint32Array(metadata),
      f = new Float32Array(metadata);
    const health = new Float32Array(scene.pieces.length * 4);
    scene.pieces.forEach((piece, i) => {
      u.set(
        [
          index(piece.body),
          piece.team,
          piece.bond?.slot ?? 0xffffffff,
          piece.root ? 1 : 0,
        ],
        i * 8,
      );
      f.set(
        [
          piece.volume,
          piece.waterThickness ?? 0,
          piece.health,
          piece.sailArea ?? 0,
        ],
        i * 8 + 4,
      );
      health[i * 4] = piece.health;
      health[i * 4 + 1] = piece.root ? 1 : 0;
    });
    this.metadata = this.buffer(new Uint8Array(metadata));
    this.states = this.buffer(health);
    this.drives = this.buffer(new Float32Array(8));
    const ammo = new Uint32Array(scene.projectiles.length * 12);
    scene.projectiles.forEach((body, i) =>
      ammo.set([index(body), i % 2, 0, 0], i * 12),
    );
    this.shots = this.buffer(ammo);
    this.settings = this.buffer(new Float32Array(16), GPUBufferUsage.UNIFORM);
    this.settingsData = new ArrayBuffer(64);
    this.uniform = new Float32Array(this.settingsData);
    this.uniformU = new Uint32Array(this.settingsData);
    const initial = new Float32Array(NAVAL_GRID ** 2 * 4);
    for (let y = 0; y < NAVAL_GRID; y++)
      for (let x = 0; x < NAVAL_GRID; x++) {
        const px = ((x + 0.5) / NAVAL_GRID - 0.5) * NAVAL_SPAN;
        const py = ((y + 0.5) / NAVAL_GRID - 0.5) * NAVAL_SPAN;
        const wave = Math.sin(px * 0.3 + py * 0.13) * this.sea;
        initial.set(
          [NAVAL_DEPTH + wave, wave * Math.sqrt(9.81 * NAVAL_DEPTH), 0, 0],
          (y * NAVAL_GRID + x) * 4,
        );
      }
    this.water = [this.buffer(initial), this.buffer(initial)];
    this.parity = 0;
    const module = device.createShaderModule({
      label: "Naval SWE, buoyancy and impact damage",
      code: shader,
    });
    this.pipelines = Object.fromEntries(
      ["waves", "cannons", "damage", "support", "helm", "buoyancy"].map(
        (entryPoint) => [
          entryPoint,
          device.createComputePipeline({
            label: `Naval ${entryPoint}`,
            layout: "auto",
            compute: { module, entryPoint },
          }),
        ],
      ),
    );
    // Auto layouts keep each kernel's resource set small enough for mobile devices.
    const bindingSets = {
      waves: [0, 4, 5, 6, 7],
      cannons: [0, 1, 4, 5, 7],
      damage: [0, 1, 2, 3, 4, 7, 8],
      support: [1, 2],
      helm: [0, 7, 9],
      buoyancy: [0, 1, 2, 5, 7, 9],
    };
    this.groups = [0, 1].map((parity) =>
      Object.fromEntries(
        Object.entries(bindingSets).map(([name, bindings]) => {
          const buffers = [
            gpu.bodyBuffer,
            this.metadata,
            this.states,
            gpu.jointBuffer,
            this.shots,
            this.water[parity],
            this.water[1 - parity],
            this.settings,
            gpu.filterBuffer,
            this.drives,
          ];
          return [
            name,
            device.createBindGroup({
              layout: this.pipelines[name].getBindGroupLayout(0),
              entries: bindings.map((binding) => ({
                binding,
                resource: { buffer: buffers[binding] },
              })),
            }),
          ];
        }),
      ),
    );
    const visualModule = device.createShaderModule({
      label: "Naval water and spray",
      code: renderShader,
    });
    const render = (vertex, fragment, blend) =>
      device.createRenderPipeline({
        layout: "auto",
        vertex: { module: visualModule, entryPoint: vertex },
        fragment: {
          module: visualModule,
          entryPoint: fragment,
          targets: [{ format: renderer.format, blend }],
        },
        primitive: { topology: "triangle-list", cullMode: "none" },
        multisample: { count: renderer.sampleCount },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: vertex === "waterVertex",
          depthCompare: "less-equal",
        },
      });
    const blend = {
      color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
      alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
    };
    this.waterPipeline = render("waterVertex", "waterFragment", blend);
    this.sprayPipeline = render("sprayVertex", "sprayFragment", blend);
    this.waterGroups = this.water.map((buffer) =>
      device.createBindGroup({
        layout: this.waterPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer } },
          { binding: 1, resource: { buffer: renderer.camera } },
          { binding: 2, resource: { buffer: this.settings } },
        ],
      }),
    );
    this.sprayGroup = device.createBindGroup({
      layout: this.sprayPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 1, resource: { buffer: renderer.camera } },
        { binding: 2, resource: { buffer: this.settings } },
        { binding: 3, resource: { buffer: this.shots } },
      ],
    });
    this.beforeStep = (encoder) => this.encode(encoder);
    this.removeGpuPass = addGpuStepPass(gpu, { before: this.beforeStep });
    renderer.drawEnvironment = (pass) => this.draw(pass);
    this.updateUniform();
  }
  buffer(data, usage = GPUBufferUsage.STORAGE) {
    const buffer = this.device.createBuffer({
      size: Math.max(4, data.byteLength),
      usage: usage | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint8Array(buffer.getMappedRange()).set(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    );
    buffer.unmap();
    this.resources.push(buffer);
    return buffer;
  }
  fire(team = 0) {
    if (team !== 0 && team !== 1) throw Error("Ship team must be 0 or 1");
    this.pendingFire[team] = true;
  }
  ram(team = 0) {
    if (team !== 0 && team !== 1) throw Error("Ship team must be 0 or 1");
    this.ramUntil[team] = this.tick + 8 / NAVAL_DT;
  }
  releaseHull(team = 1) {
    if (team !== 0 && team !== 1) throw Error("Ship team must be 0 or 1");
    this.gpu.releaseJoints(
      this.scene.ships[team].bonds.map((bond) => bond.slot),
    );
  }
  releaseSail(team = 1) {
    if (team !== 0 && team !== 1) throw Error("Ship team must be 0 or 1");
    this.gpu.releaseJoints(
      this.scene.ships[team].pieces
        .filter((piece) => piece.sailArea && piece.bond)
        .map((piece) => piece.bond.slot),
    );
  }
  updateUniform() {
    this.uniform.set([
      NAVAL_DT,
      this.tick * NAVAL_DT,
      this.tick,
      0,
      NAVAL_SPAN,
      NAVAL_DEPTH,
      this.sea,
      0,
    ]);
    this.uniformU.set([...this.roots, ...this.ramUntil], 8);
    const requests = this.pendingFire.map(Boolean);
    this.uniformU.set(
      [
        +requests[0],
        +requests[1],
        (this.round[0] % 8) * 2,
        (this.round[1] % 8) * 2 + 1,
      ],
      12,
    );
    requests.forEach((f, team) => {
      if (f) this.round[team]++;
    });
    this.pendingFire.fill(false);
    this.device.queue.writeBuffer(this.settings, 0, this.settingsData);
  }
  encode(encoder) {
    this.tick++;
    if (this.auto) {
      if (this.tick >= 360 && (this.tick - 360) % 300 === 0) this.fire(0);
      if (this.tick >= 450 && (this.tick - 450) % 420 === 0) this.fire(1);
    }
    this.updateUniform();
    const slot = this.timer.begin();
    const pass = encoder.beginComputePass(this.timer.descriptor(slot));
    const run = (name, x, y = 1) => {
      pass.setPipeline(this.pipelines[name]);
      pass.setBindGroup(0, this.groups[this.parity][name]);
      pass.dispatchWorkgroups(x, y);
    };
    run("cannons", 1);
    run("damage", Math.ceil(this.scene.pieces.length / 64));
    run("support", Math.ceil(this.scene.pieces.length / 64));
    run("waves", NAVAL_GRID / 8, NAVAL_GRID / 8);
    this.parity = 1 - this.parity;
    run("helm", 1);
    run("buoyancy", Math.ceil(this.scene.pieces.length / 64));
    pass.end();
    this.timer.encode(encoder, slot);
    // Called after the solver's command buffer has been submitted, never per body.
    if (slot) queueMicrotask(() => this.timer.resolve(slot));
  }
  draw(pass) {
    pass.setPipeline(this.waterPipeline);
    pass.setBindGroup(0, this.waterGroups[this.parity]);
    pass.draw((NAVAL_GRID - 1) ** 2 * 6);
    pass.setPipeline(this.sprayPipeline);
    pass.setBindGroup(0, this.sprayGroup);
    pass.draw(6, this.scene.projectiles.length * 20);
  }
  readState() {
    if (this.destroyed) return Promise.reject(Error("Naval water disposed"));
    // Concurrent status/snapshot requests share one coherent GPU snapshot.
    if (this.pendingRead) return this.pendingRead;
    const tick = this.tick,
      rounds = [...this.round];
    this.pendingRead = (async () => {
      const offset = this.states.size;
      const staging = (this.readback ??= this.device.createBuffer({
        label: "Naval status readback",
        size: offset + this.shots.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      }));
      try {
        const encoder = this.device.createCommandEncoder();
        encoder.copyBufferToBuffer(this.states, 0, staging, 0, offset);
        encoder.copyBufferToBuffer(
          this.shots,
          0,
          staging,
          offset,
          this.shots.size,
        );
        this.device.queue.submit([encoder.finish()]);
        const [, counters] = await Promise.all([
          staging.mapAsync(GPUMapMode.READ),
          this.gpu.readCounters(),
        ]);
        const data = new Float32Array(staging.getMappedRange());
        const state = data.slice(0, offset / 4),
          shots = data.slice(offset / 4);
        if (!this.destroyed) this.gpu.adapt(counters);
        return { state, shots, tick, rounds, counters };
      } finally {
        if (!this.destroyed) staging.unmap();
      }
    })().finally(() => {
      this.pendingRead = null;
    });
    return this.pendingRead;
  }
  destroy() {
    this.destroyed = true;
    this.removeGpuPass();
    this.renderer.drawEnvironment = null;
    this.timer.destroy();
    this.readback?.destroy();
    for (const buffer of this.resources) buffer.destroy();
  }
}
