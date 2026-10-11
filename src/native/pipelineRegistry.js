// Private scene-builder identity shared by production and experimental pipelines.
const pipelines = new WeakSet();
export const isSolverPipeline = (value) =>
  value !== null && typeof value === "object" && pipelines.has(value);
export const registerSolverPipeline = (pipeline) => pipelines.add(pipeline);
