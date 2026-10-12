/**
 * Naval page UI and launch options. Physics, water and rendering are owned by
 * the shared simulation session so the same scene runs on the main thread
 * or in a dedicated worker; DOM controls send commands through that boundary.
 */
import "./style.css";

import { createSimulationClient } from "../shared/runtime/simulationClient.js";
import { sceneSleepPresets } from "../shared/runtime/sleepPresets.js";

export async function startNavalDemo(root = document.body) {
  root.innerHTML = `<main class="naval-demo">
    <header><div><a href="/">← Back to main page</a><p class="naval-eyebrow">WEBGPU · WATER & DESTRUCTION</p><h1>Little ships, big trouble</h1></div>
      <p class="naval-intro">Two tiny ships trade cannon fire beside a rocky island. Smash a hull into the shore and watch buoyant wood float away from its heavy keel.</p></header>
    <section class="naval-view" aria-label="Naval battle simulation">
      <canvas id="naval-canvas" tabindex="0" aria-label="Two colorful ships floating and fighting on simulated waves"></canvas>
      <div class="naval-caption"><span class="naval-badge">GPU shallow water + AVBD</span><p>Drag to orbit · scroll to zoom · Space to fire</p></div>
      <details class="naval-performance"><summary>Performance</summary><div id="naval-performance">Preparing WebGPU…</div></details>
      <div class="naval-message" id="naval-message" role="status">Launching the fleet…</div>
    </section>
    <section class="naval-controls" aria-label="Battle controls">
      <div class="naval-buttons"><button id="naval-fire">Fire Blue Finch</button><button id="naval-return">Fire Coral Corsair</button><button id="naval-pause">Pause</button><button id="naval-reset">Reset battle</button></div>
      <div class="naval-buttons"><button id="naval-ram-blue">Sail Blue Finch into island</button><button id="naval-ram-coral">Sail Coral Corsair into island</button><button id="naval-release">Break Coral hull apart</button></div>
      <div class="naval-settings"><label><input id="naval-auto" type="checkbox" checked> Automatic cannon battle</label><label for="naval-waves">Wave height <input id="naval-waves" type="range" min="0" max="0.4" step="0.02" value="0.18"><output id="naval-wave-value">0.18 m</output></label><label for="naval-broadphase">Solid collisions <select id="naval-broadphase"><option value="auto">Automatic</option><option value="grid">Grid</option><option value="hploc">HPLOC tree</option></select></label></div>
      <div class="naval-settings"><label for="naval-scope">Run simulation in <select id="naval-scope"><option value="worker">Dedicated worker · messages</option><option value="worker-sab">Dedicated worker · shared input</option><option value="main">Main thread · comparison</option></select></label><label><input id="naval-sleep" type="checkbox"> Sleeping (wave-driven bodies stay awake)</label><a href="/tests/workers.html">Compare worker performance ↗</a></div>
      <div class="naval-ship-status" id="naval-ships"></div>
      <details class="naval-explanation"><summary>What is being simulated?</summary><p>A 128 × 128 shallow-water grid supplies water height and flow. Four samples per rigid piece estimate submerged volume and apply buoyancy and drag. Wooden hull members support the denser keel through their welds. Every detached piece keeps its own buoyancy: wood can float while metal and the keel sink. There is no flood timer or automatic sinking rule.</p><p>Cannon impacts damage nearby planks. Welds also break when collision forces exceed their strength, including grounding on the island. The island buttons drive a ship toward shore for eight seconds; damage comes from physics forces. Break Coral hull apart releases all its hull welds to show how the materials float independently. Cloth sails use spring-connected particles tied to their yard, with gusting wind forces. Their light fabric displaces water and drifts on the waves when detached.</p><p>Hull fragments remain until Reset. Impact spray fades after a short time. Wakes use approximate momentum forcing; the water surface does not simulate dry land or water inside the hull. Water, buoyancy, damage, solid collisions and movement run on WebGPU. Rendering reads the same GPU poses. Only the small status display is downloaded periodically.</p></details>
    </section></main>`;
  const $ = (selector) => root.querySelector(selector),
    canvas = $("#naval-canvas");
  const query = new URLSearchParams(location.search);
  $("#naval-sleep").checked = query.has("sleeping")
    ? query.get("sleeping") === "1"
    : (sceneSleepPresets.naval ?? false);
  $("#naval-sleep").onchange = (e) =>
    client?.control("sleeping", e.target.checked);
  if (["auto", "grid", "hploc"].includes(query.get("broadphase")))
    $("#naval-broadphase").value = query.get("broadphase");
  const workersAvailable =
    typeof Worker === "function" &&
    typeof canvas.transferControlToOffscreen === "function";
  let scope = query.get("scope") ?? (workersAvailable ? "worker" : "main");
  if (!workersAvailable || !["main", "worker", "worker-sab"].includes(scope))
    scope = "main";
  $("#naval-scope option[value=worker]").disabled = !workersAvailable;
  if (
    scope === "worker-sab" &&
    (!globalThis.crossOriginIsolated || typeof SharedArrayBuffer !== "function")
  )
    scope = "worker";
  $("#naval-scope").value = scope;
  $("#naval-scope option[value=worker-sab]").disabled =
    !workersAvailable ||
    !globalThis.crossOriginIsolated ||
    typeof SharedArrayBuffer === "undefined";
  $("#naval-scope option[value=worker-sab]").hidden = $(
    "#naval-scope option[value=worker-sab]",
  ).disabled;
  $("#naval-scope").onchange = (event) => {
    const url = new URL(location.href);
    url.searchParams.set("scope", event.target.value);
    location.href = url;
  };
  return startFleet(root, scope);
}

async function startFleet(root, scope) {
  const $ = (selector) => root.querySelector(selector),
    diagnostics = { ready: false, errors: [] };
  let client,
    disposed = false,
    resetting = false,
    paused = new URLSearchParams(location.search).get("paused") === "1";
  const fail = (error) => {
    diagnostics.errors.push(error.message ?? String(error));
    $("#naval-message").textContent =
      `The demo stopped: ${diagnostics.errors.at(-1)}`;
  };
  function receive(data) {
    if (disposed) return;
    if (data.type === "error") return fail(Error(data.message));
    if (data.type !== "status") return;
    const ms = (value) =>
      value == null ? "unavailable" : `${value.toFixed(2)} ms`;
    $("#naval-performance").innerHTML =
      `<dl><dt>Drawing + simulation</dt><dd>${data.paused ? "Paused" : `${data.fps.toFixed(0)} FPS`}</dd><dt>Rigid-body physics</dt><dd>${ms(data.profile?.total)} / step</dd><dt>Water + ship forces</dt><dd>${ms(data.waterMs)} / step</dd><dt>Drawing</dt><dd>${ms(data.drawMs)} / frame</dd></dl><p>Physics + rendering: ${scope === "main" ? "main thread" : "dedicated worker"}<br>Input: ${scope === "main" ? "page events" : scope === "worker-sab" ? "shared memory" : "coalesced messages"}<br>120 physics steps/s · 5 AVBD iterations</p>`;
    if (data.ships) {
      $("#naval-ships").innerHTML = data.ships
        .map(
          (ship) =>
            `<div class="naval-ship ${ship.team ? "coral" : "blue"}"><strong>${ship.name}</strong><span>${ship.broken} broken pieces · ${Math.round(ship.support * 100)}% buoyant volume attached</span><progress max="1" value="${ship.support}" aria-label="${ship.name} attached buoyant volume"></progress></div>`,
        )
        .join("");
      const support = data.ships[1].support;
      $("#naval-message").textContent =
        support < 0.5
          ? "Much of the Coral Corsair’s floating wood has detached. Its dense keel has less support."
          : support < 0.99
            ? "Hull damaged! Detached wood floats independently; the remaining hull supports the keel."
            : "The fleet is afloat. Blue Finch has the stronger cannons.";
    }
  }
  async function reset() {
    if (resetting || disposed) return;
    resetting = true;
    diagnostics.ready = false;
    try {
      await client?.destroy();
      const old = $("#naval-canvas"),
        canvas = old.cloneNode(false);
      old.replaceWith(canvas);
      client = await createSimulationClient(
        canvas,
        {
          scene: "naval",
          renderer: "webgpu",
          scope,
          paused,
          enhanced: true,
          sleeping: $("#naval-sleep").checked,
          broadphase: $("#naval-broadphase").value,
        },
        receive,
      );
      client.control("auto", $("#naval-auto").checked);
      client.control("waves", +$("#naval-waves").value);
      diagnostics.ready = true;
      $("#naval-message").textContent =
        "The fleet is afloat. Blue Finch has the stronger cannons.";
      $("#naval-pause").textContent = paused ? "Resume" : "Pause";
    } finally {
      resetting = false;
    }
  }
  function pause(value) {
    paused = value;
    client?.control("pause", value);
    $("#naval-pause").textContent = value ? "Resume" : "Pause";
  }
  $("#naval-fire").onclick = () => client?.control("fire", 0);
  $("#naval-return").onclick = () => client?.control("fire", 1);
  $("#naval-ram-blue").onclick = () => client?.control("ram", 0);
  $("#naval-ram-coral").onclick = () => client?.control("ram", 1);
  $("#naval-release").onclick = () => client?.control("releaseHull", 1);
  $("#naval-pause").onclick = () => pause(!paused);
  $("#naval-reset").onclick = () => reset().catch(fail);
  $("#naval-auto").onchange = (event) =>
    client?.control("auto", event.target.checked);
  $("#naval-waves").oninput = (event) => {
    client?.control("waves", +event.target.value);
    $("#naval-wave-value").textContent =
      `${(+event.target.value).toFixed(2)} m`;
  };
  $("#naval-broadphase").onchange = () => reset().catch(fail);
  const keydown = (event) => {
    if (
      event.code === "Space" &&
      event.target !== $("#naval-canvas") &&
      !/INPUT|SELECT|BUTTON/.test(event.target.tagName)
    ) {
      event.preventDefault();
      client?.control("key", { code: event.code, repeat: event.repeat });
    }
  };
  window.addEventListener("keydown", keydown);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    diagnostics.ready = false;
    void client?.destroy();
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("pagehide", dispose);
  };
  window.addEventListener("pagehide", dispose, { once: true });
  globalThis.__AVBD_NAVAL__ = {
    diagnostics,
    pause,
    reset,
    fire: (team) => client.control("fire", team),
    ram: (team) => client.control("ram", team),
    releaseHull: (team) => client.control("releaseHull", team),
    releaseSail: (team) => client.control("releaseSail", team),
    setAuto(value) {
      client.control("auto", value);
      $("#naval-auto").checked = value;
    },
    step(count) {
      pause(true);
      return client.step(count);
    },
    snapshot: () => client.snapshot(),
    dispose,
  };
  try {
    await reset();
  } catch (error) {
    fail(error);
  }
}
