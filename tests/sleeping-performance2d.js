import { AvbdScene2D } from "../src/native/scenes.js";
const summarize = (values) => {
  const a = values.toSorted((x, y) => x - y);
  return {
    mean: a.reduce((s, x) => s + x, 0) / a.length,
    median: a[Math.floor(a.length / 2)],
    p95: a[Math.floor(a.length * 0.95)],
    samples: a.length,
  };
};
export async function sleepingBenchmark2D(
  device,
  onProgress = () => {},
  checkStop = () => {},
) {
  if (!device.features.has("timestamp-query")) return null;
  const build = (sleeping) => {
    const s = new AvbdScene2D({
      gravity: -10,
      timeStep: 1 / 120,
      iterations: 10,
    });
    s.addPlane();
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 1000; x++)
        s.addBox([1, 1], { position: [(x - 499.5) * 1.01, y + 0.5] });
    return s.createSolver(device, { sleeping, bodyCapacity: 10001 });
  };
  const off = build(false),
    on = build({ timeThreshold: 1000 }),
    query = device.createQuerySet({ type: "timestamp", count: 2 });
  const resolve = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
    }),
    read = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
  const timed = async (g) => {
    checkStop();
    let e = device.createCommandEncoder();
    e.beginComputePass({
      timestampWrites: { querySet: query, beginningOfPassWriteIndex: 0 },
    }).end();
    device.queue.submit([e.finish()]);
    g.step();
    e = device.createCommandEncoder();
    e.beginComputePass({
      timestampWrites: { querySet: query, endOfPassWriteIndex: 1 },
    }).end();
    e.resolveQuerySet(query, 0, 2, resolve, 0);
    e.copyBufferToBuffer(resolve, 0, read, 0, 16);
    device.queue.submit([e.finish()]);
    await read.mapAsync(GPUMapMode.READ);
    const t = new BigUint64Array(read.getMappedRange()),
      ms = Number(t[1] - t[0]) / 1e6;
    read.unmap();
    const c = await g.readCounters();
    if (c.overflow || c.clashes) throw Error(JSON.stringify(c));
    return ms;
  };
  const sample = async (count, warmup) => {
    const result = { off: [], on: [] };
    for (let i = 0; i < count; i++)
      for (const mode of i % 2 ? ["on", "off"] : ["off", "on"]) {
        const ms = await timed(mode === "on" ? on : off);
        if (i >= warmup) result[mode].push(ms);
      }
    return result;
  };
  try {
    onProgress("Measuring 2D sleep checks with all 10,000 boxes awake…");
    const moving = await sample(24, 4),
      initialSleeping = (await on.readSleepStats()).sleeping;
    if (initialSleeping) throw Error("2D awake measurement contains sleepers");
    on.enableSleeping({ timeThreshold: 0.1 });
    onProgress("Letting the 10,000-box 2D stack settle…");
    for (let i = 24; i < 360; i++) {
      checkStop();
      off.step();
      on.step();
      if (i % 20 === 19) {
        await device.queue.onSubmittedWorkDone();
        for (const g of [off, on]) {
          const c = await g.readCounters();
          if (c.overflow || c.clashes) throw Error(JSON.stringify(c));
          g.adapt(c);
        }
      }
    }
    const durations = await sample(40, 10),
      a = await off.readBodies(),
      b = await on.readBodies();
    let maxPositionDifference = 0,
      maxAngleDifference = 0;
    for (let i = 0; i < off.bodyCount; i++) {
      for (let k = 0; k < 2; k++)
        maxPositionDifference = Math.max(
          maxPositionDifference,
          Math.abs(a[i * 24 + k] - b[i * 24 + k]),
        );
      maxAngleDifference = Math.max(
        maxAngleDifference,
        Math.abs(a[i * 24 + 2] - b[i * 24 + 2]),
      );
    }
    const stats = await on.readSleepStats();
    if (stats.sleeping < 9000)
      throw Error(
        `2D resting benchmark has only ${stats.sleeping} sleeping boxes`,
      );
    return {
      dimension: 2,
      bodies: 10001,
      iterations: 10,
      timeStep: 1 / 120,
      settledSteps: 360,
      awakeOverhead: {
        withoutSleeping: summarize(moving.off),
        withSleeping: summarize(moving.on),
        sleeping: initialSleeping,
      },
      awakePolicy: summarize(durations.off),
      sleepPolicy: summarize(durations.on),
      ...stats,
      maxPositionDifference,
      maxAngleDifference,
      finite: a.every(Number.isFinite) && b.every(Number.isFinite),
      measurement:
        "Full GPU interval, including sleep, wake, support checks and queue gaps; drawing excluded. Alternating order; 10 warmups and 30 samples. Ten layers of 1,000 boxes; no paper comparison.",
    };
  } finally {
    off.destroy();
    on.destroy();
    query.destroy();
    resolve.destroy();
    read.destroy();
  }
}
