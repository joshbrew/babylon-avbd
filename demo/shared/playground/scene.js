import { AvbdScene3D } from "../../../src/native/scenes.js";
import { setVisual } from "../../../reference/three-avbd/src/avbd3d/visuals.ts";
import {
  rotateInv,
  vec3,
} from "../../../reference/three-avbd/src/avbd3d/ref/math.ts";

export function createPlayground(def) {
  const scene = new AvbdScene3D({
    up: [0, 0, 1],
    gravity: -9.81,
    timeStep: 1 / 120,
    iterations: 5,
  });
  const paint = (b, color) => setVisual(b, { color });
  const box = (size, position, color, options = {}) =>
    paint(scene.addBox(size, { position, friction: 0.65, ...options }), color);
  const ball = (radius, position, color, options = {}) =>
    paint(scene.addSphere(radius, { position, ...options }), color);
  const local = (b, p) => {
    if (!b) return p;
    const out = vec3();
    rotateInv(
      out,
      b.positionAng,
      p.map((v, k) => v - b.positionLin[k]),
    );
    return out;
  };
  const weld = (a, b, p, options = {}) =>
    scene.addJoint(a, b, local(a, p), local(b, p), {
      angularStiffness: Infinity,
      ...options,
    });
  const play = {
    kind: def.id,
    actions: def.playActions,
    dust: [],
    marbles: [],
    dominos: [],
    bonds: [],
  };

  return { scene, paint, box, ball, weld, play };
}
export function finishPlayground(def, context, camera, gpuOptions = {}) {
  return {
    def,
    scene: context.scene,
    solver: context.scene.ref,
    play: context.play,
    camera,
    gpuParams: { dt: 1 / 120, iterations: 5, gravity: -9.81 },
    gpuOptions: {
      sleeping: false,
      minimumColors: 16,
      minimumColorRounds: 16,
      ...gpuOptions,
    },
  };
}
