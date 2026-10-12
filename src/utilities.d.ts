/** Nonblocking GPU pass timestamps; null when timestamp-query is unavailable. */
export class GpuTimer {
  constructor(device: GPUDevice);
  readonly latestMs: number | null;
  readonly samples: number;
  begin(): object | null;
  descriptor(slot: object | null): {
    timestampWrites?: GPUComputePassTimestampWrites;
  };
  encode(encoder: GPUCommandEncoder, slot: object | null): void;
  resolve(slot: object | null): Promise<void> | undefined;
  settled(): Promise<unknown[]>;
  destroy(): void;
}
/** Reuse released buffers with compatible usage, without CPU pose transfers. */
export class GPUBufferRecycler {
  constructor(device: GPUDevice, options?: { maxFreeBytes?: number });
  readonly freeBytes: number;
  acquire(
    byteSize: number,
    usage: GPUBufferUsageFlags,
    label?: string,
  ): GPUBuffer;
  release(
    buffer: GPUBuffer,
    byteSize: number,
    usage: GPUBufferUsageFlags,
  ): void;
  trim(maxFreeBytes?: number): void;
  destroy(): void;
}
export const PARTICLE_BYTE_STRIDE: 48;
export interface SurfaceParticleStep {
  dt: number;
  count?: number;
  speed?: number;
  life?: number;
  bulletRadius?: number;
  spawnRadius?: number;
  jitter?: number;
  frame?: number;
}
/** Spherical emitter aimed at the origin. Particles hit triangle surfaces and
 * respawn; they ignore each other. Five rays approximate the particle sweep. */
export class GpuSurfaceParticles {
  constructor(
    device: GPUDevice,
    options: { capacity: number; triangleCount: number; readback?: boolean },
  );
  readonly device: GPUDevice;
  readonly capacity: number;
  readonly triangleCount: number;
  /** 48 bytes: position/life vec4f, velocity/radius vec4f, seed vec4u. */
  readonly particleBuffer: GPUBuffer;
  readonly triangleBuffer: GPUBuffer;
  readonly counterBuffer: GPUBuffer;
  readonly timer: GpuTimer;
  /** 12 float32 values per triangle: [ax,ay,az,0,bx,by,bz,0,cx,cy,cz,0]. */
  writeTriangles(vertices: Float32Array): void;
  /** Returns the latest asynchronous counters, or null with readback disabled. */
  step(options: SurfaceParticleStep): { hits: number; alive: number } | null;
  clear(): void;
  destroy(): void;
}
export const sampledContactShader: string;
/** Gather a bounded GPU contact overlay, without reading the full contact set. */
export class GpuContactSample {
  constructor(device: GPUDevice, options?: { count?: number });
  readonly count: number;
  readonly buffer: GPUBuffer;
  encode(
    encoder: GPUCommandEncoder,
    resources: {
      bodyBuffer: GPUBuffer;
      /** Native 3D camera uniform: mat4 vp, vec4 eye, vec4 light/viewport. */
      cameraBuffer: GPUBuffer;
      contactStorage: {
        manifolds: GPUBuffer;
        contacts: GPUBuffer;
        counters: GPUBuffer;
      };
    },
  ): void;
  dispose(): void;
}
/** Optional one-time native constraint-graph seed; live GPU coloring still checks contacts. */
export function seedConstraintColoring(
  gpu: {
    device: GPUDevice;
    bodyCapacity: number;
    colorBuffer: GPUBuffer;
    colorCap: number;
    gpuIndex(index: number): number;
  },
  world: {
    bodies: { mass: number }[];
    forces: { bodyA: object | null; bodyB: object | null }[];
  },
  minimum?: number,
): void;
export const INPUT_WORDS: 9;
/** Custom compute/copy work in the solver's existing command encoder. Callbacks
 * are synchronous, end their own passes, and must not submit or finish the encoder.
 * Dispose the registration before destroying its buffers. CPU solvers are rejected. */
export function addGpuStepPass<
  T extends { bodyBuffer: GPUBuffer; step(): void },
>(
  solver: T,
  hooks: {
    before?: (encoder: GPUCommandEncoder, solver: T) => void;
    after?: (encoder: GPUCommandEncoder, solver: T) => void;
  },
): () => void;
/** DOM-free sizing and event adapter around a caller-owned canvas. */
export class WorkerCanvas {
  constructor(
    canvas: OffscreenCanvas | HTMLCanvasElement,
    width: number,
    height: number,
  );
  readonly offscreenCanvas: OffscreenCanvas | HTMLCanvasElement;
  readonly clientWidth: number;
  readonly clientHeight: number;
  readonly revision: number;
  width: number;
  height: number;
  resize(width: number, height: number): void;
  getContext(type: "webgpu"): GPUCanvasContext | null;
  getContext(type: string, options?: object): unknown;
  getBoundingClientRect(): {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  addEventListener(type: string, callback: (event: any) => void): void;
  removeEventListener(type: string, callback: (event: any) => void): void;
  setPointerCapture(): void;
  dispatch(type: string, data: object): void;
}
export interface SharedPointerState {
  clientX: number;
  clientY: number;
  pointerId?: number;
  buttons?: number;
  altKey?: boolean;
  shiftKey?: boolean;
  ctrlKey?: boolean;
}
/** Returns null without cross-origin isolation / SharedArrayBuffer support. */
export function createSharedInput(): Int32Array<SharedArrayBuffer> | null;
/** One producer; continuous state only. Send discrete events as ordered messages. */
export function writeSharedInput(
  view: Int32Array<SharedArrayBuffer>,
  event: SharedPointerState,
  wheel?: number,
): void;
/**
 * Read a coherent latest-state snapshot, or null if unchanged or being written.
 * Pass the last sequence to skip repeats; this is not a queue for discrete events.
 */
export function readSharedInput(
  view: Int32Array<SharedArrayBuffer>,
  previous?: number,
): { sequence: number; event: SharedPointerState; wheel: number } | null;
