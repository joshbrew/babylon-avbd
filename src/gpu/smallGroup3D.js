import { solveWGSL } from "../../reference/three-avbd/src/avbd3d/gpu/wgsl-solve.ts";

// A small, jointless world is one closed group: every dynamic endpoint fits
// here. Larger worlds retain the ordinary dispatch boundaries. Contacts stay
// in storage so complex hulls cannot exhaust a fixed shared contact array.
export function smallGroupSource3D(source) {
  source = source.replaceAll("bodies[", "localBodies[");
  source = source.replace(
    "var<storage, read_write> bodies: array<Body>;",
    "var<storage, read_write> globalBodies: array<Body>;",
  );
  const begin = source.indexOf("@compute @workgroup_size(64)\nfn primal("),
    end = source.indexOf("\n/**", begin);
  if (begin < 0 || end < begin)
    throw Error("Review small-group primal integration");
  const primal = source
    .slice(begin, end)
    .replace("@compute @workgroup_size(64)\n", "")
    .replace(
      "fn primal(@builtin(local_invocation_id) lid: vec3u, @builtin(workgroup_id) wid: vec3u)",
      "fn localPrimal(lid: vec3u, wid: vec3u, col: u32)",
    )
    .replaceAll("pc.color", "col");
  return (
    source.slice(0, begin) +
    primal +
    source.slice(end) +
    `
var<workgroup> localBodies: array<Body,32>;
var<workgroup> bucketBlocks: u32;
@compute @workgroup_size(64)
fn smallGroup(@builtin(local_invocation_id) lid: vec3u) {
  if(lid.x<params.bodyCount){localBodies[lid.x]=globalBodies[lid.x];}
  workgroupBarrier();
  for(var it=0u;it<pc.pad0;it++) {
    for(var col=0u;col<params.colorCap;col++) {
      if(lid.x==0u){
        let start=color[params.colorStartOffset+col];
        let count=color[params.colorStartOffset+col+1u]-start;
        let perBlock=64u/lanesFor(count);
        bucketBlocks=(count+perBlock-1u)/perBlock;
      }
      let blocks=workgroupUniformLoad(&bucketBlocks);
      for(var block=0u;block<blocks;block++) {
        localPrimal(lid,vec3u(block,0u,0u),col);
        workgroupBarrier();
      }
    }
    for(var m=lid.x;m<manifoldCount();m+=64u){dualManifold(m);}
    storageBarrier();
    workgroupBarrier();
  }
  if(lid.x<params.bodyCount){globalBodies[lid.x]=localBodies[lid.x];}
}
`
  );
}

export function selectSmallGroup3D(s) {
  const enabled =
    s.smallGroups !== false &&
    s.bodyCount > 0 &&
    s.bodyCount <= 32 &&
    s.jointCount === 0 &&
    s.solverDecision.selected === "standard" &&
    !s.scalarPrimal &&
    !s.portableContactMath &&
    !s.dispatchIsolation;
  if (!enabled) {
    s.smallGroupPipeline = null;
    return;
  }
  const key = `${s.sensorsEnabled ? 1 : 0}`;
  s.smallGroupPipelines ??= new Map();
  if (!s.smallGroupPipelines.has(key)) {
    const code = smallGroupSource3D(s.solveSource(solveWGSL, "standard"));
    s.smallGroupPipelines.set(
      key,
      s.device.createComputePipeline({
        label: "AVBD closed small group",
        layout: s.device.createPipelineLayout({
          bindGroupLayouts: [s.layouts.solve, s.layouts.pass],
        }),
        compute: {
          module: s.device.createShaderModule({ code }),
          entryPoint: "smallGroup",
        },
      }),
    );
  }
  s.smallGroupPipeline = s.smallGroupPipelines.get(key);
}
