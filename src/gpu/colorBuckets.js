// Stable per-color ranks within a 256-body chunk. Each color owns eight words;
// counting the preceding set bits gives the same index order as scanning every
// preceding body. This changes scheduling work only, not coloring or solving.
export function withBitsetColorBuckets(source) {
  const start = source.indexOf("@compute @workgroup_size(256)\nfn colorCount(");
  const end = source.indexOf("\n// 5.", start);
  if (start < 0 || end < start)
    throw Error("Pinned color buckets changed; review the bitset rank kernel");
  return (
    source
      .slice(0, start)
      .replace(
        "var<workgroup> hist: array<atomic<u32>, 64>;\nvar<workgroup> chunkColors: array<u32, 256>;\n",
        "",
      ) +
    `
var<workgroup> colorBits:array<atomic<u32>,512>;
@compute @workgroup_size(256)
fn colorCount(@builtin(global_invocation_id) gid:vec3u,
              @builtin(local_invocation_id) lid:vec3u,
              @builtin(workgroup_id) wid:vec3u) {
  atomicStore(&colorBits[lid.x],0u);
  atomicStore(&colorBits[lid.x+256u],0u);
  workgroupBarrier();
  let b=gid.x;
  var col=NO_COLOR;
  if(b<params.bodyCount && dynamicBody(i32(b))) {
    let s=state(0u,b);
    col=s&0xffu;
    if((s&PENDING)!=0u){atomicAdd(&counters[C_CLASHES],1u);}
    if (col == NO_COLOR) { col = params.colorCap - 1u; }
    atomicStore(&color[b],col);
    atomicMax(&counters[C_NUM_COLORS],col+1u);
  }
  let word=lid.x>>5u;
  let bit=lid.x&31u;
  if(col!=NO_COLOR){atomicOr(&colorBits[col*8u+word],1u<<bit);}
  workgroupBarrier();
  if(col!=NO_COLOR){
    var rank=0u;
    for(var k=0u;k<word;k++){rank+=countOneBits(atomicLoad(&colorBits[col*8u+k]));}
    rank+=countOneBits(atomicLoad(&colorBits[col*8u+word])&((1u<<bit)-1u));
    atomicStore(&color[params.stateBOffset+b],rank);
  }
  if(lid.x<MAX_COLORS){
    var count=0u;
    for(var k=0u;k<8u;k++){count+=countOneBits(atomicLoad(&colorBits[lid.x*8u+k]));}
    atomicStore(&color[params.colorHistOffset+lid.x*params.colorGroups+wid.x],count);
  }
  if(gid.x==0u){atomicStore(&color[params.colorHistOffset+MAX_COLORS*params.colorGroups],0u);}
}

` +
    source.slice(end)
  );
}

export function selectColorBuckets(s, source) {
  // Small worlds avoid an extra pipeline; ranks stay identical in either path.
  const useBitset = s.bodyCount >= 1024;
  if (s.bitsetColorBuckets === useBitset) return;
  const pipelines = (s.colorBucketPipelines ??= { scan: s.pipes.colorCount });
  if (useBitset && !pipelines.bitset) {
    pipelines.bitset = s.device.createComputePipeline({
      label: "Stable bitset color buckets",
      layout: s.device.createPipelineLayout({
        bindGroupLayouts: [s.layouts.topo],
      }),
      compute: {
        module: s.device.createShaderModule({ code: source }),
        entryPoint: "colorCount",
      },
    });
  }
  s.pipes.colorCount = useBitset ? pipelines.bitset : pipelines.scan;
  s.bitsetColorBuckets = useBitset;
}
