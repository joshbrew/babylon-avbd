import { paperComparisonView } from "./paper-comparison-view.mjs";
import { hplocReportView } from "./hploc-report-view.mjs";
import { sleepReportView } from "./sleep-report-view.mjs";
import { capsuleReportView } from "./capsule-report-view.mjs";
const ms = (v) => v.toFixed(2);
const escape = (v) =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const labels = {
  collision: "Find touching objects",
  adjacency: "Prepare contacts",
  coloring: "Plan parallel work",
  solve: "Move objects",
  total: "Physics total",
};
export function solverReportView(report, rows, catalog, scheduling) {
  const ring = rows.find((r) => r.scene === "showcase-brick-ring-110k");
  const currentRun = (r) =>
    catalog?.results?.find((x) => x.passed && x.scene === r.scene);
  const selected = rows.map((r) => ({
    row: r,
    run: currentRun(r),
    timing: currentRun(r).summary,
  }));
  const max = Math.max(...selected.map((r) => r.timing.total.mean));
  const bar = (p) =>
    ["collision", "adjacency", "coloring", "solve"]
      .map(
        (k) =>
          `<span class="${k}" style="width:${(100 * p[k].mean) / max}%" title="${labels[k]}: ${ms(p[k].mean)} ms"></span>`,
      )
      .join("");
  const cards = selected
    .map(
      ({ row: r, run, timing: p }) =>
        `<article><h2><a href="/?demo=canonical&scene=${r.scene}&backend=gpu">${r.name} ↗</a></h2><p>${r.bodies.toLocaleString()} objects · ${r.iterations} solver iterations per step<br>Each step advances ${(1000 * run.params.dt).toFixed(2)} ms of simulated time (${Math.round(1 / run.params.dt)} steps per simulated second).<br><b>GPU AVBD · ${escape(report.adapter.model)}</b></p>
    <div class="chart-label">Physics per step <b>${ms(p.total.mean)} ms</b></div><div class="bar">${bar(p)}</div>
    <p>${p.solve.mean > p.collision.mean ? "Moving and rotating objects takes the most time." : "Finding collisions takes the most time."} Drawing is excluded.</p>
    <details><summary>Where the time goes</summary><div class="scroll"><table><thead><tr><th>Work</th><th>Milliseconds</th></tr></thead><tbody>${Object.keys(
      labels,
    )
      .map((k) => `<tr><td>${labels[k]}</td><td>${ms(p[k].mean)}</td></tr>`)
      .join("")}</tbody></table></div></details>
    <details><summary>Slower steps and solver settings</summary><p>95% of measured physics steps finish within ${ms(p.total.p95)} ms. ${p.total.n} separately timed steps.</p><pre>${escape(JSON.stringify(run?.params ?? r.params, null, 2))}</pre></details></article>`,
    )
    .join("");
  const accepted = catalog?.results?.filter((r) => r.passed) ?? [];
  const stress = accepted.filter((r) => r.scene.startsWith("2d-stress-"));
  const stressTable = stress.length
    ? `<section class="panel"><h2>Dense 2D collision loads</h2><p>Touching boxes fill a container. All three scenes use ten solver iterations at 60 steps per simulated second. These numbers measure physics; drawing is excluded. The last column shows whether finding contacts or calculating movement takes longer.</p><div class="scroll"><table><thead><tr><th>Boxes</th><th>Peak touching points</th><th>Collision ms</th><th>Movement ms</th><th>Physics ms</th><th>Larger cost</th></tr></thead><tbody>${stress.map((r) => `<tr><td>${(r.bodyCount - 3).toLocaleString()}</td><td>${r.peakContacts.toLocaleString()}</td><td>${ms(r.summary.collision.mean)}</td><td>${ms(r.summary.solve.mean)}</td><td>${ms(r.summary.total.mean)}</td><td>${r.summary.collision.mean > r.summary.solve.mean ? "Collision checks" : "Movement solver"}</td></tr>`).join("")}</tbody></table></div><p>Use contact count together with time to judge collision load. 2D boxes and 3D shapes generate different contacts and need different calculations, so matching object counts alone does not make an equivalent workload. <a href="../tests/performance.html">Play or benchmark these scenes ↗</a></p></section>`
    : "";
  const catalogSection = accepted.length
    ? `<section class="panel"><h2>Which scenes were checked?</h2><p>${accepted.length}/${catalog.results.length} scenes completed the benchmark and passed its basic correctness checks. Longer checks of how scenes move are in the <a href="report.html">scene report</a>.</p><p><a href="../tests/performance.html">Play scenes or run your own benchmark ↗</a> · <a href="solver-scenes.json">Download measurements</a></p><details><summary>Check counts and timing settings</summary><p>Checks require valid positions and rotations, enough contact storage and no constraints shared by objects solved in the same group. ${accepted.reduce((n, r) => n + r.verifiedSteps, 0).toLocaleString()} checked steps and ${accepted.reduce((n, r) => n + r.samples.length, 0).toLocaleString()} separately measured GPU steps. Each scene keeps its own timestep and solving-round count. Runs use ${catalog.warmup} warmup steps and ${catalog.samples} measured steps. Compare times only when the scene, settings, hardware and method match.</p></details></section>`
    : "";
  const sleepSection = sleepReportView(report.packageBenchmarks);
  const scheduleSection =
    scheduling?.summary && !scheduling.errors.length
      ? `<section class="panel"><h2>Letting settled bricks rest</h2><p>Sleeping skips movement work for settled bricks until something disturbs them. Related sleeping work is sent to the GPU together. Physics and sleeping take ${ms(scheduling.summary.batched.mean)} ms in the recorded 100K-wall run. Drawing is excluded.</p><details><summary>Sleeping checks</summary><p>Tests check that sleeping retains physical mass and that impacts or lost supports wake the affected objects. <a href="solver-sleep-batching.json">Download measurements</a></p></details></section>`
      : "";
  const contactSection = `<section class="panel" id="contact-scheduling"><h2>How GPU threads share the work</h2><p>The solver chooses a work layout for the scene. Sparse columns share the points where two faces touch. Dense rigid scenes with at least 250,000 objects and roughly two touching neighbours per object share each body's movement solve across eight threads. Very large scenes also keep short contact-list sorting keys close to the threads that use them.</p><p>These choices preserve collision rules, friction, rotation and solving rounds. Existing capacity checks provide the contact-load information; selection does not copy every object's position back to the CPU.</p></section>`;
  const protectionSection = `<section class="panel"><h2>Handling a step that cannot be solved safely</h2><p>If the 3D GPU solver runs out of room for contacts, or cannot put touching objects in separate work groups, it holds positions and velocities for that step. The app can then increase capacity. This avoids moving objects with missing collision information or moving two touching objects together before either knows what the other did.</p><p>A held step still fails the correctness checks. Valid steps use the same physics equations. Tests force both failure conditions, check that poses, velocities and joint forces stay intact, and verify that movement resumes after capacity grows. Moving platforms and a million-to-one mass ratio are checked too.</p></section>`;
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AVBD solver performance</title><style>
  *{box-sizing:border-box}body{margin:0;background:#edf1f6;color:#263548;font:15px/1.6 system-ui}main{max-width:1220px;margin:auto;padding:32px 24px}h1{font-size:36px;letter-spacing:-.04em;margin:12px 0}h2{font-size:21px;margin:0 0 10px}a{color:#315ec0;text-decoration:none}p{color:#526579}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:20px}.panel,article{background:white;padding:24px;border-radius:12px;border:1px solid #dde4ed;margin:22px 0}article{margin:0}.bar{display:flex;height:22px;background:#f0f3f7;border-radius:5px;overflow:hidden;margin:6px 0 14px}.bar span{display:block}.collision{background:#318479}.adjacency{background:#95aaa7}.coloring{background:#bd9c66}.solve{background:#5277cb}.sleep-off{background:#5277cb}.sleep-on{background:#318479}.legend{display:flex;gap:20px;flex-wrap:wrap;margin:20px 0}.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}.chart-label{display:flex;justify-content:space-between;gap:8px}.decision{font-weight:600;color:#2e634e}.slower{color:#9a5134}table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:10px 8px;border-bottom:1px solid #e4eaf1;text-align:right}td:first-child,th:first-child{text-align:left}pre{font:12px monospace;white-space:pre-wrap;overflow-wrap:anywhere}img{width:100%;border-radius:8px}figure{margin:0}details{margin-top:15px}.scroll{overflow:auto}@media(max-width:600px){main{padding:20px 12px}.grid{grid-template-columns:1fr}h1{font-size:29px}article,.panel{padding:16px}}
  </style><main><a href="/">← Back to main page</a> · <a href="report.html">Scene checks and drawing performance</a> · <a href="../tests/performance.html">Play scenes and run benchmarks</a>
  <h1>Solver performance</h1><p><b>Saved reference results: ${escape(report.adapter.model)}.</b> These timings were recorded on that GPU. Run the browser benchmark to measure your own computer; the paper&apos;s desktop RTX 4090 results are shown separately.</p>
  <section class="panel" id="solver-selection"><h2>The app chooses how to share GPU work</h2><p>AVBD looks at how many objects are in the scene, how they touch, and whether they are connected. It uses that information to divide the work across your graphics card. The app rechecks the choice when objects or connections change.</p><p>These choices keep friction, rotation and the number of solving rounds the same. Collision checks also choose between the grid and HPLOC++ tree automatically; the collision table below explains when each helps.</p><details><summary>Using automatic selection in Babylon.js</summary><p>Start with <code>AvbdPhysics.create({ scene })</code>. Automatic selection is the default. <code>world.solverDecision</code> explains the selected implementation. Selection follows measurements on the test laptop; the fastest layout can vary on other hardware. Deformable scenes keep their required fabric solver.</p></details></section>
  <section class="panel"><h2>Read this first</h2><p><b>Smaller time = faster simulation.</b> A millisecond (ms) is a thousandth of a second. The numbers show how long the graphics card takes to advance the simulation once. Think of it as making one new snapshot of where the objects belong.</p><p><b>Find touching objects:</b> work out what is colliding. <b>Move objects:</b> work out how they slide, spin and push each other. The smaller stages prepare those calculations and decide which objects can be worked on together.</p><p><b>Drawing is separate.</b> Making the picture is measured in the <a href="report.html">scene check report</a>. A slow number on this page comes from physics, not lighting or antialiasing.</p><p><b>For 60 updates a second, there is about 16.7 ms for each update.</b> That frame must include every physics step plus drawing. The ragdoll net runs at 240 physics steps per second, so it needs four steps per 60 Hz frame: multiply its per-step time by four before adding drawing time. A fast individual step does not guarantee 60 FPS.</p><details><summary>How times and slower steps are measured</summary><p>Tables show average GPU time per fixed simulation step. “p95” means 95 out of 100 measured steps fit within that time. It helps reveal occasional slower steps. GPU timings exclude CPU submission and copying measurements back.</p></details></section>
  ${catalogSection}${stressTable}
  <h2>Where physics time goes</h2><p>A shorter bar means less time. Each scene uses the automatically selected GPU AVBD implementation.</p><div class="legend">${["collision", "adjacency", "coloring", "solve"].map((k) => `<span><i class="${k}"></i>${labels[k]}</span>`).join("")}</div><div class="grid">${cards}</div>${sleepSection}${scheduleSection}
    ${capsuleReportView(report.capsuleBenchmark)}${contactSection}${protectionSection}${hplocReportView(report)}${paperComparisonView(report, ring, catalog)}
  <section class="panel"><h2>How we measured it</h2><p>The scene catalog and main timing charts start each scene fresh, with drawing and sleeping turned off. They use ${catalog?.warmup ?? 60} warmup steps followed by ${catalog?.samples ?? 30} measured steps. The separate collision comparisons include repeated runs. The separate sleeping charts compare sleeping enabled and disabled after objects settle; their settings appear beside the results. Close other GPU-heavy apps when repeating a benchmark.</p>${report.powerContext ? `<p>The scene catalog was rerun with the laptop plugged in, as reported by the operator. Laptop power settings can still affect GPU speed.</p>` : ""}<details><summary>Exact measurement method</summary><p>Hardware timestamps split GPU work into four passes, adding some measurement overhead. There is no frame-rate cap. CPU command submission and waiting for measurements are separate from GPU physics time. The live benchmark also records scene construction and CPU submission time in its downloaded results.</p>${report.powerContext ? `<p><a href="${escape(report.powerContext.diagnosticFile)}">GPU power diagnostic</a>: this snapshot was taken during later motion checks, not during the timed steps.</p>` : ""}<p>Browser: Chrome headless. GPU: ${escape(report.adapter.model)}. Driver: ${escape(report.adapter.driver)}. Raw measurements include per-step timings, settings and capacity checks. App FPS also depends on drawing, CPU work, waiting and display refresh.</p></details><p><a href="solver-scenes.json">Download measurements</a></p></section>
  <section class="panel"><h2>Drawing checks</h2><p>Colors, lighting and antialiasing improve the interactive view. They are disabled for benchmark rendering and absent from solver-only measurements. These screenshots show the independent visual checks.</p><div class="grid"><figure><img src="screenshots/mixed-gallery-settled.png" alt="Mixed shapes settled on the floor"><figcaption>Mixed shapes with GPU rotation.</figcaption></figure><figure><img src="screenshots/collision-sprites.png" alt="Visible particles striking a D20"><figcaption>D20 collision particles.</figcaption></figure><figure><img src="screenshots/columns-enhanced.png" alt="Colored blocks with enhanced lighting"><figcaption>Interactive presentation.</figcaption></figure><figure><img src="screenshots/columns-benchmark.png" alt="Blocks in benchmark rendering mode"><figcaption>Benchmark rendering.</figcaption></figure></div></section><p>Generated ${escape(report.completed)}. <a href="improvements.json">Visual checks</a> · <a href="gpu.json">GPU tests</a></p></main></html>`;
}
