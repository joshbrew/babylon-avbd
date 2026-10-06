import * as BABYLON from "./babylonDemo.js";
import {
  AvbdPhysics,
  AvbdPhysicsAggregate,
  AvbdShapeType,
} from "../src/babylon/babylonAvbd.js";

const colors = [
  new BABYLON.Color3(0.85, 0.32, 0.24),
  new BABYLON.Color3(0.93, 0.65, 0.25),
  new BABYLON.Color3(0.24, 0.58, 0.78),
  new BABYLON.Color3(0.25, 0.69, 0.52),
  new BABYLON.Color3(0.65, 0.46, 0.77),
];
export async function startMixedColliderDemo({
  root = document.body,
  count = 240,
} = {}) {
  root.innerHTML = `<div class="mixed-demo"><canvas aria-label="Mixed collider gallery"></canvas><aside><a href="/">← Back to main page</a><h1>Mixed colliders</h1><p>Spheres, boxes, capsules, cylinder hulls and convex wedges.<br>All contacts and rotations run in the GPU rigid-body solver.</p><div><button>Pause</button><button>Reset</button><button>Burst</button><button>Shoot</button></div><p class="mixed-status">Loading…</p></aside></div>`;
  const container = root.firstElementChild,
    canvas = container.querySelector("canvas"),
    status = container.querySelector(".mixed-status");
  Object.assign(container.style, {
    position: "fixed",
    inset: "0",
    background: "#e9edf3",
    font: "14px system-ui",
    color: "#243244",
  });
  Object.assign(canvas.style, {
    width: "100%",
    height: "100%",
    display: "block",
    touchAction: "none",
  });
  Object.assign(container.querySelector("aside").style, {
    position: "absolute",
    left: "20px",
    top: "20px",
    maxWidth: "365px",
    background: "rgba(255,255,255,.9)",
    padding: "18px",
    borderRadius: "12px",
    boxShadow: "0 8px 32px #26354418",
  });
  for (const button of container.querySelectorAll("button"))
    Object.assign(button.style, {
      padding: "8px 14px",
      marginRight: "5px",
      border: "1px solid #ccd6e2",
      background: "#fff",
      borderRadius: "6px",
      cursor: "pointer",
    });
  const engine = new BABYLON.Engine(canvas, true, {
    antialias: true,
    stencil: false,
  });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.91, 0.93, 0.96, 1);
  const camera = new BABYLON.ArcRotateCamera(
    "gallery-camera",
    -Math.PI * 0.65,
    Math.PI * 0.34,
    18,
    new BABYLON.Vector3(0, 1.5, 0),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 5;
  camera.upperRadiusLimit = 40;
  camera.wheelPrecision = 50;
  const sky = new BABYLON.HemisphericLight(
    "sky",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  sky.intensity = 0.65;
  sky.groundColor = new BABYLON.Color3(0.23, 0.28, 0.36);
  const sun = new BABYLON.DirectionalLight(
    "sun",
    new BABYLON.Vector3(-0.4, -1, 0.6),
    scene,
  );
  sun.position = new BABYLON.Vector3(8, 15, -10);
  sun.intensity = 1.05;
  const shadow = new BABYLON.ShadowGenerator(1024, sun);
  shadow.usePercentageCloserFiltering = true;
  shadow.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "gallery-aa",
    false,
    scene,
    [camera],
  );
  pipeline.fxaaEnabled = true;
  pipeline.samples = 1;
  const materials = colors.map((color, i) => {
    const m = new BABYLON.StandardMaterial(`gallery-${i}`, scene);
    m.diffuseColor = color;
    m.specularColor = new BABYLON.Color3(0.12, 0.12, 0.12);
    m.specularPower = 48;
    return m;
  });
  const floorMat = new BABYLON.StandardMaterial("gallery-floor", scene);
  floorMat.diffuseColor = new BABYLON.Color3(0.72, 0.77, 0.82);
  floorMat.specularColor = BABYLON.Color3.Black();
  const world = await AvbdPhysics.create({
    autoAttach: false,
    scene,
    capacity: count + 100,
    iterations: 10,
    syncMeshes: true,
  });
  const aggregates = [],
    initial = [];
  let paused = false,
    accumulator = 0,
    inFlight = 0,
    fps = 60,
    frame = 0,
    projectileIndex = 0;
  const floor = BABYLON.MeshBuilder.CreateBox(
    "floor",
    { width: 14, height: 0.4, depth: 11 },
    scene,
  );
  floor.position.y = -0.2;
  floor.material = floorMat;
  floor.receiveShadows = true;
  new AvbdPhysicsAggregate(
    floor,
    AvbdShapeType.BOX,
    { mass: 0, friction: 0.65 },
    world,
  );
  // Walls are actual static colliders, preventing an unbounded pile from leaving the view.
  for (const [x, z, w, d] of [
    [-7, 0, 0.3, 11],
    [7, 0, 0.3, 11],
    [0, -5.5, 14, 0.3],
    [0, 5.5, 14, 0.3],
  ]) {
    const wall = BABYLON.MeshBuilder.CreateBox(
      "boundary",
      { width: w, height: 0.5, depth: d },
      scene,
    );
    wall.position.set(x, 0.25, z);
    wall.material = floorMat;
    new AvbdPhysicsAggregate(wall, AvbdShapeType.BOX, { mass: 0 }, world);
  }
  const makeWedge = (name) => {
    const mesh = new BABYLON.Mesh(name, scene),
      data = new BABYLON.VertexData();
    data.positions = [
      -0.35, -0.22, -0.3, 0.35, -0.22, -0.3, 0.35, -0.22, 0.3, -0.35, -0.22,
      0.3, -0.35, 0.3, 0, 0.35, 0.3, 0,
    ];
    data.indices = [
      0, 2, 1, 0, 3, 2, 0, 1, 5, 0, 5, 4, 3, 4, 5, 3, 5, 2, 0, 4, 3, 1, 2, 5,
    ];
    data.normals = [];
    BABYLON.VertexData.ComputeNormals(
      data.positions,
      data.indices,
      data.normals,
    );
    data.applyToMesh(mesh);
    return mesh;
  };
  for (let i = 0; i < count; i++) {
    const kind = i % 5,
      name = `collider-${i}`;
    const mesh =
      kind === 0
        ? BABYLON.MeshBuilder.CreateSphere(
            name,
            { diameter: 0.65, segments: 12 },
            scene,
          )
        : kind === 1
          ? BABYLON.MeshBuilder.CreateBox(
              name,
              { width: 0.62, height: 0.52, depth: 0.58 },
              scene,
            )
          : kind === 2
            ? BABYLON.MeshBuilder.CreateCapsule(
                name,
                {
                  height: 1.05,
                  radius: 0.19,
                  tessellation: 8,
                  subdivisions: 2,
                  capSubdivisions: 2,
                },
                scene,
              )
            : kind === 3
              ? BABYLON.MeshBuilder.CreateCylinder(
                  name,
                  { height: 0.9, diameter: 0.42, tessellation: 12 },
                  scene,
                )
              : makeWedge(name);
    // Spaced placement keeps initial colliders separate and reproducible.
    mesh.position.set(
      ((i % 10) - 4.5) * 1.1,
      1 + Math.floor(i / 80) * 1.5,
      ((Math.floor(i / 10) % 8) - 3.5) * 1.15,
    );
    mesh.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
      0.13 * (i % 3),
      0.31 * i,
      0.12 * (i % 4),
    );
    mesh.material = materials[kind];
    shadow.addShadowCaster(mesh);
    mesh.receiveShadows = true;
    const type = [
      AvbdShapeType.SPHERE,
      AvbdShapeType.BOX,
      AvbdShapeType.CAPSULE,
      AvbdShapeType.CYLINDER,
      AvbdShapeType.CONVEX_HULL,
    ][kind];
    const aggregate = new AvbdPhysicsAggregate(
      mesh,
      type,
      { mass: 1, friction: 0.6 },
      world,
    );
    aggregates.push(aggregate);
    initial.push({
      position: mesh.position.clone(),
      rotation: mesh.rotationQuaternion.clone(),
    });
  }
  const wallBricks = [];
  for (let row = 0; row < 5; row++)
    for (let col = 0; col < 10; col++) {
      const mesh = BABYLON.MeshBuilder.CreateBox(
        `wall-${row}-${col}`,
        { width: 0.6, height: 0.28, depth: 0.45 },
        scene,
      );
      mesh.position.set(
        (col - 4.5) * 0.61 + (row % 2) * 0.305,
        0.14 + row * 0.29,
        4.65,
      );
      mesh.rotationQuaternion = BABYLON.Quaternion.Identity();
      mesh.material = materials[1];
      shadow.addShadowCaster(mesh);
      const a = new AvbdPhysicsAggregate(
        mesh,
        AvbdShapeType.BOX,
        { mass: 0.7, friction: 0.65 },
        world,
      );
      wallBricks.push(a);
      aggregates.push(a);
      initial.push({
        position: mesh.position.clone(),
        rotation: mesh.rotationQuaternion.clone(),
      });
    }
  // Reserve all projectile slots once; spawning performs only a small GPU command upload.
  const projectiles = [];
  for (let i = 0; i < 8; i++) {
    const mesh = BABYLON.MeshBuilder.CreateSphere(
      `projectile-${i}`,
      { diameter: 0.8, segments: 16 },
      scene,
    );
    mesh.position.set(-6, 0.45, -4.5 + i);
    mesh.material = materials[0];
    shadow.addShadowCaster(mesh);
    const a = new AvbdPhysicsAggregate(
      mesh,
      AvbdShapeType.SPHERE,
      { mass: 8, friction: 0.5 },
      world,
    );
    projectiles.push(a);
    aggregates.push(a);
    initial.push({
      position: mesh.position.clone(),
      rotation: BABYLON.Quaternion.Identity(),
    });
  }
  world.initialize();
  const reset = () => {
    aggregates.forEach((a, i) =>
      a.body
        .teleport(initial[i].position, initial[i].rotation)
        .setLinearVelocity(BABYLON.Vector3.Zero())
        .setAngularVelocity(BABYLON.Vector3.Zero()),
    );
    accumulator = 0;
    world.flushCommands();
  };
  const shoot = () => {
    const a = projectiles[projectileIndex++ % 8];
    a.body
      .teleport(
        new BABYLON.Vector3(0, 0.65, -3.8),
        BABYLON.Quaternion.Identity(),
      )
      .setLinearVelocity(new BABYLON.Vector3(0, 1, 22))
      .setAngularVelocity(new BABYLON.Vector3(0, 2, 0));
    world.flushCommands();
  };
  const buttons = [...container.querySelectorAll("button")];
  buttons[0].onclick = () => {
    paused = !paused;
    buttons[0].textContent = paused ? "Resume" : "Pause";
  };
  buttons[1].onclick = reset;
  buttons[2].onclick = () => {
    for (let i = 0; i < count; i++)
      aggregates[i].body.applyImpulse(
        new BABYLON.Vector3(
          Math.sin(i) * 2,
          3 + Math.cos(i),
          Math.cos(i * 0.3) * 2,
        ),
      );
    world.flushCommands();
  };
  buttons[3].onclick = shoot;
  const key = (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      shoot();
    }
    if (e.code === "KeyR") reset();
    if (e.code === "KeyP") buttons[0].click();
  };
  const resize = () => engine.resize();
  window.addEventListener("keydown", key);
  window.addEventListener("resize", resize);
  engine.runRenderLoop(() => {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    fps = fps * 0.95 + 0.05 / Math.max(dt, 0.001);
    if (!paused) {
      accumulator = Math.min(accumulator + dt, 0.05);
      for (
        let n = 0;
        accumulator >= world.ref.dt && n < 3 && inFlight < 2;
        n++
      ) {
        world.step();
        accumulator -= world.ref.dt;
        inFlight++;
        world.device.queue.onSubmittedWorkDone().then(
          () => inFlight--,
          () => inFlight--,
        );
      }
    }
    scene.render();
    frame++;
    status.textContent = `${world.aggregates.length} bodies · ${fps.toFixed(0)} FPS · ${world.counters?.contacts ?? 0} contact points${world.errors.length ? " · " + world.errors[0] : ""}`;
  });
  globalThis.__MIXED_GALLERY__ = {
    world,
    reset,
    shoot,
    pause: (v) => {
      paused = v;
    },
    step: async (n) => {
      for (let i = 0; i < n; i++) {
        world.step();
        await world.device.queue.onSubmittedWorkDone();
      }
      await world.syncMeshes();
    },
    snapshot: async () => ({
      frame,
      steps: world.steps,
      poses: Array.from(await world.readBodies()),
      counters: await world.gpu.readCounters(),
      errors: world.errors,
      types: aggregates.map((a) => a.type),
      initial: initial.map((p) => ({
        position: p.position.asArray(),
        rotation: p.rotation.asArray(),
      })),
      indices: aggregates.map((a) => a.body.gpuIndex),
    }),
  };
  return {
    scene,
    engine,
    world,
    shoot,
    reset,
    dispose() {
      engine.stopRenderLoop();
      window.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
      world.dispose();
      shadow.dispose();
      pipeline.dispose();
      engine.dispose();
      root.innerHTML = "";
    },
  };
}
