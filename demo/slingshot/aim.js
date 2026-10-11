export const defaultPull = (origin) => [origin[0] - 3, origin[1] - 1.3];

export const shotVelocity = (origin, pull) =>
  origin.map((v, i) => (v - pull[i]) * 9);

export function clampPull(origin, position) {
  let dx = position[0] - origin[0],
    dy = position[1] - origin[1];
  const length = Math.hypot(dx, dy);
  if (length > 5.5) {
    dx *= 5.5 / length;
    dy *= 5.5 / length;
  }
  return [origin[0] + Math.min(0, dx), Math.max(0.8, origin[1] + dy)];
}

export function trajectory(position, velocity, gravity = -10) {
  const points = [position];
  for (let i = 1; i <= 60; i++) {
    const t = i * 0.1;
    const p = [
      position[0] + velocity[0] * t,
      position[1] + velocity[1] * t + 0.5 * gravity * t * t,
    ];
    points.push(p);
    if (p[1] < 0) break;
  }
  return points;
}

export const trajectoryLine = (points) =>
  `<polyline data-trajectory points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#b6462e" stroke-width="2.5" stroke-dasharray="7 5" stroke-linecap="round"/>`;
