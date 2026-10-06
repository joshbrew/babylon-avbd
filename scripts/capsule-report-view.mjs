const escape = (v) =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
export function capsuleReportView(data) {
  if (!data?.runs?.length) return "";
  const mean = (analytic) => {
    const runs = data.runs.filter((r) => r.analytic === analytic);
    return runs.reduce((sum, r) => sum + r.collisionMs, 0) / runs.length;
  };
  const analytic = mean(true),
    hull = mean(false),
    maximum = Math.max(analytic, hull),
    saving = 100 * (1 - analytic / hull);
  return `<section class="panel" id="capsule-collisions"><h2>Exact capsule collisions</h2><p>A capsule is a rod with rounded ends. The GPU now tests that smooth shape directly instead of testing a polygonal shell. This comparison uses ${data.bodies.toLocaleString()} objects in ${data.pairs.toLocaleString()} capsule–sphere pairs on <b>${escape(data.hardware)}</b>.</p>
  <div class="chart-label">Rounded segment <b>${analytic.toFixed(3)} ms</b></div><div class="bar"><span class="collision" style="width:${(100 * analytic) / maximum}%"></span></div>
  <div class="chart-label">Polygonal capsule <b>${hull.toFixed(3)} ms</b></div><div class="bar"><span class="solve" style="width:${(100 * hull) / maximum}%"></span></div>
  <p><b>${Math.abs(saving).toFixed(1)}% ${saving >= 0 ? "less" : "more"} time finding collisions in this workload.</b> This measures collision detection, including finding candidate pairs. Movement, drawing and frame rate are not part of this comparison. Different shape combinations can have different results.</p>
  <details><summary>Settings and repeat measurements</summary><p>${escape(data.description)} The table contains each run's median GPU time; bars show the average of those medians. The polygonal capsule is simplified to the package's 32-vertex hull limit.</p><div class="scroll"><table><thead><tr><th>Run</th><th>Shape</th><th>Collision time</th><th>Contact points</th></tr></thead><tbody>${data.runs.map((r, i) => `<tr><td>${i + 1}</td><td>${r.analytic ? "Rounded segment" : "Polygonal capsule"}</td><td>${r.collisionMs.toFixed(3)} ms</td><td>${r.contacts.toLocaleString()}</td></tr>`).join("")}</tbody></table></div></details><p><a href="capsule-performance.json">Download measurements</a></p></section>`;
}
