import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { SoaSim } from "../reference/three-avbd/src/avbd2d/sim.ts";
import { setVisual } from "../reference/three-avbd/src/avbd3d/visuals.ts";

export const collisionGroups = Object.freeze({
  floor: 1,
  shelf: 2,
  coral: 4,
  blue: 8,
  sensor: 16,
});
const descriptions = {
  hinges:
    "The coral arms are powered hinges with angle stops. The middle pendulum swings freely between its stops; the purple wheel has a motor without angle limits. Reverse or stop the motors, or drag an arm.",
  filters:
    "The left lane's coral balls land on the shelf. Blue balls on the right and purple balls in the middle pass through to the floor. The gold trigger detects coral and blue balls without pushing them; purple balls ignore it. Balls turn gold inside the trigger, green when touching the shelf, and cyan when touching the floor. Enable blue shelf collisions to catch that lane too.",
};
export const featureScenes = [
  {
    id: "3d-limited-hinges",
    name: "Hinge stops and motors",
    dimension: 3,
    description: descriptions.hinges,
  },
  {
    id: "2d-triggers-and-masks",
    name: "Triggers and collision masks",
    dimension: 2,
    description: descriptions.filters,
  },
  {
    id: "3d-triggers-and-masks",
    name: "Triggers and collision masks",
    dimension: 3,
    description: descriptions.filters,
  },
].map((scene) => ({
  ...scene,
  gpuOnly: true,
  featureDemo: true,
  stepsPerFrame: 2,
}));

export function buildFeatureScene(def) {
  const is2D = def.dimension === 2;
  const scene = is2D
    ? new AvbdScene2D({ timeStep: 1 / 120, iterations: 10 })
    : new AvbdScene3D({ timeStep: 1 / 120, iterations: 10, up: [0, 0, 1] });
  const colors = [];
  const paint = (body, color) => {
    if (is2D) colors[body] = [...color.map((v) => v / 255), 1];
    else
      setVisual(body, { color: (color[0] << 16) | (color[1] << 8) | color[2] });
    return body;
  };
  const position = (x, height) => (is2D ? [x, height] : [x, 0, height]);
  const box = (size, options, color = [148, 153, 164]) =>
    paint(scene.addBox(is2D ? size : [size[0], 0.8, size[1]], options), color);
  const ball = (radius, options, color) =>
    paint(
      is2D
        ? scene.addCircle(radius, options)
        : scene.addSphere(radius, options),
      color,
    );
  const features = {
    kind: def.id.includes("hinges") ? "hinges" : "filters",
    motors: [],
    arms: [],
    lanes: [],
  };
  if (features.kind === "hinges") {
    scene.addBox([26, 8, 1], { density: 0, position: [0, 0, -0.5] });
    for (const [x, speed] of [
      [-8, 2],
      [-3, -2],
    ]) {
      const body = box(
        [3.4, 0.5],
        { position: position(x, 5) },
        [225, 133, 96],
      );
      const hinge = scene.addHinge(null, body, {
        anchorA: [x, 0, 5],
        axisA: [0, 1, 0],
        axisB: [0, 1, 0],
        minAngle: -0.65,
        maxAngle: 0.65,
        motor: { speed, maxTorque: 30 },
      });
      features.motors.push({ handle: hinge.motor, speed, maxTorque: 30 });
      features.arms.push({ body, minAngle: -0.65, maxAngle: 0.65 });
    }
    const pendulum = box(
      [0.5, 3],
      { position: position(2, 3.8), angularVelocity: [0, 1, 0] },
      [116, 163, 143],
    );
    scene.addHinge(null, pendulum, {
      anchorA: [2, 0, 5],
      anchorB: [0, 0, 1.2],
      axisA: [0, 1, 0],
      axisB: [0, 1, 0],
      minAngle: -0.9,
      maxAngle: 0.9,
    });
    const wheel = box([2, 2], { position: position(8, 5) }, [168, 137, 209]);
    const hinge = scene.addHinge(null, wheel, {
      anchorA: [8, 0, 5],
      axisA: [0, 1, 0],
      axisB: [0, 1, 0],
      motor: { speed: 2, maxTorque: 10 },
    });
    features.motors.push({ handle: hinge.motor, speed: 2, maxTorque: 10 });
    features.wheel = wheel;
    for (const x of [-8, -3, 2, 8]) {
      box([0.2, 5], { density: 0, group: 0, position: [x, 1, 2.5] });
      ball(
        0.16,
        { density: 0, group: 0, position: [x, -0.5, 5] },
        [234, 192, 85],
      );
    }
  } else {
    const G = collisionGroups;
    if (is2D)
      features.floor = paint(
        scene.addPlane([0, 1], 0, {
          group: G.floor,
          collidesWith: G.coral | G.blue,
        }),
        [148, 153, 164],
      );
    else
      features.floor = scene.addBox([24, 8, 1], {
        density: 0,
        position: [0, 0, -0.5],
        group: G.floor,
        collidesWith: G.coral | G.blue,
      });
    features.shelf = box([13, 0.3], {
      density: 0,
      position: position(0, 3),
      group: G.shelf,
      collidesWith: G.coral,
    });
    features.sensor = box(
      [13, 0.7],
      {
        density: 0,
        position: position(0, 4.8),
        group: G.sensor,
        collidesWith: G.coral | G.blue,
        isTrigger: true,
      },
      [232, 189, 74],
    );
    if (!is2D) {
      setVisual(features.sensor, { shape: "hidden" });
      for (const height of [4.45, 5.15])
        box(
          [13, 0.05],
          { density: 0, group: 0, position: [0, -0.45, height] },
          [232, 189, 74],
        );
      for (const x of [-6.5, 6.5])
        box(
          [0.05, 0.7],
          { density: 0, group: 0, position: [x, -0.45, 4.8] },
          [232, 189, 74],
        );
    }
    for (const [name, x, group, mask, color] of [
      [
        "coral",
        -4,
        G.coral,
        G.floor | G.shelf | G.sensor | G.coral,
        [225, 142, 106],
      ],
      ["blue", 4, G.blue, G.floor | G.sensor | G.blue, [122, 148, 230]],
      ["purple", 0, G.blue, G.floor | G.blue, [168, 137, 209]],
    ]) {
      const bodies = [];
      for (let row = 0; row < 7; row++)
        bodies.push(
          ball(
            0.35,
            {
              position: position(x, 6 + row * 1.2),
              group,
              collidesWith: mask,
              restitution: 0.15,
            },
            color,
          ),
        );
      features.lanes.push({ name, bodies, group, mask, color });
    }
    features.sensorEnabled = true;
    features.blueShelfEnabled = false;
  }
  return {
    def,
    scene,
    features,
    ...(is2D
      ? {
          sim: new SoaSim(scene.topology, "GPU feature examples"),
          gpuOptions2D: { bodyCapacity: scene.bodyCount + 4096 },
          renderOptions2D: { colors },
        }
      : {
          solver: scene.ref,
          camera: {
            target: [0, 0, 4],
            distance: 23,
            azimuth: -90,
            elevation: 0.28,
          },
        }),
    gpuParams: { dt: 1 / 120, iterations: 10, gravity: -10 },
  };
}
