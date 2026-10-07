import {
  NullEngine,
  Scene,
  MeshBuilder,
  Vector3,
  Quaternion,
} from "@babylonjs/core";
import {
  AvbdPhysics,
  AvbdShapeType,
  AvbdScene3D,
  AvbdScene2D,
  createWebGPUDevice,
  prepareWebGPUDevice3D,
} from "../src/index.js";
import { assert, close } from "./helpers/gpu.js";
import { BodyReadback } from "../src/gpu/bodyReadback.js";

export async function packageFeatureGpuTests(device, test) {
  await test("Package device preparation qualifies native 3D and reuses the result for Babylon", async () => {
    const { device: prepared } = await createWebGPUDevice({
      validate3D: true,
      preferredLimits: { maxStorageBuffersPerShaderStage: 9 },
    });
    let gpu, world;
    try {
      const scene = new AvbdScene3D({ iterations: 5 });
      scene.addBox([12, 1, 12], { density: 0, position: [0, -0.5, 0] });
      scene.addSphere(0.5, { position: [0, 2, 0] });
      gpu = scene.createSolver(prepared, {
        spatialSort: false,
        bodyCapacity: 4,
      });
      for (let i = 0; i < 180; i++) gpu.step();
      const poses = await gpu.readBodies();
      close(poses[41], 0.5, 0.04, "prepared native sphere rests on the floor");
      let submissions = 0;
      const submit = prepared.queue.submit.bind(prepared.queue);
      prepared.queue.submit = (commands) => {
        submissions++;
        submit(commands);
      };
      try {
        assert(
          (await prepareWebGPUDevice3D(prepared)) === prepared,
          "caller keeps device ownership",
        );
        await prepareWebGPUDevice3D(prepared);
        assert(
          submissions === 0,
          "preparation is cached, without another simulation or readback",
        );
      } finally {
        prepared.queue.submit = submit;
      }
      world = await AvbdPhysics.create({
        device: prepared,
        autoAttach: false,
        syncMeshes: false,
        capacity: 4,
      });
      assert(
        world.device === prepared && !world.ownsDevice,
        "Babylon accepts the prepared renderer-owned device",
      );
    } finally {
      world?.dispose();
      gpu?.destroy();
      prepared.destroy();
    }
  });
  await test("GPU 3D zero-torque motor leaves free angular motion unchanged", async () => {
    const scenes = [false, true].map((motor) => {
      const s = new AvbdScene3D({ gravity: 0, iterations: 20 });
      const body = s.addBox([1, 1, 1], { angularVelocity: [0, 0, 2] });
      if (motor)
        s.addMotor(null, body, {
          axisA: [0, 0, 1],
          axisB: [0, 0, 1],
          speed: -100,
          maxTorque: 0,
        });
      return s;
    });
    const states = [];
    for (const scene of scenes) {
      const gpu = scene.createSolver(device, { bodyCapacity: 4 });
      try {
        for (let i = 0; i < 120; i++) gpu.step();
        states.push(await gpu.readBodies());
      } finally {
        gpu.destroy();
      }
    }
    for (const k of [4, 5, 6, 7, 36, 37, 38])
      close(
        states[1][k],
        states[0][k],
        0.002,
        "zero drive matches free rotation",
      );
  });
  await test("GPU 2D raycasts and circle casts handle rotated boxes, rounded corners, masks and sensors", async () => {
    const scene = new AvbdScene2D({ gravity: 0 });
    const box = scene.addBox([2, 2], { density: 0, group: 2, isTrigger: true });
    const gpu = scene.createSolver(device, { bodyCapacity: 4 });
    try {
      let hit = await gpu.raycast([-3, 0], [2, 0]);
      close(hit.distance, 2, 0.001, "2D ray normalizes direction");
      assert(hit.index === box, "numeric body handle");
      hit = await gpu.circleCast([-3, 0], 0.5, [1, 0]);
      close(hit.distance, 1.5, 0.001, "circle touches before ray");
      close(hit.center[0], -1.5, 0.001, "circle center at impact");
      close(hit.point[0], -1, 0.001, "contact on box surface");
      assert(
        (await gpu.raycast([-3, 1.25], [1, 0])) === null,
        "thin ray misses",
      );
      hit = await gpu.circleCast([-3, 1.25], 0.5, [1, 0]);
      close(
        hit.distance,
        2 - Math.sqrt(0.25 - 0.0625),
        0.001,
        "exact rounded corner impact",
      );
      assert(
        (await gpu.circleCast([-3, 1.51], 0.5, [1, 0])) === null,
        "outside radius misses",
      );
      assert(
        (await gpu.circleCast([-3, 0], 0.5, [1, 0], { maxDistance: 1.4 })) ===
          null,
        "bounded query",
      );
      assert(
        (await gpu.circleCast([-3, 0], 0.5, [1, 0], { collidesWith: 1 })) ===
          null,
        "mask excludes box",
      );
      assert(
        (await gpu.raycast([-3, 0], [1, 0], { includeTriggers: false })) ===
          null,
        "sensor excluded",
      );
      assert(
        (await gpu.raycast([-3, 0], [1, 0], { ignore: [box] })) === null,
        "ignore body",
      );
      const record = await gpu.readBodies();
      record[2] = Math.PI / 4;
      gpu.device.queue.writeBuffer(gpu.bodyBuffer, 0, record);
      hit = await gpu.raycast([-3, 0], [1, 0]);
      close(hit.distance, 3 - Math.SQRT2, 0.002, "rotated rectangle exact ray");
      hit = await gpu.circleCast([0, 0], 0.1, [1, 0]);
      close(hit.distance, 0, 0, "initial overlap");
      const all = await gpu.raycastAll([
        { origin: [-3, 0], direction: [1, 0] },
        { origin: [-3, 5], direction: [1, 0] },
      ]);
      assert(all[0] && all[1] === null, "batch hits ordered");
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU 3D sphere casts use rounded faces, edges and hulls rather than inflated boxes", async () => {
    const scene = new AvbdScene3D({ gravity: 0 });
    scene.addBox([2, 2, 2], { density: 0 });
    const gpu = scene.createSolver(device, { bodyCapacity: 4 });
    try {
      let hit = await gpu.sphereCast([-3, 0, 0], 0.5, [1, 0, 0]);
      close(hit.distance, 1.5, 0.001, "sphere face sweep");
      close(hit.point[0], -1, 0.001, "target surface point");
      hit = await gpu.sphereCast([-3, 1.25, 1.25], 0.5, [1, 0, 0]);
      close(
        hit.distance,
        2 - Math.sqrt(0.25 - 0.125),
        0.001,
        "rounded corner sweep",
      );
      assert(
        (await gpu.sphereCast([-3, 1.4, 1.4], 0.5, [1, 0, 0])) === null,
        "expanded AABB corner is not a collision",
      );
      close(
        (await gpu.sphereCast([0, 0, 0], 0.5, [1, 0, 0])).distance,
        0,
        0,
        "initial overlap",
      );
    } finally {
      gpu.destroy();
    }
    for (const shape of ["sphere", "capsule", "hull"]) {
      const scene = new AvbdScene3D({ gravity: 0 });
      if (shape === "sphere") scene.addSphere(0.5, { density: 0 });
      else if (shape === "capsule") scene.addCapsule(0.5, 4, { density: 0 });
      else
        scene.addHull(
          [
            -1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1,
            1, 1, 1, 1, 1,
          ],
          { density: 0 },
        );
      const gpu = scene.createSolver(device, { bodyCapacity: 4 });
      try {
        let hit = await gpu.sphereCast([-3, 0, 0], 0.5, [1, 0, 0]);
        close(
          hit.distance,
          shape === "hull" ? 1.5 : 2,
          0.001,
          shape + " sweep",
        );
        if (shape === "hull")
          assert(
            (await gpu.sphereCast([-3, 1.4, 1.4], 0.5, [1, 0, 0])) === null,
            "hull corner remains rounded",
          );
      } finally {
        gpu.destroy();
      }
    }
  });
  await test("GPU analytic capsules support hull contacts and exact rounded raycasts", async () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      w = await AvbdPhysics.create({
        device,
        scene,
        autoAttach: false,
        syncMeshes: false,
        gravity: [0, 0, 0],
        capacity: 8,
        iterations: 20,
      });
    try {
      const mesh = MeshBuilder.CreateCapsule(
        "capsule",
        { radius: 0.3, height: 3 },
        scene,
      );
      const body = w.addAggregate(mesh, AvbdShapeType.CAPSULE);
      w.step();
      close((await body.body.readState()).mass, 1, 0, "aggregate mass");
      let hit = await w.raycast([2, 0, 0], [-1, 0, 0]);
      close(hit.distance, 1.7, 0.001, "capsule side ray");
      hit = await w.raycast([0, 3, 0], [0, -1, 0]);
      close(hit.distance, 1.5, 0.001, "capsule end ray");
      assert(
        (await w.raycast([2, 1.49, 0.29], [-1, 0, 0])) === null,
        "ray misses rounded corner inside bounding box",
      );
      hit = await w.raycast([0, 0, 0], [1, 0, 0]);
      close(hit.distance, 0, 0, "ray starts inside capsule");
      const floor = MeshBuilder.CreateBox(
        "hull",
        { width: 10, height: 1, depth: 10 },
        scene,
      );
      floor.position.y = -1.9;
      w.addAggregate(floor, AvbdShapeType.CONVEX_HULL, { mass: 0 });
      w.gpu.params.gravity = -10;
      for (let i = 0; i < 120; i++) w.step();
      const state = await body.body.readState();
      assert(
        state.position[1] > -0.06,
        "live hull kernel keeps capsule above floor",
      );
      const c = await w.gpu.readCounters();
      assert(
        c.contacts > 0 && !c.overflow && !c.clashes,
        "hull/capsule contact graph valid",
      );
      body.body.setTrigger(true);
      w.step();
      assert(
        (await w.gpu.readCounters()).contacts > 0,
        "capsule kernel composes with sensors",
      );
    } finally {
      w.dispose();
      scene.dispose();
      engine.dispose();
    }
  });
  await test("GPU analytic capsule collision benchmark against tessellated capsules", async () => {
    if (!device.features.has("timestamp-query")) return;
    const engine = new NullEngine(),
      renderScene = new Scene(engine),
      mesh = MeshBuilder.CreateCapsule(
        "source",
        { radius: 0.25, height: 3, tessellation: 12, subdivisions: 3 },
        renderScene,
      ),
      vertices = mesh.getVerticesData("position");
    const runs = [];
    const median = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
    try {
      for (const analytic of [true, false, false, true]) {
        const scene = new AvbdScene3D({ gravity: 0, iterations: 1 });
        for (let i = 0; i < 2048; i++) {
          const position = [(i % 64) * 5, 0, Math.floor(i / 64) * 5];
          const cap = analytic
            ? scene.addCapsule(0.25, 3, { position })
            : scene.addHull(vertices, { position });
          if (!analytic) {
            cap.mass = 1;
            cap.moment.set([1, 1, 1]);
          }
          scene.addSphere(0.25, {
            position: [position[0] + 0.45, 0, position[2]],
            density: 0,
          });
        }
        const gpu = scene.createSolver(device, { bodyCapacity: 4096 });
        try {
          gpu.params.gravity = 0;
          gpu.params.iterations = 0;
          gpu.params.reuseContacts = false;
          for (let batch = 0; batch < 10; batch++) {
            for (let i = 0; i < 50; i++) gpu.step();
            await device.queue.onSubmittedWorkDone();
          }
          const profiles = [];
          for (let i = 0; i < 41; i++) {
            const pending = new Promise((resolve) =>
              gpu.profileNextStep(resolve),
            );
            gpu.step();
            await device.queue.onSubmittedWorkDone();
            profiles.push(await pending);
          }
          const counters = await gpu.readCounters();
          assert(
            counters.manifolds === 2048 &&
              !counters.overflow &&
              !counters.clashes,
            "complete matched collision workload",
          );
          runs.push({
            analytic,
            collisionMs: median(profiles.map((p) => p.collision)),
            totalMs: median(profiles.map((p) => p.total)),
            contacts: counters.contacts,
          });
        } finally {
          gpu.destroy();
        }
      }
    } finally {
      renderScene.dispose();
      engine.dispose();
    }
    globalThis.__GPU_TEST_RESULT__.capsuleBenchmark = {
      hardware: globalThis.__GPU_TEST_RESULT__.hardware,
      bodies: 4096,
      pairs: 2048,
      iterations: 0,
      reuseContacts: false,
      description:
        "Collision-only capsule/sphere pairs; fresh narrowphase every step; 500 warm-up steps and 41 samples per run; analytic/hull/hull/analytic order. GPU timing varies with clock and power state; this is not total application FPS.",
      runs,
    };
  });
  await test("GPU analytic capsules detect segment crossings, rounded corners and stable floor support", async () => {
    const inspect = async (build, expected) => {
      const scene = new AvbdScene3D({ gravity: 0, iterations: 1 });
      build(scene);
      const gpu = scene.createSolver(device, { bodyCapacity: 8 });
      try {
        gpu.params.iterations = 0;
        gpu.step();
        const c = await gpu.readCounters();
        assert(
          c.contacts === expected,
          `expected ${expected} capsule contacts, got ${c.contacts}`,
        );
        assert(!c.overflow && !c.clashes, "valid capsule graph");
        assert((await gpu.readBodies()).every(Number.isFinite), "finite state");
      } finally {
        gpu.destroy();
      }
    };
    await inspect((s) => {
      s.addCapsule(0.2, 6);
      s.addCapsule(0.2, 6, { rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2] });
    }, 1);
    await inspect((s) => {
      s.addCapsule(0.2, 6);
      s.addSphere(0.2, { position: [0.35, 0, 0], density: 0 });
    }, 1);
    await inspect((s) => {
      s.addSphere(0.2, { position: [0.35, 0, 0], density: 0 });
      s.addCapsule(0.2, 6);
    }, 1);
    await inspect((s) => {
      s.addCapsule(0.2, 6);
      s.addBox([0.2, 0.2, 0.2], { density: 0 });
    }, 1);
    await inspect((s) => {
      s.addCapsule(0.2, 0.4, { position: [0.66, 0.66, 0] });
      s.addBox([1, 1, 1], { density: 0 });
    }, 0);
    await inspect((s) => {
      s.addCapsule(0.2, 6, { position: [0.35, 0, 0] });
      s.addCapsule(0.2, 6, { density: 0 });
    }, 2);
    const scene = new AvbdScene3D({ iterations: 20 });
    scene.addBox([20, 1, 20], { density: 0, position: [0, -0.5, 0] });
    const cap = scene.addCapsule(0.3, 3, {
      position: [0, 0.3, 0],
      rotation: [0, 0, Math.SQRT1_2, Math.SQRT1_2],
    });
    const gpu = scene.createSolver(device, { bodyCapacity: 8 });
    try {
      for (let i = 0; i < 240; i++) gpu.step();
      const p = await gpu.readBodies(),
        o = gpu.gpuIndex(scene.bodies.indexOf(cap)) * 40;
      close(p[o + 1], 0.3, 0.02, "capsule rests at exact radius");
      assert(
        Math.hypot(...p.slice(o + 32, o + 35)) < 0.04,
        "resting capsule settles",
      );
      close(p[o + 39], -1, 0, "analytic shape tag preserved");
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU 2D triggers preserve motion, honor masks and emit one entry/exit per face", async () => {
    const scene = new AvbdScene2D({ gravity: 0, iterations: 20 });
    scene.addBox([1, 1], {
      density: 0,
      isTrigger: true,
      group: 2,
      collidesWith: 1,
    });
    const mover = scene.addBox([1, 1], {
      position: [-2, 0],
      velocity: [3, 0, 0],
      group: 1,
      collidesWith: 2,
    });
    const gpu = scene.createSolver(device, { bodyCapacity: 4 });
    try {
      gpu.watchContacts();
      for (let i = 0; i < 90; i++) gpu.step();
      const result = await gpu.readContactEvents(),
        p = await gpu.readBodies();
      assert(
        result.events.length === 2 &&
          result.events[0].type === "begin" &&
          result.events[1].type === "end",
        "single entry and exit: " + JSON.stringify(result),
      );
      assert(
        result.events.every((e) => e.isTrigger),
        "sensor events tagged",
      );
      close(p[mover * 24], 2.5, 0.003, "sensor does not block motion");
      close(p[mover * 24 + 12], 3, 0.003, "velocity preserved");
      gpu.setFilters([mover], [1], [0]);
      const body = p.slice(mover * 24, mover * 24 + 24);
      body[0] = -2;
      gpu.device.queue.writeBuffer(gpu.bodyBuffer, mover * 96, body);
      for (let i = 0; i < 90; i++) gpu.step();
      assert(
        (await gpu.readContactEvents()).events.length === 0,
        "masked overlap silent",
      );
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU native 3D hinge and motor initialize their angular records before the first step", async () => {
    const scene = new AvbdScene3D({ gravity: 0, iterations: 20 });
    const rotor = scene.addBox([1, 1, 1]);
    const hinge = scene.addHinge(null, rotor, {
      axisA: [0, 0, 1],
      axisB: [0, 0, 1],
      motor: { speed: 2, maxTorque: 100 },
    });
    const gpu = scene.createSolver(device, { bodyCapacity: 4 });
    try {
      for (let i = 0; i < 120; i++) gpu.step();
      const p = await gpu.readBodies();
      close(p[38], 2, 0.08, "3D native motor speed");
      assert(Math.hypot(...p.slice(0, 3)) < 0.01, "native pivot fixed");
      gpu.setMotor(hinge.motor.slot, { speed: -1, maxTorque: 100 });
      for (let i = 0; i < 120; i++) gpu.step();
      close((await gpu.readBodies())[38], -1, 0.08, "native motor reverses");
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU 2D restitution rebounds at the requested speed without face-point amplification", async () => {
    const scene = new AvbdScene2D({ gravity: 0, iterations: 20 });
    scene.addBox([20, 1], { density: 0, position: [0, -0.5] });
    const ball = scene.addBox([1, 1], {
      position: [0, 0.48],
      friction: 0,
      restitution: 0.8,
      velocity: [0, -5, 0],
    });
    const gpu = scene.createSolver(device, { bodyCapacity: 4 });
    try {
      gpu.step();
      const p = await gpu.readBodies();
      close(p[ball * 24 + 13], 4, 0.06, "2D rebound speed");
      close(p[ball * 24 + 14], 0, 0.002, "balanced face does not spin");
      gpu.setRestitution(ball, 0);
      assert(gpu.restitution.active.size === 0, "zero disables bounce work");
      const c = await gpu.readCounters();
      assert(!c.overflow && !c.clashes, "valid 2D contact graph");
    } finally {
      gpu.destroy();
    }
  });
  await test("GPU 3D hinge permits axial rotation and enforces angle stops with a torque-limited motor", async () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      w = await AvbdPhysics.create({
        device,
        scene,
        autoAttach: false,
        syncMeshes: false,
        gravity: [0, 0, 0],
        capacity: 8,
        iterations: 20,
      });
    try {
      const mesh = MeshBuilder.CreateBox("rotor", { size: 1 }, scene);
      const b = w.addAggregate(mesh, AvbdShapeType.BOX);
      const hinge = w.addHinge(null, b.body, {
        axisA: [0, 0, 1],
        axisB: [0, 0, 1],
        minAngle: -0.4,
        maxAngle: 0.4,
        motor: { speed: 2, maxTorque: 1 },
      });
      w.step();
      await device.queue.onSubmittedWorkDone();
      let state = await b.body.readState();
      close(
        state.angularVelocity[2],
        0.1,
        0.015,
        "motor's first impulse obeys torque / inertia",
      );
      for (let i = 0; i < 180; i++) {
        w.step();
        if (i % 10 === 0) {
          const c = await w.gpu.readCounters();
          assert(!c.overflow && !c.clashes, "valid graph");
          w.gpu.adapt(c);
        }
      }
      state = await b.body.readState();
      const angle = 2 * Math.atan2(state.rotation[2], state.rotation[3]);
      assert(
        angle > 0.35 && angle < 0.43,
        "upper hinge stop holds against the motor: " + angle,
      );
      assert(
        Math.hypot(...state.position) < 0.01,
        "world hinge holds its pivot",
      );
      assert(
        Math.hypot(...state.rotation.slice(0, 2)) < 0.002,
        "other rotation axes stay locked",
      );
      hinge.motor.setMotor({ speed: -2, maxTorque: 1 });
      w.setSolverMode("optimized");
      for (let i = 0; i < 180; i++) w.step();
      state = await b.body.readState();
      const lower = 2 * Math.atan2(state.rotation[2], state.rotation[3]);
      assert(
        lower < -0.35 && lower > -0.43,
        "lower hinge stop holds: " + lower,
      );
      hinge.dispose();
      const p = await w.gpu.readJoints();
      assert(
        [hinge.limit, hinge.motor, ...hinge.joints].every(
          (c) => p[c.slot * 32 + 3] === 0,
        ),
        "all hinge rows released",
      );
    } finally {
      w.dispose();
      scene.dispose();
      engine.dispose();
    }
  });
  await test("Selected pose gathering supports half-million-body selections", async () => {
    const source = device.createBuffer({
      size: 160,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    try {
      const record = Float32Array.from({ length: 40 }, (_, i) => i + 0.25);
      device.queue.writeBuffer(source, 0, record);
      const selected = await new BodyReadback(device).read(
        source,
        new Uint32Array(500_000),
      );
      assert(selected.length === 20_000_000, "all selected records copied");
      for (const index of [0, 419_423, 419_424, 499_999])
        for (let k = 0; k < 40; k++)
          close(
            selected[index * 40 + k],
            record[k],
            0,
            "record across workgroup-row boundary",
          );
    } finally {
      source.destroy();
    }
  });
  const stage = async (fn, options = {}) => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      world = await AvbdPhysics.create({
        device,
        scene,
        autoAttach: false,
        capacity: 64,
        syncMeshes: false,
        gravity: [0, 0, 0],
        ...options,
      });
    const box = (name, position, mass = 1, rotation) => {
      const mesh = MeshBuilder.CreateBox(name, { size: 1 }, scene);
      mesh.position.set(...position);
      if (rotation) mesh.rotationQuaternion = rotation;
      return world.addAggregate(mesh, AvbdShapeType.BOX, { mass });
    };
    try {
      await fn(world, box, scene);
    } finally {
      world.dispose();
      scene.dispose();
      engine.dispose();
    }
  };
  const step = async (w, n) => {
    for (let i = 0; i < n; i++) {
      w.step();
      if (i % 10 === 0) {
        await device.queue.onSubmittedWorkDone();
        const c = await w.gpu.readCounters();
        w.gpu.adapt(c);
        assert(!c.overflow && !c.clashes, "complete collision data");
      }
    }
    await device.queue.onSubmittedWorkDone();
  };
  await test("GPU restitution obeys a sphere's bounce coefficient and zero skips bounce passes", () =>
    stage(async (w, box, scene) => {
      box("floor", [0, -0.5, 0], 0);
      const mesh = MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
      mesh.position.set(0, 0.48, 0);
      const ball = w.addAggregate(mesh, AvbdShapeType.SPHERE, {
        mass: 1,
        restitution: 0.8,
        friction: 0,
      });
      ball.body.setLinearVelocity([0, -5, 0]);
      await step(w, 1);
      const result = await ball.body.readState();
      close(result.linearVelocity[1], 4, 0.05, "80% rebound speed");
      close(result.angularVelocity[0], 0, 1e-5, "central impact has no spin");
      ball.body.setRestitution(0);
      assert(
        w.gpu.restitution.active.size === 0,
        "no bounce dispatches for zero coefficients",
      );
      ball.body.teleport(new Vector3(0, 0.5, 0));
      ball.body.setLinearVelocity([0, 0, 0]);
      await step(w, 60);
      assert(
        Math.abs((await ball.body.readState()).linearVelocity[1]) < 0.1,
        "resting body gains no bounce energy",
      );
    }));
  await test("GPU elastic sphere collision conserves momentum and kinetic energy", () =>
    stage(async (w, box, scene) => {
      const make = (name, x, mass) => {
        const mesh = MeshBuilder.CreateSphere(name, { diameter: 1 }, scene);
        mesh.position.set(x, 0, 0);
        return w.addAggregate(mesh, AvbdShapeType.SPHERE, {
          mass,
          restitution: 1,
          friction: 0,
        });
      };
      const a = make("a", -0.49, 1),
        b = make("b", 0.49, 2);
      a.body.setLinearVelocity([3, 0, 0]);
      await step(w, 1);
      const va = (await a.body.readState()).linearVelocity[0],
        vb = (await b.body.readState()).linearVelocity[0];
      close(va + 2 * vb, 3, 0.08, "linear momentum");
      close(va * va + 2 * vb * vb, 9, 0.2, "kinetic energy");
    }));
  await test("GPU triggers report entry/exit, honor masks, and never deflect motion", () =>
    stage(async (w, box) => {
      const trigger = box("trigger", [0, 0, 0], 0);
      trigger.body.setTrigger(true);
      trigger.body.setCollisionGroups(2, 1);
      const mover = box("mover", [-2, 0, 0]);
      mover.body.setCollisionGroups(1, 2);
      mover.body.setLinearVelocity([3, 0, 0]);
      w.initialize();
      w.initializeContacts();
      await step(w, 90);
      const events = (await w.readContactEvents()).events;
      assert(
        events.some((e) => e.type === "begin" && e.isTrigger),
        "trigger entry",
      );
      assert(
        events.some((e) => e.type === "end" && e.isTrigger),
        "trigger exit",
      );
      const result = await mover.body.readState();
      close(result.position[0], 2.5, 0.002, "unobstructed trajectory");
      close(result.linearVelocity[0], 3, 0.002, "unchanged velocity");
      mover.body.setCollisionGroups(1, 0);
      mover.body.teleport(new Vector3(-2, 0, 0));
      await step(w, 90);
      assert(
        (await w.readContactEvents()).events.length === 0,
        "masked trigger stays silent",
      );
      trigger.body.setTrigger(false);
      mover.body.setCollisionGroups(1, 2);
      mover.body.teleport(new Vector3(-2, 0, 0));
      mover.body.setLinearVelocity([3, 0, 0]);
      await step(w, 60);
      assert(
        (await mover.body.readState()).position[0] < -0.8,
        "turning off trigger restores solid collision",
      );
    }));
  await test("GPU sleep eligibility is per body and explicit opt-in enables the policy", () =>
    stage(async (w, box) => {
      const a = box("eligible", [0, 0, 0]),
        b = box("awake", [3, 0, 0]);
      a.body.setSleepEnabled(true);
      b.body.setSleepEnabled(false);
      await step(w, 60);
      assert((await a.body.readState()).sleeping, "opted-in body sleeps");
      assert(
        !(await b.body.readState()).sleeping,
        "opted-out body stays awake",
      );
      a.body.setSleepEnabled(false);
      await step(w, 1);
      assert(
        !(await a.body.readState()).sleeping,
        "disabling sleep wakes the body",
      );
      b.body.setSleepEnabled(true);
      await step(w, 60);
      assert(
        (await b.body.readState()).sleeping,
        "eligibility can change live",
      );
    }));
  await test("Package rotated weld preserves its rest orientation without pose readback", () =>
    stage(async (w, box) => {
      const a = box(
          "fixed",
          [0, 0, 0],
          0,
          Quaternion.FromEulerAngles(0.2, 0.6, 0.1),
        ),
        b = box(
          "welded",
          [0, 0, 0],
          1,
          Quaternion.FromEulerAngles(-0.4, 0.1, 0.5),
        );
      const initial = b.mesh.rotationQuaternion.clone(),
        joint = w.addWeld(a.body, b.body);
      b.body.applyAngularImpulse([1, 2, 3]);
      await step(w, 240);
      const state = await b.body.readState();
      close(
        Math.abs(Quaternion.Dot(initial, Quaternion.FromArray(state.rotation))),
        1,
        0.001,
        "weld orientation",
      );
      close(Math.hypot(...state.angularVelocity), 0, 0.03, "weld arrests spin");
      assert(!(await joint.readState()).broken, "intact weld");
      assert(!w.latestPoses, "no automatic readback");
    }));
  await test("Package live weld captures GPU rotation and joint slots are reused", () =>
    stage(async (w, box) => {
      const a = box("fixed", [0, 0, 0], 0),
        b = box("moving", [0, 0, 0]);
      a.body.setCollisionGroups(0, 0);
      b.body.setAngularVelocity([0, 1, 0]);
      await step(w, 20);
      const before = await b.body.readState();
      const joint = w.addWeld(a.body, b.body),
        slot = joint.slot;
      b.body.setAngularVelocity([0, 0, 0]);
      await step(w, 30);
      const after = await b.body.readState();
      close(
        Math.abs(
          Quaternion.Dot(
            Quaternion.FromArray(before.rotation),
            Quaternion.FromArray(after.rotation),
          ),
        ),
        1,
        0.001,
        "live rest frame",
      );
      joint.dispose();
      for (let i = 0; i < 20; i++) {
        const j = w.addJoint(null, b.body);
        assert(j.slot === slot, "reused released slot");
        j.dispose();
      }
      assert(w.gpu.jointCount === 1, "bounded joint storage");
    }));
  await test("Package movable world anchor, springs and breakable welds execute on GPU", () =>
    stage(async (w, box) => {
      const b = box("anchor", [0, 0, 0]),
        j = w.addJoint(null, b.body);
      j.setWorldAnchor([1, 0, 0]);
      await step(w, 600);
      close((await b.body.readState()).position[0], 1, 0.015, "world anchor");
      j.dispose();
      const a = box("spring support", [4, 0, 0], 0),
        c = box("spring bob", [6, 0, 0]);
      const spring = w.addSpring(a.body, c.body, { stiffness: 200, rest: 1 });
      await step(w, 120);
      assert((await c.body.readState()).position[0] < 5.8, "spring pulls");
      spring.dispose();
      const fixed = w.addWeld(a.body, c.body, {
        anchorA: [1, 0, 0],
        breakForce: 0.1,
        breakOnPull: true,
      });
      c.body.applyImpulse([100, 0, 0]);
      await step(w, 30);
      assert((await fixed.readState()).broken, "pull fractures mortar");
    }));
  await test("Babylon springs stretch and return, fracture in tension, and survive compression", () =>
    stage(async (w, box) => {
      const a = box("support", [0, 0, 0], 0),
        b = box("bob", [1, 0, 0]);
      await step(w, 1);
      const spring = w.addSpring(a.body, b.body, {
        stiffness: 200,
        rest: 1,
        breakStrain: 0.35,
      });
      b.body.setLinearVelocity([4, 0, 0]);
      await step(w, 6);
      const stretched = (await b.body.readState()).position[0];
      assert(
        stretched > 1.1 && stretched < 1.35,
        "measurable elastic extension before fracture",
      );
      assert(
        !(await spring.readState()).broken,
        "elastic loading remains intact",
      );
      await step(w, 20);
      assert(
        (await b.body.readState()).position[0] < stretched,
        "elastic rebound",
      );
      w.setSolverMode("optimized");
      b.body.teleport(new Vector3(0.5, 0, 0)).setLinearVelocity([0, 0, 0]);
      await step(w, 1);
      assert(!(await spring.readState()).broken, "compression does not tear");
      b.body.teleport(new Vector3(1.5, 0, 0)).setLinearVelocity([0, 0, 0]);
      await step(w, 1);
      assert(
        (await spring.readState()).broken,
        "excess tensile strain tears on GPU",
      );
      await step(w, 30);
      assert(
        (await spring.readState()).broken,
        "warm starts cannot restore severed springs",
      );
      spring.dispose();
      const force = w.addSpring(a.body, b.body, {
        stiffness: 200,
        rest: 1,
        breakForce: 10,
      });
      b.body.teleport(new Vector3(0.7, 0, 0)).setLinearVelocity([0, 0, 0]);
      await step(w, 1);
      assert(
        !(await force.readState()).broken,
        "compression exceeds force limit without tearing",
      );
      b.body.teleport(new Vector3(1.2, 0, 0)).setLinearVelocity([0, 0, 0]);
      await step(w, 1);
      assert(
        (await force.readState()).broken,
        "tensile force fractures spring",
      );
    }));
  await test("Package compact pose gathering copies only requested meshes and preserves order", () =>
    stage(async (w, box) => {
      const a = box("a", [3, 0, 0]),
        b = box("b", [-4, 0, 0]);
      a.sync = true;
      b.sync = false;
      await step(w, 1);
      assert(
        !w.gpu.springFracture,
        "rigid-only kernel excludes spring fracture work",
      );
      await w.syncMeshes();
      assert(w.lastSyncBytes === 32, "one pose is 32 bytes");
      const selected = await w.readBodies([b.body, a.body]);
      assert(selected.length === 80, "only two records");
      close(selected[0], -4);
      close(selected[40], 3);
      const binding = w.getRenderBinding(device);
      assert(
        binding.buffer === w.bodyBuffer && binding.stride === 160,
        "GPU rendering descriptor",
      );
    }));
  await test("Package rays use live GPU poses, filters, ignored bodies and convex surfaces", () =>
    stage(async (w, box, scene) => {
      const a = box("target", [3, 0, 0]);
      const sphereMesh = MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 1 },
        scene,
      );
      sphereMesh.position.set(6, 0, 0);
      const b = w.addAggregate(sphereMesh, AvbdShapeType.SPHERE);
      const hullMesh = MeshBuilder.CreateBox("hull", { size: 1 }, scene);
      hullMesh.position.set(3, 2, 0);
      const hull = w.addAggregate(hullMesh, AvbdShapeType.CONVEX_HULL);
      w.step();
      let hit = await w.raycast([0, 0, 0], [1, 0, 0]);
      assert(hit.body === a.body, "nearest box");
      close(hit.distance, 2.5, 1e-4);
      hit = await w.raycast([0, 0, 0], [1, 0, 0], { ignore: [a.body] });
      assert(hit.body === b.body, "ignore box");
      close(hit.distance, 5.5, 1e-4);
      a.body.teleport(new Vector3(10, 0, 0));
      hit = await w.raycast([0, 0, 0], [1, 0, 0]);
      assert(hit.body === b.body, "queued teleport reaches query");
      b.body.setCollisionGroups(2, 0xffffffff);
      assert(
        (await w.raycast([0, 0, 0], [1, 0, 0], {
          collidesWith: 1,
          maxDistance: 8,
        })) === null,
        "group mask and range",
      );
      hit = await w.raycast([0, 2, 0], [1, 0, 0]);
      assert(hit.body === hull.body, "convex surface query");
      close(hit.distance, 2.5, 1e-4);
    }));
  await test("Package contact events begin/end without full pose downloads", () =>
    stage(async (w, box) => {
      const a = box("static", [0, 0, 0], 0),
        b = box("touching", [0.9, 0, 0]);
      const events = [];
      const off = w.onContact((e) => events.push(e));
      await step(w, 2);
      await w.readContactEvents();
      await new Promise((r) => setTimeout(r, 0));
      assert(
        events.some(
          (e) => e.type === "begin" && (e.a === a.body || e.b === a.body),
        ),
        "begin event with handles",
      );
      b.body.teleport(new Vector3(5, 0, 0)).setLinearVelocity([0, 0, 0]);
      await step(w, 2);
      await w.readContactEvents();
      await new Promise((r) => setTimeout(r, 0));
      assert(
        events.some((e) => e.type === "end"),
        "end event",
      );
      assert(!w.latestPoses, "events don't mirror poses");
      off();
    }));
  await test("Package sleeping wakes for impulses and support removal", () =>
    stage(
      async (w, box) => {
        const floor = box("support", [0, -0.5, 0], 0),
          a = box("resting", [0, 0.5, 0]);
        await step(w, 240);
        assert(
          (await w.readSleepStats()).sleeping === 1,
          "supported body sleeps",
        );
        a.body.applyImpulse([1, 0, 0]);
        await step(w, 1);
        assert(
          (await a.body.readState()).linearVelocity[0] > 0.2,
          "sleeping body accepts impulse",
        );
        a.body
          .teleport(new Vector3(0, 0.5, 0))
          .setLinearVelocity([0, 0, 0])
          .setAngularVelocity([0, 0, 0]);
        await step(w, 240);
        assert((await w.readSleepStats()).sleeping === 1, "sleeps again");
        floor.dispose();
        await step(w, 30);
        assert(
          (await a.body.readState()).position[1] < -0.2,
          "support removal wakes falling body",
        );
      },
      {
        gravity: [0, -10, 0],
        sleeping: { speedThreshold: 0.05, timeThreshold: 0.2 },
      },
    ));
  await test("Package sleeping wakes on impact and leaves unsupported slow falls awake", () =>
    stage(
      async (w, box, scene) => {
        const floor = MeshBuilder.CreateBox(
          "floor",
          { width: 20, height: 1, depth: 20 },
          scene,
        );
        floor.position.y = -0.5;
        w.addAggregate(floor, AvbdShapeType.BOX, { mass: 0 });
        const a = box("sleep", [0, 0.5, 0]);
        await step(w, 180);
        assert(
          (await w.readSleepStats()).sleeping === 1,
          "resting body sleeps",
        );
        const b = box("projectile", [-4, 0.5, 0]);
        b.body.setLinearVelocity([8, 0, 0]);
        await step(w, 22);
        const resting = await a.body.readState();
        assert(
          resting.sleeping && resting.mass === 1 && resting.effectiveMass === 0,
          "sleeping retains physical mass",
        );
        await step(w, 18);
        const impactState = await a.body.readState();
        assert(
          !impactState.sleeping &&
            impactState.effectiveMass === 1 &&
            Math.abs(impactState.position[0]) > 0.001,
          "impact wakes and moves target",
        );
        const c = box("unsupported", [15, 5, 0]);
        w.setGravity([0, -0.001, 0]);
        await step(w, 120);
        assert(
          !(await c.body.readState()).sleeping,
          "unsupported body stays dynamic",
        );
      },
      {
        gravity: [0, -10, 0],
        sleeping: { speedThreshold: 0.05, timeThreshold: 0.2 },
      },
    ));
  await test("Package 2D joints and motors and 3D fabric are available without demo imports", async () => {
    const s2 = new AvbdScene2D({ gravity: 0 });
    assert(
      s2.topology.params.alpha === 0.95 &&
        !s2.topology.params.postStabilize &&
        s2.topology.params.matchNearest,
      "GPU-tested 2D defaults",
    );
    const originalMode = new AvbdScene2D({
      alpha: 0.99,
      postStabilize: true,
      matchNearest: false,
    });
    assert(
      originalMode.topology.params.postStabilize &&
        originalMode.topology.params.alpha === 0.99,
      "original correction mode can be selected",
    );
    const b = s2.addBox([1, 1]);
    s2.addJoint(-1, b, [0, 0], [0, 0]);
    s2.addMotor(-1, b, { speed: 2, maxTorque: 10 });
    const gpu2 = s2.createSolver(device, { bodyCapacity: 4 });
    try {
      for (let i = 0; i < 60; i++) gpu2.step();
      const p = await gpu2.readBodies();
      assert(Math.abs(p[2]) > 0.1, "2D motor rotates hinge");
      assert(p.every(Number.isFinite), "finite 2D state");
    } finally {
      gpu2.destroy();
    }
    const s3 = new AvbdScene3D({ gravity: -10 });
    const a = s3.addPoint([0, 2, 0], { mass: 0 }),
      c = s3.addPoint([1, 2, 0]);
    s3.addSpring(a, c, [0, 0, 0], [0, 0, 0], { stiffness: 1000, rest: 1 });
    const gpu3 = s3.createSolver(device, {
      spatialSort: false,
      bodyCapacity: 4,
    });
    try {
      for (let i = 0; i < 120; i++) {
        gpu3.step();
        if (i % 10 === 0) await device.queue.onSubmittedWorkDone();
      }
      const p = await gpu3.readBodies();
      assert(p.every(Number.isFinite), "finite fabric");
      assert(p[41] < 2, "point falls in y-up");
      close(p[47], 1, 0, "point does not spin");
    } finally {
      gpu3.destroy();
    }
  });
}
