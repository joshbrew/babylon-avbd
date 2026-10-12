import { PlayPhysics } from "../playground/physics.js";
import {
  createWebGPUDevice,
  prepareWebGPUDevice3D,
} from "../../../src/gpu/device.js";
import { NativeGpuSolver3D } from "../../../src/native/solver3D.js";
import { NativeGpuSolver2D } from "../../../src/native/solver2D.js";
import { sceneGpuSolverOptions } from "../../../src/gpu/gpuSolverOptions.js";
import { buildCanonicalScene, canonicalScenes } from "../../lab/scenes.js";
import { CanonicalRenderer } from "../rendering/canonicalRenderer.js";
import { GpuRenderer2D } from "../rendering/gpuRenderer2D.js";
import { buildNavalScene, navalBroadphase } from "../../naval/scene.js";
import { NavalWater } from "../../naval/water.js";
import { CpuWorld } from "../physics/cpuWorld.js";
import { CpuRenderer2D } from "../rendering/cpuRenderer2D.js";
import { buildSlingshotScene2D } from "../../slingshot/scene.js";
import { SlingshotControls2D } from "../../slingshot/controls2D.js";
import { SiegeDamage } from "../../slingshot/damage.js";
import { PaperBowling } from "../../paper-benchmarks/bowling.js";
import {
  sceneSleepingDefault,
  sceneSleepingOptions,
  configureSceneSleeping,
} from "./sleepPolicy.js";
import { GaltonPegs } from "../../galton-board/pegs.js";
import { readStepRate } from "./stepRate.js";
import { buildTerrainScene, terrainScene } from "../../terrain/scene.js";

/** The same scene/solver/renderer construction in a page or dedicated worker. */
export async function createSimulationSession(
  canvas,
  config,
  progress = () => {},
  graphics,
) {
  progress("Building scene…");
  const naval = config.scene === "naval";
  const cpu = config.backend === "cpu";
  if (graphics && (cpu || config.renderer === "babylon"))
    throw Error(
      "Shared graphics require the direct WebGPU renderer and solver",
    );
  if (naval && cpu)
    throw Error("The naval water and buoyancy simulation requires WebGPU.");
  if (cpu && config.renderer === "babylon")
    throw Error(
      "CPU comparisons use Canvas 2D or the direct WebGPU renderer. Babylon worker comparisons use WebGPU physics.",
    );
  if (naval && config.renderer === "babylon")
    throw Error(
      "The naval water renderer uses direct WebGPU; Babylon comparisons use the rigid-body scenes.",
    );
  const built = naval
    ? buildNavalScene()
    : config.scene === terrainScene.id && config.terrainMesh
      ? buildTerrainScene(terrainScene, config.terrainMesh)
      : config.scene === "2d-slingshot-siege" && config.bricks
        ? buildSlingshotScene2D(undefined, Number(config.bricks))
        : buildCanonicalScene(config.scene, "gpu");
  progress("Starting the graphics device…");
  const dimension = naval ? 3 : built.def.dimension;
  let engine,
    device,
    gpu,
    renderer,
    water,
    playground,
    slingshot,
    damage,
    bowling,
    supportSleep,
    pegs,
    info;
  let destroyed = false;
  const errors = [];
  try {
    const babylon =
      config.renderer === "babylon"
        ? await import("../rendering/babylonGpuRenderer.js")
        : null;
    if (cpu && dimension === 2) info = {};
    else if (config.renderer === "babylon")
      ({ engine, device, info } = await babylon.createBabylonEngine(
        canvas,
        config.enhanced ?? false,
      ));
    else if (graphics) {
      device = graphics.device;
      info = graphics.adapter.info;
    } else {
      const created = await createWebGPUDevice({
        preferredLimits: {
          maxStorageBuffersPerShaderStage: 9,
          maxStorageBufferBindingSize: 512 * 1024 ** 2,
          maxBufferSize: 1024 ** 3,
        },
      });
      device = created.device;
      info = created.adapter.info;
    }
    device?.addEventListener("uncapturederror", (event) =>
      errors.push(event.error.message),
    );
    device?.lost.then((info) => {
      if (!destroyed) errors.push(`WebGPU device lost: ${info.message}`);
    });
    progress("Checking GPU contacts…");
    if (dimension === 3 && !cpu) await prepareWebGPUDevice3D(device);
    progress("Preparing physics buffers and pipelines…");
    if (cpu) gpu = new CpuWorld(built, "soa-seq");
    if (naval) {
      gpu = built.world.createSolver(device, {
        broadphase: navalBroadphase(config.broadphase),
        solverMode: config.solverMode ?? "auto",
        minimumColors: 8,
        minimumColorRounds: 8,
      });
      renderer = new CanonicalRenderer(device, canvas, built.world.ref, gpu, {
        enhanced: config.enhanced ?? true,
      });
      renderer.clearColor = { r: 0.78, g: 0.89, b: 0.9, a: 1 };
      renderer.setCamera({
        distance: 40,
        target: [0, 5, 0.4],
        azimuth: 140,
        elevation: 0.58,
      });
      water = new NavalWater(device, built, gpu, renderer);
    } else if (dimension === 3) {
      const options = {
        ...sceneGpuSolverOptions(config.scene),
        ...built.gpuOptions,
        broadphase:
          !config.broadphase || config.broadphase === "auto"
            ? (built.gpuOptions?.broadphase ?? "auto")
            : config.broadphase,
        solverMode: built.gpuOptions?.shaders?.solve
          ? "auto"
          : (config.solverMode ?? "auto"),
      };
      if (!cpu)
        gpu = built.scene
          ? built.scene.createSolver(device, options)
          : new NativeGpuSolver3D(device, built.solver, options);
      Object.assign(gpu.params, built.gpuParams);
      supportSleep = configureSceneSleeping(
        built,
        gpu,
        device,
        null,
        config.sleeping ?? sceneSleepingDefault(built),
        true,
      );
      progress("Preparing scene drawing…");
      renderer =
        config.renderer === "babylon"
          ? new babylon.BabylonRenderer3D(device, canvas, built.solver, gpu, {
              engine,
              enhanced: config.enhanced ?? false,
            })
          : new CanonicalRenderer(
              device,
              canvas,
              cpu ? gpu.solver : built.solver,
              cpu ? null : gpu,
              {
                enhanced: config.enhanced ?? false,
                bodyCapacity: built.gpuOptions?.bodyCapacity,
              },
            );
      if (built.play?.feed) renderer.fitExcluded = new Set(built.play.marbles);
      renderer.sleep = supportSleep;
      if (built.camera) renderer.setCamera(built.camera);
      if (built.bowling) bowling = new PaperBowling(built, gpu, renderer);
    } else {
      if (!cpu)
        gpu = built.scene
          ? built.scene.createSolver(device, built.gpuOptions2D)
          : new NativeGpuSolver2D(device, built.sim.solver, built.gpuOptions2D);
      if (!(config.sleeping ?? sceneSleepingDefault(built)))
        gpu.disableSleeping();
      else {
        gpu.enableSleeping(sceneSleepingOptions(built));
      }
      // Drawing uses live buffers and needs no full-world picking readback.
      const sim = {
        solver: gpu,
        get bodyCount() {
          return gpu.bodyCount;
        },
        dragBody: -1,
      };
      const lo = [Infinity, Infinity],
        hi = [-Infinity, -Infinity];
      for (let i = 0; i < built.sim.bodyCount; i++) {
        const p = built.sim.pose(i),
          size = built.sim.size(i);
        if (Math.max(...size) > 100) continue;
        for (let k = 0; k < 2; k++) {
          lo[k] = Math.min(lo[k], p[k] - size[k] / 2);
          hi[k] = Math.max(hi[k], p[k] + size[k] / 2);
        }
      }
      const camera = {
        x: (lo[0] + hi[0]) / 2 || 0,
        y: (lo[1] + hi[1]) / 2 || 0,
        scale: Math.max(
          1,
          Math.min(
            canvas.clientWidth / Math.max(10, hi[0] - lo[0]),
            canvas.clientHeight / Math.max(10, hi[1] - lo[1]),
          ) * 0.85,
        ),
      };
      if (config.scene === "2d-slingshot-siege") {
        camera.x = built.centerX;
        camera.y = built.height * 0.47;
        camera.scale = Math.min(
          canvas.clientWidth / built.width,
          canvas.clientHeight / (built.height + 3),
        );
      }
      renderer = cpu
        ? new CpuRenderer2D(
            null,
            canvas,
            sim,
            () => camera,
            built.renderOptions2D,
          )
        : config.renderer === "babylon"
          ? new babylon.BabylonRenderer2D(device, canvas, sim, () => camera, {
              ...built.renderOptions2D,
              engine,
            })
          : new GpuRenderer2D(
              device,
              canvas,
              sim,
              () => camera,
              built.renderOptions2D,
            );
      if (config.scene === "2d-slingshot-siege")
        slingshot = new SlingshotControls2D(
          canvas,
          camera,
          built,
          gpu,
          renderer,
        );
      else {
        let pointer;
        canvas.addEventListener("pointerdown", (event) => {
          pointer = [event.clientX, event.clientY];
        });
        canvas.addEventListener("pointermove", (event) => {
          if (!pointer) return;
          camera.x -= (event.clientX - pointer[0]) / camera.scale;
          camera.y += (event.clientY - pointer[1]) / camera.scale;
          pointer = [event.clientX, event.clientY];
        });
        canvas.addEventListener("pointerup", () => {
          pointer = null;
        });
        canvas.addEventListener("pointercancel", () => {
          pointer = null;
        });
      }
      canvas.addEventListener("wheel", (event) => {
        event.preventDefault();
        camera.scale = Math.max(
          0.1,
          Math.min(2000, camera.scale * Math.exp(-event.deltaY * 0.001)),
        );
      });
    }
    progress("Connecting scene controls…");
    const defaultStepRate = 1 / gpu.params.dt;
    const stepRate = readStepRate(config.hz);
    if (stepRate !== undefined) gpu.params.dt = 1 / stepRate;
    if (naval && config.sleeping)
      gpu.enableSleeping(sceneSleepingOptions(built));
    if (built.play) playground = new PlayPhysics(device, built, gpu);
    await renderer.ready?.();
    if (built.play?.pegs)
      pegs = playground.pegs = new GaltonPegs(canvas, renderer, built, gpu);
    if (slingshot)
      slingshot.damage = damage = new SiegeDamage(gpu, built, renderer);
    const adapter = {
      vendor: info.vendor,
      architecture: info.architecture,
      device: info.device,
      description: info.description,
    };
    return {
      device,
      gpu,
      renderer,
      water,
      playground,
      slingshot,
      damage,
      bowling,
      pegs,
      built,
      dimension,
      defaultStepRate,
      adapter,
      errors,
      cpu,
      get sleepingEnabled() {
        return !!(supportSleep || gpu.sleeping);
      },
      replaceBody(index, body) {
        const slot = gpu.gpuIndex(index);
        gpu.rewriteBodies([slot], [body]);
        supportSleep?.setMass(slot, body.mass);
        built.solver.bodies[index] = body;
        renderer.replaceShape(index, body);
      },
      setSleeping(enabled) {
        supportSleep = configureSceneSleeping(
          built,
          gpu,
          device,
          supportSleep,
          enabled,
        );
        renderer.sleep = supportSleep;
      },
      readSleepStats() {
        const policy = supportSleep;
        return policy
          ? policy.readAwake().then((awake) => ({
              sleeping: policy.dynamicCount - awake,
              awake,
            }))
          : gpu.readSleepStats();
      },
      step() {
        supportSleep?.before();
        gpu.step();
        supportSleep?.after();
      },
      draw: () => {
        pegs?.update();
        renderer.draw(false);
      },
      destroy() {
        destroyed = true;
        playground?.destroy();
        pegs?.destroy();
        damage?.destroy();
        water?.destroy();
        renderer?.dispose();
        supportSleep?.dispose();
        gpu?.destroy();
        engine?.dispose();
        if (!graphics) device?.destroy();
      },
    };
  } catch (error) {
    destroyed = true;
    playground?.destroy();
    pegs?.destroy();
    damage?.destroy();
    water?.destroy();
    renderer?.dispose();
    supportSleep?.dispose();
    gpu?.destroy();
    engine?.dispose();
    if (!graphics) device?.destroy();
    throw error;
  }
}
export const workerScenes = [
  { id: "naval", name: "Little ships · waves and sinking", dimension: 3 },
  ...canonicalScenes,
];
