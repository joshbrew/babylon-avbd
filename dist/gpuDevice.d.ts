/**
 * Request a caller-owned device; destroy it when all worlds/renderers using it
 * are finished. For shared rendering, pass the existing renderer device instead.
 */
export function createWebGPUDevice(options?: {
  /** Run the cached 3D floor-contact qualification and select a working GPU path. */
  validate3D?: boolean;
  powerPreference?: GPUPowerPreference;
  /** Hard requirements: creation fails if the adapter cannot meet them. */
  requiredLimits?: Record<string, number>;
  /** Desired maximum capacities, clamped to the adapter. Required limits take precedence. */
  preferredLimits?: Record<string, number>;
}): Promise<{ adapter: GPUAdapter; device: GPUDevice }>;
/** Prepare an existing renderer-owned device for 3D. Does not take device ownership. */
export function prepareWebGPUDevice3D(device: GPUDevice): Promise<GPUDevice>;
