import { galtonChart } from "../galton-board/statistics.js";
import { PlayPhysics } from "../shared/playground/physics.js";
import "./style.css";
import {
  canonicalScenes,
  buildCanonicalScene,
  createRookProjectile,
} from "./scenes.js";
import { NativeGpuSolver3D as GpuSolver3D } from "../../src/native/solver3D.js";
import {
  CanonicalRenderer,
  packBodies,
} from "../shared/rendering/canonicalRenderer.js";
let createBabylonEngine, BabylonRenderer3D, BabylonRenderer2D;
async function loadBabylonRenderer() {
  ({ createBabylonEngine, BabylonRenderer3D, BabylonRenderer2D } =
    await import("../shared/rendering/babylonGpuRenderer.js"));
}
import { GpuShapeSim2D as GpuSim } from "../shared/physics/gpuShapeSim2D.js";
import { NativeGpuSolver2D as GpuSolver2D } from "../../src/native/solver2D.js";
import { parallelParams } from "../../reference/three-avbd/src/avbd2d/ref/solver.ts";
import { GpuRenderer2D } from "../shared/rendering/gpuRenderer2D.js";
import { labMarkup } from "./view.js";
import { sceneLoading, paintLoading } from "./loading.js";
import { startWorkerLab } from "./workerView.js";
import { PaperBowling } from "../paper-benchmarks/bowling.js";
import {
  sceneSleepingDefault,
  configureSceneSleeping,
} from "../shared/runtime/sleepPolicy.js";
import { readStepRate } from "../shared/runtime/stepRate.js";
import { sceneSleepSelection } from "../shared/runtime/sceneSleepSelection.js";
import { physicsStepsPerFrame } from "../shared/runtime/frameBudget.js";
import { GaltonPegs } from "../galton-board/pegs.js";
import {
  appGpuSolverOptions,
  sceneGpuSolverOptions,
} from "../../src/gpu/gpuSolverOptions.js";
import { solverModeLabels } from "../../src/gpu/solverPolicy.js";
import {
  castleAim,
  createCastleProjectile,
  createCastleBarrel,
} from "../castle/scene.js";
import { collisionGroups } from "../features/scenes.js";
import {
  visualOf,
  RING,
} from "../../reference/three-avbd/src/avbd3d/visuals.ts";
import { checkGpuContacts3D } from "../../src/gpu/contactCheck3D.js";
import { shapesOf2D } from "../../src/gpu/shapes2D.js";
import {
  mountExecutionScope,
  workersAvailable,
  workerSceneUrl,
} from "../shared/runtime/executionScope.js";
import { buildTerrainScene } from "../terrain/scene.js";
import {
  parseTerrainMesh,
  readImportedTerrain,
  storeImportedTerrain,
} from "../terrain/mesh.js";

export async function startCanonicalLabDemo(root = document.body) {
  const executionQuery = new URLSearchParams(location.search);
  const scope = executionQuery.get("scope");
  if (
    executionQuery.get("embed") !== "1" &&
    workersAvailable() &&
    navigator.gpu &&
    scope !== "main"
  )
    return startWorkerLab(root, executionQuery);
  root.innerHTML = labMarkup;
  const meter = root.querySelector(".lab-metrics");
  const savedMeter = localStorage.getItem("avbd-performance-meter");
  const requestedScene = new URLSearchParams(location.search).get("scene");
  const requestedPlay = canonicalScenes.some(
    (s) => s.id === requestedScene && s.playDemo,
  );
  meter.open =
    savedMeter === "open" ||
    (savedMeter !== "closed" && innerWidth > 600 && !requestedPlay);
  meter.addEventListener("toggle", () =>
    localStorage.setItem(
      "avbd-performance-meter",
      meter.open ? "open" : "closed",
    ),
  );
  fetch("/test-results/report.html", { method: "HEAD" })
    .then((r) => {
      if (r.ok) root.querySelector("#lab-report").hidden = false;
    })
    .catch(() => {});
  const $ = (s) => root.querySelector(s),
    scene = $("#lab-scene"),
    backend = $("#lab-backend"),
    view = $(".lab-view");
  for (const groupKind of ["play", "paper", "showcase", 3, 2]) {
    const group = document.createElement("optgroup");
    group.label =
      groupKind === "play"
        ? "Playable physics"
        : groupKind === "paper"
          ? "Paper workload comparisons"
          : groupKind === "showcase"
            ? "GPU showcase"
            : `${groupKind}D solver tests`;
    for (const s of canonicalScenes.filter((s) =>
      groupKind === "play"
        ? s.playDemo
        : groupKind === "paper"
          ? s.paper
          : groupKind === "showcase"
            ? s.showcase
            : s.dimension === groupKind &&
              !s.showcase &&
              !s.paper &&
              !s.playDemo,
    )) {
      const option = new Option(s.name, s.id);
      group.append(option);
    }
    scene.append(group);
  }
  const query = new URLSearchParams(location.search);
  let stepRateOverride = readStepRate(query.get("hz")),
    defaultStepRate;
  let importedTerrain =
    query.get("terrain") === "uploaded" ? readImportedTerrain() : null;
  if (query.get("embed") !== "1")
    mountExecutionScope(
      $("#lab-execution"),
      () => ({
        scene: scene.value,
        backend: backend.value === "gpu" ? "gpu" : "cpu",
        renderer: $("#lab-renderer").value === "babylon" ? "babylon" : "webgpu",
        broadphase: $("#lab-broadphase").value,
        solverMode: $("#lab-solver-mode").value,
        ...(stepRateOverride === undefined ? {} : { hz: stepRateOverride }),
        ...(scene.value === "3d-static-terrain" && importedTerrain
          ? { terrain: "uploaded" }
          : {}),
      }),
      { laboratory: true },
    );
  // The experimental backend is only loaded by the benchmark's preview.
  const experimentalBenchmark =
    query.get("embed") === "1" && query.get("benchmark") === "1";
  $("#lab-solver-mode").value = [
    "auto",
    "standard",
    "optimized",
    "points",
  ].includes(query.get("solverMode"))
    ? query.get("solverMode")
    : "auto";
  $("#lab-broadphase").value = ["auto", "grid", "hploc"].includes(
    query.get("broadphase"),
  )
    ? query.get("broadphase")
    : "auto";
  $("#lab-detail-times").checked = query.get("timing") === "detailed";
  root
    .querySelector(".canonical-lab")
    .classList.toggle("lab-embedded", query.get("embed") === "1");
  $("#lab-enhanced").checked = query.get("quality") !== "benchmark";
  let preferredGpuRenderer =
    query.get("renderer") === "babylon" ? "babylon" : "webgpu";
  $("#lab-renderer").value = preferredGpuRenderer;
  $("#lab-enhanced").onchange = () => {
    if (
      pegs ||
      $("#lab-renderer").value === "babylon" ||
      renderer?.kind === "webgl"
    ) {
      load().catch((e) => diagnostics.errors.push(e.message));
      return;
    }
    if (!renderer || current.dimension !== 3) return;
    const pose = {
      target: renderer.target.clone(),
      yaw: renderer.yaw,
      pitch: renderer.pitch,
      distance: renderer.distance,
    };
    renderer.dispose();
    renderer = new CanonicalRenderer(device, canvas, solver, gpu, {
      enhanced: $("#lab-enhanced").checked,
    });
    Object.assign(renderer, pose);
    renderer.sleep = sleep;
    draw();
  };
  scene.value = canonicalScenes.some((s) => s.id === query.get("scene"))
    ? query.get("scene")
    : query.get("demo") === "gpu-stress"
      ? "3d-100k-rook-impact"
      : query.get("demo") === "cannon"
        ? "3d-castle-siege"
        : navigator.gpu
          ? "showcase-brick-ring-28k"
          : "3d-stack";
  const sleepSelection = sceneSleepSelection(query, scene.value);
  let sim,
    solver,
    gpu,
    cpu,
    glPipeline,
    live,
    sleep,
    renderer,
    canvas,
    ctx,
    device,
    babylonEngine,
    current,
    castle,
    demolition,
    features,
    tearable,
    playground,
    bowling,
    pegs,
    animation,
    paused = query.get("paused") === "1",
    disposed = false,
    generation = 0,
    initialization,
    steps = 0,
    simulationSeconds = 0,
    last = performance.now(),
    accumulator = 0,
    pending = false,
    gpuFramesInFlight = 0;
  let camera = { x: 0, y: 5, scale: 35 },
    drag = null,
    stats = {},
    gpuProfile = {},
    samples = [],
    frames = 0,
    collection = Promise.resolve(),
    builtColors = [];
  const diagnostics = {
    scenes: canonicalScenes,
    get pegs() {
      return pegs?.state();
    },
    samples,
    errors: [],
    ready: false,
    get solverDecision() {
      return gpu?.solverDecision ? { ...gpu.solverDecision } : null;
    },
  };
  $("#lab-gpu-check-save").onclick = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              date: new Date().toISOString(),
              userAgent: navigator.userAgent,
              scene: current.id,
              renderer: $("#lab-renderer").value,
              adapter: diagnostics.adapter,
              contacts: diagnostics.contactCheck,
              errors: diagnostics.errors,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "avbd-gpu-contact-check.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  globalThis.__AVBD_LAB__ = {
    diagnostics,
    readSelectedBodies: (...args) => live.readSelectedBodies(...args),
    dispose,
    shoot,
    swingBall,
    tearPatch,
    benchmark: benchmarkSteps,
    queryFeature,
    stop: () => {
      disposed = true;
      cancelAnimationFrame(animation);
    },
    collect: async () => {
      await collection;
      await collect();
      readings();
      return { ...stats };
    },
    select: async (id, b) => {
      scene.value = id;
      await load(b);
    },
    setRenderer: async (kind) => {
      if (!["webgpu", "babylon", "webgl", "canvas"].includes(kind))
        throw Error("Unknown renderer");
      $("#lab-renderer").value = kind;
      if (backend.value === "gpu") preferredGpuRenderer = kind;
      await load(backend.value);
    },
    pause: (value) => {
      paused = value;
      updatePause();
    },
    step: async (n = 1) => {
      for (let i = 0; i < n; i++) advance();
      if (device) await device.queue.onSubmittedWorkDone();
      await cpu?.refreshForDrawing?.();
      draw();
    },
    snapshot: async ({ joints = false } = {}) => {
      await cpu?.refreshForDrawing?.();
      const poses =
        gpu && sim
          ? Array.from(await gpu.readBodies()).reduce((poses, _, i, data) => {
              if (i % 24 === 0) poses.push(data.slice(i, i + 3));
              return poses;
            }, [])
          : sim
            ? Array.from({ length: sim.bodyCount }, (_, i) => sim.pose(i))
            : gpu
              ? Array.from(await gpu.readBodies())
              : Array.from(packBodies(solver));
      return {
        scene: current.id,
        backend: backend.value,
        renderer: $("#lab-renderer").value,
        renderStats: renderer?.renderStats ?? {
          renderer: "webgpu",
          poseDownloads: 0,
          matrixUpdates: 0,
        },
        steps,
        timeStep: sim?.params?.dt ?? solver.dt,
        iterations: sim?.params?.iterations ?? solver.iterations,
        bodyCount: sim?.bodyCount ?? solver.bodies.length,
        playground: playground
          ? {
              kind: playground.play.kind,
              active: playground.active,
              opened: playground.opened,
              galton: await playground.feeder?.measure(true),
              feed: playground.feeder?.feed,
              dominos: playground.play.dominos.map((b) => playground.index(b)),
              marbles: playground.play.marbles.map((b) => playground.index(b)),
              debris: solver.bodies
                .filter((b) => b.mass > 0)
                .map((b) => playground.index(b)),
              bonds: playground.play.bonds.map((b) => b.slot),
            }
          : null,
        poses,
        stats,
        samples,
        gpuProfile,
        broadphase:
          gpu?.broadphase ??
          (cpu?.backend === "webgl2"
            ? "WebGL2 GPU spatial hash"
            : "CPU reference"),
        broadphaseDecision: gpu?.broadphaseDecision,
        solverDecision: gpu?.solverDecision,
        bvh: gpu?.bvh ? { ...gpu.bvh.stats } : null,
        sleepMs: sleep?.timer.latestMs,
        physicsMs: sleep?.physicsTimer.latestMs,
        projectileGpuIndex:
          (current.benchmark || current.cannon) && gpu
            ? live.gpuIndex(solver.bodies.length - 1)
            : undefined,
        projectile:
          current.benchmark || current.cannon
            ? poses.slice(
                live.gpuIndex(solver.bodies.length - 1) * 40,
                live.gpuIndex(solver.bodies.length - 1) * 40 + 3,
              )
            : null,
        errors: diagnostics.errors,
        rings: Array.from(
          renderer?.visuals?.ringScales ?? [],
          ([b, scale]) => ({
            index: live.gpuIndex(solver.bodies.indexOf(b)),
            radius:
              b.size[0] *
              scale *
              (visualOf(b).shape === "ringFlat" ? RING.flat : RING.link),
            wire: b.size[0] * scale * RING.wire,
            plane: visualOf(b).shape,
          }),
        ),
        projectileKind: $("#lab-projectile").value,
        demolition: demolition
          ? {
              pieces: demolition.pieces.map((b) =>
                live.gpuIndex(solver.bodies.indexOf(b)),
              ),
              bonds: demolition.bonds.map((b) => b.handle.slot),
              ball: live.gpuIndex(solver.bodies.indexOf(demolition.ball)),
              volume: demolition.geometry.volume,
              cellVolume: demolition.geometry.cells.reduce(
                (sum, c) => sum + c.volume,
                0,
              ),
              broken: demolition.brokenBonds ?? 0,
            }
          : null,
        castle: castle
          ? {
              ...castle.diagnostics,
              parts: castle.diagnostics.parts.map((p) => ({
                ...p,
                gpuIndex: live.gpuIndex(p.referenceIndex),
              })),
            }
          : undefined,
        jointStates:
          joints && live ? Array.from(await live.readJoints()) : undefined,
        features: features
          ? {
              kind: features.kind,
              sensor:
                features.sensor === undefined
                  ? undefined
                  : featureIndex(features.sensor),
              sensorEnabled: features.sensorEnabled,
              blueShelfEnabled: features.blueShelfEnabled,
              entries: features.entries,
              overlapCount: features.overlaps?.size,
              contactColors: features.contactColors,
              maxSensorImpulse: features.maxSensorImpulse,
              lastQuery: features.lastQuery,
              lanes: features.lanes.map((lane) => ({
                name: lane.name,
                indices: lane.bodies.map(featureIndex),
              })),
              arms: features.arms.map((arm) => ({
                minAngle: arm.minAngle,
                maxAngle: arm.maxAngle,
                index: featureIndex(arm.body),
              })),
              wheel:
                features.wheel === undefined
                  ? undefined
                  : featureIndex(features.wheel),
            }
          : undefined,
        fabric: tearable
          ? {
              materialFaces: tearable.triangles.length,
              renderedVertices:
                renderer.visuals?.tears?.count ??
                tearable.triangles.length * 18,
              detachedPatch: tearable.detachedPatch ?? [],
            }
          : undefined,
      };
    },
  };
  function updatePause() {
    $("#lab-pause").textContent = paused ? "Resume" : "Pause";
  }
  function featureIndex(body) {
    return current.dimension === 2
      ? body
      : live.gpuIndex(solver.bodies.indexOf(body));
  }
  function driveMotors(reverse) {
    if (!live || features?.kind !== "hinges") return;
    for (const motor of features.motors) {
      motor.runningSpeed = reverse ? -(motor.runningSpeed || motor.speed) : 0;
      live.setMotor(motor.handle.slot, {
        speed: motor.runningSpeed,
        maxTorque: motor.maxTorque,
      });
    }
  }
  $("#lab-motor-reverse").onclick = () => driveMotors(true);
  $("#lab-motor-stop").onclick = () => driveMotors(false);
  $("#lab-blue-shelf").onchange = (event) => {
    if (!live || features?.kind !== "filters") return;
    const enabled = event.target.checked,
      G = collisionGroups;
    const blue = features.lanes.find((lane) => lane.name === "blue");
    const indices = [
      featureIndex(features.shelf),
      ...blue.bodies.map(featureIndex),
    ];
    live.setFilters(
      indices,
      [G.shelf, ...blue.bodies.map(() => G.blue)],
      [
        G.coral | (enabled ? G.blue : 0),
        ...blue.bodies.map(() => blue.mask | (enabled ? G.shelf : 0)),
      ],
    );
    features.blueShelfEnabled = enabled;
  };
  $("#lab-sensor-enabled").onchange = (event) => {
    if (!live || features?.kind !== "filters") return;
    const enabled = event.target.checked,
      G = collisionGroups;
    live.setFilters(
      [featureIndex(features.sensor)],
      [G.sensor],
      [enabled ? G.coral | G.blue : 0],
    );
    features.sensorEnabled = enabled;
  };
  async function queryFeature(radius = 0) {
    if (!live || features?.kind !== "filters") return;
    const epoch = generation;
    const is2D = current.dimension === 2;
    const origin = is2D ? [-8, 6] : [-8, 0, 6];
    const direction = is2D ? [1, 0] : [1, 0, 0];
    const options = {
      maxDistance: 20,
      collidesWith: collisionGroups.coral,
      includeTriggers: false,
    };
    const hit =
      radius > 0
        ? await (is2D
            ? live.circleCast(origin, radius, direction, options)
            : live.sphereCast(origin, radius, direction, options))
        : await live.raycast(origin, direction, options);
    if (epoch !== generation) return;
    const type = radius > 0 ? (is2D ? "Circle" : "Sphere") : "Ray";
    features.lastQuery = { type, radius, hit };
    $("#lab-query-result").textContent = hit
      ? `${type} hit a coral ball after ${hit.distance.toFixed(2)} metres. Triggers and other collision groups were excluded.`
      : `${type} missed: no coral ball currently crosses the test line at height 6 metres.`;
    return features.lastQuery;
  }
  $("#lab-ray-query").onclick = () =>
    queryFeature().catch((error) => diagnostics.errors.push(error.message));
  $("#lab-shape-query").onclick = () =>
    queryFeature(0.25).catch((error) => diagnostics.errors.push(error.message));
  async function tearPatch() {
    if (!tearable || !live) return;
    const epoch = generation;
    const selected = new Set(
      solver.bodies.filter(
        (body) =>
          body.mass > 0 &&
          body.moment.every((value) => value === 0) &&
          Math.abs((body.cpuStart ?? body.positionLin)[0] - 1.25) < 0.55 &&
          Math.abs((body.cpuStart ?? body.positionLin)[1]) < 0.55,
      ),
    );
    const boundary = tearable.bonds.filter(
      (bond) => selected.has(bond.bodyA) !== selected.has(bond.bodyB),
    );
    const poses = await live.readBodies();
    if (epoch !== generation) return;
    const releasedSlots = boundary.map((bond) => renderer.forces.indexOf(bond));
    live.releaseJoints(releasedSlots);
    const indices = [...selected].map((body) =>
      live.gpuIndex(solver.bodies.indexOf(body)),
    );
    if (cpu)
      live.editBodies(
        indices.map((index) => ({
          body: index,
          linearVelocity: [2, -2, poses[index * 40 + 34] + 2],
        })),
      );
    else
      for (const index of indices)
        device.queue.writeBuffer(
          gpu.bodyBuffer,
          index * 160 + 128,
          new Float32Array([2, -2, poses[index * 40 + 34] + 2]),
        );
    live.wakeAll();
    tearable.detachedPatch = indices;
    draw();
    return { indices, releasedEdges: boundary.length, releasedSlots };
  }
  $("#lab-tear-patch").onclick = () =>
    tearPatch().catch((error) => diagnostics.errors.push(error.message));
  function backendOptions(dimension) {
    backend.replaceChildren();
    for (const [value, label] of dimension === 2
      ? [
          ["gpu", "WebGPU · AVBD"],
          ...(experimentalBenchmark
            ? [["webgl2", "WebGL2 · benchmark experiment"]]
            : []),
          ["ref", "CPU · AVBD"],
          ["soa-seq", "CPU · sequential arrays"],
          ...(current.name === "Cards"
            ? []
            : [["soa-colored", "CPU · colored arrays"]]),
        ]
      : [
          ["gpu", "WebGPU · AVBD"],
          ...(experimentalBenchmark
            ? [["webgl2", "WebGL2 · benchmark experiment"]]
            : []),
          ["ref", "CPU · AVBD"],
        ]) {
      const option = new Option(label, value);
      option.disabled = value === "gpu" && !navigator.gpu;
      backend.append(option);
    }
    $("#lab-backend-help").textContent =
      "WebGPU is the default. CPU runs AVBD in JavaScript for compatibility. Both keep the scene size, timestep and iteration count; large CPU scenes start paused.";
  }
  function rendererOptions(wanted) {
    const control = $("#lab-renderer");
    const choices =
      backend.value === "gpu"
        ? [
            ["webgpu", "Direct WebGPU"],
            ["babylon", "Babylon WebGPU · thin instances"],
          ]
        : current.dimension === 2
          ? [["canvas", "Canvas 2D · no WebGPU needed"]]
          : [
              ["webgl", "Babylon WebGL · thin instances"],
              ...(navigator.gpu &&
              current.canonical &&
              backend.value !== "webgl2"
                ? [
                    ["webgpu", "Direct WebGPU"],
                    ["babylon", "Babylon WebGPU · thin instances"],
                  ]
                : []),
            ];
    control.replaceChildren(
      ...choices.map(([value, label]) => new Option(label, value)),
    );
    control.value = choices.some(([value]) => value === wanted)
      ? wanted
      : choices[0][0];
    if (backend.value === "gpu") preferredGpuRenderer = control.value;
    $("#lab-renderer-help").textContent =
      backend.value === "gpu"
        ? "Both renderers draw the same GPU physics. Changing solver or renderer restarts the scene."
        : backend.value === "webgl2"
          ? "WebGL2 runs collisions and AVBD on the GPU. This renderer downloads poses for drawing; that transfer is separate from physics."
          : "Physics runs on the CPU. Drawing and pose uploads are timed separately. Changing solver or renderer restarts the scene.";
  }
  async function getDevice() {
    if ($("#lab-renderer").value === "babylon" && !babylonEngine) {
      device?.destroy();
      await loadBabylonRenderer();
      const created = await createBabylonEngine(
        canvas,
        current.dimension === 3 && $("#lab-enhanced").checked,
      );
      babylonEngine = created.engine;
      device = created.device;
      diagnostics.adapter = {
        vendor: created.info.vendor,
        architecture: created.info.architecture,
        device: created.info.device,
        description: created.info.description,
      };
      watchDevice(device);
      return device;
    }
    if (device) return device;
    if (!navigator.gpu)
      throw Error(
        "WebGPU is unavailable. Use the 2D reference scenes in this browser.",
      );
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    if (!adapter) throw Error("No WebGPU adapter available.");
    device = await adapter.requestDevice({
      requiredFeatures: adapter.features.has("timestamp-query")
        ? ["timestamp-query"]
        : [],
      requiredLimits: {
        maxStorageBufferBindingSize: Math.min(
          512 * 1024 * 1024,
          adapter.limits.maxStorageBufferBindingSize,
        ),
        maxBufferSize: Math.min(
          1024 * 1024 * 1024,
          adapter.limits.maxBufferSize,
        ),
        maxStorageBuffersPerShaderStage: Math.min(
          9,
          adapter.limits.maxStorageBuffersPerShaderStage,
        ),
      },
    });
    diagnostics.adapter = {
      vendor: adapter.info.vendor,
      architecture: adapter.info.architecture,
      device: adapter.info.device,
      description: adapter.info.description,
    };
    watchDevice(device);
    return device;
  }
  function watchDevice(createdDevice) {
    createdDevice.lost.then(({ reason, message }) => {
      if (reason === "destroyed" || disposed) return;
      diagnostics.errors.push(`GPU device lost: ${message}`);
      diagnostics.ready = false;
      paused = true;
      updatePause();
      if (device === createdDevice) device = null;
      $(".lab-status").textContent =
        "GPU device lost. Reset the scene to reconnect.";
      $(".lab-status").classList.add("lab-error");
    });
    createdDevice.addEventListener("uncapturederror", (e) => {
      diagnostics.errors.push(e.error.message);
      $(".lab-status").textContent = e.error.message;
      $(".lab-status").classList.add("lab-error");
    });
  }
  async function load(wanted) {
    const epoch = ++generation;
    diagnostics.ready = false;
    pending = true;
    sceneLoading(root, "Building the scene and preparing physics…");
    await paintLoading();
    if (epoch !== generation) return;
    $("#lab-renderer").disabled = true;
    gpuFramesInFlight = 0;
    await collection;
    if (device) await device.queue.onSubmittedWorkDone();
    playground?.destroy();
    pegs?.destroy();
    pegs = null;
    playground = null;
    renderer?.dispose();
    sleep?.dispose();
    if (gpu && sim) sim.destroy();
    else gpu?.destroy();
    cpu?.destroy();
    glPipeline?.destroy();
    glPipeline = null;
    if (babylonEngine) {
      babylonEngine.dispose();
      babylonEngine = null;
      device = null;
    }
    renderer = gpu = cpu = live = sim = solver = sleep = null;
    canvas?.remove();
    current = canonicalScenes.find((s) => s.id === scene.value);
    $("#lab-enhanced").disabled = current.dimension !== 3;
    const previous =
      wanted === "cpu"
        ? "ref"
        : wanted === "webgpu"
          ? "gpu"
          : (wanted ?? backend.value);
    backendOptions(current.dimension);
    if ([...backend.options].some((o) => o.value === previous && !o.disabled))
      backend.value = previous;
    else
      backend.value =
        [...backend.options].find((o) => !o.disabled)?.value ?? "gpu";
    const requestedRenderer = $("#lab-renderer").value;
    rendererOptions(
      backend.value === "gpu"
        ? preferredGpuRenderer
        : !diagnostics.backend && query.has("renderer")
          ? query.get("renderer")
          : previous === diagnostics.backend
            ? requestedRenderer
            : undefined,
    );
    diagnostics.contactCheck = null;
    $("#lab-gpu-check-save").disabled = true;
    $("#lab-gpu-check-status").textContent =
      backend.value === "gpu"
        ? "Opening a 3D GPU scene checks that a box, sphere and capsule stay on the floor."
        : "CPU mode does not require a GPU contact check.";
    $("#lab-benchmark-result").textContent =
      "Measures physics separately from drawing. The scene advances during the measurement.";
    const built = current.terrain
      ? buildTerrainScene(current, importedTerrain)
      : buildCanonicalScene(
          current.id,
          backend.value === "webgl2" ? "gpu" : backend.value,
        );
    $("#lab-terrain-controls").hidden = !current.terrain;
    diagnostics.terrain = built.terrain ?? null;
    if (built.terrain)
      $("#lab-terrain-status").textContent =
        `${built.terrain.name}: ${built.terrain.triangles.toLocaleString()} triangles, ${built.terrain.colliders.toLocaleString()} static collision pieces, ${built.terrain.surfaces} rendered surfaces.`;
    castle = built.castle ?? null;
    demolition = built.demolition ?? null;
    features = built.features ?? null;
    tearable = built.tearable ?? null;
    if (castle) {
      const indices = new Map(built.solver.bodies.map((body, i) => [body, i]));
      castle.diagnostics = {
        workload: built.workload,
        parts: castle.parts.map((p) => ({
          referenceIndex: indices.get(p.body),
          part: p.part,
        })),
      };
      $("#lab-cannon-yaw").value = castleAim.yaw;
      $("#lab-cannon-elevation").value = castleAim.elevation;
      $("#lab-cannon-speed").value = castleAim.speed;
      updateAimLabels();
    }
    builtColors = built.renderOptions2D?.colors ?? [];
    sim = built.sim;
    solver = built.solver;
    if (backend.value !== "gpu") {
      const { CpuWorld } = await import("../shared/physics/cpuWorld.js");
      if (epoch !== generation) return;
      if (backend.value === "webgl2") {
        const { createWebglDemoWorld } = await import(
          new URL("/dist/experimental-webgl.js", location.href).href
        );
        const created = await createWebglDemoWorld(built);
        if (epoch !== generation) {
          created.pipeline.destroy();
          return;
        }
        cpu = created.world;
        glPipeline = created.pipeline;
      } else cpu = new CpuWorld(built, backend.value);
      if (current.dimension === 2) sim = cpu.sim;
      else solver = cpu.solver;
      if (cpu.bodyCount > 10000) {
        paused = true;
        updatePause();
      }
    }
    canvas = document.createElement("canvas");
    canvas.setAttribute(
      "aria-label",
      `${current.dimension}D ${current.name} AVBD simulation`,
    );
    view.prepend(canvas);
    try {
      if (current.dimension === 2) {
        fit2D();
        if (backend.value === "gpu") {
          await getDevice();
          if (epoch !== generation) return;
          Object.assign(sim.solver.params, parallelParams(), built.gpuParams);
          const options2D = {
            bodyCapacity: sim.bodyCount + 4096,
            ...built.gpuOptions2D,
          };
          sim = new GpuSim(
            built.scene
              ? built.scene.createSolver(device, options2D)
              : new GpuSolver2D(device, sim.solver, options2D),
          );
          sim.needStats = false;
          gpu = sim.solver;
          const Render2D = babylonEngine ? BabylonRenderer2D : GpuRenderer2D;
          renderer = new Render2D(device, canvas, sim, () => camera, {
            ...built.renderOptions2D,
            engine: babylonEngine,
          });
        } else ctx = canvas.getContext("2d");
        attach2D();
      } else {
        if ($("#lab-renderer").value !== "webgl") await getDevice();
        if (epoch !== generation) return;
        if (backend.value === "gpu") {
          $("#lab-gpu-check-status").textContent =
            "Checking GPU floor contacts…";
          diagnostics.contactCheck = await checkGpuContacts3D(device);
          if (epoch !== generation) return;
          $("#lab-gpu-check-save").disabled = false;
          $("#lab-gpu-check-status").textContent = diagnostics.contactCheck
            .passed
            ? diagnostics.contactCheck.compatibility
              ? "Passed using a GPU compatibility path: the box, sphere and capsule stayed on the floor. Physics settings are unchanged."
              : "Passed: the box, sphere and capsule stayed on the floor."
            : "Failed: this GPU did not keep all three shapes on the floor. Save the report to identify the failing contacts.";
          if (!diagnostics.contactCheck.passed)
            throw Error(
              "GPU floor-contact check failed. Open GPU contact check and save the diagnostic report.",
            );
          if (
            current.name === "Convex Hulls" &&
            device.limits.maxStorageBuffersPerShaderStage < 9
          )
            throw Error(
              "Convex hull scenes require nine storage buffers per shader stage.",
            );
          if (built.gpuOptions?.shaders?.solve)
            $("#lab-solver-mode").value = "auto";
          const options3D = appGpuSolverOptions(solver, {
            bodyCapacity: Math.max(1, solver.bodies.length),
            spatialSort: true,
            ...sceneGpuSolverOptions(current.id),
            ...built.gpuOptions,
            broadphase:
              $("#lab-broadphase").value === "auto"
                ? (built.gpuOptions?.broadphase ?? "auto")
                : $("#lab-broadphase").value,
            solverMode: built.gpuOptions?.shaders?.solve
              ? "auto"
              : $("#lab-solver-mode").value,
          });
          gpu = built.scene
            ? built.scene.createSolver(device, options3D)
            : new GpuSolver3D(device, solver, options3D);
          Object.assign(gpu.params, built.gpuParams);
        }
        if ($("#lab-renderer").value === "webgl") {
          const { CpuRenderer3D } =
            await import("../shared/rendering/cpuRenderer3D.js");
          if (epoch !== generation) return;
          renderer = new CpuRenderer3D(canvas, solver, {
            enhanced: $("#lab-enhanced").checked,
          });
        } else {
          const Render3D = babylonEngine
            ? BabylonRenderer3D
            : CanonicalRenderer;
          renderer = new Render3D(device, canvas, solver, gpu, {
            engine: babylonEngine,
            bodyCapacity: built.gpuOptions?.bodyCapacity,
            enhanced: $("#lab-enhanced").checked,
          });
        }
        if (renderer) renderer.sleep = sleep;
        if (built.play?.feed)
          renderer.fitExcluded = new Set(built.play.marbles);
        if (built.camera) renderer.setCamera(built.camera);
      }
      await renderer?.ready?.();
      live = gpu ?? cpu;
      $("#lab-sleep-label").hidden = false;
      $("#lab-sleep").checked =
        sleepSelection.get(current.id) ?? sceneSleepingDefault(built);
      {
        sleep = configureSceneSleeping(
          built,
          live,
          device,
          null,
          $("#lab-sleep").checked,
          true,
        );
        if (renderer) renderer.sleep = sleep;
      }
      bowling = built.bowling ? new PaperBowling(built, live, renderer) : null;
      $("#lab-bowl").hidden = !bowling;
      playground = built.play ? new PlayPhysics(device, built, live) : null;
      if (built.play?.pegs)
        pegs = playground.pegs = new GaltonPegs(canvas, renderer, built, live);
      if (
        playground &&
        localStorage.getItem("avbd-performance-meter") !== "open"
      )
        meter.open = false;
      $("#lab-play-controls").hidden = !playground;
      $("#lab-galton-chart").hidden = !playground?.feeder;
      $("#lab-galton-chart").replaceChildren();
      $("#lab-play-buttons").replaceChildren();
      $("#lab-play-status").textContent =
        "Choose an action, or drag a body in the scene.";
      for (const action of built.play?.actions ?? []) {
        const button = document.createElement("button");
        button.textContent = action.label;
        button.dataset.action = action.id;
        button.onclick = () => {
          playground.action(action.id);
          $("#lab-play-status").textContent =
            `${action.label}. Reset rebuilds the scene.`;
          if (action.id !== "restore-pegs") paused = false;
          updatePause();
        };
        $("#lab-play-buttons").append(button);
      }
      if (features?.kind === "filters") {
        features.entries = { coral: 0, blue: 0, purple: 0 };
        features.overlaps = new Set();
        features.shelfContacts = new Set();
        features.floorContacts = new Set();
        features.maxSensorImpulse = 0;
        const indices = [features.sensor, features.shelf, features.floor].map(
          featureIndex,
        );
        live.watchContacts({ indices, maxPairs: 128, maxEvents: 4096 });
      }
      steps = frames = 0;
      simulationSeconds = 0;
      diagnostics.frames = diagnostics.steps = 0;
      samples = [];
      stats = {};
      gpuProfile = {};
      diagnostics.samples = samples;
      accumulator = 0;
      last = performance.now();
      $(".lab-title h2").textContent =
        `${current.dimension}D · ${current.name}`;
      $(".lab-title span").textContent =
        `${sim?.bodyCount ?? solver.bodies.length} bodies · ${backend.selectedOptions[0].textContent}`;
      $("#lab-iterations").value = sim?.params.iterations ?? solver.iterations;
      defaultStepRate = Math.round(1 / (sim?.params.dt ?? solver.dt));
      applyStepRate(stepRateOverride ?? defaultStepRate);
      $("#lab-feature-controls").hidden = !features;
      $("#lab-motor-controls").hidden = features?.kind !== "hinges";
      $("#lab-filter-controls").hidden = features?.kind !== "filters";
      $("#lab-sensor-enabled").checked = true;
      $("#lab-blue-shelf").checked = false;
      $("#lab-shape-query").textContent =
        current.dimension === 2 ? "Cast a circle" : "Cast a sphere";
      $("#lab-query-result").textContent =
        "Queries look for coral balls and skip triggers. A circle or sphere can hit sooner than a thin ray.";
      $("#lab-tear-patch").hidden = !tearable;
      $("#lab-shoot").hidden = !(
        current.benchmark ||
        current.cannon ||
        demolition
      );
      $("#lab-shoot").textContent = demolition
        ? "Swing ball again"
        : current.cannon
          ? "Shoot"
          : "Launch cannonball";
      $("#lab-cannon-aim").hidden = !current.cannon;
      $("#lab-projectile").hidden = $("#lab-projectile-label").hidden = !(
        current.benchmark || current.cannon
      );
      $("#lab-projectile").value = "sphere";
      for (const option of $("#lab-projectile").options)
        option.disabled =
          (option.value === "capsule" || option.value === "cylinder") &&
          !!gpu &&
          !gpu.hulls;
      $("#lab-debug").checked =
        !current.benchmark &&
        !current.castle &&
        !current.tearable &&
        !current.terrain &&
        !current.showcase &&
        !current.stress &&
        !current.paper &&
        !current.playDemo;
      if (demolition) $("#lab-debug").checked = false;
      $("#lab-options").hidden = current.dimension !== 2;
      $("#lab-collision-options").hidden =
        current.dimension !== 3 || backend.value !== "gpu";
      $("#lab-detail-times").disabled =
        !gpu ||
        current.dimension !== 3 ||
        !device.features.has("timestamp-query");
      for (const input of root.querySelectorAll("[data-param]"))
        input.checked = !!sim?.params[input.dataset.param];
      $("#lab-description").textContent =
        current.description ??
        (current.stress
          ? `${(sim.bodyCount - 3).toLocaleString()} touching 2D boxes with gravity and friction. ${sim.params.iterations} solver iterations per step. Physics uses ${backend.selectedOptions[0].textContent}. Zoom in to inspect individual boxes.`
          : current.benchmark
            ? "100,000 movable bricks, one cannonball and a floor. Supported bricks can sleep; impacts and support removal wake them."
            : current.showcase
              ? "Large showcase scene. The selected physics backend runs collision checks and AVBD constraints; drawing is selected separately."
              : "Constraint links follow their local anchors; broken joints release their bodies.");
      $(".lab-help").textContent =
        current.dimension === 2
          ? "Drag a body to apply a constraint · right-click to add a box · wheel to zoom · Shift-drag to pan"
          : "Drag a body to pull it · drag the background or Alt-drag to orbit · wheel to zoom";
      $(".lab-status").classList.remove("lab-error");
      $(".lab-status").textContent = gpu
        ? `Fixed ${Math.round(1 / (sim?.params.dt ?? solver.dt))} Hz physics · GPU phase times sampled`
        : `Fixed ${Math.round(1 / (sim?.params.dt ?? solver.dt))} Hz physics · timings measured independently`;
      const url = new URL(location.href);
      url.searchParams.set(
        "demo",
        current.castle
          ? "cannon"
          : current.benchmark
            ? "gpu-stress"
            : "canonical",
      );
      url.searchParams.set("scene", current.id);
      url.searchParams.set("backend", backend.value);
      url.searchParams.set("renderer", $("#lab-renderer").value);
      url.searchParams.set("broadphase", $("#lab-broadphase").value);
      url.searchParams.set("solverMode", $("#lab-solver-mode").value);
      sleepSelection.writeUrl(url, current.id);
      history.replaceState(null, "", url);
      // Compile the first rendered/compute passes before timing interactive
      // frames. This is one real, counted physics step, never a fake dry run.
      if (gpu) {
        advance();
        draw();
        await device.queue.onSubmittedWorkDone();
      }
      last = performance.now();
      diagnostics.ready = true;
      sceneLoading(root, null);
      diagnostics.scene = current.id;
      diagnostics.backend = backend.value;
      draw();
      readings();
    } catch (e) {
      diagnostics.errorStack = e.stack;
      diagnostics.errors.push(e.message);
      sceneLoading(root, e.message, true);
      $(".lab-status").textContent = e.message;
      $(".lab-status").classList.add("lab-error");
      throw e;
    } finally {
      pending = false;
      $("#lab-renderer").disabled = false;
    }
  }
  function fit2D() {
    const ids = Array.from({ length: sim.bodyCount }, (_, i) => i).filter(
      (i) => sim.isDynamic(i) || Math.max(...sim.size(i)) < 60,
    );
    let lo = [Infinity, Infinity],
      hi = [-Infinity, -Infinity];
    for (const i of ids) {
      const p = sim.pose(i),
        s = sim.size(i);
      const c = Math.abs(Math.cos(p[2])),
        sn = Math.abs(Math.sin(p[2]));
      const extent = [(c * s[0] + sn * s[1]) / 2, (sn * s[0] + c * s[1]) / 2];
      for (let a = 0; a < 2; a++) {
        lo[a] = Math.min(lo[a], p[a] - extent[a]);
        hi[a] = Math.max(hi[a], p[a] + extent[a]);
      }
    }
    if (!ids.length) {
      lo = [-12, -3];
      hi = [12, 12];
    }
    lo[1] = Math.min(-2, lo[1]);
    camera = {
      x: (lo[0] + hi[0]) / 2,
      y: (lo[1] + hi[1]) / 2,
      scale: Math.max(
        0.01,
        Math.min(
          (view.clientWidth - 100) / (hi[0] - lo[0]),
          (view.clientHeight - 150) / (hi[1] - lo[1]),
        ),
      ),
    };
  }
  function point(e) {
    const r = canvas.getBoundingClientRect();
    return [
      (e.clientX - r.left - canvas.width / 2) / camera.scale + camera.x,
      -(e.clientY - r.top - canvas.height / 2) / camera.scale + camera.y,
    ];
  }
  function attach2D() {
    canvas.oncontextmenu = (e) => e.preventDefault();
    canvas.onpointerdown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      const p = point(e);
      if (e.button === 2) {
        sim.addBox([1, 0.5], 1, 0.5, [...p, 0], [0, 0, 0]);
        return;
      }
      if (e.shiftKey || e.button === 1) {
        drag = { pan: true, x: e.clientX, y: e.clientY };
        return;
      }
      const hit = sim.pick(...p);
      if (hit) {
        sim.startDrag(hit.body, hit.local, p);
        drag = { pan: false };
      }
    };
    canvas.onpointermove = (e) => {
      if (!drag) return;
      if (drag.pan) {
        camera.x -= (e.clientX - drag.x) / camera.scale;
        camera.y += (e.clientY - drag.y) / camera.scale;
        drag.x = e.clientX;
        drag.y = e.clientY;
      } else sim.moveDrag(...point(e));
    };
    canvas.onpointerup = () => {
      sim.endDrag();
      drag = null;
    };
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        camera.scale = Math.max(
          0.01,
          Math.min(300, camera.scale * Math.exp(-e.deltaY * 0.001)),
        );
      },
      { passive: false },
    );
  }
  function advance() {
    if (cpu) {
      if (cpu.backend === "webgl2" && steps % 10 === 0) {
        const epoch = generation;
        cpu.profileNextStep((profile) => {
          if (epoch === generation) gpuProfile = profile ?? {};
        });
      }
      if (cpu.backend === "webgl2" && current.dimension === 3)
        cpu.params.iterations = solver.iterations;
      cpu.step();
    } else if (sim) {
      if (gpu && steps % 10 === 0) gpu.profileNextStep((p) => (gpuProfile = p));
      sim.step();
    } else if (gpu) {
      sleep?.before();
      // Profiling splits the upstream step into extra compute passes. Sample
      // those phase timestamps instead of imposing their overhead every step.
      if (steps % 10 === 0) {
        const profile = $("#lab-detail-times").checked
          ? gpu.profileDetailedNextStep.bind(gpu)
          : gpu.profileNextStep.bind(gpu);
        profile((p) => (gpuProfile = p));
      }
      gpu.step();
      sleep?.after();
    } else solver.step();
    steps++;
    simulationSeconds += sim?.params.dt ?? solver.dt;

    diagnostics.steps = steps;
  }
  async function benchmarkSteps({ warmup = 10, count = 60 } = {}) {
    if (!diagnostics.ready || pending)
      throw Error("Wait for the scene to load.");
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 600 ||
      !Number.isInteger(warmup) ||
      warmup < 0 ||
      warmup > 60
    )
      throw Error("Use 1–600 measured steps and 0–60 warmup steps.");
    pending = true;
    const epoch = generation;
    const controls = [
      ...document.querySelectorAll(
        ".lab-sidebar button,.lab-sidebar input,.lab-sidebar select",
      ),
    ].map((control) => [control, control.disabled]);
    for (const [control] of controls) control.disabled = true;
    const assertCurrent = () => {
      if (generation !== epoch)
        throw Error("The scene changed during the measurement.");
    };
    try {
      await collection;
      assertCurrent();
      if (device) await device.queue.onSubmittedWorkDone();
      for (let i = 0; i < warmup; i++) advance();
      if (device) await device.queue.onSubmittedWorkDone();
      const times = [];
      for (let i = 0; i < count; i++) {
        const start = performance.now();
        advance();
        if (gpu) await device.queue.onSubmittedWorkDone();
        if (cpu?.backend === "webgl2")
          await cpu.readSelectedBodies(cpu.bodyCount ? [0] : [], {
            posesOnly: true,
          });
        assertCurrent();
        times.push(performance.now() - start);
        // Let controls repaint without including that pause in step timings.
        if (i % 10 === 9)
          await new Promise((resolve) => requestAnimationFrame(resolve));
        assertCurrent();
      }
      const sorted = [...times].sort((a, b) => a - b);
      const result = {
        scene: current.id,
        backend: backend.value,
        bodyCount: sim?.bodyCount ?? solver.bodies.length,
        timeStep: sim?.params.dt ?? solver.dt,
        warmup,
        sleepingEnabled: !!(sleep || live.sleeping),
        count,
        meanMs: times.reduce((a, b) => a + b, 0) / count,
        medianMs:
          (sorted[Math.floor((count - 1) / 2)] +
            sorted[Math.floor(count / 2)]) /
          2,
        p95Ms: sorted[Math.ceil(count * 0.95) - 1],
        timing:
          "Completed physics steps, including GPU submission/wait when selected. Excludes drawing. Not comparable to GPU timestamp-only paper results.",
      };
      diagnostics.benchmark = result;
      $("#lab-benchmark-result").textContent =
        `${backend.selectedOptions[0].textContent}: ${result.medianMs.toFixed(2)} ms typical, ${result.p95Ms.toFixed(2)} ms for slower steps. ${count} completed physics steps; drawing excluded. GPU measurements include submission and waiting, unlike GPU-only times in the paper comparison.`;
      draw();
      return result;
    } finally {
      if (generation === epoch) {
        pending = false;
        for (const [control, disabled] of controls) control.disabled = disabled;
        accumulator = 0;
        last = performance.now();
      }
    }
  }
  async function shoot() {
    if (demolition) return swingBall();
    if (!(current.benchmark || current.cannon)) return;
    const epoch = generation;
    if (epoch !== generation) return;
    const i = solver.bodies.length - 1;
    if (current.cannon) {
      const b = createCastleProjectile($("#lab-projectile").value, aimValues());
      solver.bodies[i] = b;
      live.rewriteBodies([live.gpuIndex(i)], [b]);
      renderer.replaceShape(i, b);
    } else {
      const b = solver.bodies[i];
      live
        .body(live.gpuIndex(i))
        .teleport(b.positionLin, b.positionAng)
        .setLinearVelocity(b.velocityLin)
        .setAngularVelocity(b.velocityAng);
      live.flushEdits();
    }
    paused = false;
    updatePause();
  }
  async function swingBall() {
    if (!demolition) return;
    const epoch = generation;
    if (epoch !== generation) return;
    live.editBodies(
      demolition.pendulum.map((b) => ({
        body: live.gpuIndex(solver.bodies.indexOf(b)),
        position: b.positionLin,
        rotation: b.positionAng,
        linearVelocity: b.velocityLin,
        angularVelocity: b.velocityAng,
      })),
    );
    live.flushEdits();
    paused = false;
    updatePause();
  }
  async function changeProjectile(kind) {
    if (!(current.benchmark || current.cannon)) return;
    const epoch = generation;
    if (epoch !== generation) return;
    const b = current.cannon
      ? createCastleProjectile(kind, aimValues())
      : createRookProjectile(kind);
    renderer.onUp();
    const i = solver.bodies.length - 1,
      id = live.gpuIndex(i);
    live.rewriteBodies([id], [b]);
    sleep?.setMass(id, b.mass);
    solver.bodies[i] = b;
    renderer.replaceShape(i, b);
    paused = false;
    updatePause();
  }
  function aimValues() {
    return {
      yaw: Number($("#lab-cannon-yaw").value),
      elevation: Number($("#lab-cannon-elevation").value),
      speed: Number($("#lab-cannon-speed").value),
    };
  }
  function updateAimLabels() {
    const aim = aimValues();
    $("#lab-cannon-yaw-value").textContent = `${aim.yaw}°`;
    $("#lab-cannon-elevation-value").textContent = `${aim.elevation}°`;
    $("#lab-cannon-speed-value").textContent = `${aim.speed} m/s`;
  }
  let aimGeneration = 0;
  async function updateCannonAim() {
    updateAimLabels();
    if (!castle || !live) return;
    const token = ++aimGeneration,
      epoch = generation;
    if (token !== aimGeneration || epoch !== generation || disposed) return;
    const b = createCastleBarrel(aimValues()),
      i = castle.barrelIndex;
    solver.bodies[i] = b;
    live.rewriteBodies([live.gpuIndex(i)], [b]);
    renderer.replaceShape(i, b);
    draw();
  }
  function draw() {
    pegs?.update();
    if (renderer) {
      renderer.draw($("#lab-debug").checked);
      return;
    }
    if (!ctx) return;
    const w = view.clientWidth,
      h = view.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.fillStyle = "#e9ebef";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(camera.scale, -camera.scale);
    ctx.translate(-camera.x, -camera.y);
    ctx.lineWidth = 1 / camera.scale;
    // Axes also give intentionally empty scenes a useful spatial reference.
    ctx.strokeStyle = "#d5dae2";
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.lineTo(100, 0);
    ctx.moveTo(0, -100);
    ctx.lineTo(0, 100);
    ctx.stroke();
    for (let i = 0; i < sim.bodyCount; i++) {
      const [x, y, a] = sim.pose(i),
        [sx, sy] = sim.size(i);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      const group =
        backend.value === "soa-colored" ? sim.solver.coloring.colors[i] : i;
      ctx.fillStyle = sim.isDynamic(i)
        ? `hsl(${190 + ((group * 37) % 80)} 35% ${65 + (group % 4) * 4}%)`
        : "#aaa89f";
      if (builtColors[i])
        ctx.fillStyle = `rgba(${builtColors[i]
          .slice(0, 3)
          .map((v) => Math.round(v * 255))
          .join(
            ",",
          )},${cpu?.solver.sensors.has(i) ? 0.25 : (builtColors[i][3] ?? 1)})`;
      ctx.strokeStyle = i === sim.dragBody ? "#3e5bd7" : "#53606c";
      const geometry = cpu ? shapesOf2D(cpu.solver)?.get(i) : null;
      ctx.beginPath();
      if (geometry?.[0] === 1) ctx.arc(0, 0, geometry[1], 0, 2 * Math.PI);
      else if (geometry?.[0] === 2) {
        const r = geometry[1],
          half = geometry[2];
        ctx.moveTo(-half, -r);
        ctx.lineTo(half, -r);
        ctx.arc(half, 0, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(-half, r);
        ctx.arc(-half, 0, r, Math.PI / 2, (3 * Math.PI) / 2);
      } else if (geometry?.[0] === 4) {
        const vertices = geometry.vertices;
        ctx.moveTo(vertices[0], vertices[1]);
        for (let k = 4; k < vertices.length; k += 4)
          ctx.lineTo(vertices[k], vertices[k + 1]);
        ctx.closePath();
      } else if (geometry?.[0] === 3) {
        ctx.moveTo(-1e5, 0);
        ctx.lineTo(1e5, 0);
        ctx.lineTo(1e5, -1e5);
        ctx.lineTo(-1e5, -1e5);
        ctx.closePath();
      } else ctx.rect(-sx / 2, -sy / 2, sx, sy);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if ($("#lab-debug").checked) {
      const lines = [],
        points = [];
      sim.debugGeometry(lines, points);
      ctx.strokeStyle = "#78533b";
      ctx.lineWidth = 1.5 / camera.scale;
      ctx.beginPath();
      for (let i = 0; i < lines.length; i += 4) {
        ctx.moveTo(lines[i], lines[i + 1]);
        ctx.lineTo(lines[i + 2], lines[i + 3]);
      }
      ctx.stroke();
      ctx.fillStyle = "#cc5270";
      for (let i = 0; i < points.length; i += 2) {
        ctx.beginPath();
        ctx.arc(points[i], points[i + 1], 2 / camera.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  async function collect() {
    const epoch = generation;
    if (live) {
      const counters = await live.readCounters();
      if (epoch !== generation) return;
      stats = counters;
      if (playground?.feeder) {
        const histogram = await playground.feeder.measure();
        if (epoch !== generation) return;
        if (histogram)
          $("#lab-galton-chart").innerHTML = galtonChart(
            histogram.bins,
            histogram.released,
            playground.play.marbles.length,
          );
      }
      live.adapt(counters);
      if (demolition) {
        const joints = await live.readJoints();
        if (epoch !== generation) return;
        stats.brokenBonds = demolition.bonds.filter(
          (b) =>
            joints[b.handle.slot * 32 + 3] === 0 &&
            joints[b.handle.slot * 32 + 7] === 0,
        ).length;
        demolition.brokenBonds = stats.brokenBonds;
      }
      if (features?.kind === "filters") {
        const events = await live.readContactEvents();
        if (epoch !== generation) return;
        if (events.dropped || events.full)
          throw Error("Trigger event storage is full");
        const sensor = featureIndex(features.sensor);
        const shelf = featureIndex(features.shelf),
          floor = featureIndex(features.floor);
        for (const event of events.events) {
          const watched = [sensor, shelf, floor].find(
            (i) => event.a === i || event.b === i,
          );
          if (watched === undefined) continue;
          const other = event.a === watched ? event.b : event.a;
          const lane = features.lanes.find((lane) =>
            lane.bodies.some((body) => featureIndex(body) === other),
          );
          const began = event.type === "begin";
          if (watched !== sensor) {
            const contacts =
              watched === shelf
                ? features.shelfContacts
                : features.floorContacts;
            if (began) contacts.add(other);
            else contacts.delete(other);
            continue;
          }
          if (began) {
            if (lane) features.entries[lane.name]++;
            features.overlaps.add(other);
            features.maxSensorImpulse = Math.max(
              features.maxSensorImpulse,
              Math.abs(event.impulse),
            );
          } else features.overlaps.delete(other);
        }
        stats.triggerEntries = Object.values(features.entries).reduce(
          (sum, count) => sum + count,
          0,
        );
        stats.triggerOverlaps = features.overlaps.size;
        $("#lab-trigger-events").textContent =
          `Trigger entries — coral: ${features.entries.coral}, blue: ${features.entries.blue}, purple: ${features.entries.purple}. Currently overlapping: ${features.overlaps.size}.`;
        features.contactColors = {};
        for (const lane of features.lanes)
          for (const body of lane.bodies) {
            const id = featureIndex(body);
            const state = features.overlaps.has(id)
              ? "trigger"
              : features.shelfContacts.has(id)
                ? "shelf"
                : features.floorContacts.has(id)
                  ? "floor"
                  : "free";
            features.contactColors[id] = state;
            const rgb =
              {
                trigger: [232, 189, 74],
                shelf: [64, 180, 116],
                floor: [54, 181, 219],
              }[state] ?? lane.color;
            const rgba = new Float32Array([...rgb.map((v) => v / 255), 1]);
            if (cpu) {
              if (current.dimension === 2) {
                builtColors[id] = [...rgba];
              } else renderer.setColor(id, rgba);
            } else if (current.dimension === 2)
              device.queue.writeBuffer(renderer.colors, id * 16, rgba);
            else
              device.queue.writeBuffer(renderer.visuals.styles, id * 32, rgba);
          }
        $("#lab-contact-colors").textContent =
          `${features.shelfContacts.size} balls touch the shelf; ${features.floorContacts.size} touch the floor; ${features.overlaps.size} overlap the trigger without being pushed.`;
      }
      if (sleep) {
        stats.awake = await sleep.readAwake();
        if (epoch !== generation) return;
      }
      if (gpu?.sleeping) {
        stats.sleeping = (await live.readSleepStats()).sleeping;
        if (epoch !== generation) return;
      }
      if ($("#lab-debug").checked) {
        await renderer?.updateJointVisibility();
        await renderer?.updateContacts?.();
      }
    } else if (sim) stats = sim.stats();
    else {
      stats = {
        contacts: solver.forces.reduce(
          (n, f) => n + (f.contacts?.length || 0),
          0,
        ),
        joints: solver.forces.filter((f) => "rA" in f).length,
      };
      if ($("#lab-debug").checked) await renderer.updateContacts();
    }
  }
  function readings() {
    if (gpu && current.dimension === 3) {
      const decision = gpu.solverDecision;
      $("#lab-solver-mode").disabled = decision.selected === "custom";
      $("#lab-solver-mode").value = decision.requested;
      const explanation = `${solverModeLabels[decision.selected]}. ${decision.reason}`;
      if ($("#lab-solver-reason").textContent !== explanation)
        $("#lab-solver-reason").textContent = explanation;
    }
    const s = samples.slice(-60),
      avg = (key) =>
        s.length ? s.reduce((n, x) => n + (x[key] || 0), 0) / s.length : 0;
    const glPhysics = cpu?.backend === "webgl2";
    const solve =
        glPhysics && gpuProfile.total !== undefined
          ? gpuProfile.total
          : sleep
            ? sleep.physicsTimer.latestMs
            : gpu
              ? gpuProfile.total
              : s.reduce((n, x) => n + x.solveMs, 0) /
                Math.max(
                  1,
                  s.reduce((n, x) => n + x.stepCount, 0),
                ),
      render =
        renderer?.kind === "babylon"
          ? renderer.renderStats.gpuDrawMs + renderer.renderStats.gpuCopyMs
          : gpu
            ? renderer.timer.latestMs
            : avg("renderMs");
    const row = (name, value) =>
      `<div class="lab-metric"><span>${name}</span><strong>${value}</strong></div>`;
    const ms = (v) =>
      Number.isFinite(v) ? `${v.toFixed(2)} ms` : "unavailable";
    $("#lab-readings").innerHTML =
      row(
        "Frame rate",
        paused
          ? "Paused"
          : s.length < 10
            ? "Measuring…"
            : `${(1000 / Math.max(1, avg("frameMs"))).toFixed(1)} FPS`,
      ) +
      row(
        glPhysics
          ? gpuProfile.total !== undefined
            ? "WebGL2 GPU physics step"
            : "WebGL2 CPU submission"
          : sleep
            ? "GPU physics step"
            : gpu
              ? "GPU AVBD step"
              : "CPU physics step",
        ms(solve),
      ) +
      row(
        renderer?.kind === "webgl"
          ? "WebGL drawing + pose uploads"
          : renderer?.kind === "babylon"
            ? "Babylon render + GPU copies"
            : gpu
              ? "GPU render"
              : "Render submission",
        ms(render),
      ) +
      (renderer?.renderStats
        ? row("Render CPU submission", ms(renderer.renderStats.cpuSubmitMs))
        : "") +
      (gpu || (glPhysics && gpuProfile.total !== undefined)
        ? Object.entries({
            collision: "Collision checks",
            solve: "Movement solver",
            adjacency: "Contact setup",
            coloring: "Work scheduling",
          })
            .map(([key, label]) => row(label, ms(gpuProfile[key])))
            .join("")
        : "") +
      (gpu && current.dimension === 3
        ? row(
            "Collision method",
            gpu.broadphase === "hploc" ? "GPU tree" : "Grid",
          )
        : "") +
      (gpuProfile.details && $("#lab-detail-times").checked
        ? Object.entries({
            broadphaseBuild: "Prepare collision search",
            broadphasePairs: "Find nearby pairs",
            narrowphase: "Check exact contacts",
            bodySolve: "Move and rotate bodies",
            contactUpdate: "Update contact forces",
          })
            .map(([key, label]) => row(label, ms(gpuProfile.details[key])))
            .join("")
        : "") +
      row(
        "Contacts / joints",
        `${stats.contacts ?? 0} / ${stats.joints ?? gpu?.jointCount ?? 0}`,
      ) +
      (demolition
        ? row(
            "Broken stone bonds",
            `${demolition.brokenBonds ?? 0} / ${demolition.bonds.length}`,
          )
        : "") +
      (gpu?.sleeping
        ? row("Sleeping bodies", (stats.sleeping ?? 0).toLocaleString())
        : "") +
      (sleep
        ? row("Awake blocks", (stats.awake ?? 0).toLocaleString()) +
          row("GPU wake checks", ms(sleep.timer.latestMs))
        : "") +
      (sim && stats.colors
        ? row(
            "Solve groups / conflicts",
            `${stats.colors} / ${stats.colorConflicts ?? stats.clashes ?? 0}`,
          )
        : "") +
      row("Simulation", `${steps} steps · ${simulationSeconds.toFixed(1)} s`) +
      row(
        "Simulation rate",
        paused
          ? "Paused"
          : s.length < 10
            ? "Measuring…"
            : `${((s.reduce((n, x) => n + x.stepCount, 0) * (sim?.params.dt ?? solver.dt) * 1000) / s.reduce((n, x) => n + x.frameMs, 0)).toFixed(2)}× real time`,
      ) +
      (gpu
        ? row(
            "Capacity overflow / clashes",
            `${stats.overflow ?? 0} / ${stats.clashes ?? 0}`,
          )
        : "");
    const chart = $(".lab-chart"),
      c = chart.getContext("2d"),
      v = samples.slice(-120);
    c.clearRect(0, 0, chart.width, chart.height);
    const max = Math.max(
      16.7,
      ...v.map((x) => Math.max(x.solveMs, x.renderMs)),
    );
    for (const [key, color] of [
      ["solveMs", "#3e5bd7"],
      ["collisionMs", "#297652"],
      ["renderMs", "#c6783c"],
    ]) {
      c.strokeStyle = color;
      c.beginPath();
      v.forEach((x, i) => {
        const px = (i / 119) * chart.width,
          py = chart.height - 4 - ((x[key] ?? 0) / max) * (chart.height - 8);
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      });
      c.stroke();
    }
  }
  function tick(now) {
    animation = requestAnimationFrame(tick);
    if (disposed || pending || gpuFramesInFlight >= 2 || !diagnostics.ready)
      return;
    const elapsed = now - last;
    last = now;
    let solveMs = 0;
    const stepsBefore = steps;
    const start = performance.now();
    if (!paused) {
      accumulator = Math.min(accumulator + elapsed, 100);
      let count = 0;
      const stepMs = (sim?.params.dt ?? solver.dt) * 1000;
        const stepBudget = physicsStepsPerFrame(gpuProfile);
        while (accumulator + 1e-9 >= stepMs && count < stepBudget) {
        advance();
        accumulator = Math.max(0, accumulator - stepMs);
        count++;
      }
    }
    solveMs = performance.now() - start;
    const renderStart = performance.now();
    draw();
    if (cpu?.backend === "webgl2") {
      const epoch = generation;
      gpuFramesInFlight++;
      cpu
        .refreshForDrawing()
        .then(
          () => {
            if (epoch === generation) draw();
          },
          (error) => {
            if (epoch === generation) diagnostics.errors.push(error.message);
          },
        )
        .finally(() => {
          if (epoch === generation) gpuFramesInFlight--;
        });
    }
    if (gpu) {
      const epoch = generation;
      gpuFramesInFlight++;
      const frameCompleted = () => {
        if (epoch === generation) gpuFramesInFlight--;
      };
      device.queue.onSubmittedWorkDone().then(frameCompleted, frameCompleted);
    }
    if (!paused)
      samples.push({
        frameMs: elapsed,
        stepCount: steps - stepsBefore,
        solveMs: sleep
          ? (sleep.physicsTimer.latestMs ?? 0)
          : gpu
            ? (gpuProfile.total ?? 0)
            : solveMs,
        renderMs: gpu
          ? (renderer.timer.latestMs ?? 0)
          : performance.now() - renderStart,
        collisionMs: gpuProfile.collision ?? 0,
        constraintMs: gpuProfile.solve ?? 0,
        adjacencyMs: gpuProfile.adjacency ?? 0,
        coloringMs: gpuProfile.coloring ?? 0,
      });
    if (samples.length > 300) samples.shift();
    frames++;
    diagnostics.frames = frames;
    diagnostics.steps = steps;
    if (frames % 20 === 0) {
      collection = collect().catch((e) => diagnostics.errors.push(e.message));
      readings();
    }
  }
  scene.onchange = () => load().catch(console.error);
  $("#lab-renderer").onchange = () => {
    if (backend.value === "gpu")
      preferredGpuRenderer = $("#lab-renderer").value;
    return load(backend.value).catch((e) => diagnostics.errors.push(e.message));
  };
  $("#lab-benchmark").onclick = () =>
    benchmarkSteps().catch((e) => diagnostics.errors.push(e.message));
  $("#lab-shoot").onclick = () =>
    shoot().catch((e) => diagnostics.errors.push(e.message));
  $("#lab-sleep").onchange = (e) => {
    sleepSelection.set(current.id, e.target.checked);
    sleep = configureSceneSleeping(
      { def: current, solver },
      live,
      device,
      sleep,
      e.target.checked,
    );
    if (renderer) renderer.sleep = sleep;
    history.replaceState(
      null,
      "",
      sleepSelection.writeUrl(new URL(location.href), current.id),
    );
  };
  $("#lab-bowl").onclick = () => {
    try {
      bowling?.launch();
      paused = false;
      updatePause();
    } catch (e) {
      diagnostics.errors.push(e.message);
    }
  };
  $("#lab-projectile").onchange = (e) =>
    changeProjectile(e.target.value).catch((e) =>
      diagnostics.errors.push(e.message),
    );
  for (const id of [
    "#lab-cannon-yaw",
    "#lab-cannon-elevation",
    "#lab-cannon-speed",
  ])
    $(id).oninput = () =>
      updateCannonAim().catch((e) => diagnostics.errors.push(e.message));
  const onCannonKey = (e) => {
    if (
      e.code === "Space" &&
      (current?.cannon || demolition) &&
      !e.repeat &&
      !e.target.closest?.(
        "input,select,textarea,button,summary,a,[role=button]",
      )
    ) {
      e.preventDefault();
      shoot().catch((e) => diagnostics.errors.push(e.message));
    }
  };
  window.addEventListener("keydown", onCannonKey);
  for (const input of root.querySelectorAll("[data-param]"))
    input.onchange = () => {
      if (sim) sim.params[input.dataset.param] = input.checked;
    };
  backend.onchange = () => load(backend.value).catch(console.error);
  $("#lab-broadphase").onchange = () =>
    load(backend.value).catch(console.error);
  $("#lab-solver-mode").onchange = () => {
    if (!gpu || current.dimension !== 3) return;
    gpu.setSolverMode($("#lab-solver-mode").value);
    const url = new URL(location.href);
    url.searchParams.set("solverMode", $("#lab-solver-mode").value);
    history.replaceState(null, "", url);
    readings();
  };
  $("#lab-reset").onclick = () => load(backend.value).catch(console.error);
  $("#lab-pause").onclick = () => {
    paused = !paused;
    accumulator = 0;
    updatePause();
  };
  $("#lab-step").onclick = () => {
    paused = true;
    updatePause();
    advance();
    if (cpu?.refreshForDrawing)
      cpu
        .refreshForDrawing()
        .then(draw)
        .catch((error) => diagnostics.errors.push(error.message));
    draw();
    readings();
  };
  $("#lab-fit").onclick = async () => {
    if (sim) fit2D();
    else renderer.fit(gpu ? await gpu.readBodies() : null);
    draw();
  };
  const terrainFile = $("#lab-terrain-file"),
    terrainDefault = $("#lab-terrain-default");
  async function reloadTerrain(mesh) {
    importedTerrain = mesh;
    const url = new URL(location.href);
    if (mesh) url.searchParams.set("terrain", "uploaded");
    else url.searchParams.delete("terrain");
    history.replaceState(null, "", url);
    await load(backend.value);
  }
  terrainFile.onchange = async () => {
    const file = terrainFile.files?.[0];
    if (!file) return;
    terrainFile.disabled = terrainDefault.disabled = true;
    try {
      if (file.size > 20 * 1024 ** 2)
        throw Error("Choose a mesh smaller than 20 MB for this preview.");
      const mesh = parseTerrainMesh(await file.text(), file.name);
      storeImportedTerrain(mesh);
      await reloadTerrain(mesh);
    } catch (error) {
      $("#lab-terrain-status").textContent = error.message;
    } finally {
      terrainFile.disabled = terrainDefault.disabled = false;
      terrainFile.value = "";
    }
  };
  terrainDefault.onclick = async () => {
    terrainFile.disabled = terrainDefault.disabled = true;
    try {
      await reloadTerrain(null);
    } catch (error) {
      $("#lab-terrain-status").textContent = error.message;
    } finally {
      terrainFile.disabled = terrainDefault.disabled = false;
    }
  };
  $("#lab-iterations").onchange = (e) => {
    const value = Math.max(
      1,
      Math.min(40, Math.round(Number(e.target.value) || 10)),
    );
    e.target.value = value;
    if (sim) sim.params.iterations = value;
    else {
      solver.iterations = value;
      if (gpu) gpu.params.iterations = value;
    }
  };
  function applyStepRate(rate) {
    live.params.dt = 1 / rate;
    if (sim) sim.params.dt = 1 / rate;
    if (solver) solver.dt = 1 / rate;
    $("#lab-step-rate").value = rate;
    accumulator = 0;
    last = performance.now();
    samples = [];
    diagnostics.samples = samples;
  }
  function changeStepRate(rate) {
    stepRateOverride = readStepRate(rate);
    applyStepRate(stepRateOverride ?? defaultStepRate);
    const url = new URL(location.href);
    if (stepRateOverride === undefined) {
      query.delete("hz");
      url.searchParams.delete("hz");
    } else {
      query.set("hz", stepRateOverride);
      url.searchParams.set("hz", stepRateOverride);
    }
    history.replaceState(null, "", url);
    $(".lab-status").textContent =
      `Fixed ${$("#lab-step-rate").value} Hz physics`;
    readings();
  }
  $("#lab-step-rate").onchange = (e) => changeStepRate(e.target.value);
  $("#lab-step-rate-default").onclick = () => changeStepRate(undefined);
  initialization = load(
    query.get("backend") ?? (navigator.gpu ? "gpu" : "ref"),
  ).catch(() => {});
  await initialization;
  updatePause();
  if (!disposed) animation = requestAnimationFrame(tick);
  async function dispose() {
    if (diagnostics.disposed) return;
    disposed = true;
    generation++;
    cancelAnimationFrame(animation);
    window.removeEventListener("keydown", onCannonKey);
    await initialization;
    await collection.catch(() => {});
    if (device) await device.queue.onSubmittedWorkDone();
    playground?.destroy();
    pegs?.destroy();
    playground = null;
    renderer?.dispose();
    sleep?.dispose();
    if (gpu && sim) sim.destroy();
    else gpu?.destroy();
    babylonEngine?.dispose();
    device?.destroy();
    diagnostics.disposed = true;
    diagnostics.ready = false;
    root.replaceChildren();
  }
  return {
    dispose,
  };
}
