import { contactRecyclingOptions } from "../src/gpu/contactRecycling.js";
import {
  capturePair3D,
  canRecycle3D,
  capturePair2D,
  canRecycle2D,
} from "../src/native/cpu/contactRecycling.js";
import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { createSolverPipeline } from "../src/native/pipeline.js";

function fixture(dimension, rounded = false) {
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: -10 })
      : new AvbdScene2D({ gravity: -10 });
  if (dimension === 3) {
    scene.addBox([8, 1, 8], {
      mass: 0,
      position: [0, -0.5, 0],
      velocity: [1, 0, 0],
    });
    if (rounded)
      scene.addSphere(0.5, { position: [0, 0.49, 0], velocity: [1, 0, 0] });
    else
      scene.addBox([1, 1, 1], { position: [0, 0.49, 0], velocity: [1, 0, 0] });
  } else {
    scene.addBox([8, 1], {
      density: 0,
      position: [0, -0.5],
      velocity: [1, 0, 0],
    });
    if (rounded)
      scene.addCircle(0.5, { position: [0, 0.49], velocity: [1, 0, 0] });
    else scene.addBox([1, 1], { position: [0, 0.49], velocity: [1, 0, 0] });
  }
  return scene;
}

export async function checkContactRecycling({ portable = false } = {}) {
  const rows = [];
  const options = contactRecyclingOptions(true);
  for (const value of [
    null,
    0,
    "on",
    { distance: NaN },
    { distance: true },
    { distance: -1 },
    { maxAngle: 0 },
    { maxAngle: 1e-300 },
    { maxAngle: 0.2 },
  ]) {
    let rejected = false;
    try {
      contactRecyclingOptions(value);
    } catch {
      rejected = true;
    }
    if (!rejected) throw Error("Invalid recycling options accepted");
  }
  const a = {
      positionLin: [0, 0, 0],
      positionAng: [0, 0, 0, 1],
      mass: 1,
      size: [1, 1, 1],
      radius: 1,
    },
    b = { ...a, positionLin: [1, 0, 0] },
    cache = capturePair3D(a, b, 1);
  a.positionLin[0] += 10;
  b.positionLin[0] += 10;
  if (!canRecycle3D(cache, a, b, options, 1))
    throw Error("Shared translation invalidated a relative cache");
  for (let i = 0; i < 4; i++) b.positionLin[0] += 0.003;
  if (canRecycle3D(cache, a, b, options, 1))
    throw Error("Cumulative relative motion drifted past tolerance");
  b.positionLin[0] -= 0.012;
  a.positionAng = [0, 0, Math.sin(0.1), Math.cos(0.1)];
  b.positionAng = [...a.positionAng];
  if (canRecycle3D(cache, a, b, options, 1))
    throw Error("Shared rotation retained a stale world normal");
  const t = {
      pose: new Float64Array([0, 0, 0, 0, 1, 0, 0, 0]),
      shape: new Float64Array([1, 1, 1, 1, 1, 1, 1, 1]),
      contactRecycling: options,
      contactRecyclingEpoch: 1,
    },
    c = capturePair2D(t, 0, 1, 1, new Float64Array(7));
  t.pose[0] += 10;
  t.pose[4] += 10;
  if (!canRecycle2D(c, t, 0, 1)) throw Error("2D shared translation rejected");
  t.pose[4] += 0.012;
  if (canRecycle2D(c, t, 0, 1))
    throw Error("2D cumulative movement drifted past tolerance");
  for (const backend of ["cpu", "webgpu"]) {
    const pipeline = await createSolverPipeline({ backend });
    const errors = [];
    pipeline.device?.addEventListener("uncapturederror", (e) =>
      errors.push(e.error.message),
    );
    try {
      for (const dimension of [2, 3])
        for (const rounded of [false, true]) {
          const world = pipeline.createSolver(fixture(dimension, rounded), {
            contactRecycling: true,
            portableContactMath: portable && dimension === 3,
            smallGroups: false,
            spatialSort: false,
            capacity: { contacts: 128, pairs: 128, manifolds: 64 },
            minimumColorRounds: 8,
          });
          try {
            for (let i = 0; i < 90; i++) world.step();
            const before = await world.readContactRecyclingStats();
            const poses = await world.readBodies();
            const counters = await world.readCounters();
            if (errors.length) throw Error(errors[0]);
            if (!counters.contacts)
              throw Error(
                `${backend} ${dimension}D rounded=${rounded} lost floor support: ${JSON.stringify({ before, counters, params: world.params, poses: Array.from(poses) })}`,
              );
            // Moving both shapes together must preserve relative geometry. Rounded
            // contacts remain fresh so rolling anchors cannot become pinned.
            if (!rounded && before.recycledPairs < 10)
              throw Error(
                `${backend} ${dimension}D failed to recycle co-moving contacts: ${JSON.stringify(before)}`,
              );
            if (rounded && before.recycledPairs !== 0)
              throw Error("Rounded contacts must refresh");
            if (
              !poses.every(Number.isFinite) ||
              counters.overflow ||
              counters.clashes
            )
              throw Error("Invalid recycling simulation");
            const index = world.gpuIndex?.(1) ?? 1;
            world.setFilters([index], [1], [0]);
            world.step();
            if ((await world.readCounters()).contacts !== 0)
              throw Error("Mask retained cached contact");
            world.setFilters([index], [0xffffffff], [0xffffffff]);
            world.step();
            if (!(await world.readCounters()).contacts)
              throw Error("Mask restoration lost contact");
            world.setSensor(index, true);
            const sensorBefore = await world.readContactRecyclingStats();
            world.step();
            const sensorAfter = await world.readContactRecyclingStats();
            if (sensorAfter.recycledPairs !== sensorBefore.recycledPairs)
              throw Error("Trigger reused solving contacts");
            world.setSensor(index, false);
            world.step();
            if (world.device) {
              // Exercise f32 epoch rollover before the next cache can be used.
              world.contactRecyclingEpoch = 0xffffff;
              world.setFilters([index], [0xffffffff], [0xffffffff]);
              if (world.contactRecyclingEpoch !== 1)
                throw Error("Cache epoch failed to wrap");
              world.allocateContacts(
                world.contactCapacity * 2,
                world.pairCapacity * 2,
                (world.manifoldCapacity ?? 1) * 2,
              );
              world.step();
              if (!(await world.readCounters()).contacts)
                throw Error("Capacity growth lost contacts");
            }
            const position = dimension === 3 ? [0, 4, 0] : [0, 4];
            world.editBodies([
              {
                body: index,
                position,
                linearVelocity: dimension === 3 ? [0, 0, 0] : [0, 0],
              },
            ]);
            world.step();
            const afterTeleport = await world.readCounters();
            if (afterTeleport.contacts !== 0)
              throw Error("Teleport retained an old contact");
            rows.push({
              backend,
              dimension,
              rounded,
              portableContactMath:
                portable && backend === "webgpu" && dimension === 3,
              before,
              counters,
              teleportContacts: afterTeleport.contacts,
            });
          } finally {
            world.destroy();
          }
        }
    } finally {
      pipeline.destroy();
    }
  }
  return rows;
}

/** Extra comparisons isolate CPU collision work and shared motion on the GPU. */
export async function benchmarkRecyclingWorkloads() {
  const result = [];
  const summarize = (a) => {
    const s = a.toSorted((a, b) => a - b);
    return {
      mean: a.reduce((s, v) => s + v, 0) / a.length,
      median: s[Math.floor(s.length / 2)],
      p95: s[Math.floor(s.length * 0.95)],
      samples: a.length,
    };
  };
  for (const backend of ["cpu", "webgpu"]) {
    const pipeline = await createSolverPipeline({ backend });
    const errors = [];
    pipeline.device?.addEventListener("uncapturederror", (e) =>
      errors.push(e.error.message),
    );
    try {
      for (const dimension of backend === "cpu" ? [2, 3] : [3]) {
        const repeats = [];
        for (let repeat = 0; repeat < 2; repeat++) {
          const worlds = [];
          try {
            for (const enabled of repeat % 2 ? [true, false] : [false, true]) {
              const scene =
                dimension === 3 ? new AvbdScene3D() : new AvbdScene2D();
              const side = backend === "cpu" ? (dimension === 2 ? 8 : 4) : 10,
                velocity = backend === "webgpu" ? [0.4, 0, 0] : [0, 0, 0];
              if (dimension === 3) {
                scene.addBox([side + 4, 1, side + 4], {
                  mass: 0,
                  position: [0, -0.5, 0],
                  velocity,
                });
                for (let x = 0; x < side; x++)
                  for (let y = 0; y < side; y++)
                    for (let z = 0; z < side; z++)
                      scene.addBox([1, 1, 1], {
                        position: [
                          (x - (side - 1) / 2) * 1.01,
                          0.495 + y * 0.995,
                          (z - (side - 1) / 2) * 1.01,
                        ],
                        velocity,
                      });
              } else {
                scene.addBox([side + 4, 1], {
                  density: 0,
                  position: [0, -0.5],
                });
                for (let x = 0; x < side; x++)
                  for (let y = 0; y < side; y++)
                    scene.addBox([1, 1], {
                      position: [
                        (x - (side - 1) / 2) * 1.01,
                        0.495 + y * 0.995,
                      ],
                    });
              }
              const world = pipeline.createSolver(scene, {
                contactRecycling: enabled,
                smallGroups: false,
                minimumColors: 16,
                minimumColorRounds: 16,
                capacity: { contacts: 30_000, manifolds: 8_000, pairs: 30_000 },
              });
              worlds.push({ world, enabled, times: [] });
            }
            for (let step = 0; step < 300; step++) {
              for (const w of step % 2 ? worlds : [...worlds].reverse()) {
                if (backend === "webgpu" && step >= 60 && step % 4 === 0)
                  w.world.profileNextStep((p) => w.times.push(p.total));
                const start = performance.now();
                w.world.step();
                if (backend === "cpu" && step >= 60)
                  w.times.push(performance.now() - start);
              }
              if (pipeline.device && step % 4 === 0)
                await pipeline.device.queue.onSubmittedWorkDone();
            }
            if (pipeline.device)
              await pipeline.device.queue.onSubmittedWorkDone();
            const runs = [];
            for (const w of worlds) {
              const poses = await w.world.readBodies(),
                counters = await w.world.readCounters();
              if (
                !poses.every(Number.isFinite) ||
                counters.overflow ||
                counters.clashes ||
                errors.length
              )
                throw Error(errors[0] ?? "Invalid benchmark workload");
              runs.push({
                enabled: w.enabled,
                total: summarize(w.times),
                stats: await w.world.readContactRecyclingStats(),
                counters,
                bodies: w.world.bodyCount,
                settings: {
                  timeStep: w.world.params.dt,
                  iterations: w.world.params.iterations,
                  sleeping: false,
                  warmupSteps: 60,
                  measuredSteps: 240,
                },
              });
            }
            repeats.push({ repeat, runs });
          } finally {
            worlds.forEach((w) => w.world.destroy());
          }
        }
        const mean = (enabled) =>
          repeats.reduce(
            (s, r) => s + r.runs.find((r) => r.enabled === enabled).total.mean,
            0,
          ) / repeats.length;
        result.push({
          name:
            backend === "cpu"
              ? `${dimension}D · 64 supported boxes`
              : "3D · 1,000 boxes on a moving platform",
          backend,
          dimension,
          clock: backend === "cpu" ? "CPU wall time" : "GPU timestamps",
          offMs: mean(false),
          onMs: mean(true),
          repeats,
        });
      }
    } finally {
      pipeline.destroy();
    }
  }
  return result;
}
