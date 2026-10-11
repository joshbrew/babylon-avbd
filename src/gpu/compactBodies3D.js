// Contact-point lanes repeatedly read position, rotation and their step-start
// values. Place those four vec4s together at a 64-byte stride during solving.
// The other six vec4s follow each 64-body tile. Warm start and velocity update
// perform the permutation in place; no extra allocation or dispatch is needed.
// Every completed step restores the public 160-byte Body record, including its
// unused components and allocated records beyond bodyCount.
// In the 3D parameter block, stateBOffset carries the allocated body capacity.
const fields = [
  "pos",
  "rot",
  "initialPos",
  "initialRot",
  "size",
  "moment",
  "inertialPos",
  "inertialRot",
  "vel",
  "angVel",
];
const access = /bodies\[([^\]]+)\]\.([A-Za-z]+)/g;

function functions(source) {
  const result = new Map();
  for (const match of source.matchAll(/\bfn (\w+)\(/g)) {
    const start = match.index,
      brace = source.indexOf("{", start);
    let depth = 1,
      end = brace + 1;
    for (; depth && end < source.length; end++) {
      if (source[end] === "{") depth++;
      if (source[end] === "}") depth--;
    }
    if (depth) throw Error("Review compact body function boundaries");
    result.set(match[1], {
      start,
      brace,
      end,
      text: source.slice(start, end),
      body: source.slice(brace + 1, end - 1),
    });
  }
  return result;
}

export function withCompactBodies3D(source) {
  const fns = functions(source);
  const required = (name) => {
    const fn = fns.get(name);
    if (!fn) throw Error(`Review compact body integration: ${name}`);
    return fn;
  };
  const rewriteAccess = (text, compact) =>
    text.replace(access, (all, index, field) => {
      const slot = fields.indexOf(field);
      if (slot < 0) throw Error(`Review compact body field: ${field}`);
      return compact
        ? `bodies[compactBodySlot(u32(${index}), ${slot}u)]`
        : `bodies[u32(${index}) * 10u + ${slot}u]`;
    });

  // Joint warm start precedes the permutation. Give its body-reading helper
  // chain and wind acceleration their own ordinary-layout versions. All other
  // helpers address the compact layout, so pipelines need no special constants.
  const calls = (text) =>
    [...text.matchAll(/\b(\w+)\s*\(/g)]
      .map((m) => m[1])
      .filter((name) => fns.has(name));
  const readers = new Set(
    [...fns]
      .filter(([, fn]) => fn.body.includes("bodies["))
      .map(([name]) => name),
  );
  let changed;
  do {
    changed = false;
    for (const [name, fn] of fns) {
      if (
        !readers.has(name) &&
        calls(fn.body).some((callee) => readers.has(callee))
      ) {
        readers.add(name);
        changed = true;
      }
    }
  } while (changed);
  const warmHelpers = new Set();
  const visit = (name) => {
    for (const callee of calls(required(name).body)) {
      if (!readers.has(callee) || warmHelpers.has(callee)) continue;
      warmHelpers.add(callee);
      visit(callee);
    }
  };
  visit("warmStartJoints");
  visit("warmStartBodies");
  const warmCalls = (text) =>
    text.replace(/\b(\w+)(?=\s*\()/g, (name) =>
      warmHelpers.has(name) ? `${name}BodyRecords` : name,
    );
  const helpers = [...warmHelpers]
    .map((name) => warmCalls(rewriteAccess(required(name).text, false)))
    .join("\n\n");

  const entry = (name, compactRead) => {
    let body = required(name).body;
    for (const guard of [
      "  if (!solverStepValid()) { return; }",
      "  let i = gid.x;",
      "  if (i >= params.bodyCount) { return; }",
    ]) {
      if (body.split(guard).length !== 2)
        throw Error(`Review compact body entry: ${name}`);
      body = body.replace(guard, "");
    }
    body = body.replace(/bodies\[i\]\.([A-Za-z]+)/g, "value.$1");
    if (!compactRead) body = warmCalls(body);
    const slot = (field, compact) =>
      compact ? `compactBodySlot(i, ${field}u)` : `i * 10u + ${field}u`;
    return `fn ${name}(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  let allocated = i < params.stateBOffset;
  var value: Body;
  if (allocated) { value = Body(${fields.map((_, k) => `bodies[${slot(k, compactRead)}]`).join(", ")}); }
  if (i < params.bodyCount && solverStepValid()) { ${body} }
  // All threads finish reading their tile before any thread overwrites it.
  // Inactive and unused records participate, including a partial final tile.
  storageBarrier();
  if (allocated) { ${fields.map((field, k) => `bodies[${slot(k, !compactRead)}] = value.${field};`).join("\n")} }
}`;
  };
  const replacements = [
    [
      required("warmStartJoints"),
      warmCalls(rewriteAccess(required("warmStartJoints").text, false)),
    ],
    [required("warmStartBodies"), entry("warmStartBodies", false)],
    [required("updateVelocities"), entry("updateVelocities", true)],
  ].sort(([a], [b]) => b.start - a.start);
  for (const [fn, replacement] of replacements)
    source = source.slice(0, fn.start) + replacement + source.slice(fn.end);
  const declaration = "var<storage, read_write> bodies: array<Body>;";
  if (source.split(declaration).length !== 2)
    throw Error("Review compact body storage binding");
  source = source.replace(
    declaration,
    "var<storage, read_write> bodies: array<vec4f>;",
  );
  return (
    rewriteAccess(source, true) +
    `
${helpers}
fn compactBodySlot(i: u32, field: u32) -> u32 {
  let tile = i / 64u * 64u;
  let width = min(64u, params.stateBOffset - tile);
  if (field < 4u) { return tile * 10u + (i % 64u) * 4u + field; }
  return tile * 10u + width * 4u + (i % 64u) * 6u + field - 4u;
}
`
  );
}
