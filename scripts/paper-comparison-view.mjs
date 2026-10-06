const ms = (n) => n.toFixed(2);
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const link = (id, text) =>
  `<a href="/?demo=canonical&scene=${id}&backend=gpu">${text} ↗</a>`;

export function paperComparisonView(report, ring, catalog) {
  const current =
    catalog?.results?.find((r) => r.passed && r.scene === ring.scene)
      ?.summary ?? ring.timing;
  const extra = (
    report.paperMeasurements?.runs ??
    catalog?.results ??
    []
  ).filter(
    (r) =>
      r.scene.startsWith("paper-") &&
      r.finite &&
      !r.counters.overflow &&
      !r.counters.clashes,
  );
  const walls = extra.filter((r) => r.scene.startsWith("paper-walls-"));
  const wall4 = walls.find((r) => r.params.iterations === 4);
  const wall3 = walls.find((r) => r.params.iterations === 3);
  const wallGap = wall4
    ? `<p><b>${escape(report.adapter.model.replace(/^NVIDIA GeForce /, ""))} takes ${(wall4.summary.total.mean / report.paper.walls.totalMs).toFixed(1)}× as long as the paper's reported total:</b> ${ms(wall4.summary.total.mean)} ms versus ${ms(report.paper.walls.totalMs)} ms. This is a substantial gap. Drawing is excluded, so simpler lighting would not fix it.</p><p>Of our ${ms(wall4.summary.total.mean)} ms, moving and rotating objects takes ${ms(wall4.summary.solve.mean)} ms, finding collisions takes ${ms(wall4.summary.collision.mean)} ms, and preparing contacts and arranging work takes ${ms(wall4.summary.adjacency.mean + wall4.summary.coloring.mean)} ms. Movement is the largest cost.</p>${wall3 ? `<p>The extra solving round explains only part of the difference: three rounds still take ${ms(wall3.summary.total.mean)} ms, or ${(wall3.summary.total.mean / report.paper.walls.totalMs).toFixed(1)}× the paper's total. We have not measured how much of the remaining gap comes from hardware, scene differences or implementation efficiency.</p>` : ""}`
    : "";
  const cloth = extra.find((r) => r.scene === "paper-cloth-35k");
  const row = (title, collision, movement, total) =>
    `<tr><td>${title}</td><td>${collision}</td><td>${movement}</td><td>${total}</td></tr>`;
  const table = (rows) =>
    `<div class="scroll"><table><thead><tr><th>Run</th><th>Find collisions, ms</th><th>Move + prepare, ms</th><th>All physics, ms</th></tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  const measured = (r) =>
    row(
      `${link(r.scene, `${r.params.iterations} rounds of solving`)} · ${escape(report.adapter.model.replace(/^NVIDIA GeForce /, ""))}`,
      ms(r.summary.collision.mean),
      ms(r.summary.total.mean - r.summary.collision.mean),
      ms(r.summary.total.mean),
    );
  return `<section class="panel" id="paper-comparison"><h2>How does this compare with the paper?</h2>
    <p><b>This section compares our browser measurements with numbers published by the paper's authors.</b> Browser rows use the app's GPU AVBD solver on a laptop. Paper rows use the authors' separate native implementation on a desktop GPU.</p>
    <p><b>Different computers and scenes affect these numbers.</b> The paper used a powerful desktop RTX 4090. These browser results use ${escape(report.adapter.model)}. The scenes and collision methods also differ. We need the same scene on the same graphics card to judge which implementation is faster.</p>
    <h3>110K bricks in a ring</h3><p>A ball knocks a hole through a circular brick wall. Smaller numbers mean the graphics card finishes the work sooner.</p>
    ${table([row("Paper · desktop RTX 4090", "6.30", "3.50", "9.80"), row(`Browser · ${escape(report.adapter.model.replace(/^NVIDIA GeForce /, ""))}`, ms(current.collision.mean), ms(current.total.mean - current.collision.mean), ms(current.total.mean))])}
    <p><b>What is “Move + prepare”?</b> Everything needed to move the objects once collisions have been found. Here, moving and rotating them takes ${ms(current.solve.mean)} ms; preparing contacts and arranging parallel work takes ${ms(current.adjacency.mean + current.coloring.mean)} ms. There is no drawing in either of those numbers.</p>
    <p><b>What takes the most time here?</b> ${current.solve.mean > current.collision.mean ? "Calculating movement. Finding collisions is quicker." : "Finding collisions. Calculating movement is quicker."} The paper finishes sooner overall, but this table cannot tell us how much of the gap comes from the graphics card versus the code.</p>
    ${
      walls.length
        ? `<h3>Half a million bricks</h3><p>Two heavy balls roll through rows of triangular walls. The browser builds 505,920 bricks, close to the paper's roughly 510K objects.</p>
      ${table([row("Paper · desktop RTX 4090", "7.30", "10.30", "17.60"), ...walls.map(measured)])}
      ${wallGap}
      <p>The paper lists three solving rounds in its table and four in its picture caption. Both browser versions are available so you can see the cost of that extra round. These are reconstructed walls, rather than the paper's original scene file.</p>`
        : ""
    }
    ${
      cloth
        ? `<h3>Blocks falling onto fabric</h3><p>${link(cloth.scene, "Play the fabric scene")}. 35,000 blocks, joined together by 72,000 joints, land on fabric containing 10,000 points. The fabric bends and stretches as it catches them.</p>
      <p><b>Paper: 16.00 ms. Browser: ${ms(cloth.summary.total.mean)} ms for all physics.</b> This is a different fabric model, so the smaller browser number does not establish that our solver beats the paper.</p>
      <p>Our fabric uses elastic links between its points. Collisions check small spheres at those points. The drawn sheet has 19,602 triangles, but its triangles are not collision surfaces. Very small objects or stretched gaps can pass between the samples.</p>
      <details><summary>Fabric timings and exact workload</summary>${table([measured(cloth)])}<p>Cloth: ${cloth.workload.clothSprings.toLocaleString()} stretch, shear and bending springs, 396 fixed border points, and 9,604 movable points. Cloth points have three movement directions and no rigid rotation. Blocks retain all six movement and rotation directions. Cloth forces, rigid joints and contacts share the same ten AVBD iterations. The paper's exact material, collision geometry and assets are not reproduced.</p></details>`
        : ""
    }
    <details><summary>Hardware, solver settings and comparison limits</summary>
      <p>The desktop 4090 has more processing and memory resources than a 4070 Laptop GPU: 16,384 versus 4,608 CUDA cores and a 384-bit GDDR6X versus 128-bit GDDR6 memory interface. These differences matter, but they do not give an exact speed multiplier. <a href="https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/">Desktop specifications</a> · <a href="https://www.nvidia.com/en-us/geforce/laptops/compare/">Laptop specifications</a></p>
      <p>Both ring runs use four iterations and a 1/60 second step. The paper uses DirectX 11 and an LBVH; the browser uses WebGPU and a spatial hash grid. The paper lists α=.95, β=10, γ=.99. The port uses α=.99, βlinear=10000, βangular=100, γ=.999 and mass-scaled initial contact penalties. The wall reconstruction uses a 20-metre-deep ground slab with the same top surface, rather than an infinite ground plane. Collision detection is discrete; this benchmark does not provide CCD.</p>
      <p>“Move + prepare” is the total minus collision time. It includes warm starts, movement solving, velocity updates, contact setup and work scheduling. Browser timing excludes initial clears and CPU writes. The ring ends with about 1.21 million contact points; a matching paper contact count is unavailable. Reading measurements between steps can affect GPU clock speeds; clocks were not recorded.</p>
      <p>The larger browser examples use 60 warmup steps followed by 30 separately timed steps, with every step checked. Their timings describe the first 1.5 seconds of motion; later piles can cost more. Paper wall collision time is calculated as 17.6−10.3=7.3 ms. The paper supplies no separate cloth collision/solve times.</p>
    </details><p><a href="${report.paper.source}">Read the AVBD paper ↗</a> · <a href="solver-paper.json">Download larger-scene measurements</a></p>
  </section>`;
}
