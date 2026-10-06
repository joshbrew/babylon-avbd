export function createWebGPUDevice(options?: {
  powerPreference?: GPUPowerPreference;
  requiredLimits?: Record<string, number>;
  /** Desired maximum capacities, clamped to the adapter. Required limits take precedence. */
  preferredLimits?: Record<string, number>;
}): Promise<{ adapter: GPUAdapter; device: GPUDevice }>;
