override CELL_RES : u32 = 512u;

struct PrimAABB {
  bboxMin: vec4<f32>,
  bboxMax: vec4<f32>,
};

struct Params {
  count: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<storage, read> primAABB: array<PrimAABB>;
@group(0) @binding(1) var<storage, read_write> mortonKey: array<u32>;
@group(0) @binding(2) var<uniform> params: Params;

fn expandBits(v: u32) -> u32 {
  var x = v & 0x000003ffu;
  x = (x | (x << 16u)) & 0x030000ffu;
  x = (x | (x << 8u)) & 0x0300f00fu;
  x = (x | (x << 4u)) & 0x030c30c3u;
  x = (x | (x << 2u)) & 0x09249249u;
  return x;
}

fn morton3D(p: vec3<f32>) -> u32 {
  let qf = clamp(p, vec3<f32>(0.0), vec3<f32>(0.999999)) * f32(CELL_RES);
  let q = vec3<u32>(qf);
  return (expandBits(q.x) << 2u) | (expandBits(q.y) << 1u) | expandBits(q.z);
}

@compute @workgroup_size(128)
fn mortonCodes(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.count) {
    return;
  }
  let a = primAABB[i];
  let c = (a.bboxMin.xyz + a.bboxMax.xyz) * 0.5;
  // Demo-scene normalization for the rock/castle lanes.
  let n = (c - vec3<f32>(-6.0, -2.0, -5.0)) / vec3<f32>(12.0, 10.0, 12.0);
  mortonKey[i] = morton3D(n);
}
