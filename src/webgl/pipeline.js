import { GlCompute } from "./compute.js";
import { NativeGlSolver } from "./nativeWorld.js";
import { registerSolverPipeline } from "../native/pipelineRegistry.js";

/** Experimental repository/demo backend. Excluded from the published package. */
export async function createExperimentalWebglPipeline({ gl } = {}) {
  if (!gl) {
    const canvas =
      typeof OffscreenCanvas === "function"
        ? new OffscreenCanvas(1, 1)
        : typeof document !== "undefined"
          ? document.createElement("canvas")
          : null;
    gl = canvas?.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
  }
  const compute = new GlCompute(gl),
    worlds = new Set();
  let destroyed = false;
  const pipeline = {
    backend: "webgl2",
    gl,
    createSolver(scene, options = {}) {
      if (destroyed) throw Error("The solver pipeline has been destroyed");
      if (
        !scene ||
        typeof scene.assertEditable !== "function" ||
        (!scene.ref && !scene.topology)
      )
        throw Error("An AVBD scene builder is required");
      scene.assertEditable();
      if (options.bodyBuffer !== undefined)
        throw Error("A GPU body buffer requires the WebGPU backend");
      const world = new NativeGlSolver(
        compute,
        scene,
        scene.ref ? 3 : 2,
        options,
      );
      scene.gpu = world;
      scene.created = true;
      worlds.add(world);
      const destroy = world.destroy;
      world.destroy = function () {
        destroy.call(this);
        worlds.delete(this);
      };
      return world;
    },
    destroy() {
      if (destroyed) return;
      for (const world of worlds) world.destroy();
      worlds.clear();
      compute.destroy();
      destroyed = true;
    },
  };
  registerSolverPipeline(pipeline);
  return pipeline;
}
