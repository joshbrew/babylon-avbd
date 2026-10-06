import { AvbdScene2D } from "../src/native/scenes.js";
import { SoaSim } from "../reference/three-avbd/src/avbd2d/sim.ts";
export const slingshotScene2D = {
  id: "2d-slingshot-siege",
  name: "2D slingshot siege",
  dimension: 2,
  gpuOnly: true,
  slingshot: true,
  stepsPerFrame: 2,
  description:
    "Thousands of bricks surround hanging targets, breakable roofs, spring platforms, powered gates and ragdolls. Play the slingshot siege to aim and launch. This benchmark keeps bodies awake.",
};
export function buildSlingshotScene2D(def = slingshotScene2D, count = 5000) {
  if (![1000, 5000, 10000].includes(count))
    throw Error("Choose 1,000, 5,000 or 10,000 bricks");
  const s = new AvbdScene2D({
      timeStep: 1 / 120,
      iterations: 10,
      gravity: -10,
    }),
    colors = [];
  const color = (id, rgb) => {
    colors[id] = [...rgb, 1];
    return id;
  };
  color(s.addPlane(), [0.29, 0.4, 0.24]);
  const forts = count === 10000 ? 8 : 4,
    columns = count === 1000 ? 4 : 8,
    rows = Math.floor(count / (forts * 2 * columns));
  const targets = [],
    bricks = [],
    visibleLinks = [],
    breakable = [],
    gates = [],
    ragdolls = [],
    ropes = [],
    springs = [];
  let added = 0;
  for (let f = 0; f < forts; f++) {
    const center = -5 + f * 18;
    for (const side of [-1, 1]) {
      const masonry = new Map();
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < columns; x++) {
          const local = side * 4.4 + (x - (columns - 1) / 2) * 0.46;
          if (y === 12 && Math.abs(local) < 4.23) continue; // Shelf for the lower bridge.
          const id = s.addBox([0.46, 0.25], {
            position: [center + local, 0.125 + y * 0.25],
            friction: 0.7,
          });
          color(
            id,
            y % 5 === 0
              ? [0.61, 0.29, 0.17]
              : [0.86, 0.49 + 0.025 * ((x + y) % 3), 0.24],
          );
          bricks.push(id);
          // Small mortared panels carry the roof without gluing the entire
          // fort together. Each panel can crack into its individual bricks.
          const below = masonry.get(`${x},${y - 1}`),
            left = masonry.get(`${x - 1},${y}`);
          const parent = y % 4 !== 0 ? below : x % 4 !== 0 ? left : undefined;
          if (parent !== undefined)
            breakable.push(
              s.addJoint(
                parent,
                id,
                y % 4 !== 0 ? [0, 0.125] : [0.23, 0],
                y % 4 !== 0 ? [0, -0.125] : [-0.23, 0],
                {
                  stiffness: [Infinity, Infinity, Infinity],
                  breakForce: 60 + rows * 0.115 * 10,
                },
              ),
            );
          masonry.set(`${x},${y}`, id);
          added++;
        }
    }
    const roofY = rows * 0.25;
    color(
      s.addBox([8.0, 0.25], {
        position: [center, roofY + 0.125],
        density: 1.5,
        friction: 0.8,
      }),
      [0.38, 0.22, 0.12],
    );
    // A lower bridge rests on the tower faces. Targets stand in the open arch.
    color(
      s.addBox([8, 0.24], { position: [center, 3.125], friction: 0.8 }),
      [0.53, 0.32, 0.14],
    );
    for (const dx of [-1, 1])
      targets.push(
        color(
          s.addCircle(0.48, {
            position: [center + dx, 0.48],
            friction: 0.5,
            restitution: 0.1,
          }),
          [0.4, 0.7, 0.24],
        ),
      );
    for (let n = 0; n < 5; n++)
      color(
        s.addBox([0.75, 0.5], {
          position: [center + (n - 2) * 0.75, roofY + 0.5],
          friction: 0.6,
        }),
        [0.84, 0.69, 0.33],
      );
    // A pitched roof made of convex tiles. Mortar locks adjacent tiles until
    // the impact force exceeds its strength. The wall panels fracture too.
    const roof = [];
    for (let n = 0; n < 4; n++) {
      const id = color(
        s.addHull(
          [
            [-0.85, -0.3],
            [0.85, -0.3],
            [0.6, 0.3],
            [-0.6, 0.3],
          ],
          {
            position: [center + (n - 1.5) * 1.7, roofY + 1.45],
            friction: 0.65,
          },
        ),
        [0.46, 0.34, 0.52],
      );
      if (roof.length)
        breakable.push(
          s.addJoint(roof.at(-1), id, [0.85, 0], [-0.85, 0], {
            stiffness: [Infinity, Infinity, Infinity],
            breakForce: 500,
          }),
        );
      roof.push(id);
    }
    // The gap before each fort contains a swing, a spring-supported shelf and
    // a limited motor gate. Their geometry is separated from the brick piles.
    const gap = center - 9;
    const gate = color(
      s.addCapsule(0.16, 2.2, {
        position: [gap, 1.1],
        angle: Math.PI / 2,
        density: 2,
      }),
      [0.25, 0.43, 0.64],
    );
    const hinge = s.addHinge(-1, gate, [gap, 0.16], [-0.94, 0], {
      minAngle: -0.7,
      maxAngle: 0.7,
      motor: { speed: 0.7, maxTorque: 12 },
    });
    gates.push({ body: gate, hinge, direction: 1 });
    const x = center,
      top = Math.min(roofY - 1, 7);
    let previous = -1;
    const chain = [];
    for (let n = 0; n < 4; n++) {
      const link = color(
        s.addCapsule(0.065, 0.65, {
          position: [x, top - 0.325 - n * 0.65],
          angle: Math.PI / 2,
          density: 2,
        }),
        [0.42, 0.36, 0.23],
      );
      const joint = s.addJoint(
        previous,
        link,
        previous === -1 ? [x, top] : [-0.325, 0],
        [0.325, 0],
      );
      visibleLinks.push(joint.slot);
      chain.push(link);
      previous = link;
    }
    const hanging = color(
      s.addCircle(0.4, {
        position: [x, top - 3],
        friction: 0.5,
        restitution: 0.25,
      }),
      [0.4, 0.7, 0.24],
    );
    visibleLinks.push(
      s.addJoint(previous, hanging, [-0.325, 0], [0, 0.4]).slot,
    );
    targets.push(hanging);
    ropes.push(chain);
    const pin = color(
      s.addCircle(0.1, { position: [gap, 5.4], density: 0, collidesWith: 0 }),
      [0.45, 0.38, 0.28],
    );
    const shelf = color(
      s.addBox([1.8, 0.2], { position: [gap, 3.55], density: 2 }),
      [0.66, 0.45, 0.25],
    );
    for (const side of [-1, 1]) {
      const spring = s.addSpring(
        pin,
        shelf,
        [side * 0.65, 0],
        [side * 0.65, 0],
        { stiffness: 160, rest: 1.4 },
      );
      springs.push(spring);
      visibleLinks.push(spring.slot);
    }
    // A small linked character stands on the shelf. All limb endpoints share
    // consistent local anchors, and angular stops keep its knees plausible.
    const torso = color(
      s.addCapsule(0.16, 0.8, { position: [gap, 4.42], angle: Math.PI / 2 }),
      [0.75, 0.37, 0.21],
    );
    const head = color(
      s.addCircle(0.23, { position: [gap, 5.03] }),
      [0.4, 0.7, 0.24],
    );
    s.addHinge(torso, head, [0.4, 0], [0, -0.23], {
      minAngle: -0.35,
      maxAngle: 0.35,
    });
    const parts = [torso, head];
    for (const side of [-1, 1]) {
      const leg = color(
        s.addCapsule(0.09, 0.44, {
          position: [gap + side * 0.18, 3.96],
          angle: Math.PI / 2,
        }),
        [0.31, 0.44, 0.55],
      );
      s.addHinge(torso, leg, [-0.24, -side * 0.18], [0.22, 0], {
        minAngle: -0.65,
        maxAngle: 0.65,
      });
      const arm = color(
        s.addCapsule(0.08, 0.55, { position: [gap + side * 0.42, 4.57] }),
        [0.75, 0.37, 0.21],
      );
      s.addHinge(torso, arm, [0.15, -side * 0.17], [-side * 0.25, 0], {
        minAngle: -1.2,
        maxAngle: 1.2,
      });
      parts.push(leg, arm);
    }
    targets.push(head);
    ragdolls.push(parts);
  }
  let extra = 0;
  while (added < count) {
    const f = extra % forts,
      k = Math.floor(extra / forts);
    const id = s.addBox([0.46, 0.25], {
      position: [
        -5 + f * 18 + ((k % 8) - 3.5) * 0.46,
        rows * 0.25 + 1.9 + Math.floor(k / 8) * 0.25,
      ],
    });
    color(id, [0.86, 0.52, 0.24]);
    bricks.push(id);
    added++;
    extra++;
  }
  const origin = [-25, 4];
  color(
    s.addSegment([-25.5, 0], [-25.5, 3.5], {
      radius: 0.17,
      group: 8,
      collidesWith: 1,
    }),
    [0.38, 0.24, 0.12],
  );
  color(
    s.addSegment([-25.5, 2.6], [-24.7, 4], {
      radius: 0.15,
      group: 8,
      collidesWith: 1,
    }),
    [0.38, 0.24, 0.12],
  );
  const bird = color(
    s.addCircle(0.5, {
      position: origin,
      density: 30,
      friction: 0.35,
      restitution: 0.15,
      allowSleep: false,
      group: 2,
      collidesWith: 0,
    }),
    [0.85, 0.22, 0.18],
  );
  const hold = s.addJoint(-1, bird, origin);
  // This scoring arch only overlaps projectiles. It never contributes a force.
  const sensor = color(
    s.addBox([0.45, 8], {
      position: [-17, 4],
      density: 0,
      isTrigger: true,
      group: 4,
      collidesWith: 2,
    }),
    [0.67, 0.82, 0.9],
  );
  return {
    def,
    scene: s,
    sim: new SoaSim(s.topology, "GPU slingshot"),
    colors,
    renderOptions2D: { colors, characters: true },
    bricks,
    targets,
    bird,
    hold,
    sensor,
    visibleLinks,
    breakable,
    gates,
    ragdolls,
    ropes,
    springs,
    staticCount: Array.from(
      { length: s.bodyCount },
      (_, i) => s.topology.shape[i * 4 + 2],
    ).filter((m) => m === 0).length,
    origin,
    brickCount: count,
    width: (forts - 1) * 18 + 44,
    centerX: (-29 + (-5 + (forts - 1) * 18) + 8) / 2,
    height: Math.max(18, rows * 0.25 + 3),
    gpuParams: { dt: 1 / 120, iterations: 10, gravity: -10 },
    gpuOptions2D: {
      bodyCapacity: s.bodyCount + 64,
      sleeping: { timeThreshold: 0.3 },
    },
  };
}
