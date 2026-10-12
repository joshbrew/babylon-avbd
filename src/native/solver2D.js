import { AppGpuSolver2D } from "../gpu/appGpuSolver2D.js";
import { installNativeRuntime } from "./runtime.js";

/** WebGPU 2D world with the shared native handle, batch-edit and lifecycle facade. */
export class NativeGpuSolver2D extends AppGpuSolver2D {
  constructor(device, topology, options) {
    super(device, topology, options);
    installNativeRuntime(this, null, 2);
  }
}
