const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const ms = (value) =>
  Number.isFinite(value) ? value.toFixed(2) : "Unavailable";
export function sceneSleepView(report) {
  if (!report?.summary?.length) return "";
  const rows = report.summary
    .map((r) => {
      const change = 100 * (r.onMs / r.offMs - 1);
      const url =
        r.id === "naval"
          ? "../?demo=naval"
          : r.id === "mixed-collider-gallery"
            ? "../?demo=showcase"
            : `../?demo=canonical&amp;scene=${escape(r.id)}&amp;backend=gpu`;
      return `<tr><td><a href="${url}">${escape(r.name)}</a></td><td>${ms(r.offMs)}</td><td>${ms(r.onMs)}</td><td>${r.passed ? `${Math.abs(change).toFixed(1)}% ${change < 0 ? "less" : "more"} time` : "Check failed"}</td><td>${r.defaultSleeping ? "On" : "Off"}</td></tr>`;
    })
    .join("");
  const highlights = report.summary
    .filter((r) =>
      [
        "showcase-brick-ring-110k",
        "3d-voronoi-demolition",
        "showcase-box-columns-100k",
        "paper-walls-510k-4",
        "3d-100k-rook-impact",
      ].includes(r.id),
    )
    .map(
      (r) =>
        `<article><h3>${escape(r.name)}</h3>${[
          [false, r.offMs],
          [true, r.onMs],
        ]
          .map(
            ([on, time]) =>
              `<div class="chart-label">Sleeping ${on ? "on" : "off"} <b>${ms(time)} ms</b></div><div class="bar"><span class="${on ? "adjacency" : "solve"}" style="width:${(100 * time) / Math.max(r.offMs, r.onMs)}%"></span></div>`,
          )
          .join(
            "",
          )}<p>Default: sleeping <b>${r.defaultSleeping ? "on" : "off"}</b>.</p></article>`,
    )
    .join("");
  return `<section class="panel" id="scene-sleeping"><h2>Does sleeping help each scene?</h2><p>Sleeping adds checks to find objects that can safely rest. Those checks pay off when enough objects stay still. Scenes with ongoing motion can run faster with sleeping off.</p><p><b>${escape(report.hardware ?? "RTX 4070 Laptop GPU")}</b> · ${report.repeats} paired runs per scene · ${report.seconds} seconds of simulated motion per run. These are complete physics-step times, including sleep and wake checks. Drawing is excluded. Lower is better.</p><div class="grid">${highlights}</div><details><summary>Every scene: sleeping on versus off</summary><div class="scroll"><table><thead><tr><th>Scene</th><th>Off (ms)</th><th>On (ms)</th><th>Effect of sleeping</th><th>Demo default</th></tr></thead><tbody>${rows}</tbody></table></div></details><details><summary>Moving versus later in the run</summary><p>“Later” means the final two seconds; it does not guarantee the scene has stopped moving. Defaults turn sleeping on only when both runs save at least 10% overall and neither run slows active motion by more than 15%. These are starting presets for this GPU, not a guarantee for every device or interaction. The Sleeping toggle and URL setting always override them.</p><div class="scroll"><table><thead><tr><th>Scene</th><th>Moving, off</th><th>Moving, on</th><th>Later, off</th><th>Later, on</th></tr></thead><tbody>${report.summary.map((r) => `<tr><td>${escape(r.name)}</td>${[r.activeOffMs, r.activeOnMs, r.laterOffMs, r.laterOnMs].map((t) => `<td>${ms(t)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details><p><a href="scene-sleep-performance.json">Download measurements</a> · <a href="../scripts/benchmark-scene-sleep.mjs">Benchmark runner</a></p></section>`;
}
