import { MeshBuilder, PhysicsShapeType, Scene, Vector3 } from "@babylonjs/core";
import { AvbdPhysics, AvbdPhysicsAggregate, AvbdShapeType } from "avbd-babylon";
import { AvbdScene3D, AvbdScene2D } from "avbd-babylon";
import type { AvbdPhysics as GlobalPhysics } from "avbd-babylon/global";

const globalConstructor: typeof GlobalPhysics = AvbdPhysics;
declare const scene: Scene;
const physics = await AvbdPhysics.create({ scene, gravity: [0, -9.81, 0] });
const mesh = MeshBuilder.CreateBox("box", {}, scene);
new AvbdPhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 2 }, scene);
const body = physics.addAggregate(mesh, AvbdShapeType.BOX, { mass: 1 }).body;
body.setLinearVelocity(new Vector3(1, 0, 0));
physics.setSolverMode("auto");
const joint = physics.addJoint(null, body, {
  anchorA: [0, 2, 0],
  anchorB: Vector3.Zero(),
});
physics.addWeld(body, physics.addAggregate(mesh, AvbdShapeType.BOX).body, {
  breakForce: 10,
  breakOnPull: true,
});
joint.setWorldAnchor([0, 3, 0]);
body.applyForce([1, 2, 3]).applyTorque([0, 1, 0]).wakeUp();
const hit = await physics.raycast([0, 0, 0], [1, 0, 0], { ignore: [body] });
hit?.body?.applyImpulse(hit.normal, hit.point);
physics.onContact((event) => {
  event.a.wakeUp();
});
await physics.readBodies([body]);
physics.getRenderBinding(physics.device);
const scene3 = new AvbdScene3D();
const patchA = scene3.addBox([0.25, 0.08, 0.25], { mass: 0 });
const patchB = scene3.addBox([0.25, 0.08, 0.25], { mass: 0.02 });
scene3.addJoint(patchA, patchB, [0.125, 0, 0], [-0.125, 0, 0], {
  breakForce: 100,
  breakOnPull: true,
});
scene3.addFabric();
scene3.addRope();
scene3.addRagdoll();
const gpu3 = scene3.createSolver(physics.device, { sleeping: true });
gpu3.wakeAll();
const scene2 = new AvbdScene2D();
const box2 = scene2.addBox([1, 1]);
scene2.addJoint(-1, box2);
scene2.addMotor(-1, box2, { speed: 2 });
scene2.createSolver(physics.device).step();
