import { PerformancePreview } from "./performance-preview.js";
import { solverModeLabels } from "../src/gpu/solverPolicy.js";
import { packageReportMarkup } from "./package-performance-view.js";
import { rendererReportMarkup } from "./renderer-performance-view.js";
const $ = (id) => document.getElementById(id);
const phases = ["collision", "adjacency", "coloring", "solve"];
const labels = {
  collision: "Collision checks",
  adjacency: "Contact setup",
  coloring: "Work scheduling",
  solve: "Movement solver",
};
const cell = (row, text) => {
  const td = document.createElement("td");
  td.textContent = text;
  row.append(td);
  return td;
};
const number = (id, min, max) => {
  const value = Number($(id).value);
  if (!Number.isInteger(value) || value < min || value > max)
    throw Error(`${id} must be an integer between ${min} and ${max}`);
  return value;
};

export function mountPerformanceView(runner) {
  if (!$("run-all")) return;
  for (const scene of runner.scenes) {
    const option = document.createElement("option");
    option.value = scene.id;
    option.textContent = `${scene.dimension}D · ${scene.name}`;
    $("scene").append(option);
  }
  $("scene").value = "showcase-brick-ring-28k";
  $("adapter").textContent =
    `GPU: ${runner.info.vendor} ${runner.info.architecture} · ${runner.scenes.length} scenes available`;
  $("status").textContent =
    "Ready. Close other GPU workloads for comparable measurements.";
  let stopped = false;
  const state = { running: false, done: false, results: [], errors: [] };
  const preview = new PerformancePreview();
  const previewAction = (promise) =>
    promise?.catch((error) => {
      $("preview-message").hidden = false;
      $("preview-message").textContent = error.message;
    });
  const solverControls = () => {
    $("variant").value = "production";
    $("run-all").disabled = false;
  };
  const loadPreview = () => {
    solverControls();
    return preview.load(
      $("scene").value,
      preview.state.paused,
      $("broadphase").value,
      "auto",
      $("renderer").value,
    );
  };
  $("scene").onchange = () => {
    if (!state.running) previewAction(loadPreview());
  };
  $("broadphase").onchange = $("scene").onchange;
  $("variant").onchange = $("scene").onchange;
  $("renderer").onchange = $("scene").onchange;
  $("preview-pause").onclick = () => preview.pause();
  $("preview-step").onclick = () => previewAction(preview.step());
  $("preview-reset").onclick = () => previewAction(loadPreview());
  $("preview-fit").onclick = () => previewAction(preview.fit());
  $("preview-shoot").onclick = () => previewAction(preview.shoot());
  const controls = [
    "scene",
    "variant",
    "broadphase",
    "detailed",
    "warmup",
    "samples",
    "repeats",
    "run-all",
    "run-selected",
    "run-package-benchmark",
    "renderer",
    "run-renderers",
    "run-all-renderers",
  ];
  const render = (result) => {
    const row = document.createElement("tr");
    row.dataset.scene = result.scene;
    const name = cell(row, ""),
      link = document.createElement("a");
    const scene = runner.scenes.find((s) => s.id === result.scene);
    link.href = `/?demo=canonical&scene=${encodeURIComponent(result.scene)}&backend=gpu&quality=benchmark`;
    link.textContent = `${scene.dimension}D · ${scene.name}`;
    name.append(link);
    const interval = document.createElement("small");
    interval.style.display = "block";
    if (result.params?.dt)
      interval.textContent = `${(result.params.dt * 1000).toFixed(2)} ms simulated per step`;
    name.append(interval);
    if (result.solverDecision) {
      const description = document.createElement("small");
      description.style.display = "block";
      description.textContent =
        solverModeLabels[result.solverDecision.selected];
      description.title = result.solverDecision.reason;
      name.append(description);
    }
    cell(row, result.passed ? "Checks passed" : "Failed").className =
      result.passed ? "passed" : "failed";
    cell(row, result.bodyCount?.toLocaleString() ?? "—");
    cell(row, result.peakContacts?.toLocaleString() ?? "—");
    cell(row, result.params?.iterations ?? "—");
    const bar = document.createElement("div");
    bar.className = "stagebar";
    cell(row, "").append(bar);
    if (result.passed) {
      for (const phase of phases) {
        const span = document.createElement("span");
        span.className = phase;
        span.style.width = `${(100 * result.summary[phase].mean) / result.summary.total.mean}%`;
        span.title = `${labels[phase]}: ${result.summary[phase].mean.toFixed(3)} ms`;
        bar.append(span);
      }
    }
    for (const value of [
      result.summary?.total.mean,
      result.summary?.total.p95,
      result.summary?.collision.mean,
      result.summary?.solve.mean,
      result.summary?.wall.mean,
    ])
      cell(row, value?.toFixed(3) ?? "—");
    $("results").append(row);
    $("details").textContent = JSON.stringify(
      state.results.map((r) => ({
        scene: r.scene,
        repeat: r.repeat,
        kernel: r.kernel,
        solverDecision: r.solverDecision,
        schedulingDecision: r.schedulingDecision,
        cachedAdjacency: r.cachedAdjacency,
        setup: r.setup,
        cpuSubmission: r.summary?.submission,
        broadphase: r.broadphase,
        broadphaseDecision: r.broadphaseDecision,
        detailedTimes: r.details,
        bvh: r.bvh,
        params: r.params,
        capacity: r.capacity,
        counters: r.counters,
        verifiedSteps: r.verifiedSteps,
        quaternionError: r.quaternionError,
        error: r.error,
      })),
      null,
      2,
    );
  };
  async function run(all) {
    if (state.running) return;
    const warmup = number("warmup", 0, 600),
      samples = number("samples", 1, 600),
      repeats = number("repeats", 1, 10);
    const variant = $("variant").value;
    const scenes = all
      ? runner.scenes
      : runner.scenes.filter((s) => s.id === $("scene").value);
    Object.assign(state, {
      running: true,
      done: false,
      results: [],
      errors: [],
      started: new Date().toISOString(),
      adapter: runner.info,
      method:
        "Distinct GPU phase timestamps, fresh scene per repeat, no rendering/sleeping, every step checked",
      warmup,
      samples,
      repeats,
      variant,
    });
    stopped = false;
    $("results").replaceChildren();
    for (const id of controls) $(id).disabled = true;
    $("stop").disabled = false;
    $("download").disabled = true;
    $("progress").value = 0;
    $("progress").max = scenes.length * repeats;
    try {
      $("status").textContent = "Closing preview before measurements…";
      await preview.stop();
      for (const scene of scenes) {
        for (let repeat = 0; repeat < repeats; repeat++) {
          if (stopped) break;
          $("status").textContent =
            `Running ${scene.dimension}D ${scene.name} · repeat ${repeat + 1}/${repeats}`;
          try {
            const result = await runner.run(
              scene.id,
              variant,
              warmup,
              samples,
              {
                broadphase: $("broadphase").value,
                detailed: $("detailed").checked,
              },
            );
            state.results.push({ ...result, repeat, passed: true });
          } catch (error) {
            state.results.push({
              scene: scene.id,
              repeat,
              passed: false,
              error: error.message,
            });
            state.errors.push(`${scene.id}: ${error.message}`);
          }
          render(state.results.at(-1));
          $("progress").value = state.results.length;
        }
        if (stopped) break;
      }
    } finally {
      state.cancelled = stopped;
      state.completed = new Date().toISOString();
      state.errors.push(...runner.errors);
      $("stop").disabled = true;
      $("download").disabled = !state.results.length;
      $("status").textContent =
        `${stopped ? "Stopped" : "Complete"}: ${state.results.filter((r) => r.passed).length}/${state.results.length} passed.`;
      await loadPreview();
      state.running = false;
      for (const id of controls) $(id).disabled = false;
      solverControls();
      state.done = true;
    }
    return state;
  }
  const start = (all) =>
    run(all).catch((error) => {
      $("status").textContent = error.message;
    });
  $("run-all").onclick = () => start(true);
  $("run-selected").onclick = () => start(false);
  const runPackage = async () => {
    if (state.running) return;
    const repeats = number("repeats", 1, 10);
    state.running = true;
    stopped = false;
    for (const id of controls) $(id).disabled = true;
    $("stop").disabled = false;
    try {
      await preview.stop();
      $("package-results").textContent = "Measuring…";
      const report = await runner.runPackageBenchmarks({
        repeats,
        shouldStop: () => stopped,
        onProgress: (text) => {
          $("status").textContent = text;
        },
      });
      $("package-results").innerHTML = packageReportMarkup(report);
      $("package-download").disabled = false;
      $("package-download").onclick = () => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(report, null, 2)], {
            type: "application/json",
          }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "avbd-native-api-benchmarks.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      $("status").textContent =
        "Sleeping, bulk-edit and pose-copy benchmarks complete.";
      return report;
    } catch (error) {
      $("package-results").textContent =
        error.name === "AbortError" ? "Benchmark stopped." : error.message;
      $("status").textContent = $("package-results").textContent;
      throw error;
    } finally {
      $("stop").disabled = true;
      try {
        await loadPreview();
      } finally {
        state.running = false;
        for (const id of controls) $(id).disabled = false;
      }
    }
  };
  $("run-package-benchmark").onclick = () => runPackage().catch(() => {});
  const runRenderers = async (all = false) => {
    if (state.running) return;
    const warmup = number("warmup", 0, 600),
      samples = number("samples", 1, 600),
      repeats = number("repeats", 1, 10);
    const report = {
      started: new Date().toISOString(),
      adapter: runner.info,
      results: [],
      errors: [],
    };
    const scenes = all
      ? runner.scenes
      : runner.scenes.filter((s) => s.id === $("scene").value);
    state.running = true;
    stopped = false;
    for (const id of controls) $(id).disabled = true;
    $("stop").disabled = false;
    let rendererSession;
    try {
      await preview.stop();
      rendererSession = await runner.createRendererSession();
      for (let repeat = 1; repeat <= repeats; repeat++)
        for (const scene of scenes) {
          if (stopped) break;
          $("status").textContent =
            `Comparing renderers: ${scene.name} · repeat ${repeat}/${repeats}`;
          try {
            report.results.push({
              ...(await runner.runRenderers(scene.id, {
                session: rendererSession,
                warmup,
                samples,
                broadphase: $("broadphase").value,
                shouldStop: () => stopped,
              })),
              repeat,
            });
          } catch (error) {
            if (error.name === "AbortError") {
              stopped = true;
              break;
            }
            report.results.push({
              scene: scene.id,
              name: scene.name,
              passed: false,
              error: error.message,
              repeat,
            });
            report.errors.push(`${scene.id}: ${error.message}`);
          }
          $("renderer-results").innerHTML = rendererReportMarkup(report);
        }
      report.completed = new Date().toISOString();
      report.cancelled = stopped;
      $("renderer-download").disabled = !report.results.length;
      $("renderer-download").onclick = () => {
        const url = URL.createObjectURL(
          new Blob([JSON.stringify(report, null, 2)], {
            type: "application/json",
          }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "avbd-renderer-benchmarks.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      $("status").textContent =
        `Renderer comparison ${stopped ? "stopped" : "complete"}: ${report.results.filter((r) => r.passed).length}/${report.results.length} passed.`;
      return report;
    } finally {
      await rendererSession?.dispose();
      $("stop").disabled = true;
      try {
        await loadPreview();
      } finally {
        state.running = false;
        for (const id of controls) $(id).disabled = false;
      }
    }
  };
  $("run-renderers").onclick = () =>
    runRenderers().catch((error) => {
      $("status").textContent = error.message;
    });
  $("run-all-renderers").onclick = () =>
    runRenderers(true).catch((error) => {
      $("status").textContent = error.message;
    });
  $("stop").onclick = () => {
    stopped = true;
    $("stop").disabled = true;
  };
  $("download").onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "avbd-browser-benchmarks.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  for (const id of controls) $(id).disabled = false;
  globalThis.__BENCHMARK_VIEW__ = {
    state,
    runAll: () => run(true),
    runSelected: () => run(false),
    runPackage,
    runRenderers,
    preview,
    suspendPreview: () => preview.stop(),
  };
  previewAction(loadPreview());
  fetch("../test-results/solver-scenes.json")
    .then(async (response) => {
      if (!response.ok) return;
      const saved = await response.json();
      if (state.running || state.results.length || !saved.results?.length)
        return;
      Object.assign(state, saved, { running: false, done: false });
      for (const result of state.results) render(result);
      $("download").disabled = false;
      $("progress").max = state.results.length;
      $("progress").value = state.results.length;
      $("status").textContent =
        `Saved run: ${state.results.filter((r) => r.passed).length}/${state.results.length} passed · ${new Date(saved.completed).toLocaleString()}`;
    })
    .catch(() => {});
}
