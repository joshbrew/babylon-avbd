import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { Joint } from "../reference/three-avbd/src/avbd3d/ref/forces.ts";
import {
  convexHull,
  hull,
  sphere,
} from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { setVisual } from "../reference/three-avbd/src/avbd3d/visuals.ts";
import {
  rotate,
  rotateInv,
  qmul,
  quat,
  vec3,
} from "../reference/three-avbd/src/avbd3d/ref/math.ts";

export const castleScene = {
  id: "3d-castle-siege",
  name: "Mortared castle · cannon siege",
  dimension: 3,
  gpuOnly: true,
  castle: true,
  cannon: true,
  description:
    "Four towers and a central keep, slate cone roofs, battlements and an arched gate. Mortar bonds hold the masonry together until impact tears them. Adjust the cannon's direction, elevation and speed, then shoot. Drag the background to orbit; Reset rebuilds the castle.",
};
export const castleAim = { yaw: -16, elevation: 10, speed: 44 };
const muzzleBase = [0, -32, 1.3];
const radians = (degrees) => (degrees * Math.PI) / 180;
export function castleDirection(aim = castleAim) {
  const yaw = radians(aim.yaw),
    elevation = radians(aim.elevation);
  return [
    Math.sin(yaw) * Math.cos(elevation),
    Math.cos(yaw) * Math.cos(elevation),
    Math.sin(elevation),
  ];
}
function cylinderPoints(radius, length, direction) {
  const side = [direction[1], -direction[0], 0],
    cross = [
      direction[0] * direction[2],
      direction[1] * direction[2],
      -(direction[0] ** 2 + direction[1] ** 2),
    ];
  const a = Math.hypot(...side),
    b = Math.hypot(...cross),
    points = [];
  for (const end of [-1, 1])
    for (let i = 0; i < 12; i++) {
      const t = (i * Math.PI) / 6;
      for (let k = 0; k < 3; k++)
        points.push(
          (direction[k] * end * length) / 2 +
            radius *
              ((side[k] / a) * Math.cos(t) + (cross[k] / b) * Math.sin(t)),
        );
    }
  return points;
}
export function createCastleBarrel(aim = castleAim) {
  const ref = new Solver(),
    direction = castleDirection(aim),
    shape = convexHull(cylinderPoints(0.32, 2.5, direction));
  return setVisual(
    hull(
      ref,
      shape,
      0,
      0.6,
      muzzleBase.map((v, k) => v + shape.center[k]),
      shape.rotation,
    ),
    { color: 0x29323b, metal: true },
  );
}
export function createCastleProjectile(kind = "sphere", aim = castleAim) {
  const ref = new Solver(),
    direction = castleDirection(aim),
    radius = 0.65;
  const position = muzzleBase.map((v, k) => v + direction[k] * 2.8);
  const velocity = direction.map((v) => v * aim.speed);
  let body;
  if (kind === "sphere")
    body = sphere(
      ref,
      radius,
      100 / ((4 / 3) * Math.PI * radius ** 3),
      0.45,
      position,
      velocity,
    );
  else if (kind === "box")
    body = new Rigid(
      ref,
      [1.1, 1.1, 1.1],
      100 / 1.1 ** 3,
      0.45,
      position,
      velocity,
    );
  else if (kind === "cylinder" || kind === "capsule") {
    const points = cylinderPoints(0.55, 1.4, [0, 1, 0]);
    if (kind === "capsule") points.push(0, -1.1, 0, 0, 1.1, 0);
    const shape = convexHull(points);
    body = hull(
      ref,
      shape,
      100 / shape.volume,
      0.45,
      position,
      shape.rotation,
      velocity,
    );
  } else throw Error(`Unknown projectile: ${kind}`);
  return setVisual(body, { color: 0x303840, metal: true });
}

export function buildCastleScene(def = castleScene, solver = new Solver()) {
  solver.dt = 1 / 60;
  solver.iterations = 10;
  solver.gravity = -10;
  const masonry = [],
    parts = [],
    mortar = [],
    roofShapes = new Map();
  const foundation = setVisual(
    new Rigid(solver, [200, 240, 2], 0, 0.7, [0, -8, -1]),
    { color: 0x849078 },
  );
  const paint = (index, trim = false) => {
    const palettes = trim
      ? [0xd9cfb5, 0xcfc4a8, 0xe2d9c5]
      : [0xbab29e, 0xc5bba5, 0xaea794, 0xd0c5ad, 0xbdb6a4];
    return palettes[(index * 37 + (index >>> 3)) % palettes.length];
  };
  function brick(size, position, part, trim = false) {
    const body = setVisual(
      new Rigid(
        solver,
        size.map((v) => v - 0.022),
        12,
        0.7,
        position,
      ),
      { color: paint(masonry.length, trim), mortar: true },
    );
    masonry.push(body);
    parts.push({ body, part });
    return body;
  }
  function weld(a, b, point, strength = 2400, angular = true) {
    const local = (body) =>
      body
        ? rotateInv(
            vec3(),
            body.positionAng,
            point.map((v, k) => v - body.positionLin[k]),
          )
        : point;
    const joint = new Joint(
      solver,
      a,
      b,
      local(a),
      local(b),
      Infinity,
      angular ? Infinity : 0,
      -strength,
    );
    joint.penaltyLin.fill(20_000);
    if (angular) joint.penaltyAng.fill(20_000);
    mortar.push(joint);
  }
  // Three non-collinear anchors preserve the rest orientation of differently
  // oriented convex pieces. They use the native GPU linear-force fracture limit.
  function faceWeld(a, b, point, strength = 1200) {
    for (const offset of [
      [0, 0, 0],
      [0.18, 0, 0.1],
      [0, 0.18, -0.1],
    ])
      weld(
        a,
        b,
        point.map((v, k) => v + offset[k]),
        strength,
        false,
      );
  }
  function tower(cx, cy, n, rows, part) {
    const half = n * 0.6,
      rim = [];
    for (let row = 0; row < rows; row++) {
      const top = row === rows - 1;
      const course = [];
      const put = (x, y, size, k) => {
        if (part === "keep" && y < 0 && Math.abs(x) < 1.8 && row < 7) return;
        course.push(brick(size, [cx + x, cy + y, 0.25 + row * 0.5], part, top));
      };
      for (let k = 0; k < n; k++)
        for (const sign of [-1, 1]) {
          const u = (k - (n - 1) / 2) * 1.2,
            v = sign * (half - 0.3);
          if (row % 2) put(v, u, [0.6, 1.2, 0.5], k);
          else put(u, v, [1.2, 0.6, 0.5], k);
        }
      for (let k = 0; k < n - 1; k++)
        for (const sign of [-1, 1]) {
          const u = (k - (n - 2) / 2) * 1.2,
            v = sign * (half - 0.3);
          if (row % 2) put(u, v, [1.2, 0.6, 0.5], k);
          else put(v, u, [0.6, 1.2, 0.5], k);
        }
      if (row === rows - 1) rim.push(...course);
    }
    return { cx, cy, rim, height: rows * 0.5, radius: half + 1.3, part };
  }
  const towers = [];
  for (const x of [-13.8, 13.8])
    for (const y of [-10.2, 10.2])
      towers.push(
        tower(x, y, 5, y < 0 ? 24 : 26, x < 0 ? "west-tower" : "east-tower"),
      );
  towers.push(tower(0, 2, 7, 29, "keep"));
  // Alternating half-brick offsets form a running bond. End bricks are cut to
  // fit the wall and gate instead of overlapping neighbouring masonry.
  function wallCourse(lo, hi, row, put) {
    const shift = row < 16 && row % 2 ? -0.6 : 0;
    for (let a = lo + shift; a < hi; a += 1.2) {
      const start = Math.max(lo, a),
        end = Math.min(hi, a + 1.2);
      const center = (start + end) / 2;
      if (row >= 16 && Math.floor((center - lo) / 2.4) % 2) continue;
      if (end - start > 0.1) put(center, end - start);
    }
  }
  for (let row = 0; row < 18; row++) {
    for (const y of [-10.2, 10.2]) {
      const intervals =
        y < 0 && row < 11
          ? [
              [-10.8, -2.4],
              [2.4, 10.8],
            ]
          : [[-10.8, 10.8]];
      for (const [lo, hi] of intervals)
        wallCourse(lo, hi, row, (x, width) =>
          brick(
            [width, 0.6, 0.5],
            [x, y, 0.25 + row * 0.5],
            y < 0 ? "front-wall" : "back-wall",
            row >= 16,
          ),
        );
    }
    for (const x of [-13.8, 13.8])
      wallCourse(-7.2, 7.2, row, (y, width) =>
        brick(
          [0.6, width, 0.5],
          [x, y, 0.25 + row * 0.5],
          x < 0 ? "west-wall" : "east-wall",
          row >= 16,
        ),
      );
  }
  const pillars = [];
  for (const x of [-2.1, 2.1])
    for (let row = 0; row < 6; row++)
      pillars.push(
        brick([0.6, 0.6, 0.5], [x, -10.2, 0.25 + row * 0.5], "gate", true),
      );
  // Locate actual neighbouring masonry faces once, with a bounded spatial grid.
  const buckets = new Map(),
    cell = 1.3;
  const key = (p) => p.map((v) => Math.floor(v / cell)).join(",");
  for (let i = 0; i < masonry.length; i++) {
    const a = masonry[i],
      c = [...a.positionLin].map((v) => Math.floor(v / cell));
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          for (const b of buckets.get(
            [c[0] + x, c[1] + y, c[2] + z].join(","),
          ) ?? []) {
            for (let axis = 0; axis < 3; axis++) {
              if (
                Math.abs(
                  Math.abs(a.positionLin[axis] - b.positionLin[axis]) -
                    (a.size[axis] + b.size[axis]) / 2,
                ) > 0.035
              )
                continue;
              const other = [0, 1, 2].filter((k) => k !== axis),
                lo = [],
                hi = [];
              for (const k of other) {
                lo.push(
                  Math.max(
                    a.positionLin[k] - a.size[k] / 2,
                    b.positionLin[k] - b.size[k] / 2,
                  ),
                );
                hi.push(
                  Math.min(
                    a.positionLin[k] + a.size[k] / 2,
                    b.positionLin[k] + b.size[k] / 2,
                  ),
                );
              }
              if (hi.some((v, k) => v - lo[k] < 0.09)) continue;
              const point = [...a.positionLin];
              point[axis] = (a.positionLin[axis] + b.positionLin[axis]) / 2;
              other.forEach((k, j) => (point[k] = (lo[j] + hi[j]) / 2));
              weld(
                a,
                b,
                point,
                Math.max(600, 6000 * (hi[0] - lo[0]) * (hi[1] - lo[1])),
              );
              break;
            }
          }
        }
    const hash = key([...a.positionLin]);
    if (!buckets.has(hash)) buckets.set(hash, []);
    buckets.get(hash).push(a);
    if (a.positionLin[2] < 0.3) weld(null, a, [...a.positionLin], 14000);
  }
  // The arch is made from twelve independently simulated convex keystones.
  const arch = [];
  for (let i = 0; i < 12; i++) {
    const points = [],
      t0 = (i * Math.PI) / 12 + 0.003,
      t1 = ((i + 1) * Math.PI) / 12 - 0.003;
    for (const y of [-0.29, 0.29])
      for (const r of [1.8, 2.4])
        for (const t of [t0, t1])
          points.push(r * Math.cos(t), y, 3 + r * Math.sin(t));
    const shape = convexHull(points),
      body = setVisual(
        hull(
          solver,
          shape,
          12,
          0.7,
          shape.center.map((v, k) => v + (k === 1 ? -10.2 : 0)),
          shape.rotation,
        ),
        { color: paint(i, true) },
      );
    arch.push(body);
    parts.push({ body, part: "gate" });
    if (i)
      faceWeld(arch[i - 1], body, [
        2.1 * Math.cos((i * Math.PI) / 12),
        -10.2,
        3 + 2.1 * Math.sin((i * Math.PI) / 12),
      ]);
  }
  faceWeld(pillars[5], arch.at(-1), [-2.1, -10.2, 3]);
  faceWeld(pillars.at(-1), arch[0], [2.1, -10.2, 3]);
  for (const b of masonry.filter(
    (b) =>
      Math.abs(b.positionLin[0]) < 2.5 &&
      b.positionLin[1] === -10.2 &&
      b.positionLin[2] === 5.75,
  ))
    faceWeld(arch[5 + Number(b.positionLin[0] < 0)], b, [
      b.positionLin[0],
      -10.2,
      5.45,
    ]);
  for (const t of towers) {
    const layers = t.part === "keep" ? 5 : 4,
      height = t.part === "keep" ? 6 : 5,
      segments = 16,
      rings = [];
    for (let row = 0; row < layers; row++) {
      const r0 = t.radius * (1 - row / layers),
        r1 = Math.max(0.12, t.radius * (1 - (row + 1) / layers));
      const z0 = (row * height) / layers,
        z1 = ((row + 1) * height) / layers,
        shapeKey = `${layers}:${row}`;
      if (!roofShapes.has(shapeKey)) {
        const points = [],
          half = Math.PI / segments - 0.002;
        for (const dz of [-0.055, 0.055])
          for (const [r, z] of [
            [r0, z0],
            [r1, z1],
          ])
            for (const a of [-half, half])
              points.push(r * Math.cos(a), r * Math.sin(a), z + dz);
        roofShapes.set(shapeKey, convexHull(points));
      }
      const shape = roofShapes.get(shapeKey),
        ring = [];
      for (let i = 0; i < segments; i++) {
        const angle = (2 * Math.PI * i) / segments,
          q = quat(0, 0, Math.sin(angle / 2), Math.cos(angle / 2));
        const center = rotate(vec3(), q, shape.center),
          rotation = qmul(quat(), q, shape.rotation);
        const body = setVisual(
          hull(
            solver,
            shape,
            5,
            0.6,
            [t.cx + center[0], t.cy + center[1], t.height + 0.15 + center[2]],
            rotation,
          ),
          { color: [0x34546a, 0x3b5d73, 0x426377][(i + row) % 3] },
        );
        ring.push(body);
        parts.push({ body, part: `${t.part}-roof` });
        if (row)
          faceWeld(
            rings[row - 1][i],
            body,
            [
              t.cx + r0 * Math.cos(angle),
              t.cy + r0 * Math.sin(angle),
              t.height + 0.15 + z0,
            ],
            650,
          );
        else {
          const rim = t.rim.reduce((a, b) =>
            Math.hypot(
              a.positionLin[0] - body.positionLin[0],
              a.positionLin[1] - body.positionLin[1],
            ) <
            Math.hypot(
              b.positionLin[0] - body.positionLin[0],
              b.positionLin[1] - body.positionLin[1],
            )
              ? a
              : b,
          );
          faceWeld(
            rim,
            body,
            [rim.positionLin[0], rim.positionLin[1], t.height],
            1000,
          );
        }
      }
      for (let i = 0; i < segments; i++) {
        const angle = (2 * Math.PI * (i + 0.5)) / segments,
          r = (r0 + r1) / 2;
        faceWeld(
          ring[i],
          ring[(i + 1) % segments],
          [
            t.cx + r * Math.cos(angle),
            t.cy + r * Math.sin(angle),
            t.height + 0.15 + (z0 + z1) / 2,
          ],
          650,
        );
      }
      rings.push(ring);
    }
  }
  // A visible cannon is fixed scenery; its barrel follows the aim controls.
  setVisual(new Rigid(solver, [2, 2.5, 0.5], 0, 0.6, [0, -32, 0.5]), {
    color: 0x594633,
  });
  for (const x of [-1, 1])
    for (const y of [-32.7, -31.3])
      setVisual(sphere(solver, 0.45, 0, 0.6, [x, y, 0.45]), {
        color: 0x333332,
      });
  const barrel = createCastleBarrel();
  solver.bodies.push(barrel);
  const barrelIndex = solver.bodies.length - 1;
  const projectile = createCastleProjectile();
  projectile.mass = 0;
  projectile.moment.fill(0);
  projectile.velocityLin.fill(0);
  setVisual(projectile, { shape: "hidden" });
  solver.bodies.push(projectile);
  return {
    def,
    solver,
    gpuOptions: {
      capacity: {
        colors: 32,
        contacts: 100_000,
        pairs: 100_000,
        manifolds: 30_000,
      },
      minimumColors: 16,
      minimumColorRounds: 16,
      colorRounds: 32,
    },
    camera: {
      distance: 72,
      target: [0, -6, 7],
      azimuth: -125,
      elevation: 0.37,
    },
    castle: { masonry, parts, mortar, barrelIndex, foundation },
    workload: {
      masonryBlocks: masonry.length,
      roofPieces: parts.filter((p) => p.part.endsWith("-roof")).length,
      mortarBonds: mortar.length,
      towers: 5,
    },
  };
}
