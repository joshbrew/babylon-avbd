import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import { GpuSolver3D } from "../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import {
  refsWGSL,
  broadphaseWGSL,
  makeContactsWGSL,
} from "../reference/three-avbd/src/avbd3d/gpu/wgsl-collision.ts";
import { portableContactRefs } from "../src/gpu/contactCache3D.js";
import {
  checkGpuContacts3D,
  runGpuContactChecks3D,
} from "../src/gpu/contactCheck3D.js";
import {
  gpuExecutionPolicy3D,
  setGpuExecutionPolicy3D,
} from "../src/gpu/executionPolicy3D.js";
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
      result.selected === "batched-grid" &&
        !result.compatibility &&
        result.attempts.length === 1,
      "Passing GPUs keep the original execution path and do not run fallback checks",
    );
    assert(
      result.pipeline.counters.pairs === 3 &&
        result.pipeline.counters.manifolds === 3,
      "Known overlaps locate pair generation and contact creation separately",
    );
    assert(
      (await checkGpuContacts3D(device)) === result,
      "One startup check per device",
    );
  });
  for (const [fault, selected] of [
    ["batched-pairs", "isolated-grid"],
    ["grid-pairs", "batched-hploc"],
    ["batched-contacts", "isolated-grid"],
    ["all-but-isolated-hploc", "isolated-hploc"],
  ])
    await test(`GPU 3D compatibility verifies ${selected} after ${fault} failure`, async () => {
      const previous = gpuExecutionPolicy3D(device);
      setGpuExecutionPolicy3D(device, null);
      try {
        const result = await runGpuContactChecks3D(device, (gpu, mode) => {
          const blocked =
            fault === "all-but-isolated-hploc"
              ? mode.name !== "isolated-hploc"
              : fault === "grid-pairs"
                ? mode.broadphase === "grid"
                : mode.name === "batched-grid";
          if (!blocked) return;
          if (mode.broadphase === "hploc")
            gpu.externalBeforeStep = () => {
              if (gpu.bvh) gpu.bvh.encodePairs = () => {};
            };
          const entry =
            fault === "batched-contacts" ? "narrowphase" : "findPairs";
          const source =
            entry === "narrowphase" ? makeContactsWGSL(false) : broadphaseWGSL;
          const signature = `@compute @workgroup_size(64)\nfn ${entry}`;
          const at = source.indexOf(signature);
          assert(at >= 0, "Known kernel signature");
          gpu.pipes[entry] = device.createComputePipeline({
            layout: device.createPipelineLayout({
              bindGroupLayouts: [
                gpu.layouts[entry === "narrowphase" ? "contacts" : "broad"],
              ],
            }),
            compute: {
              module: device.createShaderModule({
                code:
                  source.slice(0, at) +
                  `@compute @workgroup_size(64) fn ${entry}(){}`,
              }),
              entryPoint: entry,
            },
          });
        });
        assert(
          result.passed && result.selected === selected && result.compatibility,
          JSON.stringify(result),
        );
        assert(
          result.cases.every((c) => c.passed),
          "The selected path passes the full falling-shape check",
        );
        assert(
          result.attempts[0].pipeline.stage ===
            (fault === "batched-contacts"
              ? "contact-generation"
              : "collision-pairs"),
          "Diagnostics identify the injected failing stage",
        );
        const next = world(device);
        try {
          assert(
            next.dispatchIsolation === selected.startsWith("isolated"),
            "New worlds inherit checked dispatch selection",
          );
          assert(
            next.broadphase === (selected.endsWith("hploc") ? "hploc" : "grid"),
            "New worlds inherit checked collision selection",
          );
          next.step();
          const counters = await next.readCounters();
          assert(
            counters.manifolds === 1 && !counters.overflow && !counters.clashes,
            "The actual scene still creates contacts",
          );
        } finally {
          next.destroy();
        }
      } finally {
        setGpuExecutionPolicy3D(device, previous);
      }
    });
  await test("GPU 3D compatibility refuses paths that all fail real contacts", async () => {
    const previous = gpuExecutionPolicy3D(device);
    setGpuExecutionPolicy3D(device, null);
    try {
      const result = await runGpuContactChecks3D(device, (gpu) => {
        gpu.externalBeforeStep = () => {
          if (gpu.bvh) gpu.bvh.encodePairs = () => {};
        };
        const at = broadphaseWGSL.indexOf(
          "@compute @workgroup_size(64)\nfn findPairs",
        );
        gpu.pipes.findPairs = device.createComputePipeline({
          layout: device.createPipelineLayout({
            bindGroupLayouts: [gpu.layouts.broad],
          }),
          compute: {
            module: device.createShaderModule({
              code:
                broadphaseWGSL.slice(0, at) +
                "@compute @workgroup_size(64) fn findPairs(){}",
            }),
            entryPoint: "findPairs",
          },
        });
      });
      assert(
        !result.passed &&
          result.selected === null &&
          result.attempts.length === 4,
        "Every unverified path remains rejected",
      );
      assert(
        !gpuExecutionPolicy3D(device),
        "Failed checks do not install a solver policy",
      );
    } finally {
      setGpuExecutionPolicy3D(device, previous);
    }
  });
  await test("GPU 3D isolated dispatches preserve rotation contacts and detailed timestamps", async () => {
    const a = world(device),
      b = world(device);
    b.dispatchIsolation = true;
    try {
      for (const gpu of [a, b])
        device.queue.writeBuffer(
          gpu.bodyBuffer,
          176,
          new Float32Array([Math.sin(0.2), 0, 0, Math.cos(0.2)]),
        );
      for (let i = 0; i < 120; i++) {
        a.step();
        b.step();
      }
      const x = await a.readBodies(),
        y = await b.readBodies();
      assert(
        x.every((v, i) => Number.isFinite(y[i]) && Math.abs(v - y[i]) < 1e-6),
        "Separate dispatches preserve every body word",
      );
      if (device.features.has("timestamp-query")) {
        const profile = new Promise((resolve) =>
          b.profileDetailedNextStep(resolve),
        );
        b.step();
        const timing = await profile;
        assert(
          timing.total >= 0 &&
            Object.values(timing.details).every(
              (v) => Number.isFinite(v) && v >= 0,
            ),
          "Detailed GPU phase timestamps remain valid",
        );
      }
    } finally {
      a.destroy();
      b.destroy();
    }
  });
}
