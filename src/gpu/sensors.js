import { makeTopologyWGSL } from "../../reference/three-avbd/src/avbd2d/gpu/wgsl-topology.ts";
import {
  PRELUDE_3D,
  TOPOLOGY_ACCESSORS_3D,
} from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";

// App record extension, enabled only for worlds containing sensors:
// initialPos.w stores a sensor flag (the solver only uses initialPos.xyz).
// Manifold bit 31 marks a non-solving overlap. Bits 4..30 hold the generation.
// Events retain the point count; topology and AVBD skip the entire manifold.
export function sensorSolve(source) {
  return source
    .replace(
      "return m.ids.w & 15u;",
      "return select(m.ids.w & 15u, 0u, (m.ids.w & 0x80000000u) != 0u);",
    )
    .replace(
      "bodies[i].initialPos = pos;",
      "bodies[i].initialPos = vec4f(pos.xyz, bodies[i].initialPos.w);",
    );
}
export function sensorContacts(source) {
  return source
    .replace(
      "let generated = prev.ids.w >> 4u;",
      "let generated = (prev.ids.w >> 4u) & 0x07ffffffu;",
    )
    .replace(
      "reuseContacts(a, b))",
      "bodies[a].initialPos.w == 0.0 && bodies[b].initialPos.w == 0.0 && reuseContacts(a, b))",
    )
    .replace(
      "count | (params.step << 4u)",
      "count | ((params.step & 0x07ffffffu) << 4u) | select(0u, 0x80000000u, bodies[a].initialPos.w != 0.0 || bodies[b].initialPos.w != 0.0)",
    );
}
export function sensorTopology(
  source = makeTopologyWGSL(PRELUDE_3D, TOPOLOGY_ACCESSORS_3D),
) {
  return source.replaceAll(
    "if (gid.x >= topoCount()) { return; }",
    "if (gid.x >= topoCount()) { return; }\n  if ((contacts[gid.x].ids.w & 0x80000000u) != 0u) { return; }",
  );
}
export function clearSensorFlags(solver) {
  const d = solver.device;
  const module = d.createShaderModule({
    code: `
    @group(0) @binding(0) var<storage,read_write> records:array<vec4f>;
    @compute @workgroup_size(64) fn clear(@builtin(global_invocation_id) id:vec3u){
      if(id.x*10u+2u>=arrayLength(&records)){return;}
      records[id.x*10u+2u].w=0.;
    }`,
  });
  const pipeline = d.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "clear" },
  });
  const group = d.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: solver.bodyBuffer } }],
  });
  const encoder = d.createCommandEncoder(),
    pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, group);
  pass.dispatchWorkgroups(Math.ceil(solver.bodyCount / 64));
  pass.end();
  d.queue.submit([encoder.finish()]);
}
