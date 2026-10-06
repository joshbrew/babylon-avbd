// Extra geometry is optional. Box-only worlds keep the original body layout and kernels.
const shapes = new WeakMap();
const positive = (x, name, zero = false) => {
  if (!Number.isFinite(x) || (zero ? x < 0 : x <= 0))
    throw Error(
      `${name} must be ${zero ? "nonnegative" : "positive"} and finite`,
    );
  return x;
};
const pair = (p, name) => {
  if (!p || p.length !== 2 || !Array.from(p).every(Number.isFinite))
    throw Error(`${name} requires two finite components`);
  return Array.from(p);
};
export const shapesOf2D = (topology) => shapes.get(topology);
/** Point clouds become CCW convex polygons, centered on their area centroid. */
export function hull2D(points) {
  const input = Array.from(points ?? []);
  const flat =
    typeof input[0] === "number"
      ? input
      : input.flatMap((p) => pair(p, "Hull point"));
  if (flat.length < 6 || flat.length % 2 || !flat.every(Number.isFinite))
    throw Error("A 2D hull requires finite xy pairs spanning an area");
  const sorted = [];
  for (let i = 0; i < flat.length; i += 2) sorted.push([flat[i], flat[i + 1]]);
  sorted.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const unique = sorted.filter(
    (p, i) => !i || p[0] !== sorted[i - 1][0] || p[1] !== sorted[i - 1][1],
  );
  const cross = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const chain = (list) => {
    const out = [];
    for (const p of list) {
      while (out.length > 1 && cross(out.at(-2), out.at(-1), p) <= 0) out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  const vertices = [...chain(unique), ...chain([...unique].reverse())];
  if (vertices.length < 3 || vertices.length > 32)
    throw Error("A 2D hull needs 3–32 boundary vertices spanning an area");
  // Translate first to avoid cancellation for point clouds far from the origin.
  const origin = vertices[0];
  const local = vertices.map((p) => [p[0] - origin[0], p[1] - origin[1]]);
  let twiceArea = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < local.length; i++) {
    const a = local[i],
      b = local[(i + 1) % local.length],
      c = a[0] * b[1] - b[0] * a[1];
    twiceArea += c;
    cx += (a[0] + b[0]) * c;
    cy += (a[1] + b[1]) * c;
  }
  if (!(twiceArea > 0) || !Number.isFinite(twiceArea))
    throw Error("Hull area must be positive and finite");
  cx /= 3 * twiceArea;
  cy /= 3 * twiceArea;
  const centered = local.map((p) => [p[0] - cx, p[1] - cy]);
  let moment = 0,
    radius = 0,
    x = 0,
    y = 0;
  const packed = [];
  for (let i = 0; i < centered.length; i++) {
    const a = centered[i],
      b = centered[(i + 1) % centered.length],
      c = a[0] * b[1] - b[0] * a[1];
    moment +=
      (c *
        (a[0] * a[0] +
          a[0] * b[0] +
          b[0] * b[0] +
          a[1] * a[1] +
          a[1] * b[1] +
          b[1] * b[1])) /
      12;
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy);
    packed.push(a[0], a[1], dy / len, -dx / len);
    radius = Math.max(radius, Math.hypot(...a));
    x = Math.max(x, Math.abs(a[0]));
    y = Math.max(y, Math.abs(a[1]));
  }
  const area = twiceArea / 2,
    momentPerMass = moment / area;
  if (
    ![area, momentPerMass, radius, x, y, ...packed].every((v) =>
      Number.isFinite(Math.fround(v)),
    ) ||
    Math.fround(area) <= 0 ||
    Math.fround(momentPerMass) <= 0
  )
    throw Error("Hull geometry exceeds GPU floating-point range");
  const geometry = [4, radius, 0, centered.length];
  geometry.vertices = packed;
  return { geometry, size: [2 * x, 2 * y], area, momentPerMass, radius };
}
export function circle2D(radius) {
  const r = positive(radius, "radius");
  return {
    geometry: [1, r, 0, 0],
    size: [2 * r, 2 * r],
    area: Math.PI * r * r,
    momentPerMass: (r * r) / 2,
    radius: r,
  };
}
/** Capsules run along local X; length is the full end-to-end length. */
export function capsule2D(radius, length) {
  const r = positive(radius, "radius");
  positive(length, "length");
  if (length < 2 * r)
    throw Error("Capsule length must be at least twice its radius");
  return roundedSegment2D((length - 2 * r) / 2, r);
}
function roundedSegment2D(half, r) {
  const length = 2 * half,
    rectangle = 2 * r * length,
    disks = Math.PI * r * r;
  const area = rectangle + disks;
  // Exact area moment: rectangle plus two semicircles, including their centroid offset.
  const moment =
    (rectangle * (length * length + 4 * r * r)) / 12 +
    disks *
      ((length * length) / 4 + (r * r) / 2 + (4 * length * r) / (3 * Math.PI));
  return {
    geometry: [2, r, half, 0],
    size: [length + 2 * r, Math.max(2 * r, 1e-6)],
    area,
    momentPerMass: area ? moment / area : 0,
    radius: half + r,
  };
}
export function segment2D(start, end, options = {}) {
  const a = pair(start, "start"),
    b = pair(end, "end"),
    dx = b[0] - a[0],
    dy = b[1] - a[1];
  const length = Math.hypot(dx, dy),
    radius = positive(options.radius ?? 0, "radius", true);
  positive(length, "segment length");
  if (options.position !== undefined || options.angle !== undefined)
    throw Error("Segment position and angle come from its endpoints");
  if (radius === 0 && (options.density ?? 0) !== 0)
    throw Error(
      "A zero-thickness segment must be static; give it a radius for a dynamic capsule",
    );
  return {
    ...roundedSegment2D(length / 2, radius),
    options: {
      ...options,
      density: options.density ?? 0,
      position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      angle: Math.atan2(dy, dx),
    },
  };
}
/** Normal points into the allowed half-space: dot(normal, position) >= offset. */
export function plane2D(normal, offset = 0, options = {}) {
  const n = pair(normal, "normal"),
    length = positive(Math.hypot(...n), "normal length");
  if (!Number.isFinite(offset)) throw Error("Plane offset must be finite");
  if ((options.density ?? 0) !== 0)
    throw Error("An infinite plane must be static");
  if (options.position !== undefined || options.angle !== undefined)
    throw Error("Plane position and angle come from its normal and offset");
  const x = n[0] / length,
    y = n[1] / length;
  return {
    geometry: [3, 0, 0, 0],
    size: [1, 1],
    area: 0,
    momentPerMass: 0,
    radius: 0,
    options: {
      ...options,
      density: 0,
      position: [x * offset, y * offset],
      angle: Math.atan2(-x, y),
    },
  };
}
export function storeShape2D(topology, index, spec, density) {
  let records = shapes.get(topology);
  if (!records) shapes.set(topology, (records = new Map()));
  records.set(index, spec.geometry);
  const mass = spec.area * density,
    o = index * 4;
  topology.shape[o + 2] = mass;
  topology.shape[o + 3] = mass * spec.momentPerMass;
  topology.props[o + 1] = spec.radius;
  topology.dynamic[index] = Number(mass > 0);
}
