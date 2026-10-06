const ms = (v) => v.toFixed(2);
const change = (v) => `${Math.abs(v).toFixed(1)}% ${v >= 0 ? "less" : "more"}`;

export function ragdollReportView(data) {
  if (!data) return "";
  const max = Math.max(
    ...data.phases.flatMap((p) => [p.grid.total, p.tree.total]),
  );
  const bar = (label, timing) =>
    `<div class="chart-label">${label}<b>${ms(timing.total)} ms/step</b></div><div class="bar"><span class="collision" style="width:${(100 * timing.collision) / max}%" title="Find touching objects: ${ms(timing.collision)} ms"></span><span class="coloring" style="width:${(100 * (timing.total - timing.collision - timing.solve)) / max}%" title="Prepare contacts and work groups"></span><span class="solve" style="width:${(100 * timing.solve) / max}%" title="Move objects: ${ms(timing.solve)} ms"></span></div>`;
  return `<h3>Ragdolls on the cloth net</h3><p>The tree also helps with thin linked plates. It searches boxes that fit the plates, avoiding much of the empty space inside grid cells. <b>Automatic selection uses HPLOC++ for this scene.</b> Both collision methods use the same overlapping plates, limb colliders, five solver iterations and four steps per 60 Hz frame.</p><div class="grid">${data.phases.map((p) => `<div class="panel ragdoll-run"><h3>${p.label}</h3>${bar("Grid", p.grid)}${bar("HPLOC++ tree", p.tree)}<p><b>${change(p.saving)} physics time per step.</b> Finding collisions takes ${change(p.collisionSaving)} time. Drawing is excluded; this is not a frame-rate measurement.</p><p>Measured between ${p.from.toFixed(2)} and ${p.to.toFixed(2)} simulated seconds. Both methods produced the same final candidate-pair, contact and manifold counts in each repeat.</p></div>`).join("")}</div><p>Saved results: RTX 4070 Laptop GPU. Two paired runs per phase alternate execution order each step. Each step checks storage capacity and work-group conflicts. A separate 30-second motion check samples every quarter-second. It checks for submerged limbs and partial limb intersections with the drawn sheet deeper than 5 mm.</p><p><a href="/?demo=canonical&scene=showcase-ragdolls-on-cloth-24k&backend=gpu&broadphase=auto">Play the ragdoll net ↗</a> · <a href="solver-ragdoll-collision.json">Impact measurements</a> · <a href="solver-ragdoll-settled.json">Later measurements</a> · <a href="ragdoll-net.json">Motion checks</a></p>`;
}
