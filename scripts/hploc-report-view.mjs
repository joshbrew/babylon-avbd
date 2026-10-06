import { ragdollReportView } from "./ragdoll-report-view.mjs";
const ms = (n) => n.toFixed(2);
const name = (id) =>
  ({
    "3d-mixed-sizes-1k": "Mixed sizes · 1K",
    "3d-mixed-sizes-10k": "Mixed sizes · 10K",
    "3d-mixed-sizes-50k": "Mixed sizes · 50K",
    "showcase-brick-ring-110k": "Brick ring · 110K",
    "showcase-box-columns-100k": "Columns · 100K",
    "paper-walls-510k-4": "Brick walls · 506K",
  })[id] ?? id;
export function hplocReportView(report) {
  const data = report.hploc;
  if (!data) return "";
  const rows = data.summary
    .map(
      (r) =>
        `<tr><td><a href="/?demo=canonical&scene=${r.scene}&backend=gpu&broadphase=hploc">${name(r.scene)} ↗</a><br><small>${r.iterations} solving rounds · ${Math.round(1 / r.timeStep)} steps per simulated second</small></td><td>${ms(r.grid.total)}</td><td>${ms(r.hploc.total)}</td><td>${Math.abs(r.saving).toFixed(1)}% ${r.saving > 0 ? "less" : "more"} time</td><td>${r.scene.startsWith("3d-mixed-sizes-") && !r.scene.endsWith("-1k") ? "Tree" : "Grid"}</td><td>${r.noisyRuns ? `${r.noisyRuns} noisy run${r.noisyRuns > 1 ? "s" : ""}; inspect repeats` : "Movement times stayed similar"}</td></tr>`,
    )
    .join("");
  const detail = report.solverDetail?.comparisons?.[0]?.results?.find(
    (r) => r.variant === "grid-detail",
  );
  const breakdown = detail
    ? `<h3>What still costs time in the half-million wall?</h3><p>These extra timers separate the movement work into smaller jobs. Moving and rotating bodies costs <b>${ms(detail.details.bodySolve.mean)} ms</b>; updating contact forces costs <b>${ms(detail.details.contactUpdate.mean)} ms</b>. Finding nearby pairs costs ${ms(detail.details.broadphasePairs.mean)} ms, and checking their exact contacts costs ${ms(detail.details.narrowphase.mean)} ms. Improving only the collision tree cannot remove the movement cost.</p><details><summary>Detailed wall timing method</summary><p>A separate paired run with more timestamp boundaries, 60 warmup and 60 timed steps. It uses the same four solving rounds. Do not add these values to a different run's table. <a href="solver-solver-detail.json">Download detailed samples</a></p></details>`
    : "";
  const motion = report.hplocMotion
    ? `<h3>Does the tree still handle impacts and settling?</h3><p>Five heavy scenes each completed 360 checked steps—six simulated seconds—with the tree selected. Positions and rotations stayed valid, contacts fit, and parallel work had no conflicts. The half-million walls away from the ball paths retained their support. <a href="hploc-motion-hploc.json">Read the checks</a> · <a href="screenshots/paper-walls-510k-4-hploc-360.png">See the half-million impact</a></p>`
    : "";
  return `<section class="panel" id="gpu-tree"><h2>When does a collision tree help?</h2><p>A grid sorts objects into fixed-size cells. A tree groups nearby shapes in boxes that fit them. Long beams can make grid cells much bigger than the small objects around them; the tree avoids checking so many unrelated neighbours.</p><p><b>Automatic selection uses the tree for large, varied-size scenes and nets made from many linked thin plates.</b> These workloads make the grid check too much empty space. Body count alone does not choose the tree. Small scenes and uniform walls or columns retain the grid. Automatic choice follows scene geometry rules. The paired timings help you choose a different method for your machine in the lab or benchmark.</p><div class="scroll"><table><thead><tr><th>Scene</th><th>Grid physics, ms</th><th>Tree physics, ms</th><th>Measured difference</th><th>Automatic choice</th><th>Timing consistency</th></tr></thead><tbody>${rows}</tbody></table></div><p>Each row compares the same scene and solving rounds. Drawing and sleeping are excluded. Both simulations stay in GPU memory, so these paired times are separate from the single-world paper comparison. Noisy repeats are retained, rather than removed to improve the result.</p><details><summary>Rebuilds, memory and repeat results</summary><p>Three paired runs per scene, 60 warmup and 60 timed steps per method. Execution order alternates each step. Every collider and tree bound is updated each step; the tree is rebuilt every 64 steps. Timed windows include periodic rebuilds. The first build is recorded separately in the JSON, along with primary buffer bytes and all samples. Timing checks flag a difference over 10% in the unchanged movement stage. The automatic threshold is a conservative policy from these workloads, not a guaranteed crossover for every scene or GPU.</p>${data.summary.map((r) => `<p><b>${name(r.scene)}</b>: ${r.repeats.map((v) => `${v.toFixed(1)}%`).join(", ")} total-time savings. Tree buffers: ${(r.extraBytes / 1048576).toFixed(1)} MiB. First tree step: ${ms(r.firstTreeStep)} ms. Warm rebuild steps: ${ms(r.meanRebuildStep)} ms on average; slowest recorded tree step: ${ms(r.maxTreeStep)} ms.</p>`).join("")}<p>This is a portable hierarchical PLOC treelet builder with stackless traversal, not the paper's single-launch implementation. The same narrowphase, friction, rotation and AVBD equations follow both paths. Pair-set tests cover shapes, filters, giant statics and teleports; physical tests cover joints, floor support, sleeping and wake-up.</p></details>${ragdollReportView(report.ragdollCollision)}${breakdown}${motion}<p><a href="solver-hploc.json">Download every grid/tree sample</a> · <a href="../tests/performance.html">Play or compare scenes ↗</a></p></section>`;
}
