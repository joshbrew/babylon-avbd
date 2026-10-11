import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";

const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `export {cookStaticMesh,cookHeightfield} from './src/native/terrain.js';
      export {convexHull} from './reference/three-avbd/src/avbd3d/hull.ts';`,
  },
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const { cookStaticMesh, cookHeightfield, convexHull } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString("base64")}`
);
const rotate = ([x, y, z, w], [a, b, c]) => {
  const u = 2 * (y * c - z * b),
    v = 2 * (z * a - x * c),
    t = 2 * (x * b - y * a);
  return [
    a + w * u + y * t - z * v,
    b + w * v + z * u - x * t,
    c + w * t + x * v - y * u,
  ];
};
function check(piece, points) {
  const center = [0, 1, 2].map((k) => points.reduce((s, p) => s + p[k], 0) / 6);
  const original = convexHull(
    points.flatMap((p) => p.map((v, k) => v - center[k])),
  );
  assert.ok(original);
  const shape = piece.shape;
  assert.equal(shape.vertices.length, 18);
  assert.equal(shape.faces.length, 5);
  assert.equal(shape.edges.length, 9);
  assert.ok(Math.abs(shape.volume - original.volume) < original.volume * 1e-6);
  const vertices = (h) =>
    Array.from({ length: 6 }, (_, i) =>
      rotate(h.rotation, Array.from(h.vertices.slice(i * 3, i * 3 + 3))).map(
        (v, k) => v + h.center[k],
      ),
    );
  const a = vertices(shape),
    b = vertices(original),
    scale = Math.max(
      1,
      ...points.flatMap((p) => p.map((v, k) => Math.abs(v - center[k]))),
    );
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        const support = (vs) =>
          Math.max(...vs.map((p) => p[0] * x + p[1] * y + p[2] * z));
        assert.ok(
          Math.abs(support(a) - support(b)) < scale * 2e-6,
          "Prism cooking must preserve the collision boundary",
        );
      }
  for (const face of shape.faces)
    for (let i = 0; i < 6; i++) {
      const p = shape.vertices.subarray(i * 3, i * 3 + 3);
      assert.ok(
        face.normal.reduce((s, v, k) => s + v * p[k], 0) <=
          face.d + scale * 2e-6,
        "All faces must point outward",
      );
    }
}
let checked = 0;
// Tilted, thin, large and translated triangles, including both windings.
for (const scale of [0.01, 1, 100])
  for (const offset of [0, 1e6])
    for (let i = 0; i < 40; i++) {
      const p = [
        [0, 0, 0],
        [1 + 0.01 * i, 0.2 * Math.sin(i), 0.17],
        [0.15, 0.3, 1 + 0.1 * Math.cos(i)],
      ].map((v) => v.map((x) => x * scale + offset));
      if (i % 2) [p[1], p[2]] = [p[2], p[1]];
      const [a, b, c] = p,
        u = b.map((v, k) => v - a[k]),
        v = c.map((v, k) => v - a[k]);
      const n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ];
      const thickness = scale * (i % 2 ? 0.005 : 0.3),
        length = Math.hypot(...n);
      const points = [
        ...p,
        ...p.map((p) => p.map((v, k) => v - (n[k] * thickness) / length)),
      ];
      check(
        cookStaticMesh({ positions: p.flat(), thickness }).pieces[0],
        points,
      );
      checked++;
    }
for (const upAxis of [0, 1, 2]) {
  const heights = [0, 0.3, 0.6, -0.1],
    origin = [100, 200, 300],
    base = -2;
  const cooked = cookHeightfield({
    columns: 2,
    rows: 2,
    heights,
    upAxis,
    origin,
    baseHeight: base,
  });
  const axes = [0, 1, 2].filter((k) => k !== upAxis);
  const top = heights.map((h, i) => {
    const p = [...origin];
    p[axes[0]] += i % 2;
    p[axes[1]] += Math.floor(i / 2);
    p[upAxis] += h;
    return p;
  });
  [
    [0, 1, 2],
    [1, 3, 2],
  ].forEach((ids, i) => {
    const t = ids.map((i) => top[i]);
    check(cooked.pieces[i], [
      ...t,
      ...t.map((p) => {
        const q = [...p];
        q[upAxis] = origin[upAxis] + base;
        return q;
      }),
    ]);
    checked++;
  });
  assert.equal(
    cookHeightfield({ columns: 2, rows: 2, heights, holes: [true] }).pieces
      .length,
    0,
  );
}
assert.equal(
  cookStaticMesh({
    positions: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }).triangleCount,
  1,
);
assert.throws(
  () => cookStaticMesh({ positions: [0, 0, 0, 0, 0, 0, 0, 0, 0] }),
  /nondegenerate/,
);
// Use the same local frames and hull mass-property calculation for both paths.
const points = Array.from({ length: 2000 }, (_, i) => {
  const t = [
    [0, Math.sin(i) * 0.3, 0],
    [1, 0.2, 0],
    [0, 0.4, 1],
  ];
  return [...t, ...t.map((p) => [p[0], -2, p[2]])];
});
const time = (fn) => {
  const t = performance.now();
  fn();
  return performance.now() - t;
};
const positions = points.flatMap((p) => p.slice(0, 3).flat());
// Static-mesh extrusion has constant backing thickness; compare that geometry.
const mesh = { positions, thickness: 0.1 };
const prismPoints = points.map((p) => {
  const [a, b, c] = p,
    u = b.map((x, k) => x - a[k]),
    v = c.map((x, k) => x - a[k]);
  const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ],
    l = Math.hypot(...n);
  return [
    a,
    b,
    c,
    ...[a, b, c].map((p) => p.map((x, k) => x - (n[k] * 0.1) / l)),
  ];
});
const discover = () =>
  prismPoints.map((p) => {
    const c = [0, 1, 2].map((k) => p.reduce((s, p) => s + p[k], 0) / 6);
    return convexHull(p.flatMap((p) => p.map((x, k) => x - c[k])));
  });
discover();
cookStaticMesh(mesh);
const discoveryMs = [],
  cookingMs = [];
for (let i = 0; i < 5; i++) {
  // Alternate order to reduce JIT and clock-order bias.
  if (i % 2) {
    cookingMs.push(time(() => cookStaticMesh(mesh)));
    discoveryMs.push(time(discover));
  } else {
    discoveryMs.push(time(discover));
    cookingMs.push(time(() => cookStaticMesh(mesh)));
  }
}
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const result = {
  passed: true,
  date: new Date().toISOString(),
  checkedPrisms: checked,
  benchmark: {
    triangles: 2000,
    repeats: 5,
    scope: "CPU terrain preparation only; no simulation or rendering",
    hullDiscoveryMs: discoveryMs,
    knownTopologyMs: cookingMs,
    medianHullDiscoveryMs: median(discoveryMs),
    medianKnownTopologyMs: median(cookingMs),
  },
};
await mkdir("test-results", { recursive: true });
await writeFile(
  "test-results/terrain-cooking.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
