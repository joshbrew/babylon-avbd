import { isSail } from "../../../reference/three-avbd/src/avbd3d/shapes.ts";
import { dot, turn } from "./cpuContacts3D.js";

// Pressure drag and travelling gusts from the GPU sail force in wgsl-solve.ts.
export function windAcceleration(body, params, step) {
  const speed = params.windSpeed ?? 0;
  if (!isSail(body) || body.mass <= 0 || speed === 0) return null;
  const angle = params.windAngle ?? 0,
    d = [Math.cos(angle), Math.sin(angle), 0];
  const side = [-d[1], d[0], 0],
    x = body.positionLin,
    t = step * params.dt;
  const a = dot(x, d),
    c = dot(x, side);
  const along =
    0.5 * Math.sin(1.1 * t - 0.35 * a + 0.2 * c) +
    0.3 * Math.sin(2.9 * t - 0.8 * a + 0.6 * x[2]) +
    0.2 * Math.sin(6.1 * t - 1.7 * a + 1.3 * x[2] + 0.9 * c);
  const across =
    0.6 * Math.sin(1.7 * t - 0.6 * a + 0.4 * x[2]) +
    0.4 * Math.sin(4.3 * t - 1.3 * a - 0.7 * x[2]);
  const lift = Math.sin(2.3 * t - 0.9 * a + 1.1 * c),
    g = params.windGust ?? 0.4;
  const u = d.map(
    (v, i) =>
      speed * v * (1 + g * along) +
      g * speed * (side[i] * 0.25 * across + (i === 2 ? 0.1 * lift : 0)) -
      body.velocityLin[i],
  );
  const n = turn(body.positionAng, [0, 0, 1]);
  const k =
    ((params.windPressure ?? 0.72) * body.size[0] * body.size[1]) / body.mass;
  const un = dot(u, n),
    ut = u.map((v, i) => v - n[i] * un);
  const drag = (k * un * Math.abs(un)) / (1 + 2 * params.dt * k * Math.abs(un));
  return n.map((v, i) => v * drag + ut[i] * 0.06 * k * Math.hypot(...ut));
}
