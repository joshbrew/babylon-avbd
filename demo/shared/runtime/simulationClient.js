import { WorkerCanvas } from "../../../src/utils/workerCanvas.js";
import {
  createSharedInput,
  writeSharedInput,
} from "../../../src/utils/sharedInput.js";

/** Shared lifecycle and input bridge for page/worker comparison. */
export async function createSimulationClient(
  canvas,
  config,
  notify = () => {},
) {
  const scope = config.scope ?? "main",
    pending = new Map();
  if (!["main", "worker", "worker-sab"].includes(scope))
    throw Error(`Unknown simulation scope: ${scope}`);
  let worker,
    runtime,
    closed = false,
    failed,
    next = 0,
    move,
    moveFrame,
    shared,
    wheel = 0;
  const rejectPending = (message) => {
    for (const job of pending.values()) job.reject(Error(message));
    pending.clear();
  };
  const request = (type, payload = {}, transfer = []) =>
    new Promise((resolve, reject) => {
      if (closed) return reject(Error("The simulation has been disposed"));
      if (failed) return reject(Error(failed));
      const id = ++next;
      pending.set(id, { resolve, reject });
      try {
        worker.postMessage({ id, type, ...payload }, transfer);
      } catch (error) {
        pending.delete(id);
        reject(error);
      }
    });
  const dimensions = () => ({
    width: Math.max(1, Math.floor(canvas.clientWidth)),
    height: Math.max(1, Math.floor(canvas.clientHeight)),
  });
  let info;
  if (scope === "main") {
    const { SimulationRuntime } = await import("./simulationRuntime.js");
    const surface = new WorkerCanvas(
      canvas,
      dimensions().width,
      dimensions().height,
    );
    runtime = new SimulationRuntime(surface, config, notify);
    try {
      info = await runtime.init();
    } catch (error) {
      runtime.destroy();
      throw error;
    }
  } else {
    if (typeof Worker !== "function" || !canvas.transferControlToOffscreen)
      throw Error("OffscreenCanvas and dedicated workers are required");
    shared = scope === "worker-sab" ? createSharedInput() : null;
    if (scope === "worker-sab" && !shared)
      throw Error(
        "Shared input needs cross-origin isolation. Use the message worker mode or enable COOP/COEP headers.",
      );
    worker = new Worker("/dist/simulation-worker.js", {
      type: "module",
      name: "AVBD physics and drawing",
    });
    worker.onmessage = ({ data }) => {
      const job = pending.get(data.id);
      if (job) {
        pending.delete(data.id);
        data.error ? job.reject(Error(data.error)) : job.resolve(data.result);
      } else notify(data);
    };
    worker.onerror = (event) => {
      failed = `${event.message || "Simulation worker failed"} (${event.filename}:${event.lineno})`;
      rejectPending(failed);
      notify({ type: "error", message: failed });
    };
    worker.onmessageerror = () => {
      failed = "Simulation worker message could not be decoded";
      rejectPending(failed);
      notify({ type: "error", message: failed });
    };
    const offscreen = canvas.transferControlToOffscreen();
    try {
      info = await request(
        "init",
        { canvas: offscreen, ...dimensions(), config, input: shared?.buffer },
        [offscreen],
      );
    } catch (error) {
      worker.terminate();
      throw error;
    }
  }
  function dispatch(eventType, event) {
    if (closed) return;
    if (runtime) runtime.input(eventType, event);
    else
      worker.postMessage({
        type: "input",
        eventType,
        event,
        ...(shared
          ? { boundary: { sequence: Atomics.load(shared, 0), wheel } }
          : {}),
      });
  }
  function flushMove() {
    if (move) {
      dispatch("pointermove", move);
      move = null;
    }
  }
  const serialize = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      clientX: event.clientX - rect.left,
      clientY: event.clientY - rect.top,
      pointerId: event.pointerId ?? 1,
      button: event.button ?? 0,
      buttons: event.buttons ?? 0,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      deltaY: event.deltaY ?? 0,
    };
  };
  const listeners = [];
  const on = (target, type, callback, options) => {
    target.addEventListener(type, callback, options);
    listeners.push(() => target.removeEventListener(type, callback, options));
  };
  for (const type of ["pointerdown", "pointerup", "pointercancel"])
    on(canvas, type, (event) => {
      flushMove();
      if (type === "pointerdown") {
        canvas.focus();
        canvas.setPointerCapture(event.pointerId);
      }
      dispatch(type, serialize(event));
    });
  function pointerMove(event) {
    if (shared) writeSharedInput(shared, event, wheel);
    else {
      move = event;
      if (!moveFrame)
        moveFrame = requestAnimationFrame(() => {
          moveFrame = 0;
          flushMove();
        });
    }
  }
  on(canvas, "pointermove", (event) => pointerMove(serialize(event)));
  on(
    canvas,
    "wheel",
    (event) => {
      event.preventDefault();
      const value = serialize(event);
      if (shared) {
        wheel += event.deltaY;
        writeSharedInput(shared, value, wheel);
      } else {
        flushMove();
        dispatch("wheel", value);
      }
    },
    { passive: false },
  );
  on(canvas, "contextmenu", (event) => event.preventDefault());
  on(canvas, "keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      control("key", { code: event.code, repeat: event.repeat });
    }
  });
  on(canvas, "blur", () => dispatch("pointercancel", {}));
  const observer = new ResizeObserver(() => {
    if (runtime) runtime.canvas.resize(dimensions().width, dimensions().height);
    else worker.postMessage({ type: "resize", ...dimensions() });
  });
  observer.observe(canvas);
  function control(name, value) {
    if (closed) return;
    if (runtime) runtime.control(name, value);
    else worker.postMessage({ type: "control", name, value });
  }
  return {
    info,
    shared: !!shared,
    scope,
    control,
    input: dispatch,
    pointerMove,
    getInfo: () =>
      runtime ? Promise.resolve(runtime.info()) : request("info"),
    readSelectedBodies: (indices) =>
      runtime
        ? runtime.session.gpu.readSelectedBodies(indices)
        : request("poses", { indices }),
    snapshot: () => (runtime ? runtime.snapshot() : request("snapshot")),
    step: (count) =>
      runtime ? runtime.step(count) : request("step", { count }),
    benchmark: (options) =>
      runtime ? runtime.benchmark(options) : request("benchmark", { options }),
    ping: () => {
      const start = performance.now();
      return runtime
        ? Promise.resolve(0)
        : request("ping", { sent: start }).then(
            () => performance.now() - start,
          );
    },
    async destroy() {
      if (closed) return;
      closed = true;
      observer.disconnect();
      listeners.forEach((remove) => remove());
      cancelAnimationFrame(moveFrame);
      runtime?.destroy();
      rejectPending("The simulation has been disposed");
      if (worker) {
        const id = ++next;
        let timeout;
        try {
          // Let the worker release its GPU device and buffers before terminating
          // its event loop. A stalled worker must not block scene switching.
          await new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
            timeout = setTimeout(resolve, 1000);
            worker.postMessage({ id, type: "dispose" });
          });
        } catch {
          // Termination also handles a worker that failed during cleanup.
        } finally {
          clearTimeout(timeout);
          pending.delete(id);
          worker.terminate();
        }
      }
    },
  };
}
