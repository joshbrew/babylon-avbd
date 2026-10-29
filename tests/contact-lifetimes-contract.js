const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
export async function contactLifetimesContract(g, player, bullet) {
  g.watchContacts({ indices: [player, bullet], maxPairs: 64, maxEvents: 64 });
  const matches = (event) =>
    event.type === "begin" &&
    ((event.a === player && event.b === bullet) ||
      (event.b === player && event.a === bullet));
  g.step();
  assert(
    (await g.readContactEvents()).events.some(matches),
    "Initial overlap did not begin",
  );
  g.step();
  assert(
    !(await g.readContactEvents()).events.some(matches),
    "Unchanged overlap began twice",
  );
  g.resetContactHistory(new Uint32Array([bullet]));
  g.step();
  assert(
    (await g.readContactEvents()).events.filter(matches).length === 1,
    "Reused overlapping slot did not begin a fresh lifetime",
  );
  g.step();
  assert(
    !(await g.readContactEvents()).events.some(matches),
    "Lifetime reset repeated on the next step",
  );
  let rejected = false;
  try {
    g.resetContactHistory(new Uint32Array([bullet, bullet]));
  } catch {
    rejected = true;
  }
  assert(rejected, "Duplicate reset slots were accepted");
  g.step();
  assert(
    !(await g.readContactEvents()).events.some(matches),
    "Invalid reset partially changed contact history",
  );
  assert(
    g.contactReadbackAllocations <= 1,
    "Contact drains allocated a new GPU buffer each time",
  );
  return {
    reusedOverlapBegins: true,
    continuousOverlapStable: true,
    invalidResetAtomic: true,
    contactReadbackAllocations: g.contactReadbackAllocations,
  };
}
