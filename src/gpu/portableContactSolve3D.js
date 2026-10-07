// Device-qualified compatibility code. The storage ABI, AVBD equations and
// iteration schedule are unchanged. Contact records use complete vec4 fields;
// contact evaluation returns an immutable result rather than mutating members.
function replaceOnce(source, from, to) {
  if (source.split(from).length !== 2)
    throw Error("3D contact layout changed; review the compatibility kernel");
  return source.replace(from, to);
}
function replaceStruct(source, name, replacement) {
  const pattern = new RegExp(`struct ${name} \\{[^}]*\\}`, "g");
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) throw Error(`Expected one 3D ${name} layout`);
  return source.replace(pattern, replacement);
}
function rewriteFunction(source, name, rewrite) {
  const signature = `fn ${name}(`;
  if (source.split(signature).length !== 2)
    throw Error(`Expected one 3D ${name} function`);
  const begin = source.indexOf(signature),
    open = source.indexOf("{", begin);
  let end = open + 1,
    depth = 1;
  for (; end < source.length && depth; end++) {
    if (source[end] === "{") depth++;
    if (source[end] === "}") depth--;
  }
  if (depth) throw Error(`Incomplete 3D ${name} function`);
  return (
    source.slice(0, begin) +
    rewrite(source.slice(begin, end)) +
    source.slice(end)
  );
}

export function portableContactSolve3D(source) {
  source = replaceStruct(
    source,
    "PairBody",
    `struct PairBody {
  ids: vec4u,
  rot: vec4f,
  dLin: vec4f,
  dAng: vec4f,
}`,
  );
  source = replaceOnce(
    source,
    "return PairBody(i, rot, bodies[i].pos.xyz - bodies[i].initialPos.xyz, qsub(rot, bodies[i].initialRot));",
    "return PairBody(vec4u(i, 0u, 0u, 0u), rot, vec4f(bodies[i].pos.xyz - bodies[i].initialPos.xyz, 0.0), vec4f(qsub(rot, bodies[i].initialRot), 0.0));",
  );
  source = source
    .replace(/\b(A|B)\.index\b/g, "$1.ids.x")
    .replace(/\b(A|B)\.(dLin|dAng)\b/g, "$1.$2.xyz");
  source = replaceStruct(
    source,
    "Contact",
    `struct Contact {
  anchorA: vec4u, // xyz: float bits, w: integer feature key
  anchorB: vec4f, // xyz: anchor, w: normal error
  penalty: vec4f, // xyz: penalties, w: first tangent error
  force: vec4f,   // xyz: forces, w: second tangent error
}`,
  );
  // All feature bits remain integers, including subnormal float bit patterns.
  const fields = {
    rA: "bitcast<vec3f>(k.anchorA.xyz)",
    rB: "k.anchorB.xyz",
    key: "k.anchorA.w",
    c0x: "k.anchorB.w",
    c0y: "k.penalty.w",
    c0z: "k.force.w",
    pen: "k.penalty.xyz",
    lam: "k.force.xyz",
  };
  for (const name of ["evalContact", "accumulate", "dualManifold"])
    source = rewriteFunction(source, name, (fn) =>
      fn.replace(
        /\bk\.(rA|rB|key|c0x|c0y|c0z|pen|lam)\b/g,
        (_, field) => fields[field],
      ),
    );
  source = replaceOnce(
    source,
    "contacts[c].lam = e.F;",
    "contacts[c].force = vec4f(e.F, k.force.w);",
  );
  source = replaceOnce(source, "contacts[c].key =", "contacts[c].anchorA.w =");
  source = replaceOnce(
    source,
    "contacts[c].pen = pen;",
    "contacts[c].penalty = vec4f(pen, k.penalty.w);",
  );

  source = rewriteFunction(source, "evalContact", (fn) => {
    fn = replaceOnce(fn, "  var e: ContactEval;\n", "");
    fn = replaceOnce(fn, "  e.rAW =", "  let rAW =");
    fn = replaceOnce(fn, "  e.rBW =", "  let rBW =");
    fn = fn.replaceAll("e.rAW", "rAW").replaceAll("e.rBW", "rBW");
    fn = replaceOnce(fn, "  e.C =", "  let C =");
    const begin = fn.indexOf("  var F ="),
      end = fn.indexOf("  return e;", begin);
    if (begin < 0 || end < 0)
      throw Error("Expected 3D contact force projection");
    return (
      fn.slice(0, begin) +
      `  let raw = k.penalty.xyz * C + k.force.xyz;
  let normalForce = select(0.0, raw.x, raw.x < 0.0);
  let bounds = abs(normalForce) * friction;
  let frictionScale = length(raw.yz);
  var scale = 1.0;
  if (frictionScale > bounds && frictionScale > 0.0) {
    scale = bounds / frictionScale;
  }
  let force = vec3f(normalForce, raw.yz * scale);
  return ContactEval(vec4f(rAW, 0.0), vec4f(rBW, 0.0),
    vec4f(C, 0.0), vec4f(force, 0.0), vec4f(frictionScale, bounds, 0.0, 0.0));
}`
    );
  });
  source = replaceStruct(
    source,
    "ContactEval",
    `struct ContactEval {
  rAW: vec4f,
  rBW: vec4f,
  C: vec4f,
  F: vec4f,
  limits: vec4f, // x: tangent force length, y: Coulomb bound
}`,
  );
  // These result fields occur only at contact call sites, never on joints.
  source = source
    .replace(/\b(ev|e)\.(rAW|rBW|C|F)\b/g, "$1.$2.xyz")
    .replace(/\be\.frictionScale\b/g, "e.limits.x")
    .replace(/\be\.bounds\b/g, "e.limits.y");
  // Same 16 bytes and dynamic offsets; avoid mixed integer/float members.
  source = replaceStruct(
    source,
    "PassConstants",
    `struct PassConstants { data: vec4u, }`,
  );
  return source
    .replaceAll("pc.color", "pc.data.x")
    .replaceAll("pc.alpha", "bitcast<f32>(pc.data.y)");
}
