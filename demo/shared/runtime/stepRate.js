/** User-selected fixed steps per second; absence keeps the scene default. */
export function readStepRate(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const rate = Number(value);
  return Number.isFinite(rate)
    ? Math.max(15, Math.min(480, Math.round(rate)))
    : undefined;
}
