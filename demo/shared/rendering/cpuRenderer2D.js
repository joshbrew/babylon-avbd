import { shapesOf2D } from "../../../src/gpu/shapes2D.js";
import {
  CS,
  RA,
  RB,
  STIFF,
} from "../../../reference/three-avbd/src/avbd2d/soa/solver.ts";

/** Canvas drawing of live CPU state; no graphics device or body downloads. */
export class CpuRenderer2D {
  constructor(_device, canvas, sim, camera, options = {}) {
    Object.assign(this, { canvas, sim, camera, options });
    this.ctx = canvas.getContext("2d");
    if (!this.ctx) throw Error("Canvas 2D rendering is unavailable");
    this.colors = [...(options.colors ?? [])];
    this.timer = { latestMs: 0 };
    this.renderStats = {
      renderer: "canvas",
      poseDownloads: 0,
      matrixUpdates: 0,
      cpuSubmitMs: 0,
    };
  }
  setColor(index, rgba) {
    this.colors[index] = [...rgba];
  }
  updateJointVisibility() {} // Live CPU stiffness is read while drawing links.
  draw() {
    const started = performance.now(),
      { canvas, ctx } = this;
    const world = this.sim.solver,
      solver = world.solver,
      camera = this.camera();
    const width = Math.max(1, Math.round(canvas.clientWidth)),
      height = Math.max(1, Math.round(canvas.clientHeight));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const bg = this.options.background ?? { r: 0.91, g: 0.92, b: 0.94 };
    ctx.fillStyle = `rgb(${bg.r * 255} ${bg.g * 255} ${bg.b * 255})`;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.scale, -camera.scale);
    ctx.translate(-camera.x, -camera.y);
    const geometries = shapesOf2D(solver);
    ctx.lineWidth = 1 / camera.scale;
    for (let i = 0; i < world.bodyCount; i++) {
      const o = i * 4,
        geometry = geometries?.get(i),
        color = this.colors[i];
      if (color?.[3] === 0) continue;
      ctx.save();
      ctx.translate(solver.pose[o], solver.pose[o + 1]);
      ctx.rotate(solver.pose[o + 2]);
      ctx.fillStyle = color
        ? `rgba(${color
            .slice(0, 3)
            .map((v) => Math.round(v * 255))
            .join(",")},${solver.sensors.has(i) ? 0.2 : (color[3] ?? 1)})`
        : solver.shape[o + 2] > 0
          ? "#9db9cf"
          : "#aaa89f";
      ctx.strokeStyle = "#5e625f";
      ctx.beginPath();
      if (geometry?.[0] === 1) ctx.arc(0, 0, geometry[1], 0, Math.PI * 2);
      else if (geometry?.[0] === 2) {
        const r = geometry[1],
          h = geometry[2];
        ctx.moveTo(-h, -r);
        ctx.lineTo(h, -r);
        ctx.arc(h, 0, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(-h, r);
        ctx.arc(-h, 0, r, Math.PI / 2, Math.PI * 1.5);
      } else if (geometry?.[0] === 4) {
        const v = geometry.vertices;
        ctx.moveTo(v[0], v[1]);
        for (let k = 4; k < v.length; k += 4) ctx.lineTo(v[k], v[k + 1]);
        ctx.closePath();
      } else if (geometry?.[0] === 3) {
        ctx.rect(-1e5, -1e5, 2e5, 1e5);
      } else
        ctx.rect(
          -solver.shape[o] / 2,
          -solver.shape[o + 1] / 2,
          solver.shape[o],
          solver.shape[o + 1],
        );
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.strokeStyle = "#755039";
    ctx.lineWidth = 2 / camera.scale;
    ctx.beginPath();
    const anchor = (id, offset) => {
      const x = solver.data[offset],
        y = solver.data[offset + 1];
      if (id < 0) return [x, y];
      const o = id * 4,
        c = Math.cos(solver.pose[o + 2]),
        s = Math.sin(solver.pose[o + 2]);
      return [
        solver.pose[o] + c * x - s * y,
        solver.pose[o + 1] + s * x + c * y,
      ];
    };
    for (const id of this.options.visibleLinks ?? []) {
      const o = id * CS;
      if (!solver.data.subarray(o + STIFF, o + STIFF + 3).some((v) => v > 0))
        continue;
      const a = anchor(solver.info[id * 4 + 1], o + RA),
        b = anchor(solver.info[id * 4 + 2], o + RB);
      ctx.moveTo(...a);
      ctx.lineTo(...b);
    }
    ctx.stroke();
    ctx.restore();
    this.timer.latestMs = this.renderStats.cpuSubmitMs =
      performance.now() - started;
  }
  dispose() {}
}
