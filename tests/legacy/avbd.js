import { GpuTimer } from "../../src/gpu/gpuTimer.js";
import avbdWGSL from "./avbd.wgsl";

const BYTE_U32 = 4;
const BYTE_F32 = 4;
const PARAM_BYTES = 112;
const BODY_F32_STRIDE = 20;
const BODY_BYTE_STRIDE = BODY_F32_STRIDE * BYTE_F32;
const BODY_ACTIVE = 1;
const DEFAULT_BUFFER_POOL_BYTES = 192 * 1024 * 1024;

export const SHAPE_SPHERE = 0;
export const SHAPE_BOX = 1;
export const SHAPE_TRIANGLE = 2;
export const SHAPE_CAPSULE = 3;
export const SHAPE_CYLINDER = 4;
export const SHAPE_TRIANGLE_MESH = 5;

function alignTo(value, alignment) {
  return Math.ceil(value / alignment) * alignment;
}

function nextPow2(value) {
  return 1 << Math.ceil(Math.log2(Math.max(1, value)));
}

function assertWebGPU() {
  if (!navigator.gpu) {
    throw new Error(
      "WebGPU is not available. Use Chrome/Edge with WebGPU enabled and serve this page from http:// or https://.",
    );
  }
}

function makeUsageKey(usage) {
  return String(usage >>> 0);
}

function ensureArray(value, name) {
  if (!value || typeof value.length !== "number") {
    throw new Error(`${name} must be a typed array`);
  }
}

function inferVecLane(array, count, name) {
  if (array.length >= count * 4) {
    return 4;
  }
  if (array.length >= count * 3) {
    return 3;
  }
  throw new Error(`${name} length must be at least count * 3 or count * 4`);
}

function unpackBodyPositions(srcF32, dst, count) {
  for (let i = 0; i < count; i += 1) {
    const s = i * BODY_F32_STRIDE;
    const d = i * 3;
    dst[d + 0] = srcF32[s + 0];
    dst[d + 1] = srcF32[s + 1];
    dst[d + 2] = srcF32[s + 2];
  }
  return dst;
}

function getArrayValue(array, index, fallback = 0) {
  return array ? (array[index] ?? fallback) : fallback;
}

export class GPUBufferRecycler {
  constructor(device, options = {}) {
    this.device = device;
    this.maxFreeBytes = options.maxFreeBytes ?? DEFAULT_BUFFER_POOL_BYTES;
    this.freeBytes = 0;
    this.free = new Map();
    this.all = new Set();
  }

  acquire(byteSize, usage, label = "recycled-buffer") {
    const size = alignTo(Math.max(4, byteSize), 4);
    const key = makeUsageKey(usage);
    const bin = this.free.get(key);
    if (bin) {
      let bestIndex = -1;
      let bestSize = Infinity;
      for (let i = 0; i < bin.length; i += 1) {
        const item = bin[i];
        if (item.size >= size && item.size < bestSize) {
          bestIndex = i;
          bestSize = item.size;
        }
      }
      if (bestIndex >= 0) {
        const [item] = bin.splice(bestIndex, 1);
        this.freeBytes -= item.size;
        return item.buffer;
      }
    }

    const buffer = this.device.createBuffer({
      label,
      size,
      usage,
      mappedAtCreation: false,
    });
    this.all.add(buffer);
    return buffer;
  }

  release(buffer, byteSize, usage) {
    if (!buffer) {
      return;
    }
    const size = alignTo(Math.max(4, byteSize), 4);
    if (this.freeBytes + size > this.maxFreeBytes) {
      buffer.destroy();
      this.all.delete(buffer);
      return;
    }
    const key = makeUsageKey(usage);
    let bin = this.free.get(key);
    if (!bin) {
      bin = [];
      this.free.set(key, bin);
    }
    bin.push({ buffer, size, usage });
    this.freeBytes += size;
  }

  trim(maxFreeBytes = this.maxFreeBytes) {
    this.maxFreeBytes = maxFreeBytes;
    for (const [key, bin] of this.free.entries()) {
      while (this.freeBytes > this.maxFreeBytes && bin.length > 0) {
        const item = bin.pop();
        item.buffer.destroy();
        this.all.delete(item.buffer);
        this.freeBytes -= item.size;
      }
      if (bin.length === 0) {
        this.free.delete(key);
      }
    }
  }

  destroy() {
    for (const buffer of this.all) {
      buffer.destroy();
    }
    this.free.clear();
    this.all.clear();
    this.freeBytes = 0;
  }
}

export class TypedScratchPool {
  constructor() {
    this.f32 = new Map();
    this.u32 = new Map();
    this.u8 = new Map();
  }

  getF32(name, length) {
    const cap = nextPow2(length);
    let arr = this.f32.get(name);
    if (!arr || arr.length < length) {
      arr = new Float32Array(cap);
      this.f32.set(name, arr);
    }
    return arr.subarray(0, length);
  }

  getU32(name, length) {
    const cap = nextPow2(length);
    let arr = this.u32.get(name);
    if (!arr || arr.length < length) {
      arr = new Uint32Array(cap);
      this.u32.set(name, arr);
    }
    return arr.subarray(0, length);
  }

  getU8(name, length) {
    const cap = nextPow2(length);
    let arr = this.u8.get(name);
    if (!arr || arr.length < length) {
      arr = new Uint8Array(cap);
      this.u8.set(name, arr);
    }
    return arr.subarray(0, length);
  }
}

export async function createWebGPUDevice(options = {}) {
  assertWebGPU();
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: options.powerPreference ?? "high-performance",
  });
  if (!adapter) {
    throw new Error("No WebGPU adapter was returned.");
  }

  const requiredLimits = {};
  if (options.requiredLimits) {
    for (const [key, value] of Object.entries(options.requiredLimits)) {
      if (adapter.limits[key] !== undefined) {
        requiredLimits[key] = Math.min(value, adapter.limits[key]);
      }
    }
  }

  const request =
    Object.keys(requiredLimits).length > 0 ? { requiredLimits } : {};
  if (adapter.features.has("timestamp-query"))
    request.requiredFeatures = ["timestamp-query"];
  const device = await adapter.requestDevice(request);
  device.lost.then((info) => {
    console.warn("[AVBD] WebGPU device lost:", info.reason, info.message);
  });
  return { adapter, device };
}

export class AVBDSolverGPU {
  static async create(device, options = {}) {
    const shaderCode = options.shaderCode ?? avbdWGSL;
    const module = device.createShaderModule({ code: shaderCode });
    const info = await module.getCompilationInfo();
    const errors = info.messages.filter((message) => message.type === "error");
    if (errors.length)
      throw new Error(
        errors
          .map((message) => `AVBD line ${message.lineNum}: ${message.message}`)
          .join("\n"),
      );
    return new AVBDSolverGPU(device, shaderCode, options);
  }

  constructor(device, shaderCode, options = {}) {
    this.device = device;
    this.recycler =
      options.recycler ??
      new GPUBufferRecycler(device, {
        maxFreeBytes: options.maxFreeBytes,
      });
    this.ownsRecycler = !options.recycler;
    this.scratch = options.scratch ?? new TypedScratchPool();

    this.bodyCap = Math.max(1, options.bodyCap ?? 1024);
    this.neighborCap = Math.max(1, options.neighborCap ?? this.bodyCap * 8);
    this.bodyCount = 0;
    this.neighborCount = 0;

    this.params = {
      dt: 1 / 60,
      beta: options.beta ?? 24,
      lamMin: options.lamMin ?? -100000,
      lamMax: options.lamMax ?? 100000,
      worldMin: options.worldMin ?? [-1.4, -0.9, -1.0],
      worldMax: options.worldMax ?? [1.4, 0.9, 1.0],
      globalAccel: options.globalAccel ?? [0, -3.5, 0],
      damping: options.damping ?? 0.992,
      kStart: options.kStart ?? 12,
      kMax: options.kMax ?? 50000,
      lambdaDecay: options.lambdaDecay ?? 0.97,
      stiffnessDecay: options.stiffnessDecay ?? 0.985,
      contactSlop: options.contactSlop ?? 0.0005,
      iterations: options.iterations ?? 4,
    };

    this.usages = {
      storage:
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST |
        GPUBufferUsage.COPY_SRC,
      uniform: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      readback: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    };

    this.bytes = new Map();
    this.buffers = {};
    this._paramsScratch = new ArrayBuffer(PARAM_BYTES);
    this._bodyCpu = new ArrayBuffer(this.bodyCap * BODY_BYTE_STRIDE);
    this._bodyF32 = new Float32Array(this._bodyCpu);
    this._bodyU32 = new Uint32Array(this._bodyCpu);

    this.module = device.createShaderModule({
      label: "avbd-module",
      code: shaderCode,
    });
    const bindGroupLayout = device.createBindGroupLayout({
      entries: [0, 1, 2, 3, 4, 5, 6].map((binding) => ({
        binding,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type:
            binding === 4
              ? "uniform"
              : [1, 2, 5].includes(binding)
                ? "read-only-storage"
                : "storage",
        },
      })),
    });
    const layout = device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });
    this.pipeline = device.createComputePipeline({
      label: "avbd-pipeline",
      layout,
      compute: { module: this.module, entryPoint: "avbdMultiShape" },
    });

    this.predictPipeline = device.createComputePipeline({
      layout,
      compute: { module: this.module, entryPoint: "predictBodies" },
    });
    this.dualPipeline = device.createComputePipeline({
      layout,
      compute: { module: this.module, entryPoint: "updateContactDuals" },
    });
    this.timer = new GpuTimer(device);
    this._allocBuffers();
    this._rebuildBindGroup();
  }

  _bufferByteSize(name, caps = this) {
    switch (name) {
      case "snapshot":
      case "bodies":
        return caps.bodyCap * BODY_BYTE_STRIDE;
      case "dynOffsets":
        return (caps.bodyCap + 1) * BYTE_U32;
      case "dynNeighbors":
        return caps.neighborCap * BYTE_U32;
      case "prediction":
        return caps.bodyCap * 32;
      case "warmStart":
        return (caps.neighborCap + caps.bodyCap * 6) * 16;
      case "params":
        return PARAM_BYTES;
      default:
        throw new Error(`unknown buffer: ${name}`);
    }
  }

  _makeBuffer(name, size, usage) {
    const buffer = this.recycler.acquire(size, usage, `avbd-${name}`);
    this.bytes.set(name, size);
    return buffer;
  }

  _allocBuffers() {
    const S = this.usages.storage;
    this.buffers.snapshot = this._makeBuffer(
      "snapshot",
      this._bufferByteSize("snapshot"),
      S,
    );
    this.buffers.prediction = this._makeBuffer(
      "prediction",
      this._bufferByteSize("prediction"),
      S,
    );
    this.buffers.bodies = this._makeBuffer(
      "bodies",
      this._bufferByteSize("bodies"),
      S,
    );
    this.buffers.dynOffsets = this._makeBuffer(
      "dynOffsets",
      this._bufferByteSize("dynOffsets"),
      S,
    );
    this.buffers.dynNeighbors = this._makeBuffer(
      "dynNeighbors",
      this._bufferByteSize("dynNeighbors"),
      S,
    );
    this.buffers.warmStart = this._makeBuffer(
      "warmStart",
      this._bufferByteSize("warmStart"),
      S,
    );
    this.buffers.params = this._makeBuffer(
      "params",
      this._bufferByteSize("params"),
      this.usages.uniform,
    );
  }

  _releaseBuffer(name) {
    const buffer = this.buffers[name];
    if (!buffer) {
      return;
    }
    const usage = name === "params" ? this.usages.uniform : this.usages.storage;
    this.recycler.release(buffer, this.bytes.get(name), usage);
    delete this.buffers[name];
    this.bytes.delete(name);
  }

  _rebuildBindGroup() {
    this.bindGroup = this.device.createBindGroup({
      label: "avbd-main-bg",
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.buffers.bodies } },
        { binding: 1, resource: { buffer: this.buffers.dynOffsets } },
        { binding: 2, resource: { buffer: this.buffers.dynNeighbors } },
        { binding: 3, resource: { buffer: this.buffers.warmStart } },
        { binding: 4, resource: { buffer: this.buffers.params } },
        { binding: 5, resource: { buffer: this.buffers.snapshot } },
        { binding: 6, resource: { buffer: this.buffers.prediction } },
      ],
    });
  }

  _copyOldBuffer(oldBuffer, newBuffer, bytes) {
    const enc = this.device.createCommandEncoder();
    enc.copyBufferToBuffer(oldBuffer, 0, newBuffer, 0, alignTo(bytes, 4));
    this.device.queue.submit([enc.finish()]);
  }

  _growBodyMirror(nextBodyCap) {
    if (nextBodyCap <= this.bodyCap) {
      return;
    }
    const next = new ArrayBuffer(nextBodyCap * BODY_BYTE_STRIDE);
    new Uint8Array(next).set(new Uint8Array(this._bodyCpu));
    this._bodyCpu = next;
    this._bodyF32 = new Float32Array(this._bodyCpu);
    this._bodyU32 = new Uint32Array(this._bodyCpu);
  }

  ensureCapacity({
    bodyCap = this.bodyCap,
    neighborCap = this.neighborCap,
  } = {}) {
    const next = {
      bodyCap: Math.max(this.bodyCap, nextPow2(bodyCap)),
      neighborCap: Math.max(
        this.neighborCap,
        nextPow2(Math.max(1, neighborCap)),
      ),
    };

    const grewBodies = next.bodyCap !== this.bodyCap;
    const grewNeighbors = next.neighborCap !== this.neighborCap;
    if (!grewBodies && !grewNeighbors) {
      return false;
    }

    const oldCaps = {
      bodyCap: this.bodyCap,
      neighborCap: this.neighborCap,
    };
    const old = this.buffers;
    this.buffers = { ...old };
    this._growBodyMirror(next.bodyCap);
    this.bodyCap = next.bodyCap;
    this.neighborCap = next.neighborCap;

    const replace = (name) => {
      const oldBuffer = old[name];
      const oldBytes = this._bufferByteSize(name, oldCaps);
      const newBytes = this._bufferByteSize(name, this);
      const usage =
        name === "params" ? this.usages.uniform : this.usages.storage;
      const newBuffer = this._makeBuffer(name, newBytes, usage);
      this._copyOldBuffer(oldBuffer, newBuffer, Math.min(oldBytes, newBytes));
      this.recycler.release(oldBuffer, oldBytes, usage);
      this.buffers[name] = newBuffer;
    };

    if (grewBodies) {
      ["bodies", "snapshot", "prediction", "dynOffsets"].forEach(replace);
    }
    if (grewBodies || grewNeighbors) replace("warmStart");
    if (grewNeighbors) {
      replace("dynNeighbors");
    }

    this._rebuildBindGroup();
    return true;
  }

  _packBodyRange(start, count, fields = {}) {
    const { pos, vel, mass, accel, shapeType, shapeParam, active } = fields;

    const posLane = pos ? inferVecLane(pos, count, "pos") : 0;
    const velLane = vel ? inferVecLane(vel, count, "vel") : 0;
    const accelLane = accel ? inferVecLane(accel, count, "accel") : 0;
    if (shapeParam && shapeParam.length < count * 4) {
      throw new Error("shapeParam length must be at least count * 4.");
    }

    for (let local = 0; local < count; local += 1) {
      const id = start + local;
      const b = id * BODY_F32_STRIDE;

      if (pos) {
        const s = local * posLane;
        this._bodyF32[b + 0] = pos[s + 0] ?? 0;
        this._bodyF32[b + 1] = pos[s + 1] ?? 0;
        this._bodyF32[b + 2] = pos[s + 2] ?? 0;
        this._bodyF32[b + 3] = posLane === 4 ? (pos[s + 3] ?? 1) : 1;
      }

      if (vel) {
        const s = local * velLane;
        this._bodyF32[b + 4] = vel[s + 0] ?? 0;
        this._bodyF32[b + 5] = vel[s + 1] ?? 0;
        this._bodyF32[b + 6] = vel[s + 2] ?? 0;
        this._bodyF32[b + 7] = velLane === 4 ? (vel[s + 3] ?? 0) : 0;
      }

      if (accel) {
        const s = local * accelLane;
        this._bodyF32[b + 8] = accel[s + 0] ?? 0;
        this._bodyF32[b + 9] = accel[s + 1] ?? 0;
        this._bodyF32[b + 10] = accel[s + 2] ?? 0;
      }

      if (mass) {
        this._bodyF32[b + 11] = mass[local] ?? 0;
      }

      if (shapeParam) {
        const s = local * 4;
        this._bodyF32[b + 12] = shapeParam[s + 0] ?? 0;
        this._bodyF32[b + 13] = shapeParam[s + 1] ?? 0;
        this._bodyF32[b + 14] = shapeParam[s + 2] ?? 0;
        this._bodyF32[b + 15] = shapeParam[s + 3] ?? 0;
      }

      if (shapeType) {
        this._bodyU32[b + 16] = shapeType[local] ?? 0;
      }

      if (active) {
        const enabled = active[local] ? BODY_ACTIVE : 0;
        this._bodyU32[b + 17] =
          (this._bodyU32[b + 17] & ~BODY_ACTIVE) | enabled;
      }
    }
  }

  setBodies({ count, pos, vel, mass, accel, shapeType, shapeParam, active }) {
    if (count == null) {
      if (pos) {
        count = pos.length % 4 === 0 ? pos.length / 4 : pos.length / 3;
      } else if (mass) {
        count = mass.length;
      } else if (shapeType) {
        count = shapeType.length;
      } else {
        throw new Error(
          "setBodies requires count when no array gives the body count.",
        );
      }
    }
    count = Math.floor(count);
    const bodyCountChanged = count !== this.bodyCount;
    this.ensureCapacity({ bodyCap: count });
    this.bodyCount = count;

    new Uint8Array(this._bodyCpu, 0, count * BODY_BYTE_STRIDE).fill(0);

    const defaultActive = this.scratch.getU8("defaultActive", count);
    defaultActive.fill(1);
    this._packBodyRange(0, count, {
      pos,
      vel,
      mass,
      accel,
      shapeType,
      shapeParam,
      active: active ?? defaultActive,
    });

    this.device.queue.writeBuffer(
      this.buffers.bodies,
      0,
      this._bodyCpu,
      0,
      count * BODY_BYTE_STRIDE,
    );

    if (bodyCountChanged) {
      const emptyOffsets = this.scratch.getU32("emptyOffsets", count + 1);
      emptyOffsets.fill(0);
      this.device.queue.writeBuffer(
        this.buffers.dynOffsets,
        0,
        emptyOffsets,
        0,
        count + 1,
      );
      this.neighborCount = 0;
    }
  }

  configureFixedNeighborLayout(maxNeighbors) {
    maxNeighbors = Math.max(1, Math.floor(maxNeighbors));
    const required = this.bodyCount * maxNeighbors;
    this.ensureCapacity({ neighborCap: required });
    const offsets = this.scratch.getU32(
      "fixedNeighborOffsets",
      this.bodyCount + 1,
    );
    for (let i = 0; i <= this.bodyCount; i += 1) {
      offsets[i] = i * maxNeighbors;
    }
    this.device.queue.writeBuffer(
      this.buffers.dynOffsets,
      0,
      offsets,
      0,
      this.bodyCount + 1,
    );
    const empty = this.scratch.getU32("fixedNeighborEmpty", required);
    empty.fill(0xffffffff);
    this.device.queue.writeBuffer(
      this.buffers.dynNeighbors,
      0,
      empty,
      0,
      required,
    );
    this.neighborCount = required;
  }

  getGpuBuffers() {
    return {
      bodies: this.buffers.bodies,
      neighbors: this.buffers.dynNeighbors,
    };
  }

  setBodyRange({
    start = 0,
    count,
    pos,
    vel,
    mass,
    accel,
    shapeType,
    shapeParam,
    active,
  }) {
    start = Math.floor(start);
    if (count == null) {
      if (pos) {
        count = pos.length % 4 === 0 ? pos.length / 4 : pos.length / 3;
      } else if (mass) {
        count = mass.length;
      } else if (shapeType) {
        count = shapeType.length;
      } else if (shapeParam) {
        count = shapeParam.length / 4;
      } else if (active) {
        count = active.length;
      } else {
        throw new Error(
          "setBodyRange requires count when no array gives the range length.",
        );
      }
    }
    count = Math.floor(count);
    if (start < 0 || count < 0 || start + count > this.bodyCap) {
      throw new Error("setBodyRange is outside the current body capacity.");
    }

    this._packBodyRange(start, count, {
      pos,
      vel,
      mass,
      accel,
      shapeType,
      shapeParam,
      active,
    });
    this.device.queue.writeBuffer(
      this.buffers.bodies,
      start * BODY_BYTE_STRIDE,
      this._bodyCpu,
      start * BODY_BYTE_STRIDE,
      count * BODY_BYTE_STRIDE,
    );
  }

  setNeighbors(offsets, indices) {
    ensureArray(offsets, "offsets");
    ensureArray(indices, "indices");
    if (offsets.length < this.bodyCount + 1) {
      throw new Error("offsets length must be bodyCount + 1.");
    }
    this.ensureCapacity({ neighborCap: indices.length });
    this.neighborCount = indices.length;
    this.device.queue.writeBuffer(
      this.buffers.dynOffsets,
      0,
      offsets,
      0,
      this.bodyCount + 1,
    );
    if (indices.length > 0) {
      this.device.queue.writeBuffer(
        this.buffers.dynNeighbors,
        0,
        indices,
        0,
        indices.length,
      );
    }
  }

  resetWarmStart() {
    const words = this.bytes.get("warmStart") / BYTE_F32;
    const zeros = this.scratch.getF32("warmStartZeros", words);
    zeros.fill(0);
    this.device.queue.writeBuffer(
      this.buffers.warmStart,
      0,
      zeros,
      0,
      words,
    );
  }

  resetWarmStartRange(start = 0, count = this.bodyCount - start) {
    start = Math.floor(start);
    count = Math.floor(count);
    if (start < 0 || count < 0 || start + count > this.bodyCap) {
      throw new Error(
        "resetWarmStartRange is outside the current body capacity.",
      );
    }
    // Directed pair slots can include an incoming contact from any other body.
    // Clear all pair duals; world contacts have six contiguous slots per body.
    const pairZeros = this.scratch.getF32("warmStartPairZeros", this.neighborCount * 4);
    pairZeros.fill(0);
    if (this.neighborCount) this.device.queue.writeBuffer(
      this.buffers.warmStart, 0, pairZeros, 0, this.neighborCount * 4,
    );
    const zeros = this.scratch.getF32("warmStartRangeZeros", count * 6 * 4);
    zeros.fill(0);
    this.device.queue.writeBuffer(
      this.buffers.warmStart,
      (this.neighborCount + start * 6) * 16,
      zeros,
      0,
      count * 6 * 4,
    );
  }

  _packParams(config = {}) {
    Object.assign(this.params, config);
    const f32 = new Float32Array(this._paramsScratch);
    const u32 = new Uint32Array(this._paramsScratch);
    f32.fill(0);

    f32[0] = this.params.dt;
    f32[1] = this.params.beta;
    f32[2] = this.params.lamMin;
    f32[3] = this.params.lamMax;

    u32[4] = this.bodyCount;
    u32[5] = this.neighborCount;
    u32[6] = 0;
    u32[7] = 0;

    f32[8] = this.params.worldMin[0];
    f32[9] = this.params.worldMin[1];
    f32[10] = this.params.worldMin[2];
    f32[11] = 0;

    f32[12] = this.params.worldMax[0];
    f32[13] = this.params.worldMax[1];
    f32[14] = this.params.worldMax[2];
    f32[15] = 0;

    f32[16] = this.params.globalAccel[0];
    f32[17] = this.params.globalAccel[1];
    f32[18] = this.params.globalAccel[2];
    f32[19] = 0;

    f32[20] = this.params.damping;
    f32[21] = this.params.kStart;
    f32[22] = this.params.kMax;
    f32[23] = this.params.lambdaDecay;

    f32[24] = this.params.stiffnessDecay;
    f32[25] = this.params.contactSlop;
    u32[26] = this.params.iterations;
    u32[27] = 0;

    return this._paramsScratch;
  }

  step(config = {}) {
    if (this.bodyCount <= 0) {
      return;
    }
    const packed = this._packParams(config);
    this.device.queue.writeBuffer(this.buffers.params, 0, packed);

    const enc = this.device.createCommandEncoder({
      label: "avbd-step-encoder",
    });
    const slot = this.timer.begin();
    const dispatch = (pipeline, descriptor = {}) => {
      const pass = enc.beginComputePass(descriptor);
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, this.bindGroup);
      pass.dispatchWorkgroups(Math.ceil(this.bodyCount / 64));
      pass.end();
    };
    enc.copyBufferToBuffer(
      this.buffers.bodies,
      0,
      this.buffers.snapshot,
      0,
      this.bodyCount * BODY_BYTE_STRIDE,
    );
    dispatch(this.predictPipeline);
    // Dispatch boundaries provide global synchronization across all workgroups.
    for (let i = 0; i < Math.max(1, this.params.iterations); i++) {
      enc.copyBufferToBuffer(
        this.buffers.bodies,
        0,
        this.buffers.snapshot,
        0,
        this.bodyCount * BODY_BYTE_STRIDE,
      );
      const timestampWrites = slot
        ? {
            querySet: slot.query,
            ...(i === 0 ? { beginningOfPassWriteIndex: 0 } : {}),
          }
        : null;
      dispatch(
        this.pipeline,
        timestampWrites &&
          (timestampWrites.beginningOfPassWriteIndex !== undefined ||
            timestampWrites.endOfPassWriteIndex !== undefined)
          ? { timestampWrites }
          : {},
      );
      enc.copyBufferToBuffer(
        this.buffers.bodies,
        0,
        this.buffers.snapshot,
        0,
        this.bodyCount * BODY_BYTE_STRIDE,
      );
      dispatch(
        this.dualPipeline,
        slot && i === Math.max(1, this.params.iterations) - 1
          ? {
              timestampWrites: { querySet: slot.query, endOfPassWriteIndex: 1 },
            }
          : {},
      );
    }
    this.timer.encode(enc, slot);
    this.device.queue.submit([enc.finish()]);
    this.timer.resolve(slot);
  }

  async readPositions(target = new Float32Array(this.bodyCount * 3)) {
    const count = this.bodyCount;
    if (target.length < count * 3) {
      throw new Error("target is too small for readPositions.");
    }
    const bytes = count * BODY_BYTE_STRIDE;
    const staging = this.recycler.acquire(
      bytes,
      this.usages.readback,
      "avbd-readback-bodies",
    );
    const enc = this.device.createCommandEncoder({
      label: "avbd-readback-bodies-encoder",
    });
    enc.copyBufferToBuffer(this.buffers.bodies, 0, staging, 0, bytes);
    this.device.queue.submit([enc.finish()]);
    await staging.mapAsync(GPUMapMode.READ);
    const src = new Float32Array(
      staging.getMappedRange(),
      0,
      count * BODY_F32_STRIDE,
    );
    unpackBodyPositions(src, target, count);
    staging.unmap();
    this.recycler.release(staging, bytes, this.usages.readback);
    return target.subarray(0, count * 3);
  }

  destroy() {
    this.timer.destroy();
    for (const name of Object.keys(this.buffers)) {
      this._releaseBuffer(name);
    }
    if (this.ownsRecycler) {
      this.recycler.destroy();
    }
  }
}

export class PositionReadbackRing {
  constructor(solver, options = {}) {
    this.solver = solver;
    this.device = solver.device;
    this.recycler = solver.recycler;
    this.slotCount = Math.max(2, options.slotCount ?? 3);
    this.usage = GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST;
    this.slots = [];
    this.cursor = 0;
    this.count = 0;
    this.bytes = 0;
    this.latest = options.initialPositions
      ? new Float32Array(options.initialPositions)
      : new Float32Array(0);
    this.generation = 0;
    this.destroyed = false;
  }

  _releaseSlots() {
    for (const slot of this.slots) {
      if (!slot.pending && slot.buffer) {
        this.recycler.release(slot.buffer, this.bytes, this.usage);
      } else if (slot.buffer) {
        slot.releaseWhenDone = true;
      }
    }
    this.slots = [];
    this.bytes = 0;
  }

  _ensure(count) {
    const bytes = count * BODY_BYTE_STRIDE;
    if (
      this.count === count &&
      this.bytes === bytes &&
      this.slots.length === this.slotCount
    ) {
      return;
    }
    this._releaseSlots();
    this.count = count;
    this.bytes = bytes;
    if (this.latest.length < count * 3) {
      const next = new Float32Array(count * 3);
      next.set(
        this.latest.subarray(0, Math.min(this.latest.length, next.length)),
      );
      this.latest = next;
    }
    for (let i = 0; i < this.slotCount; i += 1) {
      this.slots.push({
        buffer: this.recycler.acquire(
          bytes,
          this.usage,
          `avbd-position-readback-ring-${i}`,
        ),
        target: new Float32Array(count * 3),
        pending: false,
        releaseWhenDone: false,
        generation: this.generation,
      });
    }
  }

  resetLatest(positions) {
    this.generation += 1;
    this.latest = new Float32Array(positions);
  }

  schedule() {
    if (this.destroyed || this.solver.bodyCount <= 0) {
      return this.latest;
    }
    const count = this.solver.bodyCount;
    this._ensure(count);

    let slot = null;
    for (let i = 0; i < this.slots.length; i += 1) {
      const idx = (this.cursor + i) % this.slots.length;
      if (!this.slots[idx].pending && this.slots[idx].buffer) {
        slot = this.slots[idx];
        this.cursor = (idx + 1) % this.slots.length;
        break;
      }
    }
    if (!slot) {
      return this.latest.subarray(0, count * 3);
    }

    slot.pending = true;
    slot.generation = this.generation;
    const enc = this.device.createCommandEncoder({
      label: "avbd-position-readback-ring-encoder",
    });
    enc.copyBufferToBuffer(
      this.solver.buffers.bodies,
      0,
      slot.buffer,
      0,
      this.bytes,
    );
    this.device.queue.submit([enc.finish()]);

    slot.buffer
      .mapAsync(GPUMapMode.READ)
      .then(() => {
        const src = new Float32Array(
          slot.buffer.getMappedRange(),
          0,
          count * BODY_F32_STRIDE,
        );
        unpackBodyPositions(src, slot.target, count);
        slot.buffer.unmap();
        if (slot.generation === this.generation) {
          this.latest = slot.target;
        }
        slot.pending = false;
        if (slot.releaseWhenDone || this.destroyed) {
          this.recycler.release(slot.buffer, this.bytes, this.usage);
          slot.buffer = null;
        }
      })
      .catch((error) => {
        console.warn("[AVBD] position readback failed:", error);
        slot.pending = false;
      });

    return this.latest.subarray(0, count * 3);
  }

  destroy() {
    this.destroyed = true;
    this._releaseSlots();
  }
}

export class RadiusNeighborBuilder {
  constructor(options = {}) {
    this.maxNeighbors = options.maxNeighbors ?? 16;
    this.cellSize = options.cellSize ?? 0.08;
    this.scratch = options.scratch ?? new TypedScratchPool();
    this.grid = new Map();
  }

  _key(x, y, z) {
    return `${x},${y},${z}`;
  }

  build({ positions, count, radius, active }) {
    ensureArray(positions, "positions");
    this.grid.clear();
    // A one-cell search must span the full query radius. Tiny configured cells
    // otherwise silently omit pairs more than one cell away.
    const cell = Math.max(this.cellSize || radius, radius, 0.0001);
    for (let i = 0; i < count; i += 1) {
      if (active && !active[i]) {
        continue;
      }
      const o = i * 3;
      const cx = Math.floor(positions[o + 0] / cell);
      const cy = Math.floor(positions[o + 1] / cell);
      const cz = Math.floor(positions[o + 2] / cell);
      const key = this._key(cx, cy, cz);
      let bucket = this.grid.get(key);
      if (!bucket) {
        bucket = [];
        this.grid.set(key, bucket);
      }
      bucket.push(i);
    }

    const offsets = this.scratch.getU32("radiusNeighborOffsets", count + 1);
    const indices = this.scratch.getU32(
      "radiusNeighborIndices",
      count * this.maxNeighbors,
    );
    const r2 = radius * radius;
    let cursor = 0;
    for (let i = 0; i < count; i += 1) {
      offsets[i] = cursor;
      if (active && !active[i]) {
        continue;
      }
      const o = i * 3;
      const px = positions[o + 0];
      const py = positions[o + 1];
      const pz = positions[o + 2];
      const cx = Math.floor(px / cell);
      const cy = Math.floor(py / cell);
      const cz = Math.floor(pz / cell);
      let added = 0;

      for (let dz = -1; dz <= 1; dz += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const bucket = this.grid.get(this._key(cx + dx, cy + dy, cz + dz));
            if (!bucket) {
              continue;
            }
            for (let n = 0; n < bucket.length; n += 1) {
              const j = bucket[n];
              if (j === i) {
                continue;
              }
              const jo = j * 3;
              const vx = positions[jo + 0] - px;
              const vy = positions[jo + 1] - py;
              const vz = positions[jo + 2] - pz;
              if (vx * vx + vy * vy + vz * vz <= r2) {
                if (cursor < indices.length && added < this.maxNeighbors) {
                  indices[cursor] = j;
                  cursor += 1;
                  added += 1;
                }
              }
            }
          }
        }
      }
    }
    offsets[count] = cursor;
    return {
      offsets: offsets.subarray(0, count + 1),
      indices: indices.subarray(0, cursor),
    };
  }
}

export class AABBNeighborBuilder {
  constructor(options = {}) {
    this.maxNeighbors = options.maxNeighbors ?? 48;
    this.cellSize = options.cellSize ?? 0.28;
    this.padding = options.padding ?? 0.015;
    this.scratch = options.scratch ?? new TypedScratchPool();
    this.grid = new Map();
  }

  _key(x, y, z) {
    return `${x},${y},${z}`;
  }

  _halfExtents(shapeType, shapeParam, i, padding) {
    const t = shapeType[i];
    const o = i * 4;
    if (t === SHAPE_BOX) {
      return [
        Math.max(0.0001, shapeParam[o + 0] + padding),
        Math.max(0.0001, shapeParam[o + 1] + padding),
        Math.max(0.0001, shapeParam[o + 2] + padding),
      ];
    }
    if (t === SHAPE_SPHERE) {
      const r = Math.max(0.0001, shapeParam[o + 0] + padding);
      return [r, r, r];
    }
    if (t === SHAPE_CAPSULE) {
      const r = Math.max(0.0001, shapeParam[o + 0] + padding);
      const half = Math.max(0.0001, shapeParam[o + 1]);
      const axis = Math.max(0, Math.min(2, Math.round(shapeParam[o + 2] || 0)));
      const h = [r, r, r];
      h[axis] = r + half;
      return h;
    }
    if (t === SHAPE_CYLINDER) {
      const r = Math.max(0.0001, shapeParam[o + 0] + padding);
      const half = Math.max(0.0001, shapeParam[o + 1]);
      const axis = Math.max(0, Math.min(2, Math.round(shapeParam[o + 2] ?? 1)));
      const h = [r, r, r];
      h[axis] = half + padding;
      return h;
    }
    if (t === SHAPE_TRIANGLE || t === SHAPE_TRIANGLE_MESH) {
      return [
        Math.max(0.0001, shapeParam[o + 0] + padding),
        Math.max(0.0001, shapeParam[o + 1] + padding),
        Math.max(0.0001, shapeParam[o + 2] + padding),
      ];
    }
    return [padding, padding, padding];
  }

  _cellRange(v0, v1, cell) {
    return [Math.floor(v0 / cell), Math.floor(v1 / cell)];
  }

  build({
    positions,
    shapeType,
    shapeParam,
    count,
    active,
    padding = this.padding,
  }) {
    ensureArray(positions, "positions");
    ensureArray(shapeType, "shapeType");
    ensureArray(shapeParam, "shapeParam");
    count = Math.floor(count ?? shapeType.length);

    const cell = Math.max(0.0001, this.cellSize);
    const minX = this.scratch.getF32("aabbMinX", count);
    const minY = this.scratch.getF32("aabbMinY", count);
    const minZ = this.scratch.getF32("aabbMinZ", count);
    const maxX = this.scratch.getF32("aabbMaxX", count);
    const maxY = this.scratch.getF32("aabbMaxY", count);
    const maxZ = this.scratch.getF32("aabbMaxZ", count);
    const stamp = this.scratch.getU32("aabbSeenStamp", count);
    stamp.fill(0);
    this.grid.clear();

    for (let i = 0; i < count; i += 1) {
      if (active && !active[i]) {
        minX[i] = minY[i] = minZ[i] = Infinity;
        maxX[i] = maxY[i] = maxZ[i] = -Infinity;
        continue;
      }

      const o = i * 3;
      const h = this._halfExtents(shapeType, shapeParam, i, padding);
      minX[i] = positions[o + 0] - h[0];
      minY[i] = positions[o + 1] - h[1];
      minZ[i] = positions[o + 2] - h[2];
      maxX[i] = positions[o + 0] + h[0];
      maxY[i] = positions[o + 1] + h[1];
      maxZ[i] = positions[o + 2] + h[2];

      const xr = this._cellRange(minX[i], maxX[i], cell);
      const yr = this._cellRange(minY[i], maxY[i], cell);
      const zr = this._cellRange(minZ[i], maxZ[i], cell);
      for (let z = zr[0]; z <= zr[1]; z += 1) {
        for (let y = yr[0]; y <= yr[1]; y += 1) {
          for (let x = xr[0]; x <= xr[1]; x += 1) {
            const key = this._key(x, y, z);
            let bucket = this.grid.get(key);
            if (!bucket) {
              bucket = [];
              this.grid.set(key, bucket);
            }
            bucket.push(i);
          }
        }
      }
    }

    const offsets = this.scratch.getU32("aabbNeighborOffsets", count + 1);
    const capacity = Math.max(1, count * this.maxNeighbors);
    const indices = this.scratch.getU32("aabbNeighborIndices", capacity);
    let cursor = 0;

    for (let i = 0; i < count; i += 1) {
      offsets[i] = cursor;
      if (active && !active[i]) {
        continue;
      }
      const xr = this._cellRange(minX[i], maxX[i], cell);
      const yr = this._cellRange(minY[i], maxY[i], cell);
      const zr = this._cellRange(minZ[i], maxZ[i], cell);
      const mark = i + 1;
      let added = 0;

      for (let z = zr[0]; z <= zr[1]; z += 1) {
        for (let y = yr[0]; y <= yr[1]; y += 1) {
          for (let x = xr[0]; x <= xr[1]; x += 1) {
            const bucket = this.grid.get(this._key(x, y, z));
            if (!bucket) {
              continue;
            }
            for (let n = 0; n < bucket.length; n += 1) {
              const j = bucket[n];
              if (j === i || stamp[j] === mark) {
                continue;
              }
              stamp[j] = mark;
              if (
                minX[i] <= maxX[j] &&
                maxX[i] >= minX[j] &&
                minY[i] <= maxY[j] &&
                maxY[i] >= minY[j] &&
                minZ[i] <= maxZ[j] &&
                maxZ[i] >= minZ[j]
              ) {
                if (cursor < indices.length && added < this.maxNeighbors) {
                  indices[cursor] = j;
                  cursor += 1;
                  added += 1;
                }
              }
            }
          }
        }
      }
    }
    offsets[count] = cursor;
    return {
      offsets: offsets.subarray(0, count + 1),
      indices: indices.subarray(0, cursor),
    };
  }
}
