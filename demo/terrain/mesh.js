export function landscapeHeight(x, y) {
  const hill = (cx, cy, height, width) =>
    height * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / width ** 2);
  return (
    0.003 * (x * x + y * y) +
    hill(-9, 7, 3.8, 5) +
    hill(7, 9, 3, 4.5) +
    hill(10, -8, 2.5, 4) +
    0.16 * Math.sin(x * 0.55 + Math.sin(y * 0.3)) +
    0.1 * Math.cos(y * 0.7 - x * 0.18)
  );
}
/** Generate render triangles and row-major heights from one surface function. */
export function landscapeMesh() {
  const columns = 29,
    rows = 29,
    spacing = 1.1,
    positions = [],
    indices = [],
    heights = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const px = (x - 14) * spacing,
        py = (y - 14) * spacing,
        h = landscapeHeight(px, py);
      heights.push(h);
      positions.push(px, py, h);
    }
  for (let y = 0; y < rows - 1; y++)
    for (let x = 0; x < columns - 1; x++) {
      const a = y * columns + x,
        b = a + columns;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  return { columns, rows, spacing, heights, positions, indices };
}
/** A curved rock shell, with a connected open mouth and an empty interior. */
export function caveMesh() {
  const positions = [],
    indices = [],
    segments = 16,
    rings = 11,
    width = segments + 1;
  for (let layer = 0; layer < 2; layer++)
    for (let row = 0; row < rings; row++)
      for (let j = 0; j <= segments; j++) {
        const t = (j * Math.PI) / segments,
          y = -4.8 + row * 0.92;
        const center = 6 + 0.22 * Math.sin(y * 0.6),
          radius = 3.1 + 0.25 * Math.sin(y * 0.7) + layer * 0.65;
        const x = center + radius * Math.cos(t);
        const floor = landscapeHeight(x, y) - 0.2;
        const z =
          floor +
          (2.85 + 0.2 * Math.cos(y * 0.6) + layer * 0.65) * Math.sin(t) +
          0.1 * Math.sin(j * 1.7 + row * 0.8) * Math.sin(t);
        positions.push(x, y, z);
      }
  const count = rings * width;
  for (let layer = 0; layer < 2; layer++)
    for (let row = 0; row < rings - 1; row++)
      for (let j = 0; j < segments; j++) {
        const a = layer * count + row * width + j,
          b = a + width;
        if (layer === 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
        else indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
  for (const row of [0, rings - 1])
    for (let j = 0; j < segments; j++) {
      const a = row * width + j,
        b = a + count;
      if (row === 0) indices.push(a, b, a + 1, a + 1, b, b + 1);
      else indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  // Close the far end, leaving the front mouth open.
  const center = positions.length / 3;
  positions.push(6, 4.4, landscapeHeight(6, 4.4) - 0.3);
  for (let j = 0; j < segments; j++)
    indices.push(center, (rings - 1) * width + j + 1, (rings - 1) * width + j);
  return { positions, indices };
}

/** Repository demo importer. Production callers can use any mesh loader with addStaticMesh(). */
export function parseTerrainMesh(text, filename) {
  let positions = [],
    indices = [];
  if (filename.toLowerCase().endsWith(".json")) {
    ({ positions, indices } = JSON.parse(text));
    positions = Array.from(positions ?? []);
    indices = indices
      ? Array.from(indices)
      : Array.from({ length: positions.length / 3 }, (_, i) => i);
  } else {
    for (const raw of text.split(/\r?\n/)) {
      const [type, ...parts] = raw.split("#")[0].trim().split(/\s+/);
      if (type === "v") positions.push(...parts.slice(0, 3).map(Number));
      if (type === "f") {
        const ids = parts
          .filter((p) => !p.startsWith("#"))
          .map((p) => {
            const n = Number(p.split("/")[0]);
            return n < 0 ? positions.length / 3 + n : n - 1;
          });
        if (
          ids.length < 3 ||
          ids.some(
            (i) => !Number.isInteger(i) || i < 0 || i >= positions.length / 3,
          )
        )
          throw Error("OBJ contains an invalid face.");
        // Fan triangulation is exact for convex polygons. Require triangulated exports for concave faces.
        let normal;
        for (let i = 0; i < ids.length; i++) {
          const p = ids[i] * 3,
            q = ids[(i + 1) % ids.length] * 3,
            r = ids[(i + 2) % ids.length] * 3;
          const a = [0, 1, 2].map((k) => positions[q + k] - positions[p + k]),
            b = [0, 1, 2].map((k) => positions[r + k] - positions[q + k]);
          const n = [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
          ];
          if (Math.hypot(...n) < 1e-12) continue;
          if (normal && n.reduce((s, v, k) => s + v * normal[k], 0) < -1e-10)
            throw Error("Triangulate concave OBJ faces before exporting.");
          normal ??= n;
        }
        for (let i = 1; i < ids.length - 1; i++)
          indices.push(ids[0], ids[i], ids[i + 1]);
      }
    }
    // OBJ is interpreted as Y-up. Native terrain JSON uses XYZ with Z up.
    for (let i = 0; i < positions.length; i += 3)
      [positions[i + 1], positions[i + 2]] = [
        positions[i + 2],
        positions[i + 1],
      ];
    for (let i = 0; i < indices.length; i += 3)
      [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  }
  if (
    !positions.length ||
    positions.length % 3 ||
    !positions.every(Number.isFinite) ||
    !indices.length ||
    indices.length % 3 ||
    indices.some(
      (i) => !Number.isInteger(i) || i < 0 || i >= positions.length / 3,
    )
  )
    throw Error(
      "The terrain needs finite XYZ positions and valid triangle indices.",
    );
  if (indices.length > 30000 || positions.length > 90000)
    throw Error(
      "This interactive import supports up to 10,000 triangles and 30,000 vertices. Use a smaller collision mesh for this preview.",
    );
  const lo = [Infinity, Infinity, Infinity],
    hi = [-Infinity, -Infinity, -Infinity];
  positions.forEach((v, i) => {
    lo[i % 3] = Math.min(lo[i % 3], v);
    hi[i % 3] = Math.max(hi[i % 3], v);
  });
  const extent = Math.max(...hi.map((v, k) => v - lo[k]));
  if (extent < 1e-8) throw Error("The mesh has no usable size.");
  const scale = 28 / extent;
  positions = positions.map(
    (v, i) => (v - (i % 3 === 2 ? lo[2] : (lo[i % 3] + hi[i % 3]) / 2)) * scale,
  );
  return {
    positions,
    indices,
    name: filename,
    height: (hi[2] - lo[2]) * scale,
  };
}

const storageKey = "avbd-imported-terrain";
export const readImportedTerrain = () => {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
  } catch {
    return null;
  }
};
export const storeImportedTerrain = (mesh) =>
  sessionStorage.setItem(storageKey, JSON.stringify(mesh));
