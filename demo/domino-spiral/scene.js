import {
  createPlayground,
  finishPlayground,
} from "../shared/playground/scene.js";

export const scene = {
  playActions: [{ id: "start", label: "Tip first domino" }],
  id: "3d-domino-spiral",
  name: "Domino spiral · 2,048 tiles",
  description:
    "Tip the first tile and watch a chain reaction spiral outward through 2,048 standing dominoes. Every collision is physical. Drag a tile to interrupt the chain or start another branch, and rebuild to reset the pattern.",
  dimension: 3,
  gpuOnly: true,
  playDemo: true,
};

export function buildScene(def = scene) {
  const context = createPlayground(def);
  const { scene, play, box, ball, weld, paint } = context;
  let camera;

  box([75, 75, 1], [0, 0, -0.5], 0xc3bda8, { mass: 0 });
  let theta = 0;
  const palette = [0xe47864, 0xe4bd59, 0x63ae9b, 0x5f9ebd, 0x927fbd];
  for (let i = 0; i < 2048; i++) {
    const r = 2 + 0.38 * theta,
      tangent = theta + Math.atan2(r, 0.38);
    const b = box(
      [0.16, 0.66, 1.4],
      [r * Math.cos(theta), r * Math.sin(theta), 0.7],
      palette[Math.floor(i / 32) % palette.length],
      {
        density: 2,
        friction: 0.6,
        rotation: [0, 0, Math.sin(tangent / 2), Math.cos(tangent / 2)],
      },
    );
    play.dominos.push(b);
    theta += 0.48 / Math.hypot(r, 0.38);
  }
  camera = { target: [0, 0, 0], distance: 67, azimuth: -60, elevation: 0.8 };

  return finishPlayground(def, context, camera, {});
}
