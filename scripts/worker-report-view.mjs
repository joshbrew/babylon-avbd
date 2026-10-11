const names = {
  naval: "Ships, island and cloth sails",
  "showcase-box-columns-100k": "100K box columns",
  "2d-stress-pile-10k": "10K 2D pile",
  "3d-pyramid": "3D pyramid",
  "2d-pyramid": "2D pyramid",
  "2d-joint-grid": "2D joint grid",
  "3d-static-terrain": "Hills and overhang",
};
const scopes = ["main", "worker", "worker-sab"];
const timingNote =
  "Worker timings are estimates and can fluctuate with browser scheduling, background activity and GPU clock speeds. Repeat runs before judging small differences. Workers are generally less affected by busy page controls and other main-thread work, so updates can be steadier. They still share the computer’s resources and do not guarantee faster or more consistent GPU timings.";
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
function range(rows, metric, stat = "median") {
  const values = rows.map((row) => row[metric]?.[stat]).filter(Number.isFinite);
  if (!values.length) return "—";
  const low = Math.min(...values).toFixed(2),
    high = Math.max(...values).toFixed(2);
  return low === high ? low : `${low}–${high}`;
}
export function workerReportRows(report) {
  const groups = new Map();
  for (const row of report?.results ?? []) {
    if (row.errors?.length || row.counters?.overflow || row.counters?.clashes)
      continue;
    const key = `${row.scene}/${row.backend}/${row.renderer}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map((rows) => ({
    name: names[rows[0].scene] ?? rows[0].scene,
    scene: rows[0].scene,
    backend: rows[0].backend === "cpu" ? "CPU" : "WebGPU",
    renderer:
      rows[0].renderer === "babylon"
        ? "Babylon thin instances"
        : rows[0].renderer === "canvas"
          ? "Canvas 2D"
          : "Direct drawing",
    bodies: rows[0].bodies,
    iterations: rows[0].iterations,
    timing: scopes.map((scope) => {
      const matching = rows.filter((row) => row.scope === scope);
      return `${range(matching, "physicsMs")} / ${range(matching, "drawMs")}`;
    }),
    delay: scopes.map((scope) =>
      range(
        rows.filter((row) => row.scope === scope),
        "pageDelayMs",
        "p95",
      ),
    ),
  }));
}
export function workerReportMarkdown(report) {
  const rows = workerReportRows(report);
  const table = (metric) =>
    `| Scene · physics · drawing | Main thread | Dedicated worker | Worker + shared input |\n| --- | ---: | ---: | ---: |\n${rows.map((row) => `| ${row.name} · ${row.backend} · ${row.renderer} | ${row[metric].join(" | ")} |`).join("\n")}`;
  return `Physics per step / drawing per frame, in **milliseconds**. Each cell shows the range of the two runs’ medians. Compare execution modes within a row; different rows use different workloads.\n\n${table("timing")}\n\nPage delay p95, in **milliseconds**. Lower means the page’s controls get more frequent opportunities to respond. This includes browser timer scheduling.\n\n${table("delay")}\n\nRecorded on **Intel Core Ultra 7 155H / RTX 4070 Laptop GPU**. All modes use the same scene, timestep, iterations, canvas and renderer. Physics and rendering run together in the selected scope. SharedArrayBuffer carries input only; it does not share GPU buffers or parallelize the solver.`;
}
export function workerReportView(report) {
  if (!report?.passed) return "";
  const rows = workerReportRows(report);
  const table = (metric) =>
    `<div class="scroll"><table><thead><tr><th>Scene · physics · drawing</th><th>Main thread</th><th>Dedicated worker</th><th>Worker + shared input</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escape(row.name)} · ${row.backend}<br>${row.renderer} · ${row.bodies.toLocaleString()} objects · ${row.iterations} iterations</td>${row[metric].map((value) => `<td>${value}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return `<section class="panel" id="worker-comparison"><h2>Physics and drawing together in a worker</h2><p>Recorded on <b>Intel Core Ultra 7 155H / RTX 4070 Laptop GPU</b>. A dedicated worker keeps simulation and drawing off the page’s UI thread. The shared-input option uses SharedArrayBuffer for pointer updates when the site supports it.</p><p><b>Physics / drawing, in milliseconds.</b> Each cell shows physics per step, then drawing per frame. Ranges cover two runs’ medians. Compare modes within the same row.</p>${table("timing")}<p>${timingNote}</p><details><summary>How responsive was the page?</summary><p>Page delay p95, in milliseconds. Lower means fewer long gaps before controls get attention. Browser timer scheduling also contributes to these numbers.</p>${table("delay")}</details><p>Workers can improve UI responsiveness without making GPU physics faster. Shared input showed no consistent extra speedup. It does not share GPU buffers or run the solver across a worker pool.</p><p>Each mode uses a fresh scene, 30 warmup frames, 120 measured frames and 120 pointer updates per second, with no added page workload. <a href="../tests/workers.html">Play or measure any available mode</a> · <a href="worker-performance.json">Download results</a></p></section>`;
}
