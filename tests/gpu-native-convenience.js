import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { assert, close } from "./helpers/gpu.js";

export async function nativeConvenienceGpuTests(device, test) {
  for (const dimension of [2, 3]) {
    const vec = (x, y, z = 0) => (dimension === 2 ? [x, y] : [x, y, z]);
    const make = (options) =>
      dimension === 2 ? new AvbdScene2D(options) : new AvbdScene3D(options);
    const sphere = (s, r, options = {}) => {
      if (dimension === 3) return s.addSphere(r, options);
      const { mass, velocity, ...rest } = options;
      return s.addCircle(r, {
        ...rest,
        ...(mass === undefined ? {} : { density: mass / (Math.PI * r * r) }),
        ...(velocity === undefined ? {} : { velocity: [...velocity, 0] }),
      });
    };
    await test(`Native convenience: ${dimension}D packed mass velocity updates`, async () => {
      const s = make({ gravity: 0 });
      const refs = [];
      for (let i = 0; i < 256; i++)
        refs.push(sphere(s, 0.25, { position: vec(i * 2, 5) }));
      const g = s.createSolver(device);
      try {
        const ids = Uint32Array.from(refs, (b) => g.bodyIndex(b)).sort(),
          values = new Float32Array(ids.length * dimension);
        for (let i = 0; i < ids.length; i++) {
          values[i * dimension] = i % 7;
          values[i * dimension + 1] = 2;
        }
        g.body(ids[0]).setAngularVelocity(dimension === 2 ? 1 : [0, 0, 1]);
        g.setLinearVelocities(ids, values);
        assert(
          g.velocityBatch.lastBatch.uploadedBytes ===
            ids.length * (dimension + 1) * 4,
          "Packed bytes scale with fields, not command objects",
        );
        const state = await g.body(ids[123]).readState();
        close(state.linearVelocity[0], 123 % 7, 1e-6, "Correct GPU slot");
        close(state.linearVelocity[1], 2, 1e-6, "Packed velocity");
        const first = await g.body(ids[0]).readState();
        close(
          dimension === 2 ? first.angularVelocity : first.angularVelocity[2],
          1,
          1e-6,
          "Angular velocity preserved",
        );
        const buffers = [g.velocityBatch.indices, g.velocityBatch.values];
        g.setLinearVelocities(ids, values);
        assert(
          g.velocityBatch.indices === buffers[0] &&
            g.velocityBatch.values === buffers[1],
          "Packed buffers reused",
        );
        let rejected = false;
        try {
          g.setLinearVelocities(
            [ids[0], ids[0]],
            new Float32Array(2 * dimension),
          );
        } catch {
          rejected = true;
        }
        assert(rejected, "Duplicate slots rejected to avoid write races");
        g.setLinearVelocities([], []);
      } finally {
        g.destroy();
      }
    });
    await test(`Native convenience: ${dimension}D bulk edits share one dispatch per batch`, async () => {
      const s = make({ gravity: 0 });
      const refs = [];
      for (let i = 0; i < 256; i++)
        refs.push(sphere(s, 0.25, { position: vec(i * 2, 5), mass: 2 }));
      const g = s.createSolver(device);
      try {
        g.editBodies(
          (function* () {
            for (const body of refs)
              yield { body, linearVelocity: vec(1, 0), impulse: vec(2, 0) };
          })(),
        );
        g.flushEdits();
        assert(
          g.bodyCommands.lastBatch.bodies === 256 &&
            g.bodyCommands.lastBatch.commands === 512,
          "Two commands per body share one upload/dispatch",
        );
        const state = await g.body(refs[123]).readState();
        close(state.linearVelocity[0], 2, 1e-5, "Bulk impulse applies");
        const buffers = [g.bodyCommands.commands, g.bodyCommands.ranges];
        g.editBodies([
          {
            body: g.body(refs[123]),
            linearVelocity: vec(4, 0),
            position: vec(1, 9),
            rotation: dimension === 2 ? 0.5 : [0, 0, 0, 1],
          },
        ]);
        close(
          (await g.body(refs[123]).readState()).position[1],
          9,
          1e-5,
          "Specific edit following bulk edit",
        );
        assert(
          g.bodyCommands.commands === buffers[0] &&
            g.bodyCommands.ranges === buffers[1],
          "Buffers persist between edits",
        );
        let rejected = false;
        try {
          g.editBodies([
            { body: refs[0], linearVelocity: vec(99, 0) },
            { body: refs[1], impulse: vec(NaN, 0) },
          ]);
        } catch {
          rejected = true;
        }
        assert(
          rejected && !g.bodyCommands.pending.size,
          "Invalid batch enqueues no partial edits",
        );
        close(
          (await g.body(refs[0]).readState()).linearVelocity[0],
          2,
          1e-5,
          "Earlier batch remains unchanged",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Native convenience: ${dimension}D object setters automatically pack and preserve ordering`, async () => {
      const s = make({ gravity: 0 });
      const refs = Array.from({ length: 129 }, (_, i) =>
        sphere(s, 0.25, { position: vec(i * 2, 5), mass: 2 }),
      );
      const g = s.createSolver(device);
      try {
        const target = g.body(refs[0]);
        target.setAngularVelocity(dimension === 2 ? 2 : [0, 0, 2]);
        const before = await g.readBodies();
        for (const ref of [...refs].reverse())
          g.body(ref).setLinearVelocity(vec(3, 4)).setLinearVelocity(vec(5, 6));
        const after = await g.readBodies();
        const batch = g.bodyCommands.lastBatch;
        assert(
          batch.path === "packed-velocities" &&
            batch.commands === 129 &&
            batch.requestedCommands === 258,
          "Setters automatically pack, redundant adjacent setters coalesce",
        );
        assert(
          batch.uploadedBytes === 129 * (dimension + 1) * 4,
          "Only indices and velocities upload",
        );
        const stride = dimension === 2 ? 24 : 40,
          velocity = dimension === 2 ? 12 : 32;
        for (let i = 0; i < g.bodyCount; i++)
          for (let k = 0; k < stride; k++) {
            const expected =
              k === velocity
                ? 5
                : k === velocity + 1
                  ? 6
                  : before[i * stride + k];
            close(
              after[i * stride + k],
              expected,
              1e-6,
              "Other body fields are preserved",
            );
          }
        const cpu = g.bodyCommands.queue.words,
          ids = g.bodyCommands.linearIndices,
          binding = g.velocityBatch.binding;
        for (const ref of [...refs].reverse())
          g.body(ref).setLinearVelocity(vec(5, 6));
        g.flushEdits();
        assert(
          g.bodyCommands.queue.words === cpu &&
            g.bodyCommands.linearIndices === ids &&
            g.velocityBatch.binding === binding,
          "CPU staging and GPU bindings are reused",
        );
        target.setLinearVelocity(vec(7, 0));
        let rejected = false;
        try {
          g.editBodies([
            { body: refs[1], impulse: vec(99, 0) },
            { body: refs[2], impulse: vec(NaN, 0) },
          ]);
        } catch {
          rejected = true;
        }
        assert(
          rejected,
          "Invalid bulk edit rejects atomically beside queued individual edits",
        );
        target
          .applyImpulse(vec(2, 0))
          .setLinearVelocity(vec(11, 0))
          .applyImpulse(vec(2, 0));
        close(
          (await target.readState()).linearVelocity[0],
          12,
          1e-6,
          "Setters do not move across impulses",
        );
        assert(
          g.bodyCommands.lastBatch.path === "ordered-commands",
          "Mixed edits keep the ordered path",
        );
        target.teleport(vec(1, 8)).teleport(vec(2, 9));
        const state = await target.readState();
        close(
          state.position[0],
          2,
          1e-6,
          "Repeated teleport preserves the final pose",
        );
        assert(
          g.bodyCommands.lastBatch.submissions === 1,
          "Teleport cleanup shares the edit submission",
        );
        close(
          (await g.body(refs[1]).readState()).linearVelocity[0],
          5,
          1e-6,
          "Rejected batch and shorter live bindings leave neighbors untouched",
        );
        g.editBodies(
          (function* () {
            yield { body: refs[6], linearVelocity: vec(13, 0) };
            g.editBodies([{ body: refs[7], linearVelocity: vec(17, 0) }]);
            yield { body: refs[8], linearVelocity: vec(19, 0) };
          })(),
        );
        close(
          (await g.body(refs[6]).readState()).linearVelocity[0],
          13,
          1e-6,
          "Nested generators do not overwrite outer staging",
        );
        close(
          (await g.body(refs[7]).readState()).linearVelocity[0],
          17,
          1e-6,
          "Nested edits retain their own values",
        );
        close(
          (await g.body(refs[8]).readState()).linearVelocity[0],
          19,
          1e-6,
          "Outer staging continues after a nested edit",
        );
        rejected = false;
        try {
          g.editBodies(
            (function* () {
              yield { body: refs[9], linearVelocity: vec(1, 0) };
              g.destroy();
            })(),
          );
        } catch {
          rejected = true;
        }
        assert(
          rejected,
          "Disposal during iteration rejects before uploading staged edits",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Native convenience: ${dimension}D ordered live edits and selected reads`, async () => {
      const s = make({ gravity: 0, timeStep: 1 / 60 });
      sphere(s, 0.5, { position: vec(20, 0), mass: 0 });
      const rigid = sphere(s, 0.5, { position: vec(-5, 0), mass: 2 });
      const g = s.createSolver(device);
      try {
        assert(
          !g.bodyCommands && !g.contactWatch,
          "Optional services must not allocate at startup",
        );
        const b = g.body(rigid),
          index = b.gpuIndex;
        assert(g.body(index) === b, "Handles are cached");
        b.setLinearVelocity(vec(9, 0))
          .applyImpulse(vec(2, 0))
          .setLinearVelocity(vec(3, 0));
        const first = await b.readState();
        close(first.linearVelocity[0], 3, 1e-5, "Submission order");
        const buffer = g.bodyCommands.commands;
        b.teleport(vec(7, 8)).setAngularVelocity(
          dimension === 2 ? 0 : [0, 0, 0],
        );
        b.applyImpulse(vec(0, 2), vec(8, 8));
        const state = await b.readState();
        close(state.position[0], 7, 1e-5, "Live teleport");
        close(state.position[1], 8, 1e-5, "Live teleport");
        close(state.linearVelocity[1], 1, 1e-5, "Mass-scaled impulse");
        const w =
          dimension === 2 ? state.angularVelocity : state.angularVelocity[2];
        assert(w > 1, "Off-centre impulse uses live centre");
        assert(
          g.bodyCommands.commands === buffer,
          "Upload storage reused for smaller batches",
        );
        b.setAngularVelocity(dimension === 2 ? 0 : [0, 0, 0])
          .setLinearVelocity(vec(0, 0))
          .applyForce(vec(120, 0));
        close(
          (await b.readState()).linearVelocity[0],
          1,
          1e-5,
          "Force lasts one dt",
        );
        const record = await g.readSelectedBodies([index]);
        assert(
          record.length === (dimension === 2 ? 24 : 40),
          "Only requested records downloaded",
        );
        const poses = await g.readSelectedBodies([index], { posesOnly: true });
        assert(
          poses.length === (dimension === 2 ? 4 : 8),
          "Compact pose format",
        );
        assert(
          (await g.readSelectedBodies([])).length === 0,
          "Empty selection",
        );
        let rejected = false;
        try {
          b.applyImpulse(vec(NaN, 0));
        } catch {
          rejected = true;
        }
        assert(rejected, "Invalid vectors rejected");
        const oldVelocity = (await b.readState()).linearVelocity[0];
        g.step();
        const next = await b.readState();
        close(
          next.linearVelocity[0],
          oldVelocity,
          1e-3,
          "Force is not repeated",
        );
      } finally {
        g.destroy();
      }
      let rejected = false;
      try {
        g.body(rigid).readState();
      } catch {
        rejected = true;
      }
      assert(rejected, "Destroyed handles rejected");
    });
    await test(`Native convenience: ${dimension}D sensors, masks, bounce and sleep handles`, async () => {
      const s = make({ gravity: 0 });
      const sensor = sphere(s, 1, {
        position: vec(0, 0),
        mass: 0,
        isTrigger: true,
        group: 1,
        collidesWith: 2,
      });
      const moving = sphere(s, 0.5, {
        position: vec(0.5, 0),
        mass: 1,
        group: 2,
        collidesWith: 1,
      });
      const g = s.createSolver(device);
      try {
        const b = g.body(moving),
          trigger = g.body(sensor);
        g.watchContacts({ indices: [trigger.gpuIndex] });
        g.step();
        let events = await g.readContactEvents();
        assert(
          events.events.some(
            (e) => e.type === "begin" && e.isTrigger && e.impulse === 0,
          ),
          "Non-solving overlap begins",
        );
        close(
          (await b.readState()).position[0],
          0.5,
          1e-4,
          "Sensor does not separate bodies",
        );
        trigger.teleport(vec(0.1, 0));
        b.teleport(vec(0.6, 0));
        g.step();
        close(
          (await b.readState()).position[0],
          0.6,
          1e-4,
          "Teleport preserves solving/sensor flags",
        );
        b.setCollisionGroups(4, 1);
        g.step();
        events = await g.readContactEvents();
        assert(
          events.events.some((e) => e.type === "end"),
          "Mutual masks end overlap",
        );
        b.setCollisionGroups(2, 1)
          .setRestitution(0.7)
          .setSleepEnabled(true)
          .wakeUp();
        trigger.setTrigger(false);
        g.step();
        const state = await b.readState();
        assert(
          state.position[0] > 0.6,
          "Trigger toggled back to a solving collider",
        );
        b.setSleepEnabled(false);
        g.disableSleeping();
        g.step();
        assert(
          Number.isFinite((await b.readState()).position[0]),
          "Sleep policy toggles remain usable",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Native convenience: ${dimension}D fixed stepping without downloads`, async () => {
      const s = make({ gravity: 0, timeStep: 1 / 60 });
      const rigid = sphere(s, 0.5, { velocity: vec(1, 0) }),
        g = s.createSolver(device);
      try {
        g.readBodies = () => {
          throw Error("Stepping must not download the world");
        };
        assert(g.advance(1 / 120) === 0, "Accumulate partial step");
        assert(g.advance(1 / 120) === 1, "Submit full fixed step");
        assert(
          g.advance(10, { maxSubSteps: 2, maxFrameTime: 1 }) === 2,
          "Bound catch-up",
        );
        close(
          (await g.body(rigid).readState()).position[0],
          3 / 60,
          1e-4,
          "Fixed-step distance",
        );
        assert(
          !g.contactWatch && !g.bodyCommands,
          "Ordinary stepping requires no optional passes",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Native convenience: ${dimension}D selected readbacks reuse buffers without sharing in-flight storage`, async () => {
      const s = make({ gravity: 0 });
      const refs = Array.from({ length: 16 }, (_, i) =>
        sphere(s, 0.25, { position: vec(i * 2, 5) }),
      );
      const g = s.createSolver(device);
      try {
        const ids = refs.map((r) => g.bodyIndex(r));
        const fullStride = dimension === 2 ? 24 : 40,
          poseStride = dimension === 2 ? 4 : 8;
        const [compact, full, single] = await Promise.all([
          g.readSelectedBodies([ids[3], ids[1]], { posesOnly: true }),
          g.readSelectedBodies([ids[2], ids[5], ids[0]]),
          g.readSelectedBodies([ids[7]], { posesOnly: true }),
        ]);
        assert(
          compact.length === 2 * poseStride &&
            full.length === 3 * fullStride &&
            single.length === poseStride,
          "Concurrent selections have exact independent lengths",
        );
        close(compact[0], 6, 1e-6, "Compact selection order");
        close(compact[poseStride], 2, 1e-6, "Second compact selection");
        close(full[fullStride], 10, 1e-6, "Full selection order");
        close(single[0], 14, 1e-6, "Separate in-flight staging");
        const buffers = g.bodyReadback.idle.map((j) => j.selected);
        const shorter = await g.readSelectedBodies([ids[4]], {
          posesOnly: true,
        });
        assert(
          shorter.length === poseStride,
          "Reused larger storage binds only the live selection",
        );
        close(shorter[0], 8, 1e-6, "Shorter selection value");
        assert(
          g.bodyReadback.idle.some((j) => buffers.includes(j.selected)) &&
            g.bodyReadback.idle.length <= 2,
          "Idle buffer reuse is bounded",
        );
        close(
          compact[0],
          6,
          1e-6,
          "Previously returned arrays retain their own contents",
        );
      } finally {
        g.destroy();
      }
      assert(
        g.bodyReadback.destroyed && g.bodyReadback.jobs.size === 0,
        "Solver disposal releases the readback pool",
      );
    });
    await test(`Native convenience: ${dimension}D attachment steps and disposes`, async () => {
      const s = make({ gravity: 0 });
      sphere(s, 0.5);
      const g = s.createSolver(device);
      const observable = () => ({
        callbacks: new Set(),
        add(fn) {
          this.callbacks.add(fn);
          return fn;
        },
        addOnce(fn) {
          return this.add(fn);
        },
        remove(fn) {
          this.callbacks.delete(fn);
        },
        notify() {
          for (const fn of [...this.callbacks]) fn();
        },
      });
      const scene = {
        getEngine: () => ({ getDeltaTime: () => 1000 / 60 }),
        onBeforeRenderObservable: observable(),
        onDisposeObservable: observable(),
      };
      try {
        g.attachToScene(scene);
        scene.onBeforeRenderObservable.notify();
        const p = await g.readBodies();
        assert(p.every(Number.isFinite), "Attached stepping remains finite");
        g.detachFromScene();
        assert(
          !scene.onBeforeRenderObservable.callbacks.size &&
            !scene.onDisposeObservable.callbacks.size,
          "Detach removes both observers",
        );
        g.attachToScene(scene);
        scene.onDisposeObservable.notify();
        assert(g.destroyed, "Scene disposal releases GPU solver");
      } finally {
        g.destroy();
      }
    });
  }
  await test("Native convenience: 3D rotation, query after teleport and warm-start invalidation", async () => {
    const s = new AvbdScene3D({ gravity: 0 });
    s.addBox([8, 1, 8], { mass: 0, position: [0, -0.5, 0] });
    const rigid = s.addBox([1, 1, 1], { position: [0, 0.49, 0] }),
      g = s.createSolver(device);
    try {
      g.step();
      await g.readCounters();
      const b = g.body(rigid);
      b.teleport([4, 5, 0], [0, 0, 0, 2]);
      const hit = await g.raycast([4, 8, 0], [0, -1, 0]);
      assert(
        hit?.index === b.gpuIndex,
        "Queries flush edits and see live poses",
      );
      const state = await b.readState();
      close(state.rotation[3], 1, 1e-6, "Quaternion normalized");
      const contacts = await g.readContactList();
      // The old pair loses its contact count, preventing stale friction forces after teleport.
      assert(contacts.length === 0, "Old warm-start manifold invalidated");
      g.step();
      const after = await b.readState();
      close(after.position[1], 5, 1e-3, "No old ground force");
      const replacement = Object.assign(
        Object.create(Object.getPrototypeOf(rigid)),
        rigid,
        {
          mass: rigid.mass * 2,
          moment: rigid.moment.map((v) => v * 2),
        },
      );
      g.rewriteBodies([b.gpuIndex], [replacement]);
      const replaced = await b.readState();
      close(
        replaced.mass,
        replacement.mass,
        1e-6,
        "Existing handles report the replacement body's real mass",
      );
    } finally {
      g.destroy();
    }
  });
}
