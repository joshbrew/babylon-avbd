import { AvbdScene3D, createSolverPipeline } from "avbd-babylon/native";

const RECEIVER = 1,
  PAYLOAD = 2;
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
const beforeBirth = (eventStep, birthStep) =>
  (eventStep - birthStep) >>> 0 >= 0x80000000;

/** Renderer-independent example. Explicitly choose "webgpu" or "cpu".
 * A caller-owned device may be passed when sharing with a renderer.
 * No full body-pose downloads or per-frame collider creation are required.
 */
export async function runNativeUpdatesExample({
  backend = "webgpu",
  device,
  log = () => {},
} = {}) {
  const pipeline = await createSolverPipeline({
    backend,
    ...(device ? { device } : {}),
  });
  try {
    const scene = new AvbdScene3D({
      gravity: 0,
      timeStep: 1 / 60,
      iterations: 4,
    });
    const receiver = scene.addSphere(0.8, {
      mass: 0,
      group: RECEIVER,
      collidesWith: PAYLOAD,
    });
    const marker = scene.addSphere(0.3, {
      position: [-2, 0, 0],
      mass: 0,
      group: RECEIVER,
      collidesWith: 0,
    });
    // A stationary trigger still needs dynamic participation: static/static
    // pairs intentionally do not simulate contacts.
    const payload = scene.addSphere(0.2, {
      position: [3, 0, 0],
      mass: 1,
      isTrigger: true,
      group: PAYLOAD,
      collidesWith: RECEIVER,
    });
    const companion = scene.addSphere(0.2, {
      position: [4, 0, 0],
      mass: 1,
      isTrigger: true,
      group: PAYLOAD,
      collidesWith: RECEIVER,
    });
    const solver = pipeline.createSolver(scene);
    const receiverSlot = solver.bodyIndex(receiver),
      payloadSlot = solver.bodyIndex(payload);
    const markerSlot = solver.bodyIndex(marker);
    solver.watchContacts({
      indices: [receiverSlot],
      maxPairs: 64,
      maxEvents: 64,
    });
    const readContacts = async () => {
      const result = await solver.readContactEvents();
      assert(
        !result.full && !result.dropped,
        "Contact event capacity exceeded; do not route an incomplete batch",
      );
      return result;
    };

    // 1. PACKED POSES. GPU ordering can differ from construction order. Resolve
    // handles first, then sort slots with their associated pose records.
    const records = [
      { slot: payloadSlot, x: 0 },
      { slot: solver.bodyIndex(companion), x: 4 },
    ].sort((a, b) => a.slot - b.slot);
    const slots = Uint32Array.from(records, (record) => record.slot);
    const positions = new Float32Array(records.length * 3);
    const rotations = new Float32Array(records.length * 4);
    for (let i = 0; i < records.length; i++) {
      positions[i * 3] = records[i].x;
      rotations[i * 4 + 3] = 2; // Normalized by setPoses; XYZW convention.
    }
    solver.setPoses(slots, positions, rotations);
    // Reuse these arrays on later updates. Omitting rotations preserves the
    // current orientations; velocity, masks and trigger flags are untouched.
    solver.setPoses(slots, positions);
    let step = 0;
    const advance = () => {
      solver.step();
      step++;
    };
    const isPayloadBegin = (event) =>
      event.type === "begin" &&
      ((event.a === receiverSlot && event.b === payloadSlot) ||
        (event.b === receiverSlot && event.a === payloadSlot));
    advance();
    const initial = await readContacts();
    assert(
      initial.events.filter(isPayloadBegin).length === 1,
      "Initial payload contact missing",
    );
    log("Packed poses: two bodies updated; one payload contact began.");
    advance();
    assert(
      !(await readContacts()).events.some(isPayloadBegin),
      "Continuous overlap began twice",
    );

    // 2. POOLED LIFETIMES. Simulate an old payload leaving and returning, but
    // deliberately leave its events unread before recycling its slot.
    const recycledSlots = new Uint32Array([payloadSlot]);
    const recycledPosition = new Float32Array([3, 0, 0]);
    solver.setPoses(recycledSlots, recycledPosition);
    advance();
    recycledPosition[0] = 0;
    solver.setPoses(recycledSlots, recycledPosition);
    advance();
    solver.resetContactHistory(recycledSlots);
    const bornStep = (step + 1) >>> 0;
    // A history reset does NOT erase already queued events. Route those only
    // if they belong to the new object's lifetime. Real pools also track lease
    // identity/generation and the other body's birth step.
    const delayed = await readContacts();
    const rejectedOldEvents = delayed.events.filter((event) =>
      beforeBirth(event.step, bornStep),
    ).length;
    assert(
      rejectedOldEvents > 0,
      "Example did not exercise a delayed old event",
    );
    advance();
    const fresh = await readContacts();
    assert(
      fresh.events.filter(
        (event) => !beforeBirth(event.step, bornStep) && isPayloadBegin(event),
      ).length === 1,
      "Recycled overlapping payload did not begin a fresh contact",
    );
    log(
      `Pooled lifetime: rejected ${rejectedOldEvents} old events; the new overlapping payload began once.`,
    );

    // 3. TWO-WAY QUERY MASKS. A one-way scene probe may see the non-colliding
    // marker. An actual payload query also checks each target's acceptance mask.
    const origin = [-4, 0, 0],
      direction = [1, 0, 0];
    const probe = await solver.raycast(origin, direction, {
      collidesWith: RECEIVER,
      maxDistance: 8,
    });
    const sweep = await solver.sphereCast(origin, 0.1, direction, {
      membership: PAYLOAD,
      collidesWith: RECEIVER,
      maxDistance: 8,
    });
    assert(
      probe?.index === markerSlot && sweep?.index === receiverSlot,
      "Query filtering did not distinguish marker and receiver",
    );
    assert(
      (await solver.raycast(origin, direction, {
        membership: 0,
        collidesWith: RECEIVER,
        maxDistance: 8,
      })) === null,
      "Explicit zero membership must miss",
    );
    const casts = [
      { origin, direction, radius: 0.1 },
      { origin: [-4, 4, 0], direction, radius: 0.1 },
    ];
    const options = {
      membership: PAYLOAD,
      collidesWith: RECEIVER,
      maxDistance: 1,
    };
    assert(
      (await solver.sphereCastAll(casts, options)).every((hit) => hit === null),
      "Batch distance limit ignored",
    );
    // A per-input distance overrides the batch default, without changing peers.
    casts[0].maxDistance = 8;
    const hits = await solver.sphereCastAll(casts, options);
    assert(
      hits[0]?.index === receiverSlot && hits[1] === null,
      "Per-cast range override failed",
    );
    log(
      "Query masks: scene probe sees marker; payload sweep sees receiver; batch distance limits work.",
    );

    const result = {
      backend: pipeline.backend,
      packedBodies: records.length,
      rejectedOldEvents,
      freshLifetimeContact: true,
      bilateralQueries: true,
      batchDistanceLimits: true,
      contactReadbackAllocations: solver.contactReadbackAllocations,
    };
    log(
      "These are teleports and explicit queries, not automatic simulation CCD.",
    );
    return result;
  } finally {
    // Explicit reads above have completed. Leave no pending GPU work when
    // disposing owned resources; a borrowed renderer device stays caller-owned.
    try {
      if (pipeline.device) await pipeline.device.queue.onSubmittedWorkDone();
    } finally {
      pipeline.destroy();
    }
  }
}
