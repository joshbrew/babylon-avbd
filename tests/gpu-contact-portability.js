import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import { GpuSolver3D } from "../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { refsWGSL } from "../reference/three-avbd/src/avbd3d/gpu/wgsl-collision.ts";
import { portableContactRefs } from "../src/gpu/contactCache3D.js";
import { checkGpuContacts3D } from "../src/gpu/contactCheck3D.js";
import { assert, readBuffer } from "./helpers/gpu.js";

function world(device, Class = AppGpuSolver3D) {
  const s = new Solver();
  s.gravity = 0;
  new Rigid(s, [8, 8, 1], 0, 0.6, [0, 0, -0.5]);
  new Rigid(s, [1, 1, 1], 1, 0.6, [0, 0, 0.45]);
  return new Class(device, s, { spatialSort: false, bodyCapacity: 2 });
}
async function generation(gpu) {
  const counters = await gpu.readCounters();
  assert(
    counters.manifolds === 1 && !counters.overflow && !counters.clashes,
    "One complete floor manifold",
  );
  const words = new Uint32Array(
    await readBuffer(gpu.device, gpu.contactStorage.manifolds, 32),
  );
  return (words[3] >>> 4) & 0x07ffffff;
}
export async function contactPortabilityGpuTests(device, test) {
  await test("GPU 3D contact cache survives permitted subnormal flushing", async () => {
    const worlds = [world(device, GpuSolver3D), world(device)];
    try {
      const generations = [];
      for (let k = 0; k < worlds.length; k++) {
        const gpu = worlds[k];
        let source = k ? portableContactRefs(refsWGSL) : refsWGSL;
        source = source.replace(
          /(bodies\[i\]\.inertialPos\.w = [^\n]+;)/,
          "$1\n    if (abs(bodies[i].inertialPos.w) < 1.17549435e-38) { bodies[i].inertialPos.w = 0.0; }",
        );
        gpu.pipes.updateRefs = device.createComputePipeline({
          layout: device.createPipelineLayout({
            bindGroupLayouts: [gpu.layouts.refs],
          }),
          compute: {
            module: device.createShaderModule({ code: source }),
            entryPoint: "updateRefs",
          },
        });
        gpu.step();
        await generation(gpu);
        // Rotate live GPU geometry beyond the cache's reference tolerance.
        device.queue.writeBuffer(
          gpu.bodyBuffer,
          160 + 16,
          new Float32Array([0, 0, Math.sin(0.4), Math.cos(0.4)]),
        );
        gpu.step();
        generations.push(await generation(gpu));
      }
      assert(
        generations[0] === 1,
        "Raw integer-as-float stamps reproduce stale contact reuse under flushing",
      );
      assert(
        generations[1] === 2,
        "Normal float stamps regenerate moved contacts under the same flushing",
      );
      const data = await worlds[1].readBodies();
      assert(data.every(Number.isFinite), "Finite physics state");
      const bits = new Uint32Array(data.buffer);
      assert(
        bits[40 + 27] >>> 23 > 0 && bits[40 + 27] >>> 23 < 255,
        "Cache metadata is a normal finite float",
      );
    } finally {
      worlds.forEach((g) => g.destroy());
    }
  });
  await test("GPU 3D contact cache handles generation rollover and sensor bits", async () => {
    for (const sensor of [false, true]) {
      const gpu = world(device);
      try {
        if (sensor) gpu.setSensor(0, true);
        gpu.stepCount = 0x07fffffe;
        gpu.step();
        assert(
          (await generation(gpu)) === 0x07ffffff,
          "Pre-rollover contact generation",
        );
        device.queue.writeBuffer(
          gpu.bodyBuffer,
          160 + 16,
          new Float32Array([0, 0, Math.sin(0.4), Math.cos(0.4)]),
        );
        gpu.step();
        assert(
          (await generation(gpu)) === 0,
          "Moved contact regenerated after rollover",
        );
        const data = await gpu.readBodies();
        assert(
          data[40 + 27] === 1,
          "Wrapped stamp remains normal, rather than becoming an empty marker",
        );
      } finally {
        gpu.destroy();
      }
    }
  });
  await test("GPU 3D floor check keeps box sphere and capsule above a thin floor", async () => {
    const result = await checkGpuContacts3D(device);
    assert(result.passed, JSON.stringify(result));
    assert(
      (await checkGpuContacts3D(device)) === result,
      "One startup check per device",
    );
  });
}
