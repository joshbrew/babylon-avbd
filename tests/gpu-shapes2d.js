import { AvbdScene2D } from "../src/native/scenes.js";
import { assert, close } from "./helpers/gpu.js";
export async function shapeGpu2DTests(device, test) {
  const withScene = async (build, run, settings = {}) => {
    const scene = new AvbdScene2D({
      gravity: 0,
      timeStep: 1 / 120,
      iterations: 10,
      ...settings,
    });
    const ids = build(scene);
    const gpu = scene.createSolver(device, {
      bodyCapacity: Math.max(64, scene.bodyCount + 8),
    });
    const step = async (n) => {
      for (let i = 0; i < n; i++) {
        gpu.step();
        if (i % 20 === 19) await device.queue.onSubmittedWorkDone();
      }
    };
    try {
      await run(gpu, ids, step);
      const c = await gpu.readCounters();
      assert(!c.overflow && !c.clashes, `clean counters ${JSON.stringify(c)}`);
    } finally {
      gpu.destroy();
    }
  };
  await test("2D shapes: exact circle/capsule mass and box-only allocation", async () => {
    await withScene(
      (s) => [
        s.addCircle(2, { density: 3 }),
        s.addCapsule(1, 6, { density: 2, position: [10, 0] }),
      ],
      async (g, [a, b]) => {
        const ca = await g.readBodyState(a),
          cb = await g.readBodyState(b);
        close(ca.mass, 12 * Math.PI, 1e-5, "disk mass");
        close(ca.moment, 24 * Math.PI, 2e-5, "disk moment");
        close(cb.mass, 16 + 2 * Math.PI, 1e-5, "capsule area mass");
        close(
          cb.moment,
          2 * ((8 * 20) / 12 + Math.PI * 4.5 + 16 / 3),
          2e-5,
          "capsule area moment",
        );
        assert(g.shapeBuffer, "native geometry allocated");
      },
    );
    await withScene(
      (s) => s.addBox([1, 1]),
      async (g) => {
        g.step();
        await g.readBodies();
        assert(
          !g.shapeBuffer && !g.bodyCommands && !g.filters,
          "box-only world keeps optional buffers absent",
        );
      },
    );
  });
  await test("2D shapes: analytic contacts for every shape pairing and both index orders", async () => {
    const pairs = [
      [
        (s) => s.addCircle(0.5, { position: [0, 0.49] }),
        (s) => s.addPlane(),
        true,
      ],
      [
        (s) => s.addCapsule(0.3, 2, { position: [0, 0.29] }),
        (s) => s.addPlane(),
        true,
      ],
      [
        (s) => s.addBox([1, 1], { position: [0, 0.49] }),
        (s) => s.addPlane(),
        true,
      ],
      [
        (s) => s.addCircle(0.5, { position: [0, 0.9] }),
        (s) => s.addCircle(0.5, { density: 0 }),
        true,
      ],
      [
        (s) => s.addCircle(0.5, { position: [0, 0.9] }),
        (s) => s.addBox([2, 1], { density: 0 }),
        true,
      ],
      [
        (s) => s.addCapsule(0.3, 2, { position: [0, 0.5] }),
        (s) => s.addBox([2, 0.5], { density: 0 }),
        true,
      ],
      [
        (s) => s.addCircle(0.5, { position: [0, 0.75] }),
        (s) => s.addCapsule(0.3, 3, { density: 0 }),
        true,
      ],
      [
        (s) => s.addCapsule(0.3, 2, { position: [0, 0.55] }),
        (s) => s.addCapsule(0.3, 3, { density: 0 }),
        true,
      ],
      [
        (s) => s.addCircle(0.5, { position: [0.6, 0.6] }),
        (s) => s.addBox([0.5, 0.5], { density: 0 }),
        true,
      ],
      [
        (s) => s.addCircle(0.5, { position: [0.7, 0.7] }),
        (s) => s.addBox([0.5, 0.5], { density: 0 }),
        false,
      ],
      [
        (s) => s.addCircle(0.5, { position: [1.49, 0] }),
        (s) => s.addSegment([-1, 0], [1, 0]),
        true,
      ],
      [
        (s) => s.addBox([1, 1], { position: [0, 0.49] }),
        (s) => s.addSegment([-2, 0], [2, 0]),
        true,
      ],
      [
        (s) => s.addCapsule(0.3, 2, { position: [0, 0.29] }),
        (s) => s.addSegment([-2, 0], [2, 0]),
        true,
      ],
    ];
    for (const [one, two, overlap] of pairs)
      for (const reverse of [false, true]) {
        await withScene(
          (s) => (reverse ? [two(s), one(s)] : [one(s), two(s)]),
          async (g, ids) => {
            g.step();
            const counters = await g.readCounters();
            assert(
              counters.contacts > 0 === overlap,
              `pair ${pairs.findIndex((p) => p[0] === one)} reversed ${reverse}: ${counters.contacts} contacts`,
            );
            const contacts = await g.readContacts();
            const f = new Float32Array(contacts);
            assert(f.every(Number.isFinite), "finite contact data");
            for (let o = 0; o < f.length; o += 20)
              close(
                Math.hypot(f[o + 14], f[o + 15]),
                1,
                1e-5,
                "unit contact normal",
              );
          },
        );
      }
  });
  await test("2D shapes: rotated capsules, crossing segments and infinite tilted planes", async () => {
    await withScene(
      (s) => [
        s.addPlane(),
        s.addCircle(0.5, { position: [10000, 0.49] }),
        s.addCapsule(0.25, 2, { position: [-10000, 1], angle: Math.PI / 2 }),
      ],
      async (g, ids, step) => {
        await step(60);
        const p = await g.readBodies();
        assert(p.every(Number.isFinite), "finite unbounded plane world");
        assert(
          (await g.readBodyState(ids[1])).position[1] > 0.49,
          "plane works beyond any finite floor proxy",
        );
      },
    );
    await withScene(
      (s) => [
        s.addCapsule(0.1, 4, { density: 0, angle: 0.7 }),
        s.addCapsule(0.1, 4, { angle: -0.7 }),
      ],
      async (g) => {
        g.step();
        assert(
          (await g.readCounters()).contacts > 0,
          "crossing spines collide",
        );
      },
    );
    await withScene(
      (s) => [
        s.addPlane([1, 1], 0),
        s.addCircle(0.5, { position: [0.34, 0.34] }),
      ],
      async (g) => {
        g.step();
        const bytes = await g.readContacts(),
          f = new Float32Array(bytes);
        assert(f.length > 0, "tilted plane contact");
        close(f[14], Math.SQRT1_2, 1e-5, "tilted normal x");
        close(f[15], Math.SQRT1_2, 1e-5, "tilted normal y");
      },
    );
  });
  await test("2D shapes: GPU ray/circle casts use exact curved and zero-thickness surfaces", async () => {
    await withScene(
      (s) => [
        s.addCircle(1, { density: 0 }),
        s.addCapsule(0.5, 4, {
          density: 0,
          position: [5, 0],
          angle: Math.PI / 2,
        }),
        s.addSegment([8, -2], [8, 2]),
        s.addPlane([0, 1], -5),
      ],
      async (g, [circle, capsule, line, plane]) => {
        let h = await g.raycast([-3, 0], [1, 0]);
        assert(h.index === circle, "circle owner");
        close(h.distance, 2, 1e-5, "circle distance");
        h = await g.raycast([3, 0], [1, 0]);
        assert(h.index === capsule, "rotated capsule owner");
        close(h.distance, 1.5, 1e-5, "capsule side");
        h = await g.circleCast([3, 0], 0.25, [1, 0]);
        close(h.distance, 1.25, 1e-5, "expanded capsule");
        h = await g.raycast([7, 0], [1, 0]);
        assert(h.index === line, "finite line hit");
        close(h.distance, 1, 1e-5, "line distance");
        h = await g.raycast([8, 3], [0, -1]);
        assert(h.index === line, "collinear ray reaches the finite endpoint");
        close(h.distance, 1, 1e-5, "collinear line endpoint distance");
        h = await g.circleCast([7, 0], 0.25, [1, 0]);
        close(h.distance, 0.75, 1e-5, "line swept disk");
        h = await g.raycast([10000, 0], [0, -1]);
        assert(h.index === plane, "infinite plane hit");
        close(h.distance, 5, 1e-5, "plane distance");
        h = await g.circleCast([10000, 0], 0.25, [0, -1]);
        close(h.distance, 4.75, 1e-5, "plane swept disk");
        assert(
          (await g.raycast([-2, 1.01], [1, 0], { maxDistance: 3 })) === null,
          "circle bounding-box false positive rejected",
        );
        assert(
          (await g.raycast([7, 2.1], [1, 0], { maxDistance: 2 })) === null,
          "line stops at endpoint",
        );
        h = await g.raycast([5, 0], [1, 0]);
        close(h.distance, 0, 0, "initial overlap");
      },
    );
  });
  await test("2D body commands: ordered impulses and force use live GPU poses and exact inertia", async () => {
    await withScene(
      (s) => s.addCircle(1, { density: 2 / Math.PI, position: [0, 0] }),
      async (g, a, step) => {
        g.setLinearVelocity(a, [1, 0])
          .applyImpulse(a, [2, 0])
          .applyImpulse(a, [2, 0]);
        let p = await g.readBodyState(a);
        close(p.linearVelocity[0], 3, 1e-5, "accumulated impulses");
        g.teleport(a, [10, 5], 0.3)
          .setLinearVelocity(a, [0, 0])
          .setAngularVelocity(a, 0)
          .applyImpulse(a, [0, 2], [11, 5]);
        p = await g.readBodyState(a);
        close(p.position[0], 10, 0, "teleported position");
        close(p.linearVelocity[1], 1, 1e-5, "off-center impulse velocity");
        close(p.angularVelocity, 2, 1e-5, "live center moment arm");
        g.teleport(a, [20, 5]);
        p = await g.readBodyState(a);
        close(p.angle, 0.3, 1e-5, "omitted angle preserved");
        close(p.linearVelocity[1], 1, 1e-5, "teleport preserves velocity");
        let h = await g.raycast([18, 5], [1, 0]);
        assert(h.index === a, "query flushes body commands");
        close(h.distance, 1, 1e-5, "query live pose");
        g.setLinearVelocity(a, [0, 0])
          .setAngularVelocity(a, 0)
          .applyForce(a, [240, 0]);
        await step(1);
        p = await g.readBodyState(a);
        close(p.linearVelocity[0], 1, 0.002, "one-step force");
        await step(1);
        close(
          (await g.readBodyState(a)).linearVelocity[0],
          1,
          0.002,
          "force not applied twice",
        );
        const frozen = g.addCircle(1, { density: 0, position: [30, 0] });
        g.applyImpulse(frozen, [10, 5], [31, 0]);
        close(
          (await g.readBodyState(frozen)).angularVelocity,
          0,
          0,
          "static impulse ignored",
        );
        g.setAngularVelocity(a, 0)
          .applyAngularImpulse(a, 1)
          .applyTorque(a, 120);
        close(
          (await g.readBodyState(a)).angularVelocity,
          2,
          1e-5,
          "angular impulse and one-step torque",
        );
      },
    );
  });
  await test("2D body commands: teleport clears old friction anchors without moving neighbors", async () => {
    await withScene(
      (s) => {
        s.addPlane();
        return [
          s.addCircle(0.5, { position: [0, 0.5], friction: 1 }),
          s.addBox([1, 1], { position: [10, 0.5] }),
        ];
      },
      async (g, [circle, box], step) => {
        await step(240);
        g.teleport(circle, [5, 0.5])
          .setLinearVelocity(circle, [0, 0])
          .setAngularVelocity(circle, 0);
        await step(1);
        const a = await g.readBodyState(circle),
          b = await g.readBodyState(box);
        close(
          a.position[0],
          5,
          0.005,
          "teleport does not pull back toward an old floor anchor",
        );
        close(
          b.position[0],
          10,
          0.005,
          "untouched neighbor retains its live pose",
        );
        assert(a.position[1] > 0.49, "ground contact remains supported");
      },
      { gravity: -10 },
    );
  });
  await test("2D shapes: invalid geometry is rejected before allocating body slots", async () => {
    const scene = new AvbdScene2D();
    const rejects = (fn) => {
      let rejected = false;
      try {
        fn();
      } catch {
        rejected = true;
      }
      assert(rejected, "invalid shape rejected");
    };
    for (const add of [
      () => scene.addCircle(0),
      () => scene.addCapsule(0.5, 0.7),
      () => scene.addPlane([0, 0]),
      () => scene.addPlane([0, 1], 0, { density: 1 }),
      () => scene.addSegment([0, 0], [0, 0]),
      () => scene.addSegment([0, 0], [1, 0], { density: 1 }),
      () => scene.addSegment([0, 0], [1, 0], { position: [0, 0] }),
    ])
      rejects(add);
    assert(scene.bodyCount === 0, "invalid factory shapes leave no slots");
    const body = scene.addCircle(0.5);
    const gpu = scene.createSolver(device, { bodyCapacity: 1 });
    try {
      rejects(() => gpu.addCapsule(0.25, 1));
      rejects(() => gpu.teleport(body, [NaN, 0]));
      rejects(() => gpu.applyImpulse(-1, [1, 0]));
      rejects(() => gpu.setAngularVelocity(body, Infinity));
      assert(
        gpu.bodyCount === 1 && !gpu.bodyCommands,
        "rejected commands allocate no edit buffers",
      );
      gpu.step();
      assert(
        (await gpu.readBodies()).every(Number.isFinite),
        "world remains usable",
      );
    } finally {
      gpu.destroy();
    }
  });
  await test("2D shapes: live append composes geometry, sensors, masks, restitution and constraints", async () => {
    await withScene(
      (s) => s.addBox([1, 1], { density: 0, position: [0, -0.5] }),
      async (g, floor, step) => {
        g.setSensor(floor, true);
        g.setFilters([floor], [1], [1]);
        const ball = g.addCircle(0.5, {
          position: [0, 0.49],
          group: 1,
          collidesWith: 1,
          restitution: 0.5,
        });
        g.watchContacts();
        await step(1);
        const events = await g.readContactEvents();
        assert(
          events.events.some((e) => e.type === "begin" && e.isTrigger),
          "mixed shape sensor begins",
        );
        g.setSensor(floor, false);
        g.setFilters([ball], [2], [2]);
        await step(1);
        assert(
          (await g.readCounters()).contacts === 0,
          "masks reject analytic contacts",
        );
        g.setFilters([ball], [1], [1]);
        await step(1);
        assert(
          (await g.readCounters()).contacts > 0,
          "masks enable analytic contacts",
        );
        const capsule = g.addCapsule(0.2, 1, { position: [3, 0] });
        g.addSegment([-10, -2], [10, -2]);
        g.addPlane([0, 1], -3);
        g.appendJoint(-1, capsule, [3, 0], [0, 0], [Infinity, Infinity, 0]);
        await step(30);
        assert(
          (await g.readBodies()).every(Number.isFinite),
          "live shapes and constraints finite",
        );
        close(
          (await g.readBodyState(capsule)).position[0],
          3,
          0.01,
          "native capsule joint anchor",
        );
      },
    );
  });
  await test("2D shapes: mixed bodies settle without losing rotation or bounce", async () => {
    await withScene(
      (s) => {
        s.addPlane();
        const ids = [];
        for (let i = 0; i < 12; i++) {
          const x = i * 3 - 16.5,
            y = 2 + (i % 3);
          ids.push(
            i % 3 === 0
              ? s.addCircle(0.5, { position: [x, y] })
              : i % 3 === 1
                ? s.addCapsule(0.3, 1.6, { position: [x, y], angle: 0.4 })
                : s.addBox([1, 0.6], { position: [x, y], angle: 0.4 }),
          );
        }
        return ids;
      },
      async (g, ids, step) => {
        await step(480);
        const p = await g.readBodies();
        assert(p.every(Number.isFinite), "finite settled state");
        for (const i of ids) {
          assert(p[i * 24 + 1] > 0.24, "all shapes remain above ground");
          assert(
            Math.hypot(p[i * 24 + 12], p[i * 24 + 13]) < 0.15,
            "resting shapes settle",
          );
        }
        assert(
          Math.abs(p[ids[1] * 24 + 2] - 0.4) > 0.1,
          "capsule rotates under gravity",
        );
      },
      { gravity: -10 },
    );
    await withScene(
      (s) => {
        s.addPlane();
        return s.addCircle(0.5, { position: [0, 2], restitution: 0.8 });
      },
      async (g, a, step) => {
        let upward = false;
        for (let k = 0; k < 25; k++) {
          await step(6);
          if ((await g.readBodyState(a)).linearVelocity[1] > 1) upward = true;
        }
        assert(upward, "analytic circle bounces");
      },
      { gravity: -10 },
    );
  });
}
