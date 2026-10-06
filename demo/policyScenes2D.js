import { AvbdScene2D } from "../src/native/scenes.js";
import { SoaSim } from "../reference/three-avbd/src/avbd2d/sim.ts";
export const policyScenes2D = [
  {
    id: "2d-sleeping-pile",
    name: "Resting 2D pile",
    dimension: 2,
    gpuOnly: true,
    policy2D: true,
    stepsPerFrame: 2,
    description:
      "Green-tinted blocks are asleep. Drag a block or right-click to drop another: edits and impacts wake the pile. Collision detection stays active. The performance display counts sleeping bodies.",
  },
  {
    id: "2d-limited-hinges",
    name: "Hinge stops and motors",
    dimension: 2,
    gpuOnly: true,
    policy2D: true,
    stepsPerFrame: 2,
    description:
      "The two powered arms press against opposite angle stops. The middle pendulum swings between its stops, while the right-hand wheel can rotate freely. Drag an arm to feel the limits.",
  },
];
export function buildPolicyScene2D(def) {
  const s = new AvbdScene2D({
    timeStep: 1 / 120,
    iterations: 12,
    gravity: -10,
  });
  s.addPlane();
  const features = { kind: "hinges", motors: [], arms: [], lanes: [] };
  if (def.id === "2d-sleeping-pile") {
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 32; x++)
        s.addBox([0.8, 0.8], {
          position: [(x - 15.5) * 0.82, 0.4 + y * 0.8],
          friction: 0.6,
        });
    s.addCapsule(0.25, 1.5, {
      position: [-15, 6],
      angle: 0.4,
      allowSleep: false,
    });
  } else {
    for (const [x, speed] of [
      [-8, 2],
      [-3, -2],
    ]) {
      const arm = s.addCapsule(0.25, 3, { position: [x, 5] });
      const hinge = s.addHinge(-1, arm, [x, 5], [0, 0], {
        minAngle: -0.65,
        maxAngle: 0.65,
        motor: { speed, maxTorque: 30 },
      });
      features.motors.push({ handle: hinge.motor, speed, maxTorque: 30 });
      features.arms.push({ body: arm, minAngle: -0.65, maxAngle: 0.65 });
      s.addCircle(0.15, { density: 0, position: [x, 5], isTrigger: true });
    }
    const pendulum = s.addCapsule(0.25, 3, {
      position: [2, 3.8],
      angle: Math.PI / 2,
    });
    s.addHinge(-1, pendulum, [2, 5], [1.2, 0], {
      minAngle: -0.9,
      maxAngle: 0.9,
    });
    const wheel = s.addHull(
      [
        [-1, -0.4],
        [1, -0.4],
        [1, 0.4],
        [-1, 0.4],
      ],
      { position: [8, 5] },
    );
    const hinge = s.addHinge(-1, wheel, [8, 5], [0, 0], {
      motor: { speed: 2, maxTorque: 10 },
    });
    features.wheel = wheel;
    features.motors.push({ handle: hinge.motor, speed: 2, maxTorque: 10 });
  }
  return {
    def,
    scene: s,
    features: def.id === "2d-limited-hinges" ? features : undefined,
    sim: new SoaSim(s.topology, "GPU policies"),
    gpuParams: { dt: 1 / 120, iterations: 12, gravity: -10 },
    gpuOptions2D: {
      bodyCapacity: s.bodyCount + 4096,
      sleeping: def.id === "2d-sleeping-pile" ? { timeThreshold: 0.25 } : false,
    },
  };
}
