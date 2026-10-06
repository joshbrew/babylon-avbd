const DEFAULT_BUFFER_POOL_BYTES = 192 * 1024 * 1024;
const alignTo = (v, n) => Math.ceil(v / n) * n;
const makeUsageKey = (usage) => String(usage >>> 0);

export class GPUBufferRecycler {
  constructor(device, options = {}) {
    this.device = device;
    this.maxFreeBytes = options.maxFreeBytes ?? DEFAULT_BUFFER_POOL_BYTES;
    this.freeBytes = 0;
    this.free = new Map();
    this.all = new Set();
  }

  acquire(byteSize, usage, label = "recycled-buffer") {
    const size = alignTo(Math.max(4, byteSize), 4);
    const key = makeUsageKey(usage);
    const bin = this.free.get(key);
    if (bin) {
      let bestIndex = -1;
      let bestSize = Infinity;
      for (let i = 0; i < bin.length; i += 1) {
        const item = bin[i];
        if (item.size >= size && item.size < bestSize) {
          bestIndex = i;
          bestSize = item.size;
        }
      }
      if (bestIndex >= 0) {
        const [item] = bin.splice(bestIndex, 1);
        this.freeBytes -= item.size;
        return item.buffer;
      }
    }

    const buffer = this.device.createBuffer({
      label,
      size,
      usage,
      mappedAtCreation: false,
    });
    this.all.add(buffer);
    return buffer;
  }

  release(buffer, byteSize, usage) {
    if (!buffer) {
      return;
    }
    const size = alignTo(Math.max(4, byteSize), 4);
    if (this.freeBytes + size > this.maxFreeBytes) {
      buffer.destroy();
      this.all.delete(buffer);
      return;
    }
    const key = makeUsageKey(usage);
    let bin = this.free.get(key);
    if (!bin) {
      bin = [];
      this.free.set(key, bin);
    }
    bin.push({ buffer, size, usage });
    this.freeBytes += size;
  }

  trim(maxFreeBytes = this.maxFreeBytes) {
    this.maxFreeBytes = maxFreeBytes;
    for (const [key, bin] of this.free.entries()) {
      while (this.freeBytes > this.maxFreeBytes && bin.length > 0) {
        const item = bin.pop();
        item.buffer.destroy();
        this.all.delete(item.buffer);
        this.freeBytes -= item.size;
      }
      if (bin.length === 0) {
        this.free.delete(key);
      }
    }
  }

  destroy() {
    for (const buffer of this.all) {
      buffer.destroy();
    }
    this.free.clear();
    this.all.clear();
    this.freeBytes = 0;
  }
}
