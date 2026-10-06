import {
  NullEngine,
  Scene,
  MeshBuilder,
  Mesh,
  VertexData,
  Vector3,
  Quaternion,
  PhysicsShapeType,
} from "@babylonjs/core";
import {
  AvbdPhysics,
  AvbdPhysicsAggregate,
  AvbdShapeType,
} from "../src/babylon/babylonAvbd.js";
import { assert, close } from "./helpers/gpu.js";
import { GpuSolver3D } from "../reference/three-avbd/src/avbd3d/gpu/solver.ts";
import { Solver } from "../reference/three-avbd/src/avbd3d/ref/solver.ts";
import { Rigid } from "../reference/three-avbd/src/avbd3d/ref/body.ts";
import { sphere } from "../reference/three-avbd/src/avbd3d/shapes.ts";
import { projectedContactSolve } from "../src/gpu/gpuSolverKernels.js";

export async function babylonGpuTests(device, test) {
  const withWorld = async (fn) => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      world = await AvbdPhysics.create({
        device,
        scene,
        capacity: 16,
        gravity: Vector3.Zero(),
        syncMeshes: false,
      });
    try {
      await fn(world, scene);
    } finally {
      world.dispose();
      scene.dispose();
      engine.dispose();
    }
  };
  await test("Babylon scene-style aggregate, automatic stepping and disposal", () =>
    withWorld(async (w, s) => {
      const mesh = MeshBuilder.CreateBox("automatic", { size: 1 }, s);
      const a = new AvbdPhysicsAggregate(
        mesh,
        PhysicsShapeType.BOX,
        { mass: 2 },
        s,
      );
      a.body.setLinearVelocity(new Vector3(6, 0, 0));
      const observer = w.observer;
      assert(
        w.attachToScene() === w && w.observer === observer,
        "no duplicate observer",
      );
      s.getEngine().getDeltaTime = () => 1000 / 60;
      s.onBeforeRenderObservable.notifyObservers(s);
      assert(w.steps === 1, "automatic fixed step");
      await w.syncMeshes();
      close(mesh.position.x, 0.1, 1e-5, "automatic movement");
      s.dispose();
      assert(w.disposed, "scene disposes its AVBD world");
      assert(!w.ownsDevice, "caller-owned device retained");
    }));
  await test("Babylon aggregate preserves mass and GPU velocity / angular commands", () =>
    withWorld(async (w, s) => {
      const mesh = MeshBuilder.CreateBox("box", { size: 1 }, s);
      mesh.position.set(2, 3, 4);
      const a = new AvbdPhysicsAggregate(
        mesh,
        AvbdShapeType.BOX,
        { mass: 2 },
        w,
      );
      a.body
        .setLinearVelocity(new Vector3(6, 0, 0))
        .setAngularVelocity(new Vector3(0, 0, 3));
      w.step();
      await w.syncMeshes();
      const p = await w.readBodies(),
        o = a.body.gpuIndex * 40;
      close(p[o + 19], 2, 1e-6, "mass");
      close(mesh.position.x, 2.1, 1e-5, "position");
      close(p[o + 38], 3, 0.01, "angular velocity");
      assert(
        Math.abs(mesh.rotationQuaternion.z) > 0.01,
        "GPU rotation reaches Babylon",
      );
    }));
  await test("Babylon command batches reuse storage, auto-pack velocities and exclude stale records", () =>
    withWorld(async (w, s) => {
      const a = w.addAggregate(
        MeshBuilder.CreateBox("a", { size: 1 }, s),
        AvbdShapeType.BOX,
        { mass: 2 },
      );
      const b = w.addAggregate(
        MeshBuilder.CreateBox("b", { size: 1 }, s),
        AvbdShapeType.BOX,
        { mass: 2 },
      );
      a.body
        .teleport(new Vector3(0, 5, 0), Quaternion.Identity())
        .applyImpulse(new Vector3(2, 0, 0), new Vector3(0, 6, 0));
      b.body
        .teleport(new Vector3(10, 5, 0), Quaternion.Identity())
        .setAngularVelocity(new Vector3(0, 0, 2));
      w.flushCommands();
      const buffer = w.commandBuffer,
        cpu = w.commandData;
      a.body
        .setAngularVelocity(Vector3.Zero())
        .applyImpulse(new Vector3(2, 0, 0));
      w.flushCommands();
      assert(
        w.commandBuffer === buffer && w.commandData === cpu,
        "Mixed edit upload buffers persist for smaller batches",
      );
      let data = await w.readBodies(),
        ai = a.body.gpuIndex * 40,
        bi = b.body.gpuIndex * 40;
      close(
        data[ai + 38],
        0,
        1e-6,
        "Old world-point torque is cleared in reused records",
      );
      close(
        data[bi + 38],
        2,
        1e-6,
        "Stale extra records cannot overwrite neighbors",
      );
      a.body.setLinearVelocity(new Vector3(4, 5, 6));
      b.body.setLinearVelocity(new Vector3(7, 8, 9));
      w.flushCommands();
      assert(
        w.lastCommandBatch.path === "packed-velocities" &&
          w.lastCommandBatch.uploadedBytes === 32,
        "Babylon setters use compact uploads automatically",
      );
      const velocityBuffer = w.velocityBatch.values,
        binding = w.velocityBatch.binding;
      a.body.setLinearVelocity(new Vector3(4, 5, 6));
      b.body.setLinearVelocity(new Vector3(7, 8, 9));
      w.flushCommands();
      assert(
        w.velocityBatch.values === velocityBuffer &&
          w.velocityBatch.binding === binding,
        "Packed GPU storage and bindings persist",
      );
      data = await w.readBodies();
      close(data[ai + 32], 4, 1e-6, "Correct first GPU slot");
      close(data[bi + 32], 7, 1e-6, "Correct second GPU slot");
      close(
        data[bi + 38],
        2,
        1e-6,
        "Packed velocities preserve angular motion",
      );
    }));
  await test("Babylon motion, properties, sleeping and bounce share one physics submission", () =>
    withWorld(async (w, s) => {
      const bodies = Array.from({ length: 8 }, (_, i) => {
        const mesh = MeshBuilder.CreateBox(`batched-${i}`, { size: 0.5 }, s);
        mesh.position.set(i * 3, 5, 0);
        return w.addAggregate(mesh, AvbdShapeType.BOX, { mass: 2 });
      });
      w.initialize();
      w.enableSleeping();
      for (const a of bodies)
        a.body
          .setLinearVelocity(new Vector3(1, 0, 0))
          .setAngularVelocity(new Vector3(0, 0, 2))
          .setTrigger(true)
          .setRestitution(0.5)
          .setCollisionGroups(2, 2)
          .setSleepEnabled(false);
      const queue = device.queue,
        submit = queue.submit;
      let submissions = 0;
      queue.submit = function (...args) {
        submissions++;
        return submit.apply(this, args);
      };
      try {
        w.step();
      } finally {
        queue.submit = submit;
      }
      assert(
        submissions === 1,
        `Babylon physics uses one submission, got ${submissions}`,
      );
      assert(
        w.lastCommandBatch.path === "packed-motion" &&
          w.lastCommandBatch.uploadedBytes === 8 * 32,
        "Combined aggregate motion uses compact uploads",
      );
      const state = await bodies[0].body.readState();
      close(
        state.linearVelocity[0],
        1,
        5e-4,
        "Velocity applied before solving",
      );
      assert(!state.sleeping, "Per-body sleep exclusion survives batching");
      bodies[0].body
        .setTrigger(false)
        .setRestitution(0)
        .setCollisionGroups(4, 4);
      const hit = await w.raycast(new Vector3(0, 8, 0), new Vector3(0, -1, 0), {
        group: 4,
        collidesWith: 4,
        includeTriggers: false,
      });
      assert(
        hit?.body === bodies[0].body,
        "Queries flush changed aggregate properties",
      );
    }));
  await test("Babylon impulses combine on GPU without stale pose uploads", () =>
    withWorld(async (w, s) => {
      const mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, s),
        a = w.addAggregate(mesh, AvbdShapeType.SPHERE, { mass: 2 });
      a.body
        .applyImpulse(new Vector3(2, 0, 0))
        .applyImpulse(new Vector3(2, 0, 0));
      w.step();
      let p = await w.readBodies(),
        o = a.body.gpuIndex * 40;
      close(p[o + 32], 2, 1e-4, "summed impulses");
      a.body.applyImpulse(new Vector3(2, 0, 0));
      w.step();
      p = await w.readBodies();
      close(p[o + 32], 3, 1e-4, "next impulse preserves live velocity");
      assert(!w.latestPoses, "GPU-only stepping has no automatic pose mirror");
    }));
  await test("Babylon teleport, collision filters and aggregate disposal preserve other slots", () =>
    withWorld(async (w, s) => {
      const a = w.addAggregate(
        MeshBuilder.CreateBox("a", { size: 1 }, s),
        AvbdShapeType.BOX,
        { mass: 1 },
      );
      const mesh = MeshBuilder.CreateBox("b", { size: 1 }, s);
      mesh.position.x = 4;
      const b = w.addAggregate(mesh, AvbdShapeType.BOX, { mass: 3 });
      w.step();
      const first = a.body.gpuIndex,
        second = b.body.gpuIndex;
      a.body
        .teleport(new Vector3(10, 5, 2), Quaternion.Identity())
        .setLinearVelocity(Vector3.Zero());
      w.step();
      await w.syncMeshes();
      close(a.mesh.position.x, 10, 1e-5);
      a.dispose();
      w.step();
      const p = await w.readBodies();
      close(p[first * 40 + 19], 0, 1e-6);
      close(p[second * 40 + 19], 3, 1e-6);
      close(p[second * 40], 4, 1e-5);
    }));
  await test("Babylon off-centre impulses use the live GPU position without readback", () =>
    withWorld(async (w, s) => {
      const a = w.addAggregate(
        MeshBuilder.CreateBox("box", { size: 1 }, s),
        AvbdShapeType.BOX,
        { mass: 2 },
      );
      a.body.setLinearVelocity(new Vector3(6, 0, 0));
      for (let i = 0; i < 10; i++) w.step();
      await device.queue.onSubmittedWorkDone();
      a.body.applyImpulse(new Vector3(0, 1, 0), new Vector3(0, 1, 0));
      w.step();
      const p = await w.readBodies(),
        o = a.body.gpuIndex * 40;
      close(p[o + 38], -3, 0.02, "torque about live centre");
      assert(!w.latestPoses, "no pose mirror needed");
    }));
  await test("Babylon convex aggregate maintains the mesh centre and principal inertia frame", () =>
    withWorld(async (w, s) => {
      const mesh = new Mesh("asymmetric hull", s),
        v = new VertexData();
      v.positions = [0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1];
      v.indices = [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3];
      v.applyToMesh(mesh);
      mesh.position.set(3, 4, 5);
      mesh.scaling.set(1, 2, 1);
      mesh.rotationQuaternion = Quaternion.FromEulerAngles(0.2, 0.6, 0.4);
      const expected = mesh.rotationQuaternion.clone(),
        a = w.addAggregate(mesh, AvbdShapeType.CONVEX_HULL, { mass: 7 });
      w.step();
      await w.syncMeshes();
      close(mesh.position.x, 3, 1e-5);
      close(mesh.position.y, 4, 1e-5);
      close(mesh.position.z, 5, 1e-5);
      close(
        Math.abs(Quaternion.Dot(expected, mesh.rotationQuaternion)),
        1,
        1e-5,
      );
      close(a.rigid.mass, 7, 1e-6);
    }));
  await test("Babylon API validates restitution and mesh synchronization at scale", () =>
    withWorld(async (w, s) => {
      const mesh = MeshBuilder.CreateBox("box", { size: 1 }, s);
      let rejected = false;
      try {
        w.addAggregate(mesh, AvbdShapeType.BOX, { restitution: 1.5 });
      } catch (e) {
        rejected = e.message.includes("restitution");
      }
      assert(rejected, "invalid restitution must be explicit");
      w.maxSyncedBodies = 0;
      w.syncEnabled = true;
      w.addAggregate(mesh, AvbdShapeType.BOX);
      rejected = false;
      try {
        w.initialize();
      } catch (e) {
        rejected = e.message.includes("syncMeshes:false");
      }
      assert(
        rejected,
        "large scenes cannot silently get per-body CPU synchronization",
      );
    }));
  await test("Projected contact kernel matches baseline on one step and settles a spinning mixed stack", async () => {
    const make = () => {
      const s = new Solver();
      new Rigid(s, [200, 200, 1], 0, 0.6, [0, 0, -0.5]);
      for (let i = 0; i < 6; i++) {
        const b =
          i % 2
            ? sphere(s, 0.5, 1, 0.6, [0, 0, 0.5 + i * 0.99])
            : new Rigid(s, [1, 1, 1], 1, 0.6, [0, 0, 0.5 + i * 0.99]);
        b.velocityAng.set([0.01, 0.02, 0.03]);
      }
      return s;
    };
    const base = new GpuSolver3D(device, make(), { spatialSort: false }),
      fast = new GpuSolver3D(device, make(), {
        spatialSort: false,
        shaders: { solve: projectedContactSolve },
      });
    try {
      base.step();
      fast.step();
      const a = await base.readBodies(),
        b = await fast.readBodies();
      for (let i = 0; i < a.length; i++)
        close(b[i], a[i], 2e-4, "equivalent one-step state");
      for (let step = 0; step < 600; step++) {
        base.step();
        fast.step();
        if (step % 20 === 0) {
          await device.queue.onSubmittedWorkDone();
          base.adapt(await base.readCounters());
          fast.adapt(await fast.readCounters());
        }
      }
      const poses = await fast.readBodies(),
        counters = await fast.readCounters();
      assert(
        poses.every(Number.isFinite) && !counters.overflow && !counters.clashes,
        "finite collision solve",
      );
      const baseline = await base.readBodies();
      for (let i = 1; i < fast.bodyCount; i++) {
        const o = i * 40;
        assert(
          poses[o + 2] > 0.45,
          "body remains above floor: " +
            JSON.stringify({
              body: i,
              z: poses[o + 2],
              baselineZ: baseline[o + 2],
              position: Array.from(poses.subarray(o, o + 3)),
            }),
        );
        close(
          Math.hypot(...poses.subarray(o + 4, o + 8)),
          1,
          2e-4,
          "unit rotation",
        );
      }
    } finally {
      base.destroy();
      fast.destroy();
    }
  });
}
