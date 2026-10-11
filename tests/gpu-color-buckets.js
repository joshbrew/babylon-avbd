import {
  makeTopologyWGSL,
  topologyWGSL,
} from "../reference/three-avbd/src/avbd2d/gpu/wgsl-topology.ts";
import {
  PRELUDE_3D,
  TOPOLOGY_ACCESSORS_3D,
} from "../reference/three-avbd/src/avbd3d/gpu/layout.ts";
import { withBitsetColorBuckets } from "../src/gpu/colorBuckets.js";
import { assert, readBuffer } from "./helpers/gpu.js";
import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { protectTopology2D } from "../src/gpu/protectStep2D.js";

export async function checkColorBuckets(
  device,
  dimension,
  counts,
  timed = false,
  dynamicEvery = 0,
) {
  const source =
    dimension === 2
      ? topologyWGSL
      : makeTopologyWGSL(PRELUDE_3D, TOPOLOGY_ACCESSORS_3D);
  const bindLayout = device.createBindGroupLayout({
    entries: [
      "uniform",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "read-only-storage",
      "storage",
      "storage",
      "storage",
    ].map((type, binding) => ({
      binding,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type },
    })),
  });
  const layout = device.createPipelineLayout({
    bindGroupLayouts: [bindLayout],
  });
  const pipes = [source, withBitsetColorBuckets(source)].map((code) =>
    device.createComputePipeline({
      layout,
      compute: {
        module: device.createShaderModule({
          code: dimension === 2 ? protectTopology2D(code) : code,
        }),
        entryPoint: "colorCount",
      },
    }),
  );
  const results = [];
  for (const count of counts)
    for (const palette of [1, 4, 64]) {
      const cap = count + 37,
        groups = Math.ceil(cap / 256),
        hist = 3 * cap + 65,
        stride = dimension === 2 ? 24 : 40,
        resources = [];
      const buffer = (size, usage) => {
        const b = device.createBuffer({ size, usage });
        resources.push(b);
        return b;
      };
      const storage =
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC;
      const params = buffer(
          dimension === 2 ? 128 : 176,
          GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        ),
        bodies = buffer(cap * stride * 4, storage),
        dummy = buffer(256, storage),
        adjacency = buffer(256, storage),
        counters = buffer(64, storage),
        colors = buffer((hist + 64 * groups + 1) * 4, storage);
      const query = timed
        ? device.createQuerySet({ type: "timestamp", count: 2 })
        : null;
      const resolve = timed
        ? buffer(256, GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC)
        : null;
      const times = timed
        ? buffer(16, GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST)
        : null;
      try {
        const words = new Uint32Array(params.size / 4);
        words[7] = count;
        words[9] = palette;
        words[23] = cap;
        words[24] = hist;
        words[26] = groups;
        device.queue.writeBuffer(params, 0, words);
        const data = new Float32Array(cap * stride);
        for (let i = 0; i < count; i++)
          data[i * stride + (dimension === 2 ? 22 : 19)] = dynamicEvery
            ? i % dynamicEvery === 0
              ? 1
              : 0
            : i % 11 === 0
              ? 0
              : 1;
        device.queue.writeBuffer(bodies, 0, data);
        const initial = new Uint32Array(colors.size / 4).fill(0xdeadbeef);
        for (let i = 0; i < count; i++)
          initial[i] = i % 17 === 0 ? 255 : (i * 7) % palette;
        if (!timed && dimension === 2 && palette < 64)
          for (let i = 0; i < count; i += 31) initial[i] = 63;
        for (let i = 0; i < count; i++) if (i % 29 === 0) initial[i] |= 256;
        const group = device.createBindGroup({
          layout: bindLayout,
          entries: [
            params,
            bodies,
            dummy,
            dummy,
            dummy,
            counters,
            adjacency,
            colors,
          ].map((buffer, binding) => ({ binding, resource: { buffer } })),
        });
        const run = async (mode, repeats = 1) => {
          device.queue.writeBuffer(colors, 0, initial);
          const e = device.createCommandEncoder();
          e.clearBuffer(counters);
          const p = e.beginComputePass(
            query
              ? {
                  timestampWrites: {
                    querySet: query,
                    beginningOfPassWriteIndex: 0,
                    endOfPassWriteIndex: 1,
                  },
                }
              : {},
          );
          p.setPipeline(pipes[mode]);
          p.setBindGroup(0, group);
          for (let i = 0; i < repeats; i++) p.dispatchWorkgroups(groups);
          p.end();
          if (query) {
            e.resolveQuerySet(query, 0, 2, resolve, 0);
            e.copyBufferToBuffer(resolve, 0, times, 0, 16);
          }
          device.queue.submit([e.finish()]);
          if (!query) return;
          await times.mapAsync(GPUMapMode.READ);
          const t = new BigUint64Array(times.getMappedRange()),
            ms = Number(t[1] - t[0]) / 1e6 / repeats;
          times.unmap();
          return ms;
        };
        const snapshots = [];
        for (let mode = 0; mode < 2; mode++) {
          await run(mode);
          snapshots.push(
            await Promise.all(
              [colors, counters].map(
                async (b) => new Uint32Array(await readBuffer(device, b)),
              ),
            ),
          );
        }
        assert(
          snapshots[0].every((a, k) =>
            a.every((v, i) => v === snapshots[1][k][i]),
          ),
          dimension +
            "D exact stable ranks, histograms, static/padding preservation and clash counts: " +
            count +
            " / " +
            palette,
        );
        const samples = [[], []];
        if (timed)
          for (let i = 0; i < 30; i++)
            for (const mode of i % 2 ? [1, 0] : [0, 1]) {
              const ms = await run(mode, 20);
              if (i >= 10) samples[mode].push(ms);
            }
        const median = (a) =>
          [...a].sort((a, b) => a - b)[Math.floor(a.length / 2)];
        results.push({
          dimension,
          dynamicEvery,
          bodies: count,
          palette,
          identical: true,
          scanMs: median(samples[0]) ?? null,
          bitsetMs: median(samples[1]) ?? null,
          ...(timed ? { samples } : {}),
        });
      } finally {
        query?.destroy();
        resources.forEach((b) => b.destroy());
      }
    }
  return results;
}
export async function colorBucketGpuTests(device, test) {
  for (const dimension of [2, 3]) {
    await test(`GPU ${dimension}D bitset color ranks preserve stable scheduling and every histogram word`, async () => {
      await checkColorBuckets(
        device,
        dimension,
        [0, 1, 17, 255, 256, 257, 2416],
      );
    });
    await test(`GPU ${dimension}D large worlds retain bitset scheduling after sensor pipeline changes`, async () => {
      const scene =
        dimension === 2
          ? new AvbdScene2D({ gravity: 0 })
          : new AvbdScene3D({ gravity: 0 });
      const size = dimension === 2 ? [1, 1] : [1, 1, 1];
      const bodies = Array.from({ length: 1025 }, (_, i) =>
        scene.addBox(size, {
          position: dimension === 2 ? [i * 3, 5] : [i * 3, 5, 0],
        }),
      );
      const g = scene.createSolver(device);
      try {
        g.step();
        assert(
          g.bitsetColorBuckets,
          "Large worlds select bitset ranks automatically",
        );
        g.body(bodies[0]).setTrigger(true);
        g.step();
        assert(
          g.bitsetColorBuckets,
          "Topology recompilation preserves automatic selection",
        );
        const c = await g.readCounters();
        assert(!c.overflow && !c.clashes, "Valid complete work schedule");
        assert(
          (await g.readBodies()).every(Number.isFinite),
          "Live scheduled state stays finite",
        );
      } finally {
        g.destroy();
      }
    });
  }
}
