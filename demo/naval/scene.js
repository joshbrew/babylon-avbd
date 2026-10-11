import { AvbdScene3D } from "../../src/native/scenes.js";
import {
  setVisual,
  addCloth,
} from "../../reference/three-avbd/src/avbd3d/visuals.ts";

export const NAVAL_DT = 1 / 120;
export const NAVAL_GRID = 128;
export const NAVAL_SPAN = 72;
export const NAVAL_DEPTH = 7;
export const NAVAL_AMMO = 16;

// The island, ship parts and sail particles have very different sizes. A tree
// avoids filling grid cells with large bounds while checking tiny particles.
export const navalBroadphase = (requested = "auto") =>
  requested === "auto" ? "hploc" : requested;

/** Metres, seconds, and water density = 1; all masses use the same scale. */
export function buildNavalScene() {
  const world = new AvbdScene3D({
    up: [0, 0, 1],
    gravity: -9.81,
    timeStep: NAVAL_DT,
    iterations: 5,
  });
  const pieces = [],
    ships = [],
    projectiles = [];
  const paint = (body, color) => setVisual(body, { color });
  paint(
    world.addBox([80, 80, 1], {
      position: [0, 0, -NAVAL_DEPTH - 0.5],
      mass: 0,
    }),
    0x527e80,
  );
  // Broad low shore with an exposed rocky interior. Each visible rock is also
  // a static convex collider, so grounding uses the normal contact solver.
  const island = [];
  function islandRock(center, radii, color, phase = 0) {
    const points = [];
    for (const [height, scale] of [
      [-1, 0.75],
      [0, 1],
      [1, 0.6],
    ])
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + phase;
        points.push(
          Math.cos(angle) * radii[0] * scale,
          Math.sin(angle) * radii[1] * scale,
          height * radii[2],
        );
      }
    const body = paint(
      world.addHull(points, { position: center, mass: 0, friction: 0.8 }),
      color,
    );
    island.push(body);
    return body;
  }
  islandRock([0, 14, -2.8], [11, 7, 4], 0xc9b281);
  islandRock([0, 15, 0.9], [7.8, 4.7, 1.2], 0x789664, 0.12);
  for (const [x, y, z, s] of [
    [-8, 8.6, 0.3, 1.8],
    [7.5, 9, 0.4, 2],
    [-3, 10, 0.6, 1.5],
    [3, 11, 0.7, 1.6],
    [0, 16, 2, 2.4],
  ])
    islandRock([x, y, z], [s, s * 0.8, s * 0.8], 0x8b9084, x * 0.1);
  for (let team = 0; team < 2; team++) {
    const origin = [team ? 9 : -9, team ? 1.5 : -1.5, -0.15];
    const color = team ? 0xdf7762 : 0x4c91ae;
    const root = paint(
      world.addBox([0.45, 4.8, 0.6], {
        position: origin,
        density: 2,
        mass: 1.8,
        friction: 0.65,
        allowSleep: false,
        group: 1 << team,
        collidesWith: (0xffffffff ^ (1 << team)) >>> 0,
      }),
      0x594740,
    );
    const ship = {
      root,
      team,
      pieces: [],
      bonds: [],
      name: team ? "Coral Corsair" : "Blue Finch",
    };
    const rootPiece = {
      body: root,
      team,
      root: true,
      volume: 0.45 * 4.8 * 0.6,
      health: team ? 90 : 450,
    };
    pieces.push(rootPiece);
    ship.pieces.push(rootPiece);
    function box(size, offset, color, density = 0.6, health = 80, yaw = 0) {
      const body = paint(
        world.addBox(size, {
          position: origin.map((v, k) => v + offset[k]),
          density,
          friction: 0.6,
          allowSleep: false,
          group: 1 << team,
          collidesWith: (0xffffffff ^ (1 << team)) >>> 0,
          rotation: [0, 0, Math.sin(yaw / 2), Math.cos(yaw / 2)],
        }),
        color,
      );
      const bond = world.addJoint(root, body, offset, [0, 0, 0], {
        angularStiffness: Infinity,
        breakForce: health * 1.8,
        breakOnPull: true,
      });
      const piece = {
        body,
        team,
        bond,
        volume: size.reduce((a, b) => a * b),
        health: team ? health : health * 5,
      };
      pieces.push(piece);
      ship.pieces.push(piece);
      ship.bonds.push(bond);
      return body;
    }
    // Individual wooden hull members displace water. Attached members carry
    // the dense keel together; detached wood retains its own buoyancy.
    for (let i = 0; i < 8; i++)
      box(
        [2.5, 0.58, 0.45],
        [0, (i - 3.5) * 0.6, -0.18],
        i % 2 ? 0x9c744e : 0xb38a5c,
        0.28,
        70,
      );
    for (const side of [-1, 1]) {
      for (let row = 0; row < 2; row++)
        for (let i = 0; i < 5; i++) {
          box(
            [0.22, 0.94, 0.42],
            [side * 1.3, (i - 2) * 0.97, 0.25 + row * 0.45],
            row ? color : 0x956a4a,
            0.7,
            55,
          );
        }
      box([0.19, 4.95, 0.16], [side * 1.3, 0, 1.05], 0xf1c68b, 0.5);
      for (const y of [-1.45, 0, 1.45]) {
        box([0.65, 0.4, 0.35], [side * 1.02, y, 1.12], 0x644f43, 0.5);
        box([0.8, 0.25, 0.25], [side * 1.44, y, 1.35], 0x32434b, 1.5);
      }
    }
    for (let i = 0; i < 8; i++)
      box(
        [2.35, 0.58, 0.16],
        [0, (i - 3.5) * 0.6, 0.72],
        i % 2 ? 0xc69b68 : 0xd8b481,
        0.55,
      );
    for (const end of [-1, 1]) {
      box([2.75, 0.23, 0.95], [0, end * 2.52, 0.48], color, 0.6);
      box([2.8, 0.28, 0.16], [0, end * 2.52, 1.06], 0xf1c68b, 0.5);
    }
    for (const side of [-1, 1])
      box(
        [0.22, 1.65, 0.85],
        [side * 0.59, 3.0, 0.5],
        color,
        0.55,
        70,
        side * 0.75,
      );
    box([0.14, 1.8, 0.14], [0, 3.1, 1.12], 0xf1c68b, 0.4);
    box([1.55, 1.2, 0.9], [0, -1.6, 1.24], color, 0.28);
    box([1.8, 1.4, 0.18], [0, -1.6, 1.79], 0xf3ce8f, 0.4);
    box([0.16, 0.16, 3.7], [0, 0.3, 2.6], 0x785b42, 0.3);
    const yard = box([0.16, 2.85, 0.12], [0, 0.3, 3.8], 0x785b42, 0.3);
    const spacing = 2.6 / 12;
    const sail = world.addFabric({
      columns: 13,
      rows: 10,
      spacing,
      mass: 0.002,
      stiffness: 500,
      bendingStiffness: 2,
      pinEdges: false,
    });
    for (let row = 0; row < sail.grid.length; row++)
      for (let column = 0; column < sail.grid[row].length; column++) {
        const body = sail.grid[row][column];
        const u = (column - 6) * spacing,
          v = (row - 4.5) * spacing;
        body.positionLin.set([
          origin[0] + 0.18,
          origin[1] + 0.3 + u,
          origin[2] + 2.8 + v,
        ]);
        body.group = 1 << team;
        body.collidesWith = (0xffffffff ^ (1 << team)) >>> 0;
        body.allowSleep = false;
        let bond;
        if (row === 9)
          bond = world.addJoint(yard, body, [0.18, u, v - 1], [0, 0, 0], {
            breakForce: 40,
            breakOnPull: true,
          });
        const piece = {
          body,
          team,
          bond,
          // A light, buoyant fabric patch. Effective displacement thickness
          // sets its wet volume without enlarging its solid collision shape.
          volume: spacing * spacing * 0.08,
          waterThickness: 0.08,
          health: 120,
          sailArea: spacing * spacing,
        };
        pieces.push(piece);
        ship.pieces.push(piece);
      }
    addCloth(world.ref, sail.grid);
    box([0.06, 0.8, 0.42], [0, 0.65, 4.35], color, 0.05);
    // Two bright eyes on the bow; their mass is small but they are real pieces.
    for (const side of [-1, 1]) {
      box([0.36, 0.12, 0.4], [side * 0.55, 2.69, 0.72], 0xfff6dc, 0.1);
      box([0.16, 0.08, 0.23], [side * 0.55, 2.78, 0.72], 0x233945, 0.1);
    }
    ships.push(ship);
  }
  for (let i = 0; i < NAVAL_AMMO; i++) {
    const body = paint(
      world.addSphere(0.23, {
        position: [i - 8, 0, -30],
        mass: i % 2 ? 0.6 : 1.2,
        friction: 0.4,
        allowSleep: false,
      }),
      0x283842,
    );
    projectiles.push(body);
  }
  return { world, pieces, ships, projectiles, island };
}
