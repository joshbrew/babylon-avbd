const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
export function contactRecyclingView(report) {
  if (!report?.summary?.length) return "";
  const rows = report.summary
    .map((r) => {
      const change = 100 * (r.onMs / r.offMs - 1),
        finite = Number.isFinite(change);
      const result = !r.passed
        ? "Check failed; preset disabled"
        : !finite
          ? "Timing unavailable"
          : Math.abs(change) < 5
            ? "Small difference"
            : `${Math.abs(change).toFixed(1)}% ${change < 0 ? "less" : "more"} physics time${change < 0 && !r.defaultContactRecycling ? "; not enough gain in every run" : ""}`;
      const link = (mode) =>
        `../?demo=canonical&amp;scene=${encodeURIComponent(r.id)}&amp;backend=gpu&amp;recycling=${mode}`;
      return `<tr><td>${r.dimension}D · ${escape(r.name)}<br><a href="${link("off")}">Play disabled</a> · <a href="${link("on")}">Play enabled</a></td><td>${r.offMs?.toFixed(2) ?? "—"}</td><td>${r.onMs?.toFixed(2) ?? "—"}</td><td>${result}</td><td>${r.defaultContactRecycling ? "Enabled" : "Disabled"}</td></tr>`;
    })
    .join("");
  const winners = report.summary.filter((r) => r.defaultContactRecycling);
  const winnerText = winners.length
    ? winners
        .map(
          (r) =>
            `${escape(r.name)}: ${(100 * (1 - r.onMs / r.offMs)).toFixed(1)}% less physics time (${r.offMs.toFixed(2)} to ${r.onMs.toFixed(2)} ms per step)`,
        )
        .join("; ")
    : "No scene met the preset threshold";
  const workloads = report.workloads
    ?.map(
      (r) =>
        `<tr><td>${escape(r.name)}</td><td>${escape(r.backend)}</td><td>${r.offMs.toFixed(2)}</td><td>${r.onMs.toFixed(2)}</td><td>${(100 * (1 - r.onMs / r.offMs)).toFixed(1)}%</td></tr>`,
    )
    .join("");
  return `<section class="panel" id="contact-recycling"><h2>Contact recycling: enabled vs disabled</h2>
  <p>A contact point describes where two objects touch. Recycling keeps that geometry while the surfaces barely move, and updates their separation every step. Larger motion and rounded shapes get fresh collision checks.</p>
  <p>Disabled retains our normal contact handling, including the existing small-motion 3D cache. Enabled adds relative-motion recycling. These are two settings of our solver, measured on <b>${escape(report.hardware ?? "WebGPU")}</b>. Lower numbers are better. Times include all physics and exclude drawing. Object counts, solving rounds, timestep, actions and sleeping presets are the same.</p>
  <p>Each scene runs for ${report.seconds} simulated seconds, repeated ${report.repeats} times. The preset requires at least 10% less total physics time in every repeat, without making the initial activity more than 15% slower. Small or inconsistent differences keep recycling disabled. You can override the preset in the scene controls.</p>
  <p><b>${winnerText}.</b> Other scenes keep recycling disabled.</p>
  <details><summary>All ${report.summary.length} scene comparisons</summary><div class="scroll"><table><thead><tr><th>Scene</th><th>Disabled ms/step</th><th>Enabled ms/step</th><th>Comparison</th><th>Scene preset</th></tr></thead><tbody>${rows}</tbody></table></div></details>
  ${workloads ? `<h3>Additional workloads</h3><p>CPU times use the processor's clock; GPU times use GPU timestamps. These workloads use 10 solving rounds, 60 physics steps per second and sleeping disabled. Compare enabled and disabled within each row.</p><div class="scroll"><table><thead><tr><th>Workload</th><th>Execution</th><th>Disabled ms/step</th><th>Enabled ms/step</th><th>Time saved</th></tr></thead><tbody>${workloads}</tbody></table></div>` : ""}
  <p><a href="contact-recycling-performance.json">Download paired measurements</a> · <a href="../scripts/benchmark-contact-recycling.mjs">Benchmark source</a></p></section>`;
}
