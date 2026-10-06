// One selection policy for the app, integration API and benchmark report.
// These are equivalent contact equations, not quality or iteration presets.
export const solverModes = ["auto", "standard", "optimized", "points"];
export const solverModeLabels = {
  standard: "GPU AVBD",
  optimized: "GPU AVBD",
  points: "GPU AVBD · shared contact points",
  custom: "GPU deformable solver",
};
export function selectSolverMode({
  requested = "auto",
  bodyCount,
  constraintCount = 0,
  contactScheduling = "manifolds",
  custom = false,
}) {
  if (!solverModes.includes(requested))
    throw Error(
      "solverMode must be 'auto', 'standard', 'optimized' or 'points'",
    );
  if (!["manifolds", "points"].includes(contactScheduling))
    throw Error("contactScheduling must be 'manifolds' or 'points'");
  if (custom && requested !== "auto")
    throw Error(
      "A scene-specific solve shader cannot be replaced with a rigid-body solver mode",
    );
  const selected = custom
    ? "custom"
    : requested !== "auto"
      ? requested
      : constraintCount > 0 || bodyCount < 50_000
        ? "standard"
        : contactScheduling === "points"
          ? "points"
          : "optimized";
  const reason = custom
    ? "This scene supplies its own solver. Automatic keeps that implementation."
    : requested !== "auto"
      ? "Explicit implementation override (developer setting)."
      : constraintCount > 0
        ? "Work layout selected for joints and springs."
        : bodyCount < 50_000
          ? "Work layout selected for smaller rigid scenes."
          : selected === "points"
            ? "Large rigid scene with a measured shared-contact-points layout."
            : "Work layout selected for large rigid scenes.";
  return { requested, selected, reason, bodyCount, constraintCount };
}
