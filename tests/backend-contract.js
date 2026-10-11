import {
  AvbdScene2D,
  AvbdScene3D,
  createSolverPipeline as createPublishedSolverPipeline,
} from "../src/index.js";
import { createExperimentalWebglPipeline } from "../src/webgl/pipeline.js";

const createSolverPipeline = ({ backend, ...options } = {}) =>
  backend === "webgl2"
    ? createExperimentalWebglPipeline(options)
    : createPublishedSolverPipeline({ backend, ...options });

const check = (condition, message) => {
  if (!condition) throw Error(message);
};
const close = (a, b, tolerance = 1e-5) =>
  check(Math.abs(a - b) <= tolerance, `${a} differs from ${b}`);
export async function checkCpuEventCapacity(dimension) {
  const pipeline = await createSolverPipeline({ backend: "cpu" });
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: 0 })
      : new AvbdScene2D({ gravity: 0 });
  const size = dimension === 3 ? [1, 1, 1] : [1, 1];
  const center = dimension === 3 ? [0, 0, 0] : [0, 0];
  const sensor = scene.addBox(size, { position: center, isTrigger: true });
  scene.addBox(size, {
    position: dimension === 3 ? [-0.5, 0, 0] : [-0.5, 0],
    density: 0,
  });
  scene.addBox(size, {
    position: dimension === 3 ? [0.5, 0, 0] : [0.5, 0],
    density: 0,
  });
  const world = scene.createSolver(pipeline);
  try {
    world.watchContacts({
      indices: [world.body(sensor).gpuIndex],
      maxPairs: 1,
      maxEvents: 1,
    });
    world.step();
    const first = await world.readContactEvents();
    check(
      first.full && first.events.length === 1,
      "CPU event pair capacity was not reported",
    );
    world.step();
    const ongoing = await world.readContactEvents();
    check(
      ongoing.full && ongoing.events.length === 0,
      "A full CPU event table churned existing contacts",
    );
    world.watchContacts({ maxPairs: 16, maxEvents: 16 });
    world.step();
    const grown = await world.readContactEvents();
    check(
      !grown.full && grown.events.length === 1,
      "Growing CPU event capacity did not admit the new contact",
    );
    world.body(sensor).teleport(dimension === 3 ? [5, 0, 0] : [5, 0]);
    world.step();
    const ended = await world.readContactEvents();
    check(
      ended.events.length === 2 && ended.events.every((e) => e.type === "end"),
      "CPU sensor contacts did not end",
    );
    return { backend: "cpu", dimension, boundedEvents: true, passed: true };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}
export async function checkBackend(backend, dimension) {
  const pipeline = await createSolverPipeline({
    backend,
    validate3D: false,
    preferredLimits: {
      maxStorageBuffersPerShaderStage: 10,
      maxStorageBufferBindingSize: 268435456,
      maxBufferSize: 268435456,
    },
  });
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: 0 })
      : new AvbdScene2D({ gravity: 0 });
  const zero = dimension === 3 ? [0, 0, 0] : [0, 0],
    size = dimension === 3 ? [1, 1, 1] : [1, 1];
  const ball = scene.addBox(size, { position: zero });
  const world = scene.createSolver(pipeline, {
    spatialSort: false,
    bodyCapacity: 64,
  });
  try {
    const handle = world.body(ball),
      id = handle.gpuIndex;
    check(world.backend === backend, "Backend selection was lost");
    handle
      .teleport(dimension === 3 ? [2, 3, 4] : [2, 3])
      .setLinearVelocity(dimension === 3 ? [1, 2, 3] : [1, 2])
      .applyImpulse(dimension === 3 ? [1, 0, 0] : [1, 0]);
    let state = await handle.readState();
    close(state.position[0], 2);
    close(state.linearVelocity[0], 2);
    // Whole-batch validation must reject without partially applying a valid edit.
    let rejected = false;
    try {
      world.editBodies([
        { body: ball, linearVelocity: dimension === 3 ? [99, 0, 0] : [99, 0] },
        { body: ball, impulse: dimension === 3 ? [NaN, 0, 0] : [NaN, 0] },
      ]);
    } catch {
      rejected = true;
    }
    check(rejected, "Nonfinite batch accepted");
    state = await handle.readState();
    close(state.linearVelocity[0], 2);
    world.setVelocities([id], {
      linear: dimension === 3 ? [0, 0, 0] : [0, 0],
      angular: dimension === 3 ? [0, 0, 0] : [0],
    });
    handle.applyImpulse(
      dimension === 3 ? [1, 0, 0] : [1, 0],
      dimension === 3 ? [2, 4, 4] : [2, 4],
    );
    state = await handle.readState();
    close(state.linearVelocity[0], 1);
    check(
      dimension === 3
        ? state.angularVelocity[2] < 0
        : state.angularVelocity < 0,
      "Off-centre impulse did not rotate the body",
    );
    handle.setCollisionGroups(4, 4).setTrigger(true).setRestitution(0.6);
    const ray = await world.raycast(
      dimension === 3 ? [-2, 3, 4] : [-2, 3],
      dimension === 3 ? [1, 0, 0] : [1, 0],
      { maxDistance: 10, collidesWith: 4, includeTriggers: true },
    );
    check(ray?.index === id, "Query did not hit the actual body");
    close(ray.distance, 3.5, 1e-4);
    const miss = await world.raycast(
      dimension === 3 ? [-2, 3, 4] : [-2, 3],
      dimension === 3 ? [1, 0, 0] : [1, 0],
      { maxDistance: 10, collidesWith: 2 },
    );
    check(miss === null, "Query ignored its mask");
    const selected = await world.readSelectedBodies([id], { posesOnly: true });
    check(
      selected.length === (dimension === 3 ? 8 : 4),
      "Pose stride changed across backends",
    );
    handle.setTrigger(false).setSleepEnabled(true).setSleepEnabled(false);
    world.disableSleeping();
    handle
      .teleport(zero)
      .setLinearVelocity(dimension === 3 ? [1, 0, 0] : [1, 0])
      .setAngularVelocity(dimension === 3 ? [0, 0, 0] : 0);
    check(
      world.advance(world.params.dt, { maxFrameTime: 1 }) === 1,
      "Fixed-step API differs",
    );
    state = await handle.readState();
    close(state.position[0], world.params.dt, 0.001);
    let frame,
      disposed,
      after = 0;
    const binding = {
      getEngine: () => ({ getDeltaTime: () => world.params.dt * 1000 }),
      onBeforeRenderObservable: {
        add: (callback) => (frame = callback),
        remove: (observer) => {
          check(observer === frame, "Wrong frame observer removed");
          frame = null;
        },
      },
      onDisposeObservable: {
        addOnce: (callback) => (disposed = callback),
        remove: (observer) => {
          check(observer === disposed, "Wrong disposal observer removed");
          disposed = null;
        },
      },
    };
    world.attachToScene(binding, {
      afterStep: (solver) => {
        check(solver === world, "afterStep received a different world");
        after++;
      },
    });
    frame();
    check(after === 1, "Automatic scene stepping differs");
    world.detachFromScene();
    check(
      frame === null && disposed === null,
      "Scene observers were not removed",
    );
    let wrongWorld = false;
    const otherScene = dimension === 3 ? new AvbdScene3D() : new AvbdScene2D();
    otherScene.addBox(size);
    const other = otherScene.createSolver(pipeline, { spatialSort: false });
    try {
      other.editBodies([{ body: handle, position: zero }]);
    } catch {
      wrongWorld = true;
    }
    check(wrongWorld, "Accepted a handle from another world");
    other.destroy();
    return { backend, dimension, passed: true };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
    let rejected = false;
    try {
      world.step();
    } catch {
      rejected = true;
    }
    check(rejected, "Destroyed world can still step");
  }
}

export async function checkFloor(backend, dimension) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const scene =
    dimension === 3
      ? new AvbdScene3D({ iterations: 10 })
      : new AvbdScene2D({ iterations: 10 });
  scene.addBox(dimension === 3 ? [10, 1, 10] : [10, 1], {
    density: 0,
    position: dimension === 3 ? [0, -0.5, 0] : [0, -0.5],
  });
  const ball =
    dimension === 3
      ? scene.addSphere(0.5, { position: [0, 2, 0] })
      : scene.addCircle(0.5, { position: [0, 2] });
  const world = scene.createSolver(pipeline, { spatialSort: false });
  try {
    for (let i = 0; i < 180; i++) world.step();
    const state = await world.body(ball).readState();
    check(state.position.every(Number.isFinite), "Nonfinite floor state");
    check(
      state.position[1] > 0.35 && state.position[1] < 0.7,
      `Floor failed: ${state.position[1]}`,
    );
    return { backend, dimension, floorHeight: state.position[1], passed: true };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkConstraints(backend, dimension) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: 0 })
      : new AvbdScene2D({ gravity: 0 });
  const p = dimension === 3 ? [0, 0, 0] : [0, 0],
    size = dimension === 3 ? [1, 1, 1] : [1, 1];
  const a = scene.addBox(size, { position: p });
  const removed =
    dimension === 3
      ? scene.addJoint(null, a, p, p)
      : scene.addJoint(-1, a, p, p);
  const motor =
    dimension === 3
      ? scene.addMotor(null, a, {
          axisA: [0, 0, 1],
          axisB: [0, 0, 1],
          speed: 1,
          maxTorque: 10,
        })
      : scene.addMotor(-1, a, { speed: 1, maxTorque: 10 });
  const world = scene.createSolver(pipeline, {
    spatialSort: false,
    bodyCapacity: 64,
  });
  try {
    const slot = motor.slot;
    removed.dispose();
    for (let i = 0; i < 4; i++) world.step();
    check(motor.slot === slot, "Constraint slots moved after release");
    const before = await world.body(a).readState();
    const firstSpeed =
      dimension === 3 ? before.angularVelocity[2] : before.angularVelocity;
    world.setMotor(slot, { speed: -1, maxTorque: 10 });
    for (let i = 0; i < 12; i++) world.step();
    const state = await world.body(a).readState(),
      lastSpeed =
        dimension === 3 ? state.angularVelocity[2] : state.angularVelocity;
    check(
      firstSpeed * lastSpeed < 0,
      `Reversing the motor did not reverse rotation: ${firstSpeed}, ${lastSpeed}`,
    );
    const joints = await world.readJoints();
    check(
      joints.length >= world.jointCount * (dimension === 3 ? 32 : 36),
      "Joint record stride differs",
    );
    if (dimension === 2) {
      const id = world.addCircle(0.25, { position: [3, 1] });
      world.body(id).applyImpulse([1, 0]);
      check(
        (await world.body(id).readState()).linearVelocity[0] > 0,
        "Runtime-added body is not editable",
      );
    }
    return { backend, dimension, constraintSlots: true, passed: true };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkContacts(backend, dimension) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const v = (x, y) => (dimension === 3 ? [x, y, 0] : [x, y]);
  const size = (x, y) => (dimension === 3 ? [x, y, 4] : [x, y]);
  try {
    const scene =
      dimension === 3
        ? new AvbdScene3D({ gravity: 0 })
        : new AvbdScene2D({ gravity: 0 });
    scene.addBox(size(10, 1), { density: 0, position: v(0, -0.5) });
    const ball =
      dimension === 3
        ? scene.addSphere(0.5, {
            position: v(0, 0.51),
            velocity: v(0, -3),
            restitution: 1,
          })
        : scene.addCircle(0.5, {
            position: v(0, 0.51),
            velocity: [0, -3, 0],
            restitution: 1,
          });
    const world = scene.createSolver(pipeline, { spatialSort: false });
    world.watchContacts();
    for (let i = 0; i < 12; i++) world.step();
    const state = await world.body(ball).readState();
    check(
      state.linearVelocity[1] > 2,
      `Restitution failed: ${state.linearVelocity[1]}`,
    );
    const collisions = await world.readContactEvents();
    check(
      collisions.events.some(
        (e) => e.type === "begin" && !e.isTrigger && e.impulse > 0,
      ),
      "Physical contact did not report its impulse",
    );
    world.destroy();

    const sensors =
      dimension === 3
        ? new AvbdScene3D({ gravity: 0 })
        : new AvbdScene2D({ gravity: 0 });
    const sensor = sensors.addBox(size(2, 2), {
      density: 0,
      isTrigger: true,
      position: v(0, 0),
      group: 2,
      collidesWith: 4,
    });
    const moving = sensors.addBox(
      dimension === 3 ? [0.5, 0.5, 0.5] : [0.5, 0.5],
      { position: v(0, 0), group: 4, collidesWith: 2 },
    );
    const overlaps = sensors.createSolver(pipeline, { spatialSort: false });
    const body = overlaps.body(moving);
    overlaps.watchContacts({ indices: [overlaps.body(sensor).gpuIndex] });
    overlaps.step();
    const begin = await overlaps.readContactEvents();
    check(
      begin.events.some(
        (e) => e.type === "begin" && e.isTrigger && e.impulse === 0,
      ),
      "Trigger begin missing",
    );
    const still = await body.readState();
    close(still.position[0], 0);
    close(still.position[1], 0);
    body.setCollisionGroups(4, 0);
    overlaps.step();
    const end = await overlaps.readContactEvents();
    check(
      end.events.some((e) => e.type === "end" && e.isTrigger),
      "Changing the mask did not end the overlap",
    );
    body.setCollisionGroups(4, 2);
    overlaps.step();
    check(
      (await overlaps.readContactEvents()).events.some(
        (e) => e.type === "begin",
      ),
      "Restoring the mask did not start the overlap",
    );
    body.teleport(v(5, 0));
    overlaps.step();
    check(
      (await overlaps.readContactEvents()).events.some((e) => e.type === "end"),
      "Teleporting out did not end the overlap",
    );
    overlaps.destroy();
    return {
      backend,
      dimension,
      restitution: true,
      triggers: true,
      masking: true,
      passed: true,
    };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkSleeping(backend, dimension) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const scene = dimension === 3 ? new AvbdScene3D() : new AvbdScene2D();
  const v = (x, y) => (dimension === 3 ? [x, y, 0] : [x, y]);
  scene.addBox(dimension === 3 ? [10, 1, 10] : [10, 1], {
    density: 0,
    position: v(0, -0.5),
  });
  const box = scene.addBox(dimension === 3 ? [1, 1, 1] : [1, 1], {
    position: v(0, 0.5),
    allowSleep: true,
  });
  const world = scene.createSolver(pipeline, { spatialSort: false });
  try {
    for (let i = 0; i < 180; i++) world.step();
    const body = world.body(box),
      state = await body.readState();
    check(state.sleeping, "Supported body did not sleep");
    body.applyImpulse(v(1, 2));
    world.step();
    const awake = await body.readState();
    check(
      !awake.sleeping && awake.linearVelocity[1] > 1,
      "Impulse did not wake and move the body",
    );
    return { backend, dimension, sleeping: true, waking: true, passed: true };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkConstraintFrames(backend) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const scene = new AvbdScene3D({ gravity: 0 });
  const fixed = scene.addBox([1, 1, 1], { position: [3, 0, 0] });
  const weld = scene.addJoint(null, fixed, [3, 0, 0], [0, 0, 0], {
    angularStiffness: Infinity,
  });
  const anchor = scene.addBox([1, 1, 1], { position: [8, 0, 0], density: 0 });
  const end = scene.addBox([1, 1, 1], { position: [9, 0, 0] });
  const spring = scene.addSpring(anchor, end, [0, 0, 0], [0, 0, 0], {
    rest: 1,
  });
  const world = scene.createSolver(pipeline, { spatialSort: false });
  try {
    const rotation = [0, 0, Math.SQRT1_2, Math.SQRT1_2];
    world.editBodies([
      { body: fixed, position: [3, 0, 0], rotation },
      { body: end, position: [10, 0, 0] },
    ]);
    world.captureConstraintFrames([
      { slot: weld.slot },
      { slot: spring.slot, spring: true },
    ]);
    for (let i = 0; i < 30; i++) world.step();
    const pose = await world.body(fixed).readState();
    check(
      Math.abs(pose.rotation.reduce((s, v, i) => s + v * rotation[i], 0)) >
        0.999,
      "Weld capture did not use the edited live rotation",
    );
    close((await world.body(end).readState()).position[0], 10, 0.001);
    return { backend, dimension: 3, liveConstraintFrames: true, passed: true };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkForces(backend, dimension) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: 0 })
      : new AvbdScene2D({ gravity: 0 });
  const v = (x, y) => (dimension === 3 ? [x, y, 0] : [x, y]);
  const body = scene.addBox(dimension === 3 ? [1, 1, 1] : [1, 1]);
  const world = pipeline.createSolver(scene, { spatialSort: false });
  try {
    const handle = world.body(body),
      dt = world.params.dt;
    // Same ordered command path for individual calls and bulk edits.
    handle.applyForce(v(60, 0), v(0, 1));
    let state = await handle.readState();
    close(state.linearVelocity[0], 60 * dt, 1e-4);
    const firstSpin =
      dimension === 3 ? state.angularVelocity[2] : state.angularVelocity;
    check(firstSpin < -5, "Off-centre force did not apply torque");
    handle.applyTorque(dimension === 3 ? [0, 0, 60] : 60);
    state = await handle.readState();
    close(
      dimension === 3 ? state.angularVelocity[2] : state.angularVelocity,
      0,
      1e-4,
    );
    handle.applyAngularImpulse(dimension === 3 ? [0, 0, 1] : 1);
    state = await handle.readState();
    check(
      (dimension === 3 ? state.angularVelocity[2] : state.angularVelocity) > 5,
      "Angular impulse was lost",
    );
    world.editBodies([
      {
        body: handle,
        position: v(3, 4),
        linearVelocity: v(0, 0),
        angularVelocity: dimension === 3 ? [0, 0, 0] : 0,
        force: v(0, 60),
      },
    ]);
    state = await handle.readState();
    close(state.position[0], 3);
    close(state.linearVelocity[1], 60 * dt, 1e-4);
    world.step();
    state = await handle.readState();
    close(state.linearVelocity[1], 60 * dt, 1e-3);
    return {
      backend,
      dimension,
      forces: true,
      torques: true,
      orderedBulkEdits: true,
      passed: true,
    };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkHeavyFloor(backend) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const scene = new AvbdScene3D({ iterations: 5 });
  scene.addBox([20, 0.2, 20], { mass: 0, position: [0, -0.1, 0] });
  const block = scene.addBox([1, 1, 1], {
    mass: 10000,
    position: [0, 0.55, 0],
  });
  const world = scene.createSolver(pipeline, { spatialSort: false });
  try {
    for (let i = 0; i < 180; i++) world.step();
    const state = await world.body(block).readState();
    check(
      state.position[1] > 0.4 && state.position[1] < 0.65,
      `Heavy body passed through a thin floor: ${state.position[1]}`,
    );
    check(
      Math.abs(state.linearVelocity[1]) < 0.1,
      "Heavy body failed to settle",
    );
    return {
      backend,
      dimension: 3,
      heavyFloor: true,
      height: state.position[1],
      passed: true,
    };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkShapeQueries(backend, dimension) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false });
  const scene =
    dimension === 3
      ? new AvbdScene3D({ gravity: 0 })
      : new AvbdScene2D({ gravity: 0 });
  const v = (x, y) => (dimension === 3 ? [x, y, 0] : [x, y]);
  const shapes = [
    scene.addBox(dimension === 3 ? [1, 1, 1] : [1, 1], {
      position: v(0, 0),
      group: 1,
    }),
    dimension === 3
      ? scene.addSphere(0.5, { position: v(4, 0), group: 2 })
      : scene.addCircle(0.5, { position: v(4, 0), group: 2 }),
    scene.addCapsule(0.25, 2, { position: v(8, 0), group: 4 }),
    scene.addHull(
      dimension === 3
        ? Array.from({ length: 8 }, (_, i) =>
            [0, 1, 2].map((k) => ((i >> k) & 1) - 0.5),
          ).flat()
        : [
            [-0.5, -0.5],
            [0.5, -0.5],
            [0.5, 0.5],
            [-0.5, 0.5],
          ],
      { position: v(12, 0), group: 8 },
    ),
  ];
  if (dimension === 2) {
    shapes.push(scene.addSegment([15.5, -1], [15.5, 1], { group: 16 }));
    shapes.push(scene.addPlane([-1, 0], -19.5, { group: 32 }));
  }
  const world = scene.createSolver(pipeline, { spatialSort: false });
  try {
    const rays = shapes.map((_, i) => ({
      origin: v(i * 4 - 2, 0),
      direction: v(1, 0),
      maxDistance: 3,
    }));
    const hits = await world.raycastAll(rays);
    const casts = rays.map((ray) => ({ ...ray, radius: 0.2 }));
    const swept =
      dimension === 3
        ? await world.sphereCastAll(casts)
        : await world.circleCastAll(casts);
    for (let i = 0; i < shapes.length; i++) {
      const id = world.body(shapes[i]).gpuIndex;
      const distance =
        dimension === 3 && i === 2
          ? 1.75
          : dimension === 2 && i === 2
            ? 1
            : 1.5;
      check(
        hits[i]?.index === id && swept[i]?.index === id,
        `Batch query missed shape ${i}`,
      );
      close(hits[i].distance, distance, 1e-4);
      close(swept[i].distance, distance - 0.2, 1e-4);
      check(hits[i].normal[0] < -0.99, "Query normal does not face the ray");
    }
    // Commands queued before a query must be visible without a physics step.
    world.body(shapes[1]).teleport(v(5, 0));
    close(
      (await world.raycast(rays[1].origin, rays[1].direction, rays[1]))
        .distance,
      2.5,
      1e-4,
    );
    const limited = await world.raycastAll(
      rays.map(({ maxDistance, ...ray }) => ray),
      { maxDistance: 0.5 },
    );
    check(
      limited.every((hit) => hit === null),
      "Batch-wide distance limit was ignored",
    );
    const masked = await world.raycastAll(rays, { collidesWith: 1 });
    check(
      masked[0]?.index === world.body(shapes[0]).gpuIndex &&
        masked.slice(1).every((hit) => hit === null),
      "Batch-wide collision mask was ignored",
    );
    return {
      backend,
      dimension,
      shapes: shapes.length,
      batchRays: true,
      batchSweeps: true,
      liveEdits: true,
      passed: true,
    };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 reported a graphics error",
      );
    pipeline.destroy();
  }
}

export async function checkFabric(backend) {
  const pipeline = await createSolverPipeline({ backend, validate3D: false }),
    scene = new AvbdScene3D({ iterations: 5 });
  scene.addBox([10, 1, 10], { position: [0, -0.5, 0], density: 0 });
  const fabric = scene.addFabric({
    columns: 6,
    rows: 6,
    spacing: 0.25,
    pinCorners: true,
    stiffness: 500,
    breakStrain: 2,
  });
  const world = scene.createSolver(pipeline);
  try {
    for (let i = 0; i < 60; i++) world.step();
    const data = await world.readBodies();
    check(data.every(Number.isFinite), "Fabric produced nonfinite state");
    check(
      (await world.readCounters()).overflow === 0,
      "Fabric contact overflow",
    );
    return {
      backend,
      dimension: 3,
      fabricPoints: fabric.points.length,
      passed: true,
    };
  } finally {
    if (pipeline.gl)
      check(
        pipeline.gl.getError() === pipeline.gl.NO_ERROR,
        "WebGL2 graphics error",
      );
    pipeline.destroy();
  }
}
