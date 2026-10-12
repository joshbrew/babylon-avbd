import { labMarkup } from "./view.js";
import { sceneLoading } from "./loading.js";
import { canonicalScenes } from "./scenes.js";
import { createSimulationClient } from "../shared/runtime/simulationClient.js";
import { galtonChart } from "../galton-board/statistics.js";
import { readStepRate } from "../shared/runtime/stepRate.js";

/** Keep the laboratory controls on the page while physics and drawing run offscreen. */
export async function startWorkerLab(root, query) {
  root.innerHTML = labMarkup;
  const $ = (selector) => root.querySelector(selector),
    scene = $("#lab-scene"),
    backend = $("#lab-backend"),
    renderer = $("#lab-renderer"),
    view = $(".lab-view");
  let client,
    loading = false,
    disposed = false,
    paused = query.get("paused") === "1",
    status;
  let stepRateOverride = readStepRate(query.get("hz")),
    defaultStepRate;
  const diagnostics = { ready: false, scope: "worker", errors: [] };
  const samples = [];
  function drawChart(data) {
    const chart = $(".lab-chart"),
      c = chart.getContext("2d");
    samples.push([data.profile?.total, data.profile?.collision, data.drawMs]);
    if (samples.length > 120) samples.shift();
    c.clearRect(0, 0, chart.width, chart.height);
    const max = Math.max(16.7, ...samples.flat().filter(Number.isFinite));
    ["#3e5bd7", "#297652", "#c6783c"].forEach((color, channel) => {
      c.strokeStyle = color;
      c.beginPath();
      samples.forEach((sample, i) => {
        const x = (i / 119) * chart.width,
          y =
            chart.height -
            4 -
            ((sample[channel] ?? 0) / max) * (chart.height - 8);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      c.stroke();
    });
  }
  for (const [kind, name] of [
    ["play", "Playable physics"],
    ["paper", "Paper workloads"],
    ["showcase", "GPU showcase"],
    [3, "3D solver tests"],
    [2, "2D solver tests"],
  ]) {
    const group = document.createElement("optgroup");
    group.label = name;
    for (const s of canonicalScenes.filter((s) =>
      kind === "play"
        ? s.playDemo
        : kind === "paper"
          ? s.paper
          : kind === "showcase"
            ? s.showcase
            : s.dimension === kind && !s.playDemo && !s.paper && !s.showcase,
    ))
      group.append(new Option(s.name, s.id));
    scene.append(group);
  }
  scene.value = canonicalScenes.some((s) => s.id === query.get("scene"))
    ? query.get("scene")
    : query.get("demo") === "gpu-stress"
      ? "3d-100k-rook-impact"
      : query.get("demo") === "cannon"
        ? "3d-castle-siege"
        : "showcase-brick-ring-28k";
  backend.add(new Option("WebGPU · AVBD", "gpu"));
  backend.add(new Option("CPU · AVBD", "cpu"));
  backend.value = ["ref", "cpu"].includes(query.get("backend")) ? "cpu" : "gpu";
  renderer.value = query.get("renderer") === "babylon" ? "babylon" : "webgpu";
  $("#lab-backend-help").textContent =
    "WebGPU is the default. CPU runs the same scene for compatibility; large CPU scenes can be very slow.";
  $("#lab-enhanced").checked = query.get("quality") !== "benchmark";
  $("#lab-broadphase").value = query.get("broadphase") ?? "auto";
  const execution = document.createElement("select"),
    label = document.createElement("label");
  label.textContent = "Execution ";
  label.append(execution);
  $("#lab-execution").append(label);
  execution.add(new Option("Main thread", "main"));
  execution.add(new Option("Dedicated worker", "worker"));
  if (crossOriginIsolated && typeof SharedArrayBuffer === "function")
    execution.add(new Option("Dedicated worker · shared input", "worker-sab"));
  execution.value =
    query.get("scope") === "worker-sab" && execution.options.length === 3
      ? "worker-sab"
      : "worker";
  const tools = document.createElement("a");
  tools.textContent = "Open scene editing and diagnostic tools";
  tools.className = "lab-home";
  $("#lab-description").after(tools);
  const meter = $(".lab-metrics");
  meter.open =
    localStorage.getItem("avbd-performance-meter") === "open" ||
    (localStorage.getItem("avbd-performance-meter") !== "closed" &&
      innerWidth > 600);
  meter.addEventListener("toggle", () =>
    localStorage.setItem(
      "avbd-performance-meter",
      meter.open ? "open" : "closed",
    ),
  );
  // Specialized editors still use their full page implementation.
  $("#lab-options").hidden = true;
  $("#lab-debug").parentElement.hidden = true;
  $("#lab-detail-times").parentElement.hidden = true;
  $("#lab-gpu-check-status").closest("details").hidden = true;
  function url(scope = execution.value) {
    const u = new URL(location.href);
    u.searchParams.delete("hz");
    if (stepRateOverride !== undefined)
      u.searchParams.set("hz", stepRateOverride);
    u.searchParams.set("demo", "canonical");
    for (const [key, value] of Object.entries({
      scene: scene.value,
      backend: backend.value,
      renderer: renderer.value,
      scope,
      broadphase: $("#lab-broadphase").value,
      sleeping: $("#lab-sleep").checked ? "1" : "0",
      quality: $("#lab-enhanced").checked ? "enhanced" : "benchmark",
    }))
      u.searchParams.set(key, value);
    return u;
  }
  const error = (e) => {
    diagnostics.errors.push(e.message ?? String(e));
    $(".lab-status").textContent = diagnostics.errors.at(-1);
    if (!diagnostics.ready) sceneLoading(root, diagnostics.errors.at(-1), true);
  };
  function updatePause() {
    $("#lab-pause").textContent = paused ? "Resume" : "Pause";
  }
  function notify(data) {
    if (disposed) return;
    if (data.type === "error") {
      error(data.message);
      return;
    }
    if (data.type === "loading") {
      $(".lab-status").textContent = data.message;
      sceneLoading(root, data.message);
      return;
    }
    if (data.type !== "status") return;
    status = data;
    paused = data.paused;
    updatePause();
    diagnostics.steps = data.steps;
    const ms = (n) => (Number.isFinite(n) ? `${n.toFixed(2)} ms` : "—"),
      p = data.profile;
    $("#lab-readings").textContent =
      `${data.fps.toFixed(0)} FPS · Simulation ${(data.simulationRate ?? 0).toFixed(2)}×\nPhysics: ${ms(p?.total)} · Collisions: ${ms(p?.collision)} · Drawing: ${ms(data.drawMs)}`;
    $("#lab-readings").style.whiteSpace = "pre-line";
    if (paused)
      $("#lab-readings").textContent = $("#lab-readings").textContent.replace(
        /Simulation [\d.]+×/,
        "Paused",
      );
    drawChart(data);
    $(".lab-status").textContent = data.sleep
      ? `${(data.sleep.sleeping ?? 0).toLocaleString()} sleeping bodies · Dedicated worker${client?.shared ? " · shared input" : ""}`
      : "Dedicated worker";
    if (data.galton)
      $("#lab-galton-chart").innerHTML = galtonChart(
        data.galton.bins,
        data.galton.released,
        data.galton.total,
      );
    if (data.pegs)
      $("#lab-play-status").textContent =
        `${data.pegs.retracted} / ${data.pegs.total} pegs retracted. Click a peg or its coral cap to toggle it. Drag to orbit.`;
  }
  async function load() {
    if (loading || disposed) return;
    loading = true;
    diagnostics.ready = false;
    diagnostics.errors.length = 0;
    sceneLoading(root, "Starting the simulation worker…");
    samples.length = 0;
    const controls = [
      scene,
      backend,
      renderer,
      execution,
      $("#lab-reset"),
      $("#lab-iterations"),
      $("#lab-step-rate"),
      $("#lab-step-rate-default"),
    ];
    controls.forEach((c) => (c.disabled = true));
    try {
      await client?.destroy();
      view.querySelector(".lab-canvas")?.remove();
      const canvas = document.createElement("canvas");
      canvas.className = "lab-canvas";
      canvas.tabIndex = 0;
      view.prepend(canvas);
      const def = canonicalScenes.find((s) => s.id === scene.value);
      $("#lab-sleep-label").hidden = false;
      if (backend.value === "cpu") renderer.value = "webgpu";
      client = await createSimulationClient(
        canvas,
        {
          scene: scene.value,
          backend: backend.value,
          renderer: renderer.value,
          scope: execution.value,
          paused,
          hz: stepRateOverride,
          enhanced: $("#lab-enhanced").checked,
          broadphase: $("#lab-broadphase").value,
          sleeping: query.has("sleeping")
            ? query.get("sleeping") === "1"
            : undefined,
        },
        notify,
      );
      const info = client.info;
      $("#lab-sleep").checked = info.sleepingEnabled;
      diagnostics.ready = true;
      sceneLoading(root, null);
      diagnostics.scene = info.scene;
      diagnostics.backend = info.backend;
      diagnostics.scope = execution.value;
      diagnostics.worker = info.worker;
      $(".lab-title h2").textContent = `${info.dimension}D · ${def.name}`;
      $(".lab-title span").textContent =
        `${info.bodies.toLocaleString()} bodies · ${backend.selectedOptions[0].textContent}`;
      $("#lab-iterations").value = info.iterations;
      defaultStepRate = Math.round(info.defaultStepRate);
      $("#lab-step-rate").value = Math.round(1 / info.timeStep);
      $("#lab-bowl").hidden = !info.bowling;
      $("#lab-shoot").hidden = !(def.benchmark || def.cannon);
      $("#lab-projectile").hidden = $("#lab-projectile-label").hidden = !(
        def.benchmark || def.cannon
      );
      $("#lab-cannon-aim").hidden = !def.cannon;
      if (def.cannon) updateCannonAim();
      $("#lab-play-controls").hidden = !info.playActions;
      $("#lab-galton-chart").hidden = scene.value !== "3d-marble-cascade";
      $("#lab-play-buttons").replaceChildren();
      for (const action of info.playActions ?? []) {
        const button = document.createElement("button");
        button.textContent = action.label;
        button.dataset.action = action.id;
        button.onclick = () => {
          client.control("play", action.id);
          if (action.id !== "restore-pegs") {
            client.control("pause", false);
            paused = false;
          }
          updatePause();
        };
        $("#lab-play-buttons").append(button);
      }
      $("#lab-description").textContent = def.description ?? "";
      tools.href = url("main");
      $(".lab-status").textContent = "Dedicated worker ready";
      updatePause();
      history.replaceState(null, "", url());
    } catch (e) {
      error(e);
    } finally {
      loading = false;
      controls.forEach((c) => (c.disabled = false));
    }
  }
  for (const control of [
    scene,
    backend,
    renderer,
    $("#lab-broadphase"),
    $("#lab-enhanced"),
  ])
    control.onchange = () => load();
  execution.onchange = () =>
    execution.value === "main" ? location.assign(url("main")) : load();
  $("#lab-reset").onclick = load;
  $("#lab-pause").onclick = () => {
    paused = !paused;
    client.control("pause", paused);
    updatePause();
  };
  $("#lab-step").onclick = () => client.step(1).catch(error);
  $("#lab-fit").onclick = () => client.control("fit");
  $("#lab-iterations").onchange = (e) =>
    client.control("iterations", Number(e.target.value));
  function changeStepRate(value) {
    stepRateOverride = readStepRate(value);
    const rate = stepRateOverride ?? defaultStepRate;
    $("#lab-step-rate").value = rate;
    client.control("stepRate", rate);
    samples.length = 0;
    history.replaceState(null, "", url());
    tools.href = url("main");
  }
  $("#lab-step-rate").onchange = (e) => changeStepRate(e.target.value);
  $("#lab-step-rate-default").onclick = () => changeStepRate(undefined);
  $("#lab-sleep").onchange = (e) => {
    query.set("sleeping", e.target.checked ? "1" : "0");
    client.control("sleeping", e.target.checked);
    history.replaceState(null, "", url());
  };
  $("#lab-bowl").onclick = () => {
    client.control("bowl");
    paused = false;
    updatePause();
  };
  function aimValues() {
    return Object.fromEntries(
      ["yaw", "elevation", "speed"].map((key) => [
        key,
        +$("#lab-cannon-" + key).value,
      ]),
    );
  }
  function updateCannonAim() {
    const aim = aimValues();
    for (const key of ["yaw", "elevation", "speed"])
      $("#lab-cannon-" + key + "-value").textContent =
        `${aim[key]}${key === "speed" ? " m/s" : "°"}`;
    client?.control("cannonAim", aim);
  }
  for (const key of ["yaw", "elevation", "speed"])
    $("#lab-cannon-" + key).oninput = updateCannonAim;
  $("#lab-shoot").onclick = () => {
    client.control("projectile", {
      kind: $("#lab-projectile").value,
      aim: aimValues(),
    });
    paused = false;
    updatePause();
  };
  $("#lab-projectile").onchange = () => $("#lab-shoot").onclick();
  $("#lab-benchmark").onclick = async () => {
    const button = $("#lab-benchmark");
    const settings = [
      $("#lab-iterations"),
      $("#lab-step-rate"),
      $("#lab-step-rate-default"),
    ];
    button.disabled = true;
    settings.forEach((input) => (input.disabled = true));
    try {
      const r = await client.benchmark({ warmup: 0, samples: 60 });
      $("#lab-benchmark-result").textContent =
        `Typical physics: ${r.physicsMs?.median?.toFixed(2) ?? "unavailable"} ms/step. Drawing: ${r.drawMs?.median?.toFixed(2) ?? "unavailable"} ms/frame. Sleeping ${r.sleepingEnabled ? "on" : "off"}. Measured in ${execution.selectedOptions[0].textContent}.`;
    } catch (e) {
      error(e);
    } finally {
      button.disabled = false;
      settings.forEach((input) => (input.disabled = false));
    }
  };
  const dispose = async () => {
    disposed = true;
    await client?.destroy();
  };
  globalThis.__AVBD_LAB__ = {
    diagnostics,
    get client() {
      return client;
    },
    get status() {
      return status;
    },
    pause(value = true) {
      paused = value;
      client.control("pause", value);
      updatePause();
    },
    step: (n) => client.step(n),
    snapshot: () => client.snapshot(),
    select: async (id) => {
      scene.value = id;
      await load();
    },
    dispose,
  };
  await load();
  return { dispose };
}
