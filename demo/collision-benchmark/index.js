import * as BABYLON from "../shared/rendering/babylon.js";
import { mainPageLink } from "../shared/demoNavigation.js";
import {
  GpuSurfaceParticles as GpuCollisionBenchmark,
  PARTICLE_BYTE_STRIDE as BULLET_BYTE_STRIDE,
} from "../../src/gpu/surfaceParticles.js";

import { createWebGPUDevice } from "../../src/gpu/device.js";
import { CollisionSprites } from "./sprites.js";

function clamp(value, lo, hi) {
  const v = Number(value) || 0;
  return Math.max(lo, Math.min(hi, v));
}

function alignUp(value, step) {
  const s = Math.max(1, step | 0);
  return Math.max(s, Math.ceil((value | 0) / s) * s);
}

function fmtInt(value) {
  return Math.round(value || 0).toLocaleString();
}

function rotateYTo(src, offset, angle, dst, outOffset) {
  const x = src[offset + 0];
  const y = src[offset + 1];
  const z = src[offset + 2];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  dst[outOffset + 0] = x * c + z * s;
  dst[outOffset + 1] = y;
  dst[outOffset + 2] = -x * s + z * c;
  dst[outOffset + 3] = 0;
}

function makeUi(root) {
  root.innerHTML = "";
  root.style.margin = "0";
  root.style.overflow = "hidden";
  root.style.background = "#080b10";
  root.style.color = "#dbe6ff";
  root.style.fontFamily =
    "Verdana, system-ui, -apple-system, Segoe UI, sans-serif";
  root.style.fontSize = "13px";

  const app = document.createElement("div");
  app.style.position = "fixed";
  app.style.inset = "0";
  app.style.display = "grid";
  app.style.gridTemplateColumns = "390px 1fr";

  const sidebar = document.createElement("div");
  sidebar.style.background = "linear-gradient(180deg, #101722, #0f141d)";
  sidebar.style.borderRight = "1px solid #223044";
  sidebar.style.padding = "12px";
  sidebar.style.overflow = "auto";

  const canvas = document.createElement("canvas");
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.background = "#000";

  const viewport = document.createElement("div");
  Object.assign(viewport.style, {
    position: "relative",
    minWidth: "0",
    minHeight: "0",
  });
  viewport.append(canvas);
  app.append(sidebar, viewport);
  root.append(app);

  sidebar.append(mainPageLink());
  const title = document.createElement("div");
  title.textContent = "WebGPU Collision Benchmark";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  sidebar.append(title);

  const row = () => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.gap = "8px";
    div.style.alignItems = "center";
    div.style.flexWrap = "wrap";
    div.style.marginTop = "10px";
    sidebar.append(div);
    return div;
  };

  const button = (text) => {
    const b = document.createElement("button");
    b.textContent = text;
    b.style.background = "rgba(255,255,255,0.06)";
    b.style.color = "#dbe6ff";
    b.style.border = "1px solid #223044";
    b.style.borderRadius = "8px";
    b.style.padding = "8px 10px";
    b.style.cursor = "pointer";
    return b;
  };

  const input = (value, min, step) => {
    const el = document.createElement("input");
    el.type = "number";
    el.value = String(value);
    el.min = String(min);
    el.step = String(step);
    el.style.width = "120px";
    el.style.background = "rgba(0,0,0,0.25)";
    el.style.color = "#dbe6ff";
    el.style.border = "1px solid #223044";
    el.style.borderRadius = "8px";
    el.style.padding = "6px 8px";
    return el;
  };

  const label = (text) => {
    const el = document.createElement("label");
    el.textContent = text;
    el.style.color = "#91a6c7";
    return el;
  };

  const pill = (name, value = "?") => {
    const p = document.createElement("span");
    p.style.display = "inline-flex";
    p.style.gap = "8px";
    p.style.alignItems = "center";
    p.style.padding = "6px 8px";
    p.style.border = "1px solid #223044";
    p.style.borderRadius = "8px";
    p.style.background = "rgba(255,255,255,0.02)";
    const b = document.createElement("b");
    b.textContent = name;
    const v = document.createElement("span");
    v.textContent = value;
    p.append(b, v);
    return { p, v };
  };

  const buttons = row();
  const btnStart = button("Start benchmark");
  const btnStop = button("Stop");
  const btnClear = button("Clear table");
  btnStop.disabled = true;
  buttons.append(btnStart, btnStop, btnClear);

  const live = row();
  const liveEngine = pill("Engine");
  const liveFps = pill("FPS", "0");
  const liveCollision = pill("Collision ms", "—");
  const liveTarget = pill("Target", "0");
  const liveAlive = pill("Alive", "0");
  const liveHits = pill("Hits/s", "0");
  const liveTests = pill("Ray-tris/s", "0");
  live.append(
    liveEngine.p,
    liveFps.p,
    liveCollision.p,
    liveTarget.p,
    liveAlive.p,
    liveHits.p,
    liveTests.p,
  );

  const r1 = row();
  const inpTargetFps = input(60, 1, 1);
  const inpStepSec = input(3, 0.5, 0.5);
  r1.append(
    label("Target FPS"),
    inpTargetFps,
    label("Step seconds"),
    inpStepSec,
  );

  const r2 = row();
  const inpStartBullets = input(2000, 1, 100);
  const inpMaxBullets = input(200000, 100, 100);
  r2.append(
    label("Start bullets"),
    inpStartBullets,
    label("Max bullets"),
    inpMaxBullets,
  );

  const r3 = row();
  const inpInc = input(1000, 1, 100);
  const inpPrimeChunk = input(1000, 1, 100);
  r3.append(label("Increment"), inpInc, label("Prime chunk"), inpPrimeChunk);
  const geometric = document.createElement("input");
  geometric.type = "checkbox";
  geometric.checked = true;
  const geometricLabel = document.createElement("label");
  geometricLabel.append(geometric, " Double the count after each passing step");
  row().append(geometricLabel);

  const r4 = row();
  const inpBulletRad = input(0.09, 0.001, 0.01);
  const inpSpawnR = input(32, 5, 1);
  r4.append(
    label("Bullet radius"),
    inpBulletRad,
    label("Spawn radius"),
    inpSpawnR,
  );

  const r5 = row();
  const inpSpeed = input(80, 1, 1);
  const inpLife = input(3.0, 0.1, 0.1);
  r5.append(label("Speed"), inpSpeed, label("Life"), inpLife);

  const r6 = row();
  const inpRot = input(0.6, -10, 0.1);
  const inpJitter = input(4.8, 0, 0.1);
  r6.append(label("Rotate rad/s"), inpRot, label("Aim jitter"), inpJitter);

  const note = document.createElement("div");
  note.textContent =
    "Particles hit the D20's 20 triangle surfaces and ignore each other. GPU sprites show every live particle. Collision time measures the compute pass; frame rate includes drawing. This is a particle sweep test, separate from the AVBD rigid-body solver.";
  note.style.color = "#91a6c7";
  note.style.lineHeight = "1.35";
  note.style.marginTop = "12px";
  sidebar.append(note);
  const saved = document.createElement("a");
  saved.href = "/test-results/particle-capacity.html";
  saved.textContent = "Saved 60 FPS capacity measurements ↗";
  saved.style.color = "#91baff";
  sidebar.append(saved);

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "12px";
  table.style.fontSize = "12px";
  table.innerHTML = `<thead><tr>
    <th>Step</th><th>Target</th><th>Avg FPS</th><th>Frame ms</th><th>Avg alive</th><th>Hits/s</th><th>Ray-tris/s</th><th>Result</th>
  </tr></thead><tbody></tbody>`;
  for (const cell of table.querySelectorAll("th, td")) {
    cell.style.border = "1px solid #223044";
    cell.style.padding = "6px 6px";
    cell.style.textAlign = "right";
    cell.style.whiteSpace = "nowrap";
  }
  sidebar.append(table);

  return {
    canvas,
    btnStart,
    btnStop,
    btnClear,
    liveEngine: liveEngine.v,
    liveFps: liveFps.v,
    liveCollision: liveCollision.v,
    liveTarget: liveTarget.v,
    liveAlive: liveAlive.v,
    liveHits: liveHits.v,
    liveTests: liveTests.v,
    inpTargetFps,
    inpStepSec,
    inpStartBullets,
    inpMaxBullets,
    inpInc,
    inpPrimeChunk,
    geometric,
    inpBulletRad,
    inpSpawnR,
    inpSpeed,
    inpLife,
    inpRot,
    inpJitter,
    tableBody: table.querySelector("tbody"),
  };
}

function makeShield(scene, radius) {
  const mesh = BABYLON.MeshBuilder.CreatePolyhedron(
    "shield",
    { type: 3, size: radius * 2.0, flat: true },
    scene,
  );
  mesh.isPickable = false;

  const mat = new BABYLON.StandardMaterial("shieldMat", scene);
  mat.diffuseColor = new BABYLON.Color3(0.12, 0.3, 0.95);
  mat.emissiveColor = new BABYLON.Color3(0.02, 0.04, 0.12);
  mat.specularColor = new BABYLON.Color3(0, 0, 0);
  mat.alpha = 0.92;
  mesh.material = mat;
  mesh.enableEdgesRendering();
  mesh.edgesWidth = 1.0;
  mesh.edgesColor = new BABYLON.Color4(0.6, 0.8, 1.0, 0.7);

  const pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  const ind = mesh.getIndices();
  const triCount = (ind.length / 3) | 0;
  const local = new Float32Array(triCount * 9);
  let w = 0;
  for (let i = 0; i < ind.length; i += 3) {
    const a = ind[i + 0] * 3;
    const b = ind[i + 1] * 3;
    const c = ind[i + 2] * 3;
    local[w + 0] = pos[a + 0];
    local[w + 1] = pos[a + 1];
    local[w + 2] = pos[a + 2];
    local[w + 3] = pos[b + 0];
    local[w + 4] = pos[b + 1];
    local[w + 5] = pos[b + 2];
    local[w + 6] = pos[c + 0];
    local[w + 7] = pos[c + 1];
    local[w + 8] = pos[c + 2];
    w += 9;
  }

  const packed = new Float32Array(triCount * 12);
  function pack(angle) {
    for (let ti = 0; ti < triCount; ti += 1) {
      const s = ti * 9;
      const d = ti * 12;
      rotateYTo(local, s + 0, angle, packed, d + 0);
      rotateYTo(local, s + 3, angle, packed, d + 4);
      rotateYTo(local, s + 6, angle, packed, d + 8);
    }
    return packed;
  }

  return { mesh, triCount, pack };
}

export async function startCollisionBenchmarkDemo(options = {}) {
  const root = options.root ?? document.body;
  const ui = makeUi(root);
  const { adapter, device } = await createWebGPUDevice({
    preferredLimits: {
      maxStorageBufferBindingSize: 512 * 1024 * 1024,
      maxBufferSize: 512 * 1024 * 1024,
    },
  });
  const capacity = Math.min(
    Math.floor(device.limits.maxStorageBufferBindingSize / BULLET_BYTE_STRIDE),
    Math.floor(device.limits.maxBufferSize / BULLET_BYTE_STRIDE),
    device.limits.maxComputeWorkgroupsPerDimension ** 2 * 128,
  );
  ui.inpMaxBullets.max = String(capacity);
  ui.inpMaxBullets.value = String(Math.min(capacity, 10_000_000));
  const gpuErrors = [];
  device.addEventListener("uncapturederror", (e) => {
    if (!gpuErrors.includes(e.error.message) && gpuErrors.length < 10)
      gpuErrors.push(e.error.message);
  });
  ui.liveEngine.textContent =
    `Raw WebGPU + Babylon ${adapter.info?.description || adapter.info?.vendor || ""}`.trim();

  const engine = new BABYLON.Engine(ui.canvas, true, {
    preserveDrawingBuffer: false,
    stencil: false,
    antialias: true,
  });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.02, 0.03, 0.05, 1);
  scene.skipPointerMovePicking = true;

  const camera = new BABYLON.ArcRotateCamera(
    "cam",
    Math.PI * 0.25,
    Math.PI * 0.42,
    22.0,
    new BABYLON.Vector3(0, 0, 0),
    scene,
  );
  camera.attachControl(ui.canvas, true);
  camera.wheelPrecision = 90;
  camera.panningSensibility = 0;

  const light = new BABYLON.HemisphericLight(
    "h",
    new BABYLON.Vector3(0.2, 1, 0.2),
    scene,
  );
  light.intensity = 0.95;

  const shield = makeShield(scene, 2.2);
  let benchmark = null;
  let sprites = null;
  let running = false;
  let targetCount = 0;
  let stepIndex = 0;
  let frame = 0;
  let angle = 0;
  let fpsSmooth = 60;
  let hitsSmooth = 0;
  let latestCounters = { hits: 0, alive: 0 };

  let targetFps = 60;
  let stepSec = 3;
  let inc = 1000;
  let primeChunk = 1000;
  let bulletRadius = 0.09;
  let spawnRadius = 32;
  let speed = 80;
  let life = 3;
  let rot = 0.6;
  let jitter = 4.8;

  let accT = 0;
  let accFrames = 0;
  let accAlive = 0;
  let accHits = 0;
  let measurement = null;
  let lastFrameTime = null;

  function setButtons() {
    ui.btnStart.disabled = running;
    ui.btnStop.disabled = !running;
  }

  function readSettings() {
    targetFps = clamp(ui.inpTargetFps.value, 1, 240) | 0;
    stepSec = clamp(ui.inpStepSec.value, 0.25, 60);
    const maxBullets = Math.floor(clamp(ui.inpMaxBullets.value, 100, capacity));
    const startBullets = Math.floor(
      clamp(ui.inpStartBullets.value, 1, maxBullets),
    );
    inc = Math.max(1, ui.inpInc.value | 0);
    primeChunk = Math.max(1, ui.inpPrimeChunk.value | 0);
    bulletRadius = Math.max(0.001, Number(ui.inpBulletRad.value) || 0.09);
    spawnRadius = Math.max(5, Number(ui.inpSpawnR.value) || 32);
    speed = Math.max(1, Number(ui.inpSpeed.value) || 80);
    life = Math.max(0.1, Number(ui.inpLife.value) || 3);
    rot = Number(ui.inpRot.value) || 0;
    jitter = Math.max(0, Number(ui.inpJitter.value) || 0);
    return { startBullets, maxBullets };
  }

  function resetAccumulators() {
    accT = 0;
    accFrames = 0;
    accAlive = 0;
    accHits = 0;
  }

  function ensureBenchmark(maxBullets) {
    if (benchmark && benchmark.capacity === maxBullets) {
      return;
    }
    if (benchmark) {
      sprites?.dispose();
      benchmark.destroy();
    }
    benchmark = new GpuCollisionBenchmark(device, {
      capacity: maxBullets,
      triangleCount: shield.triCount,
    });
    benchmark.writeTriangles(shield.pack(angle));
    const overlay = document.createElement("canvas");
    overlay.setAttribute("aria-label", "GPU particle sprites");
    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
    ui.canvas.parentElement.style.position = "relative";
    ui.canvas.parentElement.append(overlay);
    sprites = new CollisionSprites(device, overlay, benchmark);
  }

  function addRow(
    stepIdx,
    tgt,
    avgFps,
    frameMs,
    avgAlive,
    hitsPerSec,
    rayTriPerSec,
    ok,
  ) {
    const tr = document.createElement("tr");
    const values = [
      stepIdx,
      fmtInt(tgt),
      avgFps.toFixed(1),
      frameMs.toFixed(2),
      avgAlive.toFixed(0),
      fmtInt(hitsPerSec),
      fmtInt(rayTriPerSec),
      ok ? "PASS" : "FAIL",
    ];
    for (let i = 0; i < values.length; i += 1) {
      const td = document.createElement("td");
      td.textContent = String(values[i]);
      td.style.border = "1px solid #223044";
      td.style.padding = "6px 6px";
      td.style.textAlign = i === 0 ? "left" : "right";
      td.style.whiteSpace = "nowrap";
      if (i === values.length - 1) {
        td.style.color = ok ? "#7fffb2" : "#ff7f9a";
        td.style.fontWeight = "700";
      }
      tr.appendChild(td);
    }
    ui.tableBody.appendChild(tr);
  }

  function startBenchmark() {
    if (measurement) throw Error("A particle measurement is already running");
    const { startBullets, maxBullets } = readSettings();
    ensureBenchmark(maxBullets);
    benchmark.clear();
    targetCount = Math.min(maxBullets, alignUp(startBullets, primeChunk));
    stepIndex = 0;
    resetAccumulators();
    running = true;
    setButtons();
  }

  function stopBenchmark() {
    if (measurement) {
      measurement.reject(Error("Particle measurement stopped"));
      measurement = null;
    }
    running = false;
    setButtons();
  }

  const summary = (values) => {
    if (!values.length) return null;
    const sorted = values.toSorted((a, b) => a - b);
    return {
      samples: values.length,
      mean: values.reduce((sum, v) => sum + v, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[
        Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))
      ],
      max: sorted.at(-1),
    };
  };
  function measure({
    count,
    warmupSeconds = 2,
    seconds = 5,
    draw = true,
  } = {}) {
    if (measurement) throw Error("A particle measurement is already running");
    if (!Number.isSafeInteger(count) || count < 1 || count > capacity)
      throw Error(`Particle count must be between 1 and ${capacity}`);
    if (
      !Number.isFinite(warmupSeconds) ||
      warmupSeconds < 1 ||
      !Number.isFinite(seconds) ||
      seconds < 1
    )
      throw Error("Warmup and measurement must each last at least one second");
    readSettings();
    ensureBenchmark(count);
    benchmark.clear();
    targetCount = count;
    running = true;
    setButtons();
    const started = performance.now();
    return new Promise((resolve, reject) => {
      measurement = {
        resolve,
        reject,
        draw,
        count,
        begin: started + warmupSeconds * 1000,
        end: started + (warmupSeconds + seconds) * 1000,
        frames: [],
        collision: [],
        drawing: [],
        cpu: [],
        alive: [],
        hits: [],
        computeSerial: benchmark.timer.samples,
        drawSerial: sprites.timer.samples,
      };
    });
  }

  ui.btnStart.addEventListener("click", startBenchmark);
  ui.btnStop.addEventListener("click", stopBenchmark);
  ui.btnClear.addEventListener("click", () => {
    ui.tableBody.innerHTML = "";
    stepIndex = 0;
  });

  engine.runRenderLoop(() => {
    const now = performance.now();
    const frameMs = lastFrameTime === null ? 1000 / 60 : now - lastFrameTime;
    lastFrameTime = now;
    const dt = Math.min(0.05, Math.max(0.0005, engine.getDeltaTime() * 0.001));
    const fpsNow = 1000 / Math.max(frameMs, 0.001);
    fpsSmooth = fpsSmooth * 0.9 + fpsNow * 0.1;

    if (running && benchmark) {
      angle += rot * dt;
      shield.mesh.rotation.y = angle;
      benchmark.writeTriangles(shield.pack(angle));
      latestCounters = benchmark.step({
        dt,
        speed,
        life,
        bulletRadius,
        spawnRadius,
        jitter,
        count: targetCount,
        frame,
      });

      const hits = latestCounters.hits || 0;
      const alive = latestCounters.alive;
      accT += frameMs / 1000;
      accFrames += 1;
      accAlive += alive;
      accHits += hits;
      hitsSmooth = hitsSmooth * 0.82 + (hits / Math.max(dt, 0.0001)) * 0.18;

      if (!measurement && accT >= stepSec) {
        const avgFps = accFrames / accT;
        const avgAlive = accFrames ? accAlive / accFrames : 0;
        const frameMs = avgFps > 1e-6 ? 1000 / avgFps : 0;
        const hitsPerSec = accHits / Math.max(accT, 0.0001);
        const rayTriPerSec = avgAlive * shield.triCount * 5 * avgFps;
        // Display-paced 60 Hz animation commonly measures 59.94 FPS.
        const ok = avgFps >= targetFps * (59 / 60);
        stepIndex += 1;
        addRow(
          stepIndex,
          targetCount,
          avgFps,
          frameMs,
          avgAlive,
          hitsPerSec,
          rayTriPerSec,
          ok,
        );
        if (!ok) {
          stopBenchmark();
        } else {
          const next = Math.min(
            benchmark.capacity,
            alignUp(
              ui.geometric.checked ? targetCount * 2 : targetCount + inc,
              primeChunk,
            ),
          );
          if (next === targetCount) {
            stopBenchmark();
          } else {
            targetCount = next;
            resetAccumulators();
          }
        }
      }
    }

    ui.liveFps.textContent = fpsSmooth.toFixed(0);
    ui.liveCollision.textContent =
      benchmark?.timer.latestMs > 0 ? benchmark.timer.latestMs.toFixed(3) : "—";
    ui.liveTarget.textContent = fmtInt(targetCount);
    ui.liveAlive.textContent = fmtInt(latestCounters.alive || 0);
    ui.liveHits.textContent = fmtInt(hitsSmooth);
    ui.liveTests.textContent = fmtInt(
      latestCounters.alive * shield.triCount * 5 * fpsSmooth,
    );

    frame += 1;
    if (measurement?.draw !== false) {
      scene.render();
      sprites?.draw(camera, targetCount);
    }
    if (measurement && now - frameMs >= measurement.begin) {
      const m = measurement;
      m.frames.push(frameMs);
      m.cpu.push(performance.now() - now);
      m.alive.push(latestCounters.alive);
      m.hits.push(latestCounters.hits);
      if (benchmark.timer.samples !== m.computeSerial) {
        m.collision.push(benchmark.timer.latestMs);
        m.computeSerial = benchmark.timer.samples;
      }
      if (m.draw && sprites.timer.samples !== m.drawSerial) {
        m.drawing.push(sprites.timer.latestMs);
        m.drawSerial = sprites.timer.samples;
      }
      if (now >= m.end) {
        measurement = null;
        stopBenchmark();
        const frames = summary(m.frames);
        m.resolve({
          count: m.count,
          draw: m.draw,
          frames,
          fps: 1000 / frames.mean,
          collisionMs: summary(m.collision),
          spriteMs: summary(m.drawing),
          cpuSubmissionMs: summary(m.cpu),
          alive: summary(m.alive),
          hitsPerSecond: (summary(m.hits).mean * 1000) / frames.mean,
          withinFrameBudget:
            m.frames.filter((ms) => ms <= (1000 / 60) * 1.1).length /
            m.frames.length,
          errors: [...gpuErrors],
        });
      }
    }
  });

  window.addEventListener("resize", () => engine.resize());
  setButtons();
  globalThis.__COLLISION_BENCHMARK__ = {
    start: startBenchmark,
    stop: stopBenchmark,
    measure,
    info: () => ({
      adapter: {
        vendor: adapter.info.vendor,
        architecture: adapter.info.architecture,
        description: adapter.info.description,
      },
      capacity,
      triangles: shield.triCount,
      viewport: {
        width: ui.canvas.clientWidth,
        height: ui.canvas.clientHeight,
        pixelRatio: devicePixelRatio,
      },
      settings: { speed, life, bulletRadius, spawnRadius, rot, jitter },
      timestampQueries: device.features.has("timestamp-query"),
      userAgent: navigator.userAgent,
    }),
    snapshot: () => ({
      targetCount,
      triangles: shield.triCount,
      alive: latestCounters.alive,
      hits: latestCounters.hits,
      collisionMs: benchmark?.timer.latestMs,
      spriteMs: sprites?.timer.latestMs,
      sprites: !!sprites,
      frame,
      errors: gpuErrors,
    }),
  };

  return {
    engine,
    scene,
    device,
    startBenchmark,
    stopBenchmark,
    dispose() {
      stopBenchmark();
      sprites?.dispose();
      if (benchmark) benchmark.destroy();
      engine.dispose();
      root.innerHTML = "";
    },
  };
}
