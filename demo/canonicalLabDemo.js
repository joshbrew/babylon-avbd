import "./canonicalLab.css";
import {
  canonicalScenes,
  buildCanonicalScene,
  createRookProjectile,
} from "./canonicalScenes.js";
import { NativeGpuSolver3D as GpuSolver3D } from "../src/native/solver3D.js";
import { CanonicalRenderer, packBodies } from "./canonicalRenderer.js";
import {
  createBabylonEngine,
  BabylonRenderer3D,
  BabylonRenderer2D,
} from "./babylonGpuRenderer.js";
import { GpuSleep } from "../src/gpu/gpuSleep.js";
import { GpuShapeSim2D as GpuSim } from "./gpuShapeSim2D.js";
import { NativeGpuSolver2D as GpuSolver2D } from "../src/native/solver2D.js";
import { parallelParams } from "../reference/three-avbd/src/avbd2d/ref/solver.ts";
import { GpuRenderer2D } from "./gpuRenderer2D.js";
import { labMarkup } from "./canonicalLabView.js";
import {
  appGpuSolverOptions,
  sceneGpuSolverOptions,
} from "../src/gpu/gpuSolverOptions.js";
import { solverModeLabels } from "../src/gpu/solverPolicy.js";
import {
  castleAim,
  createCastleProjectile,
  createCastleBarrel,
} from "./castleScene.js";
import { collisionGroups } from "./featureScenes.js";
import { visualOf, RING } from "../reference/three-avbd/src/avbd3d/visuals.ts";
import { checkGpuContacts3D } from "../src/gpu/contactCheck3D.js";

export async function startCanonicalLabDemo(root = document.body) {
  root.innerHTML = labMarkup;
  const meter = root.querySelector(".lab-metrics");
  const savedMeter = localStorage.getItem("avbd-performance-meter");
  meter.open =
    savedMeter === "open" || (savedMeter !== "closed" && innerWidth > 600);
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
  for (const groupKind of ["paper", "showcase", 3, 2]) {
    const group = document.createElement("optgroup");
    group.label =
      groupKind === "paper"
        ? "Paper workload comparisons"
        : groupKind === "showcase"
          ? "GPU showcase"
          : `${groupKind}D solver tests`;
    for (const s of canonicalScenes.filter((s) =>
      groupKind === "paper"
        ? s.paper
        : groupKind === "showcase"
          ? s.showcase
          : s.dimension === groupKind && !s.showcase && !s.paper,
    )) {
      const option = new Option(s.name, s.id);
      group.append(option);
    }
    scene.append(group);
  }
  const query = new URLSearchParams(location.search);
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
  $("#lab-renderer").value =
    query.get("renderer") === "babylon" ? "babylon" : "webgpu";
  $("#lab-enhanced").onchange = () => {
    if ($("#lab-renderer").value === "babylon") {
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
        : "showcase-brick-ring-28k";
  let sim,
    solver,
    gpu,
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
    animation,
    paused = query.get("paused") === "1",
    disposed = false,
    generation = 0,
    initialization,
    steps = 0,
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
    collection = Promise.resolve();
  const diagnostics = {
    scenes: canonicalScenes,
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
    dispose,
    shoot,
    swingBall,
    tearPatch,
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
      if (!["webgpu", "babylon"].includes(kind))
        throw Error("Unknown renderer");
      $("#lab-renderer").value = kind;
      await load("gpu");
    },
    pause: (value) => {
      paused = value;
      updatePause();
    },
    step: async (n = 1) => {
      for (let i = 0; i < n; i++) advance();
      if (device) await device.queue.onSubmittedWorkDone();
      draw();
    },
    snapshot: async ({ joints = false } = {}) => {
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
        poses,
        stats,
        samples,
        gpuProfile,
        broadphase: gpu?.broadphase ?? "grid",
        broadphaseDecision: gpu?.broadphaseDecision,
        solverDecision: gpu?.solverDecision,
        bvh: gpu?.bvh ? { ...gpu.bvh.stats } : null,
        sleepMs: sleep?.timer.latestMs,
        physicsMs: sleep?.physicsTimer.latestMs,
        projectileGpuIndex:
          (current.benchmark || current.cannon) && gpu
            ? gpu.gpuIndex(solver.bodies.length - 1)
            : undefined,
        projectile:
          current.benchmark || current.cannon
            ? poses.slice(
                gpu.gpuIndex(solver.bodies.length - 1) * 40,
                gpu.gpuIndex(solver.bodies.length - 1) * 40 + 3,
              )
            : null,
        errors: diagnostics.errors,
        rings: Array.from(
          renderer?.visuals?.ringScales ?? [],
          ([b, scale]) => ({
            index: gpu.gpuIndex(solver.bodies.indexOf(b)),
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
                gpu.gpuIndex(solver.bodies.indexOf(b)),
              ),
              bonds: demolition.bonds.map((b) => b.handle.slot),
              ball: gpu.gpuIndex(solver.bodies.indexOf(demolition.ball)),
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
                gpuIndex: gpu.gpuIndex(p.referenceIndex),
              })),
            }
          : undefined,
        jointStates:
          joints && gpu ? Array.from(await gpu.readJoints()) : undefined,
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
              renderedVertices: renderer.visuals.tears.count,
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
      : gpu.gpuIndex(solver.bodies.indexOf(body));
  }
  function driveMotors(reverse) {
    if (!gpu || features?.kind !== "hinges") return;
    for (const motor of features.motors) {
      motor.runningSpeed = reverse ? -(motor.runningSpeed || motor.speed) : 0;
      gpu.setMotor(motor.handle.slot, {
        speed: motor.runningSpeed,
        maxTorque: motor.maxTorque,
      });
    }
  }
  $("#lab-motor-reverse").onclick = () => driveMotors(true);
  $("#lab-motor-stop").onclick = () => driveMotors(false);
  $("#lab-blue-shelf").onchange = (event) => {
    if (!gpu || features?.kind !== "filters") return;
    const enabled = event.target.checked,
      G = collisionGroups;
    const blue = features.lanes.find((lane) => lane.name === "blue");
    const indices = [
      featureIndex(features.shelf),
      ...blue.bodies.map(featureIndex),
    ];
    gpu.setFilters(
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
    if (!gpu || features?.kind !== "filters") return;
    const enabled = event.target.checked,
      G = collisionGroups;
    gpu.setFilters(
      [featureIndex(features.sensor)],
      [G.sensor],
      [enabled ? G.coral | G.blue : 0],
    );
    features.sensorEnabled = enabled;
  };
  async function queryFeature(radius = 0) {
    if (!gpu || features?.kind !== "filters") return;
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
            ? gpu.circleCast(origin, radius, direction, options)
            : gpu.sphereCast(origin, radius, direction, options))
        : await gpu.raycast(origin, direction, options);
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
    if (!tearable || !gpu) return;
    const epoch = generation;
    const selected = new Set(
      solver.bodies.filter(
        (body) =>
          body.mass > 0 &&
          body.moment.every((value) => value === 0) &&
          Math.abs(body.positionLin[0] - 1.25) < 0.55 &&
          Math.abs(body.positionLin[1]) < 0.55,
      ),
    );
    const boundary = tearable.bonds.filter(
      (bond) => selected.has(bond.bodyA) !== selected.has(bond.bodyB),
    );
    const poses = await gpu.readBodies();
    if (epoch !== generation) return;
    const releasedSlots = boundary.map((bond) => renderer.forces.indexOf(bond));
    gpu.releaseJoints(releasedSlots);
    const indices = [...selected].map((body) =>
      gpu.gpuIndex(solver.bodies.indexOf(body)),
    );
    for (const index of indices)
      device.queue.writeBuffer(
        gpu.bodyBuffer,
        index * 160 + 128,
        new Float32Array([2, -2, poses[index * 40 + 34] + 2]),
      );
    gpu.wakeAll();
    tearable.detachedPatch = indices;
    draw();
    return { indices, releasedEdges: boundary.length, releasedSlots };
  }
  $("#lab-tear-patch").onclick = () =>
    tearPatch().catch((error) => diagnostics.errors.push(error.message));
  function backendOptions(dimension, gpuOnly) {
    backend.replaceChildren();
    for (const [value, label] of gpuOnly
      ? [["gpu", "Canonical WebGPU"]]
      : dimension === 2
        ? [
            ["gpu", "Canonical WebGPU"],
            ["ref", "Reference CPU"],
            ["soa-seq", "Sequential CPU"],
            ...(current.name === "Cards"
              ? []
              : [["soa-colored", "Colored CPU"]]),
          ]
        : gpuOnly
          ? [["gpu", "Canonical WebGPU"]]
          : [
              ["ref", "Reference CPU"],
              ["gpu", "Canonical WebGPU"],
            ])
      backend.append(new Option(label, value));
  }
  async function getDevice() {
    if ($("#lab-renderer").value === "babylon" && !babylonEngine) {
      device?.destroy();
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
    $("#lab-renderer").disabled = true;
    gpuFramesInFlight = 0;
    await collection;
    if (device) await device.queue.onSubmittedWorkDone();
    renderer?.dispose();
    sleep?.dispose();
    if (gpu && sim) sim.destroy();
    else gpu?.destroy();
    if (babylonEngine) {
      babylonEngine.dispose();
      babylonEngine = null;
      device = null;
    }
    renderer = gpu = sim = solver = sleep = null;
    canvas?.remove();
    current = canonicalScenes.find((s) => s.id === scene.value);
    $("#lab-enhanced").disabled = current.dimension !== 3;
    const previous =
      $("#lab-renderer").value === "babylon"
        ? "gpu"
        : (wanted ?? backend.value);
    backendOptions(current.dimension, current.gpuOnly);
    if ([...backend.options].some((o) => o.value === previous))
      backend.value = previous;
    const built = buildCanonicalScene(current.id, backend.value);
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
    sim = built.sim;
    solver = built.solver;
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
        await getDevice();
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
            broadphase: $("#lab-broadphase").value,
            solverMode: built.gpuOptions?.shaders?.solve
              ? "auto"
              : $("#lab-solver-mode").value,
          });
          gpu = built.scene
            ? built.scene.createSolver(device, options3D)
            : new GpuSolver3D(device, solver, options3D);
          Object.assign(gpu.params, built.gpuParams);
          if (current.benchmark) sleep = new GpuSleep(device, solver, gpu);
        }
        const Render3D = babylonEngine ? BabylonRenderer3D : CanonicalRenderer;
        renderer = new Render3D(device, canvas, solver, gpu, {
          engine: babylonEngine,
          enhanced: $("#lab-enhanced").checked,
        });
        renderer.sleep = sleep;
        if (built.camera) renderer.setCamera(built.camera);
      }
      await renderer?.ready?.();
      if (features?.kind === "filters") {
        features.entries = { coral: 0, blue: 0, purple: 0 };
        features.overlaps = new Set();
        features.shelfContacts = new Set();
        features.floorContacts = new Set();
        features.maxSensorImpulse = 0;
        const indices = [features.sensor, features.shelf, features.floor].map(
          featureIndex,
        );
        gpu.watchContacts({ indices, maxPairs: 128, maxEvents: 4096 });
      }
      steps = frames = 0;
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
        !current.showcase &&
        !current.stress &&
        !current.paper;
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
          ? `${(sim.bodyCount - 3).toLocaleString()} touching 2D boxes with gravity and friction. Ten solver iterations per step. Collision checks, movement and drawing run on the GPU. Zoom in to inspect individual boxes.`
          : current.benchmark
            ? "100,000 movable bricks, one cannonball and a floor. GPU sleeping wakes bricks on impact and when their supports move away. Full AVBD solves the active region."
            : current.showcase
              ? "Original GPU showcase construction: collision detection, AVBD constraints and rendering run on the GPU."
              : current.gpuOnly
                ? "True sphere and convex hull contacts, including angular inertia and friction. GPU shape extensions use the canonical 3D solver."
                : "Original scene construction from the pinned reference. Constraint links follow their local anchors; broken joints disappear.");
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
      diagnostics.scene = current.id;
      diagnostics.backend = backend.value;
      draw();
      readings();
    } catch (e) {
      diagnostics.errorStack = e.stack;
      diagnostics.errors.push(e.message);
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
    if (sim) {
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

    diagnostics.steps = steps;
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
      gpu.rewriteBodies([gpu.gpuIndex(i)], [b]);
      renderer.replaceShape(i, b);
    } else {
      const b = solver.bodies[i];
      gpu
        .body(gpu.gpuIndex(i))
        .teleport(b.positionLin, b.positionAng)
        .setLinearVelocity(b.velocityLin)
        .setAngularVelocity(b.velocityAng);
      gpu.flushEdits();
    }
    paused = false;
    updatePause();
  }
  async function swingBall() {
    if (!demolition) return;
    const epoch = generation;
    if (epoch !== generation) return;
    gpu.editBodies(
      demolition.pendulum.map((b) => ({
        body: gpu.gpuIndex(solver.bodies.indexOf(b)),
        position: b.positionLin,
        rotation: b.positionAng,
        linearVelocity: b.velocityLin,
        angularVelocity: b.velocityAng,
      })),
    );
    gpu.flushEdits();
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
      id = gpu.gpuIndex(i);
    gpu.rewriteBodies([id], [b]);
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
    if (!castle || !gpu) return;
    const token = ++aimGeneration,
      epoch = generation;
    if (token !== aimGeneration || epoch !== generation || disposed) return;
    const b = createCastleBarrel(aimValues()),
      i = castle.barrelIndex;
    solver.bodies[i] = b;
    gpu.rewriteBodies([gpu.gpuIndex(i)], [b]);
    renderer.replaceShape(i, b);
    draw();
  }
  function draw() {
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
      ctx.strokeStyle = i === sim.dragBody ? "#3e5bd7" : "#53606c";
      ctx.fillRect(-sx / 2, -sy / 2, sx, sy);
      ctx.strokeRect(-sx / 2, -sy / 2, sx, sy);
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
    if (gpu) {
      const counters = await gpu.readCounters();
      if (epoch !== generation) return;
      stats = counters;
      gpu.adapt(counters);
      if (demolition) {
        const joints = await gpu.readJoints();
        if (epoch !== generation) return;
        stats.brokenBonds = demolition.bonds.filter(
          (b) =>
            joints[b.handle.slot * 32 + 3] === 0 &&
            joints[b.handle.slot * 32 + 7] === 0,
        ).length;
        demolition.brokenBonds = stats.brokenBonds;
      }
      if (features?.kind === "filters") {
        const events = await gpu.readContactEvents();
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
            if (current.dimension === 2)
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
      if (current.dimension === 2 && gpu.sleeping) {
        stats.sleeping = (await gpu.readSleepStats()).sleeping;
        if (epoch !== generation) return;
      }
      if ($("#lab-debug").checked) {
        await renderer.updateJointVisibility();
        await renderer.updateContacts?.();
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
    const solve = sleep
        ? sleep.physicsTimer.latestMs
        : gpu
          ? gpuProfile.total
          : avg("solveMs"),
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
        sleep ? "GPU physics step" : gpu ? "GPU AVBD step" : "CPU solve",
        ms(solve),
      ) +
      row(
        renderer?.kind === "babylon"
          ? "Babylon render + GPU copies"
          : gpu
            ? "GPU render"
            : "Render submission",
        ms(render),
      ) +
      (renderer?.renderStats
        ? row("Render CPU submission", ms(renderer.renderStats.cpuSubmitMs))
        : "") +
      (gpu
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
      (gpu?.sleeping && current.dimension === 2
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
      row(
        "Simulation",
        `${steps} steps · ${(steps * (sim?.params.dt ?? solver.dt)).toFixed(1)} s`,
      ) +
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
      while (
        accumulator >= stepMs &&
        count <
          (current.stepsPerFrame ??
            (current.benchmark || (gpu && gpu.bodyCount > 10000) ? 1 : 3))
      ) {
        advance();
        accumulator -= stepMs;
        count++;
      }
    }
    solveMs = performance.now() - start;
    const renderStart = performance.now();
    draw();
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
  $("#lab-renderer").onchange = () =>
    load("gpu").catch((e) => diagnostics.errors.push(e.message));
  $("#lab-shoot").onclick = () =>
    shoot().catch((e) => diagnostics.errors.push(e.message));
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
    draw();
    readings();
  };
  $("#lab-fit").onclick = async () => {
    if (sim) fit2D();
    else renderer.fit(gpu ? await gpu.readBodies() : null);
    draw();
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
  initialization = load(query.get("backend") ?? "gpu").catch(() => {});
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
