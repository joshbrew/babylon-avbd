import { NullEngine, Scene } from "@babylonjs/core";
import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { AvbdPhysics } from "../src/babylon/babylonAvbd.js";
import { createWebGPUDevice } from "../src/gpu/device.js";
import { assert, close } from "./helpers/gpu.js";
export async function releaseApiGpuTests(device, test) {
  for (const mode of [
    "contact storage",
    "pair storage",
    "solve groups",
    "stale solve groups",
  ])
    for (const sensors of [false, true])
      await test(`Release API: 2D holds failed ${mode} steps and recovers${sensors ? " with sensors and bounce" : ""}`, async () => {
        const s = new AvbdScene2D({ gravity: -10, iterations: 5 });
        s.addPlane();
        for (let i = 0; i < 6; i++)
          s.addBox([1, 1], {
            position: [(i % 3) * 0.9, 0.45 + Math.floor(i / 3) * 0.9],
            velocity: [0.1, 0, 0.1],
            restitution: sensors ? 0.5 : 0,
            isTrigger: sensors && i === 5,
          });
        s.addJoint(-1, 1, [0, 0.45]);
        const g = s.createSolver(device);
        try {
          g.step();
          await g.readCounters();
          const before = await g.readBodies(),
            joints = await g.readJoints(),
            contacts = g.contactCapacity,
            pairs = g.pairCapacity;
          if (mode === "contact storage") g.contactCapacity = 1;
          else if (mode === "pair storage") g.pairCapacity = 1;
          else {
            g.colorCap = 1;
            g.colorRounds = 0;
            if (mode === "solve groups")
              device.queue.writeBuffer(
                g.colorBuffer,
                0,
                new Uint32Array(g.bodyCapacity).fill(255),
              );
          }
          g.step();
          const counters = await g.readCounters(),
            held = await g.readBodies(),
            heldJoints = await g.readJoints();
          assert(
            mode.includes("solve groups")
              ? counters.clashes > 0
              : counters.overflow > 0,
            "failure is reported",
          );
          assert(
            held.every((v, i) => v === before[i]),
            "failed step retains every pose and velocity field",
          );
          assert(
            heldJoints.every((v, i) => v === joints[i]),
            "failed step retains joint warm-start forces",
          );
          g.contactCapacity = contacts;
          g.pairCapacity = pairs;
          g.colorCap = 8;
          g.colorRounds = 16;
          g.adapt(counters);
          g.step();
          const recovered = await g.readCounters(),
            after = await g.readBodies();
          assert(
            !recovered.overflow && !recovered.clashes,
            "recovery completes collision topology",
          );
          assert(
            after.every(Number.isFinite) && after.some((v, i) => v !== held[i]),
            "valid movement resumes",
          );
        } finally {
          g.destroy();
        }
      });
  await test("Release API: invalid native 3D body options do not leave phantom bodies", async () => {
    const s = new AvbdScene3D();
    const constructors = [
      (o) => s.addBox([1, 1, 1], o),
      (o) => s.addSphere(0.5, o),
      (o) => s.addCapsule(0.3, 2, o),
      (o) => s.addHull([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], o),
    ];
    for (const make of constructors)
      for (const options of [
        { restitution: 2 },
        { mass: -1 },
        { isTrigger: 1 },
        { allowSleep: 1 },
        { rotation: [0, 0, 0, 0] },
        { velocity: [NaN, 0, 0] },
        { angularVelocity: [0, Infinity, 0] },
        { group: -1 },
        { collidesWith: 0x100000000 },
        { density: 0, mass: 1 },
      ]) {
        let rejected = false;
        try {
          make(options);
        } catch {
          rejected = true;
        }
        assert(rejected && s.bodies.length === 0, "invalid body is atomic");
      }
    const b = s.addBox([1, 1, 1], { position: [0, 4, 0] });
    const joint = s.addJoint(null, b, [0, 4, 0]);
    const g = s.createSolver(device);
    g.step();
    assert(
      (await g.readBodies()).every(Number.isFinite),
      "valid scene after invalid requests",
    );
    g.destroy();
    joint.dispose();
    joint.dispose();
    assert(joint.disposed, "constraint cleanup after solver destruction");
  });
  await test("Release API: native 3D masks initialize correctly and reject partial edits", async () => {
    const s = new AvbdScene3D({ gravity: 0 });
    s.addBox([1, 1, 1], { position: [0, 4, 0], group: 1, collidesWith: 2 });
    s.addSphere(0.5, { position: [0.8, 4, 0], group: 4, collidesWith: 1 });
    const g = s.createSolver(device);
    try {
      g.step();
      assert(
        (await g.readCounters()).contacts === 0,
        "builder masks block overlap",
      );
      for (const edit of [
        () => g.setFilters([0, 1], [1, -1], [2, 1]),
        () => g.setFilters([g.bodyCount], [1], [1]),
        () => g.setFilters([0], [1], []),
      ]) {
        let rejected = false;
        try {
          edit();
        } catch {
          rejected = true;
        }
        assert(rejected, "invalid filter edit rejected");
      }
      g.step();
      assert(
        (await g.readCounters()).contacts === 0,
        "rejected batch leaves both masks unchanged",
      );
      g.setFilters([g.gpuIndex(1)], [2], [1]);
      g.step();
      assert(
        (await g.readCounters()).contacts > 0,
        "live valid mask enables contact",
      );
    } finally {
      g.destroy();
    }
  });
  await test("Release API: 2D motor handles reverse, stop and dispose on live GPU state", async () => {
    const s = new AvbdScene2D({
      gravity: 0,
      timeStep: 1 / 120,
      iterations: 10,
    });
    const wheel = s.addCircle(0.5),
      joint = s.addJoint(-1, wheel, [0, 0]),
      motor = s.addMotor(-1, wheel, { speed: 3, maxTorque: 20 });
    const removed = s.addSpring(
      wheel,
      s.addCircle(0.3, { position: [3, 0] }),
      [0, 0],
      [0, 0],
    );
    removed.dispose();
    const g = s.createSolver(device);
    const steps = async (n) => {
      for (let i = 0; i < n; i++) {
        g.step();
        if (i % 20 === 19) await device.queue.onSubmittedWorkDone();
      }
    };
    try {
      await steps(120);
      close(
        (await g.readBodyState(wheel)).angularVelocity,
        -3,
        0.05,
        "initial motor speed",
      );
      g.setMotor(motor.slot, { speed: -2 });
      await steps(120);
      close(
        (await g.readBodyState(wheel)).angularVelocity,
        2,
        0.05,
        "reversed live motor",
      );
      g.setMotor(motor.slot, { maxTorque: 0 });
      g.setAngularVelocity(wheel, 4);
      await steps(60);
      close(
        (await g.readBodyState(wheel)).angularVelocity,
        4,
        0.05,
        "zero torque leaves free spin",
      );
      for (const edit of [
        () => g.setMotor(joint.slot, { speed: 0 }),
        () => g.setMotor(motor.slot, { maxTorque: -1 }),
        () => g.setWorldAnchor(joint.slot, NaN, 0),
        () => g.appendJoint(-1, wheel, [0, 0], [0, 0], [NaN, 0, 0]),
      ]) {
        let rejected = false;
        try {
          edit();
        } catch {
          rejected = true;
        }
        assert(rejected, "invalid constraint edits rejected");
      }
      g.setWorldAnchor(joint.slot, 1, 0);
      await steps(120);
      close(
        (await g.readBodyState(wheel)).position[0],
        1,
        0.02,
        "live world anchor",
      );
      motor.dispose();
      motor.dispose();
      assert(motor.disposed && !motor.alive, "idempotent motor removal");
      g.destroy();
      joint.dispose();
      removed.destroy();
      assert(joint.disposed, "cleanup after solver destroy");
    } finally {
      g.destroy();
    }
  });
  await test("Release API: required GPU limits fail clearly and preferred capacities adapt", async () => {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "high-performance",
    });
    for (const limits of [
      {
        maxStorageBuffersPerShaderStage:
          adapter.limits.maxStorageBuffersPerShaderStage + 1,
      },
      { unknownLimit: 1 },
      { maxBufferSize: NaN },
    ]) {
      let message = "";
      try {
        await createWebGPUDevice({ requiredLimits: limits });
      } catch (e) {
        message = e.message;
      }
      assert(
        message.includes("GPU limit"),
        "required limits are not silently weakened",
      );
    }
    const built = await createWebGPUDevice({
      preferredLimits: { maxBufferSize: Number.MAX_SAFE_INTEGER },
      requiredLimits: { maxStorageBuffersPerShaderStage: 8 },
    });
    assert(
      built.device.limits.maxBufferSize === built.adapter.limits.maxBufferSize,
      "preferred maximum adapts",
    );
    built.device.destroy();
  });
  await test("Release API: device loss stops Babylon stepping and preserves the caller's ownership", async () => {
    const built = await createWebGPUDevice(),
      engine = new NullEngine(),
      scene = new Scene(engine);
    const w = await AvbdPhysics.create({
      device: built.device,
      scene,
      syncMeshes: false,
    });
    try {
      built.device.destroy();
      await built.device.lost;
      await Promise.resolve();
      assert(
        w.deviceLost && w.errors.length === 1,
        "device loss is reported once",
      );
      let stopped = false;
      try {
        w.step();
      } catch (e) {
        stopped = e.message.includes("disposed");
      }
      assert(stopped, "lost world rejects further work");
      scene.onBeforeRenderObservable.notifyObservers(scene);
      w.dispose();
    } finally {
      w.dispose();
      scene.dispose();
      engine.dispose();
    }
  });
}
