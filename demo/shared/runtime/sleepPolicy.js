import { GpuSleep } from "../../../src/gpu/gpuSleep.js";
import { sceneSleepPresets } from "./sleepPresets.js";

/**
 * Motion in world units/second; scene code can override either threshold.
 *
 * Demo-scale motion thresholds, expressed in world units/second and seconds.
 * 3D motion includes radius-scaled angular speed. A visually still dense pile
 * can stay awake if a connected member is moving or lacks stable support.
 */
export function sceneSleepingOptions(built) {
  const policy = built.gpuOptions2D?.sleeping;
  return {
    speedThreshold: 0.03,
    timeThreshold: built.def?.dimension === 2 ? 0.5 : 0.3,
    ...(policy && typeof policy === "object" ? policy : {}),
  };
}

/**
 * Restore masses before disposing the rook's precomputed support graph.
 *
 * Apply the interactive sleep policy. Startup sleep is for initial construction;
 * a live toggle must preserve current motion and restore masses before disposal.
 */
export function configureSceneSleeping(
  built,
  gpu,
  device,
  current,
  enabled,
  initial = false,
) {
  if (current && enabled) return current;
  if (current) {
    current.wakeAll();
    current.dispose();
  }
  // This scene is assembled at supported rest poses. Preserve its support-aware
  // initial sleeping policy; newly enabled sleeping must start from live motion.
  if (enabled && built.def?.id === "3d-100k-rook-impact" && gpu.device) {
    gpu.disableSleeping();
    return new GpuSleep(device, built.solver, gpu, { startAsleep: initial });
  }
  if (enabled) {
    gpu.enableSleeping(
      built.def?.dimension === 2
        ? sceneSleepingOptions(built)
        : {
            ...sceneSleepingOptions(built),
            startAsleep: initial && built.def?.id.startsWith("paper-walls-"),
          },
    );
  } else gpu.disableSleeping();
  return null;
}

/** Defaults for interactive scenes; explicit URL/user settings take priority. */
export function sceneSleepingDefault(built) {
  return sceneSleepPresets[built.def?.id] ?? !!built.gpuOptions2D?.sleeping;
}
