import { buildCanonicalScene } from "../demo/lab/scenes.js";
import { sceneGpuSolverOptions } from "../src/gpu/gpuSolverOptions.js";
import { NativeGpuSolver3D } from "../src/native/solver3D.js";
import {
  createWebGPUDevice,
  prepareWebGPUDevice3D,
} from "../src/gpu/device.js";
import { assert, readBuffer } from "./helpers/gpu.js";

/** Exercise the actual startup-sleeping paper scenes through their first hit. */
export async function checkStartupImpact(scene) {
  const { device } = await createWebGPUDevice({
    preferredLimits: {
      maxStorageBuffersPerShaderStage: 9,
      maxStorageBufferBindingSize: 512 * 1024 * 1024,
      maxBufferSize: 1024 * 1024 * 1024,
    },
  });
  const errors = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let gpu;
  try {
    await prepareWebGPUDevice3D(device);
    const built = buildCanonicalScene(scene, "gpu");
    gpu = new NativeGpuSolver3D(device, built.solver, {
      ...sceneGpuSolverOptions(scene),
      ...built.gpuOptions,
    });
    gpu.enableSleeping({ startAsleep: true, timeThreshold: 0.3 });
    const initialSleep = await gpu.readSleepStats();
    assert(
      initialSleep.sleeping === 505920,
      "Every supported brick starts asleep",
    );
    const balls = [gpu.gpuIndex(505921), gpu.gpuIndex(505922)];
    const witness = gpu.gpuIndex(1);
    const initial = await gpu.readSelectedBodies(balls);
    let impact;
    for (let step = 1; step <= 80; step++) {
      gpu.step();
      const globals = new Uint32Array(
        await readBuffer(device, gpu.sleeping.globals),
      );
      const counters = await gpu.readCounters();
      assert(
        !counters.overflow && !counters.clashes,
        "Complete, conflict-free impact contacts",
      );
      assert(!globals[0], "Impact does not request a world-wide wake");
      if (!impact && globals[2]) {
        const contacts = await gpu.readContactList();
        const struck = [
          ...new Set(
            contacts.flatMap((c) =>
              balls.includes(c.a) ? [c.b] : balls.includes(c.b) ? [c.a] : [],
            ),
          ),
        ].filter((i) => i !== gpu.gpuIndex(0));
        assert(struck.length > 0, "The wake comes from a ball hitting bricks");
        const poses = await gpu.readSelectedBodies(struck);
        assert(
          struck.every((_, i) => poses[i * 40 + 19] > 0),
          "Every struck brick has its real mass on the first impact frame",
        );
        const ballPoses = await gpu.readSelectedBodies(balls);
        assert(
          balls.every((_, i) => ballPoses[i * 40 + 33] > 0),
          "Both bowling balls keep moving into the walls",
        );
        impact = {
          step,
          woken: globals[2],
          struck: struck.length,
          ballSpeeds: balls.map((_, i) => ballPoses[i * 40 + 33]),
        };
      }
      const untouched = await gpu.readSelectedBodies([witness]);
      assert(
        untouched[19] === 0,
        "A distant wall remains asleep throughout bowling",
      );
    }
    assert(impact, "Bowling physically wakes a sleeping wall");
    const after = await gpu.readSelectedBodies(balls);
    assert(
      balls.every((_, i) => after[i * 40 + 1] > initial[i * 40 + 1] + 15),
      "The balls push through the first wall instead of bouncing off a fixed sleeper",
    );
    assert(errors.length === 0, errors.join("\n"));
    return {
      scene,
      initialSleeping: initialSleep.sleeping,
      impact,
      ballTravel: balls.map((_, i) => after[i * 40 + 1] - initial[i * 40 + 1]),
      errors,
    };
  } finally {
    gpu?.destroy();
    device.destroy();
  }
}
