/** Request a caller-owned WebGPU device. No renderer or Babylon dependency. */
export async function createWebGPUDevice(options = {}) {
  if (!globalThis.navigator?.gpu)
    throw Error("WebGPU needs a supported browser on localhost or HTTPS");
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: options.powerPreference ?? "high-performance",
  });
  if (!adapter) throw Error("No WebGPU adapter is available");
  const requiredLimits = {};
  // Preferred capacity can adapt to the device. Required limits must never be weakened.
  for (const [key, value] of Object.entries(options.preferredLimits ?? {})) {
    if (
      !key.startsWith("max") ||
      adapter.limits[key] === undefined ||
      !Number.isSafeInteger(value) ||
      value < 0
    )
      throw Error(`Invalid preferred GPU limit: ${key}`);
    requiredLimits[key] = Math.min(value, adapter.limits[key]);
  }
  for (const [key, value] of Object.entries(options.requiredLimits ?? {})) {
    if (
      adapter.limits[key] === undefined ||
      !Number.isSafeInteger(value) ||
      value < 0
    )
      throw Error(`Invalid required GPU limit: ${key}`);
    const available = adapter.limits[key];
    if (
      (key.startsWith("min") && value < available) ||
      (!key.startsWith("min") && value > available)
    )
      throw Error(
        `GPU limit ${key} requires ${value}; this adapter supports ${available}`,
      );
    requiredLimits[key] = value;
  }
  const device = await adapter.requestDevice({
    requiredLimits,
    requiredFeatures: adapter.features.has("timestamp-query")
      ? ["timestamp-query"]
      : [],
  });
  return { adapter, device };
}
