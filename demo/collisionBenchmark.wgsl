const EPS : f32 = 1.0e-7;

struct Bullet {
  posLife: vec4<f32>,
  velRadius: vec4<f32>,
  seed: vec4<u32>,
}

struct Triangle {
  a: vec4<f32>,
  b: vec4<f32>,
  c: vec4<f32>,
}

struct Counters {
  hits: atomic<u32>,
  alive: atomic<u32>,
  _pad0: atomic<u32>,
  _pad1: atomic<u32>,
}

struct Params {
  dt: f32,
  speed: f32,
  life: f32,
  bulletRadius: f32,

  spawnRadius: f32,
  jitter: f32,
  targetCount: u32,
  triCount: u32,

  frame: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
}

@group(0) @binding(0) var<storage, read_write> bullets : array<Bullet>;
@group(0) @binding(1) var<storage, read> triangles : array<Triangle>;
@group(0) @binding(2) var<storage, read_write> counters : Counters;
@group(0) @binding(3) var<uniform> params : Params;

fn hashU32(xIn: u32) -> u32 {
  var x = xIn;
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

fn rand01(state: ptr<function, u32>) -> f32 {
  let h = hashU32((*state) + 0x9e3779b9u);
  *state = h;
  return f32(h) * 2.3283064365386963e-10;
}

fn randSigned(state: ptr<function, u32>) -> f32 {
  return rand01(state) * 2.0 - 1.0;
}

fn randomUnit(state: ptr<function, u32>) -> vec3<f32> {
  var v = vec3<f32>(1.0, 0.0, 0.0);
  var ok = false;
  for (var i = 0u; i < 12u; i += 1u) {
    let p = vec3<f32>(randSigned(state), randSigned(state), randSigned(state));
    let l2 = dot(p, p);
    if (!ok && l2 > 1.0e-5 && l2 <= 1.0) {
      v = p * inverseSqrt(l2);
      ok = true;
    }
  }
  return v;
}

fn safeNormal(v: vec3<f32>) -> vec3<f32> {
  let l2 = dot(v, v);
  if (l2 > EPS) {
    return v * inverseSqrt(l2);
  }
  return vec3<f32>(1.0, 0.0, 0.0);
}

fn makeBasis(dir: vec3<f32>) -> mat3x3<f32> {
  var helper = vec3<f32>(0.0, 1.0, 0.0);
  if (abs(dir.y) > 0.85) {
    helper = vec3<f32>(1.0, 0.0, 0.0);
  }
  let u = safeNormal(cross(helper, dir));
  let v = safeNormal(cross(dir, u));
  return mat3x3<f32>(u, v, dir);
}

fn respawn(id: u32, frameSalt: u32) {
  var state = hashU32(id * 747796405u + frameSalt * 2891336453u + 0x68bc21ebu);
  let spawnDir = randomUnit(&state);
  let pos = spawnDir * params.spawnRadius;
  let jitter = randomUnit(&state) * params.jitter;
  let velDir = safeNormal(-pos + jitter);
  bullets[id].posLife = vec4<f32>(pos, params.life);
  bullets[id].velRadius = vec4<f32>(velDir * params.speed, params.bulletRadius);
  bullets[id].seed = vec4<u32>(state, frameSalt, id, 0u);
}

fn rayTriHit(
  origin: vec3<f32>,
  dir: vec3<f32>,
  maxT: f32,
  a: vec3<f32>,
  b: vec3<f32>,
  c: vec3<f32>
) -> bool {
  let ab = b - a;
  let ac = c - a;
  let p = cross(dir, ac);
  let det = dot(ab, p);
  if (abs(det) < EPS) {
    return false;
  }

  let invDet = 1.0 / det;
  let tvec = origin - a;
  let u = dot(tvec, p) * invDet;
  if (u < 0.0 || u > 1.0) {
    return false;
  }

  let q = cross(tvec, ab);
  let v = dot(dir, q) * invDet;
  if (v < 0.0 || u + v > 1.0) {
    return false;
  }

  let t = dot(ac, q) * invDet;
  return t >= 0.0 && t <= maxT;
}

fn sweepTriangle(p0: vec3<f32>, p1: vec3<f32>, radius: f32, tri: Triangle) -> bool {
  let delta = p1 - p0;
  let len = length(delta);
  if (len < EPS) {
    return false;
  }

  let dir = delta / len;
  let basis = makeBasis(dir);
  let u = basis[0] * radius * 0.85;
  let v = basis[1] * radius * 0.85;
  let maxT = len + radius * 2.75;
  let a = tri.a.xyz;
  let b = tri.b.xyz;
  let c = tri.c.xyz;

  if (rayTriHit(p0, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 + u, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 - u, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 + v, dir, maxT, a, b, c)) { return true; }
  if (rayTriHit(p0 - v, dir, maxT, a, b, c)) { return true; }
  return false;
}

@compute @workgroup_size(128)
fn collisionBenchmark(@builtin(global_invocation_id) gid: vec3<u32>) {
  let id = gid.x;
  if (id >= params.targetCount) {
    if (id < arrayLength(&bullets)) {
      bullets[id].posLife.w = -1.0;
    }
    return;
  }

  var b = bullets[id];
  if (b.posLife.w <= 0.0 || b.velRadius.w <= 0.0) {
    respawn(id, params.frame);
    atomicAdd(&counters.alive, 1u);
    return;
  }

  let p0 = b.posLife.xyz;
  let p1 = p0 + b.velRadius.xyz * params.dt;
  var hit = false;

  for (var triId = 0u; triId < params.triCount; triId += 1u) {
    if (!hit && sweepTriangle(p0, p1, b.velRadius.w, triangles[triId])) {
      hit = true;
    }
  }

  if (hit) {
    atomicAdd(&counters.hits, 1u);
    respawn(id, params.frame + 97u);
    atomicAdd(&counters.alive, 1u);
    return;
  }

  b.posLife = vec4<f32>(p1, b.posLife.w - params.dt);
  bullets[id] = b;
  atomicAdd(&counters.alive, 1u);
}
