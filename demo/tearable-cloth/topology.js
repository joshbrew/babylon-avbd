// Rendering follows actual GPU bond state; it never reconnects a torn seam.
const sheets = new WeakMap();
export const tearableClothsOf = (solver) => sheets.get(solver) ?? [];
export function addTearableCloth(solver, sheet) {
  sheets.set(solver, [...tearableClothsOf(solver), sheet]);
}
