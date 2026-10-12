/**
 * Z-up neighborhood assembly for the tornado playground. Buildings use
 * breakable welds; shared/playground/physics.js applies the moving wind field.
 * Visual funnel grains are separate from colliding house debris. The play
 * metadata returned here selects which bodies receive each GPU force.
 */
import {
  createPlayground,
  finishPlayground,
} from "../shared/playground/scene.js";

export const scene = {
  playActions: [
    { id: "start", label: "Send in tornado" },
    { id: "stop", label: "Stop wind" },
  ],
  id: "3d-tornado-town",
  name: "Tornado town · 4,000+ pieces",
  description:
    "Send a swirling wind field through twenty breakable houses. Wind pushes and lifts individual pieces; AVBD contacts and breakable mortar determine what survives. Stop the storm to let debris settle, or rebuild and try again.",
  dimension: 3,
  gpuOnly: true,
  playDemo: true,
};

export function buildScene(def = scene) {
  const context = createPlayground(def);
  const { scene, play, box, ball, weld, paint } = context;
  let camera;

  box([90, 65, 1], [0, 0, -0.5], 0x718c67, { mass: 0 });
  box([80, 4, 0.04], [0, 0, 0.02], 0x637276, { mass: 0 });
  const palette = [0xdfb98b, 0x96b5b1, 0xb9bd80, 0xd49b90, 0xb0b0c5];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 5; col++) {
      const cx = (col - 2) * 12,
        cy = (row - 1.5) * 11;
      const wallTops = [];
      for (let face = 0; face < 4; face++) {
        const width = face < 2 ? 10 : 8,
          bricks = new Map();
        for (let y = 0; y < 6; y++)
          for (let x = 0; x < width; x++) {
            if (face === 0 && (x === 4 || x === 5) && y < 3) continue;
            if (face === 1 && (x === 4 || x === 5) && y === 3) continue;
            const along = (x - (width - 1) / 2) * 0.5;
            const pos =
              face < 2
                ? [cx + along, cy + (face ? 2.25 : -2.25), 0.18 + y * 0.36]
                : [cx + (face === 2 ? -2.5 : 2.5), cy + along, 0.18 + y * 0.36];
            const b = box(
              face < 2 ? [0.495, 0.42, 0.36] : [0.42, 0.495, 0.36],
              pos,
              palette[(row + col) % palette.length],
              { density: 0.55 },
            );
            const below = bricks.get(`${x},${y - 1}`),
              left = bricks.get(`${x - 1},${y}`),
              parent = below ?? left;
            if (parent) {
              const mid = pos.map((v, k) => (v + parent.positionLin[k]) / 2);
              play.bonds.push(weld(parent, b, mid, { breakForce: 8 }));
            } else if (y === 0)
              play.bonds.push(
                weld(null, b, [pos[0], pos[1], 0], { breakForce: 14 }),
              );
            bricks.set(`${x},${y}`, b);
            if (y === 5) wallTops.push(b);
          }
      }
      for (const side of [-1, 1])
        for (let strip = 0; strip < 6; strip++) {
          const pos = [cx + side * 1.4, cy + (strip - 2.5) * 0.84, 2.65];
          const roof = box(
            [3.0, 0.83, 0.14],
            pos,
            [0x8c594f, 0x536a7b, 0x866b50][col % 3],
            {
              density: 0.4,
              rotation: [0, -side * Math.sin(0.18), 0, Math.cos(0.18)],
            },
          );
          const support = wallTops.reduce((a, b) =>
            Math.hypot(a.positionLin[0] - pos[0], a.positionLin[1] - pos[1]) <
            Math.hypot(b.positionLin[0] - pos[0], b.positionLin[1] - pos[1])
              ? a
              : b,
          );
          play.bonds.push(
            weld(support, roof, support.positionLin, { breakForce: 6 }),
          );
        }
    }
  // Small non-colliding grains draw the funnel. House pieces still move only
  // through the wind force and normal physics; the grains are visual guides.
  for (let i = 0; i < 128; i++)
    play.dust.push(
      ball(0.16 + (i % 4) * 0.04, [0, 0, -20], i % 3 ? 0xabb3af : 0xe2d5b1, {
        mass: 0,
        group: 0,
        collidesWith: 0,
      }),
    );
  camera = { target: [0, 0, 3], distance: 86, azimuth: -55, elevation: 0.55 };

  return finishPlayground(def, context, camera, {});
}
