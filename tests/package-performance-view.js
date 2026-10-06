const ms = (value) => value.toFixed(2);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function packageReportMarkup(report) {
  const motionRows = report.runs
    .flatMap((run, repeat) =>
      (run.nativeEdits ?? [])
        .filter((r) => r.motion)
        .map(
          (r) =>
            `<tr><td>${repeat + 1}</td><td>${r.dimension}D</td><td>${r.bodies.toLocaleString()}</td><td>${ms(r.motion.objects.cpuSubmitMs)}</td><td>${ms(r.motion.commands.cpuSubmitMs)}</td><td>${ms(r.motion.packed.cpuSubmitMs)}</td><td>${(r.motion.packed.uploadedBytes / 1e6).toFixed(1)} MB</td></tr>`,
        ),
    )
    .join("");
  const propertyRows = report.runs
    .flatMap((run, repeat) =>
      (run.nativeOverhead ?? []).map(
        (r) =>
          `<tr><td>${repeat + 1}</td><td>${r.dimension}D</td><td>${r.bodies.toLocaleString()}</td><td>${ms(r.properties.perBodyFlush.cpuSubmitMs)}</td><td>${ms(r.properties.oneFlush.cpuSubmitMs)}</td><td>${r.properties.perBodyFlush.writeCalls.toLocaleString()} → ${r.properties.oneFlush.writeCalls}</td></tr>`,
      ),
    )
    .join("");
  const queryRows = report.runs
    .flatMap((run, repeat) =>
      (run.nativeOverhead ?? []).map(
        (r) =>
          `<tr><td>${repeat + 1}</td><td>${r.dimension}D</td><td>${r.queries.count}</td><td>${ms(r.queries.individualMs)}</td><td>${ms(r.queries.batchMs)}</td></tr>`,
      ),
    )
    .join("");
  const editRows = report.runs
    .flatMap((run, repeat) =>
      (run.nativeEdits ?? []).map(
        (r) =>
          `<tr><td>${repeat + 1}</td><td>${r.dimension}D</td><td>${r.bodies.toLocaleString()}</td><td>${ms(r.packed.cpuSubmitMs)}</td><td>${ms(r.packed.submitAndWaitMs)}</td><td>${(r.packed.uploadedBytes / 1e6).toFixed(1)} MB</td></tr>`,
      ),
    )
    .join("");
  const editReference = report.runs
    .flatMap((run, repeat) =>
      (run.nativeEdits ?? []).map(
        (r) =>
          `<li>Repeat ${repeat + 1}, ${r.dimension}D: <code>editBodies()</code> ${ms(r.commands.cpuSubmitMs)} ms; ${r.objects ? `individual body calls ${ms(r.objects.cpuSubmitMs)} ms; ` : ""}packed arrays ${ms(r.packed.cpuSubmitMs)} ms. Selected body records match exactly.</li>`,
      ),
    )
    .join("");
  const rows2D = report.runs
    .filter((r) => r.sleeping2D)
    .map((r, i) => {
      const s = r.sleeping2D;
      return `<tr><td>${i + 1}</td><td>${ms(s.awakePolicy.median)}</td><td>${ms(s.sleepPolicy.median)}</td><td>${((1 - s.sleepPolicy.median / s.awakePolicy.median) * 100).toFixed(1)}%</td><td>${s.sleeping.toLocaleString()}</td><td>${(s.maxPositionDifference * 100).toFixed(2)} cm</td></tr>`;
    })
    .join("");
  const rows = report.runs
    .filter((r) => r.sleeping)
    .map((run, i) => {
      const s = run.sleeping;
      return `<tr><td>${i + 1}</td><td>${ms(s.awakePolicy.median)}</td><td>${ms(s.sleepPolicy.median)}</td><td>${((1 - s.sleepPolicy.median / s.awakePolicy.median) * 100).toFixed(1)}%</td><td>${s.sleeping.toLocaleString()}</td><td>${(s.maxPositionDifference * 100).toFixed(2)} cm</td><td>${ms(s.awakePolicy.p95)} / ${ms(s.sleepPolicy.p95)}</td></tr>`;
    })
    .join("");
  const hardware =
    report.hardwareLabel ||
    report.adapter.description ||
    report.graphicsRenderer ||
    report.adapter.vendor;
  return `<p><strong>${escape(hardware || "GPU reported by this browser")}</strong> · ${report.repeats} independent repeats · ${escape(new Date(report.completed).toLocaleString())}</p>
    <h3>A resting stack: sleeping off versus on</h3>
    <p>16,384 one-metre boxes rest on a floor. Both runs use 10 solving rounds and the same 1/60-second step. Each settles for 420 steps, then records 30 steps after 10 warmups. Sleeping checks, support checks and waking are included in the time. Drawing is excluded.</p>
    ${rows ? `<div class="scroll"><table><thead><tr><th>Repeat</th><th>Sleep off ms</th><th>Sleep on ms</th><th>Less time</th><th>Boxes asleep</th><th>Largest position difference</th><th>Slower steps: off / on ms</th></tr></thead><tbody>${rows}</tbody></table></div>` : "<p>GPU timestamps are unavailable; sleeping times were not measured.</p>"}
    <p>Lower time is better. “Less time” compares typical steps (the median). “Slower steps” is the 95th percentile. Position difference is the largest change along any axis compared with keeping every box awake. Sleeping freezes quiet bodies, so their final poses can differ slightly. This resting scene does not represent an impact or the paper's brick-wall benchmark.</p>
    <details><summary>Cost of checking for sleep while everything is awake</summary><p>The first 24 steps have no sleeping bodies. Four warmups are excluded; the remaining 20 include sleep checks when enabled.</p><ul>${report.runs
      .filter((r) => r.sleeping)
      .map(
        (r, i) =>
          `<li>Repeat ${i + 1}: off ${ms(r.sleeping.awakeOverhead.withoutSleeping.median)} ms; on ${ms(r.sleeping.awakeOverhead.withSleeping.median)} ms.</li>`,
      )
      .join("")}</ul></details>
    ${
      rows2D
        ? `<h3>A resting 2D stack: sleeping off versus on</h3><p>10,000 boxes in ten layers, 10 solving rounds and 120 physics steps per simulated second. Timings include sleep, wake and support checks; drawing is excluded. Each run settles for 360 steps, then measures 30 steps after 10 warmups.</p><div class="scroll"><table><thead><tr><th>Repeat</th><th>Sleep off ms</th><th>Sleep on ms</th><th>Less time</th><th>Boxes asleep</th><th>Largest position difference</th></tr></thead><tbody>${rows2D}</tbody></table></div><details><summary>2D checks while all boxes are awake</summary><ul>${report.runs
            .filter((r) => r.sleeping2D)
            .map(
              (r, i) =>
                `<li>Repeat ${i + 1}: off ${ms(r.sleeping2D.awakeOverhead.withoutSleeping.median)} ms; on ${ms(r.sleeping2D.awakeOverhead.withSleeping.median)} ms.</li>`,
            )
            .join("")}</ul></details>`
        : ""
    }
    ${editRows ? `<h3>Updating 100,000 bodies together</h3><p>The recommended velocity path is <code>setLinearVelocities()</code> in both 2D and 3D. Each update submits one GPU dispatch and reuses its upload buffers. The table measures edit preparation and submission, plus a separate time until the GPU finishes those edits. It does not run physics solving or drawing. Five samples follow warmup, with alternating API order. Velocity-only object calls and bulk command calls also use compact uploads automatically; prebuilt arrays avoid preparing each command on the CPU.</p><div class="scroll"><table><thead><tr><th>Repeat</th><th>World</th><th>Bodies edited</th><th>CPU submission ms</th><th>Submission through GPU completion ms</th><th>Upload size</th></tr></thead><tbody>${editRows}</tbody></table></div><p>Lower time means faster edits. For mixed operations such as teleporting and applying world-point impulses, use <code>editBodies()</code>; the packed path is for velocity replacements.</p><details><summary>Individual calls and bulk command measurements</summary><ul>${editReference}</ul></details>` : ""}
    ${motionRows ? `<h3>Changing movement and spin together</h3><p>All three APIs set the same linear and angular velocities on 100,000 bodies. Object calls and <code>editBodies()</code> automatically use compact motion uploads; <code>setVelocities()</code> accepts reusable packed arrays. These are CPU preparation and submission times, with solving and drawing excluded. Selected records match exactly.</p><div class="scroll"><table><thead><tr><th>Repeat</th><th>World</th><th>Bodies</th><th>Object calls ms</th><th>Bulk records ms</th><th>Packed arrays ms</th><th>Upload size</th></tr></thead><tbody>${motionRows}</tbody></table></div>` : ""}
    ${propertyRows ? `<h3>Changing collision settings together</h3><p>Each run changes masks, trigger flags and bounce settings on 10,000 bodies. The first column flushes after every object. The second makes the same calls and flushes once at the end, as the next physics step does automatically. This compares batching choices in this package. Lower CPU time and fewer uploads mean less API overhead; solving and drawing are excluded.</p><div class="scroll"><table><thead><tr><th>Repeat</th><th>World</th><th>Bodies</th><th>Flush each object ms</th><th>Flush once ms</th><th>GPU upload calls</th></tr></thead><tbody>${propertyRows}</tbody></table></div>` : ""}
    ${queryRows ? `<h3>Asking several collision questions together</h3><p>64 rays query the same 10,000-body world. One run awaits each ray separately; the other uses <code>raycastAll()</code> once. Times include CPU work, GPU intersection checks and waiting for the answers. Hits match exactly. These are query times, separate from movement solving and drawing.</p><div class="scroll"><table><thead><tr><th>Repeat</th><th>World</th><th>Rays</th><th>One at a time ms</th><th>One batch ms</th></tr></thead><tbody>${queryRows}</tbody></table></div>` : ""}
    <h3>Copying just the bodies the renderer needs to draw</h3>
    <p>A world has 100,000 bodies, but only five meshes need their poses. Copying the whole body buffer transfers 16 MB; copying those five poses transfers 160 bytes. Both return exactly the same position and rotation values. Times include JavaScript, copying and waiting for the GPU, rather than movement solving.</p>
    <ul>${report.runs.map((r, i) => `<li>Repeat ${i + 1}: whole buffer ${ms(r.readback.full.median)} ms; five poses ${ms(r.readback.selected.median)} ms.</li>`).join("")}</ul>
    <p>Paper comparisons keep sleeping off. The browser benchmark measures your GPU; saved results describe their recorded machine.</p>`;
}
