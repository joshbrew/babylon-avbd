import { clampPull, defaultPull, shotVelocity, trajectory } from "./aim.js";

/** DOM-free slingshot controls shared by page and OffscreenCanvas sessions. */
export class SlingshotControls2D {
  constructor(canvas, camera, built, gpu, renderer) {
    Object.assign(this, { canvas, camera, built, gpu, renderer });
    this.bird = built.bird;
    this.hold = built.hold;
    this.shots = 0;
    canvas.addEventListener("pointerdown", (e) => {
      if (this.pointer !== undefined) return;
      const p = this.world(e),
        ball = this.pull ?? built.origin;
      this.dragging =
        e.button === 0 &&
        !e.shiftKey &&
        !!this.hold &&
        Math.hypot(p[0] - ball[0], p[1] - ball[1]) <=
          Math.max(2, 28 / camera.scale);
      this.pointer = e.pointerId;
      this.last = [e.clientX, e.clientY];
    });
    canvas.addEventListener("pointermove", (e) => this.move(e));
    canvas.addEventListener("pointerup", (e) => {
      if (e.pointerId !== this.pointer) return;
      this.move(e);
      if (
        this.dragging &&
        this.pull &&
        Math.hypot(...this.pull.map((v, i) => v - built.origin[i])) > 0.25
      )
        this.launch();
      else if (this.dragging) this.cancel();
      this.pointer = undefined;
      this.dragging = false;
    });
    canvas.addEventListener("pointercancel", () => this.cancel());
  }
  world(e) {
    const { canvas: c, camera: k } = this;
    return [
      k.x + (e.clientX - c.clientWidth / 2) / k.scale,
      k.y - (e.clientY - c.clientHeight / 2) / k.scale,
    ];
  }
  screen(p) {
    const { canvas: c, camera: k } = this;
    return [
      (p[0] - k.x) * k.scale + c.clientWidth / 2,
      (k.y - p[1]) * k.scale + c.clientHeight / 2,
    ];
  }
  move(e) {
    if (e.pointerId !== this.pointer) return;
    if (this.dragging && this.hold) {
      this.pull = clampPull(this.built.origin, this.world(e));
      this.gpu.setWorldAnchor(this.hold.slot, ...this.pull);
      this.gpu
        .teleport(this.bird, this.pull, 0)
        .setLinearVelocity(this.bird, [0, 0]);
    } else {
      this.camera.x -= (e.clientX - this.last[0]) / this.camera.scale;
      this.camera.y += (e.clientY - this.last[1]) / this.camera.scale;
    }
    this.last = [e.clientX, e.clientY];
  }
  cancel() {
    this.pointer = undefined;
    this.dragging = false;
    this.pull = null;
    if (this.hold) {
      this.gpu.setWorldAnchor(this.hold.slot, ...this.built.origin);
      this.gpu
        .teleport(this.bird, this.built.origin, 0)
        .setLinearVelocity(this.bird, [0, 0]);
    }
  }
  launch() {
    if (!this.hold) return false;
    this.damage?.arm();
    const p = this.pull ?? defaultPull(this.built.origin);
    this.velocity = shotVelocity(this.built.origin, p);
    this.gpu
      .teleport(this.bird, p, 0)
      .setLinearVelocity(this.bird, this.velocity)
      .setAngularVelocity(this.bird, 0);
    this.gpu.disableConstraint(this.hold.slot);
    this.gpu.setFilters([this.bird], [2], [0xfffffff7]);
    this.hold = null;
    this.pull = null;
    this.dragging = false;
    this.shots++;
    return true;
  }
  reload() {
    if (this.hold || this.shots >= 64) return;
    this.bird = this.gpu.addCircle(0.5, {
      position: this.built.origin,
      density: 30,
      friction: 0.35,
      restitution: 0.15,
      allowSleep: false,
      group: 2,
      collidesWith: 0,
    });
    this.renderer.setColor(this.bird, [0.85, 0.22, 0.18]);
    this.hold = {
      slot: this.gpu.appendJoint(
        -1,
        this.bird,
        this.built.origin,
        [0, 0],
        [Infinity, Infinity, 0],
      ),
    };
  }
  state() {
    const p = this.pull ?? this.built.origin;
    return {
      bird: this.bird,
      holding: !!this.hold,
      shots: this.shots,
      pull: this.pull,
      velocity: this.velocity,
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
      bands: this.hold
        ? [[-25.5, 3.5], p, [-24.7, 4]].map((q) => this.screen(q))
        : [],
      points:
        this.pull && this.hold
          ? trajectory(
              p,
              shotVelocity(this.built.origin, p),
              this.gpu.params.gravity,
            ).map((q) => this.screen(q))
          : [],
    };
  }
}
