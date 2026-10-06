const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const ms = (value) => (Number.isFinite(value) ? value.toFixed(2) : "—");
const summarize = (values) => {
  const sorted = values.toSorted((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
    samples: values.length,
  };
};
export function rendererComparisonGroups(report) {
  const groups = new Map();
  for (const result of report.results ?? []) {
    const key = JSON.stringify([
      result.scene,
      result.width,
      result.height,
      result.params,
    ]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  }
  return [...groups.values()].flatMap((runs) => {
    if (runs.some((r) => !r.passed)) return runs;
    const record = { ...runs[0], runs };
    for (const kind of ["webgpu", "babylon"]) {
      const samples = runs.flatMap((r) => r.records[kind]);
      record[kind] = Object.fromEntries(
        ["drawMs", "copyMs", "cpuMs", "completionMs"].map((key) => [
          key,
          summarize(samples.map((r) => r[key])),
        ]),
      );
      record[kind].totalGpuMs = summarize(
        samples.map((r) => r.drawMs + r.copyMs),
      );
    }
    record.physicsMean =
      runs.reduce((sum, r) => sum + r.physics.mean * r.physics.samples, 0) /
      runs.reduce((sum, r) => sum + r.physics.samples, 0);
    return [record];
  });
}
export function rendererReportMarkup(report) {
  const results = rendererComparisonGroups(report);
  return `<p><strong>${escape(report.hardwareLabel ?? "Your GPU")}</strong>. Smaller times are faster. Bars show typical GPU costs across the measured draws. Both renderers draw the same completed physics step. Physics settings stay the same. Differences under 0.02 ms or 5% are described as close.</p>${results
    .map((r) => {
      if (!r.passed)
        return `<article><h3>${escape(r.name ?? r.scene)}</h3><p>Failed: ${escape(r.error)}</p></article>`;
      const direct = r.webgpu.drawMs.median,
        babylon = r.babylon.drawMs.median,
        copy = r.babylon.copyMs.median,
        max = Math.max(direct, babylon + copy, 0.001),
        difference = r.babylon.totalGpuMs.median - r.webgpu.totalGpuMs.median,
        close =
          Math.abs(difference) <=
          Math.max(0.02, r.webgpu.totalGpuMs.median * 0.05);
      return `<article><h3><a href="../?demo=canonical&scene=${encodeURIComponent(r.scene)}&backend=gpu&renderer=babylon">${r.dimension}D · ${escape(r.name)} ↗</a></h3><p>${r.bodyCount.toLocaleString()} bodies · ${r.params.iterations} iterations · ${r.width} × ${r.height} pixels · ${r.runs.length} run${r.runs.length === 1 ? "" : "s"}, ${r.webgpu.drawMs.samples} measured draws per renderer</p>
    <p>Direct WebGPU: <strong>${ms(direct)} ms drawing</strong></p><div class="renderer-bar"><span style="width:${(direct / max) * 100}%"></span></div>
    <p>Babylon WebGPU: <strong>${ms(babylon)} ms drawing + ${ms(copy)} ms GPU copies</strong></p><div class="renderer-bar"><span style="width:${(babylon / max) * 100}%"></span><span class="copy" style="width:${(copy / max) * 100}%"></span></div>
    <p>${close ? "GPU costs are close here." : difference > 0 ? "Direct drawing uses less GPU time here." : "Babylon drawing and copies use less GPU time here."} Sending draws on the CPU takes ${ms(r.webgpu.cpuMs.median)} ms for direct WebGPU and ${ms(r.babylon.cpuMs.median)} ms for Babylon.</p>
    <p>Physics averages ${ms(r.physicsMean)} ms per step for both. Neither renderer downloads body poses or updates instance matrices on the CPU.</p>
    <details><summary>Full rendering wait and individual runs</summary><div class="table-wrap"><table><thead><tr><th>Renderer</th><th>CPU submission</th><th>Submit through GPU completion</th><th>Slower draws (95th percentile)</th></tr></thead><tbody>${["webgpu", "babylon"].map((k) => `<tr><td>${k === "webgpu" ? "Direct WebGPU" : "Babylon WebGPU"}</td><td>${ms(r[k].cpuMs.median)} ms</td><td>${ms(r[k].completionMs.median)} ms</td><td>${ms(r[k].drawMs.p95)} ms</td></tr>`).join("")}</tbody></table></div><p>Completion includes CPU work and waiting for the GPU. It is not displayed frame rate. These waits can overlap with other work in an application. GPU bars show drawing and copies separately.</p><div class="table-wrap"><table><thead><tr><th>Run</th><th>Direct GPU drawing</th><th>Babylon GPU drawing</th><th>Babylon GPU copies</th></tr></thead><tbody>${r.runs.map((run, i) => `<tr><td>${i + 1}</td><td>${ms(run.webgpu.drawMs.median)} ms</td><td>${ms(run.babylon.drawMs.median)} ms</td><td>${ms(run.babylon.copyMs.median)} ms</td></tr>`).join("")}</tbody></table></div></details></article>`;
    })
    .join("")}`;
}

export function rendererReportHTML(report, screenshots) {
  const gallery = `<details><summary>Babylon scene screenshots (${screenshots.results.length})</summary>${screenshots.results.map((r) => `<figure><a href="screenshots/babylon-${escape(r.scene)}.png"><img loading="lazy" alt="Babylon rendering of ${escape(r.scene)}" src="screenshots/babylon-${escape(r.scene)}.png" style="max-width:100%;height:auto"></a><figcaption>${escape(r.scene)}</figcaption></figure>`).join("")}</details>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AVBD renderer comparison</title><style>body{font:16px/1.6 system-ui;background:#f3f6fa;color:#243244;margin:0}main{max-width:1080px;margin:auto;padding:28px}article{background:white;padding:22px;margin:20px 0;border-radius:12px}a{color:#315ac9}.renderer-bar{display:flex;height:18px;background:#edf1f7;border-radius:5px;overflow:hidden}.renderer-bar span{background:#3e5bd7}.renderer-bar .copy{background:#c6783c}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:10px;border-bottom:1px solid #dde3ec}.table-wrap{overflow:auto}@media(max-width:600px){main{padding:16px 10px}article{padding:16px}}</style></head><body><main><nav><a href="../">← Back to main page</a> · <a href="../tests/performance.html#renderer-comparison">Run your own comparison</a> · <a href="solver-performance.html">Physics timings</a></nav><h1>Babylon and direct WebGPU rendering</h1><p>Blue is GPU drawing; orange is GPU-to-GPU copies. The renderers use the same physics state on the same device, camera, geometry and shaders at 960 × 540 pixels. Debug overlays and antialiasing are off. Each repeat warms up for 20 steps and measures 30 more, alternating renderer order. Each scene combines its repeats; individual runs are available below its bars.</p>${rendererReportMarkup(report)}<p>Measured ${escape(report.completed)}. <a href="renderer-performance.json">Raw measurements and method</a>. These are renderer timings, not a comparison with the paper or displayed FPS.</p>${gallery}</main></body></html>`;
}
