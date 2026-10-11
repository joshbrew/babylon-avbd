import { setVisual } from "../../reference/three-avbd/src/avbd3d/visuals.ts";
const surfaces = new WeakMap();
export const terrainSurfaceOf = (body) => surfaces.get(body);

/** Draw the source mesh once. Collision prisms remain independent, hidden bodies. */
export function setTerrainSurface(terrain, positions, indices, color) {
  terrain.bodies.forEach((body) => {
    surfaces.set(body, { hidden: true });
    setVisual(body, { shape: "hidden", color });
  });
  const body = terrain.bodies[0],
    normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = indices.slice(i, i + 3).map((j) => j * 3);
    const u = [0, 1, 2].map((k) => positions[b + k] - positions[a + k]),
      v = [0, 1, 2].map((k) => positions[c + k] - positions[a + k]);
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    for (const j of [a, b, c])
      for (let k = 0; k < 3; k++) normals[j + k] += n[k];
  }
  const q = body.positionAng,
    origin = body.positionLin;
  function local(v) {
    const [x, y, z, w] = [-q[0], -q[1], -q[2], q[3]];
    const t = [
      2 * (y * v[2] - z * v[1]),
      2 * (z * v[0] - x * v[2]),
      2 * (x * v[1] - y * v[0]),
    ];
    return [
      v[0] + w * t[0] + y * t[2] - z * t[1],
      v[1] + w * t[1] + z * t[0] - x * t[2],
      v[2] + w * t[2] + x * t[1] - y * t[0],
    ];
  }
  const vertices = new Float32Array(indices.length * 6);
  indices.forEach((id, i) => {
    const p = [0, 1, 2].map((k) => positions[id * 3 + k] - origin[k]),
      n = Array.from(normals.slice(id * 3, id * 3 + 3));
    const length = Math.hypot(...n) || 1;
    vertices.set([...local(p), ...local(n.map((v) => v / length))], i * 6);
  });
  surfaces.set(body, { vertices });
}
