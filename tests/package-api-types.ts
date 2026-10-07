// Compile-time consumer check; GPU behavior is tested in gpu-package-features.js.
import {
  AvbdPhysics,
  AvbdShapeType,
  AvbdScene2D,
  AvbdScene3D,
  createWebGPUDevice,
  prepareWebGPUDevice3D,
} from "avbd-babylon";
import type { Scene } from "@babylonjs/core/scene.js";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh.js";
async function useBabylon(scene: Scene, mesh: AbstractMesh) {
  const { device } = await createWebGPUDevice({ validate3D: true });
  await prepareWebGPUDevice3D(device);
  const physics = await AvbdPhysics.create({ scene, sleeping: true });
  const aggregate = physics.addAggregate(mesh, AvbdShapeType.CAPSULE, {
    restitution: 0.7,
    allowSleep: true,
    isTrigger: false,
  });
  aggregate.body.setSleepEnabled(false).setTrigger(true).setRestitution(0.5);
  const hinge = physics.addHinge(null, aggregate.body, {
    axisA: [0, 0, 1],
    axisB: [0, 0, 1],
    minAngle: -0.5,
    maxAngle: 0.5,
    motor: { speed: 1, maxTorque: 5 },
  });
  hinge.motor?.setMotor({ speed: -1 });
  hinge.dispose();
  const ray = await physics.raycast([0, 2, 0], [1, 0, 0], {
    includeTriggers: false,
  });
  const cast = await physics.sphereCast([0, 2, 0], 0.5, [1, 0, 0], {
    ignore: [aggregate.body],
    collidesWith: 1,
  });
  cast?.body?.applyImpulse([1, 0, 0], cast.point);
  ray?.body?.setSleepEnabled(true);
  await physics.sphereCastAll([
    { origin: [0, 0, 0], direction: [1, 0, 0], radius: 0.2 },
  ]);
}
async function usePortable(device: Parameters<AvbdScene3D["createSolver"]>[0]) {
  const three = new AvbdScene3D();
  three.addBox([1, 1, 1], { group: 1, collidesWith: 2 });
  const fabric = three.addFabric({
    materialAt: (u, v) => ({
      stiffnessScale: 1 + u * v,
      breakStrain: 0.35 + u,
      breakForce: Infinity,
    }),
    pinCorners: true,
    anchorStiffness: 4000,
    stiffness: 1000,
    breakStrain: 0.35,
  });
  fabric.connections[0]?.dispose();
  const capsule = three.addCapsule(0.3, 2, {
    restitution: 0.5,
    allowSleep: true,
  });
  const hinge = three.addHinge(null, capsule, {
    axisA: [0, 0, 1],
    axisB: [0, 0, 1],
    motor: { speed: 1, maxTorque: 10 },
  });
  const gpu3D = three.createSolver(device);
  const nativeBody = gpu3D.body(capsule);
  nativeBody
    .setLinearVelocity([1, 0, 0])
    .applyForce([0, 2, 0])
    .setTrigger(true)
    .setRestitution(0.7)
    .setSleepEnabled(false);
  gpu3D.editBodies([
    {
      body: capsule,
      position: [0, 4, 0],
      rotation: [0, 0, 0, 1],
      impulse: [2, 0, 0],
    },
    { body: nativeBody, torque: [0, 0, 1] },
  ]);
  gpu3D.flushEdits();
  gpu3D.setLinearVelocities(
    new Uint32Array([nativeBody.gpuIndex]),
    new Float32Array([1, 0, 0]),
  );
  gpu3D.advance(1 / 60);
  await gpu3D.readSelectedBodies([nativeBody.gpuIndex], { posesOnly: true });
  gpu3D.watchContacts({ indices: [nativeBody.gpuIndex] });
  const nativeEvents = await gpu3D.readContactEvents();
  const triggerEvent: boolean | undefined = nativeEvents.events[0]?.isTrigger;
  gpu3D.attachToScene({} as Scene).detachFromScene();
  gpu3D.setFilters([0], [1], [2]);
  if (hinge.motor) gpu3D.setMotor(hinge.motor.slot, { speed: 2 });
  await gpu3D.sphereCast([0, 0, 0], 0.5, [1, 0, 0]);
  await gpu3D.raycast([0, 0, 0], [1, 0, 0]);
  const two = new AvbdScene2D();
  two.addHull(
    [
      [-1, 0],
      [0, -1],
      [1, 0],
      [0, 1],
    ],
    { position: [3, 4] },
  );
  two.addPlane([0, 1]);
  two.addSegment([-5, 2], [-1, 1]);
  two.addSegment([1, 1], [5, 2], { radius: 0.2 });
  const disk = two.addCircle(0.5, { position: [-2, 3], restitution: 0.7 });
  const capsule2D = two.addCapsule(0.25, 2, { position: [2, 3], angle: 0.5 });
  const box = two.addBox([1, 1], {
    restitution: 0.8,
    isTrigger: true,
    group: 2,
    collidesWith: 1,
  });
  const hinge2D = two.addHinge(-1, box, [0, 0], [0, 0], {
    minAngle: -0.5,
    maxAngle: 0.5,
    motor: { speed: 2, maxTorque: 4 },
  });
  const gpu2D = two.createSolver(device);
  const diskHandle = gpu2D.body(disk);
  diskHandle
    .setLinearVelocity([1, 0])
    .setAngularVelocity(1)
    .setTrigger(false)
    .setRestitution(0.5);
  gpu2D.editBodies([
    { body: diskHandle, position: [1, 4], rotation: 0.5, force: [0, 2] },
    { body: disk, angularImpulse: 1 },
  ]);
  gpu2D.flushEdits();
  gpu2D.setVelocities(new Uint32Array([diskHandle.gpuIndex]), {
    linear: new Float32Array([1, 0]),
    angular: new Float32Array([2]),
  });
  gpu2D.setAngularVelocities([diskHandle.gpuIndex], [1]);
  gpu2D.editBodies([
    {
      body: diskHandle,
      isTrigger: false,
      restitution: 0.4,
      group: 2,
      collidesWith: 3,
      allowSleep: true,
    },
  ]);
  gpu2D.setLinearVelocities(
    new Uint32Array([diskHandle.gpuIndex]),
    new Float32Array([1, 0]),
  );
  gpu2D.advance(1 / 60);
  await gpu2D.readSelectedBodies([gpu2D.bodyIndex(diskHandle)], {
    posesOnly: true,
  });
  const nativeMotor = new AvbdScene2D();
  const nativeWheel = nativeMotor.addCircle(0.5);
  const motor2D = nativeMotor.addMotor(-1, nativeWheel, {
    speed: 2,
    maxTorque: 10,
  });
  const spring2D = nativeMotor.addSpring(
    nativeWheel,
    nativeMotor.addBox([1, 1], { position: [3, 0] }),
  );
  const motorGpu = nativeMotor.createSolver(device);
  hinge2D.limits?.setLimits({ minAngle: -0.2, maxAngle: 0.3 });
  gpu2D.enableSleeping({ timeThreshold: 0.2 }).setSleepEnabled(box, false);
  gpu2D.wakeUp(box).wakeAll().disableSleeping();
  const sleeping2D: boolean = (await gpu2D.readBodyState(box)).sleeping;
  await gpu2D.readSleepStats();
  motorGpu.setMotor(motor2D.slot, { speed: -2 });
  const jointSlot = motorGpu.appendJoint(
    -1,
    nativeWheel,
    [0, 0],
    [0, 0],
    [Infinity, Infinity, 0],
  );
  motorGpu.setWorldAnchor(jointSlot, 1, 0);
  spring2D.dispose();
  motor2D.destroy();
  motorGpu.destroy();
  gpu2D.setLinearVelocity(disk, [2, 0]).setAngularVelocity(disk, 1);
  gpu2D
    .applyImpulse(capsule2D, [0, 2], [2.5, 3])
    .applyForce(disk, { x: 1, y: 0 });
  gpu2D.teleport(disk, { x: -2, y: 3 }, 0);
  gpu2D.applyAngularImpulse(disk, 1).applyTorque(disk, 2);
  const state2D = await gpu2D.readBodyState(disk);
  const angle2D: number = state2D.angle;
  gpu2D.addCircle(0.5, { position: [0, 4] });
  gpu2D.addCapsule(0.25, 1, { position: [0, 6] });
  gpu2D.addSegment([-3, -2], [3, -2]);
  gpu2D.addPlane([1, 0], -10);
  gpu2D.addHull(new Float32Array([-1, -1, 1, -1, 0, 1]));
  const engine = new (
    await import("@babylonjs/core/Engines/nullEngine.js")
  ).NullEngine();
  const scene = new (await import("@babylonjs/core/scene.js")).Scene(engine);
  gpu2D.attachToScene(scene, {
    afterStep: (solver) => solver.applyForce(disk, [1, 0]),
  });
  gpu2D.detachFromScene();
  gpu2D.watchContacts({ indices: [disk, box] });
  gpu2D.setRestitution(box, 0.4);
  await gpu2D.raycast([-3, 0], [1, 0]);
  await gpu2D.circleCast([-3, 0], 0.4, [1, 0], { includeTriggers: false });
  await gpu2D.circleCastAll([
    { origin: [0, 0], direction: [1, 0], radius: 0.5 },
  ]);
}
