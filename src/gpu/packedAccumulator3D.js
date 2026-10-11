// The diagonal blocks of a body's Newton matrix are symmetric. Keep their
// diagonal and lower off-diagonal entries; the cross block remains full.
// Constraint order, reduction order, pivots and the LDL solve are unchanged.
export function withPackedAccumulator3D(source) {
  const replace = (from, to) => {
    if (source.split(from).length !== 2)
      throw Error("Review packed Newton accumulator integration");
    source = source.replace(from, to);
  };
  replace(
    "  lin: mat3x3f,\n  ang: mat3x3f,",
    "  lin: mat2x3f,\n  ang: mat2x3f,",
  );
  replace(
    "fn addRow(acc:",
    `fn symmetricOuter(v: vec3f) -> mat2x3f {
  return mat2x3f(v * v, vec3f(v.y * v.x, v.z * v.x, v.z * v.y));
}

fn addRow(acc:`,
  );
  replace("outer(l, l) * k", "symmetricOuter(l) * k");
  replace("outer(a, a) * k", "symmetricOuter(a) * k");
  replace(
    "mat3x3f(vec3f(g.x, 0.0, 0.0), vec3f(0.0, g.y, 0.0), vec3f(0.0, 0.0, g.z))",
    "mat2x3f(g, vec3f(0.0))",
  );
  replace(
    "mat3x3f(vec3f(m, 0.0, 0.0), vec3f(0.0, m, 0.0), vec3f(0.0, 0.0, m))",
    "mat2x3f(vec3f(m), vec3f(0.0))",
  );
  replace(
    "mat3x3f(vec3f(I.x, 0.0, 0.0), vec3f(0.0, I.y, 0.0), vec3f(0.0, 0.0, I.z))",
    "mat2x3f(I, vec3f(0.0))",
  );
  const locations = {
    "0][0": "0][0",
    "0][1": "1][0",
    "0][2": "1][1",
    "1][1": "0][1",
    "1][2": "1][2",
    "2][2": "0][2",
  };
  source = source.replace(
    /acc\.(lin|ang)\[(\d)\]\[(\d)\]/g,
    (all, name, col, row) => {
      const index = locations[`${col}][${row}`];
      if (!index) throw Error("Unexpected Newton accumulator entry");
      return `acc.${name}[${index}]`;
    },
  );
  return source;
}
