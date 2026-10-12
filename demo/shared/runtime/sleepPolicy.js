import { GpuSleep } from "../../../src/gpu/gpuSleep.js";

/** Restore masses before disposing the rook's precomputed support graph. */
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
  if (enabled)
    gpu.enableSleeping({
      timeThreshold: 0.3,
      startAsleep: initial && built.def?.id.startsWith("paper-walls-"),
    });
  else gpu.disableSleeping();
  return null;
}

/** Defaults for interactive scenes; explicit URL/user settings take priority. */
export function sceneSleepingDefault(built) {
  if (built.gpuOptions2D?.sleeping) return true;
  const count =
    built.solver?.bodies.length ??
    built.sim?.bodyCount ??
    built.scene?.bodyCount ??
    0;
  return (
    !!built.def?.benchmark ||
    (count >= 10000 && !built.play && built.def?.solverKind !== "deformable")
  );
}
