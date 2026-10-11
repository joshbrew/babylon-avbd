import {
  createPlayground,
  finishPlayground,
} from "../shared/playground/scene.js";
import { setVisual } from "../../reference/three-avbd/src/avbd3d/visuals.ts";

export const scene = {
  playActions: [
    { id: "start", label: "Release marbles" },
    { id: "shake", label: "Shake marbles" },
    { id: "restore-pegs", label: "Restore all pegs" },
  ],
  id: "3d-marble-cascade",
  name: "Galton board · 40,000 marbles",
  description:
    "Release 40,000 marbles from the hopper and watch the bin counts build. Click a peg to slide it back into the board; click its coral cap to restore it. Changing pegs changes the resulting distribution. Drag to orbit, or use Restore all pegs to return to the original layout.",
  dimension: 3,
  gpuOnly: true,
  playDemo: true,
};

export function buildScene(def = scene) {
  const context = createPlayground(def);
  const { scene, play, box, ball, weld, paint } = context;
  let camera;

  const lanes = 20,
    hopperColumns = 40,
    binCount = 33,
    halfWidth = binCount * 0.52,
    width = halfWidth * 2 + 1,
    count = 40000,
    depth = lanes * 0.25 + 0.7;
  // A central throat removes the sideways motion from the hopper slopes before
  // the marbles meet the first peg. A wide opening feeds several peg columns
  // together, so their correlated streams need not form a bell-shaped sample.
  const outletWidth = 0.9,
    outletBottom = 30.1,
    throatTop = 31,
    hopperHalfWidth = 5,
    hopperBase = 33.9,
    wallThickness = 0.16,
    slopeRun = hopperHalfWidth - outletWidth / 2,
    slopeRise = hopperBase - throatTop,
    slopeAngle = Math.atan2(slopeRise, slopeRun);
  play.feed = {
    binCount,
    outletHeight: 30,
    outletWidth,
  };
  play.pegs = [];
  play.pegDepth = depth;
  box([width, depth, 0.4], [0, 0, -5.2], 0x718590, { mass: 0 });
  box([width, 0.2, 52], [0, depth / 2, 20.5], 0x344d63, { mass: 0 });
  setVisual(
    box([width, 0.2, 52], [0, -depth / 2, 20.5], 0x344d63, { mass: 0 }),
    {
      shape: "hidden",
    },
  );
  for (const side of [-1, 1]) {
    box([0.3, depth, 52], [side * (halfWidth + 0.15), 0, 20.5], 0xb5a17c, {
      mass: 0,
    });
    box([0.15, depth, 12.6], [side * 5, 0, 40.2], 0xcdac72, { mass: 0 });
    const angle = -side * slopeAngle;
    box(
      [Math.hypot(slopeRun, slopeRise), depth, wallThickness],
      [
        side *
          ((hopperHalfWidth + outletWidth / 2) / 2 +
            (Math.sin(slopeAngle) * wallThickness) / 2),
        0,
        (hopperBase + throatTop) / 2 -
          (Math.cos(slopeAngle) * wallThickness) / 2,
      ],
      0xcdac72,
      {
        mass: 0,
        rotation: [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)],
      },
    );
    box(
      [wallThickness, depth, throatTop - outletBottom],
      [
        side * (outletWidth / 2 + wallThickness / 2),
        0,
        (throatTop + outletBottom) / 2,
      ],
      0xcdac72,
      { mass: 0 },
    );
  }
  box([width, depth, 0.2], [0, 0, 46.5], 0xb5a17c, { mass: 0 });
  play.gate = box([outletWidth, depth, 0.24], [0, 0, outletBottom], 0xcd7057, {
    mass: 8,
  });
  // Rest the opened hatch on the roof; a discarded dynamic hatch would fall
  // forever and needlessly expand the collision tree's world bounds.
  play.gateParking = [halfWidth - 3, 0, 46.8];
  play.gateBond = weld(null, play.gate, play.gate.positionLin);
  for (let row = 0; row < 20; row++)
    for (let column = -17; column <= 17; column++)
      play.pegs.push(
        paint(
          scene.addCapsule(0.26, depth, {
            position: [column * 0.95 + (row % 2) * 0.475, 0, 28.6 - row * 0.95],
            mass: 0,
            friction: 0.3,
            restitution: 0.05,
          }),
          row % 2 ? 0xe6c792 : 0xc9b08b,
        ),
      );
  for (let i = 0; i <= binCount; i++)
    box([0.08, depth, 12.5], [-halfWidth + i * 1.04, 0, 1.25], 0xb5a17c, {
      mass: 0,
    });
  const palette = [0xec7961, 0xe6c25b, 0x5da997, 0x65a9cc, 0xa18aca, 0xf3d5ac];
  for (let ordinal = 0; ordinal < count; ordinal++) {
    const lane = ordinal % lanes,
      column = Math.floor(ordinal / lanes) % hopperColumns,
      row = Math.floor(ordinal / (lanes * hopperColumns));
    play.marbles.push(
      ball(
        0.115,
        [
          (column - (hopperColumns - 1) / 2) * 0.24,
          (lane - (lanes - 1) / 2) * 0.25,
          34.4 + row * 0.24,
        ],
        palette[(ordinal * 7 + row) % palette.length],
        {
          density: 1,
          friction: 0.3,
          restitution: 0.05,
          group: 1,
          collidesWith: 0,
        },
      ),
    );
  }
  camera = {
    target: [0, 0, 20.5],
    distance: 86,
    azimuth: -90,
    elevation: 0.06,
  };
  return finishPlayground(def, context, camera, {
    broadphase: "hploc",
    capacity: {
      pairs: 1000000,
      contacts: 600000,
      manifolds: 600000,
      colors: 32,
    },
  });
}
