export function createWebGPUDevice(options?: {
  /** Run the cached 3D floor-contact qualification and select a working GPU path. */
  validate3D?: boolean;
  powerPreference?: GPUPowerPreference;
  requiredLimits?: Record<string, number>;
  /** Desired maximum capacities, clamped to the adapter. Required limits take precedence. */
  preferredLimits?: Record<string, number>;
}): Promise<{ adapter: GPUAdapter; device: GPUDevice }>;
/** Prepare an existing renderer-owned device for 3D. Does not take device ownership. */
export function prepareWebGPUDevice3D(device: GPUDevice): Promise<GPUDevice>;
