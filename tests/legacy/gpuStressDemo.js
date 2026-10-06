import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { GpuTimer } from "../../src/gpu/gpuTimer.js";
import simulationWGSL from "./gpuStress.wgsl";
import renderWGSL from "./gpuStressRender.wgsl";

const BLOCK_COUNT = 100_000;
const BODY_COUNT = BLOCK_COUNT + 1;
const BODY_BYTES = 96;
const CONTACT_CACHE_BYTES = 16 * 48;
const PARAM_BYTES = 64;
const CAMERA_BYTES = 96;
const GRID_MIN = [-50, -2, -24];
const GRID_MAX = [50, 28, 20];
// Cover the diameter of a rotated 0.18 x 0.09 x 0.12 half-extent
// brick, including the broadphase's 0.01 m contact padding.
const CELL_SIZE = 0.48;
const GRID_DIMS = GRID_MAX.map((value, axis) =>
  Math.ceil((value - GRID_MIN[axis]) / CELL_SIZE),
);
const CELL_COUNT = GRID_DIMS[0] * GRID_DIMS[1] * GRID_DIMS[2];
const SOLVER_ITERATIONS = 4;
const SUBSTEPS = 2;
const SHAPE_SPHERE = 0;
const SHAPE_BOX = 1;
const SHAPE_CAPSULE = 2;

function makeUi(root) {
  root.replaceChildren();
  const shell = document.createElement("main");
  shell.className = "gpu-stress-shell";
  shell.innerHTML = `
    <canvas aria-label="100,000 block GPU physics benchmark"></canvas>
    <section class="gpu-stress-panel">
      <a href="/" style="display:block;color:#80d7ff;margin-bottom:12px">← Back to main page</a>
      <p class="eyebrow">GPU RESIDENT PHYSICS</p>
      <h1>100K Rook Wall</h1>
      <p class="lede">A cannonball drives a GPU spatial grid and Jacobi contact solver. Simulation state flows directly into one instanced draw.</p>
      <div class="actions">
        <button data-action="shoot">Shoot</button>
        <button data-action="reset">Reset</button>
        <button data-action="pause">Pause</button>
        <select data-action="collider" aria-label="Cannon projectile collider">
          <option value="sphere">Sphere</option>
          <option value="box">Box</option>
          <option value="capsule">Capsule</option>
        </select>
        <label><input data-action="auto" type="checkbox" checked> Auto fire</label>
      </div>
      <pre class="gpu-stress-stats">Initializing WebGPU…</pre>
      <p class="gpu-stress-note">Drag to orbit · wheel to zoom · <a href="?demo=rock">return to rigid-body lab</a></p>
    </section>`;
  const style = document.createElement("style");
  style.textContent = `
    html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#060811;color:#f5f7ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
    .gpu-stress-shell,.gpu-stress-shell canvas{position:absolute;inset:0;width:100%;height:100%}
    .gpu-stress-shell canvas{display:block;touch-action:none}
    .gpu-stress-panel{position:absolute;top:20px;left:20px;width:min(390px,calc(100vw - 64px));padding:20px 22px;background:rgba(7,10,20,.88);border:1px solid rgba(130,160,255,.28);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.42);backdrop-filter:blur(14px)}
    .gpu-stress-panel h1{margin:2px 0 7px;font-size:28px;letter-spacing:-.035em}.eyebrow{margin:0;color:#80d7ff;font-size:11px;font-weight:800;letter-spacing:.16em}.lede{margin:0 0 15px;color:#b8c0d6;font-size:13px;line-height:1.45}.actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.actions button,.actions select{border:1px solid #3a4668;background:#131a2c;color:#fff;border-radius:9px;padding:8px 13px;font-weight:700;cursor:pointer}.actions button:first-child{background:#7257ff;border-color:#8d78ff}.actions label{font-size:12px;color:#c7cde0}.gpu-stress-stats{margin:16px 0 0;padding:13px;background:#080b13;border-radius:10px;color:#dce6ff;font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}.gpu-stress-note{margin:11px 0 0;color:#8993ad;font-size:11px}.gpu-stress-note a{color:#80d7ff}
  `;
  document.head.append(style);
  root.append(shell);
  return {
    shell,
    style,
    canvas: shell.querySelector("canvas"),
    stats: shell.querySelector(".gpu-stress-stats"),
    shoot: shell.querySelector('[data-action="shoot"]'),
    reset: shell.querySelector('[data-action="reset"]'),
    pause: shell.querySelector('[data-action="pause"]'),
    collider: shell.querySelector('[data-action="collider"]'),
    auto: shell.querySelector('[data-action="auto"]'),
  };
}

function projectileDefinition(kind) {
  if (kind === "box")
    return { shape: [0.72, 0.55, 0.55], kind: SHAPE_BOX, angular: [3, 5, 2] };
  if (kind === "capsule")
    return {
      shape: [0.48, 0.7, 0.48],
      kind: SHAPE_CAPSULE,
      angular: [2, 6, 3],
    };
  return { shape: [0.75, 0.75, 0.75], kind: SHAPE_SPHERE, angular: [0, 0, -4] };
}

function writeBody(
  f32,
  u32,
  id,
  position,
  velocity,
  shape,
  invMass,
  kind,
  awake,
  angular = [0, 0, 0],
) {
  const offset = id * 24;
  f32.set([...position, 1], offset);
  f32.set([...velocity, 0], offset + 4);
  f32.set([...shape, invMass], offset + 8);
  f32.set([0, 0, 0, 1], offset + 12);
  f32.set([...angular, 0], offset + 16);
  u32[offset + 20] = kind;
  u32[offset + 21] = awake ? 1 : 0;
  u32[offset + 22] = 0;
  u32[offset + 23] = 0;
}

function packProjectile(kind) {
  const data = new ArrayBuffer(BODY_BYTES);
  const projectile = projectileDefinition(kind);
  writeBody(
    new Float32Array(data),
    new Uint32Array(data),
    0,
    [0, 8.2, -21],
    [0, 1.4, 48],
    projectile.shape,
    1 / 80,
    projectile.kind,
    true,
    projectile.angular,
  );
  return new Uint8Array(data);
}

function packInitialBodies(projectileKind = "sphere") {
  const data = new ArrayBuffer(BODY_COUNT * BODY_BYTES);
  const f32 = new Float32Array(data);
  const u32 = new Uint32Array(data);
  new Uint8Array(data, 0, BODY_BYTES).set(packProjectile(projectileKind));

  let id = 1;
  for (let depth = 0; depth < 4; depth += 1) {
    for (let column = 0; column < 250; column += 1) {
      const tower = column < 25 || column >= 225 ? 20 : 0;
      const crenel = Math.floor(column / 5) % 2 === 0 ? 12 : 0;
      const height = 90 + tower + crenel;
      for (let row = 0; row < height; row += 1) {
        const stagger = row % 2 ? 0.185 : 0;
        writeBody(
          f32,
          u32,
          id++,
          [
            (column - 124.5) * 0.37 + stagger,
            0.0925 + row * 0.185,
            (depth - 1.5) * 0.25,
          ],
          [0, 0, 0],
          [0.18, 0.09, 0.12],
          1,
          SHAPE_BOX,
          false,
        );
      }
    }
  }
  if (id !== BODY_COUNT) {
    throw new Error(
      `Rook wall generated ${id - 1} blocks, expected ${BLOCK_COUNT}.`,
    );
  }
  return data;
}

function makeCubeVertices() {
  const faces = [
    [
      [0, 0, -1],
      [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
      ],
    ],
    [
      [0, 0, 1],
      [
        [-1, -1, 1],
        [-1, 1, 1],
        [1, 1, 1],
        [1, -1, 1],
      ],
    ],
    [
      [-1, 0, 0],
      [
        [-1, -1, -1],
        [-1, 1, -1],
        [-1, 1, 1],
        [-1, -1, 1],
      ],
    ],
    [
      [1, 0, 0],
      [
        [1, -1, -1],
        [1, -1, 1],
        [1, 1, 1],
        [1, 1, -1],
      ],
    ],
    [
      [0, -1, 0],
      [
        [-1, -1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, -1, -1],
      ],
    ],
    [
      [0, 1, 0],
      [
        [-1, 1, -1],
        [1, 1, -1],
        [1, 1, 1],
        [-1, 1, 1],
      ],
    ],
  ];
  const output = [];
  for (const [normal, corners] of faces) {
    for (const index of [0, 1, 2, 0, 2, 3])
      output.push(...corners[index], ...normal);
  }
  return new Float32Array(output);
}

function makeSphereVertices(latitude = 12, longitude = 18) {
  const output = [];
  const point = (lat, lon) => {
    const theta = (lat / latitude) * Math.PI;
    const phi = (lon / longitude) * Math.PI * 2;
    return [
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi),
    ];
  };
  for (let y = 0; y < latitude; y += 1)
    for (let x = 0; x < longitude; x += 1) {
      const a = point(y, x),
        b = point(y + 1, x),
        c = point(y + 1, x + 1),
        d = point(y, x + 1);
      for (const vertex of [a, b, c, a, c, d])
        output.push(...vertex, ...vertex);
    }
  return new Float32Array(output);
}

function makeCapsuleVertices(
  radius = 0.48,
  halfLength = 0.7,
  radialSegments = 18,
  capSegments = 6,
) {
  const rings = [];
  for (let i = 0; i <= capSegments; i += 1) {
    const angle = ((1 - i / capSegments) * Math.PI) / 2;
    rings.push({
      x: halfLength + Math.sin(angle) * radius,
      r: Math.cos(angle) * radius,
      nx: Math.sin(angle),
      nr: Math.cos(angle),
    });
  }
  for (let i = 0; i <= capSegments; i += 1) {
    const angle = ((i / capSegments) * Math.PI) / 2;
    rings.push({
      x: -halfLength - Math.sin(angle) * radius,
      r: Math.cos(angle) * radius,
      nx: -Math.sin(angle),
      nr: Math.cos(angle),
    });
  }
  const vertex = (ring, segment) => {
    const angle = (segment / radialSegments) * Math.PI * 2;
    const c = Math.cos(angle),
      s = Math.sin(angle);
    return [ring.x, ring.r * c, ring.r * s, ring.nx, ring.nr * c, ring.nr * s];
  };
  const output = [];
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const a = vertex(rings[ring], segment);
      const b = vertex(rings[ring + 1], segment);
      const c = vertex(rings[ring + 1], segment + 1);
      const d = vertex(rings[ring], segment + 1);
      output.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  return new Float32Array(output);
}

function createGpuBuffer(device, label, size, usage, initial) {
  const buffer = device.createBuffer({
    label,
    size,
    usage,
    mappedAtCreation: !!initial,
  });
  if (initial) {
    new Uint8Array(buffer.getMappedRange()).set(
      new Uint8Array(
        initial.buffer ?? initial,
        initial.byteOffset ?? 0,
        initial.byteLength ?? initial.byteLength,
      ),
    );
    buffer.unmap();
  }
  return buffer;
}

async function checkedModule(device, label, code) {
  const module = device.createShaderModule({ label, code });
  const info = await module.getCompilationInfo();
  const errors = info.messages.filter((message) => message.type === "error");
  if (errors.length)
    throw new Error(
      errors
        .map(
          (message) => `${label} line ${message.lineNum}: ${message.message}`,
        )
        .join("\n"),
    );
  return module;
}

export async function startGpuStressDemo({ root = document.body } = {}) {
  const ui = makeUi(root);
  if (!navigator.gpu)
    throw new Error("The 100K scene requires WebGPU in Chrome or Edge.");
  const adapter = await navigator.gpu.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) throw new Error("No WebGPU adapter is available.");
  const timestampQueries = adapter.features.has("timestamp-query");
  const device = await adapter.requestDevice({
    requiredFeatures: timestampQueries ? ["timestamp-query"] : [],
  });
  const context = ui.canvas.getContext("webgpu");
  const colorFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format: colorFormat, alphaMode: "opaque" });

  let initialBodies = packInitialBodies(ui.collider.value);
  const projectileData = new Map([
    ["sphere", packProjectile("sphere")],
    ["box", packProjectile("box")],
    ["capsule", packProjectile("capsule")],
  ]);
  const storage =
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;
  const bodies = createGpuBuffer(
    device,
    "stress-bodies",
    initialBodies.byteLength,
    storage,
    initialBodies,
  );
  const snapshot = createGpuBuffer(
    device,
    "stress-snapshot",
    initialBodies.byteLength,
    storage,
  );
  const contactCache = createGpuBuffer(
    device,
    "stress-contact-cache",
    BODY_COUNT * CONTACT_CACHE_BYTES,
    storage,
  );
  const cellHead = createGpuBuffer(
    device,
    "stress-cell-head",
    CELL_COUNT * 4,
    storage,
  );
  const nextBody = createGpuBuffer(
    device,
    "stress-next-body",
    BODY_COUNT * 4,
    storage,
  );
  const params = createGpuBuffer(
    device,
    "stress-params",
    PARAM_BYTES,
    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  );
  const counters = createGpuBuffer(device, "stress-counters", 16, storage);
  const camera = createGpuBuffer(
    device,
    "stress-camera",
    CAMERA_BYTES,
    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  );

  const simulationModule = await checkedModule(
    device,
    "100K simulation",
    simulationWGSL,
  );
  const computeLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "read-only-storage" },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 4,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
      {
        binding: 5,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "uniform" },
      },
      {
        binding: 6,
        visibility: GPUShaderStage.COMPUTE,
        buffer: { type: "storage" },
      },
    ],
  });
  const computePipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [computeLayout],
  });
  const pipeline = {};
  for (const entryPoint of [
    "clearGrid",
    "clearCounters",
    "predictBodies",
    "buildGrid",
    "wakeBodies",
    "solveBodies",
    "finalizeBodies",
    "countState",
  ])
    pipeline[entryPoint] = device.createComputePipeline({
      label: `stress-${entryPoint}`,
      layout: computePipelineLayout,
      compute: { module: simulationModule, entryPoint },
    });
  const computeBindGroup = device.createBindGroup({
    layout: computeLayout,
    entries: [
      { binding: 0, resource: { buffer: bodies } },
      { binding: 1, resource: { buffer: snapshot } },
      { binding: 2, resource: { buffer: contactCache } },
      { binding: 3, resource: { buffer: cellHead } },
      { binding: 4, resource: { buffer: nextBody } },
      { binding: 5, resource: { buffer: params } },
      { binding: 6, resource: { buffer: counters } },
    ],
  });

  const renderModule = await checkedModule(device, "100K renderer", renderWGSL);
  const renderLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "read-only-storage" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
    ],
  });
  const renderPipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [renderLayout],
  });
  const vertexLayout = {
    arrayStride: 24,
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x3" },
      { shaderLocation: 1, offset: 12, format: "float32x3" },
    ],
  };
  const makeRenderPipeline = (label, bodyOffset, preScaled = 0) =>
    device.createRenderPipeline({
      label,
      layout: renderPipelineLayout,
      vertex: {
        module: renderModule,
        entryPoint: "vertexMain",
        buffers: [vertexLayout],
        constants: { BODY_OFFSET: bodyOffset, PRE_SCALED: preScaled },
      },
      fragment: {
        module: renderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: colorFormat }],
        constants: { BODY_OFFSET: bodyOffset, PRE_SCALED: preScaled },
      },
      primitive: { topology: "triangle-list", cullMode: "back" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: true,
        depthCompare: "less",
      },
    });
  const brickPipeline = makeRenderPipeline("stress-bricks", 1);
  const cannonPipeline = makeRenderPipeline("stress-cannon", 0);
  const capsulePipeline = makeRenderPipeline("stress-capsule", 0, 1);
  const renderBindGroup = device.createBindGroup({
    layout: renderLayout,
    entries: [
      { binding: 0, resource: { buffer: bodies } },
      { binding: 1, resource: { buffer: camera } },
    ],
  });
  const cubeVertices = makeCubeVertices();
  const sphereVertices = makeSphereVertices();
  const capsuleVertices = makeCapsuleVertices();
  const cubeBuffer = createGpuBuffer(
    device,
    "stress-cube",
    cubeVertices.byteLength,
    GPUBufferUsage.VERTEX,
    cubeVertices,
  );
  const sphereBuffer = createGpuBuffer(
    device,
    "stress-sphere",
    sphereVertices.byteLength,
    GPUBufferUsage.VERTEX,
    sphereVertices,
  );
  const capsuleBuffer = createGpuBuffer(
    device,
    "stress-capsule",
    capsuleVertices.byteLength,
    GPUBufferUsage.VERTEX,
    capsuleVertices,
  );

  const broadphaseTimer = new GpuTimer(device);
  const solverTimer = new GpuTimer(device);
  const renderTimer = new GpuTimer(device);
  let depthTexture;
  const resize = () => {
    const ratio = Math.min(1.5, devicePixelRatio || 1);
    const width = Math.max(1, Math.floor(ui.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.floor(ui.canvas.clientHeight * ratio));
    if (ui.canvas.width === width && ui.canvas.height === height) return;
    ui.canvas.width = width;
    ui.canvas.height = height;
    depthTexture?.destroy();
    depthTexture = device.createTexture({
      size: [width, height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  };
  new ResizeObserver(resize).observe(ui.canvas);
  resize();

  const paramData = new ArrayBuffer(PARAM_BYTES);
  const paramF32 = new Float32Array(paramData);
  const paramU32 = new Uint32Array(paramData);
  const writeParams = (dt) => {
    paramF32[0] = dt;
    paramF32[1] = -28;
    paramF32[2] = CELL_SIZE;
    paramF32[3] = 0.72;
    paramU32[4] = BODY_COUNT;
    paramU32[5] = CELL_COUNT;
    paramU32[6] = GRID_DIMS[0];
    paramU32[7] = GRID_DIMS[1];
    paramU32[8] = GRID_DIMS[2];
    paramU32[10] = SOLVER_ITERATIONS;
    paramF32[12] = GRID_MIN[0];
    paramF32[13] = GRID_MIN[1];
    paramF32[14] = GRID_MIN[2];
    device.queue.writeBuffer(params, 0, paramData);
  };

  const dispatch = (encoder, selectedPipeline, count, descriptor = {}) => {
    const pass = encoder.beginComputePass(descriptor);
    pass.setPipeline(selectedPipeline);
    pass.setBindGroup(0, computeBindGroup);
    pass.dispatchWorkgroups(Math.ceil(count / 256));
    pass.end();
  };
  const encodePhysics = () => {
    writeParams(1 / 120);
    const encoder = device.createCommandEncoder({
      label: "100K-physics-frame",
    });
    const broadSlot = broadphaseTimer.begin();
    const solveSlot = solverTimer.begin();
    dispatch(encoder, pipeline.clearCounters, 1);
    for (let substep = 0; substep < SUBSTEPS; substep += 1) {
      encoder.copyBufferToBuffer(
        bodies,
        0,
        snapshot,
        0,
        BODY_COUNT * BODY_BYTES,
      );
      dispatch(
        encoder,
        pipeline.predictBodies,
        BODY_COUNT,
        substep === 0 && solveSlot
          ? {
              timestampWrites: {
                querySet: solveSlot.query,
                beginningOfPassWriteIndex: 0,
              },
            }
          : {},
      );
      const broadPass = encoder.beginComputePass(
        substep === 0 && broadSlot
          ? {
              timestampWrites: {
                querySet: broadSlot.query,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1,
              },
            }
          : {},
      );
      broadPass.setBindGroup(0, computeBindGroup);
      broadPass.setPipeline(pipeline.clearGrid);
      broadPass.dispatchWorkgroups(Math.ceil(CELL_COUNT / 256));
      broadPass.setPipeline(pipeline.buildGrid);
      broadPass.dispatchWorkgroups(Math.ceil(BODY_COUNT / 256));
      broadPass.end();
      encoder.copyBufferToBuffer(
        bodies,
        0,
        snapshot,
        0,
        BODY_COUNT * BODY_BYTES,
      );
      dispatch(encoder, pipeline.wakeBodies, BODY_COUNT);
      for (let iteration = 0; iteration < SOLVER_ITERATIONS; iteration += 1) {
        encoder.copyBufferToBuffer(
          bodies,
          0,
          snapshot,
          0,
          BODY_COUNT * BODY_BYTES,
        );
        dispatch(encoder, pipeline.solveBodies, BODY_COUNT);
      }
      dispatch(encoder, pipeline.finalizeBodies, BODY_COUNT);
    }
    dispatch(
      encoder,
      pipeline.countState,
      BODY_COUNT,
      solveSlot
        ? {
            timestampWrites: {
              querySet: solveSlot.query,
              endOfPassWriteIndex: 1,
            },
          }
        : {},
    );
    broadphaseTimer.encode(encoder, broadSlot);
    solverTimer.encode(encoder, solveSlot);
    device.queue.submit([encoder.finish()]);
    broadphaseTimer.resolve(broadSlot);
    solverTimer.resolve(solveSlot);
  };

  let yaw = -0.62,
    pitch = 0.22,
    distance = 78;
  const target = new Vector3(0, 9.5, 0);
  const updateCamera = () => {
    const cp = Math.cos(pitch);
    const eye = new Vector3(
      target.x + Math.sin(yaw) * cp * distance,
      target.y + Math.sin(pitch) * distance,
      target.z - Math.cos(yaw) * cp * distance,
    );
    const view = Matrix.LookAtLH(eye, target, Vector3.Up());
    const projection = Matrix.PerspectiveFovLH(
      0.78,
      ui.canvas.width / ui.canvas.height,
      0.1,
      220,
    );
    const matrix = view.multiply(projection).toArray();
    const data = new Float32Array(CAMERA_BYTES / 4);
    data.set(matrix, 0);
    data.set([eye.x, eye.y, eye.z, 1], 16);
    data.set([-22, 32, -28, 1], 20);
    device.queue.writeBuffer(camera, 0, data);
  };
  const render = () => {
    resize();
    updateCamera();
    const encoder = device.createCommandEncoder({ label: "100K-render-frame" });
    const timerSlot = renderTimer.begin();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0.018, g: 0.024, b: 0.045, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
      ...renderTimer.descriptor(timerSlot),
    });
    pass.setBindGroup(0, renderBindGroup);
    pass.setPipeline(brickPipeline);
    pass.setVertexBuffer(0, cubeBuffer);
    pass.draw(cubeVertices.length / 6, BLOCK_COUNT);
    if (ui.collider.value === "capsule") {
      pass.setPipeline(capsulePipeline);
      pass.setVertexBuffer(0, capsuleBuffer);
      pass.draw(capsuleVertices.length / 6, 1);
    } else {
      pass.setPipeline(cannonPipeline);
      const vertices =
        ui.collider.value === "box" ? cubeVertices : sphereVertices;
      pass.setVertexBuffer(
        0,
        ui.collider.value === "box" ? cubeBuffer : sphereBuffer,
      );
      pass.draw(vertices.length / 6, 1);
    }
    pass.end();
    renderTimer.encode(encoder, timerSlot);
    device.queue.submit([encoder.finish()]);
    renderTimer.resolve(timerSlot);
  };

  const shoot = () => {
    device.queue.writeBuffer(
      contactCache,
      0,
      new Uint8Array(CONTACT_CACHE_BYTES),
    );
    device.queue.writeBuffer(bodies, 0, projectileData.get(ui.collider.value));
  };
  const reset = () => {
    const encoder = device.createCommandEncoder();
    encoder.clearBuffer(contactCache);
    device.queue.submit([encoder.finish()]);
    device.queue.writeBuffer(bodies, 0, initialBodies);
  };
  ui.shoot.addEventListener("click", shoot);
  ui.reset.addEventListener("click", reset);
  ui.collider.addEventListener("change", () => {
    initialBodies = packInitialBodies(ui.collider.value);
    reset();
  });
  let paused = false;
  ui.pause.addEventListener("click", () => {
    paused = !paused;
    ui.pause.textContent = paused ? "Resume" : "Pause";
  });

  let pointer;
  ui.canvas.addEventListener("pointerdown", (event) => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    ui.canvas.setPointerCapture(event.pointerId);
  });
  ui.canvas.addEventListener("pointermove", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    yaw -= (event.clientX - pointer.x) * 0.006;
    pitch = Math.max(
      -0.05,
      Math.min(1.1, pitch + (event.clientY - pointer.y) * 0.006),
    );
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  ui.canvas.addEventListener("pointerup", () => {
    pointer = null;
  });
  ui.canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      distance = Math.max(
        28,
        Math.min(140, distance * Math.exp(event.deltaY * 0.001)),
      );
    },
    { passive: false },
  );

  let statsReadbackBusy = false;
  let awake = 1,
    contacting = 0,
    maxChain = 0,
    cacheOverflow = 0;
  const readStats = () => {
    if (statsReadbackBusy) return;
    statsReadbackBusy = true;
    const readback = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(counters, 0, readback, 0, 16);
    device.queue.submit([encoder.finish()]);
    readback
      .mapAsync(GPUMapMode.READ)
      .then(() => {
        const values = new Uint32Array(readback.getMappedRange());
        awake = values[0];
        contacting = values[1];
        maxChain = values[2];
        cacheOverflow = values[3];
        readback.unmap();
      })
      .catch(() => {})
      .finally(() => {
        readback.destroy();
        statsReadbackBusy = false;
      });
  };

  let last = performance.now(),
    fps = 60,
    frame = 0,
    autoElapsed = 0;
  const samples = [];
  const report = { samples, adapter: adapter.info, blocks: BLOCK_COUNT };
  globalThis.__STRESS_REPORT__ = report;
  const frameLoop = (now) => {
    const elapsed = Math.min(0.1, Math.max(0.0001, (now - last) / 1000));
    last = now;
    fps = fps * 0.92 + (1 / elapsed) * 0.08;
    if (!paused) {
      encodePhysics();
      autoElapsed += elapsed;
      if (ui.auto.checked && autoElapsed > 5.2) {
        shoot();
        autoElapsed = 0;
      }
    }
    render();
    samples.push({
      frameMs: elapsed * 1000,
      physicsMs: solverTimer.latestMs,
      gridMs: broadphaseTimer.latestMs,
      renderMs: renderTimer.latestMs,
      awake,
      cacheOverflow,
    });
    if (samples.length > 300) samples.shift();
    report.frames = frame;
    if (frame++ % 30 === 0) readStats();
    const time = (timer) =>
      timer.latestMs == null ? "n/a" : `${timer.latestMs.toFixed(2)} ms`;
    ui.stats.textContent = [
      `${BLOCK_COUNT.toLocaleString()} blocks · ${fps.toFixed(1)} FPS`,
      `Projectile ${ui.collider.value} · quaternion rotation`,
      `Awake ${awake.toLocaleString()} · contacting ${contacting.toLocaleString()}`,
      `Spatial grid ${GRID_DIMS.join("×")} · max chain ${maxChain}`,
      `Contact cache ${((BODY_COUNT * CONTACT_CACHE_BYTES) / 1048576).toFixed(1)} MiB · overflow ${cacheOverflow}`,
      `GPU grid / substep   ${time(broadphaseTimer)}`,
      `GPU physics incl grid ${time(solverTimer)}`,
      `GPU instanced render ${time(renderTimer)}`,
      `${SUBSTEPS} substeps · ${SOLVER_ITERATIONS} Jacobi iterations`,
      timestampQueries
        ? "Hardware timestamp queries enabled"
        : "GPU timestamps unavailable",
    ].join("\n");
    animation = requestAnimationFrame(frameLoop);
  };
  let animation = requestAnimationFrame(frameLoop);

  return {
    waitForIdle: () => device.queue.onSubmittedWorkDone(),
    dispose() {
      cancelAnimationFrame(animation);
      broadphaseTimer.destroy();
      solverTimer.destroy();
      renderTimer.destroy();
      for (const resource of [
        bodies,
        snapshot,
        contactCache,
        cellHead,
        nextBody,
        params,
        counters,
        camera,
        cubeBuffer,
        sphereBuffer,
        capsuleBuffer,
        depthTexture,
      ])
        resource?.destroy();
      device.destroy();
      ui.style.remove();
      ui.shell.remove();
    },
  };
}

export {
  makeCubeVertices,
  makeSphereVertices,
  BODY_BYTES,
  CONTACT_CACHE_BYTES,
  BLOCK_COUNT,
  BODY_COUNT,
  CELL_SIZE,
  GRID_MIN,
  GRID_DIMS,
  packInitialBodies,
  packProjectile,
};
