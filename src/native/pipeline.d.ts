import type {
  AvbdScene2D,
  AvbdScene3D,
  AvbdGpuOptions,
  AvbdGpuSolver,
  AvbdGpuSolver2D,
  AvbdGpuSolver3D,
  AvbdAdvanceOptions,
} from "./scenes.js";
import type { createWebGPUDevice } from "../gpu/device.js";

export type AvbdSolverBackend = "webgpu" | "cpu";
/** Shared world settings. GPU scheduling fields apply only to GPU execution. */
export type AvbdSolverOptions = AvbdGpuOptions;
/** Drawing buffers belong to the selected backend; simulation operations are shared. */
type SharedMethods<T, Self> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R extends AvbdGpuSolver ? Self : R
    : T[K];
};
export interface AvbdSolver2D extends SharedMethods<
  Omit<AvbdGpuSolver2D, "bodyBuffer" | "shapeBuffer" | "attachToScene">,
  AvbdSolver2D
> {
  readonly backend: AvbdSolverBackend;
  readonly bodyBuffer?: GPUBuffer;
  readonly shapeBuffer?: GPUBuffer;
  attachToScene(
    scene: Parameters<AvbdGpuSolver2D["attachToScene"]>[0],
    options?: AvbdAdvanceOptions & {
      afterStep?: (solver: AvbdSolver2D) => void;
    },
  ): this;
}
export interface AvbdSolver3D extends SharedMethods<
  Omit<AvbdGpuSolver3D, "bodyBuffer" | "attachToScene">,
  AvbdSolver3D
> {
  readonly backend: AvbdSolverBackend;
  readonly bodyBuffer?: GPUBuffer;
  attachToScene(
    scene: Parameters<AvbdGpuSolver3D["attachToScene"]>[0],
    options?: AvbdAdvanceOptions & {
      afterStep?: (solver: AvbdSolver3D) => void;
    },
  ): this;
}
/**
 * Backend factory shared by multiple worlds. Destroy worlds individually or
 * destroy the pipeline to release them together; supplied devices are borrowed.
 */
export interface AvbdSolverPipeline {
  readonly backend: AvbdSolverBackend;
  readonly device?: GPUDevice;
  readonly adapter?: GPUAdapter;
  createSolver(scene: AvbdScene2D, options?: AvbdSolverOptions): AvbdSolver2D;
  createSolver(scene: AvbdScene3D, options?: AvbdSolverOptions): AvbdSolver3D;
  /** Destroys its worlds and its own device. A supplied device remains caller-owned. */
  destroy(): void;
}
/**
 * Initialize WebGPU or CPU once; scene builders and live world commands remain
 * compatible. Direct drawing buffers are available only on the GPU backend.
 */
export function createSolverPipeline(
  options?: NonNullable<Parameters<typeof createWebGPUDevice>[0]> & {
    backend?: AvbdSolverBackend;
    device?: GPUDevice;
  },
): Promise<AvbdSolverPipeline>;
