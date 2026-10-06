import { PASS_STRIDE } from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";

/** Pass uniforms depend on coloring and iteration settings, not moving poses. */
export function writePassConstants(iterations, alphaFor) {
  const cache = (this.passConstantCache ??= { alphas: [] });
  let changed =
    cache.iterations !== iterations ||
    cache.colors !== this.colorCap ||
    cache.buffer !== this.passBuffer ||
    !this.passGroup;
  for (let it = 0; it < iterations; it++) {
    const alpha = typeof alphaFor === "function" ? alphaFor(it) : alphaFor;
    if (cache.alphas[it] !== alpha) changed = true;
    cache.alphas[it] = alpha;
  }
  if (!changed) return;
  const perIteration = this.colorCap + 1,
    entries = Math.max(iterations * perIteration, 1),
    bytes = entries * PASS_STRIDE;
  if (entries > this.passEntries || !this.passGroup) {
    this.passBuffer?.destroy();
    this.passBuffer = this.device.createBuffer({
      label: "AVBD pass constants",
      size: bytes,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.passEntries = entries;
    this.passGroup = this.device.createBindGroup({
      layout: this.layouts.pass,
      entries: [
        { binding: 0, resource: { buffer: this.passBuffer, size: 16 } },
      ],
    });
  }
  if (!cache.data || cache.data.byteLength < bytes) {
    cache.data = new ArrayBuffer(
      Math.max(bytes, (cache.data?.byteLength ?? 0) * 2),
    );
    cache.u32 = new Uint32Array(cache.data);
    cache.f32 = new Float32Array(cache.data);
  }
  for (let it = 0; it < iterations; it++)
    for (let col = 0; col <= this.colorCap; col++) {
      const w = ((it * perIteration + col) * PASS_STRIDE) / 4;
      cache.u32[w] = col;
      cache.f32[w + 1] = cache.alphas[it];
    }
  this.device.queue.writeBuffer(this.passBuffer, 0, cache.data, 0, bytes);
  cache.iterations = iterations;
  cache.colors = this.colorCap;
  cache.buffer = this.passBuffer;
  cache.uploads = (cache.uploads ?? 0) + 1;
}
