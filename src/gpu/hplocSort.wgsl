// Stable 4-bit GPU radix sort; PrefixScan scans digit-major block counts.
struct SortSettings { count: u32, blocks: u32, shift: u32, _pad: u32 }
@group(0) @binding(0) var<uniform> sort: SortSettings;
@group(0) @binding(1) var<storage, read> input: array<vec2u>;
@group(0) @binding(2) var<storage, read_write> output: array<vec2u>;
@group(0) @binding(3) var<storage, read_write> hist: array<u32>;
var<workgroup> counts: array<atomic<u32>, 16>;
var<workgroup> digits: array<u32, 128>;

@compute @workgroup_size(128)
fn countDigits(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  if (lid.x < 16u) { atomicStore(&counts[lid.x], 0u); }
  workgroupBarrier();
  if (gid.x < sort.count) {
    atomicAdd(&counts[(input[gid.x].x >> sort.shift) & 15u], 1u);
  }
  workgroupBarrier();
  if (lid.x < 16u) {
    hist[lid.x * sort.blocks + wid.x] = atomicLoad(&counts[lid.x]);
  }
}

@compute @workgroup_size(128)
fn scatterDigits(
  @builtin(global_invocation_id) gid: vec3u,
  @builtin(local_invocation_id) lid: vec3u,
  @builtin(workgroup_id) wid: vec3u,
) {
  var value = vec2u(0);
  var digit = 16u;
  if (gid.x < sort.count) {
    value = input[gid.x];
    digit = (value.x >> sort.shift) & 15u;
  }
  digits[lid.x] = digit;
  workgroupBarrier();
  if (gid.x >= sort.count) { return; }
  // Rank by input lane, rather than atomic arrival order, to retain stable ties.
  var rank = 0u;
  for (var j = 0u; j < lid.x; j++) {
    rank += select(0u, 1u, digits[j] == digit);
  }
  output[hist[digit * sort.blocks + wid.x] + rank] = value;
}
