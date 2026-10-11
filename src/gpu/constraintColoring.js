import {
  MAX_COLORS,
  NO_COLOR,
} from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";

/** Seed an existing constraint graph once; GPU coloring still checks live contacts every step. */
export function seedConstraintColoring(gpu, ref, minimum = 8) {
  const ids = new Map(ref.bodies.map((body, i) => [body, i]));
  const neighbors = ref.bodies.map(() => new Set());
  for (const force of ref.forces) {
    const a = ids.get(force.bodyA),
      b = ids.get(force.bodyB);
    if (
      a === undefined ||
      b === undefined ||
      ref.bodies[a].mass === 0 ||
      ref.bodies[b].mass === 0
    )
      continue;
    neighbors[a].add(b);
    neighbors[b].add(a);
  }
  const order = ref.bodies
    .map((_, i) => i)
    .filter((i) => ref.bodies[i].mass > 0)
    .sort((a, b) => neighbors[b].size - neighbors[a].size || a - b);
  const colors = new Uint32Array(gpu.bodyCapacity).fill(NO_COLOR),
    assigned = new Map();
  let count = 0;
  for (const i of order) {
    const used = new Set([...neighbors[i]].map((j) => assigned.get(j)));
    let color = 0;
    while (used.has(color)) color++;
    if (color >= MAX_COLORS) return; // Retain the solver's conservative startup for dense graphs.
    assigned.set(i, color);
    colors[gpu.gpuIndex(i)] = color;
    count = Math.max(count, color + 1);
  }
  gpu.device.queue.writeBuffer(gpu.colorBuffer, 0, colors);
  gpu.colorCap = Math.min(MAX_COLORS, Math.max(minimum, count + 3));
}
