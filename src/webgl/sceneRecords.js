import { hullOf } from "../../reference/three-avbd/src/avbd3d/shapes.ts";
import { shapesOf2D } from "../gpu/shapes2D.js";

/** Serialize static scene descriptions once. Live poses stay in GPU textures. */
export function sceneRecords(world) {
  const n = world.bodyCount,
    dimension = world.dimension,
    bodies = world.packBodyRecords(),
    joints = world.packJointRecords(),
    info = new Int32Array(world.jointCount * 4),
    filters = new Uint32Array(n * 4);
  let geometry, hulls;
  if (dimension === 2) {
    info.set(world.solver.info.subarray(0, info.length));
    const records = shapesOf2D(world.solver),
      extra = [...(records?.values() ?? [])].reduce(
        (sum, r) => sum + (r.vertices?.length ?? 0),
        0,
      );
    geometry = new Float32Array(n * 4 + extra);
    let offset = n;
    for (const [id, r] of records ?? []) {
      const descriptor = Array.from(r);
      if (r.vertices) {
        descriptor[2] = offset;
        geometry.set(r.vertices, offset * 4);
        offset += r.vertices.length / 4;
      }
      geometry.set(descriptor, id * 4);
    }
    for (let i = 0; i < n; i++)
      filters.set(
        [
          ...(world.solver.filters.get(i) ?? [0xffffffff, 0xffffffff]),
          bodies[i * 24 + 22] > 0 ? 1 : 0,
          Number(world.solver.sensors.has(i)),
        ],
        i * 4,
      );
  } else {
    const ids = new Map(world.solver.bodies.map((b, i) => [b, i])),
      packed = [],
      offsets = new Map();
    let offset = 0;
    world.constraints.forEach((f, i) =>
      info.set(
        [
          f.broken
            ? 0
            : f.cpuAngular
              ? f.cpuAngular.options.type === "motor"
                ? 3
                : 4
              : f.rest !== undefined
                ? 2
                : 1,
          f.bodyA ? ids.get(f.bodyA) : -1,
          ids.get(f.bodyB),
          0,
        ],
        i * 4,
      ),
    );
    world.solver.bodies.forEach((b, i) => {
      filters.set(
        [
          b.group ?? 0xffffffff,
          b.collidesWith ?? 0xffffffff,
          Number(b.mass > 0),
          Number(!!b.isTrigger),
        ],
        i * 4,
      );
      const shape = hullOf(b);
      if (!shape) return;
      let at = offsets.get(shape);
      if (at === undefined) {
        at = offset;
        const data = packHull(shape, at);
        packed.push(data);
        offsets.set(shape, at);
        offset += data.length / 4;
      }
      bodies[i * 40 + 39] = 3 + at;
    });
    if (offset) {
      const data = new Float32Array(offset * 4);
      let k = 0;
      for (const p of packed) {
        data.set(p, k);
        k += p.length;
      }
      hulls = new Uint32Array(data.buffer);
    }
  }
  return {
    bodies,
    joints,
    info,
    filters,
    geometry,
    hulls,
    ignoredPairs:
      dimension === 2 ? Array.from(world.solver.ignoredPairs()) : undefined,
  };
}
// Layout shared with the pinned three-avbd hull narrowphase (MIT).
function packHull(shape, at) {
  const V = shape.vertices.length / 3,
    F = shape.faces.length,
    I = Math.ceil(shape.faces.reduce((n, f) => n + f.verts.length, 0) / 4),
    E = shape.edges.length;
  const data = new Float32Array((2 + V + 2 * F + I + E) * 4),
    u = new Uint32Array(data.buffer),
    vs = at + 2,
    fs = vs + V,
    is = fs + 2 * F,
    es = is + I;
  u.set([vs, V, fs, F, es, E, is, 0]);
  for (let v = 0; v < V; v++)
    data.set(shape.vertices.subarray(v * 3, v * 3 + 3), (2 + v) * 4);
  let index = 0;
  shape.faces.forEach((f, k) => {
    const o = (2 + V + 2 * k) * 4;
    data.set(f.normal, o);
    data[o + 3] = f.d;
    u[o + 4] = index;
    u[o + 5] = f.verts.length;
    for (const v of f.verts) u[(2 + V + 2 * F) * 4 + index++] = v;
  });
  shape.edges.forEach((e, k) => u.set(e, (2 + V + 2 * F + I + k) * 4));
  return data;
}
