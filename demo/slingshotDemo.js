import { createWebGPUDevice } from "../src/gpu/device.js";
import { buildSlingshotScene2D } from "./slingshotScene2D.js";
import { GpuRenderer2D } from "./gpuRenderer2D.js";
import {
  createBabylonEngine,
  BabylonRenderer2D,
} from "./babylonGpuRenderer.js";
import {
  JOINT_FLOATS,
  J_PEN,
} from "../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import "./slingshot.css";
export async function startSlingshotDemo() {
  document.body.innerHTML = `<main class="siege"><header><div><a href="/">← Back to main page</a><h1>Slingshot siege</h1><p>Pull back the red ball. Release to bring the forts down.</p></div><div class="siege-tools"><label>Bricks <select id="siege-size"><option value="1000">1,000</option><option value="5000" selected>5,000</option><option value="10000">10,000</option></select></label><label><input id="siege-sleep" type="checkbox" checked> Sleeping</label><button id="siege-reset">Rebuild</button><button id="siege-pause">Pause</button><button id="siege-shoot">Fire / Space</button><button id="siege-reload">Next ball</button><button id="siege-boost">Boost</button><label><input id="siege-bounce" type="checkbox"> Bouncy ball</label><label><input id="siege-machines" type="checkbox" checked> Powered gates</label></div></header><section class="siege-stage"><canvas id="siege-canvas" aria-label="Slingshot siege. Drag the red ball back and release to launch. Space also fires." tabindex="0"></canvas><svg id="siege-aim" aria-hidden="true"></svg><div class="siege-score"><span id="siege-shots">0 shots</span><strong id="siege-score">0 bricks moved</strong><span id="siege-targets">0 targets toppled</span><small id="siege-features"></small></div><details class="siege-metrics" open><summary>GPU performance</summary><div id="siege-metrics"></div></details><p class="siege-hint">Drag the ball back · release to launch · Space to fire · R to rebuild · P to pause · scroll to zoom · Shift-drag to pan</p></section><footer><span>2D AVBD physics and drawing stay on the GPU. Ropes, springs, hinged gates, breakable mortar and ragdolls are real physics. Green tint means resting.</span><a href="/tests/performance.html">Run GPU benchmarks ↗</a></footer><p id="siege-status" role="status"></p></main>`;
  const $ = (id) => document.getElementById(id),
    canvas = $("siege-canvas"),
    overlay = $("siege-aim");
  const embedded = new URLSearchParams(location.search).get("embed") === "1";
  const renderMode =
    new URLSearchParams(location.search).get("renderer") === "babylon"
      ? "babylon"
      : "webgpu";
  const label = document.createElement("label");
  label.innerHTML =
    'Renderer <select id="siege-renderer"><option value="webgpu">Direct WebGPU</option><option value="babylon">Babylon WebGPU · thin instances</option></select>';
  document.querySelector(".siege-tools").prepend(label);
  $("siege-renderer").value = renderMode;
  $("siege-renderer").onchange = () => {
    const url = new URL(location.href);
    url.searchParams.set("renderer", $("siege-renderer").value);
    location.href = url;
  };
  document.body.classList.toggle("siege-embed", embedded);
  if (embedded) document.querySelector(".siege-metrics").open = false;
  const session =
    renderMode === "babylon"
      ? await createBabylonEngine(canvas, false)
      : await createWebGPUDevice({
          preferredLimits: {
            maxStorageBuffersPerShaderStage: 9,
            maxStorageBufferBindingSize: 512 * 1024 * 1024,
            maxBufferSize: 1024 * 1024 * 1024,
          },
        });
  const { device } = session;
  const errors = [];
  device.addEventListener("uncapturederror", (e) => {
    errors.push(e.error.message);
    $("siege-status").textContent = e.error.message;
  });
  let built,
    gpu,
    renderer,
    initial,
    hold,
    bird,
    pull,
    shots = 0,
    moved = 0,
    toppled = 0,
    dragging = false,
    paused = new URLSearchParams(location.search).get("paused") === "1",
    disposed = false,
    resetting = false,
    busy = false,
    pendingCollect = null,
    raf,
    last = 0,
    accumulator = 0,
    frameMs = 16.7,
    steps = 0,
    epoch = 0,
    crossings = 0,
    broken = 0,
    birds = new Set(),
    crossed = new Set(),
    boosted = new Set(),
    boostSteps = 0,
    aimHits = [],
    rayHit = null,
    queryBusy = false,
    queryRevision = 0,
    aimRevision = -1,
    queryTimer;
  let panning = null;
  let metricSteps = 0,
    metricTime = performance.now();
  const camera = { x: 0, y: 9, scale: 15 },
    metrics = { contacts: 0, sleeping: 0, colors: 0, overflow: 0, clashes: 0 };
  const world = (e) => {
    const r = canvas.getBoundingClientRect();
    return [
      camera.x + (e.clientX - r.left - r.width / 2) / camera.scale,
      camera.y - (e.clientY - r.top - r.height / 2) / camera.scale,
    ];
  };
  const screen = (p) => [
    (p[0] - camera.x) * camera.scale + canvas.clientWidth / 2,
    (camera.y - p[1]) * camera.scale + canvas.clientHeight / 2,
  ];
  function fit() {
    if (!built) return;
    camera.x = built.centerX;
    camera.y = built.height * 0.47;
    camera.scale = Math.min(
      canvas.clientWidth / built.width,
      canvas.clientHeight / (built.height + 3),
    );
  }
  function aim() {
    if (!built || !hold) {
      overlay.innerHTML = "";
      return;
    }
    const origin = built.origin,
      ball = pull ?? origin,
      a = screen([-25.5, 3.5]),
      b = screen([-24.7, 4]),
      p = screen(ball),
      dots = [];
    if (pull) {
      const v = [(origin[0] - pull[0]) * 9, (origin[1] - pull[1]) * 9];
      for (let t = 0.1, k = 0; t < 2.5; t += 0.1, k++) {
        const q = screen([ball[0] + v[0] * t, ball[1] + v[1] * t - 5 * t * t]);
        dots.push(
          `<circle cx="${q[0]}" cy="${q[1]}" r="2.2" fill="#76532b" opacity=".55"/>`,
        );
        if (aimHits[k]) {
          const hit = screen(aimHits[k].center);
          dots.push(
            `<circle cx="${hit[0]}" cy="${hit[1]}" r="6" fill="none" stroke="#b6462e" stroke-width="2"/>`,
          );
          break;
        }
      }
      if (rayHit) {
        const q = screen(rayHit.point);
        dots.push(
          `<path d="M${q[0] - 4} ${q[1]}h8 M${q[0]} ${q[1] - 4}v8" stroke="#76532b" stroke-width="1"/>`,
        );
      }
    }
    overlay.setAttribute(
      "viewBox",
      `0 0 ${canvas.clientWidth} ${canvas.clientHeight}`,
    );
    overlay.innerHTML = `<path d="M${a.join(" ")} L${p.join(" ")} L${b.join(" ")}" fill="none" stroke="#62402c" stroke-width="4" stroke-linecap="round"/>${dots.join("")}`;
  }
  // Queries run only while aiming, in a batch, rather than in the frame loop.
  async function queryAim() {
    if (queryBusy || !pull || !hold || resetting || disposed) return;
    queryBusy = true;
    const generation = epoch,
      revision = queryRevision,
      g = gpu,
      p = [...pull],
      origin = built.origin;
    try {
      const v = [(origin[0] - p[0]) * 9, (origin[1] - p[1]) * 9],
        casts = [];
      if (Math.hypot(...v) < 0.01) return;
      let previous = p;
      for (let t = 0.1; t < 2.5; t += 0.1) {
        const next = [p[0] + v[0] * t, p[1] + v[1] * t - 5 * t * t];
        const d = [next[0] - previous[0], next[1] - previous[1]];
        casts.push({
          origin: previous,
          radius: 0.5,
          direction: d,
          maxDistance: Math.hypot(...d),
        });
        previous = next;
      }
      const options = {
        ignore: [bird],
        includeTriggers: false,
        collidesWith: 7,
      };
      const hits = await g.circleCastAll(casts, options);
      if (generation !== epoch || disposed || resetting) return;
      const centerHit = await g.raycast(p, v, {
        ...options,
        maxDistance: Math.hypot(...v) * 2.4,
      });
      if (generation === epoch && revision === queryRevision && hold) {
        aimHits = hits;
        aimRevision = revision;
        rayHit = centerHit;
        aim();
      }
    } catch (e) {
      if (generation === epoch && !disposed)
        $("siege-status").textContent = e.message;
    } finally {
      queryBusy = false;
      if (
        pull &&
        hold &&
        !disposed &&
        !resetting &&
        revision !== queryRevision
      ) {
        clearTimeout(queryTimer);
        queryTimer = setTimeout(queryAim, 0);
      }
    }
  }
  function scheduleAim() {
    queryRevision++;
    aimHits = [];
    rayHit = null;
    clearTimeout(queryTimer);
    queryTimer = setTimeout(queryAim, 100);
  }
  function boost() {
    if (hold || resetting || disposed || !shots || boosted.has(bird)) return;
    boosted.add(bird);
    $("siege-boost").disabled = true;
    gpu.applyImpulse(bird, [35, 50]).applyAngularImpulse(bird, 3);
    boostSteps = 12;
    $("siege-status").textContent =
      "Boost! A short thrust adds forward force and spin.";
  }
  function score() {
    $("siege-shots").textContent = `${shots} ${shots === 1 ? "shot" : "shots"}`;
    $("siege-score").textContent = `${moved.toLocaleString()} bricks moved`;
    $("siege-targets").textContent =
      `${toppled} / ${built.targets.length} targets toppled`;
    $("siege-features").textContent =
      `${crossings} shots through the sensor · ${broken} / ${built.breakable.length} mortar joints broken`;
  }
  async function reset() {
    if (resetting || disposed) return;
    resetting = true;
    epoch++;
    queryRevision++;
    aimRevision = -1;
    clearTimeout(queryTimer);
    cancelAnimationFrame(raf);
    $("siege-status").textContent = "Building the forts…";
    try {
      await device.queue.onSubmittedWorkDone();
      if (disposed) return;
      renderer?.dispose();
      gpu?.destroy();
      built = buildSlingshotScene2D(undefined, Number($("siege-size").value));
      gpu = built.scene.createSolver(device, {
        ...built.gpuOptions2D,
        sleeping: $("siege-sleep").checked
          ? built.gpuOptions2D.sleeping
          : false,
      });
      initial = await gpu.readBodies();
      hold = { slot: built.hold.slot };
      bird = built.bird;
      pull = null;
      shots = moved = toppled = steps = 0;
      metricSteps = 0;
      metricTime = performance.now();
      crossings = broken = boostSteps = 0;
      birds = new Set([bird]);
      crossed = new Set();
      boosted = new Set();
      $("siege-boost").disabled = true;
      aimHits = [];
      rayHit = null;
      gpu.watchContacts({ indices: [bird], maxPairs: 1024, maxEvents: 2048 });
      const sim = {
        solver: gpu,
        dragBody: -1,
        get bodyCount() {
          return gpu.bodyCount;
        },
      };
      const Render2D =
        renderMode === "babylon" ? BabylonRenderer2D : GpuRenderer2D;
      renderer = new Render2D(device, canvas, sim, () => camera, {
        engine: session.engine,
        colors: built.colors,
        characters: true,
        visibleLinks: built.visibleLinks,
        filledPlanes: true,
        background: { r: 0.77, g: 0.89, b: 0.96, a: 1 },
      });
      await renderer.ready?.();
      fit();
      aim();
      score();
      last = 0;
      accumulator = 0;
      errors.length = 0;
      gpu.setRestitution(bird, $("siege-bounce").checked ? 0.75 : 0.15);
      if (!$("siege-machines").checked)
        for (const gate of built.gates)
          gpu.setMotor(gate.hinge.motor.slot, { maxTorque: 0 });
      $("siege-status").textContent =
        "Ready. Pull the ball back to aim, or press Fire.";
    } finally {
      resetting = false;
      if (!disposed) raf = requestAnimationFrame(frame);
    }
  }
  function launch() {
    if (!hold || resetting || disposed) return;
    const p = pull ?? [built.origin[0] - 3, built.origin[1] - 1.3],
      velocity = [(built.origin[0] - p[0]) * 9, (built.origin[1] - p[1]) * 9];
    gpu
      .teleport(bird, p, 0)
      .setLinearVelocity(bird, velocity)
      .setAngularVelocity(bird, 0);
    gpu.disableConstraint(hold.slot);
    gpu.setFilters([bird], [2], [7]);
    hold = null;
    pull = null;
    dragging = false;
    shots++;
    $("siege-boost").disabled = false;
    scheduleAim();
    score();
    aim();
    $("siege-status").textContent =
      "Ball launched. Press Next ball to keep going.";
  }
  function reload() {
    if (hold || resetting || disposed) return;
    if (shots >= 32) {
      $("siege-status").textContent =
        "32 balls launched. Rebuild to start another siege.";
      return;
    }
    bird = gpu.addCircle(0.5, {
      position: built.origin,
      density: 30,
      friction: 0.35,
      restitution: 0.15,
      allowSleep: false,
      group: 2,
      collidesWith: 0,
    });
    $("siege-boost").disabled = true;
    renderer.setColor(bird, [0.85, 0.22, 0.18]);
    birds.add(bird);
    gpu.watchContacts({ indices: [...birds] });
    gpu.setRestitution(bird, $("siege-bounce").checked ? 0.75 : 0.15);
    hold = {
      slot: gpu.appendJoint(
        -1,
        bird,
        built.origin,
        [0, 0],
        [Infinity, Infinity, 0],
      ),
    };
    pull = null;
    aim();
    $("siege-status").textContent = "Next ball ready.";
  }
  function collect() {
    if (pendingCollect) return pendingCollect;
    pendingCollect = collectMetrics().finally(() => {
      pendingCollect = null;
    });
    return pendingCollect;
  }
  async function collectMetrics() {
    if (busy || resetting || disposed || !gpu) return;
    busy = true;
    const generation = epoch,
      g = gpu;
    try {
      const c = await g.readCounters(),
        s = await g.readSleepStats();
      if (generation !== epoch || disposed) return;
      Object.assign(metrics, c, { sleeping: s.sleeping });
      const contacts = await g.readContactEvents();
      if (generation !== epoch || disposed) return;
      for (const e of contacts.events) {
        const projectile =
          e.a === built.sensor ? e.b : e.b === built.sensor ? e.a : -1;
        if (
          e.type === "begin" &&
          e.isTrigger &&
          birds.has(projectile) &&
          !crossed.has(projectile)
        ) {
          crossed.add(projectile);
          crossings++;
        }
      }
      if (contacts.dropped)
        throw Error("Contact event storage is full; rebuild the level.");
      const joints = await g.readJoints();
      if (generation !== epoch || disposed) return;
      broken = built.breakable.filter(
        (h) =>
          joints[h.slot * JOINT_FLOATS + J_PEN] === 0 &&
          joints[h.slot * JOINT_FLOATS + J_PEN + 1] === 0 &&
          joints[h.slot * JOINT_FLOATS + J_PEN + 2] === 0,
      ).length;
      await renderer.updateJointVisibility(joints);
      g.adapt(c);
      const p = await g.readBodies();
      if (generation !== epoch || disposed) return;
      if (!shots) initial = p;
      if (shots) {
        moved = built.bricks.filter(
          (i) =>
            Math.hypot(
              p[i * 24] - initial[i * 24],
              p[i * 24 + 1] - initial[i * 24 + 1],
            ) > 0.4 || Math.abs(p[i * 24 + 2] - initial[i * 24 + 2]) > 0.4,
        ).length;
        toppled = built.targets.filter(
          (i) =>
            Math.hypot(
              p[i * 24] - initial[i * 24],
              p[i * 24 + 1] - initial[i * 24 + 1],
            ) > 1,
        ).length;
        score();
      }
      if ($("siege-machines").checked)
        for (const gate of built.gates) {
          const angle = p[gate.body * 24 + 2] - Math.PI / 2;
          if (angle * gate.direction < -0.64) {
            gate.direction *= -1;
            g.setMotor(gate.hinge.motor.slot, { speed: 0.7 * gate.direction });
          }
        }
      score();
      const now = performance.now(),
        stepRate =
          ((steps - metricSteps) * 1000) / Math.max(1, now - metricTime);
      metricSteps = steps;
      metricTime = now;
      const renderMs =
        renderMode === "babylon"
          ? (renderer.renderStats.gpuDrawMs ?? 0) +
            (renderer.renderStats.gpuCopyMs ?? 0)
          : (renderer.timer.latestMs ?? 0);
      $("siege-metrics").innerHTML =
        `<dl><dt>Frame rate</dt><dd>${(1000 / frameMs).toFixed(0)} FPS</dd><dt>Bricks</dt><dd>${built.brickCount.toLocaleString()}</dd><dt>Asleep / awake</dt><dd>${metrics.sleeping.toLocaleString()} / ${(gpu.bodyCount - built.staticCount - metrics.sleeping).toLocaleString()}</dd><dt>Contact points</dt><dd>${c.contacts.toLocaleString()}</dd><dt>${renderMode === "babylon" ? "GPU drawing + copies" : "GPU drawing"}</dt><dd>${renderMs.toFixed(2)} ms</dd><dt>Physics rate</dt><dd>${paused ? "Paused" : `${stepRate.toFixed(0)} steps/sec`}</dd><dt>Fixed step</dt><dd>1/120 sec · 10 rounds</dd></dl><p>${c.overflow || c.clashes ? "Growing collision storage and solve groups; incomplete steps are held safely." : "No collision overflow or conflicting solve groups."}</p>`;
    } catch (e) {
      if (generation === epoch && !disposed) {
        errors.push(e.message);
        $("siege-status").textContent = e.message;
      }
    } finally {
      busy = false;
    }
  }
  function frame(now) {
    if (disposed || resetting) return;
    const elapsed = last ? Math.min((now - last) / 1000, 0.05) : 0;
    frameMs = frameMs * 0.9 + (elapsed ? elapsed * 1000 : 16.7) * 0.1;
    last = now;
    if (!paused) {
      accumulator = Math.min(accumulator + elapsed, gpu.params.dt * 4);
      let n = 0;
      while (accumulator + 1e-12 >= gpu.params.dt && n++ < 4) {
        physicsStep();
        steps++;
        accumulator = Math.max(0, accumulator - gpu.params.dt);
      }
    }
    renderer.draw(false);
    raf = requestAnimationFrame(frame);
  }
  function physicsStep() {
    if (boostSteps > 0) {
      gpu.applyForce(bird, [180, 80]).applyTorque(bird, 8);
      boostSteps--;
    }
    gpu.step();
  }
  function pause(value = !paused) {
    paused = value;
    $("siege-pause").textContent = paused ? "Play" : "Pause";
    accumulator = 0;
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.shiftKey) {
      panning = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (!hold || resetting) return;
    const p = world(e);
    if (
      Math.hypot(p[0] - built.origin[0], p[1] - built.origin[1]) >
      Math.max(2, 28 / camera.scale)
    )
      return;
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener("pointermove", (e) => {
    if (panning) {
      camera.x -= (e.clientX - panning.x) / camera.scale;
      camera.y += (e.clientY - panning.y) / camera.scale;
      panning = { x: e.clientX, y: e.clientY };
      aim();
      return;
    }
    if (!dragging || !hold) return;
    let p = world(e),
      dx = p[0] - built.origin[0],
      dy = p[1] - built.origin[1],
      length = Math.hypot(dx, dy);
    if (length > 3.6) {
      dx *= 3.6 / length;
      dy *= 3.6 / length;
    }
    dx = Math.min(0, dx);
    pull = [built.origin[0] + dx, Math.max(0.8, built.origin[1] + dy)];
    gpu.setWorldAnchor(hold.slot, ...pull);
    gpu.teleport(bird, pull, 0).setLinearVelocity(bird, [0, 0]);
    scheduleAim();
    aim();
  });
  canvas.addEventListener("pointerup", () => {
    panning = null;
    if (dragging) {
      if (
        pull &&
        Math.hypot(pull[0] - built.origin[0], pull[1] - built.origin[1]) > 0.25
      )
        launch();
      else {
        dragging = false;
        pull = null;
        gpu.setWorldAnchor(hold.slot, ...built.origin);
        gpu.teleport(bird, built.origin);
        aim();
      }
    }
  });
  canvas.addEventListener("pointercancel", () => {
    panning = null;
    dragging = false;
    pull = null;
    if (hold) {
      gpu.setWorldAnchor(hold.slot, ...built.origin);
      gpu.teleport(bird, built.origin);
    }
    aim();
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const p = world(e),
        scale = Math.max(
          3,
          Math.min(150, camera.scale * Math.exp(-e.deltaY * 0.001)),
        );
      camera.x = p[0] - ((p[0] - camera.x) * camera.scale) / scale;
      camera.y = p[1] - ((p[1] - camera.y) * camera.scale) / scale;
      camera.scale = scale;
      aim();
    },
    { passive: false },
  );
  const key = (e) => {
    if (e.target.closest("button,input,select,summary,a")) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (!hold) reload();
      else launch();
    }
    if (e.key.toLowerCase() === "r") reset();
    if (e.key.toLowerCase() === "p") pause();
  };
  window.addEventListener("keydown", key);
  $("siege-sleep").onchange = () => {
    if ($("siege-sleep").checked) gpu.enableSleeping({ timeThreshold: 0.3 });
    else gpu.disableSleeping();
    collect();
  };
  $("siege-reset").onclick = reset;
  $("siege-size").onchange = reset;
  $("siege-pause").onclick = () => pause();
  $("siege-shoot").onclick = launch;
  $("siege-reload").onclick = reload;
  $("siege-boost").onclick = boost;
  $("siege-bounce").onchange = () =>
    gpu.setRestitution(bird, $("siege-bounce").checked ? 0.75 : 0.15);
  $("siege-machines").onchange = () => {
    for (const gate of built.gates)
      gpu.setMotor(gate.hinge.motor.slot, {
        speed: 0.7 * gate.direction,
        maxTorque: $("siege-machines").checked ? 12 : 0,
      });
  };
  const resize = new ResizeObserver(() => {
    fit();
    aim();
  });
  resize.observe(canvas);
  const timer = setInterval(collect, 600);
  async function dispose() {
    if (disposed) return;
    disposed = true;
    epoch++;
    cancelAnimationFrame(raf);
    clearInterval(timer);
    clearTimeout(queryTimer);
    resize.disconnect();
    window.removeEventListener("keydown", key);
    await device.queue.onSubmittedWorkDone();
    renderer?.dispose();
    gpu?.destroy();
    session.engine?.dispose();
    device.destroy();
  }
  globalThis.__SLINGSHOT__ = {
    reset,
    fit,
    launch,
    reload,
    boost,
    queryAim,
    pause,
    collect,
    dispose,
    get ready() {
      return !disposed && !!gpu && !resetting;
    },
    get renderStats() {
      return (
        renderer?.renderStats ?? {
          renderer: "webgpu",
          poseDownloads: 0,
          matrixUpdates: 0,
        }
      );
    },
    get gpu() {
      return gpu;
    },
    get built() {
      return built;
    },
    get state() {
      return {
        shots,
        moved,
        toppled,
        crossings,
        broken,
        aimHits: aimHits.filter(Boolean).length,
        aimReady: aimRevision === queryRevision,
        pull: pull ? [...pull] : null,
        steps,
        paused,
        errors: [...errors],
        metrics: { ...metrics },
        bird,
        hold: !!hold,
        camera: { ...camera },
      };
    },
    async step(n = 1) {
      pause(true);
      for (let i = 0; i < n; i++) {
        physicsStep();
        steps++;
        if (i % 30 === 29) await device.queue.onSubmittedWorkDone();
        if (i % 120 === 119) await collect();
      }
      renderer.draw(false);
      await collect();
    },
    get diagnostics() {
      return {
        steps,
        errors: [...errors],
        ready: !disposed && !!gpu && !resetting,
        disposed,
      };
    },
  };
  device.lost.then((info) => {
    if (!disposed) {
      errors.push(info.message || "GPU device lost");
      $("siege-status").textContent =
        "GPU device lost. Reload the page to restart.";
      dispose();
    }
  });
  pause(paused);
  await reset();
  return { dispose };
}
