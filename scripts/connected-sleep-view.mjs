export function connectedSleepView(data) {
  if (!data?.results?.length) return "";
  if (
    data.results.some(
      (r) =>
        r.errors.length ||
        r.results.some((w) => w.belowFloor || w.quatError > 2e-4),
    )
  )
    throw Error("Invalid connected-sleep measurements");
  const hardware = String(data.hardware ?? "the recorded GPU")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;");
  const runs = (islands) =>
    data.results.flatMap((r) => r.results.filter((w) => w.islands === islands));
  const medianMean = (islands, phase) => {
    const a = runs(islands);
    return a.reduce((n, w) => n + w[phase].median, 0) / a.length;
  };
  const whole = medianMean(false, "settled"),
    groups = medianMean(true, "settled");
  const chart = (label, value, className) =>
    `<div class="chart-label">${label}<b>${value.toFixed(2)} ms</b></div><div class="bar" role="img" aria-label="${label}: ${value.toFixed(2)} milliseconds"><span class="${className}" style="width:${(100 * value) / whole}%"></span></div>`;
  return `<section class="panel" id="connected-sleep"><h2>500K walls: wake the walls that get hit</h2>
  <p>An impact can wake every object, or just the objects connected to the hit. Keeping untouched walls asleep saves work while the cannonballs continue moving. Sleeping is enabled in both runs.</p>
  ${chart("Wake the whole world", whole, "sleep-off")}${chart("Wake connected groups", groups, "sleep-on")}
  <p><b>${(100 * (1 - groups / whole)).toFixed(1)}% less GPU physics time in the later impact phase.</b> These times include collision detection, movement and sleep checks. Drawing is excluded. This comparison uses ${hardware}.</p>
  <div class="scroll"><table><thead><tr><th>Same scene, different waking policy</th><th>All objects awake</th><th>Later impacts</th><th>Objects asleep at the end</th></tr></thead><tbody>${[false, true].map((islands) => `<tr><td>${islands ? "Wake connected groups" : "Wake the whole world"}</td><td>${medianMean(islands, "awake").toFixed(2)} ms</td><td>${medianMean(islands, "settled").toFixed(2)} ms</td><td>${Math.round(runs(islands).reduce((s, w) => s + w.sleep.sleeping, 0) / runs(islands).length).toLocaleString("en-US")}</td></tr>`).join("")}</tbody></table></div>
  <p>Group tracking adds some work while everything is awake. Its benefit comes from keeping unrelated objects asleep. The paper comparison elsewhere uses awake scenes and measures different work.</p>
  <details><summary>Settings and correctness checks</summary><p>${data.results.length} paired runs of 505,923 objects, four iterations at 60 simulation steps per second, ${data.results[0].steps} steps per world. Both policies use speed threshold 0.03 and sleep delay 0.1 seconds after the initial awake measurement. Values above average the median time from each run. The shared floor does not connect separate walls. Groups retain earlier connections until an explicit edit resets them. All poses were finite, rotations valid, no contact overflow or coloring conflicts, and no objects fell below the solid ground.</p><p><a href="connected-sleep-performance.json">Download measurements</a></p></details></section>`;
}
