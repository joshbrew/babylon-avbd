import { createSimulationSession } from "./simulationSession.js";
import { readStepRate } from "./stepRate.js";
import { physicsStepsPerFrame } from "./frameBudget.js";
import {
  castleAim,
  createCastleProjectile,
  createCastleBarrel,
} from "../../castle/scene.js";
import { createRookProjectile } from "../../rook-impact/scene.js";

const summary = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
    samples: values.length,
  };
};
/**
 * DOM-free live loop and benchmark driver shared by main-thread and worker views.
 * Live play follows elapsed time; benchmark() uses one measured step per frame.
 */
export class SimulationRuntime {
  constructor(canvas, config, notify = () => {}) {
    this.canvas = canvas;
    this.config = config;
    this.notify = notify;
    this.paused = !!config.paused;
    this.disposed = false;
    this.last = performance.now();
    this.accumulator = 0;
    this.inFlight = 0;
    this.frames = 0;
    this.steps = 0;
    this.inputs = 0;
    this.frameAt = this.last;
    this.rateAt = this.last;
    this.rateSteps = 0;
    this.statusAt = 0;
    this.statusPending = false;
  }
  async init() {
    this.startupPhases = [];
    let phase,
      phaseAt = performance.now();
    const finishPhase = () => {
      const now = performance.now();
      if (phase) this.startupPhases.push({ phase, ms: now - phaseAt });
      phaseAt = now;
    };
    this.session = await createSimulationSession(
      this.canvas,
      this.config,
      (message) => {
        finishPhase();
        phase = message;
        this.notify({ type: "loading", message });
      },
    );
    finishPhase();
    phase = "Preparing the first frame…";
    this.notify({ type: "loading", message: phase });
    try {
      this.session.draw();
      await this.completed();
    } catch (error) {
      this.destroy();
      throw error;
    }
    this.publishAim();
    this.drawRevision = this.canvas.revision;
    this.dirty = false;
    finishPhase();
    // Setup time is not simulated time or part of the live frame-rate window.
    this.last = this.frameAt = this.rateAt = this.statusAt = performance.now();
    this.frame = this.frame.bind(this);
    this.raf = requestAnimationFrame(this.frame);
    return this.info();
  }
  info() {
    const s = this.session;
    return {
      scene: this.config.scene,
      steps: this.steps,
      backend: s.cpu ? "cpu" : "gpu",
      renderer: s.cpu && s.dimension === 2 ? "canvas" : this.config.renderer,
      dimension: s.dimension,
      bodies: s.gpu.bodyCount,
      terrain: s.built.terrain,
      playActions: s.built.play?.actions,
      iterations: s.gpu.params.iterations,
      timeStep: s.gpu.params.dt,
      defaultStepRate: s.defaultStepRate,
      adapter: s.adapter,
      worker: typeof document === "undefined",
      sharedInput: !!this.sharedInput,
      bowling: !!s.bowling,
      projectileGpuIndex:
        s.built.def?.benchmark || s.built.def?.cannon
          ? s.gpu.gpuIndex(s.built.solver.bodies.length - 1)
          : undefined,
      pegs: s.pegs?.state(),
      bowlingBalls: s.bowling?.balls.map((b) =>
        s.gpu.gpuIndex(s.built.solver.bodies.indexOf(b)),
      ),
      sleepingEnabled: s.sleepingEnabled,
      startupPhases: this.startupPhases,
    };
  }
  frame(now) {
    if (this.disposed || this.failed) return;
    this.raf = requestAnimationFrame(this.frame);
    if (this.measuring) {
      this.last = now;
      return;
    }
    try {
      this.beforeFrame?.();
      const s = this.session,
        dt = s.gpu.params.dt;
      if (s.errors.length) throw Error(s.errors.at(-1));
      if (!this.paused)
        this.accumulator = Math.min(
          this.accumulator + Math.min((now - this.last) / 1000, 0.05),
          dt * 6,
        );
      this.last = now;
      // Preserve bounded elapsed time while waiting for the GPU. Dropping it on
      // every busy frame slows the simulated clock even after the queue catches up.
      if (this.inFlight >= 2) return;
      if (now - this.statusAt > 1000) {
        this.statusAt = now;
        void this.status(now).catch((error) => this.fail(error));
      }
      if (
        this.paused &&
        !this.dirty &&
        this.drawRevision === this.canvas.revision &&
        !s.pegs?.moving
      )
        return;
      if (this.frames % 30 === 0)
        s.gpu.profileNextStep?.((p) => (this.profile = p));
      // Bound catch-up work per frame instead of changing the selected timestep or
      // solver iterations. The accumulator carries remaining elapsed time forward.
      const stepBudget = physicsStepsPerFrame(this.profile);
      for (let n = 0; this.accumulator + 1e-12 >= dt && n < stepBudget; n++) {
        const start = performance.now();
        s.step();
        if (s.cpu) this.profile = { total: performance.now() - start };
        this.steps++;
        this.accumulator = Math.max(0, this.accumulator - dt);
      }
      if (this.paused && this.dirty) s.gpu.flushEdits?.();
      const resized = this.drawRevision !== this.canvas.revision;
      s.draw();
      if (resized) this.publishAim();
      this.dirty = false;
      this.drawRevision = this.canvas.revision;
      this.frames++;
      this.inFlight++;
      this.completed()
        .catch((error) => this.fail(error))
        .finally(() => this.inFlight--);
    } catch (error) {
      this.fail(error);
    }
  }
  fail(error) {
    if (this.disposed || this.failed) return;
    this.failed = error.message ?? String(error);
    this.paused = true;
    cancelAnimationFrame(this.raf);
    this.notify({ type: "error", message: this.failed });
  }
  assertActive() {
    if (this.disposed) throw Error("Simulation disposed");
    if (this.failed) throw Error(this.failed);
  }
  completed() {
    return (
      this.session.device?.queue.onSubmittedWorkDone() ?? Promise.resolve()
    );
  }
  /** Publish small UI summaries periodically; avoid full-body readback in the frame loop. */
  async status(now = performance.now()) {
    if (this.statusPending || this.disposed) return;
    this.statusPending = true;
    try {
      const s = this.session;
      const data = {
        type: "status",
        paused: this.paused,
        fps: (this.frames * 1000) / Math.max(1, now - this.frameAt),
        steps: this.steps,
        profile: this.profile,
        waterMs: s.water?.timer.latestMs,
        drawMs: s.renderer.timer.latestMs,
        inputs: this.inputs,
        errors: [...s.errors],
        slingshot: s.slingshot?.state(),
        pegs: s.pegs?.state(),
      };
      this.frames = 0;
      this.frameAt = now;
      if (s.water) {
        const result = await s.water.readState();
        data.ships = s.built.ships.map((ship) => {
          const i = s.built.pieces.findIndex((p) => p.body === ship.root);
          return {
            name: ship.name,
            team: ship.team,
            support: result.state[i * 4 + 1],
            broken: s.built.pieces.filter(
              (p, j) =>
                p.team === ship.team && !p.root && result.state[j * 4] <= 0,
            ).length,
          };
        });
      } else if (!s.cpu && this.steps > 0 && s.gpu.adapt) {
        const counters = await s.gpu.readCounters();
        if (!this.disposed) s.gpu.adapt(counters);
      }
      if (s.playground?.feeder && !this.measuring)
        data.galton = await s.playground.feeder.measure();
      if (s.damage) data.damage = await s.damage.read();
      data.sleep = await s.readSleepStats();
      data.simulationRate =
        ((this.steps - this.rateSteps) * s.gpu.params.dt) /
        Math.max(0.001, (now - this.rateAt) / 1000);
      this.rateAt = now;
      this.rateSteps = this.steps;
      if (!this.disposed) this.notify(data);
      return data;
    } finally {
      this.statusPending = false;
    }
  }
  input(type, event) {
    this.inputs++;
    this.dirty = true;
    const shots = this.session.slingshot?.shots;
    this.canvas.dispatch(type, event);
    if (this.session.slingshot?.shots > shots) this.paused = false;
    this.publishAim();
  }
  publishAim() {
    const sling = this.session.slingshot;
    if (!sling) return;
    const key = [
      sling.camera.x,
      sling.camera.y,
      sling.camera.scale,
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      sling.bird,
      !!sling.hold,
      sling.shots,
      ...(sling.pull ?? []),
    ].join("/");
    if (key === this.aimKey) return;
    this.aimKey = key;
    this.notify({ type: "slingshot", slingshot: sling.state() });
  }
  control(name, value) {
    if (this.measuring && ["iterations", "stepRate"].includes(name))
      throw Error(
        "Wait for the measurement to finish before changing solver settings",
      );
    this.dirty = true;
    const water = this.session.water;
    if (name === "pause") {
      this.paused = !!value;
      this.accumulator = 0;
    } else if (name === "sleeping") {
      this.session.setSleeping(!!value);
    } else if (name === "stepRate") {
      const rate = readStepRate(value);
      if (rate === undefined)
        throw Error("A finite physics step rate is required");
      this.session.gpu.params.dt = 1 / rate;
      this.accumulator = 0;
      this.last = this.rateAt = performance.now();
      this.rateSteps = this.steps;
    } else if (name === "iterations")
      this.session.gpu.params.iterations = Math.max(
        1,
        Math.min(40, Math.round(value)),
      );
    else if (name === "fit") this.session.renderer.fit?.();
    else if (name === "bowl") {
      this.session.bowling?.launch();
      this.paused = false;
    } else if (name === "cannonAim" && this.session.built.def?.cannon) {
      this.cannonAim = value;
      this.session.replaceBody(
        this.session.built.castle.barrelIndex,
        createCastleBarrel(value),
      );
    } else if (
      name === "projectile" &&
      (this.session.built.def?.benchmark || this.session.built.def?.cannon)
    ) {
      const s = this.session,
        i = s.built.solver.bodies.length - 1;
      this.projectileKind = value?.kind ?? this.projectileKind ?? "sphere";
      const b = s.built.def.cannon
        ? createCastleProjectile(
            this.projectileKind,
            value?.aim ?? this.cannonAim ?? castleAim,
          )
        : createRookProjectile(this.projectileKind);
      s.replaceBody(i, b);
      s.gpu.editBodies([
        {
          body: s.gpu.gpuIndex(i),
          position: b.positionLin,
          rotation: b.positionAng,
          linearVelocity: b.velocityLin,
          angularVelocity: b.velocityAng,
        },
      ]);
      s.gpu.flushEdits();
      this.paused = false;
    } else if (name === "play")
      this.session.playground?.action(value ?? "start");
    else if (name === "fire") water?.fire(value ?? 0);
    else if (name === "launch" && this.session.slingshot) {
      if (this.session.slingshot.launch()) this.paused = false;
    } else if (name === "reload") this.session.slingshot?.reload();
    else if (name === "ram") water?.ram(value ?? 0);
    else if (name === "releaseHull") water?.releaseHull(value ?? 1);
    else if (name === "releaseSail") water?.releaseSail(value ?? 1);
    else if (name === "auto" && water) water.auto = !!value;
    else if (name === "waves" && water)
      water.sea = Math.max(0, Math.min(0.4, +value));
    else if (name === "key" && value.code === "Space" && !value.repeat) {
      if (this.session.slingshot) {
        if (this.session.slingshot.hold) {
          this.session.slingshot.launch();
          this.paused = false;
        } else this.session.slingshot.reload();
      } else if (
        this.session.built.def?.cannon ||
        this.session.built.def?.benchmark
      )
        this.control("projectile");
      else water?.fire(0);
    }
    this.publishAim();
  }
  async step(count = 1) {
    this.assertActive();
    if (this.measuring) throw Error("A measurement is already running");
    if (!Number.isInteger(count) || count < 0)
      throw Error("Step count must be a nonnegative integer");
    this.paused = true;
    this.measuring = true;
    try {
      for (let i = 0; i < count; i++) {
        if (this.disposed) throw Error("Simulation disposed");
        this.beforeFrame?.();
        this.session.step();
        this.steps++;
        if (i % 60 === 59) await this.completed();
      }
      await this.completed();
      this.session.draw();
      this.dirty = false;
      this.drawRevision = this.canvas.revision;
      await this.status();
    } finally {
      this.measuring = false;
    }
  }
  async snapshot() {
    this.assertActive();
    const s = this.session;
    const water = s.water?.readState();
    const [poses, counters, result] = await Promise.all([
      s.gpu.readBodies(),
      water ? water.then((r) => r.counters) : s.gpu.readCounters(),
      water,
    ]);
    return {
      ...this.info(),
      steps: this.steps,
      galton: await s.playground?.feeder?.measure(true),
      slingshot: s.slingshot?.state(),
      pegs: s.pegs?.state(),
      inputs: this.inputs,
      poses: Array.from(poses),
      counters,
      errors: [...s.errors],
      camera:
        s.dimension === 3
          ? {
              yaw: s.renderer.yaw,
              pitch: s.renderer.pitch,
              distance: s.renderer.distance,
            }
          : { ...s.renderer.camera() },
      ...(result
        ? {
            tick: result.tick,
            rounds: result.rounds,
            state: Array.from(result.state),
            bodyCount: s.gpu.bodyCount,
            waterMs: s.water.timer.latestMs,
            drawMs: s.renderer.timer.latestMs,
            pieces: s.built.pieces.map((p, i) => ({
              index: s.gpu.gpuIndex(s.built.world.bodies.indexOf(p.body)),
              team: p.team,
              root: !!p.root,
              sail: !!p.sailArea,
              stateIndex: i,
            })),
          }
        : {}),
    };
  }
  /**
   * Measure isolated step/draw costs after warmup, awaiting GPU completion per sample.
   * This advances the current scene. One physics step per sample is intentional;
   * these frame intervals are not the multi-step real-time play-loop throughput.
   */
  async benchmark({ warmup = 30, samples = 120 } = {}) {
    this.assertActive();
    if (this.measuring) throw Error("A measurement is already running");
    if (
      ![warmup, samples].every((n) => Number.isInteger(n) && n >= 0) ||
      samples < 1
    )
      throw Error(
        "Benchmark counts must be nonnegative integers, with at least one sample",
      );
    const wasPaused = this.paused;
    this.measuring = true;
    const s = this.session,
      cpu = [],
      completion = [],
      intervals = [],
      profiles = [],
      water = [],
      draw = [];
    let previous,
      waterSamples = s.water?.timer.samples,
      drawSamples = s.renderer.timer.samples;
    try {
      s.playground?.action("start");
      await this.completed();
      for (let i = 0; i < warmup + samples; i++) {
        const now = await new Promise(requestAnimationFrame);
        if (this.disposed) throw Error("Simulation disposed");
        this.beforeFrame?.();
        if (i >= warmup) {
          if (previous !== undefined) intervals.push(now - previous);
          s.gpu.profileNextStep?.((p) => profiles.push(p));
        }
        previous = now;
        const start = performance.now();
        s.step();
        const physicsEnd = performance.now();
        this.steps++;
        s.draw();
        const submitted = performance.now();
        await this.completed();
        const completed = performance.now();
        await Promise.all([
          s.water?.timer.settled(),
          s.renderer.timer.settled?.(),
        ]);
        if (i >= warmup) {
          cpu.push(submitted - start);
          completion.push(completed - start);
          if (s.cpu) profiles.push({ total: physicsEnd - start });
          if (
            s.water?.timer.latestMs != null &&
            s.water.timer.samples !== waterSamples
          )
            water.push(s.water.timer.latestMs);
          if (
            s.renderer.timer.latestMs != null &&
            (s.renderer.timer.samples === undefined ||
              s.renderer.timer.samples !== drawSamples)
          )
            draw.push(s.renderer.timer.latestMs);
        }
        waterSamples = s.water?.timer.samples;
        drawSamples = s.renderer.timer.samples;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
      const counters = await s.gpu.readCounters();
      return {
        ...this.info(),
        warmup,
        samples,
        cpuSubmitMs: summary(cpu),
        completionMs: summary(completion),
        frameMs: summary(intervals),
        physicsMs: summary(profiles.map((p) => p.total)),
        physicsClock: s.cpu ? "CPU wall time" : "GPU timestamps",
        collisionMs: summary(
          profiles.map((p) => p.collision).filter(Number.isFinite),
        ),
        drawMs: summary(draw),
        waterMs: summary(water),
        inputs: this.inputs,
        counters,
        errors: [...s.errors],
        measuredStepsPerFrame: 1,
        sceneAction: s.playground ? "start" : null,
        galton: await s.playground?.feeder?.measure(true),
      };
    } finally {
      this.measuring = false;
      this.paused = wasPaused;
      this.accumulator = 0;
      this.last = performance.now();
      this.dirty = true;
    }
  }
  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.session?.destroy();
  }
}
