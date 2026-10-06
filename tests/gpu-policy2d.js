import { AvbdScene2D } from "../src/native/scenes.js";
import { assert, close } from "./helpers/gpu.js";
export async function policyGpu2DTests(device, test) {
  const advance = async (g, n) => {
    for (let i = 0; i < n; i++) {
      g.step();
      if (i % 30 === 29) await device.queue.onSubmittedWorkDone();
    }
    const c = await g.readCounters();
    assert(!c.overflow && !c.clashes, JSON.stringify(c));
  };
  await test("2D policy: selective contact events include masked sensors without solving overlaps", async () => {
    const s = new AvbdScene2D({
      gravity: 0,
      timeStep: 1 / 240,
      iterations: 10,
    });
    const sensor = s.addBox([0.45, 8], {
      density: 0,
      position: [-17, 4],
      isTrigger: true,
      group: 4,
      collidesWith: 2,
    });
    const ball = s.addCircle(0.5, {
      position: [-18, 4],
      velocity: [27, 0, 0],
      group: 2,
    });
    const a = s.addBox([1, 1], { position: [5, 0] }),
      b = s.addBox([1, 1], { position: [5.9, 0] });
    const g = s.createSolver(device, { bodyCapacity: 16 });
    try {
      g.watchContacts({ indices: [ball], maxPairs: 32, maxEvents: 128 });
      await advance(g, 24);
      const events = await g.readContactEvents();
      assert(
        events.events.some(
          (e) =>
            e.type === "begin" && e.isTrigger && [e.a, e.b].includes(sensor),
        ),
        JSON.stringify(events),
      );
      assert(
        events.events.every((e) => [e.a, e.b].includes(ball)),
        "unwatched collisions excluded",
      );
      const state = await g.readBodyState(ball);
      close(
        state.linearVelocity[0],
        27,
        0.05,
        "sensor does not block the ball",
      );
      const spawned = g.addCircle(0.5, { position: [5, 0] });
      await advance(g, 1);
      const unwatched = await g.readContactEvents();
      assert(
        unwatched.events.every((e) => e.a !== spawned && e.b !== spawned),
        "spawn respects selective watch",
      );
      g.watchContacts({ indices: [spawned] });
      await advance(g, 1);
      assert(
        (await g.readContactEvents()).events.some(
          (e) => e.a === spawned || e.b === spawned,
        ),
        "selection can change live",
      );
      const before = g.contactWatch;
      let rejected = false;
      try {
        g.watchContacts({ indices: [-1] });
      } catch {
        rejected = true;
      }
      assert(
        rejected && g.contactWatch === before,
        "invalid watch selection atomic",
      );
    } finally {
      g.destroy();
    }
  });
  await test("2D policy: supported stacks sleep with real mass and inertia, excluded bodies stay awake", async () => {
    const s = new AvbdScene2D({
      timeStep: 1 / 120,
      gravity: -10,
      iterations: 10,
    });
    s.addPlane();
    const stack = Array.from({ length: 3 }, (_, i) =>
      s.addBox([1, 1], { position: [0, 0.5 + i], allowSleep: true }),
    );
    const excluded = s.addCircle(0.5, {
      position: [4, 0.5],
      allowSleep: false,
    });
    const g = s.createSolver(device, {
      sleeping: { timeThreshold: 0.1 },
      bodyCapacity: 32,
    });
    try {
      const initial = await g.readBodies();
      await advance(g, 720);
      const p = await g.readBodies();
      assert(
        (await g.readSleepStats()).sleeping === 3,
        JSON.stringify(await g.readSleepStats()),
      );
      for (const i of stack) {
        assert(p[i * 24 + 15] === 1, "stack asleep");
        close(p[i * 24 + 22], initial[i * 24 + 22], 0, "real mass");
        close(p[i * 24 + 23], initial[i * 24 + 23], 0, "real inertia");
      }
      assert(p[excluded * 24 + 15] === 0, "excluded awake");
      await advance(g, 120);
      const held = await g.readBodies();
      for (const i of stack)
        for (let k = 0; k < 3; k++)
          close(held[i * 24 + k], p[i * 24 + k], 0, "sleeping pose held");
      g.setSleepEnabled(stack[2], false);
      assert(
        !(await g.readBodyState(stack[2])).sleeping,
        "disabling wakes immediately",
      );
      const spawn = g.addCapsule(0.2, 1, {
        position: [8, 1],
        allowSleep: true,
      });
      assert(
        (await g.readBodyState(spawn)).mass > 0,
        "live append preserves shape mass",
      );
    } finally {
      g.destroy();
    }
  });
  await test("2D policy: impacts wake in the collision step and impulses use real sleeping mass", async () => {
    const s = new AvbdScene2D({
      timeStep: 1 / 120,
      gravity: 0,
      iterations: 10,
    });
    const a = s.addCircle(0.5, { allowSleep: true }),
      b = s.addCircle(0.5, { position: [-4, 0], allowSleep: false });
    const g = s.createSolver(device, { sleeping: { timeThreshold: 0.05 } });
    try {
      await advance(g, 30);
      assert((await g.readBodyState(a)).sleeping, "first body sleeps");
      g.applyImpulse(a, [Math.PI * 0.5 * 0.5 * 2, 0]);
      close(
        (await g.readBodyState(a)).linearVelocity[0],
        2,
        1e-5,
        "sleeping impulse",
      );
      g.teleport(a, [0, 0]).setLinearVelocity(a, [0, 0]);
      await advance(g, 30);
      g.setLinearVelocity(b, [4, 0]);
      let collided = false;
      for (let i = 0; i < 120; i++) {
        await advance(g, 1);
        const c = await g.readCounters();
        if (c.contacts) {
          collided = true;
          const p = await g.readBodyState(a);
          assert(!p.sleeping && p.linearVelocity[0] > 0.5, JSON.stringify(p));
          break;
        }
      }
      assert(collided, "projectile reached sleeper");
      const aa = await g.readBodyState(a),
        bb = await g.readBodyState(b);
      close(
        aa.linearVelocity[0] + bb.linearVelocity[0],
        4,
        0.15,
        "reciprocal equal-mass impact",
      );
    } finally {
      g.destroy();
    }
  });
  await test("2D policy: support removal, masks, sensors and slow unsupported falls wake correctly", async () => {
    const s = new AvbdScene2D({
      timeStep: 1 / 120,
      gravity: -1,
      iterations: 10,
    });
    const floor = s.addBox([4, 1], { density: 0, position: [0, 0] });
    const box = s.addBox([1, 1], { position: [0, 1], allowSleep: true });
    const falling = s.addCircle(0.2, { position: [8, 10], allowSleep: true });
    const g = s.createSolver(device, {
      sleeping: { speedThreshold: 0.2, timeThreshold: 0.03 },
    });
    try {
      await advance(g, 80);
      assert((await g.readBodyState(box)).sleeping, "supported body asleep");
      assert(
        !(await g.readBodyState(falling)).sleeping,
        "unsupported fall awake",
      );
      g.setFilters([box], [1], [0]);
      await advance(g, 30);
      assert(
        !(await g.readBodyState(box)).sleeping &&
          (await g.readBodyState(box)).position[1] < 0.99,
        "mask edit wakes and removes support",
      );
      g.setFilters([box], [0xffffffff], [0xffffffff]);
      g.teleport(box, [0, 1]).setLinearVelocity(box, [0, 0]);
      await advance(g, 80);
      g.setSensor(floor, true);
      await advance(g, 30);
      assert(
        !(await g.readBodyState(box)).sleeping,
        "trigger floor cannot support",
      );
      g.setSensor(floor, false);
      g.teleport(box, [0, 1]).setLinearVelocity(box, [0, 0]);
      await advance(g, 80);
      g.teleport(floor, [20, 0]);
      await advance(g, 30);
      assert(
        (await g.readBodyState(box)).position[1] < 0.99,
        "support teleport wakes fall",
      );
    } finally {
      g.destroy();
    }
  });
  await test("2D policy: hard world hinges can sleep, powered motors stay awake, released anchors fall", async () => {
    const s = new AvbdScene2D({
      timeStep: 1 / 120,
      gravity: -10,
      iterations: 10,
    });
    const resting = s.addBox([1, 1], { position: [0, 3], allowSleep: true }),
      powered = s.addBox([1, 1], { position: [4, 3], allowSleep: true });
    const anchor = s.addHinge(-1, resting, [0, 3]);
    const hinge = s.addHinge(-1, powered, [4, 3], [0, 0], {
      minAngle: -0.1,
      maxAngle: 0.1,
      motor: { speed: 2, maxTorque: 10 },
    });
    const g = s.createSolver(device, { sleeping: { timeThreshold: 0.05 } });
    try {
      await advance(g, 240);
      assert((await g.readBodyState(resting)).sleeping, "world anchor sleeps");
      assert(
        !(await g.readBodyState(powered)).sleeping,
        "powered stop stays awake",
      );
      g.setMotor(hinge.motor.slot, { maxTorque: 0 });
      await advance(g, 120);
      assert(
        (await g.readBodyState(powered)).sleeping,
        "unpowered hinge sleeps",
      );
      anchor.dispose();
      await advance(g, 60);
      assert(
        (await g.readBodyState(resting)).position[1] < 2,
        "released anchor falls",
      );
      g.destroy();
      hinge.dispose();
      hinge.destroy();
    } finally {
      g.destroy();
    }
  });
  for (const postStabilize of [false, true])
    await test(`2D policy: motor respects both hinge stops and live limit edits${postStabilize ? " with post stabilization" : ""}`, async () => {
      const s = new AvbdScene2D({
        timeStep: 1 / 120,
        gravity: 0,
        iterations: 10,
        postStabilize,
      });
      const b = s.addBox([2, 1], { position: [1, 2], angle: 0.8 });
      const hinge = s.addHinge(-1, b, [1, 2], [0, 0], {
        minAngle: -0.4,
        maxAngle: 0.6,
        motor: { speed: 3, maxTorque: 25 },
      });
      const g = s.createSolver(device);
      try {
        await advance(g, 240);
        let p = await g.readBodyState(b);
        close(0.8 - p.angle, 0.6, 0.008, "upper stop");
        close(p.position[0], 1, 0.001, "anchor x");
        close(p.position[1], 2, 0.001, "anchor y");
        g.setMotor(hinge.motor.slot, { speed: -3 });
        await advance(g, 240);
        p = await g.readBodyState(b);
        close(0.8 - p.angle, -0.4, 0.008, "lower stop");
        hinge.limits.setLimits({ minAngle: 0, maxAngle: 0 });
        await advance(g, 180);
        close(
          (await g.readBodyState(b)).angle,
          0.8,
          0.01,
          "equal limits lock relative angle",
        );
        hinge.limits.dispose();
        await advance(g, 120);
        assert(
          (await g.readBodyState(b)).angle > 2,
          "disposed stop permits rotation",
        );
      } finally {
        g.destroy();
      }
    });
  await test("2D policy: two-body angular limits preserve momentum and a free hinge crosses full turns", async () => {
    const s = new AvbdScene2D({
      timeStep: 1 / 120,
      gravity: 0,
      iterations: 15,
    });
    const a = s.addCircle(0.5, {
        position: [0, 0],
        angle: 0.8,
        velocity: [0, 0, 2],
      }),
      b = s.addCircle(0.5, {
        position: [3, 0],
        angle: -0.3,
        velocity: [0, 0, -2],
      });
    const limit = s.addAngularLimit(a, b, { minAngle: -0.2, maxAngle: 0.5 });
    const wheel = s.addCircle(0.5, { position: [8, 0] });
    s.addHinge(-1, wheel, [8, 0], [0, 0], {
      motor: { speed: 3, maxTorque: 5 },
    });
    const g = s.createSolver(device);
    try {
      await advance(g, 240);
      const aa = await g.readBodyState(a),
        bb = await g.readBodyState(b);
      close(aa.angle - bb.angle - 1.1, 0.5, 0.01, "relative stop");
      close(
        aa.angularVelocity + bb.angularVelocity,
        0,
        0.025,
        "angular momentum",
      );
      assert(
        (await g.readBodyState(wheel)).angle < -5,
        "free hinge has no implicit pi wrap",
      );
      limit.dispose();
    } finally {
      g.destroy();
    }
  });
  await test("2D policy: invalid limits and sleep options reject without allocating or changing constraints", async () => {
    const s = new AvbdScene2D();
    const b = s.addBox([1, 1]);
    for (const options of [
      { minAngle: 1, maxAngle: 0 },
      { minAngle: NaN },
      { motor: { maxTorque: -1 } },
    ]) {
      let rejected = false;
      try {
        s.addHinge(-1, b, [0, 0], [0, 0], options);
      } catch {
        rejected = true;
      }
      assert(rejected && s.topology.jointCount === 0, "invalid hinge atomic");
    }
    for (const options of [
      { sleeping: { timeThreshold: 0 } },
      { sleeping: 3 },
    ]) {
      let rejected = false;
      try {
        s.createSolver(device, options);
      } catch {
        rejected = true;
      }
      assert(rejected && !s.created, "sleep options atomic");
    }
    const g = s.createSolver(device);
    try {
      assert(!g.sleeping, "off default allocates no sleeping buffers");
      g.setSleepEnabled(b, true);
      assert(g.sleeping, "body opt-in enables sleeping");
      let rejected = false;
      try {
        g.setSleepEnabled(b, 1);
      } catch {
        rejected = true;
      }
      assert(rejected, "sleep flag validates");
    } finally {
      g.destroy();
    }
  });
}
