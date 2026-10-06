// Timestamp readbacks are optional and nonblocking; queue latency is not GPU time.
export class GpuTimer {
  constructor(device) {
    this.device = device;
    this.latestMs = null;
    this.samples = 0;
    this.slots = [];
    if (!device.features.has("timestamp-query")) return;
    for (let i = 0; i < 3; i++)
      this.slots.push({
        query: device.createQuerySet({ type: "timestamp", count: 2 }),
        resolve: device.createBuffer({
          size: 256,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        }),
        read: device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        }),
        busy: false,
      });
  }
  begin() {
    const slot = this.slots.find((s) => !s.busy);
    if (!slot || this.disposed) return null;
    slot.busy = true;
    return slot;
  }
  descriptor(slot) {
    return slot
      ? {
          timestampWrites: {
            querySet: slot.query,
            beginningOfPassWriteIndex: 0,
            endOfPassWriteIndex: 1,
          },
        }
      : {};
  }
  encode(encoder, slot) {
    if (!slot) return;
    encoder.resolveQuerySet(slot.query, 0, 2, slot.resolve, 0);
    encoder.copyBufferToBuffer(slot.resolve, 0, slot.read, 0, 16);
  }
  resolve(slot) {
    if (!slot) return;
    slot.read
      .mapAsync(GPUMapMode.READ)
      .then(() => {
        const values = new BigUint64Array(slot.read.getMappedRange());
        this.latestMs = Number(values[1] - values[0]) / 1e6;
        this.samples++;
        slot.read.unmap();
      })
      .catch(() => {})
      .finally(() => {
        slot.busy = false;
      });
  }
  destroy() {
    this.disposed = true;
    for (const s of this.slots) {
      s.query.destroy();
      s.resolve.destroy();
      s.read.destroy();
    }
  }
}
