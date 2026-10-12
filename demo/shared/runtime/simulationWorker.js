import { WorkerCanvas } from "../../../src/utils/workerCanvas.js";
import { SimulationRuntime } from "./simulationRuntime.js";
import { readSharedInput } from "../../../src/utils/sharedInput.js";

let runtime,
  shared,
  sequence = -1,
  wheel = 0;
/**
 * Consume the optional latest-state mailbox once per frame. Discrete pointer
 * boundaries still arrive as messages so clicks cannot disappear between samples.
 */
function consumeInput() {
  if (!shared || !runtime) return;
  const result = readSharedInput(shared, sequence);
  if (!result) return;
  sequence = result.sequence;
  runtime.input("pointermove", result.event);
  if (result.wheel !== wheel)
    runtime.input("wheel", { ...result.event, deltaY: result.wheel - wheel });
  wheel = result.wheel;
}
self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    let result;
    if (type === "init") {
      if (runtime) throw Error("Worker already initialized");
      const canvas = new WorkerCanvas(data.canvas, data.width, data.height);
      runtime = new SimulationRuntime(canvas, data.config, (message) =>
        self.postMessage(message),
      );
      shared = data.input ? new Int32Array(data.input) : null;
      runtime.sharedInput = !!shared;
      runtime.beforeFrame = consumeInput;
      result = await runtime.init();
    } else if (!runtime) throw Error("The simulation is not ready");
    else if (type === "resize") runtime.canvas.resize(data.width, data.height);
    else if (type === "input") {
      // A later shared move may already be visible when an earlier click is
      // delivered. Use the click's published boundary, never a future move.
      if (data.boundary) {
        sequence = data.boundary.sequence;
        if (data.eventType === "pointerup")
          runtime.input("pointermove", data.event);
        if (data.boundary.wheel !== wheel)
          runtime.input("wheel", {
            ...data.event,
            deltaY: data.boundary.wheel - wheel,
          });
        wheel = data.boundary.wheel;
      } else consumeInput();
      runtime.input(data.eventType, data.event);
    } else if (type === "control") runtime.control(data.name, data.value);
    else if (type === "step") result = await runtime.step(data.count);
    else if (type === "snapshot") result = await runtime.snapshot();
    else if (type === "info") result = runtime.info();
    else if (type === "poses")
      result = await runtime.session.gpu.readSelectedBodies(data.indices);
    else if (type === "benchmark")
      result = await runtime.benchmark(data.options);
    else if (type === "ping") result = data.sent;
    else if (type === "dispose") {
      runtime.destroy();
      runtime = null;
    }
    if (id !== undefined) self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      ...(id === undefined ? { type: "error" } : { id }),
      error: error.message,
      message: error.message,
    });
  }
};
