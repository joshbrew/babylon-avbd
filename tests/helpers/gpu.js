export function assert(condition, message) {
  if (!condition) throw new Error(message);
}
export function close(actual, expected, tolerance = 1e-5, label = "value") {
  assert(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual}, expected ${expected} +/- ${tolerance}`,
  );
}
export async function readBuffer(device, buffer, bytes = buffer.size) {
  const staging = device.createBuffer({
    size: bytes,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  try {
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, staging, 0, bytes);
    device.queue.submit([encoder.finish()]);
    await staging.mapAsync(GPUMapMode.READ);
    return staging.getMappedRange().slice(0);
  } finally {
    staging.destroy();
  }
}
export function buffer(device, size, data, usage = GPUBufferUsage.STORAGE) {
  const result = device.createBuffer({
    size,
    usage: usage | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });
  if (data) device.queue.writeBuffer(result, 0, data);
  return result;
}
