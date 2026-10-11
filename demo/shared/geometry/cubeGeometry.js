/** Shared unit-box mesh; independent of any simulation demo. */
export function makeCubeVertices() {
  const vertices = [];
  for (let axis = 0; axis < 3; axis++)
    for (const sign of [-1, 1]) {
      const other = [0, 1, 2].filter((k) => k !== axis),
        normal = [0, 0, 0];
      normal[axis] = sign;
      const corners = [
        [-1, -1],
        [-1, 1],
        [1, 1],
        [1, -1],
      ].map((uv) => {
        const p = [0, 0, 0];
        p[axis] = sign;
        p[other[0]] = uv[0];
        p[other[1]] = uv[1];
        return p;
      });
      const order =
        (axis === 1 ? -sign : sign) > 0
          ? [0, 1, 2, 0, 2, 3]
          : [0, 2, 1, 0, 3, 2];
      for (const i of order) vertices.push(...corners[i], ...normal);
    }
  return new Float32Array(vertices);
}
