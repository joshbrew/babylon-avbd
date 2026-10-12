import { galtonChart } from "../demo/galton-board/statistics.js";
import { createSimulationClient } from "../demo/shared/runtime/simulationClient.js";
import { loadSceneCatalogue } from "../demo/lab/catalogue.js";
import { readImportedTerrain } from "../demo/terrain/mesh.js";
import { trajectoryLine } from "../demo/slingshot/aim.js";

const $ = (id) => document.getElementById(id),
  rows = [],
  errors = [];
const workerScenes = [
  { id: "naval", name: "Little ships · waves and sinking", dimension: 3 },
  ...(await loadSceneCatalogue()),
];
let client,
  paused = new URLSearchParams(location.search).get("paused") === "1",
  busy = false;
const scopeNames = {
  main: "Main thread",
  worker: "Worker · messages",
  "worker-sab": "Worker · shared input",
};
const ms = (stat) => (stat ? `${stat.median.toFixed(2)} ms` : "Unavailable");
const summary = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)] ?? 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    samples: values.length,
  };
};
for (const scene of workerScenes)
  $("scene").add(new Option(`${scene.dimension}D · ${scene.name}`, scene.id));
$("scene").value = new URLSearchParams(location.search).get("scene") || "naval";
const query = new URLSearchParams(location.search);
for (const id of ["backend", "renderer", "scope"])
  if ([...$(id).options].some((option) => option.value === query.get(id)))
    $(id).value = query.get(id);
const workersAvailable =
  typeof Worker === "function" &&
  typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function";
if (!query.has("scope"))
  $("scope").value = workersAvailable ? "worker" : "main";
$("play").textContent = paused ? "Resume" : "Pause";
const sab =
  workersAvailable &&
  crossOriginIsolated &&
  typeof SharedArrayBuffer === "function";
$("scope").querySelector('[value="worker"]').disabled = !workersAvailable;
$("scope").querySelector('[value="worker-sab"]').disabled = !sab;
$("scope").querySelector('[value="worker-sab"]').hidden = !sab;
if (!sab && $("scope").value === "worker-sab") $("scope").value = "worker";
if (!workersAvailable) $("scope").value = "main";
$("availability").textContent = !workersAvailable
  ? "OffscreenCanvas workers are unavailable in this browser. Main-thread execution remains available."
  : sab
    ? "Shared input is available on this page."
    : "Shared input is unavailable here. Worker messages remain available. Serve with COOP/COEP headers to enable shared memory.";
function normalize() {
  if ($("scene").value === "naval") $("backend").value = "gpu";
  $("backend").disabled = $("scene").value === "naval";
  const direct = $("scene").value === "naval" || $("backend").value === "cpu";
  if (direct) $("renderer").value = "webgpu";
  $("renderer").disabled = direct;
  $("fire").hidden = !["naval", "2d-slingshot-siege"].includes(
    $("scene").value,
  );
  $("fire").textContent =
    $("scene").value === "naval" ? "Fire blue cannon" : "Launch ball";
  const scene = $("scene").value;
  $("reload").hidden = scene !== "2d-slingshot-siege";
  $("slingshot-hint").hidden = scene !== "2d-slingshot-siege";
  $("slingshot-aim").replaceChildren();
  $("galton-chart").hidden = scene !== "3d-marble-cascade";
  $("galton-chart").replaceChildren();
  $("play-actions").replaceChildren();
  for (const action of workerScenes.find((s) => s.id === scene)?.playActions ??
    []) {
    const button = document.createElement("button");
    button.textContent = action.label;
    button.onclick = () => {
      client?.control("play", action.id);
      paused = false;
      client?.control("pause", false);
      $("play").textContent = "Pause";
    };
    $("play-actions").append(button);
  }
  $("scene-controls").href =
    scene === "naval"
      ? "../?demo=naval"
      : scene === "2d-slingshot-siege"
        ? `../?demo=slingshot&backend=${$("backend").value === "cpu" ? "cpu" : "webgpu"}`
        : `../?demo=canonical&scene=${encodeURIComponent(scene)}&backend=${$("backend").value}`;
  $("scene-controls").href += "&scope=main";
  if (scene === "3d-static-terrain" && query.get("terrain") === "uploaded")
    $("scene-controls").href += "&terrain=uploaded";
}
function config() {
  return {
    scene: $("scene").value,
    ...($("scene").value === "3d-static-terrain" &&
    query.get("terrain") === "uploaded"
      ? { terrainMesh: readImportedTerrain() }
      : {}),
    backend: $("backend").value,
    renderer: $("renderer").value,
    scope: $("scope").value,
    ...(["1000", "5000", "10000"].includes(query.get("bricks"))
      ? { bricks: Number(query.get("bricks")) }
      : {}),
    ...(query.has("sleeping")
      ? { sleeping: query.get("sleeping") === "1" }
      : {}),
    broadphase: ["auto", "grid", "hploc"].includes(query.get("broadphase"))
      ? query.get("broadphase")
      : "auto",
    solverMode: ["auto", "standard", "optimized", "points"].includes(
      query.get("solverMode"),
    )
      ? query.get("solverMode")
      : "auto",
    paused,
    enhanced: query.get("quality") === "enhanced",
  };
}
function receive(data) {
  if (data.slingshot) {
    const aim = data.slingshot,
      svg = $("slingshot-aim");
    svg.setAttribute("viewBox", `0 0 ${aim.width} ${aim.height}`);
    svg.innerHTML =
      (aim.bands.length
        ? `<polyline points="${aim.bands.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#62402c" stroke-width="4"/>`
        : "") + (aim.points.length ? trajectoryLine(aim.points) : "");
    $("reload").disabled = busy || aim.holding;
  }
  if (data.type === "loading") $("status").textContent = data.message;
  else if (data.type === "error") fail(Error(data.message));
  else if (data.type === "status" && !busy) {
    paused = data.paused;
    $("play").textContent = paused ? "Resume" : "Pause";
    $("status").textContent =
      `${data.paused ? "Paused" : `${data.fps.toFixed(0)} FPS`} · ${data.steps} physics steps · ${data.inputs} input updates received`;
    if (data.galton)
      $("galton-chart").innerHTML = galtonChart(
        data.galton.bins,
        data.galton.released,
      );
  }
}
function fail(error) {
  errors.push(error.message);
  $("error").textContent = error.message;
  $("settings").disabled = false;
  $("reset").disabled = false;
}
async function load(options = config()) {
  const started = performance.now();
  $("settings").disabled = true;
  for (const button of document.querySelectorAll(
    "#play-actions button, #play, #reset, #fire, #reload, #measure, #measure-selected",
  ))
    button.disabled = true;
  for (const id of ["scene", "backend", "renderer", "scope"])
    if (options[id]) $(id).value = options[id];
  normalize();
  for (const button of document.querySelectorAll("#play-actions button"))
    button.disabled = true;
  await client?.destroy();
  client = null;
  const old = $("canvas"),
    canvas = old.cloneNode(false);
  old.replaceWith(canvas);
  $("status").textContent = "Loading scene…";
  $("error").textContent = "";
  canvas.setAttribute(
    "aria-label",
    `${workerScenes.find((s) => s.id === options.scene)?.name ?? options.scene} simulation`,
  );
  client = await createSimulationClient(canvas, options, receive);
  $("settings").disabled = busy;
  for (const button of document.querySelectorAll(
    "#play-actions button, #play, #reset, #fire, #reload, #measure, #measure-selected",
  ))
    button.disabled = busy;
  client.info.startupMs = performance.now() - started;
  $("sleeping").checked = client.info.sleepingEnabled;
  render();
  $("status").textContent =
    `${client.info.bodies.toLocaleString()} bodies · ${client.info.iterations} iterations · ${scopeNames[options.scope]} · ready in ${(client.info.startupMs / 1000).toFixed(1)} s`;
  return client.info;
}
function render() {
  $("results").innerHTML = rows
    .filter(
      (r) =>
        r.scene === $("scene").value &&
        !!r.terrain?.imported === !!config().terrainMesh &&
        r.backend === $("backend").value &&
        (r.backend === "cpu" || r.renderer === $("renderer").value),
    )
    .map(
      (r) =>
        `<tr><td>${scopeNames[r.scope]}<br><small>${r.backend === "cpu" ? "CPU" : "WebGPU"} · ${r.renderer} · ${r.bodies.toLocaleString()} bodies${r.recorded ? " · recorded laptop run" : " · your run"}</small></td><td>${ms(r.physicsMs)}</td><td>${ms(r.drawMs)}</td><td>${ms(r.cpuSubmitMs)}</td><td>${ms(r.frameMs)}</td><td>${r.pageDelayMs.p95.toFixed(2)} ms</td></tr>`,
    )
    .join("");
  $("save").disabled = !rows.length;
}
async function measureOne(options, counts = {}) {
  const info = await load({ ...options, paused: true });
  const delays = [];
  let expected = performance.now() + 10,
    pointer = 0;
  const heartbeat = setInterval(() => {
    const now = performance.now();
    delays.push(Math.max(0, now - expected));
    expected = now + 10;
  }, 10);
  const input = setInterval(
    () =>
      client.pointerMove({
        clientX: 80 + (pointer++ % 400),
        clientY: 120,
        pointerId: 1,
        buttons: 0,
      }),
    1000 / 120,
  );
  try {
    const result = await client.benchmark(counts);
    const row = {
      ...result,
      scope: options.scope,
      sharedInput: client.shared,
      pageDelayMs: summary(delays),
      uiLoadMs: $("ui-load").checked ? 8 : 0,
      inputTransport: "120 pointer updates/s; discrete controls use messages",
      pingMs: await client.ping(),
      canvas: {
        width: $("canvas").clientWidth,
        height: $("canvas").clientHeight,
      },
    };
    rows.push(row);
    render();
    return row;
  } finally {
    clearInterval(heartbeat);
    clearInterval(input);
  }
}
async function compare(options = config(), counts = {}) {
  if (busy) throw Error("A comparison is already running");
  busy = true;
  rows.length = 0;
  render();
  $("settings").disabled = true;
  for (const id of [
    "measure",
    "measure-selected",
    "reset",
    "play",
    "fire",
    "reload",
    "recorded",
  ])
    $(id).disabled = true;
  try {
    const results = [];
    for (const scope of [
      "main",
      ...(workersAvailable ? ["worker"] : []),
      ...(sab ? ["worker-sab"] : []),
    ]) {
      $("status").textContent = `Measuring ${scopeNames[scope]}…`;
      results.push(await measureOne({ ...options, scope }, counts));
    }
    $("status").textContent =
      "Comparison complete. The last scene is paused; resume to play.";
    paused = true;
    $("play").textContent = "Resume";
    $("interpretation").textContent =
      "A worker can reduce page delays even when physics takes the same time. Small differences between message and shared-input modes can be normal measurement noise; repeat the comparison before choosing one.";
    return results;
  } finally {
    busy = false;
    $("settings").disabled = false;
    normalize();
    for (const id of [
      "measure",
      "measure-selected",
      "reset",
      "play",
      "fire",
      "reload",
      "recorded",
    ])
      $(id).disabled = false;
  }
}
function pageFrame() {
  if ($("ui-load").checked) {
    const until = performance.now() + 8;
    while (performance.now() < until) {}
  }
  requestAnimationFrame(pageFrame);
}
requestAnimationFrame(pageFrame);
for (const id of ["scene", "backend", "renderer", "scope"])
  $(id).onchange = () => {
    normalize();
    load().catch(fail);
  };
$("reset").onclick = () => load().catch(fail);
$("sleeping").onchange = (event) => {
  query.set("sleeping", event.target.checked ? "1" : "0");
  client?.control("sleeping", event.target.checked);
};
$("play").onclick = () => {
  paused = !paused;
  client.control("pause", paused);
  $("play").textContent = paused ? "Resume" : "Pause";
};
$("fire").onclick = () =>
  client.control($("scene").value === "naval" ? "fire" : "launch", 0);
$("reload").onclick = () => {
  if (!busy) client?.control("reload");
};
$("measure").onclick = () => compare().catch(fail);
$("measure-selected").onclick = async () => {
  if (busy) return;
  busy = true;
  $("settings").disabled = true;
  for (const id of [
    "measure",
    "measure-selected",
    "reset",
    "play",
    "fire",
    "reload",
    "recorded",
  ])
    $(id).disabled = true;
  try {
    await measureOne(config());
    paused = true;
    $("play").textContent = "Resume";
    $("interpretation").textContent =
      "Your selected execution mode. Compare all available modes measures the same scene separately in each supported mode.";
  } catch (error) {
    fail(error);
  } finally {
    busy = false;
    $("settings").disabled = false;
    normalize();
    for (const id of [
      "measure",
      "measure-selected",
      "reset",
      "play",
      "fire",
      "reload",
      "recorded",
    ])
      $(id).disabled = false;
  }
};
$("recorded").onclick = async () => {
  try {
    const response = await fetch("../test-results/worker-performance.json");
    if (!response.ok)
      throw Error("No recorded results are available on this server");
    const report = await response.json();
    rows.length = 0;
    rows.push(...report.results.map((r) => ({ ...r, recorded: true })));
    render();
    $("interpretation").textContent =
      "Recorded on an Intel Core Ultra 7 155H with an RTX 4070 Laptop GPU. Choose a measured scene to view its two runs. Compare all available modes measures your device instead.";
  } catch (error) {
    fail(error);
  }
};
$("save").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob(
      [JSON.stringify({ date: new Date().toISOString(), rows }, null, 2)],
      { type: "application/json" },
    ),
  );
  a.download = "avbd-worker-comparison.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
window.addEventListener("pagehide", () => client?.destroy(), { once: true });
globalThis.__WORKER_BENCH__ = {
  ready: false,
  errors,
  load,
  compare,
  measureOne,
  rows,
  get client() {
    return client;
  },
};
normalize();
load()
  .then(() => {
    __WORKER_BENCH__.ready = true;
  })
  .catch(fail);
