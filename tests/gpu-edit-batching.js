import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import {
  JOINT_FLOATS,
  J_PARAM,
  J_FMIN,
  J_FMAX,
} from "../reference/three-avbd/src/avbd2d/gpu/layout.ts";
import { assert, close } from "./helpers/gpu.js";

export async function editBatchingGpuTests(device, test) {
  for (const dimension of [2, 3]) {
    const vec = (x, y, z = 0) => (dimension === 2 ? [x, y] : [x, y, z]);
    const angular = (v) => (dimension === 2 ? v : [0, 0, v]);
    const make = () =>
      dimension === 2
        ? new AvbdScene2D({ gravity: 0 })
        : new AvbdScene3D({ gravity: 0 });
    await test(`Batched edits: ${dimension}D pooled queries keep concurrent and shorter reads independent`, async () => {
      const scene = make();
      const refs = Array.from({ length: 4 }, (_, i) =>
        scene.addBox(vec(0.5, 0.5, 0.5), { position: vec(i * 3, 5) }),
      );
      const g = scene.createSolver(device);
      try {
        const rays = [
          { origin: vec(0, 8), direction: vec(0, -1) },
          { origin: vec(3, 8), direction: vec(0, -1) },
        ];
        const first = await g.raycastAll(rays, {
          ignore: [g.bodyIndex(refs[3])],
        });
        const job = g.shapeQueries.idle[0],
          buffer = job.queryBuffer,
          group = job.group;
        await g.raycastAll(rays, { ignore: [g.bodyIndex(refs[3])] });
        assert(
          g.shapeQueries.idle[0].queryBuffer === buffer &&
            g.shapeQueries.idle[0].group === group,
          "Query buffers and bindings persist",
        );
        const results = await Promise.all(
          [0, 1, 2].map((i) => g.raycast(vec(i * 3, 8), vec(0, -1))),
        );
        for (let i = 0; i < 3; i++)
          assert(
            results[i]?.index === g.bodyIndex(refs[i]),
            "Concurrent queries own their mapped data",
          );
        assert(
          g.shapeQueries.idle.length === 2 && g.shapeQueries.jobs.size === 2,
          "Query pool retains at most two jobs",
        );
        const short = await g.raycastAll([rays[1]]);
        assert(
          short.length === 1 && short[0].index === g.bodyIndex(refs[1]),
          "Smaller batches reset state and return only live results",
        );
        close(
          first[0].point[0],
          0,
          1e-6,
          "Earlier query results remain owned by the caller",
        );
        const pending = g.raycastAll(rays);
        g.destroy();
        await Promise.allSettled([pending]);
        assert(
          !g.shapeQueries.jobs.size && !g.shapeQueries.idle.length,
          "Disposal frees idle and pending jobs",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Batched edits: ${dimension}D pass uniforms cache and invalidate for live settings`, async () => {
      const scene = make();
      scene.addBox(vec(0.5, 0.5, 0.5), { position: vec(0, 5) });
      const g = scene.createSolver(device);
      try {
        g.step();
        const uploads = g.passConstantCache.uploads,
          data = g.passConstantCache.data;
        g.step();
        assert(
          g.passConstantCache.uploads === uploads,
          "Stable steps do not reupload constant uniforms",
        );
        g.params.alpha = 0.4;
        g.step();
        assert(
          g.passConstantCache.uploads === uploads + 1,
          "Alpha edits invalidate the cache",
        );
        g.params.iterations += 1;
        g.step();
        assert(
          g.passConstantCache.uploads === uploads + 2,
          "Iteration edits invalidate the cache",
        );
        g.colorCap += 1;
        g.step();
        assert(
          g.passConstantCache.uploads === uploads + 3,
          "Color budget edits invalidate the cache",
        );
        if (dimension === 2) {
          g.params.postStabilize = true;
          g.step();
          assert(
            g.passConstantCache.uploads === uploads + 4,
            "Post stabilization has separate iteration constants",
          );
        }
        assert(
          (await g.readBodies()).every(Number.isFinite),
          "Cached uniforms retain valid physics",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Batched edits: ${dimension}D mixed velocity masks preserve every other word`, async () => {
      const scene = make(),
        refs = Array.from({ length: 129 }, (_, i) =>
          scene.addBox(vec(0.5, 0.5, 0.5), { position: vec(i * 3, 5) }),
        );
      const g = scene.createSolver(device);
      try {
        const before = await g.readBodies(),
          stride = dimension === 2 ? 24 : 40,
          vo = dimension === 2 ? 12 : 32;
        for (let i = 0; i < refs.length; i++) {
          const b = g.body(refs[i]);
          if (i % 3 !== 0) b.setLinearVelocity(vec(2, 3, 4));
          if (i % 3 !== 1)
            b.setAngularVelocity(angular(5)).setAngularVelocity(angular(7));
        }
        const after = await g.readBodies();
        assert(
          g.bodyCommands.lastBatch.path === "packed-motion",
          "Combined setters select the compact path",
        );
        assert(
          g.bodyCommands.lastBatch.uploadedBytes ===
            129 * (dimension === 2 ? 20 : 32),
          "Upload contains only velocity fields and masks",
        );
        for (let i = 0; i < refs.length; i++) {
          const index = g.bodyIndex(refs[i]);
          for (let k = 0; k < stride; k++) {
            let expected = before[index * stride + k];
            if (i % 3 !== 0 && k >= vo && k < vo + dimension)
              expected = [2, 3, 4][k - vo];
            const ao = dimension === 2 ? 14 : 36;
            if (i % 3 !== 1 && k >= ao && k < ao + (dimension === 2 ? 1 : 3))
              expected = dimension === 2 ? 7 : [0, 0, 7][k - ao];
            close(
              after[index * stride + k],
              expected,
              1e-6,
              "Only selected velocity components change",
            );
          }
        }
        const ids = Uint32Array.from({ length: 129 }, (_, i) => i),
          linear = new Float32Array(129 * dimension).fill(1),
          a = new Float32Array(129 * (dimension === 2 ? 1 : 3)).fill(2);
        g.setVelocities(ids, { linear, angular: a });
        const storage = g.motionBatch.buffer,
          binding = g.motionBatch.binding;
        g.setVelocities(ids, { linear, angular: a });
        assert(
          g.motionBatch.buffer === storage && g.motionBatch.binding === binding,
          "Packed motion storage and bindings are reused",
        );
        g.setAngularVelocities(
          ids.subarray(0, 1),
          dimension === 2 ? [9] : [0, 0, 9],
        );
        assert(
          g.angularVelocityBatch.lastBatch.uploadedBytes ===
            (dimension === 2 ? 8 : 16),
          "Spin-only arrays upload only indices and angular components",
        );
        const state = await g.body(0).readState();
        close(
          state.linearVelocity[0],
          1,
          1e-6,
          "Angular-only array update preserves linear velocity",
        );
        close(
          dimension === 2 ? state.angularVelocity : state.angularVelocity[2],
          9,
          1e-6,
          "Shorter live binding applies angular velocity",
        );
        g.body(0).setAngularVelocity(angular(3));
        g.flushEdits();
        assert(
          g.bodyCommands.lastBatch.path === "packed-angular-velocities" &&
            g.bodyCommands.lastBatch.uploadedBytes ===
              (dimension === 2 ? 8 : 16),
          "Spin-only object calls use the smallest upload",
        );
        let rejected = false;
        try {
          g.setVelocities([0, 0], {
            angular: new Float32Array(dimension === 2 ? 2 : 6),
          });
        } catch {
          rejected = true;
        }
        assert(rejected, "Duplicate motion slots reject before mutation");
      } finally {
        g.destroy();
      }
    });
    await test(`Batched edits: ${dimension}D properties, waking, bounce and solving share one submission`, async () => {
      const scene = make(),
        refs = Array.from({ length: 96 }, (_, i) =>
          scene.addBox(vec(0.5, 0.5, 0.5), { position: vec(i * 3, 5) }),
        );
      const g = scene.createSolver(device, { sleeping: true });
      try {
        g.editBodies(
          refs.map((body) => ({
            body,
            isTrigger: true,
            restitution: 0.25,
            group: 2,
            collidesWith: 2,
            allowSleep: false,
            linearVelocity: vec(1, 0),
            angularVelocity: angular(0.5),
          })),
        );
        const queue = device.queue,
          submit = queue.submit;
        let submissions = 0;
        queue.submit = function (...args) {
          submissions++;
          return submit.apply(this, args);
        };
        try {
          g.step();
        } finally {
          queue.submit = submit;
        }
        assert(
          submissions === 1,
          `Expected one physics submission, received ${submissions}`,
        );
        assert(
          g.bodyCommands.lastBatch.submissions === 0,
          "Edits belong to the step encoder",
        );
        assert(!g.propertyEdits.pending, "Step flushes all properties");
        const state = await g.body(refs[30]).readState();
        close(
          state.linearVelocity[0],
          1,
          5e-4,
          "Velocity reaches the same step",
        );
        assert(!state.sleeping, "Excluded body remains awake");
        assert(
          g.restitution.active.size === 96,
          "All bounce settings retained",
        );
        g.editBodies(
          refs.map((body) => ({
            body,
            isTrigger: false,
            restitution: 0,
            group: 1,
            collidesWith: 1,
          })),
        );
        g.flushEdits();
        assert(
          g.restitution.active.size === 0,
          "Zero restitution turns off bounce work",
        );
        assert(
          g.propertyEdits.lastBatch.writes <= 3,
          "Three target buffers use at most three uploads",
        );
        const hit = await g.raycast(vec(3, 8), vec(0, -1), {
          group: 1,
          collidesWith: 1,
          includeTriggers: false,
        });
        assert(
          hit,
          "Queries see changed masks and trigger flags without stepping",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Batched edits: ${dimension}D property validation is atomic and queries flush sparse changes`, async () => {
      const scene = make(),
        refs = Array.from({ length: 32 }, (_, i) =>
          scene.addBox(vec(0.5, 0.5, 0.5), { position: vec(i * 3, 5) }),
        );
      const g = scene.createSolver(device);
      try {
        let rejected = false;
        try {
          g.editBodies([
            { body: refs[0], isTrigger: true, linearVelocity: vec(99, 0) },
            { body: refs[1], restitution: 2 },
          ]);
        } catch {
          rejected = true;
        }
        assert(
          rejected &&
            !g.bodyCommands?.pending.size &&
            !g.propertyEdits?.pending,
          "Invalid properties enqueue no changes",
        );
        for (let i = 0; i < refs.length; i += 2)
          g.body(refs[i]).setTrigger(true).setCollisionGroups(4, 4);
        const hit = await g.raycast(vec(0, 8), vec(0, -1), {
          group: 4,
          collidesWith: 4,
          includeTriggers: false,
        });
        assert(!hit, "Trigger exclusion sees sparse edits before any step");
        assert(
          g.propertyEdits.lastBatch.dispatches === 2,
          "Sparse targets use one dispatch each",
        );
        const visible = await g.raycast(vec(0, 8), vec(0, -1), {
          group: 4,
          collidesWith: 4,
          includeTriggers: true,
        });
        assert(
          visible?.index === g.bodyIndex(refs[0]),
          "Including triggers returns the updated collider",
        );
        g.body(refs[0]).setTrigger(false).setTrigger(true).setTrigger(false);
        assert(
          await g.raycast(vec(0, 8), vec(0, -1), {
            group: 4,
            collidesWith: 4,
            includeTriggers: false,
          }),
          "Last replacement wins",
        );
      } finally {
        g.destroy();
      }
    });
    await test(`Batched edits: ${dimension}D motor patches preserve warm starts and dispose safely`, async () => {
      const scene = make(),
        refs = Array.from({ length: 16 }, (_, i) =>
          scene.addBox(vec(0.5, 0.5, 0.5), { position: vec(i * 3, 5) }),
        );
      const motors = refs.map((b) =>
        scene.addMotor(dimension === 2 ? -1 : null, b, {
          speed: 1,
          maxTorque: 1,
        }),
      );
      const g = scene.createSolver(device);
      try {
        const before = await g.readJoints();
        for (const m of motors) g.setMotor(m.slot, { speed: 3, maxTorque: 7 });
        const after = await g.readJoints(),
          stride = dimension === 2 ? JOINT_FLOATS : 32;
        assert(
          g.propertyEdits.lastBatch.dispatches === 1,
          "Motor targets share one sparse upload",
        );
        for (let slot = 0; slot < motors.length; slot++)
          for (let k = 0; k < stride; k++) {
            // 2D layout offsets are imported in the dedicated motor tests; only the
            // edited words may differ here, while the solver-owned prefix stays exact.
            if (k < 8)
              close(
                after[slot * stride + k],
                before[slot * stride + k],
                0,
                "Warm starts are not overwritten",
              );
          }
        if (dimension === 2)
          for (const m of motors) {
            close(
              after[m.slot * JOINT_FLOATS + J_PARAM],
              3,
              1e-6,
              "Motor speed",
            );
            close(
              after[m.slot * JOINT_FLOATS + J_FMIN],
              -7,
              1e-6,
              "Lower torque bound",
            );
            close(
              after[m.slot * JOINT_FLOATS + J_FMAX],
              7,
              1e-6,
              "Upper torque bound",
            );
          }
        if (dimension === 3)
          for (const m of motors) {
            close(after[m.slot * 32 + 27], 3, 1e-6, "Motor speed");
            close(after[m.slot * 32 + 31], 7, 1e-6, "Torque bound");
          }
        g.setMotor(motors[0].slot, { speed: 99 });
        motors[0].dispose();
        assert(
          !g.propertyEdits.pending,
          "Removing constraints flushes their earlier edits",
        );
        g.step();
        assert(
          (await g.readBodies()).every(Number.isFinite),
          "No stale patch resurrects a removed motor",
        );
      } finally {
        g.destroy();
      }
    });
  }
  await test("Batched edits: 3D rest-frame capture reuses uploads and observes queued teleports", async () => {
    const scene = new AvbdScene3D({ gravity: 0 });
    const a = scene.addBox([1, 1, 1], { position: [0, 5, 0] }),
      b = scene.addBox([1, 1, 1], { position: [2, 5, 0] });
    const weld = scene.addJoint(a, b, [0, 0, 0], [0, 0, 0], {
      angularStiffness: Infinity,
    });
    const g = scene.createSolver(device);
    try {
      g.captureConstraintFrames([{ slot: weld.slot }]);
      const buffer = g.captureUploads.frame.buffer,
        group = g.captureUploads.frame.group;
      g.body(b).teleport([2, 5, 0], [0, 0, Math.sin(0.25), Math.cos(0.25)]);
      g.captureConstraintFrames([{ slot: weld.slot }]);
      assert(
        g.captureUploads.frame.buffer === buffer &&
          g.captureUploads.frame.group === group,
        "Frame upload and binding are reused",
      );
      const rows = await g.readJoints();
      close(
        rows[weld.slot * 32 + 27],
        Math.sin(0.25),
        1e-6,
        "Rest orientation sees queued GPU rotation",
      );
      close(
        rows[weld.slot * 32 + 31],
        Math.cos(0.25),
        1e-6,
        "Rest orientation remains normalized",
      );
    } finally {
      g.destroy();
    }
  });
}
