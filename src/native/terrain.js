import {
  hullFromTriangles,
  hull,
} from "../../reference/three-avbd/src/avbd3d/shapes.ts";

// Closed triangle-prism topology. Terrain already supplies its six corners;
// there is no need to discover a convex hull for every source triangle.
const prismFaces = [
  0, 1, 2, 3, 5, 4, 0, 3, 4, 0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 3, 2, 3, 0,
];
const reversedPrismFaces = prismFaces.slice();
for (let i = 0; i < reversedPrismFaces.length; i += 3)
  [reversedPrismFaces[i + 1], reversedPrismFaces[i + 2]] = [
    reversedPrismFaces[i + 2],
    reversedPrismFaces[i + 1],
  ];

const finite = (values, length, name) => {
  const a = Array.from(values ?? []);
  if (a.length !== length || !a.every(Number.isFinite))
    throw Error(`${name} requires ${length} finite values`);
  return a;
};
const positive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0)
    throw Error(`${name} must be positive and finite`);
  return value;
};
function piece(points) {
  // Cook in a local frame to retain precision for terrain far from the origin.
  const center = [0, 1, 2].map(
    (k) => points.reduce((sum, p) => sum + p[k], 0) / points.length,
  );
  const [a, b, c, back] = points;
  const u = b.map((v, k) => v - a[k]),
    v = c.map((v, k) => v - a[k]);
  const outward =
    (u[1] * v[2] - u[2] * v[1]) * (a[0] - back[0]) +
    (u[2] * v[0] - u[0] * v[2]) * (a[1] - back[1]) +
    (u[0] * v[1] - u[1] * v[0]) * (a[2] - back[2]);
  const shape = hullFromTriangles(
    points.flatMap((p) => p.map((v, k) => v - center[k])),
    outward > 0 ? prismFaces : reversedPrismFaces,
  );
  if (!shape) throw Error("Terrain contains a degenerate collision piece");
  return {
    shape,
    position: shape.center.map((v, k) => v + center[k]),
    rotation: shape.rotation,
  };
}

/** Static solid ground. Heights are row-major; each cell retains both triangles. */
export function cookHeightfield({
  heights,
  columns,
  rows,
  spacing = 1,
  origin = [0, 0, 0],
  upAxis = 1,
  baseHeight,
  holes,
} = {}) {
  for (const [name, value] of Object.entries({ columns, rows }))
    if (!Number.isInteger(value) || value < 2)
      throw Error(`${name} must be an integer >= 2`);
  const values = finite(heights, columns * rows, "heights"),
    offset = finite(origin, 3, "origin");
  if (![0, 1, 2].includes(upAxis)) throw Error("upAxis must be 0, 1 or 2");
  const step =
    typeof spacing === "number"
      ? [spacing, spacing]
      : finite(spacing, 2, "spacing");
  step.forEach((v) => positive(v, "spacing"));
  const base =
    baseHeight ?? values.reduce((a, b) => Math.min(a, b), Infinity) - 2;
  if (!Number.isFinite(base) || values.some((h) => h <= base))
    throw Error("baseHeight must be below every terrain height");
  const cells = (columns - 1) * (rows - 1);
  if (holes && holes.length !== cells)
    throw Error("holes requires one value per terrain cell");
  const axes = [0, 1, 2].filter((k) => k !== upAxis),
    pieces = [];
  const point = (x, z) => {
    const p = [...offset];
    p[axes[0]] += x * step[0];
    p[axes[1]] += z * step[1];
    p[upAxis] += values[z * columns + x];
    return p;
  };
  for (let z = 0; z < rows - 1; z++)
    for (let x = 0; x < columns - 1; x++) {
      if (holes?.[z * (columns - 1) + x]) continue;
      const a = point(x, z),
        b = point(x + 1, z),
        c = point(x, z + 1),
        d = point(x + 1, z + 1);
      for (const top of [
        [a, b, c],
        [b, d, c],
      ])
        pieces.push(
          piece([
            ...top,
            ...top.map((p) => {
              const q = [...p];
              q[upAxis] = offset[upAxis] + base;
              return q;
            }),
          ]),
        );
    }
  return { kind: "heightfield", pieces, triangleCount: pieces.length };
}

/** Triangle surfaces retain concavities, holes and overhangs. Backing follows winding. */
export function cookStaticMesh({ positions, indices, thickness = 0.1 } = {}) {
  if (!positions || positions.length % 3)
    throw Error("positions requires xyz triples");
  const p = finite(positions, positions.length, "positions"),
    count = p.length / 3;
  if (indices === undefined && count % 3)
    throw Error("Nonindexed positions require three vertices per triangle");
  const ids =
    indices === undefined
      ? Array.from({ length: count }, (_, i) => i)
      : Array.from(indices);
  if (
    !ids.length ||
    ids.length % 3 ||
    !ids.every((i) => Number.isInteger(i) && i >= 0 && i < count)
  )
    throw Error("indices requires valid triangle vertex indices");
  positive(thickness, "thickness");
  const pieces = [];
  for (let i = 0; i < ids.length; i += 3) {
    const top = ids.slice(i, i + 3).map((id) => p.slice(id * 3, id * 3 + 3)),
      [a, b, c] = top;
    const u = b.map((v, k) => v - a[k]),
      v = c.map((v, k) => v - a[k]);
    const n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ],
      length = Math.hypot(...n);
    if (length === 0) continue; // Imported meshes commonly include empty seam faces.
    pieces.push(
      piece([
        ...top,
        ...top.map((p) =>
          p.map((value, k) => value - (n[k] * thickness) / length),
        ),
      ]),
    );
  }
  if (!pieces.length)
    throw Error("Static mesh requires at least one nondegenerate triangle");
  return { kind: "static-mesh", pieces, triangleCount: pieces.length };
}

/** Shared registration for native and Babylon worlds; no renderer dependency. */
export function createTerrainBodies(ref, cooked, options = {}) {
  if (options.mass !== undefined && options.mass !== 0)
    throw Error("Terrain is static and requires zero mass");
  const friction = options.friction ?? 0.6,
    restitution = options.restitution ?? 0;
  if (!Number.isFinite(friction) || friction < 0)
    throw Error("friction must be nonnegative and finite");
  if (!Number.isFinite(restitution) || restitution < 0 || restitution > 1)
    throw Error("restitution must be between 0 and 1");
  for (const name of ["group", "collidesWith"]) {
    const value = options[name] ?? 0xffffffff;
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff)
      throw Error(`${name} must be an unsigned 32-bit integer`);
  }
  if (!cooked?.pieces?.length) throw Error("Terrain requires collision pieces");
  return cooked.pieces.map((p) => {
    const b = hull(ref, p.shape, 0, friction, p.position, p.rotation);
    Object.assign(b, {
      allowSleep: false,
      isTrigger: false,
      restitution,
      group: options.group ?? 0xffffffff,
      collidesWith: options.collidesWith ?? 0xffffffff,
    });
    return b;
  });
}
