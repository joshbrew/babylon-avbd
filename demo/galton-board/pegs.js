import { visualOf } from "../../reference/three-avbd/src/avbd3d/visuals.ts";

/** Static peg picking uses the board plane, with no full-world pose download. */
export class GaltonPegs {
  constructor(canvas, renderer, built, gpu) {
    Object.assign(this, { canvas, renderer, gpu, depth: built.play.pegDepth });
    this.pegs = built.play.pegs.map((b) => ({
      id: gpu.gpuIndex(built.solver.bodies.indexOf(b)),
      position: Array.from(b.positionLin),
      color: visualOf(b).color,
      extended: true,
      y: 0,
    }));
    this.animations = new Map();
    this.previous = renderer.onStaticPointerDown;
    this.down = (e) => {
      this.press = null;
      if (e.button !== 0 || e.altKey || !renderer.vp) return this.previous?.(e);
      const ray = renderer.ray(e);
      if (Math.abs(ray.direction[1]) < 1e-5) return false;
      let closest,
        dist = Infinity;
      for (const peg of this.pegs) {
        const t = (peg.y - this.depth / 2 - ray.origin[1]) / ray.direction[1];
        if (t <= 0) continue;
        const x = ray.origin[0] + t * ray.direction[0],
          z = ray.origin[2] + t * ray.direction[2];
        const d = Math.hypot(x - peg.position[0], z - peg.position[2]);
        if (d < 0.42 && d / t < dist) {
          closest = peg;
          dist = d / t;
        }
      }
      if (!closest) return this.previous?.(e);
      this.press = {
        peg: closest,
        x: e.clientX,
        y: e.clientY,
        pointer: e.pointerId,
      };
      return true;
    };
    this.up = (e) => {
      const p = this.press;
      this.press = null;
      if (
        p &&
        p.pointer === e.pointerId &&
        Math.hypot(e.clientX - p.x, e.clientY - p.y) < 5
      )
        this.toggle(p.peg);
    };
    this.cancel = () => {
      this.press = null;
    };
    renderer.onStaticPointerDown = this.down;
    canvas.addEventListener("pointerup", this.up);
    canvas.addEventListener("pointercancel", this.cancel);
  }
  get moving() {
    return this.animations.size > 0;
  }
  state() {
    return {
      total: this.pegs.length,
      retracted: this.pegs.filter((p) => !p.extended).length,
      last: this.last,
    };
  }
  toggle(peg, extended = !peg.extended) {
    if (peg.extended === extended) return;
    peg.extended = extended;
    this.last = { id: peg.id, extended };
    // Disable contacts while the peg slides through the board. Restore its mask
    // only at the extended endpoint to avoid pushing marbles with a moving proxy.
    this.gpu.setFilters([peg.id], [0xffffffff], [0]);
    this.animations.set(peg.id, {
      peg,
      from: peg.y,
      to: extended ? 0 : this.depth - 0.2,
      at: performance.now(),
    });
    const color = extended ? peg.color : 0xde6955;
    this.renderer.device.queue.writeBuffer(
      this.renderer.visuals.styles,
      peg.id * 32,
      new Float32Array([
        ((color >> 16) & 255) / 255,
        ((color >> 8) & 255) / 255,
        (color & 255) / 255,
        1,
      ]),
    );
    this.renderer.visuals.styleVersion++;
  }
  restore() {
    for (const p of this.pegs) this.toggle(p, true);
  }
  update(now = performance.now()) {
    if (!this.moving) return;
    const edits = [],
      ready = [];
    for (const [id, a] of this.animations) {
      const t = Math.min(1, (now - a.at) / 200),
        smooth = t * t * (3 - 2 * t);
      a.peg.y = a.from + (a.to - a.from) * smooth;
      edits.push({
        body: id,
        position: [a.peg.position[0], a.peg.y, a.peg.position[2]],
      });
      if (t === 1) {
        this.animations.delete(id);
        if (a.peg.extended) ready.push(id);
      }
    }
    // One batch covers every moving peg. Flush here so animation also works
    // while physics is paused and no simulation step would otherwise apply edits.
    this.gpu.editBodies(edits);
    if (ready.length)
      this.gpu.setFilters(
        ready,
        ready.map(() => 0xffffffff),
        ready.map(() => 0xffffffff),
      );
    this.gpu.flushEdits();
  }
  destroy() {
    if (this.renderer.onStaticPointerDown === this.down)
      this.renderer.onStaticPointerDown = this.previous;
    this.canvas.removeEventListener("pointerup", this.up);
    this.canvas.removeEventListener("pointercancel", this.cancel);
  }
}
