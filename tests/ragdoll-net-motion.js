import { buildCanonicalScene } from "../demo/canonicalScenes.js";
import { AppGpuSolver3D } from "../src/gpu/appGpuSolver3D.js";
import { sceneGpuSolverOptions } from "../src/gpu/gpuSolverOptions.js";
import { clothsOf } from "../reference/three-avbd/src/avbd3d/visuals.ts";
import { createWebGPUDevice } from "../src/index.js";
import { segmentTriangleDistance } from "./helpers/capsuleTriangle.js";
export function netCrossings(poses, grid, ragdolls, gpu) {
  const rawPoint = (b) => {
    const o = gpu.gpuIndex(b) * 40;
    return [poses[o], poses[o + 1], poses[o + 2]];
  };
  const sub = (a, b) => a.map((v, k) => v - b[k]);
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const visible = grid.map((row, x) =>
    row.map((b, y) => {
      const p = rawPoint(b);
      const dx = sub(
        rawPoint(grid[x][Math.min(row.length - 1, y + 1)]),
        rawPoint(grid[x][Math.max(0, y - 1)]),
      );
      const dy = sub(
        rawPoint(grid[Math.min(grid.length - 1, x + 1)][y]),
        rawPoint(grid[Math.max(0, x - 1)][y]),
      );
      const normal = cross(dx, dy),
        length = Math.max(Math.hypot(...normal), 0.00001);
      return p.map(
        (v, k) =>
          v +
          (normal[k] / length) * 0.052 +
          (y === 0 ? -dx[k] * 0.5 : y === row.length - 1 ? dx[k] * 0.5 : 0) +
          (x === 0 ? -dy[k] * 0.5 : x === grid.length - 1 ? dy[k] * 0.5 : 0),
      );
    }),
  );
  const buckets = new Map(),
    cell = 1;
  for (let x = 0; x < grid.length - 1; x++)
    for (let y = 0; y < grid[0].length - 1; y++) {
      const a = visible[x][y],
        b = visible[x + 1][y],
        c = visible[x][y + 1],
        d = visible[x + 1][y + 1];
      for (const t of [
        [a, b, c],
        [b, d, c],
      ]) {
        const lo = t.reduce(
            (p, v) => [Math.min(p[0], v[0]), Math.min(p[1], v[1])],
            [Infinity, Infinity],
          ),
          hi = t.reduce(
            (p, v) => [Math.max(p[0], v[0]), Math.max(p[1], v[1])],
            [-Infinity, -Infinity],
          );
        for (
          let i = Math.floor(lo[0] / cell);
          i <= Math.floor(hi[0] / cell);
          i++
        )
          for (
            let j = Math.floor(lo[1] / cell);
            j <= Math.floor(hi[1] / cell);
            j++
          ) {
            const key = `${i},${j}`;
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push(t);
          }
      }
    }
  let below = 0,
    straddling = 0,
    penetrating = 0,
    maxPenetration = 0,
    touchingSheet = 0;
  const worst = [];
  const surface = (x, y) => {
    let hit = null;
    for (const [a, b, c] of buckets.get(
      `${Math.floor(x / cell)},${Math.floor(y / cell)}`,
    ) ?? []) {
      const ab = sub(b, a),
        ac = sub(c, a),
        det = ab[0] * ac[1] - ab[1] * ac[0];
      if (Math.abs(det) < 1e-8) continue;
      const u = ((x - a[0]) * ac[1] - (y - a[1]) * ac[0]) / det;
      const v = (ab[0] * (y - a[1]) - ab[1] * (x - a[0])) / det;
      if (u < 0 || v < 0 || u + v > 1) continue;
      const height = a[2] + u * ab[2] + v * ac[2];
      if (hit && hit.height >= height) continue;
      const n = cross(ab, ac),
        len = Math.hypot(...n),
        sign = n[2] >= 0 ? 1 : -1;
      hit = { height, normal: n.map((v) => (v * sign) / len) };
    }
    return hit;
  };
  for (const group of ragdolls) {
    let above = 0,
      under = 0;
    for (const index of group) {
      const o = gpu.gpuIndex(index) * 40,
        x = poses[o],
        y = poses[o + 1],
        z = poses[o + 2];
      let height = -Infinity;
      for (const [a, b, c] of buckets.get(
        `${Math.floor(x / cell)},${Math.floor(y / cell)}`,
      ) ?? []) {
        const det =
          (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (Math.abs(det) < 1e-8) continue;
        const u =
            ((x - a[0]) * (c[1] - a[1]) - (y - a[1]) * (c[0] - a[0])) / det,
          v = ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) / det;
        if (u >= 0 && v >= 0 && u + v <= 1)
          height = Math.max(
            height,
            a[2] + u * (b[2] - a[2]) + v * (c[2] - a[2]),
          );
      }
      const qx = poses[o + 4],
        qy = poses[o + 5],
        qz = poses[o + 6],
        qw = poses[o + 7];
      // Probe the drawn rounded limb along its axis and on the side nearest the
      // sheet. A centre-only test cannot detect a forearm protruding through it.
      const radius = Math.min(poses[o + 17], poses[o + 18]) * 0.5;
      const halfAxis =
        poses[o + 39] === 1 ? 0 : Math.max(0, poses[o + 16] * 0.5 - radius);
      const axis = [
        1 - 2 * (qy * qy + qz * qz),
        2 * (qx * qy + qw * qz),
        2 * (qx * qz - qw * qy),
      ];
      let depth = 0;
      const p0 = [x, y, z].map((v, k) => v - axis[k] * halfAxis);
      const p1 = [x, y, z].map((v, k) => v + axis[k] * halfAxis);
      const candidates = new Set();
      for (
        let i = Math.floor((Math.min(p0[0], p1[0]) - radius) / cell);
        i <= Math.floor((Math.max(p0[0], p1[0]) + radius) / cell);
        i++
      )
        for (
          let j = Math.floor((Math.min(p0[1], p1[1]) - radius) / cell);
          j <= Math.floor((Math.max(p0[1], p1[1]) + radius) / cell);
          j++
        )
          for (const triangle of buckets.get(`${i},${j}`) ?? [])
            candidates.add(triangle);
      let nearest = Infinity;
      for (const triangle of candidates) {
        if (
          triangle.every(
            (v) => v[2] < Math.min(p0[2], p1[2]) - radius - 0.02,
          ) ||
          triangle.every((v) => v[2] > Math.max(p0[2], p1[2]) + radius + 0.02)
        )
          continue;
        nearest = Math.min(nearest, segmentTriangleDistance(p0, p1, triangle));
      }
      if (nearest < radius + 0.02) touchingSheet++;
      depth = Math.max(depth, radius - nearest);
      for (const t of [-1, -0.5, 0, 0.5, 1]) {
        const p = [x, y, z].map((v, k) => v + axis[k] * halfAxis * t);
        const s = surface(p[0], p[1]);
        if (!s) continue;
        const bottom = p.map((v, k) => v - s.normal[k] * radius);
        const at = surface(bottom[0], bottom[1]);
        if (!at) continue;
        depth = Math.max(depth, (at.height - bottom[2]) * at.normal[2]);
      }
      maxPenetration = Math.max(maxPenetration, depth);
      if (depth > 0.005) {
        penetrating++;
        worst.push({ body: index, depth, position: [x, y, z] });
      }
      const extent =
        0.5 *
        (Math.abs(2 * (qx * qz - qw * qy)) * poses[o + 16] +
          Math.abs(2 * (qy * qz + qw * qx)) * poses[o + 17] +
          Math.abs(1 - 2 * (qx * qx + qy * qy)) * poses[o + 18]);
      if (z + extent < height - 0.02) {
        under++;
        below++;
      }
      if (z - extent > height + 0.02) above++;
    }
    if (under && above) straddling++;
  }
  return {
    bodiesWhollyBelowVisibleSheet: below,
    ragdollsStraddlingSheet: straddling,
    limbsPenetratingVisibleSheet: penetrating,
    maxPenetration,
    touchingSheet,
    worst: worst.sort((a, b) => b.depth - a.depth).slice(0, 8),
  };
}
export async function measureRagdollNet(substeps, seconds = 30) {
  // Confirm the probe detects a partial protrusion that a whole-body test misses.
  // This is geometry validation; the simulation below always runs on WebGPU.
  const fixture = new Float32Array(5 * 40),
    map = { gpuIndex: (i) => i };
  [
    [-0.15, -0.15, 0],
    [-0.15, 0.15, 0],
    [0.15, -0.15, 0],
    [0.15, 0.15, 0],
  ].forEach((p, i) => fixture.set(p, i * 40));
  fixture.set([0.2, 0.1, 0.1], 4 * 40 + 16);
  fixture[4 * 40 + 7] = 1;
  fixture[4 * 40 + 2] = -0.04;
  const partial = netCrossings(
    fixture,
    [
      [0, 1],
      [2, 3],
    ],
    [[4]],
    map,
  );
  if (
    partial.limbsPenetratingVisibleSheet !== 1 ||
    partial.bodiesWhollyBelowVisibleSheet !== 0
  )
    throw Error("Surface probe missed a partial limb intersection");
  fixture[4 * 40 + 2] = 0.1;
  if (
    netCrossings(
      fixture,
      [
        [0, 1],
        [2, 3],
      ],
      [[4]],
      map,
    ).limbsPenetratingVisibleSheet
  )
    throw Error("Surface probe reported a clear limb as intersecting");
  fixture[4 * 40 + 2] = -0.2;
  if (
    netCrossings(
      fixture,
      [
        [0, 1],
        [2, 3],
      ],
      [[4]],
      map,
    ).bodiesWhollyBelowVisibleSheet !== 1
  )
    throw Error("Surface probe missed a submerged limb");
  const { device } = await createWebGPUDevice({
      requiredLimits: { maxStorageBuffersPerShaderStage: 9 },
    }),
    built = buildCanonicalScene("showcase-ragdolls-on-cloth-24k", "gpu"),
    ref = built.solver;
  if (substeps !== undefined) ref.dt = 1 / (60 * substeps);
  substeps = Math.round(1 / (60 * ref.dt));
  const gpu = new AppGpuSolver3D(
      device,
      ref,
      sceneGpuSolverOptions(built.def.id),
    ),
    grid = clothsOf(ref)[0].map((row) => row.map((b) => ref.bodies.indexOf(b))),
    groups = [];
  if (
    built.def.iterations !== 5 ||
    built.gpuParams.iterations !== 5 ||
    gpu.params.iterations !== 5
  )
    throw Error("Ragdoll demo and GPU benchmark must both use five iterations");
  for (const row of clothsOf(ref)[0])
    for (const body of row) {
      if (body.radius < Math.hypot(...body.size) / 2 - 1e-9)
        throw Error("Net broadphase bounds must cover its overlapping plates");
      if (body.mass > 0 && Math.abs(body.mass - 0.27 * 0.27 * 0.1) > 1e-9)
        throw Error("Closing net seams must preserve fabric mass");
    }
  const start = 1 + 96 * 96;
  for (let i = start; i < ref.bodies.length; i += 10)
    groups.push(Array.from({ length: 10 }, (_, k) => i + k));
  const errors = [];
  device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  const snapshots = [];
  try {
    for (let i = 1; i <= seconds * 60 * substeps; i++) {
      gpu.step();
      if (i % 20 === 0) {
        await device.queue.onSubmittedWorkDone();
        const c = await gpu.readCounters();
        if (c.overflow || c.clashes) throw Error(JSON.stringify({ i, c }));
        gpu.adapt(c);
      }
      if (i % (15 * substeps) === 0) {
        const poses = await gpu.readBodies();
        if (!poses.every(Number.isFinite))
          throw Error("Non-finite ragdoll pose");
        snapshots.push({
          seconds: i * ref.dt,
          ...netCrossings(poses, grid, groups, gpu),
        });
      }
    }
    if (errors.length) throw Error(errors.join("\n"));
    return {
      timeStep: ref.dt,
      iterations: ref.iterations,
      substeps,
      broadphase: gpu.broadphase,
      broadphaseDecision: gpu.broadphaseDecision,
      rigidNet: built.rigidNet,
      snapshots,
    };
  } finally {
    gpu.destroy();
    device.destroy();
  }
}
