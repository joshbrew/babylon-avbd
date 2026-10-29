const assert = (condition, message) => {
  if (!condition) throw Error(message);
};

// Three collinear targets have identical memberships but different acceptance
// masks. A one-way scene probe may see all three; a weapon query must not.
export async function queryMasksContract(
  solver,
  { marker, friendlyOnly, hostileOnly },
  dimension = 3,
) {
  const origin = dimension === 3 ? [-8, 0, 0] : [-8, 0];
  const direction = dimension === 3 ? [1, 0, 0] : [1, 0];
  const cast = (dimension === 3 ? solver.sphereCast : solver.circleCast).bind(
    solver,
  );
  const castAll = (
    dimension === 3 ? solver.sphereCastAll : solver.circleCastAll
  ).bind(solver);
  const base = { maxDistance: 16, collidesWith: 4 };
  const legacy = await solver.raycast(origin, direction, base);
  assert(
    legacy?.index === marker,
    "Omitted membership changed one-way scene-probe behavior",
  );
  const hostile = await cast(origin, 0.1, direction, {
    ...base,
    membership: 8,
  });
  assert(
    hostile?.index === hostileOnly,
    "Hostile sweep hit a target that rejects its group",
  );
  const friendly = await solver.raycast(origin, direction, {
    ...base,
    membership: 2,
  });
  assert(
    friendly?.index === friendlyOnly,
    "Friendly ray hit a target that rejects its group",
  );
  assert(
    (await solver.raycast(origin, direction, { ...base, membership: 0 })) ===
      null,
    "Zero query membership still hit",
  );
  assert(
    (await solver.raycast(origin, direction, {
      ...base,
      collidesWith: 0,
      membership: 8,
    })) === null,
    "Zero target mask still hit",
  );
  const casts = [
    { origin, direction, radius: 0.1, maxDistance: 16 },
    { origin, direction, radius: 0.2, maxDistance: 16 },
  ];
  assert(
    (await castAll(casts, { collidesWith: 4, membership: 8 })).every(
      (hit) => hit?.index === hostileOnly,
    ),
    "Batch lost bilateral filtering",
  );
  const shortOptions = { collidesWith: 4, membership: 8, maxDistance: 1 };
  assert(
    (await castAll([{ origin, direction, radius: 0.1 }], shortOptions))[0] ===
      null,
    "Batch maximum sweep distance was ignored",
  );
  assert(
    (await solver.raycastAll([{ origin, direction }], shortOptions))[0] ===
      null,
    "Batch maximum ray distance was ignored",
  );
  assert(
    (await castAll([casts[0]], shortOptions))[0]?.index === hostileOnly,
    "Per-query distance failed to override the batch default",
  );
  let invalidRejected = false;
  try {
    await solver.raycast(origin, direction, { ...base, membership: -1 });
  } catch {
    invalidRejected = true;
  }
  assert(invalidRejected, "Invalid membership was accepted");
  solver.setFilters(
    new Uint32Array([hostileOnly]),
    new Uint32Array([4]),
    new Uint32Array([0]),
  );
  assert(
    (await solver.raycast(origin, direction, { ...base, membership: 8 })) ===
      null,
    "Query ignored a changed target acceptance mask",
  );
  return {
    legacyOneWayPreserved: true,
    bilateralWeaponMasks: true,
    zeroMaskMisses: true,
    batchedMasks: true,
    batchDistanceLimits: true,
    liveMaskChanges: true,
    invalidMembershipRejected: true,
  };
}
