const ms = (value) => value.toFixed(2);
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
function renderSleepReport(data, key) {
  if (!data) return "";
  const runs = data.runs.filter((r) => r[key]);
  if (!runs.length) return "";
  const max = Math.max(
    ...runs.flatMap((r) => [
      r[key].awakePolicy.median,
      r[key].sleepPolicy.median,
    ]),
  );
  const label =
    data.hardwareLabel ?? data.adapter.description ?? data.adapter.vendor;
  const bars = runs
    .map((r, i) => {
      const s = r[key],
        off = s.awakePolicy.median,
        on = s.sleepPolicy.median;
      const saving = 100 * (1 - on / off);
      return `<article class="sleep-run"><h3>Repeat ${i + 1}</h3><div class="chart-label">Sleeping off <b>${ms(off)} ms</b></div><div class="bar"><span class="sleep-off" style="width:${(100 * off) / max}%"></span></div><div class="chart-label">Sleeping on <b>${ms(on)} ms</b></div><div class="bar"><span class="sleep-on" style="width:${(100 * on) / max}%"></span></div><p><b>${saving >= 0 ? `${saving.toFixed(1)}% less time` : `${(-saving).toFixed(1)}% more time`} with sleeping.</b> ${s.sleeping.toLocaleString()} boxes asleep. Largest position difference: ${(s.maxPositionDifference * 100).toFixed(2)} cm.</p></article>`;
    })
    .join("");
  return `<section class="panel" id="${key === "sleeping" ? "sleeping-comparison" : "sleeping-2d-comparison"}"><h2>Does sleeping make a resting ${key === "sleeping2D" ? "2D" : "3D"} stack faster?</h2><p><b>${escape(label)}</b> · ${(runs[0][key].bodies - 1).toLocaleString()} resting boxes · ${runs[0][key].iterations} solving rounds · ${Math.round(1 / (runs[0][key].timeStep ?? 1 / 60))} physics steps per simulated second. Each bar shows a typical step (the median). Shorter is faster. Drawing is excluded; sleep, wake and support checks are included.</p><div class="legend"><span><i class="sleep-off"></i>Sleeping off</span><span><i class="sleep-on"></i>Sleeping on</span></div><div class="grid">${bars}</div><p>Sleeping lets quiet boxes stop doing movement work until disturbed. This stack is different from the cannon impact: impacts wake bodies and can reduce the saving. Sleeping also freezes small remaining movements, so final positions may differ slightly. These results do not change the always-awake paper comparisons.</p><details><summary>What does sleeping cost while the boxes are still moving?</summary><ul>${runs.map((r, i) => `<li>Repeat ${i + 1}: sleeping off ${ms(r[key].awakeOverhead.withoutSleeping.median)} ms; sleep checks enabled ${ms(r[key].awakeOverhead.withSleeping.median)} ms.</li>`).join("")}</ul><p>Both start with every box awake. Times include the extra sleep checks.</p></details><p><a href="package-performance.html">Pose-copy results and full method</a> · <a href="package-performance.json">Download measurements</a> · <a href="../tests/performance.html">Run this benchmark on your computer</a></p></section>`;
}

export function sleepReportView(data) {
  return (
    renderSleepReport(data, "sleeping") + renderSleepReport(data, "sleeping2D")
  );
}
