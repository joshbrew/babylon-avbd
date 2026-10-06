import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";

const median = (values) => {
  const a = [...values].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
};
/** Measures API uploads, not AVBD solving or rendering. Alternates method order after warmup. */
export async function nativeEditPerformance(
  device,
  dimension,
  count = 100_000,
  samples = 5,
) {
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: 0 })
      : new AvbdScene2D({ gravity: 0 });
  for (let i = 0; i < count; i++)
    scene.addBox(dimension === 3 ? [0.5, 0.5, 0.5] : [0.5, 0.5], {
      position:
        dimension === 3
          ? [i % 400, 4, Math.floor(i / 400)]
          : [i % 400, 4 + Math.floor(i / 400)],
    });
  const gpu = scene.createSolver(device);
  const indices = Uint32Array.from({ length: count }, (_, i) => i),
    velocities = new Float32Array(count * dimension);
  for (let i = 0; i < count; i++) {
    velocities[i * dimension] = 1;
    velocities[i * dimension + 1] = 2;
  }
  const timings = { commands: [], objects: [], packed: [] };
  const handles = Array.from(indices, (i) => gpu.body(i));
  const velocity = dimension === 3 ? [1, 2, 0] : [1, 2];
  function* edits() {
    for (let i = 0; i < count; i++) yield { body: i, linearVelocity: velocity };
  }
  try {
    // Warm pipelines and upload storage outside measurements.
    gpu.editBodies(edits());
    gpu.flushEdits();
    await device.queue.onSubmittedWorkDone();
    gpu.setLinearVelocities(indices, velocities);
    await device.queue.onSubmittedWorkDone();
    for (const body of handles) body.setLinearVelocity(velocity);
    gpu.flushEdits();
    await device.queue.onSubmittedWorkDone();
    const selected = [0, count >> 1, count - 1];
    let expected;
    for (let sample = 0; sample < samples; sample++) {
      for (const method of sample % 2
        ? ["packed", "objects", "commands"]
        : ["commands", "objects", "packed"]) {
        const start = performance.now();
        if (method === "commands") {
          gpu.editBodies(edits());
          gpu.flushEdits();
        } else if (method === "objects") {
          for (const body of handles) body.setLinearVelocity(velocity);
          gpu.flushEdits();
        } else gpu.setLinearVelocities(indices, velocities);
        const submitted = performance.now();
        await device.queue.onSubmittedWorkDone();
        const done = performance.now();
        timings[method].push({
          cpuSubmitMs: submitted - start,
          submitAndWaitMs: done - start,
        });
        const state = await gpu.readSelectedBodies(selected);
        if (!expected) expected = state;
        else if (!state.every((v, i) => v === expected[i]))
          throw Error(
            "Packed edits changed other fields or applied different velocities",
          );
      }
    }
    const linearBatch = gpu.bodyCommands.lastBatch;
    const angularDimension = dimension === 3 ? 3 : 1;
    const angularValues = new Float32Array(count * angularDimension).fill(0.5);
    const angular = dimension === 3 ? [0.5, 0.5, 0.5] : 0.5;
    const motionTimings = { objects: [], commands: [], packed: [] };
    function* motionEdits() {
      for (let i = 0; i < count; i++)
        yield { body: i, linearVelocity: velocity, angularVelocity: angular };
    }
    const updateMotion = (method) => {
      if (method === "packed")
        gpu.setVelocities(indices, {
          linear: velocities,
          angular: angularValues,
        });
      else if (method === "commands") {
        gpu.editBodies(motionEdits());
        gpu.flushEdits();
      } else {
        for (const body of handles)
          body.setLinearVelocity(velocity).setAngularVelocity(angular);
        gpu.flushEdits();
      }
    };
    for (const method of Object.keys(motionTimings)) {
      updateMotion(method);
      await device.queue.onSubmittedWorkDone();
    }
    let motionExpected;
    for (let sample = 0; sample < samples; sample++)
      for (const method of sample % 2
        ? ["packed", "objects", "commands"]
        : ["commands", "objects", "packed"]) {
        const start = performance.now();
        updateMotion(method);
        const submitted = performance.now();
        await device.queue.onSubmittedWorkDone();
        motionTimings[method].push({
          cpuSubmitMs: submitted - start,
          submitAndWaitMs: performance.now() - start,
        });
        const state = await gpu.readSelectedBodies(selected);
        if (!motionExpected) motionExpected = state;
        else if (!state.every((v, i) => v === motionExpected[i]))
          throw Error("Motion batching changed selected body records");
      }
    const motion = Object.fromEntries(
      Object.entries(motionTimings).map(([method, t]) => [
        method,
        {
          cpuSubmitMs: median(t.map((t) => t.cpuSubmitMs)),
          submitAndWaitMs: median(t.map((t) => t.submitAndWaitMs)),
          uploadedBytes: count * (dimension === 3 ? 32 : 20),
        },
      ]),
    );
    return {
      dimension,
      bodies: count,
      samples,
      identicalSelectedRecords: true,
      commands: {
        cpuSubmitMs: median(timings.commands.map((t) => t.cpuSubmitMs)),
        submitAndWaitMs: median(timings.commands.map((t) => t.submitAndWaitMs)),
        uploadedBytes: linearBatch.uploadedBytes,
        path: linearBatch.path,
      },
      objects: {
        cpuSubmitMs: median(timings.objects.map((t) => t.cpuSubmitMs)),
        submitAndWaitMs: median(timings.objects.map((t) => t.submitAndWaitMs)),
        uploadedBytes: linearBatch.uploadedBytes,
        path: linearBatch.path,
      },
      packed: {
        cpuSubmitMs: median(timings.packed.map((t) => t.cpuSubmitMs)),
        submitAndWaitMs: median(timings.packed.map((t) => t.submitAndWaitMs)),
        uploadedBytes: gpu.velocityBatch.lastBatch.uploadedBytes,
      },
      timings,
      motion: {
        ...motion,
        identicalSelectedRecords: true,
        timings: motionTimings,
      },
    };
  } finally {
    gpu.destroy();
  }
}

/** Same property values and exact ray hits, comparing flush frequency and query batching. */
export async function nativeOverheadPerformance(
  device,
  dimension,
  count = 10_000,
  samples = 3,
) {
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: 0 })
      : new AvbdScene2D({ gravity: 0 });
  for (let i = 0; i < count; i++)
    scene.addBox(dimension === 3 ? [0.5, 0.5, 0.5] : [0.5, 0.5], {
      position:
        dimension === 3
          ? [i % 200, 5, Math.floor(i / 200)]
          : [i % 200, 5 + Math.floor(i / 200)],
    });
  const gpu = scene.createSolver(device),
    handles = Array.from({ length: count }, (_, i) => gpu.body(i));
  const timings = { perBodyFlush: [], oneFlush: [] };
  const properties = (perBody) => {
    for (const body of handles) {
      body.setTrigger(true).setRestitution(0.25).setCollisionGroups(2, 2);
      if (perBody) gpu.flushEdits();
    }
    if (!perBody) gpu.flushEdits();
  };
  try {
    properties(false);
    await device.queue.onSubmittedWorkDone();
    properties(true);
    await device.queue.onSubmittedWorkDone();
    let expected;
    const bytes = {},
      writes = {};
    for (let sample = 0; sample < samples; sample++)
      for (const method of sample % 2
        ? ["oneFlush", "perBodyFlush"]
        : ["perBodyFlush", "oneFlush"]) {
        const queue = device.queue,
          write = queue.writeBuffer;
        let calls = 0;
        queue.writeBuffer = function (...args) {
          calls++;
          return write.apply(this, args);
        };
        const start = performance.now();
        try {
          properties(method === "perBodyFlush");
        } finally {
          queue.writeBuffer = write;
        }
        const submitted = performance.now();
        await device.queue.onSubmittedWorkDone();
        timings[method].push({
          cpuSubmitMs: submitted - start,
          submitAndWaitMs: performance.now() - start,
        });
        writes[method] = calls;
        bytes[method] =
          method === "oneFlush"
            ? gpu.propertyEdits.lastBatch.uploadedBytes
            : count * 16;
        const state = await gpu.readSelectedBodies([0, count >> 1, count - 1]);
        if (!expected) expected = state;
        else if (!state.every((v, i) => v === expected[i]))
          throw Error("Property batching changed selected body records");
      }
    const propertiesResult = Object.fromEntries(
      Object.entries(timings).map(([method, t]) => [
        method,
        {
          cpuSubmitMs: median(t.map((t) => t.cpuSubmitMs)),
          submitAndWaitMs: median(t.map((t) => t.submitAndWaitMs)),
          writeCalls: writes[method],
          uploadedBytes: bytes[method],
        },
      ]),
    );
    // A single upload/mapping for a set of independent queries, versus awaiting each query.
    const raw = await gpu.readSelectedBodies(
      Uint32Array.from({ length: 64 }, (_, i) => i),
      { posesOnly: true },
    );
    const stride = dimension === 3 ? 8 : 4;
    const rays = Array.from({ length: 64 }, (_, i) => ({
      origin:
        dimension === 3
          ? [raw[i * stride], raw[i * stride + 1] + 2, raw[i * stride + 2]]
          : [raw[i * stride], raw[i * stride + 1] + 2],
      direction: dimension === 3 ? [0, -1, 0] : [0, -1],
      maxDistance: 4,
    }));
    const runQueries = async (batch) =>
      batch
        ? gpu.raycastAll(rays, { collidesWith: 2 })
        : Promise.resolve(
            await (async () => {
              const hits = [];
              for (const ray of rays)
                hits.push(
                  await gpu.raycast(ray.origin, ray.direction, {
                    maxDistance: 4,
                    collidesWith: 2,
                  }),
                );
              return hits;
            })(),
          );
    const expectedHits = JSON.stringify(await runQueries(true));
    await runQueries(false);
    const queryTimings = { individual: [], batch: [] };
    for (let sample = 0; sample < samples; sample++)
      for (const method of sample % 2
        ? ["batch", "individual"]
        : ["individual", "batch"]) {
        const start = performance.now(),
          hits = await runQueries(method === "batch");
        queryTimings[method].push(performance.now() - start);
        if (JSON.stringify(hits) !== expectedHits)
          throw Error("Batched queries changed hit results");
      }
    return {
      dimension,
      bodies: count,
      samples,
      properties: {
        ...propertiesResult,
        identicalSelectedRecords: true,
        timings,
      },
      queries: {
        count: 64,
        individualMs: median(queryTimings.individual),
        batchMs: median(queryTimings.batch),
        identicalHits: true,
        timings: queryTimings,
      },
    };
  } finally {
    gpu.destroy();
  }
}
