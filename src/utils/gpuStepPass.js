const registrations = new WeakMap();

/**
 * Encode custom work in the solver's own submission, in registration order.
 *
 * Callbacks synchronously encode into the supplied command encoder; they must
 * not finish/submit it or wait for GPU work. Return value removes this registration.
 * Use before for external forces and after for consumers of the solved state.
 */
export function addGpuStepPass(solver, { before, after } = {}) {
  if (!solver.bodyBuffer || typeof solver.step !== "function")
    throw Error("GPU step passes require a WebGPU solver");
  if (
    (!before && !after) ||
    (before !== undefined && typeof before !== "function") ||
    (after !== undefined && typeof after !== "function")
  )
    throw Error(
      "GPU step passes require synchronous before and/or after callbacks",
    );
  let state = registrations.get(solver);
  if (!state) {
    state = {
      hooks: new Set(),
      previousBefore: solver.externalBeforeStep,
      previousAfter: solver.externalAfterStep,
    };
    state.before = (encoder) => {
      state.previousBefore?.call(solver, encoder);
      for (const hook of state.hooks) hook.before?.(encoder, solver);
    };
    state.after = (encoder) => {
      state.previousAfter?.call(solver, encoder);
      for (const hook of state.hooks) hook.after?.(encoder, solver);
    };
    solver.externalBeforeStep = state.before;
    solver.externalAfterStep = state.after;
    registrations.set(solver, state);
  }
  const hook = { before, after };
  state.hooks.add(hook);
  return () => {
    if (!state.hooks.delete(hook)) return;
    if (state.hooks.size) return;
    if (solver.externalBeforeStep === state.before)
      solver.externalBeforeStep = state.previousBefore;
    if (solver.externalAfterStep === state.after)
      solver.externalAfterStep = state.previousAfter;
    registrations.delete(solver);
  };
}
