import {
  GpuSurfaceParticles,
  GPUBufferRecycler,
  GpuContactSample,
  addGpuStepPass,
} from "../src/utilities.js";
import { createEncodingFixture } from "./gpu-command-encoding.js";
import { assert, readBuffer } from "./helpers/gpu.js";

export async function utilityGpuTests(device, test) {
  for (const dimension of [2, 3])
    await test(`Package ${dimension}D custom GPU passes compose, detach and preserve physics`, async () => {
      const world = createEncodingFixture(device, dimension),
        baseline = createEncodingFixture(device, dimension);
      const buffers = Array.from({ length: 3 }, () =>
        device.createBuffer({
          size: 4,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        }),
      );
      device.queue.writeBuffer(buffers[0], 0, new Uint32Array([123]));
      const calls = [];
      const previous = function () {
        assert(this === world, "Existing callback receiver is preserved");
        calls.push("previous");
      };
      world.externalBeforeStep = previous;
      const removeA = addGpuStepPass(world, {
        before(e) {
          calls.push("beforeA");
          e.copyBufferToBuffer(buffers[0], 0, buffers[1], 0, 4);
        },
        after() {
          calls.push("afterA");
        },
      });
      const removeB = addGpuStepPass(world, {
        before() {
          calls.push("beforeB");
        },
        after(e) {
          calls.push("afterB");
          e.copyBufferToBuffer(buffers[1], 0, buffers[2], 0, 4);
        },
      });
      try {
        world.step();
        baseline.step();
        assert(
          calls.join(",") === "previous,beforeA,beforeB,afterA,afterB",
          "Registration order is retained across before/after phases",
        );
        assert(
          new Uint32Array(await readBuffer(device, buffers[2], 4))[0] === 123,
          "Custom work executes in the physics submission",
        );
        const a = await world.readBodies(),
          b = await baseline.readBodies();
        assert(
          a.every((value, i) => value === b[i]),
          "Custom copies do not change movement equations or state",
        );
        removeA();
        removeB();
        assert(
          world.externalBeforeStep === previous,
          "Removing the last pass restores the original hook",
        );
        const removeC = addGpuStepPass(world, {
          before() {
            calls.push("C");
          },
        });
        removeA(); // Repeated disposal cannot remove a later registration.
        const removeD = addGpuStepPass(world, {
          before() {
            calls.push("D");
          },
        });
        calls.length = 0;
        world.step();
        assert(
          calls.join(",") === "previous,C,D",
          "Repeated disposal retains subsequent registrations",
        );
        removeC();
        removeD();
      } finally {
        removeA();
        removeB();
        world.destroy();
        baseline.destroy();
        for (const buffer of buffers) buffer.destroy();
      }
    });
  await test("Package particle sweeps preserve exact state across tiled dispatch and partial groups", async () => {
    const tiled = new Proxy(device, {
      get(target, key) {
        if (key === "limits")
          return {
            maxComputeWorkgroupsPerDimension: 2,
            maxBufferSize: device.limits.maxBufferSize,
            maxStorageBufferBindingSize:
              device.limits.maxStorageBufferBindingSize,
          };
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    const a = new GpuSurfaceParticles(device, {
      capacity: 300,
      triangleCount: 2,
      readback: false,
    });
    const b = new GpuSurfaceParticles(tiled, {
      capacity: 300,
      triangleCount: 2,
      readback: false,
    });
    const triangle = new Float32Array([
      -20, -20, 0, 0, 20, -20, 0, 0, 20, 20, 0, 0, -20, -20, 0, 0, 20, 20, 0, 0,
      -20, 20, 0, 0,
    ]);
    try {
      a.writeTriangles(triangle);
      b.writeTriangles(triangle);
      for (const count of [1, 129, 257]) {
        a.clear();
        b.clear();
        let hits = 0;
        for (let frame = 0; frame < 25; frame++) {
          for (const particles of [a, b])
            particles.step({
              count,
              frame,
              dt: 1 / 60,
              speed: 20,
              spawnRadius: 4,
              jitter: 0,
            });
          const counters = new Uint32Array(
            await readBuffer(device, b.counterBuffer, 16),
          );
          assert(
            counters[1] === count,
            "Every requested particle is processed exactly once",
          );
          hits += counters[0];
        }
        assert(hits > 0, "Particles hit the triangle surface");
        const x = new Uint32Array(
          await readBuffer(device, a.particleBuffer, 300 * 48),
        );
        const y = new Uint32Array(
          await readBuffer(device, b.particleBuffer, 300 * 48),
        );
        assert(
          x.every((value, i) => value === y[i]),
          "Tiling retains exact particle state",
        );
      }
      let rejected = 0;
      try {
        a.step({ count: 301, dt: 1 / 60 });
      } catch {
        rejected++;
      }
      try {
        a.writeTriangles(new Float32Array(3));
      } catch {
        rejected++;
      }
      assert(
        rejected === 2,
        "Invalid capacity and triangle uploads are rejected before dispatch",
      );
    } finally {
      a.destroy();
      b.destroy();
    }
  });
  await test("Package GPU utilities reuse buffers and validate contact sampling capacity", async () => {
    const pool = new GPUBufferRecycler(device, { maxFreeBytes: 128 });
    try {
      const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
      const a = pool.acquire(64, usage);
      pool.release(a, 64, usage);
      assert(
        pool.acquire(32, usage) === a,
        "Released storage is reused without allocating or downloading",
      );
      const sample = new GpuContactSample(device, { count: 65 });
      assert(
        sample.buffer.size === 65 * 16,
        "Partial contact sample groups retain the requested storage size",
      );
      sample.dispose();
      let rejected = false;
      try {
        new GpuContactSample(device, { count: 0 });
      } catch {
        rejected = true;
      }
      assert(rejected, "Empty sampling dispatch is rejected");
    } finally {
      pool.destroy();
    }
  });
}
