import buildSource from "./hplocpp.wgsl";
import sortSource from "./hplocSort.wgsl";
import { PRELUDE_3D } from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";
import { broadphaseWGSL } from "../../reference/three-avbd/src/avbd3d/gpu/wgsl-collision.ts";
import { PrefixScan } from "../../reference/three-avbd/src/avbd2d/gpu/scan.ts";

const storage = () =>
  GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
const groups = (n, size = 128) => Math.max(1, Math.ceil(n / size));
const END = 0xffffffff;

// Preserve the pinned pair acceptance rules: masks, disabled joints, static
// pairs, spheres, oriented box axes, hull proxies and capacity accounting.
const gridStart = broadphaseWGSL.indexOf(
  "@compute @workgroup_size(64)\nfn gridCount",
);
const ignoreStart = broadphaseWGSL.indexOf("/** Binary search");
const pairsStart = broadphaseWGSL.indexOf(
  "@compute @workgroup_size(64)\nfn findPairs",
);
if (gridStart < 0 || ignoreStart < gridStart || pairsStart < ignoreStart)
  throw Error("Pinned broadphase changed; review H-PLOC integration");
const nodeTypes = buildSource.slice(0, buildSource.indexOf("@group(0)"));
const traversalSource =
  (
    broadphaseWGSL.slice(0, gridStart) +
    broadphaseWGSL.slice(ignoreStart, pairsStart)
  ).replace(
    "var<storage, read_write> grid: array<atomic<u32>>;",
    "var<storage, read_write> tree: array<Node>;",
  ) +
  `
${nodeTypes}
@group(1) @binding(0) var<uniform> build: BuildSettings;
@group(1) @binding(1) var<storage,read> links: array<u32>;
@compute @workgroup_size(64)
fn findTreePairs(@builtin(global_invocation_id) gid:vec3u) {
  let i=gid.x; if(i>=params.bodyCount || build.root==0xffffffffu){return;}
  let P=probeOf(i);
  // Static/kinematic leaves are found from dynamic queries. Traversing a
  // scene-wide ground slab would otherwise serialize an entire tree in one lane.
  if(!P.dynamic){return;}
  let lo=P.pos-P.aabb-vec3f(1e-4);let hi=P.pos+P.aabb+vec3f(1e-4);
  var at=build.root;
  // Stackless escape links: no truncation at an arbitrary traversal stack size.
  loop {
    if(at==0xffffffffu){break;}
    let node=tree[at];
    if(any(node.hi<lo)||any(node.lo>hi)) {at=links[build.escapeOffset+at];continue;}
    if(node.right==0xffffffffu) {
      if(node.left!=i && (node.left<i || bodies[node.left].size.w<=0.0)){testPair(P,node.left);}
      at=links[build.escapeOffset+at];
    } else {at=node.left;}
  }
}`;

/** GPU-resident hierarchical locally ordered clustering and conservative refit.
 * This is a portable treelet variant, not the paper's single-launch wave algorithm.
 * Refit updates every leaf and ancestor every step; rebuilding only changes quality.
 */
export class GpuHploc {
  constructor(device, solver, { rebuildInterval = 64 } = {}) {
    if (!Number.isInteger(rebuildInterval) || rebuildInterval < 1)
      throw Error("BVH rebuildInterval must be a positive integer");
    this.device = device;
    this.capacity = solver.bodyCapacity;
    if (this.capacity > 16 * device.limits.maxComputeWorkgroupsPerDimension)
      throw Error(
        "H-PLOC capacity exceeds the adapter dispatch limit; select the grid",
      );
    this.bodyBuffer = solver.bodyBuffer;
    this.rebuildInterval = rebuildInterval;
    this.nodeCapacity =
      2 * this.capacity +
      16 * Math.ceil(Math.log2(Math.max(2, this.capacity))) +
      32;
    this.buffers = [];
    this.uniforms = [];
    this.stats = { builds: 0, refits: 0, nodes: 0, extraBytes: 0 };
    const buffer = (label, size, usage = storage()) => {
      if (
        usage & GPUBufferUsage.STORAGE &&
        size > device.limits.maxStorageBufferBindingSize
      )
        throw Error(`${label} exceeds the adapter storage binding limit`);
      const b = device.createBuffer({ label, size: Math.max(16, size), usage });
      this.buffers.push(b);
      this.stats.extraBytes += b.size;
      return b;
    };
    this.nodes = buffer("H-PLOC nodes", this.nodeCapacity * 32);
    this.links = buffer(
      "H-PLOC parents and escape links",
      this.nodeCapacity * 8,
    );
    this.keys = [
      buffer("Morton keys A", this.capacity * 8),
      buffer("Morton keys B", this.capacity * 8),
    ];
    this.clusters = buffer("H-PLOC level roots", this.capacity * 8 + 128);
    this.bounds = buffer(
      "H-PLOC scene bounds",
      (groups(this.capacity) * 2 + 256) * 16,
    );
    this.sortBlocks = groups(this.capacity);
    this.hist = buffer("Morton radix counts", this.sortBlocks * 16 * 4);
    this.scan = new PrefixScan(device, this.hist, 0, this.sortBlocks * 16);
    const entry = (binding, type) => ({
      binding,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type },
    });
    this.layout = device.createBindGroupLayout({
      entries: [
        entry(0, "uniform"),
        entry(1, "read-only-storage"),
        ...Array.from({ length: 5 }, (_, i) => entry(i + 2, "storage")),
      ],
    });
    this.extraLayout = device.createBindGroupLayout({
      entries: [entry(0, "uniform"), entry(1, "read-only-storage")],
    });
    const module = device.createShaderModule({
      label: "portable H-PLOC",
      code:
        PRELUDE_3D +
        buildSource +
        `
@compute @workgroup_size(128)
fn initializeLinks(@builtin(global_invocation_id) gid:vec3u){if(gid.x<build.escapeOffset){links[gid.x]=0xffffffffu;}}
`,
    });
    const layout = device.createPipelineLayout({
      bindGroupLayouts: [this.layout],
    });
    this.pipes = Object.fromEntries(
      [
        "leaves",
        "reduceBounds",
        "mortonCodes",
        "seedClusters",
        "miniHploc",
        "refitTreelets",
        "ropes",
        "initializeLinks",
      ].map((entryPoint) => [
        entryPoint,
        device.createComputePipeline({
          layout,
          compute: { module, entryPoint },
        }),
      ]),
    );
    const sortModule = device.createShaderModule({
      label: "stable Morton radix",
      code: sortSource,
    });
    this.sortLayout = device.createBindGroupLayout({
      entries: [
        entry(0, "uniform"),
        entry(1, "read-only-storage"),
        entry(2, "storage"),
        entry(3, "storage"),
      ],
    });
    const sortLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.sortLayout],
    });
    this.sortPipes = Object.fromEntries(
      ["countDigits", "scatterDigits"].map((entryPoint) => [
        entryPoint,
        device.createComputePipeline({
          layout: sortLayout,
          compute: { module: sortModule, entryPoint },
        }),
      ]),
    );
    this.traverse = device.createComputePipeline({
      label: "H-PLOC collision traversal",
      layout: device.createPipelineLayout({
        bindGroupLayouts: [solver.layouts.broad, this.extraLayout],
      }),
      compute: {
        module: device.createShaderModule({ code: traversalSource }),
        entryPoint: "findTreePairs",
      },
    });
    this.configure(solver.bodyCount);
  }
  uniform(words) {
    const b = this.device.createBuffer({
      size: words.length * 4,
      usage: GPUBufferUsage.UNIFORM,
      mappedAtCreation: true,
    });
    new Uint32Array(b.getMappedRange()).set(words);
    b.unmap();
    this.uniforms.push(b);
    return b;
  }
  configure(count) {
    if (count === this.count) return;
    if (count > this.capacity) throw Error("H-PLOC body capacity exceeded");
    for (const b of this.uniforms) b.destroy();
    this.uniforms = [];
    this.count = count;
    this.built = false;
    this.stepsSinceBuild = 0;
    const levels = [];
    let inputCount = count,
      nodeBase = count,
      inputOffset = 0,
      outputOffset = count;
    let root = count === 0 ? END : 0;
    while (inputCount > 1) {
      const blocks = Math.ceil(inputCount / 16);
      levels.push({ inputCount, nodeBase, inputOffset, outputOffset, blocks });
      if (blocks === 1) root = nodeBase + inputCount - 2;
      nodeBase += blocks * 15;
      inputOffset = outputOffset;
      outputOffset += blocks;
      inputCount = blocks;
    }
    this.stats.nodes = count ? 2 * count - 1 : 0;
    const make = (settings = {}) => {
      const b = this.uniform([
        count,
        settings.nodeBase ?? 0,
        settings.inputOffset ?? 0,
        settings.outputOffset ?? 0,
        root,
        this.sortBlocks,
        0,
        settings.boundsOffset ?? 0,
        settings.inputCount ?? count,
        this.nodeCapacity,
        0,
        0,
      ]);
      const group = this.device.createBindGroup({
        layout: this.layout,
        entries: [
          b,
          this.bodyBuffer,
          this.nodes,
          this.keys[0],
          this.bounds,
          this.links,
          this.clusters,
        ].map((buffer, binding) => ({ binding, resource: { buffer } })),
      });
      return { group, buffer: b };
    };
    this.base = make();
    this.levels = levels.map((level) => ({ ...level, ...make(level) }));
    this.reductions = [];
    let size = groups(count),
      offset = 0,
      next = size * 2;
    while (size > 1) {
      const blocks = groups(size);
      this.reductions.push({
        blocks,
        ...make({ inputCount: size, inputOffset: offset, outputOffset: next }),
      });
      offset = next;
      next += blocks * 2;
      size = blocks;
    }
    this.morton = make({ boundsOffset: offset });
    this.sortGroups = Array.from({ length: 8 }, (_, i) => {
      const b = this.uniform([count, this.sortBlocks, i * 4, 0]);
      return this.device.createBindGroup({
        layout: this.sortLayout,
        entries: [b, this.keys[i % 2], this.keys[1 - (i % 2)], this.hist].map(
          (buffer, binding) => ({ binding, resource: { buffer } }),
        ),
      });
    });
    this.extra = this.device.createBindGroup({
      layout: this.extraLayout,
      entries: [
        { binding: 0, resource: { buffer: this.base.buffer } },
        { binding: 1, resource: { buffer: this.links } },
      ],
    });
    this.broadBuffers = null;
  }
  encodeBuild(pass) {
    const run = (entry, group, x) => {
      pass.setPipeline(this.pipes[entry]);
      pass.setBindGroup(0, group);
      pass.dispatchWorkgroups(x);
    };
    run("leaves", this.base.group, groups(this.count));
    const rebuilding =
      !this.built || this.stepsSinceBuild >= this.rebuildInterval;
    this.lastRebuilt = rebuilding;
    if (rebuilding) {
      run("initializeLinks", this.base.group, groups(this.nodeCapacity));
      for (const level of this.reductions)
        run("reduceBounds", level.group, level.blocks);
      run("mortonCodes", this.morton.group, groups(this.count));
      for (const group of this.sortGroups) {
        pass.setPipeline(this.sortPipes.countDigits);
        pass.setBindGroup(0, group);
        pass.dispatchWorkgroups(this.sortBlocks);
        this.scan.encode(pass);
        pass.setPipeline(this.sortPipes.scatterDigits);
        pass.setBindGroup(0, group);
        pass.dispatchWorkgroups(this.sortBlocks);
      }
      run("seedClusters", this.base.group, groups(this.count));
      for (const level of this.levels)
        run("miniHploc", level.group, level.blocks);
      run("ropes", this.base.group, groups(this.nodeCapacity));
      this.built = true;
      this.stepsSinceBuild = 0;
      this.stats.builds++;
    } else {
      for (const level of this.levels)
        run("refitTreelets", level.group, groups(level.blocks, 64));
      this.stats.refits++;
    }
    this.stepsSinceBuild++;
  }
  encodePairs(pass, solver) {
    this.configure(solver.bodyCount);
    const buffers = [
      solver.paramsBuffer,
      solver.bodyBuffer,
      this.nodes,
      solver.pairBuffer,
      solver.counterBuffer,
      solver.staticBuffer,
      solver.jointBuffer,
      solver.filterBuffer,
    ];
    if (
      !this.broadBuffers ||
      buffers.some((b, i) => b !== this.broadBuffers[i])
    ) {
      this.broadBuffers = buffers;
      this.broad = this.device.createBindGroup({
        layout: solver.layouts.broad,
        entries: buffers.map((buffer, binding) => ({
          binding,
          resource: { buffer },
        })),
      });
    }
    pass.setPipeline(this.traverse);
    pass.setBindGroup(0, this.broad);
    pass.setBindGroup(1, this.extra);
    pass.dispatchWorkgroups(groups(this.count, 64));
  }
  destroy() {
    this.scan.destroy();
    for (const b of [...this.buffers, ...this.uniforms]) b.destroy();
  }
}
