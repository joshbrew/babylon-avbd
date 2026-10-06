const BODY_ACTIVE: u32 = 1u;
const INVALID_BODY: u32 = 0xffffffffu;

struct Body {
  pos: vec4<f32>,
  vel: vec4<f32>,
  accelMass: vec4<f32>,
  shapeParam: vec4<f32>,
  aux: vec4<u32>,
}

struct Params {
  bodyCount: u32,
  maxNeighbors: u32,
  padding: f32,
  _pad: u32,
}

struct Stats {
  directedPairs: atomic<u32>,
  overflow: atomic<u32>,
}

@group(0) @binding(0) var<storage, read> bodies: array<Body>;
@group(0) @binding(1) var<storage, read_write> neighbors: array<u32>;
@group(0) @binding(2) var<uniform> params: Params;
@group(0) @binding(3) var<storage, read_write> stats: Stats;

fn isActive(id: u32) -> bool {
  return (bodies[id].aux.y & BODY_ACTIVE) != 0u;
}

fn halfExtent(id: u32) -> vec3<f32> {
  let shape = bodies[id].aux.x;
  let p = bodies[id].shapeParam;
  if (shape == 0u) {
    return vec3<f32>(p.x);
  }
  if (shape == 3u) {
    var extent = vec3<f32>(p.x);
    extent[u32(clamp(round(p.z), 0.0, 2.0))] += p.y;
    return extent;
  }
  if (shape == 4u) {
    var extent = vec3<f32>(p.x);
    extent[u32(clamp(round(p.z), 0.0, 2.0))] = p.y;
    return extent;
  }
  return max(p.xyz, vec3<f32>(1.0e-5));
}

fn overlaps(a: u32, b: u32) -> bool {
  let delta = abs(bodies[a].pos.xyz - bodies[b].pos.xyz);
  let extent = halfExtent(a) + halfExtent(b) + vec3<f32>(params.padding);
  return all(delta <= extent);
}

@compute @workgroup_size(64)
fn buildNeighbors(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= params.bodyCount) {
    return;
  }

  let base = id * params.maxNeighbors;
  for (var slot = 0u; slot < params.maxNeighbors; slot += 1u) {
    neighbors[base + slot] = INVALID_BODY;
  }
  if (!isActive(id)) {
    return;
  }

  var count = 0u;
  for (var other = 0u; other < params.bodyCount; other += 1u) {
    if (other == id || !isActive(other) || !overlaps(id, other)) {
      continue;
    }
    if (count < params.maxNeighbors) {
      neighbors[base + count] = other;
      count += 1u;
      atomicAdd(&stats.directedPairs, 1u);
    } else {
      atomicAdd(&stats.overflow, 1u);
    }
  }
}
