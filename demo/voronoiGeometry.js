// Bounded planar Voronoi cells, extruded into a solid masonry wall. Each edge
// records its neighboring cell so bonds follow actual shared fracture faces.
export function makeVoronoiWall({
  columns = 18,
  rows = 12,
  width = 16,
  height = 10,
  thickness = 0.9,
  seed = 731,
} = {}) {
  let state = seed >>> 0;
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const sites = [];
  for (let z = 0; z < rows; z++)
    for (let x = 0; x < columns; x++)
      sites.push([
        ((x + 0.5 + (random() - 0.5) * 0.65) * width) / columns - width / 2,
        ((z + 0.5 + (random() - 0.5) * 0.65) * height) / rows + 0.1,
      ]);
  const cells = sites.map((site, i) => {
    let polygon = [
      [-width / 2, 0.1],
      [width / 2, 0.1],
      [width / 2, height + 0.1],
      [-width / 2, height + 0.1],
    ];
    const planes = [];
    for (let j = 0; j < sites.length; j++) {
      if (i === j) continue;
      const other = sites[j],
        n = [other[0] - site[0], other[1] - site[1]];
      const d =
        (other[0] ** 2 + other[1] ** 2 - site[0] ** 2 - site[1] ** 2) / 2;
      planes.push({ j, n, d });
      const clipped = [];
      for (let k = 0; k < polygon.length; k++) {
        const a = polygon[k],
          b = polygon[(k + 1) % polygon.length];
        const da = n[0] * a[0] + n[1] * a[1] - d,
          db = n[0] * b[0] + n[1] * b[1] - d;
        if (da <= 1e-10) clipped.push(a);
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
          const t = da / (da - db);
          clipped.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      polygon = clipped;
    }
    let area = 0;
    const faces = [];
    for (let k = 0; k < polygon.length; k++) {
      const a = polygon[k],
        b = polygon[(k + 1) % polygon.length];
      area += a[0] * b[1] - b[0] * a[1];
      const midpoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const neighbor = planes.find(
        ({ n, d }) =>
          Math.abs(n[0] * midpoint[0] + n[1] * midpoint[1] - d) /
            Math.hypot(...n) <
          1e-7,
      )?.j;
      faces.push({
        neighbor,
        midpoint,
        length: Math.hypot(a[0] - b[0], a[1] - b[1]),
        bottom: Math.abs(a[1] - 0.1) < 1e-7 && Math.abs(b[1] - 0.1) < 1e-7,
      });
    }
    return {
      site,
      polygon,
      faces,
      volume: Math.abs(area) * 0.5 * thickness,
      vertices: [-thickness / 2, thickness / 2].flatMap((y) =>
        polygon.flatMap(([x, z]) => [x, y, z]),
      ),
    };
  });
  return {
    cells,
    width,
    height,
    thickness,
    volume: width * height * thickness,
  };
}
