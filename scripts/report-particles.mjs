import { readFile } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";

const report = JSON.parse(
  await readFile("test-results/particle-capacity.json", "utf8"),
);
if (!report.passed || report.errors.length)
  throw Error("Particle capacity measurements are incomplete");
const escape = (v) =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const fmt = (v) => (Number.isFinite(v) ? v.toFixed(2) : "—");
const mean = (values) => {
  const finite = values.filter(Number.isFinite);
  return finite.length
    ? finite.reduce((a, b) => a + b, 0) / finite.length
    : null;
};
const groups = new Map();
for (const row of report.results.filter((r) => r.draw)) {
  if (!groups.has(row.count)) groups.set(row.count, []);
  groups.get(row.count).push(row);
}
const confirmed = [...groups].filter(
  ([, runs]) =>
    runs.filter((r) => r.phase === "confirmation").length >= 3 &&
    runs.every((r) => r.sustainable60),
);
const reliable = confirmed.sort((a, b) => b[0] - a[0])[0]?.[0];
report.confirmed60FpsCount = reliable ?? null;
await writeFile(
  "test-results/particle-capacity.json",
  JSON.stringify(report, null, 2),
);
const summary = reliable
  ? `${reliable.toLocaleString()} visible particles maintained about 60 FPS in every recorded run at that count, including three longer confirmation runs.`
  : "These measurements do not yet establish a repeat-confirmed 60 FPS particle limit.";
const failures = report.results.filter((r) => r.draw && !r.sustainable60);
const caveat = failures.length
  ? `Some runs missed the target from ${Math.min(...failures.map((r) => r.count)).toLocaleString()} particles upward. Near the limit, browser scheduling and GPU clocks can change the result.`
  : "Every measured count held the target. The tested capacity is a lower bound, not a measured frame-rate limit.";
const rows = [...groups]
  .sort((a, b) => a[0] - b[0])
  .map(
    ([count, runs]) =>
      `<tr><td>${count.toLocaleString()}</td><td>${runs.length}</td><td>${fmt(Math.min(...runs.map((r) => r.fps)))}–${fmt(Math.max(...runs.map((r) => r.fps)))}</td><td>${fmt(Math.max(...runs.map((r) => r.frames.p95)))}</td><td>${fmt(mean(runs.map((r) => r.collisionMs?.median)))}</td><td>${fmt(mean(runs.map((r) => r.spriteMs?.median)))}</td><td>${runs.every((r) => r.sustainable60) ? "60 FPS" : runs.some((r) => r.sustainable60) ? "Variable" : "Below 60 FPS"}</td></tr>`,
  )
  .join("");
const diagnostic = report.results
  .filter((r) => !r.draw)
  .map(
    (r) =>
      `<p>At ${r.count.toLocaleString()} particles with drawing disabled: <b>${fmt(r.fps)} FPS</b>, ${fmt(r.collisionMs?.median)} ms for the GPU collision pass. Compare the same visible count above to see the rendering cost.</p>`,
  )
  .join("");
const hardware =
  report.hardware ??
  report.info.adapter.description ??
  report.info.adapter.vendor;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>D20 particle capacity</title><style>body{font:16px/1.6 system-ui;color:#243244;background:#f3f6fa;margin:0}main{max-width:1100px;margin:auto;padding:28px}section{background:white;padding:22px;border-radius:12px;margin:20px 0}a{color:#315ac9}.scroll{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:12px;text-align:left;border-bottom:1px solid #dde3ec;white-space:nowrap}@media(max-width:600px){main{padding:16px 10px}section{padding:14px}}</style></head><body><main><nav><a href="../">← Back to main page</a> · <a href="../?demo=benchmark">Play the particle test</a> · <a href="solver-performance.html">Rigid-body timings</a></nav><h1>How many particles can run at 60 FPS?</h1><p><b>Saved hardware: ${escape(hardware)}.</b> ${escape(report.method.viewport)}.</p><section><p><b>${escape(summary)}</b></p><p>${escape(caveat)}</p><p>Every live particle is checked against the rotating D20's surfaces. Particles ignore one another. The sprites read positions directly from GPU memory. Changing camera coverage or resolution changes drawing work.</p></section><section><h2>Particles and drawing together</h2><p>Higher FPS is better; smaller milliseconds are faster. The FPS range includes every recorded run at each count. “Slower frames” is the worst p95 across those runs: 95% of frames fit within that time. GPU columns average the per-run median.</p><div class="scroll"><table><thead><tr><th>Particles</th><th>Runs</th><th>Overall FPS</th><th>Slower frames, ms</th><th>GPU collision, ms</th><th>GPU sprites, ms</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div></section><section><h2>Does drawing affect the limit?</h2>${diagnostic || "<p>No drawing-disabled measurement is recorded.</p>"}<p>Collision and sprite passes have separate GPU timestamps. Total frame time also includes the Babylon shield, browser compositing, CPU submission and display pacing. These stage times cannot simply be added to predict FPS.</p></section><section><h2>Repeat the measurement</h2><p>Run <code>npm run benchmark:particles</code>. The search increases particle count, refines the boundary and confirms it with three longer runs on each side. Each count warms up for ${report.method.warmupSeconds} seconds; search runs last ${report.method.measurementSeconds} seconds, confirmations ${report.method.confirmationSeconds} seconds.</p><p>${escape(report.method.pass)}</p><p>${escape(report.method.workload)}</p><p>This capacity applies to this surface-only particle workload. It does not describe how many colliding AVBD rigid bodies a scene can solve.</p><p>Measured ${escape(report.completed)}. <a href="particle-capacity.json">Download all measurements</a> · <a href="../scripts/benchmark-particles.mjs">Benchmark source</a> · <a href="../src/gpu/surfaceParticles.js">Reusable particle engine</a></p></section></main></body></html>`;
await writeFile("test-results/particle-capacity.html", html);
const readme = await readFile("README.md", "utf8");
const text = `<!-- particle-capacity-results:start -->\nSaved reference: **${hardware}**, ${report.method.viewport}. ${summary} ${caveat}\n<!-- particle-capacity-results:end -->`;
await writeFile(
  "README.md",
  readme.replace(
    /<!-- particle-capacity-results:start -->[\s\S]*?<!-- particle-capacity-results:end -->/,
    text,
  ),
);
console.log(`Particle report updated: ${summary}`);
