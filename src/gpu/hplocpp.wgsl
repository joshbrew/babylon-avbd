// Portable hierarchical PLOC: Morton ordering and independent SAH treelets.
// Dispatch boundaries publish each hierarchy level; no cross-workgroup spin waits.
struct Node {
  lo: vec3f,
  left: u32,
  hi: vec3f,
  right: u32,
}
struct BuildSettings {
  count: u32,
  nodeBase: u32,
  inputOffset: u32,
  outputOffset: u32,
  root: u32,
  blocks: u32,
  shift: u32,
  boundsOffset: u32,
  inputCount: u32,
  escapeOffset: u32,
  _pad0: u32,
  _pad1: u32,
}
@group(0) @binding(0) var<uniform> build: BuildSettings;
@group(0) @binding(1) var<storage, read> inputBodies: array<Body>;
@group(0) @binding(2) var<storage, read_write> nodes: array<Node>;
@group(0) @binding(3) var<storage, read_write> ordering: array<vec2u>;
@group(0) @binding(4) var<storage, read_write> bounds: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> links: array<u32>;
@group(0) @binding(6) var<storage, read_write> clusters: array<u32>;
const END: u32 = 0xffffffffu;
const WIDTH: u32 = 16u;
var<workgroup> lower: array<vec3f, 128>;
var<workgroup> upper: array<vec3f, 128>;

fn bodyHalf(i: u32) -> vec3f {
  let b = inputBodies[i];
  let h = b.size.xyz * 0.5;
  if (b.angVel.w == SHAPE_SPHERE) { return vec3f(h.x); }
  return abs(qrotate(b.rot, vec3f(1, 0, 0))) * h.x
    + abs(qrotate(b.rot, vec3f(0, 1, 0))) * h.y
    + abs(qrotate(b.rot, vec3f(0, 0, 1))) * h.z;
}

@compute @workgroup_size(128)
fn leaves(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  let i = gid.x;
  var lo = vec3f(3.402823e38);
  var hi = -lo;
  if (i < build.count) {
    let h = bodyHalf(i);
    let p = inputBodies[i].pos.xyz;
    lo = p - h;
    hi = p + h;
    nodes[i] = Node(lo, i, hi, END);
  }
  lower[lid.x] = lo;
  upper[lid.x] = hi;
  workgroupBarrier();
  for (var stride = 64u; stride > 0u; stride >>= 1u) {
    if (lid.x < stride) {
      lower[lid.x] = min(lower[lid.x], lower[lid.x + stride]);
      upper[lid.x] = max(upper[lid.x], upper[lid.x + stride]);
    }
    workgroupBarrier();
  }
  if (lid.x == 0u) {
    bounds[build.outputOffset + wid.x * 2u] = vec4f(lower[0], 0);
    bounds[build.outputOffset + wid.x * 2u + 1u] = vec4f(upper[0], 0);
  }
}

@compute @workgroup_size(128)
fn reduceBounds(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  var lo = vec3f(3.402823e38);
  var hi = -lo;
  if (gid.x < build.inputCount) {
    lo = bounds[build.inputOffset + gid.x * 2u].xyz;
    hi = bounds[build.inputOffset + gid.x * 2u + 1u].xyz;
  }
  lower[lid.x] = lo;
  upper[lid.x] = hi;
  workgroupBarrier();
  for (var stride = 64u; stride > 0u; stride >>= 1u) {
    if (lid.x < stride) {
      lower[lid.x] = min(lower[lid.x], lower[lid.x + stride]);
      upper[lid.x] = max(upper[lid.x], upper[lid.x + stride]);
    }
    workgroupBarrier();
  }
  if (lid.x == 0u) {
    bounds[build.outputOffset + wid.x * 2u] = vec4f(lower[0], 0);
    bounds[build.outputOffset + wid.x * 2u + 1u] = vec4f(upper[0], 0);
  }
}

fn expandBits(v: u32) -> u32 {
  var x = v & 1023u;
  x = (x | (x << 16u)) & 0x030000ffu;
  x = (x | (x << 8u)) & 0x0300f00fu;
  x = (x | (x << 4u)) & 0x030c30c3u;
  return (x | (x << 2u)) & 0x09249249u;
}

@compute @workgroup_size(128)
fn mortonCodes(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= build.count) { return; }
  let n = nodes[i];
  let lo = bounds[build.boundsOffset].xyz;
  let hi = bounds[build.boundsOffset + 1u].xyz;
  // Half-scale avoids overflow when a finite scene spans distant coordinates.
  let extent = max(hi * 0.5 - lo * 0.5, vec3f(1e-20));
  let p = clamp(((n.lo * 0.25 + n.hi * 0.25) - lo * 0.5) / extent,
    vec3f(0), vec3f(0.999999));
  let q = vec3u(p * 1024.0);
  ordering[i] = vec2u((expandBits(q.x) << 2u)
    | (expandBits(q.y) << 1u) | expandBits(q.z), i);
}

@compute @workgroup_size(128)
fn seedClusters(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x < build.count) { clusters[gid.x] = ordering[gid.x].y; }
}

var<workgroup> alive: array<u32, 16>;
var<workgroup> clusterID: array<u32, 16>;
var<workgroup> best: array<u32, 16>;
var<workgroup> mergeFlag: array<u32, 16>;
var<workgroup> created: u32;
var<workgroup> survivors: u32;

fn area(lo: vec3f, hi: vec3f) -> f32 {
  let d = min(max(hi - lo, vec3f(0)), vec3f(1e18));
  return d.x * d.y + d.y * d.z + d.z * d.x;
}

@compute @workgroup_size(16)
fn miniHploc(
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  let lane = lid.x;
  let at = wid.x * WIDTH + lane;
  let live = at < build.inputCount;
  alive[lane] = select(0u, 1u, live);
  if (live) { clusterID[lane] = clusters[build.inputOffset + at]; }
  if (lane == 0u) {
    created = 0u;
    survivors = min(WIDTH, build.inputCount - wid.x * WIDTH);
  }
  workgroupBarrier();
  loop {
    if (workgroupUniformLoad(&survivors) <= 1u) { break; }
    var winner = END;
    var cost = 3.402823e38;
    if (alive[lane] != 0u) {
      let a = nodes[clusterID[lane]];
      for (var j = 0u; j < WIDTH; j++) {
        if (j == lane || alive[j] == 0u) { continue; }
        let b = nodes[clusterID[j]];
        let c = area(min(a.lo, b.lo), max(a.hi, b.hi));
        // Deterministic edge ties guarantee a mutual nearest pair.
        if (c < cost || (c == cost && j < winner)) {
          cost = c;
          winner = j;
        }
      }
    }
    best[lane] = winner;
    workgroupBarrier();
    mergeFlag[lane] = 0u;
    if (alive[lane] != 0u && winner != END && lane < winner
      && best[winner] == lane) { mergeFlag[lane] = 1u; }
    workgroupBarrier();
    var rank = 0u;
    var merged = 0u;
    for (var j = 0u; j < WIDTH; j++) {
      if (j < lane) { rank += mergeFlag[j]; }
      merged += mergeFlag[j];
    }
    // Read every input before any winning lane retires its partner.
    var aID = END;
    var bID = END;
    var node: Node;
    if (mergeFlag[lane] != 0u) {
      aID = clusterID[lane];
      bID = clusterID[winner];
      let a = nodes[aID];
      let b = nodes[bID];
      node = Node(min(a.lo, b.lo), aID, max(a.hi, b.hi), bID);
    }
    workgroupBarrier();
    if (mergeFlag[lane] != 0u) {
      let id = build.nodeBase + wid.x * (WIDTH - 1u) + created + rank;
      nodes[id] = node;
      links[aID] = id;
      links[bID] = id;
      clusterID[lane] = id;
      alive[winner] = 0u;
    }
    storageBarrier();
    workgroupBarrier();
    if (lane == 0u) {
      created += merged;
      survivors -= merged;
    }
    workgroupBarrier();
  }
  if (alive[lane] != 0u) {
    clusters[build.outputOffset + wid.x] = clusterID[lane];
  }
}

@compute @workgroup_size(64)
fn refitTreelets(@builtin(global_invocation_id) gid: vec3u) {
  let first = gid.x * WIDTH;
  if (first >= build.inputCount) { return; }
  let count = min(WIDTH, build.inputCount - first);
  // Creation order puts children before parents inside this treelet.
  for (var j = 0u; j + 1u < count; j++) {
    let id = build.nodeBase + gid.x * (WIDTH - 1u) + j;
    let n = nodes[id];
    let a = nodes[n.left];
    let b = nodes[n.right];
    nodes[id] = Node(min(a.lo, b.lo), n.left, max(a.hi, b.hi), n.right);
  }
}

@compute @workgroup_size(128)
fn ropes(@builtin(global_invocation_id) gid: vec3u) {
  let id = gid.x;
  if (id >= build.escapeOffset) { return; }
  var at = id;
  var escape = END;
  // The host's <= 1M dispatch limit allows at most five 16-way levels:
  // <= 75 binary ancestors, including fully unbalanced treelets.
  for (var depth = 0u; depth < 128u; depth++) {
    if (at == build.root) { break; }
    let p = links[at];
    if (p == END) { break; }
    let parent = nodes[p];
    if (parent.left == at) {
      escape = parent.right;
      break;
    }
    at = p;
  }
  links[build.escapeOffset + id] = escape;
}
