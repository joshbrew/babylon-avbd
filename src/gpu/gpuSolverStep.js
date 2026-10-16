// App-owned step encoder. Buffer layouts and physics dispatch order match the
// pinned solver; this adds a broadphase hook and optional detailed timestamps.
import {
  PHASES,
  NO_COLOR,
  PASS_STRIDE,
  IA_COLOR,
  IA_CONSTRAINTS,
  IA_CONTACTS,
  IA_PAIRS,
  IA_PREV,
} from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import { isolatedComputePass } from "./isolatedComputePass.js";
const groups = (n) => Math.ceil(n / 64);

export function encodeGpuSolverStep(s) {
  if (s.radiiDirty || s.noCollideDirty) s.uploadStatics();
  const p = s.params;
  if (s.fixedColors) {
    s.device.queue.writeBuffer(s.colorBuffer, 0, s.fixedColors);
    s.colorCap = Math.max(
      1,
      ...s.fixedColors.map((c) => (c === NO_COLOR ? 0 : c + 1)),
    );
  }
  s.stepCount++;
  s.writeParams();
  s.writePassConstants(p.iterations, p.alpha);
  const cur = s.parity,
    cap = s.bodyCapacity,
    N = s.bodyCount,
    J = s.jointCount,
    G = s.groups;
  const encoder = s.device.createCommandEncoder({ label: "AVBD app step" });
  s.encodeStepPrelude?.(encoder);
  if (!s.bvh) encoder.clearBuffer(s.gridBuffer, 0, (2 * s.tableSize + 1) * 4);
  encoder.clearBuffer(s.tableBuffer);
  encoder.clearBuffer(s.adjBuffer, 0, (2 * cap + 1) * 4);
  const detailed = !!s.detailCallback;
  const timed = detailed || (s.timingCallback !== null && s.timing !== null);
  const split = timed || s.splitPasses;
  const timing = detailed ? s.detailTiming : s.timing;
  const stages = [];
  let pass, current, boundGroup;
  const phase = (name, aggregate) => {
    if (pass && !detailed && (current === aggregate || !split)) return;
    pass?.end();
    current = aggregate;
    const index = detailed ? stages.length : PHASES.indexOf(aggregate);
    stages.push({ name, aggregate });
    const descriptor = {
      label: name,
      timestampWrites: timed
        ? {
            querySet: timing.querySet,
            beginningOfPassWriteIndex: index * 2,
            endOfPassWriteIndex: index * 2 + 1,
          }
        : undefined,
    };
    pass = s.dispatchIsolation
      ? isolatedComputePass(encoder, descriptor)
      : encoder.beginComputePass(descriptor);
    boundGroup = undefined;
  };
  // Scan/BVH helpers bind their own buffers. Invalidate after those helpers
  // and when opening a new pass; pipeline changes alone keep bindings intact.
  const bind = (group) => {
    if (boundGroup === group) return;
    pass.setBindGroup(0, group);
    boundGroup = group;
  };
  const run = (name, group, x) => {
    if (x <= 0) return;
    pass.setPipeline(s.pipes[name]);
    bind(group);
    pass.dispatchWorkgroups(x);
  };
  const indirect = (name, group, args) => {
    pass.setPipeline(s.pipes[name]);
    bind(group);
    pass.dispatchWorkgroupsIndirect(s.argsBuffer, args * 4);
  };
  phase("contactCache", "collision");
  run("beginFrame", G.broad, 1);
  if (p.reuseContacts && !s.contactRecycling) run("updateRefs", G.refs, groups(N));
  run("argsPrev", G.args, 1);
  indirect("hashInsert", G.contacts[cur], IA_PREV);
  phase("broadphaseBuild", "collision");
  if (s.bvh) {
    s.bvh.configure(N);
    s.bvh.encodeBuild(pass);
    boundGroup = undefined;
  } else {
    run("gridCount", G.broad, groups(N));
    s.gridScan.encode(pass);
    boundGroup = undefined;
    run("gridScatter", G.broad, groups(N));
  }
  phase("broadphasePairs", "collision");
  if (s.bvh) {
    s.bvh.encodePairs(pass, s);
    boundGroup = undefined;
  } else run("findPairs", G.broad, groups(N));
  phase("narrowphase", "collision");
  run("argsPairs", G.args, 1);
  indirect("narrowphase", G.contacts[cur], IA_PAIRS);
  run("argsContacts", G.args, 1);
  if (s.sleeping) {
    phase("impactWake", "collision");
    s.sleeping.encodeImpact(pass, cur);
    // Waking changes mass, not poses: reuse this step's grid/tree and last
    // step's warm-start cache. GPU zero-sized dispatches skip the refresh if
    // no sleeper woke. Regenerate all pairs so neighbors in a woken island
    // retain their mutual contacts during this very first impact solve.
    if (s.bvh) s.bvh.encodePairs(pass, s, s.sleeping.refreshArgs);
    else {
      pass.setPipeline(s.pipes.findPairs);
      pass.setBindGroup(0, G.broad);
      pass.dispatchWorkgroupsIndirect(s.sleeping.refreshArgs, 0);
    }
    s.sleeping.encodeRefreshArgs(pass);
    pass.setPipeline(s.pipes.narrowphase);
    pass.setBindGroup(0, G.contacts[cur]);
    pass.dispatchWorkgroupsIndirect(s.sleeping.refreshArgs, 12);
    boundGroup = undefined;
    run("argsContacts", G.args, 1);
  }
  phase("adjacency", "adjacency");
  run("degreeJoints", G.topo[cur], groups(J));
  indirect("degreeContacts", G.topo[cur], IA_CONTACTS);
  s.adjScan.encode(pass);
  boundGroup = undefined;
  run("fillJoints", G.topo[cur], groups(J));
  indirect("fillContacts", G.topo[cur], IA_CONTACTS);
  run("sortAdjacency", G.topo[cur], groups(N));
  phase("coloring", "coloring");
  if (!s.fixedColors) {
    run("colorCompact", G.topo[cur], groups(N));
    run("colorMark", G.topo[cur], groups(N));
    for (let r = 0; r < s.colorRounds; r++)
      run(
        r % 2 === 0 ? "colorRoundAB" : "colorRoundBA",
        G.topo[cur],
        groups(N),
      );
  }
  run("colorCount", G.topo[cur], s.colorGroups);
  s.colorHistScan.encode(pass);
  boundGroup = undefined;
  run("colorStarts", G.topo[cur], 1);
  run("argsColors", G.args, 1);
  run("colorScatter", G.topo[cur], s.colorGroups);
  // A reused sequence avoids the typed-array overload cost for one offset.
  const offsets = (s.passOffsets ??= [0]);
  let solvePass, offsetPass, lastEntry;
  const setPass = (entry) => {
    if (offsetPass === pass && lastEntry === entry) return;
    offsets[0] = entry * PASS_STRIDE;
    pass.setBindGroup(1, s.passGroup, offsets);
    offsetPass = pass;
    lastEntry = entry;
  };
  const solveBindings = () => {
    if (solvePass !== pass) {
      pass.setBindGroup(0, G.solve[cur]);
      solvePass = pass;
    }
  };
  phase("warmStart", "solve");
  solveBindings();
  setPass(0);
  if (J > 0) {
    pass.setPipeline(s.pipes.warmStartJoints);
    pass.dispatchWorkgroups(groups(J));
  }
  pass.setPipeline(s.pipes.warmStartBodies);
  if (N) pass.dispatchWorkgroups(groups(N));
  if (s.smallGroupPipeline) {
    phase("smallGroupSolve", "solve");
    solveBindings();
    setPass(0);
    pass.setPipeline(s.smallGroupPipeline);
    pass.dispatchWorkgroups(1);
  } else
    for (let it = 0; it < p.iterations; it++) {
      phase("bodySolve", "solve");
      solveBindings();
      pass.setPipeline(s.pipes.primal);
      for (let col = 0; col < s.colorCap; col++) {
        setPass(it * (s.colorCap + 1) + col);
        pass.dispatchWorkgroupsIndirect(s.argsBuffer, (IA_COLOR + 3 * col) * 4);
      }
      phase("contactUpdate", "solve");
      solveBindings();
      setPass(it * (s.colorCap + 1) + s.colorCap);
      pass.setPipeline(s.pipes.dual);
      pass.dispatchWorkgroupsIndirect(s.argsBuffer, IA_CONSTRAINTS * 4);
    }
  phase("velocities", "solve");
  solveBindings();
  setPass(0);
  pass.setPipeline(s.pipes.updateVelocities);
  if (N) pass.dispatchWorkgroups(groups(N));
  pass.end();
  const stamps = 2 * (detailed ? stages.length : PHASES.length);
  if (timed) {
    encoder.resolveQuerySet(timing.querySet, 0, stamps, timing.resolve, 0);
    encoder.copyBufferToBuffer(timing.resolve, 0, timing.read, 0, stamps * 8);
  }
  s.parity = 1 - cur;
  s.encodeStepPostlude?.(encoder);
  s.device.queue.submit([encoder.finish()]);
  if (!timed) return;
  const callback = detailed ? s.detailCallback : s.timingCallback;
  if (detailed) s.detailCallback = null;
  else s.timingCallback = null;
  s.timingBusy = true;
  timing.read.mapAsync(GPUMapMode.READ).then(
    () => {
      const t = new BigUint64Array(timing.read.getMappedRange()).slice();
      timing.read.unmap();
      s.timingBusy = false;
      if (s.destroyed) {
        s.releaseAppTiming();
        s.releaseTiming();
        return;
      }
      const ms = (a, b) => Number(t[b] - t[a]) / 1e6;
      const profile = {
        total: ms(0, stamps - 1),
        broadphase: s.broadphase,
        bvhRebuilt: s.bvh?.lastRebuilt ?? false,
      };
      if (detailed) {
        profile.details = {};
        for (const [i, stage] of stages.entries()) {
          const value = ms(i * 2, i * 2 + 1);
          profile[stage.aggregate] = (profile[stage.aggregate] ?? 0) + value;
          profile.details[stage.name] =
            (profile.details[stage.name] ?? 0) + value;
        }
      } else
        PHASES.forEach((name, i) => (profile[name] = ms(i * 2, i * 2 + 1)));
      callback(profile);
    },
    (error) => {
      s.timingBusy = false;
      s.profileErrors.push(error.message);
      if (s.destroyed) {
        s.releaseAppTiming();
        s.releaseTiming();
      }
    },
  );
}
