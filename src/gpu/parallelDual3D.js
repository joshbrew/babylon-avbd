// Contact points in a manifold update independently. Four adjacent invocations
// read adjacent points; joints retain exactly one update per iteration.
import { makeArgsWGSL } from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import {
  PRELUDE_3D,
  ARGS_ITEMS_3D,
} from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";
// Tile the indirect dispatch in two dimensions: four times the manifold count
// can exceed WebGPU's per-axis workgroup limit. Small rows bound padding cost.
const rowGroups = 256;

export function withParallelDual3D(source) {
  const replace = (from, to) => {
    if (source.split(from).length !== 2)
      throw Error("Review parallel dual integration");
    source = source.replace(from, to);
  };
  replace("fn dualManifold(m: u32) {", "fn dualManifold(m: u32, lane: u32) {");
  replace(
    "for (var c = mf.ids.z; c < end; c++) {",
    "for (var c = mf.ids.z + lane; c < end; c += 4u) {",
  );
  replace(
    `  let id = gid.x;
  if (id < params.jointCount) { dualJoint(id); }
  else if (id - params.jointCount < manifoldCount()) { dualManifold(id - params.jointCount); }`,
    `  let id = (gid.x + gid.y * ${rowGroups * 64}u) / 4u;
  let lane = gid.x % 4u;
  if (id < params.jointCount) { if (lane == 0u) { dualJoint(id); } }
  else if (id - params.jointCount < manifoldCount()) { dualManifold(id - params.jointCount, lane); }`,
  );
  return source;
}

export function selectDualArgs3D(s, parallel) {
  const pipelines = (s.dualArgPipelines ??= { serial: s.pipes.argsContacts });
  if (parallel && !pipelines.parallel) {
    const source = makeArgsWGSL(PRELUDE_3D, ARGS_ITEMS_3D);
    const marker = "setArgs(IA_CONSTRAINTS, params.jointCount + items);";
    if (source.split(marker).length !== 2)
      throw Error("Review parallel contact dispatch sizing");
    const code = source.replace(
      marker,
      `let blocks = groupsFor((params.jointCount + items) * 4u);
  args[IA_CONSTRAINTS] = min(blocks, ${rowGroups}u);
  args[IA_CONSTRAINTS + 1u] = max(1u, (blocks + ${rowGroups - 1}u) / ${rowGroups}u);
  args[IA_CONSTRAINTS + 2u] = 1u;`,
    );
    pipelines.parallel = s.device.createComputePipeline({
      layout: s.device.createPipelineLayout({
        bindGroupLayouts: [s.layouts.args],
      }),
      compute: {
        module: s.device.createShaderModule({ code }),
        entryPoint: "argsContacts",
      },
    });
  }
  s.pipes.argsContacts = parallel ? pipelines.parallel : pipelines.serial;
  s.parallelDual = parallel;
}
