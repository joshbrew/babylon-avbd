import { GpuContactSample } from "../demo/gpuContactSample.js";
import { createWebGPUDevice } from "../src/gpu/device.js";

export async function checkContactSamples() {
  const { device } = await createWebGPUDevice();
  const resources = [],
    errors = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  const buffer = (data, usage = GPUBufferUsage.STORAGE) => {
    const b = device.createBuffer({
      size: data.byteLength,
      usage: usage | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(b, 0, data);
    resources.push(b);
    return b;
  };
  let sample;
  try {
    const body = new Float32Array(40);
    body.set([1, 2, 3], 0);
    body[7] = 1;
    const camera = new Float32Array(24);
    camera.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    camera[20] = camera[21] = 960;
    const manifolds = new Uint32Array(1024 * 8),
      contacts = new Float32Array(4096 * 16);
    for (let i = 0; i < 1024; i++) {
      manifolds.set([0, 0, i * 4, 4], i * 8);
      for (let p = 0; p < 4; p++) contacts.set([i, p, 0], (i * 4 + p) * 16);
    }
    contacts.set([1, 1, 0], 0);
    contacts.set([0, -1, 1], 16);
    manifolds[3] = 2;
    const counters = new Uint32Array(8);
    counters[1] = 4096;
    counters[6] = 1;
    const storage = {
      manifolds: buffer(manifolds),
      contacts: buffer(contacts),
      counters: buffer(counters),
    };
    const r = {
      device,
      buffer: buffer(body),
      camera: buffer(camera, GPUBufferUsage.UNIFORM),
      gpu: { contactStorage: storage },
    };
    sample = new GpuContactSample(r);
    const read = device.createBuffer({
      size: sample.buffer.size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    resources.push(read);
    const gather = async () => {
      const encoder = device.createCommandEncoder();
      sample.encode(encoder);
      encoder.copyBufferToBuffer(sample.buffer, 0, read, 0, read.size);
      device.queue.submit([encoder.finish()]);
      await read.mapAsync(GPUMapMode.READ);
      const result = new Float32Array(read.getMappedRange()).slice();
      read.unmap();
      return result;
    };
    const expect = (values, slot, expected) => {
      if (!expected.every((v, i) => Math.abs(v - values[slot * 4 + i]) < 1e-5))
        throw Error(
          `Incorrect GPU contact dot at ${slot}: ${values.slice(slot * 4, slot * 4 + 4)}`,
        );
    };
    let values = await gather();
    expect(values, 0, [2, 3, 3, 1]);
    expect(values, 1, [1, 4, 1, 1]);
    expect(values, 2, [2, 2, 2, 1]);
    expect(values, 2047, [2, 2, 2, 1]);
    // Switch completed storage, as the solver does between its two contact sets.
    counters[6] = 1024;
    r.gpu.contactStorage = { ...storage, counters: buffer(counters) };
    values = await gather();
    expect(values, 1028, [515, 3, 2, 1]);
    manifolds[0] = 99;
    device.queue.writeBuffer(storage.manifolds, 0, manifolds);
    values = await gather();
    expect(values, 0, [2, 2, 2, 1]);
    manifolds[0] = 0;
    device.queue.writeBuffer(storage.manifolds, 0, manifolds);
    counters[6] = 1;
    device.queue.writeBuffer(r.gpu.contactStorage.counters, 0, counters);
    body.set([0, 0, Math.SQRT1_2, Math.SQRT1_2], 4);
    device.queue.writeBuffer(r.buffer, 0, body);
    values = await gather();
    expect(values, 0, [0, 3, 3, 1]);
    await device.queue.onSubmittedWorkDone();
    if (errors.length) throw Error(errors.join("\n"));
    return {
      passed: true,
      displayedPoints: 2048,
      bufferBytes: sample.buffer.size,
      cases: [
        "known contact positions",
        "missing points",
        "whole-region sampling",
        "completed-buffer switching",
        "invalid body guard",
        "body rotation",
      ],
    };
  } finally {
    sample?.dispose();
    for (const b of resources) b.destroy();
    device.destroy();
  }
}
