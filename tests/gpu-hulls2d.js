import { NullEngine, Scene } from "@babylonjs/core";
import { AvbdScene2D } from "../src/native/scenes.js";
import { assert, close } from "./helpers/gpu.js";
const diamond = [
  [-1, 0],
  [0, -1],
  [1, 0],
  [0, 1],
];
const rectangle = [-1, -0.5, 1, -0.5, 1, 0.5, -1, 0.5];
export async function hullGpu2DTests(device, test) {
  const world = async (build, run, settings = {}) => {
    const s = new AvbdScene2D({
      gravity: 0,
      timeStep: 1 / 120,
      iterations: 10,
      ...settings,
    });
    const ids = build(s);
    const g = s.createSolver(device, { bodyCapacity: 64 });
    try {
      await run(g, ids);
      if (!g.destroyed) {
        const c = await g.readCounters();
        assert(!c.overflow && !c.clashes, JSON.stringify(c));
      }
    } finally {
      g.destroy();
    }
  };
  await test("2D hulls: point clouds, exact area and centroid inertia", async () => {
    await world(
      (s) => [
        s.addHull([...diamond, [0, 0], diamond[0]], { density: 3 }),
        s.addHull([0, 0, 3, 0, 0, 3], { density: 2, position: [8, 4] }),
      ],
      async (g, [a, b]) => {
        const p = await g.readBodyState(a),
          q = await g.readBodyState(b);
        close(p.mass, 6, 1e-5, "diamond mass");
        close(p.moment, 2, 1e-5, "diamond inertia");
        close(q.mass, 9, 1e-5, "triangle mass");
        close(q.moment, 9, 1e-5, "centroid triangle inertia");
        close(q.position[0], 8, 0, "position is center of mass");
      },
    );
    const s = new AvbdScene2D();
    const tooMany = Array.from({ length: 33 }, (_, i) => [
      Math.cos((i * 2 * Math.PI) / 33),
      Math.sin((i * 2 * Math.PI) / 33),
    ]);
    for (const points of [
      [],
      [0, 0, 1, 1, 2, 2],
      [0, 0, NaN, 1, 1, 0],
      tooMany,
    ]) {
      let rejected = false;
      try {
        s.addHull(points);
      } catch {
        rejected = true;
      }
      assert(
        rejected && s.bodyCount === 0,
        "invalid hull leaves topology untouched",
      );
    }
  });
  await test("2D hulls: all collider pairings, both orders and separated controls", async () => {
    const shapes = [
      (s) => s.addBox([2, 1], { density: 0 }),
      (s) => s.addCircle(0.5, { density: 0 }),
      (s) => s.addCapsule(0.4, 2, { density: 0 }),
      (s) => s.addSegment([-2, 0], [2, 0]),
      (s) => s.addPlane(),
      (s) => s.addHull(rectangle, { density: 0 }),
    ];
    for (const shape of shapes)
      for (const reverse of [false, true])
        for (const separated of [false, true]) {
          await world(
            (s) => {
              const h = () =>
                s.addHull(diamond, {
                  position: [0, separated ? 4 : 0.4],
                  angle: 0.13,
                });
              return reverse ? [shape(s), h()] : [h(), shape(s)];
            },
            async (g) => {
              g.step();
              const bytes = await g.readContacts();
              assert(
                bytes.byteLength > 0 === !separated,
                "exact hull pairing overlap",
              );
              assert(
                new Float32Array(bytes).every(Number.isFinite),
                "finite anchors",
              );
            },
          );
        }
  });
  await test("2D hulls: clipped face manifold and resting polygon stack", async () => {
    await world(
      (s) => {
        s.addHull(rectangle, { density: 0 });
        return s.addHull(rectangle, { position: [0, 0.98], angle: 0.01 });
      },
      async (g) => {
        g.step();
        const bytes = await g.readContacts();
        assert(
          bytes.byteLength === 160,
          "tilted face keeps two clipped contacts",
        );
        for (let i = 0; i < 600; i++) {
          g.step();
          if (i % 30 === 29) await device.queue.onSubmittedWorkDone();
        }
        const p = await g.readBodyState(1);
        close(p.position[1], 1, 0.015, "rests on polygon face");
        assert(Math.abs(p.angularVelocity) < 0.05, "resting angular stability");
      },
      { gravity: -10 },
    );
  });
  await test("2D hulls: exact rays, disk sweeps, corners and rotated poses", async () => {
    await world(
      (s) => s.addHull(diamond, { density: 0 }),
      async (g, a) => {
        let h = await g.raycast([-3, 0], [1, 0]);
        assert(h.index === a, "hull owner");
        close(h.distance, 2, 1e-5, "vertex ray");
        h = await g.raycast([-3, 0.5], [1, 0]);
        close(h.distance, 2.5, 1e-5, "sloped face");
        h = await g.circleCast([-3, 0.5], 0.2, [1, 0]);
        close(h.distance, 2.5 - 0.2 * Math.SQRT2, 1e-5, "offset sloped face");
        h = await g.circleCast([-3, 0], 0.2, [1, 0]);
        close(h.distance, 1.8, 1e-5, "rounded vertex");
        assert(
          (await g.raycast([0.9, 0.9], [1, 0], { maxDistance: 2 })) === null,
          "bounding rectangle is not collider",
        );
        assert(
          (await g.circleCast([1.1, 0.3], 0.05, [1, 0], { maxDistance: 2 })) ===
            null,
          "rounded hull rejects proxy false hits",
        );
        h = await g.circleCast([1.1, 0], 0.2, [1, 0]);
        close(h.distance, 0, 0, "initial rounded overlap");
        g.teleport(a, [5, 2], Math.PI / 4);
        h = await g.raycast([2, 2], [1, 0]);
        close(h.distance, 3 - Math.SQRT1_2, 1e-5, "rotated live hull");
      },
    );
  });
  await test("2D hulls: live geometry growth preserves old queries and body commands", async () => {
    await world(
      (s) => s.addBox([1, 1], { position: [-8, 0] }),
      async (g, a) => {
        const first = g.addHull(diamond, {
          position: [0, 0],
          isTrigger: true,
          group: 2,
          collidesWith: 4,
        });
        const old = g.shapeBuffer;
        const many = Array.from({ length: 32 }, (_, i) => [
          Math.cos((i * Math.PI) / 16),
          Math.sin((i * Math.PI) / 16),
        ]);
        let last;
        for (let i = 0; i < 40; i++)
          last = g.addHull(many, { position: [10 + i * 3, 0], density: 0 });
        assert(
          g.shapeBuffer !== old,
          "geometry buffer grows independently of body slots",
        );
        let h = await g.raycast([-3, 0], [1, 0], { collidesWith: 2 });
        assert(h.index === first, "old geometry and mask retained");
        const newHit = await g.raycast([127, 3], [0, -1], { maxDistance: 4 });
        assert(newHit?.index === last, "new geometry survives repeated growth");
        close(newHit.distance, 2, 1e-5, "new polygon vertex distance");
        assert(
          (await g.raycast([-3, 0], [1, 0], {
            collidesWith: 2,
            includeTriggers: false,
            maxDistance: 6,
          })) === null,
          "hull sensors excluded",
        );
        g.applyImpulse(first, [2, 0]);
        const p = await g.readBodyState(first);
        close(p.linearVelocity[0], 1, 1e-5, "hull impulse uses area mass");
        g.step();
        await g.readBodies();
        assert(
          (await g.readBodyState(a)).position[0] === -8,
          "existing box preserved",
        );
        const count = g.bodyCount;
        let rejected = false;
        try {
          g.addHull([0, 0, 1, 0, 2, 0]);
        } catch {
          rejected = true;
        }
        assert(
          rejected && g.bodyCount === count,
          "invalid live hull is atomic",
        );
      },
    );
  });
  await test("2D Babylon: automatic fixed stepping, detachment and scene disposal", async () => {
    const engine = new NullEngine(),
      scene = new Scene(engine),
      other = new Scene(engine);
    await world(
      (s) => s.addHull(diamond, { velocity: [1, 0, 0] }),
      async (g, a) => {
        engine.getDeltaTime = () => 1000 / 60;
        let steps = 0;
        g.attachToScene(scene, { afterStep: () => steps++ });
        g.attachToScene(scene);
        for (let i = 0; i < 10; i++)
          scene.onBeforeRenderObservable.notifyObservers(scene);
        assert(steps === 20, "one fixed loop, two 120Hz steps per frame");
        close(
          (await g.readBodyState(a)).position[0],
          1 / 6,
          1e-5,
          "automatic GPU motion",
        );
        let rejected = false;
        try {
          g.attachToScene(other);
        } catch {
          rejected = true;
        }
        assert(rejected, "reject second scene");
        g.detachFromScene();
        scene.onBeforeRenderObservable.notifyObservers(scene);
        assert(steps === 20, "detach stops stepping");
        g.attachToScene(other);
        other.dispose();
        let destroyed = false;
        try {
          g.addCircle(1);
        } catch {
          destroyed = true;
        }
        assert(destroyed, "scene disposal releases solver");
      },
    );
    scene.dispose();
    engine.dispose();
  });
}
