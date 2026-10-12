/** Bound catch-up work so an overloaded solver still leaves time to draw. */
export function physicsStepsPerFrame(profile) {
  const ms = profile?.total;
  if (!Number.isFinite(ms) || ms <= 0) return 6;
  return Math.max(1, Math.min(6, Math.floor(1000 / 60 / ms)));
}
