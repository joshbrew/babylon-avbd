// A device-wide compatibility policy is installed only after real GPU checks.
// Desktop devices that pass the normal path retain the existing dispatch layout.
const policies = new WeakMap();
export function gpuExecutionPolicy3D(device) {
  return policies.get(device);
}
export function setGpuExecutionPolicy3D(device, policy) {
  if (policy) policies.set(device, Object.freeze({ ...policy }));
  else policies.delete(device);
}
