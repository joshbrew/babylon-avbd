import source from "./bodyCommands2D.wgsl";
import { VelocityBatch, MotionBatch } from "../native/velocityBatch.js";
export function vector2D(value, name) {
  const pair =
    value && typeof value.x === "number"
      ? [value.x, value.y]
      : Array.isArray(value) ||
          (ArrayBuffer.isView(value) && !(value instanceof DataView))
        ? value
        : Array.from(value ?? []);
  if (pair.length !== 2 || !pair.every(Number.isFinite))
    throw Error(`${name} requires two finite components`);
  return pair;
}
/** Reusable CPU staging; headers and float payloads share the command's 48-byte layout. */
export class CommandStaging {
  constructor() {
    this.count = 0;
    this.capacity = 0;
  }
  reserve(count) {
    if (count <= this.capacity) return;
    const capacity = Math.max(count, this.capacity * 2, 64);
    const data = new ArrayBuffer(capacity * 48);
    const words = new Float32Array(data);
    const u32 = new Uint32Array(data);
    if (this.u32) u32.set(this.u32.subarray(0, this.count * 12));
    this.words = words;
    this.u32 = u32;
    this.capacity = capacity;
  }
  append(index, kind, value, point, hasPoint = false) {
    this.reserve(this.count + 1);
    writeCommand(
      this.words,
      this.u32,
      this.count++ * 12,
      index,
      kind,
      value,
      point,
      hasPoint,
    );
  }
}
function writeCommand(f, u, o, index, kind, value, point, hasPoint) {
  u[o] = index;
  u[o + 1] = kind;
  u[o + 2] = Number(hasPoint);
  u[o + 3] = 0;
  for (let k = 0; k < 4; k++) {
    f[o + 4 + k] = value[k] ?? 0;
    f[o + 8 + k] = point?.[k] ?? 0;
  }
}
/** Optional ordered edits. One invocation owns each touched body; all upload storage is reused. */
export class BodyCommands2D {
  constructor(solver, shader = source, dimension = 2) {
    this.solver = solver;
    this.shader = shader;
    this.dimension = dimension;
    this.pending = new Map();
    this.queue = new CommandStaging();
    this.requested = 0;
    this.linearOnly = true;
    this.angularOnly = true;
    this.hasTeleports = false;
    this.motionOnly = true;
    this.freeRanges = [];
  }
  slot(index, kind) {
    this.requested++;
    this.linearOnly &&= kind === 0;
    this.angularOnly &&= kind === 1;
    this.motionOnly &&= kind === 0 || kind === 1;
    this.hasTeleports ||= kind === 4;
    let range = this.pending.get(index);
    if (
      range &&
      (kind === 0 || kind === 1) &&
      this.queue.u32[range.tail * 12 + 1] === kind
    )
      return range.tail; // Adjacent replacement setters have no intervening effect on this body.
    this.queue.reserve(this.queue.count + 1);
    if (!this.next || this.next.length < this.queue.capacity) {
      const next = new Int32Array(this.queue.capacity);
      if (this.next) next.set(this.next);
      this.next = next;
    }
    const slot = this.queue.count++;
    this.next[slot] = -1;
    if (!range) {
      range = this.freeRanges.pop() ?? {};
      range.head = range.tail = slot;
      range.length = 1;
      this.pending.set(index, range);
    } else {
      this.next[range.tail] = slot;
      range.tail = slot;
      range.length++;
    }
    return slot;
  }
  enqueue(index, kind, value, point, hasPoint = false) {
    const slot = this.slot(index, kind);
    writeCommand(
      this.queue.words,
      this.queue.u32,
      slot * 12,
      index,
      kind,
      value,
      point,
      hasPoint,
    );
  }
  enqueueValidated(staging) {
    for (let i = 0; i < staging.count; i++) {
      const o = i * 12,
        slot = this.slot(staging.u32[o], staging.u32[o + 1]) * 12;
      for (let k = 0; k < 12; k++)
        this.queue.u32[slot + k] = staging.u32[o + k];
    }
  }
  flush(encoder) {
    if (!this.pending.size) return;
    const d = this.solver.device,
      count = this.pending.size;
    if (this.linearOnly || this.angularOnly) {
      const components =
        this.angularOnly && this.dimension === 2 ? 1 : this.dimension;
      if (!this.linearIndices || this.linearIndices.length < count) {
        const capacity = Math.max(
          count,
          (this.linearIndices?.length ?? 0) * 2,
          64,
        );
        this.linearIndices = new Uint32Array(capacity);
        this.linearValues = new Float32Array(capacity * this.dimension);
      }
      let i = 0;
      for (const [index, range] of this.pending) {
        this.linearIndices[i] = index;
        for (let k = 0; k < components; k++)
          this.linearValues[i * components + k] =
            this.queue.words[range.tail * 12 + 4 + k];
        i++;
      }
      const name = this.angularOnly ? "angularVelocityBatch" : "velocityBatch";
      const batch = (this.solver[name] ??= new VelocityBatch(
        this.solver,
        this.dimension,
        this.angularOnly ? "angular" : "linear",
      ));
      batch.submitValidated(
        this.linearIndices.subarray(0, count),
        this.linearValues.subarray(0, count * components),
        encoder,
      );
      this.lastBatch = {
        bodies: count,
        commands: this.queue.count,
        requestedCommands: this.requested,
        uploadedBytes: batch.lastBatch.uploadedBytes,
        path: this.angularOnly
          ? "packed-angular-velocities"
          : "packed-velocities",
        submissions: encoder ? 0 : 1,
      };
    } else if (this.motionOnly) {
      const batch = (this.motionBatch ??= new MotionBatch(
        this.solver,
        this.dimension,
      ));
      const width = batch.wordsPerBody;
      if (!this.motionData || this.motionData.length < count * width) {
        this.motionData = new Uint32Array(
          Math.max(
            count * width,
            (this.motionData?.length ?? 0) * 2,
            64 * width,
          ),
        );
        this.motionFloats = new Float32Array(this.motionData.buffer);
      }
      let i = 0;
      for (const [index, range] of this.pending) {
        const o = i++ * width;
        this.motionData[o] = index;
        let mask = 0;
        for (let slot = range.head; slot !== -1; slot = this.next[slot]) {
          const kind = this.queue.u32[slot * 12 + 1];
          mask |= 1 << kind;
          const start = o + (kind === 0 ? 2 : 2 + this.dimension);
          const n = kind === 0 || this.dimension === 3 ? this.dimension : 1;
          for (let k = 0; k < n; k++)
            this.motionFloats[start + k] = this.queue.words[slot * 12 + 4 + k];
        }
        this.motionData[o + 1] = mask;
      }
      batch.submitValidated(
        this.motionData.subarray(0, count * width),
        encoder,
      );
      this.lastBatch = {
        bodies: count,
        commands: this.queue.count,
        requestedCommands: this.requested,
        uploadedBytes: batch.lastBatch.uploadedBytes,
        path: "packed-motion",
        submissions: encoder ? 0 : 1,
      };
    } else {
      this.upload ??= new CommandStaging();
      this.upload.count = 0;
      this.upload.reserve(this.queue.count);
      if (!this.rangeData || this.rangeData.length < count * 2)
        this.rangeData = new Uint32Array(
          Math.max(count * 2, (this.rangeData?.length ?? 0) * 2, 128),
        );
      let cursor = 0,
        i = 0;
      for (const range of this.pending.values()) {
        this.rangeData[i++] = cursor;
        this.rangeData[i++] = range.length;
        for (let slot = range.head; slot !== -1; slot = this.next[slot]) {
          for (let k = 0; k < 12; k++)
            this.upload.u32[cursor * 12 + k] = this.queue.u32[slot * 12 + k];
          cursor++;
        }
      }
      const bytes = cursor * 48,
        rangeBytes = count * 8;
      const limit = Math.min(
        d.limits.maxStorageBufferBindingSize,
        d.limits.maxBufferSize,
      );
      if (bytes > limit || rangeBytes > limit)
        throw Error("Body command batch exceeds GPU buffer limits");
      for (const [name, size] of [
        ["commands", bytes],
        ["ranges", rangeBytes],
      ]) {
        if (!this[name] || this[name].size < size) {
          this[name]?.destroy();
          this[name] = d.createBuffer({
            size: Math.min(limit, Math.max(size * 2, 16)),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
          });
        }
      }
      d.queue.writeBuffer(this.commands, 0, this.upload.words.buffer, 0, bytes);
      d.queue.writeBuffer(this.ranges, 0, this.rangeData.buffer, 0, rangeBytes);
      this.pipeline ??= d.createComputePipeline({
        layout: "auto",
        compute: {
          entryPoint: "edit",
          module: d.createShaderModule({
            code:
              "const DISPATCH_STRIDE = " +
              d.limits.maxComputeWorkgroupsPerDimension * 64 +
              "u;\n" +
              this.shader,
          }),
        },
      });
      if (
        !this.group ||
        this.boundBody !== this.solver.bodyBuffer ||
        this.boundCommands !== this.commands ||
        this.boundRanges !== this.ranges ||
        this.boundRangeBytes !== rangeBytes
      ) {
        this.group = d.createBindGroup({
          layout: this.pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: this.solver.bodyBuffer } },
            { binding: 1, resource: { buffer: this.commands } },
            { binding: 2, resource: { buffer: this.ranges, size: rangeBytes } },
          ],
        });
        this.boundBody = this.solver.bodyBuffer;
        this.boundCommands = this.commands;
        this.boundRanges = this.ranges;
        this.boundRangeBytes = rangeBytes;
      }
      const e = encoder ?? d.createCommandEncoder(),
        pass = e.beginComputePass();
      pass.setPipeline(this.pipeline);
      pass.setBindGroup(0, this.group);
      const groups = Math.ceil(count / 64),
        max = d.limits.maxComputeWorkgroupsPerDimension;
      pass.dispatchWorkgroups(Math.min(groups, max), Math.ceil(groups / max));
      pass.end();
      this.encodeAfterEdits(e, count);
      if (!encoder) d.queue.submit([e.finish()]);
      this.lastBatch = {
        bodies: count,
        commands: cursor,
        requestedCommands: this.requested,
        uploadedBytes: bytes + rangeBytes,
        path: "ordered-commands",
        submissions: encoder ? 0 : 1,
      };
    }
    for (const range of this.pending.values()) this.freeRanges.push(range);
    this.pending.clear();
    this.queue.count = 0;
    this.requested = 0;
    this.linearOnly = true;
    this.angularOnly = true;
    this.motionOnly = true;
    this.hasTeleports = false;
  }
  encodeAfterEdits() {}
  destroy() {
    this.commands?.destroy();
    this.ranges?.destroy();
    this.solver.velocityBatch?.destroy();
    this.solver.angularVelocityBatch?.destroy();
    this.motionBatch?.destroy();
    this.freeRanges.length = 0;
    this.pending.clear();
    this.queue =
      this.upload =
      this.next =
      this.linearIndices =
      this.linearValues =
      this.rangeData =
      this.motionData =
      this.motionFloats =
        null;
    this.group = null;
  }
}
