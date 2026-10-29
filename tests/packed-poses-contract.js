// Public-state checks shared by browser GPU and Node CPU validation.
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
const close = (actual, expected, message) =>
  assert(Math.abs(actual - expected) < 1e-5, message);
export async function packedPoseContract(g, ids) {
  assert(typeof g.setPoses === "function", "Packed pose API is missing");
  const p = new Float32Array(ids.length * 3),
    q = new Float32Array(ids.length * 4);
  for (let i = 0; i < ids.length; i++) {
    p.set([i * 2, -i, 4 + i], i * 3);
    q.set([0, 0, Math.sin(0.4) * 2, Math.cos(0.4) * 2], i * 4);
  }
  g.body(ids[0])
    .setLinearVelocity([1, 2, 3])
    .setAngularVelocity([0.2, 0.4, 0.6]);
  const before = await g.readSelectedBodies(ids);
  assert(g.setPoses(ids, p, q) === g, "Packed poses must chain");
  const after = await g.readSelectedBodies(ids);
  for (let i = 0; i < ids.length; i++) {
    for (let k = 0; k < 3; k++)
      close(after[i * 40 + k], p[i * 3 + k], "Packed position differs");
    close(after[i * 40 + 6], Math.sin(0.4), "Quaternion was not normalized");
    close(
      after[i * 40 + 7],
      Math.cos(0.4),
      "Quaternion scalar was not normalized",
    );
    for (const k of [
      3, 16, 17, 18, 19, 20, 21, 22, 23, 32, 33, 34, 35, 36, 37, 38, 39,
    ])
      close(
        after[i * 40 + k],
        before[i * 40 + k],
        `Teleport changed non-pose field ${k}`,
      );
  }
  const staging = g.bodyCommands?.queue?.words || g.pending?.words;
  g.setPoses(ids, p);
  const unchangedRotation = await g.readSelectedBodies(ids);
  assert(
    staging === (g.bodyCommands?.queue?.words || g.pending?.words),
    "Staging storage was reallocated for the same batch",
  );
  for (let i = 0; i < ids.length; i++)
    for (let k = 4; k < 8; k++)
      close(
        unchangedRotation[i * 40 + k],
        after[i * 40 + k],
        "Position-only batch changed rotation",
      );
  const invalidPosition = p.slice();
  invalidPosition[invalidPosition.length - 1] = NaN;
  const zeroQ = q.slice();
  zeroQ.fill(0, zeroQ.length - 4);
  const duplicate = ids.slice();
  duplicate[duplicate.length - 1] = duplicate[0];
  for (const args of [
    [ids, invalidPosition],
    [ids, p, zeroQ],
    [duplicate, p],
    [ids, p.subarray(1)],
    [ids, Array.from(p)],
  ]) {
    let threw = false;
    try {
      g.setPoses(...args);
    } catch {
      threw = true;
    }
    assert(threw, "Invalid packed poses were accepted");
    const actual = await g.readSelectedBodies(ids);
    assert(
      actual.every((v, i) => v === unchangedRotation[i]),
      "Rejected pose batch partially changed live bodies",
    );
  }
  g.body(ids[0]).setLinearVelocity([4, 5, 6]);
  g.setPoses(ids, p);
  g.body(ids[0]).setLinearVelocity([7, 8, 9]);
  const ordered = await g.body(ids[0]).readState();
  ordered.linearVelocity.forEach((v, i) =>
    close(v, i + 7, "Packed pose broke command order"),
  );
  assert(
    g.setPoses(new Uint32Array(), new Float32Array()) === g,
    "Empty batch failed",
  );
  return {
    normalizedRotation: true,
    positionOnlyPreservesRotation: true,
    nonPoseFieldsPreserved: true,
    reusableStaging: true,
    invalidBatchAtomic: true,
    commandOrder: true,
  };
}
