// Reuse CPU views and upload only changed words. Comparisons preserve exact
// float/uint bits, including signed zero. A new buffer always receives all words.
export function uniformData(words) {
  const data = new ArrayBuffer(words * 4);
  return {
    f: new Float32Array(data),
    u: new Uint32Array(data),
    previous: new Uint32Array(words),
    buffer: null,
    uploads: 0,
    bytes: 0,
  };
}
export function uploadUniform(device, buffer, cache) {
  const { u, previous } = cache;
  let first = 0,
    last = u.length - 1;
  if (cache.buffer === buffer) {
    while (first <= last && u[first] === previous[first]) first++;
    while (last >= first && u[last] === previous[last]) last--;
    if (first > last) return;
  }
  // writeBuffer copies its input at the call, so queued steps may reuse these
  // views. Preserve exact f32/u32 bits and upload every changed field in one run.
  device.queue.writeBuffer(buffer, first * 4, u, first, last - first + 1);
  previous.set(u);
  cache.buffer = buffer;
  cache.uploads++;
  cache.bytes += (last - first + 1) * 4;
}
