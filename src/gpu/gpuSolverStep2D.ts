// Adapted from the MIT-licensed three-avbd 2D encoder by Steven Bobyn.
// Adds same-step GPU waking before adjacency and coloring; dispatch math is unchanged.
import {
  PHASES,
  PASS_STRIDE,
  IA_COLOR,
  IA_CONSTRAINTS,
  IA_CONTACTS,
  IA_PAIRS,
  IA_PREV,
  type StepProfile,
} from "../../reference/three-avbd/src/avbd2d/gpu/layout.ts";
const groups = (n: number) => Math.ceil(n / 64);
export function encodeGpuSolverStep2D(this: any): void {
  if (this.staticsDirty) this.uploadStatics();
  const p = this.params;
  const postStabilize = p.postStabilize && !p.vbd;
  const alpha = p.vbd ? 0 : p.alpha;
  const totalIterations = p.iterations + (postStabilize ? 1 : 0);
  this.writeParams(alpha, postStabilize);
  this.writePassConstants(totalIterations, (it) =>
    postStabilize ? (it < p.iterations ? 1 : 0) : alpha,
  );

  const cur = this.parity;
  const cap = this.bodyCapacity;
  const N = this.bodyCount;
  const J = this.jointCount;
  const encoder = this.device.createCommandEncoder({ label: "avbd2d step" });
  this.encodeStepPrelude?.(encoder);
  // Per-step scratch: grid counts and cursors, hash table, degrees and fill counts, colour counts
  encoder.clearBuffer(this.gridBuffer, 0, (2 * this.tableSize + 1) * 4);
  encoder.clearBuffer(this.tableBuffer);
  encoder.clearBuffer(this.adjBuffer!, 0, (2 * cap + 1) * 4);

  const timed = this.timingCallback !== null && this.timing !== null;
  let pass!: GPUComputePassEncoder;
  let phase = 0;
  const split = timed || this.splitPasses;
  const beginPhase = () => {
    if (pass && !split) return;
    pass?.end();
    pass = encoder.beginComputePass({
      label: split ? PHASES[phase] : "avbd2d step",
      timestampWrites: timed
        ? {
            querySet: this.timing!.querySet,
            beginningOfPassWriteIndex: 2 * phase,
            endOfPassWriteIndex: 2 * phase + 1,
          }
        : undefined,
    });
    phase++;
  };
  const G = this.groups;
  const run = (name: string, group: GPUBindGroup, x: number) => {
    if (x <= 0) return;
    pass.setPipeline(this.pipes[name]);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroups(x);
  };
  const runIndirect = (name: string, group: GPUBindGroup, argsWord: number) => {
    pass.setPipeline(this.pipes[name]);
    pass.setBindGroup(0, group);
    pass.dispatchWorkgroupsIndirect(this.argsBuffer, argsWord * 4);
  };

  // Collision: previous contacts into the hash table, grid, pairs, narrowphase
  beginPhase();
  run("beginFrame", G.broad, 1);
  run("argsPrev", G.args, 1);
  runIndirect("hashInsert", G.contacts[cur], IA_PREV);
  run("gridCount", G.broad, groups(N));
  this.gridScan.encode(pass);
  run("gridScatter", G.broad, groups(N));
  run("findPairs", G.broad, groups(N));
  run("argsPairs", G.args, 1);
  runIndirect("narrowphase", G.contacts[cur], IA_PAIRS);
  run("argsContacts", G.args, 1);

  this.sleeping?.encodeWake(pass, cur);

  // Adjacency
  beginPhase();
  run("degreeJoints", G.topo[cur], groups(J));
  runIndirect("degreeContacts", G.topo[cur], IA_CONTACTS);
  this.adjScan!.encode(pass);
  run("fillJoints", G.topo[cur], groups(J));
  runIndirect("fillContacts", G.topo[cur], IA_CONTACTS);
  run("sortAdjacency", G.topo[cur], groups(N));

  // Colouring
  beginPhase();
  run("colorCompact", G.topo[cur], groups(N));
  run("colorMark", G.topo[cur], groups(N));
  for (let r = 0; r < this.colorRounds; r++)
    run(r % 2 === 0 ? "colorRoundAB" : "colorRoundBA", G.topo[cur], groups(N));
  run("colorCount", G.topo[cur], this.colorGroups);
  this.colorHistScan.encode(pass);
  run("colorStarts", G.topo[cur], 1);
  run("argsColors", G.args, 1);
  run("colorScatter", G.topo[cur], this.colorGroups);

  // Solve
  beginPhase();
  const perIteration = this.colorCap + 1;
  const setPass = (entry: number) =>
    pass.setBindGroup(1, this.passGroup!, [entry * PASS_STRIDE]);
  pass.setBindGroup(0, G.solve[cur]);
  setPass(0);
  if (J > 0) {
    pass.setPipeline(this.pipes.warmStartJoints);
    pass.dispatchWorkgroups(groups(J));
  }
  pass.setPipeline(this.pipes.warmStartBodies);
  pass.dispatchWorkgroups(groups(N));
  for (let it = 0; it < totalIterations; it++) {
    const scan = this.primalMode === "scan";
    pass.setPipeline(scan ? this.pipes.primalScan : this.pipes.primal);
    for (let col = 0; col < this.colorCap; col++) {
      setPass(it * perIteration + col);
      if (scan) pass.dispatchWorkgroups(groups(N));
      else
        pass.dispatchWorkgroupsIndirect(
          this.argsBuffer,
          (IA_COLOR + 3 * col) * 4,
        );
    }
    if (it < p.iterations) {
      // One dual pass over joints and contacts together
      setPass(it * perIteration + this.colorCap);
      pass.setPipeline(this.pipes.dual);
      pass.dispatchWorkgroupsIndirect(this.argsBuffer, IA_CONSTRAINTS * 4);
    }
    if (it === p.iterations - 1) {
      pass.setPipeline(this.pipes.updateVelocities);
      pass.dispatchWorkgroups(groups(N));
    }
  }
  if (postStabilize) {
    pass.setPipeline(this.pipes.refreshStick);
    pass.dispatchWorkgroupsIndirect(this.argsBuffer, IA_CONTACTS * 4);
  }
  pass.end();

  const stamps = 2 * PHASES.length;
  if (timed) {
    const { querySet, resolve, read } = this.timing!;
    encoder.resolveQuerySet(querySet, 0, stamps, resolve, 0);
    encoder.copyBufferToBuffer(resolve, 0, read, 0, stamps * 8);
  }
  this.parity = 1 - cur;
  this.encodeStepPostlude?.(encoder);
  this.device.queue.submit([encoder.finish()]);

  if (timed) {
    const callback = this.timingCallback!;
    this.timingCallback = null;
    this.timingBusy = true;
    const read = this.timing!.read;
    read.mapAsync(GPUMapMode.READ).then(
      () => {
        const t = new BigUint64Array(read.getMappedRange()).slice();
        read.unmap();
        this.timingBusy = false;
        if (this.destroyed) return this.releaseTiming();
        const ms = (a: number, b: number) => Number(t[b] - t[a]) / 1e6;
        const profile = { total: ms(0, stamps - 1) } as StepProfile;
        PHASES.forEach((name, i) => (profile[name] = ms(2 * i, 2 * i + 1)));
        callback(profile);
      },
      () => {
        this.timingBusy = false;
        if (this.destroyed) this.releaseTiming();
      },
    );
  }
}
