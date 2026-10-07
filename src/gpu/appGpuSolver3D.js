import { GpuSolver3D } from "../../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import {
  protectSolverStep,
  projectedContactSolve,
  pointLanesContactSolve,
  withJointRestFrames,
} from "./gpuSolverKernels.js";
import { solveWGSL } from "../../reference/three-avbd/src/avbd3d/gpu/wgsl-solve.ts";
import constraintFrames from "./constraintFrames.wgsl";
import { WorldSleeping } from "./worldSleeping.js";
import {
  initialSpringMaterial,
  springMaterial,
  withSpringFracture,
} from "./springMaterial.js";
import { selectSolverMode } from "./solverPolicy.js";
import {
  Joint,
  Spring,
} from "../../reference/three-avbd/src/avbd3d/ref/forces.ts";
import { GpuHploc } from "./gpuHploc.js";
import { encodeGpuSolverStep } from "./gpuSolverStep.js";
import { cachedAdjacencyWGSL } from "./gpuTopologyKernels.js";
import { select } from "../../reference/three-avbd/src/avbd3d/gpu/radii.ts";
import { T_SPRING } from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";
import {
  sensorSolve,
  sensorContacts,
  sensorTopology,
  clearSensorFlags,
} from "./sensors.js";
import {
  makeContactsWGSL,
  refsWGSL,
} from "../../reference/three-avbd/src/avbd3d/gpu/wgsl-collision.ts";
import { portableContactRefs, portableContactCache } from "./contactCache3D.js";
import { Restitution } from "./restitution.js";
import {
  initialAngularConstraint,
  withAngularConstraints,
  angularConstraintOptions,
} from "./angularConstraints.js";
import angularFrames from "./angularFrames.wgsl";
import { isCapsule } from "./capsuleShape.js";
import { withCapsuleContacts } from "./capsuleCollision.js";
import { ShapeQueries } from "./shapeQueries.js";
import { propertyEdits } from "./bufferEdits.js";
import { writePassConstants } from "./passConstants.js";
import { gpuExecutionPolicy3D } from "./executionPolicy3D.js";

// A scene may need a minimum coloring budget while its contact graph changes.
// Preserve that budget after adaptation, which otherwise shrinks it following
// three quiet counter reads. This policy does not change the AVBD equations.
export class AppGpuSolver3D extends GpuSolver3D {
  writePassConstants(iterations, alpha) {
    writePassConstants.call(this, iterations, alpha);
  }
  constructor(device, ref, options = {}) {
    const executionPolicy = gpuExecutionPolicy3D(device);
    const angularConstraints = ref.forces.some((force) =>
      initialAngularConstraint(force),
    );
    const springFracture = ref.forces.some((force) => {
      const material = initialSpringMaterial(force);
      return (
        material &&
        (Number.isFinite(material.breakStrain) ||
          Number.isFinite(material.breakForce))
      );
    });
    const policy = {
      requested: options.solverMode ?? "auto",
      contactScheduling: options.contactScheduling ?? "manifolds",
      custom: !!options.shaders?.solve,
    };
    const decision = selectSolverMode({
      ...policy,
      bodyCount: ref.bodies.length,
      constraintCount: ref.forces.filter(
        (f) => f instanceof Joint || f instanceof Spring,
      ).length,
    });
    const source =
      decision.selected === "custom"
        ? options.shaders.solve
        : decision.selected === "optimized"
          ? projectedContactSolve
          : decision.selected === "points"
            ? pointLanesContactSolve
            : undefined;
    const broadphase =
      executionPolicy?.broadphase ?? options.broadphase ?? "auto";
    if (!["grid", "hploc", "auto"].includes(broadphase))
      throw Error("broadphase must be 'grid', 'hploc' or 'auto'");
    const rebuildInterval = options.bvh?.rebuildInterval ?? 64;
    if (!Number.isInteger(rebuildInterval) || rebuildInterval < 1)
      throw Error("BVH rebuildInterval must be a positive integer");
    for (const [key, maximum] of [
      ["minimumColors", 64],
      ["minimumColorRounds", 32],
    ]) {
      const value = options[key] ?? 0;
      if (!Number.isInteger(value) || value < 0 || value > maximum)
        throw Error(`${key} must be an integer between 0 and ${maximum}`);
      if (key === "minimumColorRounds" && value % 2)
        throw Error("minimumColorRounds must be even");
    }
    super(device, ref, {
      ...options,
      shaders: {
        ...options.shaders,
        solve: protectSolverStep(
          withJointRestFrames(
            angularConstraints
              ? withAngularConstraints(
                  springFracture
                    ? withSpringFracture(source ?? solveWGSL)
                    : (source ?? solveWGSL),
                )
              : springFracture
                ? withSpringFracture(source ?? solveWGSL)
                : (source ?? solveWGSL),
          ),
        ),
      },
    });
    this.solverPolicy = policy;
    this.dispatchIsolation = executionPolicy?.dispatchIsolation ?? false;
    if (!options.shaders?.contacts) {
      const make = this.contactShaders.make;
      this.contactShaders.make = (code) => make(portableContactCache(code));
      this.contactShaders.make(makeContactsWGSL(this.hullShaders ?? false));
      this.pipes.updateRefs = device.createComputePipeline({
        label: "Portable contact references",
        layout: device.createPipelineLayout({
          bindGroupLayouts: [this.layouts.refs],
        }),
        compute: {
          module: device.createShaderModule({
            code: portableContactRefs(refsWGSL),
          }),
          entryPoint: "updateRefs",
        },
      });
    }
    this.springFracture = springFracture;
    this.angularConstraints = angularConstraints;
    this.customSolveSource = options.shaders?.solve;
    ref.forces.forEach((force, slot) => {
      const material = initialSpringMaterial(force);
      if (material) this.setSpringMaterial(slot, material);
    });
    this.adaptiveScheduling = options.adaptiveScheduling ?? true;
    this.defaultPrimalLanes = [...this.primalLanes];
    this.cacheAdjacencyKeys = options.cacheAdjacencyKeys;
    this.adjacencyPipelines = { original: this.pipes.sortAdjacency };
    this.selectAdjacencyPipeline();
    this.solverDecision = decision;
    this.solvePipelineCache = new Map([
      [
        decision.selected,
        Object.fromEntries(
          [
            "warmStartJoints",
            "warmStartBodies",
            "primal",
            "dual",
            "updateVelocities",
          ].map((k) => [k, this.pipes[k]]),
        ),
      ],
    ]);
    this.minimumColors = options.minimumColors ?? 0;
    this.minimumColorRounds = options.minimumColorRounds ?? 4;
    this.colorCap = Math.max(this.minimumColors, this.colorCap);
    this.colorRounds = Math.max(this.minimumColorRounds, this.colorRounds);
    this.broadphaseRequested = broadphase;
    this.broadphase = broadphase === "hploc" ? "hploc" : "grid";
    this.bvhOptions = options.bvh ?? {};
    this.bvh = null;
    this.detailCallback = null;
    this.detailTiming = null;
    this.profileErrors = [];
    this.selectBroadphase();
    ref.forces.forEach((force, slot) => {
      const material = initialAngularConstraint(force);
      if (material) this.setAngularConstraint(slot, material);
    });
    ref.bodies.forEach((body, index) => {
      if (isCapsule(body)) this.installCapsule(this.gpuIndex(index));
    });
  }
  installCapsule(index) {
    if (!this.capsulesEnabled) {
      if (this.contactShaders.custom)
        throw Error("Analytic capsules require the built-in contact kernel");
      this.capsulesEnabled = true;
      const make = this.contactShaders.make;
      this.contactShaders.make = (code) => make(withCapsuleContacts(code));
      this.contactShaders.make(makeContactsWGSL(this.hullShaders ?? false));
    }
    this.device.queue.writeBuffer(
      this.bodyBuffer,
      index * 160 + 156,
      new Float32Array([-1]),
    );
  }
  async raycast(origin, direction, options = {}) {
    const [hit] = await this.raycastAll(
      [{ origin, direction, maxDistance: options.maxDistance }],
      options,
    );
    return hit;
  }
  raycastAll(rays, options = {}) {
    this.flushPropertyEdits();
    this.shapeQueries ??= new ShapeQueries(this);
    return this.shapeQueries.cast(
      rays.map((r) => ({ ...r, radius: 0 })),
      options,
    );
  }
  async sphereCast(origin, radius, direction, options = {}) {
    const [hit] = await this.sphereCastAll(
      [{ origin, radius, direction, maxDistance: options.maxDistance }],
      options,
    );
    return hit;
  }
  sphereCastAll(casts, options = {}) {
    this.flushPropertyEdits();
    this.shapeQueries ??= new ShapeQueries(this);
    return this.shapeQueries.cast(casts, options);
  }
  selectBroadphase() {
    if (this.broadphaseRequested !== "auto") {
      this.broadphaseDecision = {
        requested: this.broadphaseRequested,
        selected: this.broadphase,
        reason: "Explicit selection",
      };
      return;
    }
    const radii = new Float64Array(this.bodyCount);
    let count = 0,
      dynamicCount = 0,
      thinPlateCount = 0;
    for (let i = 0; i < this.bodyCount; i++) {
      const body = this.bodies[i];
      if (body.radius > 0) radii[count++] = body.radius;
      if (body.dynamic) {
        dynamicCount++;
        const [a, b, c] = body.size;
        const lo = Math.min(a, b, c),
          hi = Math.max(a, b, c);
        const middle = a + b + c - lo - hi;
        if (
          !body.sphere &&
          !body.hull &&
          lo <= 0.4 * middle &&
          middle >= 0.5 * hi
        )
          thinPlateCount++;
      }
    }
    const median = count ? select(radii.subarray(0, count), count >> 1) : 1;
    const cellRatio = this.cellSize / (2 * median);
    const constraintCount = this.jointCount - this.freeSlots.length;
    const thinPlateFraction = dynamicCount ? thinPlateCount / dynamicCount : 0;
    const supported =
      this.bodyCapacity <=
        16 * this.device.limits.maxComputeWorkgroupsPerDimension &&
      (2 * this.bodyCapacity +
        16 * Math.ceil(Math.log2(Math.max(2, this.bodyCapacity))) +
        32) *
        32 <=
        this.device.limits.maxStorageBufferBindingSize;
    // Thin connected sheets leave much of each spherical grid cell empty.
    // The 24K ragdoll net benefits from AABB tree queries both during impact
    // and after settling. Keep ordinary bricks, rods and small scenes on the
    // existing policy; this changes candidate search, not contact acceptance.
    const connectedSheet =
      constraintCount >= this.bodyCount && thinPlateFraction >= 0.25;
    const tree =
      supported &&
      this.bodyCount >= 10000 &&
      (cellRatio >= 4 || connectedSheet);
    this.broadphase = tree ? "hploc" : "grid";
    this.broadphaseDecision = {
      requested: "auto",
      selected: this.broadphase,
      bodyCount: this.bodyCount,
      cellRatio,
      constraintCount,
      thinPlateFraction,
      reason: !supported
        ? "The GPU tree exceeds this adapter's limits; the grid is used"
        : tree
          ? connectedSheet
            ? "Many linked thin plates; the tree avoids empty grid-cell space"
            : "Large grid cells contain many smaller objects"
          : "Grid retained for this body count and size distribution",
    };
  }
  step() {
    this.selectAdjacencyPipeline();
    this.selectSolver();
    if (this.radiiDirty) {
      this.uploadStatics();
      this.selectBroadphase();
    }
    if (
      this.broadphaseRequested === "auto" &&
      this.broadphaseDecision.constraintCount !==
        this.jointCount - this.freeSlots.length
    )
      this.selectBroadphase();
    if (this.broadphase === "grid" && this.bvh) {
      this.bvh.destroy();
      this.bvh = null;
    }
    if (
      this.broadphase === "hploc" &&
      (!this.bvh || this.bvh.bodyBuffer !== this.bodyBuffer)
    ) {
      this.bvh?.destroy();
      this.bvh = new GpuHploc(this.device, this, this.bvhOptions);
    }
    if (
      this.dispatchIsolation ||
      this.bvh ||
      this.detailCallback ||
      this.sleeping ||
      this.restitution?.active.size ||
      this.bodyCommands?.pending.size ||
      this.propertyEdits?.pending ||
      this.externalBeforeStep
    )
      encodeGpuSolverStep(this);
    else super.step();
  }
  encodeStepPrelude(encoder) {
    this.flushPropertyEdits(encoder);
    this.sleeping?.before(encoder);
    this.bodyCommands?.flush(encoder);
    this.externalBeforeStep?.(encoder);
    this.restitution?.before(encoder);
  }
  encodeStepPostlude(encoder) {
    this.restitution?.after(encoder);
    this.sleeping?.after(encoder);
    this.externalAfterStep?.(encoder);
  }
  setRestitution(index, value) {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.bodyCount ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 1
    )
      throw Error(
        "Restitution requires a live body index and a value between 0 and 1",
      );
    if (value > 0 && !this.restitution)
      this.restitution = new Restitution(this);
    this.restitution?.set(index, value);
    this.wakeAll();
  }
  setSolverMode(requested) {
    selectSolverMode({
      ...this.solverPolicy,
      requested,
      bodyCount: this.bodyCount,
    });
    this.solverPolicy.requested = requested;
    this.selectSolver();
    return this.solverDecision;
  }
  solveSource(source) {
    if (this.springFracture) source = withSpringFracture(source);
    if (this.angularConstraints) source = withAngularConstraints(source);
    if (this.sensorsEnabled) source = sensorSolve(source);
    return protectSolverStep(withJointRestFrames(source));
  }
  setAngularConstraint(slot, options) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= this.jointCount)
      throw Error("Angular constraint needs a live slot");
    const material = angularConstraintOptions(options);
    this.flushPropertyEdits();
    if (!this.angularConstraints) {
      this.angularConstraints = true;
      this.rebuildSolvePipelines();
    }
    const data = new Float32Array(32);
    data[0] = data[1] = 1000;
    data[3] = 3e38;
    data.set(material.axisA, 24);
    data.set(material.axisB, 28);
    data[27] = material.type === "motor" ? material.speed : material.minAngle;
    data[31] =
      material.type === "motor" ? material.maxTorque : material.maxAngle;
    this.device.queue.writeBuffer(this.jointBuffer, slot * 128, data);
    this.info[slot * 4] = material.type === "motor" ? 3 : 4;
    this.device.queue.writeBuffer(
      this.infoBuffer,
      slot * 16,
      this.info.subarray(slot * 4, slot * 4 + 4),
    );
    this.captureAngularFrames([slot]);
    this.wakeAll();
  }
  captureAngularFrames(slots) {
    if (!slots.length) return;
    this.flushPropertyEdits();
    const d = this.device;
    this.angularFramePipeline ??= d.createComputePipeline({
      layout: "auto",
      compute: {
        module: d.createShaderModule({
          code: `const DISPATCH_STRIDE = ${d.limits.maxComputeWorkgroupsPerDimension * 64}u;\n${angularFrames.replaceAll("id.x", "(id.x+id.y*DISPATCH_STRIDE)")}`,
        }),
        entryPoint: "capture",
      },
    });
    this.runCapture(
      "angular",
      this.angularFramePipeline,
      Uint32Array.from(slots),
      slots.length,
    );
  }
  setMotor(slot, { speed, maxTorque } = {}) {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    if (this.info[slot * 4] !== 3)
      throw Error("Motor needs an active motor slot");
    if (speed !== undefined && !Number.isFinite(speed))
      throw Error("Motor speed must be finite");
    if (
      maxTorque !== undefined &&
      (!Number.isFinite(maxTorque) || maxTorque < 0)
    )
      throw Error("maxTorque must be nonnegative");
    if (speed !== undefined)
      propertyEdits(this).float(this.jointBuffer, slot * 32 + 27, speed);
    if (maxTorque !== undefined)
      propertyEdits(this).float(this.jointBuffer, slot * 32 + 31, maxTorque);
    this.wakeAll();
  }
  rebuildSolvePipelines() {
    this.solvePipelineCache.clear();
    const selected = this.solverDecision.selected;
    const source =
      selected === "custom"
        ? this.customSolveSource
        : selected === "optimized"
          ? projectedContactSolve
          : selected === "points"
            ? pointLanesContactSolve
            : solveWGSL;
    const module = this.device.createShaderModule({
      code: this.solveSource(source),
    });
    const layout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.layouts.solve, this.layouts.pass],
    });
    const pipelines = Object.fromEntries(
      [
        "warmStartJoints",
        "warmStartBodies",
        "primal",
        "dual",
        "updateVelocities",
      ].map((entryPoint) => [
        entryPoint,
        this.device.createComputePipeline({
          layout,
          compute: { module, entryPoint },
        }),
      ]),
    );
    Object.assign(this.pipes, pipelines);
    this.solvePipelineCache.set(selected, pipelines);
  }
  setSensor(index, enabled) {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.bodyCount ||
      typeof enabled !== "boolean"
    )
      throw Error("Sensor requires a live body index and boolean flag");
    if (enabled && !this.sensorsEnabled) {
      this.sensorsEnabled = true;
      clearSensorFlags(this);
      this.rebuildSolvePipelines();
      this.contactShaders.make(
        sensorContacts(makeContactsWGSL(this.hullShaders ?? false)),
      );
      const make = this.contactShaders.make;
      this.contactShaders.make = (code) => make(sensorContacts(code));
      const module = this.device.createShaderModule({ code: sensorTopology() });
      const layout = this.device.createPipelineLayout({
        bindGroupLayouts: [this.layouts.topo],
      });
      for (const entryPoint of ["degreeContacts", "fillContacts"])
        this.pipes[entryPoint] = this.device.createComputePipeline({
          layout,
          compute: { module, entryPoint },
        });
    }
    if (this.sensorsEnabled)
      propertyEdits(this).float(
        this.bodyBuffer,
        index * 40 + 11,
        enabled ? 1 : 0,
      );
    this.wakeAll();
  }
  selectSolver() {
    // Released slots are tracked on the CPU already: no GPU readback or contact scan.
    const constraintCount = this.jointCount - this.freeSlots.length;
    if (
      this.adaptiveScheduling &&
      this.schedulingDecision?.dense &&
      (this.bodyCount < 250_000 || constraintCount > 0)
    ) {
      this.primalLanes = [...this.defaultPrimalLanes];
      this.schedulingDecision = {
        ...this.schedulingDecision,
        dense: false,
        reason: "Threads per body follow solve-group size",
      };
    }
    const previous = this.solverDecision;
    if (
      previous.requested === this.solverPolicy.requested &&
      previous.bodyCount === this.bodyCount &&
      previous.constraintCount === constraintCount
    )
      return;
    const decision = selectSolverMode({
      ...this.solverPolicy,
      bodyCount: this.bodyCount,
      constraintCount,
    });
    if (decision.selected !== previous.selected) {
      let pipelines = this.solvePipelineCache.get(decision.selected);
      if (!pipelines) {
        const source =
          decision.selected === "optimized"
            ? projectedContactSolve
            : decision.selected === "points"
              ? pointLanesContactSolve
              : undefined;
        const module = this.device.createShaderModule({
          code: this.solveSource(source ?? solveWGSL),
        });
        const layout = this.device.createPipelineLayout({
          bindGroupLayouts: [this.layouts.solve, this.layouts.pass],
        });
        pipelines = Object.fromEntries(
          [
            "warmStartJoints",
            "warmStartBodies",
            "primal",
            "dual",
            "updateVelocities",
          ].map((entryPoint) => [
            entryPoint,
            this.device.createComputePipeline({
              label: `${decision.selected} ${entryPoint}`,
              layout,
              compute: { module, entryPoint },
            }),
          ]),
        );
        this.solvePipelineCache.set(decision.selected, pipelines);
      }
      Object.assign(this.pipes, pipelines);
    }
    this.solverDecision = decision;
  }
  profileDetailedNextStep(callback) {
    if (
      !this.device.features.has("timestamp-query") ||
      this.timingBusy ||
      this.timingCallback ||
      this.detailCallback
    )
      return false;
    const count = 2 * (9 + 2 * this.params.iterations);
    if (!this.detailTiming || this.detailTiming.count < count) {
      this.releaseAppTiming();
      this.detailTiming = {
        count,
        querySet: this.device.createQuerySet({ type: "timestamp", count }),
        resolve: this.device.createBuffer({
          size: count * 8,
          usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        }),
        read: this.device.createBuffer({
          size: count * 8,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        }),
      };
    }
    this.detailCallback = callback;
    return true;
  }
  captureConstraintFrames(entries) {
    if (!entries.length) return;
    this.flushPropertyEdits();
    if (!this.framePipeline)
      this.framePipeline = this.device.createComputePipeline({
        layout: "auto",
        compute: {
          module: this.device.createShaderModule({
            code: `const DISPATCH_STRIDE = ${this.device.limits.maxComputeWorkgroupsPerDimension * 64}u;\n${constraintFrames.replaceAll("id.x", "(id.x+id.y*DISPATCH_STRIDE)")}`,
          }),
          entryPoint: "capture",
        },
      });
    if (!this.frameData || this.frameData.length < entries.length * 4)
      this.frameData = new Uint32Array(
        Math.max(entries.length * 4, (this.frameData?.length ?? 0) * 2, 64),
      );
    for (let i = 0; i < entries.length; i++) {
      this.frameData[i * 4] = entries[i].slot;
      this.frameData[i * 4 + 1] = entries[i].spring ? 1 : 0;
    }
    this.runCapture(
      "frame",
      this.framePipeline,
      this.frameData.subarray(0, entries.length * 4),
      entries.length,
    );
  }
  runCapture(name, pipeline, data, count) {
    this.flushEdits?.();
    const d = this.device;
    const cache = ((this.captureUploads ??= {})[name] ??= {});
    if (!cache.buffer || cache.buffer.size < data.byteLength) {
      cache.buffer?.destroy();
      cache.buffer = d.createBuffer({
        size: data.byteLength * 2,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      cache.buffers = null;
    }
    d.queue.writeBuffer(cache.buffer, 0, data);
    const buffers = [
      this.bodyBuffer,
      this.jointBuffer,
      this.infoBuffer,
      cache.buffer,
    ];
    if (
      !cache.buffers ||
      buffers.some((b, i) => b !== cache.buffers[i]) ||
      cache.bytes !== data.byteLength
    ) {
      cache.group = d.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: buffers.map((buffer, binding) => ({
          binding,
          resource: {
            buffer,
            ...(binding === 3 ? { size: data.byteLength } : {}),
          },
        })),
      });
      cache.buffers = buffers;
      cache.bytes = data.byteLength;
    }
    const e = d.createCommandEncoder(),
      pass = e.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, cache.group);
    const groups = Math.ceil(count / 64),
      max = d.limits.maxComputeWorkgroupsPerDimension;
    pass.dispatchWorkgroups(Math.min(groups, max), Math.ceil(groups / max));
    pass.end();
    d.queue.submit([e.finish()]);
  }
  // Unlike the upstream single-joint append, use released slots too and allow
  // the world endpoint. Repeated grab/release operations keep bounded storage.
  setSpringMaterial(slot, options = {}) {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    if (
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= this.jointCount ||
      this.info[slot * 4] !== T_SPRING
    )
      throw Error("Spring material requires an active spring slot");
    const material = springMaterial(options);
    if (
      !this.springFracture &&
      (Number.isFinite(material.breakStrain) ||
        Number.isFinite(material.breakForce))
    ) {
      this.springFracture = true;
      this.rebuildSolvePipelines();
    }
    for (const [name, offset] of [
      ["breakStrain", 11],
      ["breakForce", 15],
    ])
      propertyEdits(this).float(
        this.jointBuffer,
        slot * 32 + offset,
        material[name] === Infinity ? 0 : material[name],
      );
    this.wakeAll();
  }
  appendConstraints(...args) {
    this.flushPropertyEdits();
    return super.appendConstraints(...args);
  }
  appendJoint(a, b, rA, rB, stiffnessLin, stiffnessAng) {
    const finite = (x) => (x === Infinity ? 3e38 : x);
    const [slot] = this.appendConstraints(1, (_, o) => {
      o[3] = finite(stiffnessLin);
      o[7] = finite(stiffnessAng);
      o[11] = 3e38;
      o.set(rA, 24);
      o.set(rB, 28);
      const sa = a >= 0 ? this.bodies[a].size : [0, 0, 0],
        sb = this.bodies[b].size;
      o[15] = sa.reduce((sum, v, i) => sum + (v + sb[i]) ** 2, 0);
      return [1, a, b];
    });
    this.wakeAll();
    return slot;
  }
  appendJoints(...args) {
    const slots = super.appendJoints(...args);
    this.wakeAll();
    return slots;
  }
  appendSprings(...args) {
    const slots = super.appendSprings(...args);
    this.wakeAll();
    return slots;
  }
  enableSleeping(ref, options = {}) {
    if (this.sleeping) return;
    this.sleeping = new WorldSleeping(
      {
        device: this.device,
        gpu: this,
        capacity: this.bodyCapacity,
        aggregates: ref.bodies.map((rigid, index) => ({ rigid, index })),
      },
      options,
    );
  }
  wakeAll() {
    if (this.sleeping) this.sleeping.wakeRequested = true;
  }
  async readSleepStats() {
    return this.sleeping
      ? this.sleeping.readStats()
      : { sleeping: 0, wakeRequested: false };
  }
  addBodies(bodies) {
    this.flushPropertyEdits();
    const first = super.addBodies(bodies);
    if (first >= 0)
      for (let k = 0; k < Math.min(bodies.length, this.bodyCount - first); k++)
        if (isCapsule(bodies[k])) this.installCapsule(first + k);
    if (first >= 0 && this.sleeping)
      for (let k = 0; k < Math.min(bodies.length, this.bodyCount - first); k++)
        this.sleeping.register(
          first + k,
          bodies[k].mass,
          bodies[k].allowSleep !== false,
        );
    return first;
  }
  rewriteBodies(indices, bodies) {
    this.flushPropertyEdits();
    super.rewriteBodies(indices, bodies);
    for (let k = 0; k < indices.length; k++)
      if (isCapsule(bodies[k])) this.installCapsule(indices[k]);
    if (this.sleeping)
      for (let k = 0; k < indices.length; k++)
        this.sleeping.register(
          indices[k],
          bodies[k].mass,
          bodies[k].allowSleep !== false,
        );
  }
  releaseJoints(slots) {
    this.flushPropertyEdits();
    super.releaseJoints(slots);
    this.wakeAll();
  }
  setWorldAnchor(slot, point) {
    if (
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= this.jointCount ||
      this.info[slot * 4 + 1] !== -1 ||
      point?.length !== 3 ||
      !Array.from(point).every(Number.isFinite)
    )
      throw Error("A world joint and finite xyz anchor are required");
    for (let k = 0; k < 3; k++)
      propertyEdits(this).float(this.jointBuffer, slot * 32 + 24 + k, point[k]);
    this.wakeAll();
  }
  disableConstraint(slot) {
    this.flushPropertyEdits();
    super.disableConstraint(slot);
    this.wakeAll();
  }
  setFilters(indices, groups, collidesWith) {
    if (this.destroyed) throw Error("The 3D solver has been destroyed");
    if (
      indices.length !== groups.length ||
      indices.length !== collidesWith.length
    )
      throw Error("Each body index needs a group and collision mask");
    for (let i = 0; i < indices.length; i++) {
      if (
        !Number.isInteger(indices[i]) ||
        indices[i] < 0 ||
        indices[i] >= this.bodyCount
      )
        throw Error("Collision filters require live body indices");
      for (const v of [groups[i], collidesWith[i]])
        if (!Number.isInteger(v) || v < 0 || v > 0xffffffff)
          throw Error("Collision masks must be unsigned 32-bit integers");
    }
    const edits = propertyEdits(this);
    for (let i = 0; i < indices.length; i++) {
      edits.uint(this.filterBuffer, indices[i] * 2, groups[i]);
      edits.uint(this.filterBuffer, indices[i] * 2 + 1, collidesWith[i]);
    }
    this.wakeAll();
  }
  profileNextStep(callback) {
    if (this.detailCallback) return false;
    return super.profileNextStep((profile) =>
      callback({
        ...profile,
        broadphase: this.broadphase,
        bvhRebuilt: this.bvh?.lastRebuilt ?? false,
      }),
    );
  }
  flushPropertyEdits(encoder) {
    this.propertyEdits?.flush(encoder);
  }
  readJoints() {
    this.flushPropertyEdits();
    return super.readJoints();
  }
  releaseAppTiming() {
    if (!this.detailTiming) return;
    for (const key of ["querySet", "resolve", "read"])
      this.detailTiming[key].destroy();
    this.detailTiming = null;
  }
  destroy() {
    this.passConstantCache = null;
    for (const upload of Object.values(this.captureUploads ?? {}))
      upload.buffer.destroy();
    this.captureUploads = null;
    this.frameData = null;
    this.propertyEdits?.destroy();
    this.shapeQueries?.destroy();
    this.restitution?.destroy();
    this.sleeping?.dispose();
    this.bvh?.destroy();
    this.bvh = null;
    if (!this.timingBusy) this.releaseAppTiming();
    super.destroy();
    this.solvePipelineCache.clear();
    this.adjacencyPipelines = {};
  }
  adapt(counters) {
    super.adapt(counters);
    this.colorCap = Math.max(this.minimumColors, this.colorCap);
    this.colorRounds = Math.max(this.minimumColorRounds, this.colorRounds);
    if (this.adaptiveScheduling) {
      // Counter reads already serve capacity adaptation. Reuse those readings;
      // no additional GPU readback or reduction is needed for scheduling.
      const dense =
        this.bodyCount >= 250_000 &&
        this.jointCount - this.freeSlots.length === 0 &&
        counters.manifolds >= 1.75 * this.bodyCount &&
        !counters.overflow &&
        !counters.clashes;
      this.primalLanes = dense
        ? [2 ** 31, 2 ** 31, 2 ** 31]
        : [...this.defaultPrimalLanes];
      this.schedulingDecision = {
        bodyCount: this.bodyCount,
        manifolds: counters.manifolds,
        dense,
        cachedAdjacency: this.adjacencyCached,
        reason: dense
          ? "Eight threads share each dense body solve"
          : "Threads per body follow solve-group size",
      };
    }
  }
  selectAdjacencyPipeline() {
    const cached = this.cacheAdjacencyKeys ?? this.bodyCount >= 250_000;
    if (this.adjacencyCached === cached) return;
    if (cached && !this.adjacencyPipelines.cached) {
      this.adjacencyPipelines.cached = this.device.createComputePipeline({
        label: "Cached adjacency keys",
        layout: this.device.createPipelineLayout({
          bindGroupLayouts: [this.layouts.topo],
        }),
        compute: {
          module: this.device.createShaderModule({ code: cachedAdjacencyWGSL }),
          entryPoint: "sortAdjacency",
        },
      });
    }
    this.pipes.sortAdjacency = cached
      ? this.adjacencyPipelines.cached
      : this.adjacencyPipelines.original;
    this.adjacencyCached = cached;
  }
}
