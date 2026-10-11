import { GlCompute } from "../src/webgl/compute.js";
import { GlBodyEdits } from "../src/webgl/bodyEdits.js";
import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { createSolverPipeline } from "../src/native/pipeline.js";
const check = (v, m) => {
  if (!v) throw Error(m);
};
export async function checkGlEdits(sources) {
  const compute = new GlCompute(
    document
      .createElement("canvas")
      .getContext("webgl2", { antialias: false, depth: false, stencil: false }),
  );
  const pipeline = await createSolverPipeline({ validate3D: false }),
    rows = [],
    errors = [];
  pipeline.device.addEventListener("uncapturederror", (e) =>
    errors.push(e.error.message),
  );
  let solver, edits;
  try {
    for (const dimension of [2, 3]) {
      globalThis.__GL_EDIT_PROGRESS__ = `${dimension}D bulk commands`;
      const scene = dimension === 2 ? new AvbdScene2D() : new AvbdScene3D();
      for (let i = 0; i < 37; i++)
        scene.addBox(dimension === 2 ? [0.4, 0.8] : [0.4, 0.8, 0.6], {
          position: dimension === 2 ? [i * 0.8, 1] : [i * 0.8, 1, 0],
          density: i === 0 ? 0 : 1,
          ...(dimension === 2
            ? { angle: 0.4 }
            : { rotation: [0, 0, Math.sin(0.2), Math.cos(0.2)] }),
        });
      solver = scene.createSolver(pipeline);
      const data = await solver.readBodies(),
        stride = dimension === 2 ? 24 : 40,
        width = 8,
        height = 8;
      const groups =
        dimension === 2
          ? {
              pose: [0],
              initial: [1],
              inertial: [2],
              velocity: [3],
              previousVelocity: [4],
              shape: [5],
            }
          : {
              position: [0],
              rotation: [1],
              history: [2, 3, 6, 7],
              properties: [4, 5],
              motion: [8, 9],
            };
      const inputs = {},
        spare = {},
        resources = [];
      for (const [name, fields] of Object.entries(groups)) {
        const slots = fields.length === 1 ? 64 : 37 * fields.length,
          w = fields.length === 1 ? width : Math.ceil(Math.sqrt(slots)),
          h = fields.length === 1 ? height : Math.ceil(slots / w),
          packed = new Float32Array(w * h * 4);
        for (let i = 0; i < 37; i++)
          for (let j = 0; j < fields.length; j++)
            packed.set(
              data.subarray(
                i * stride + fields[j] * 4,
                i * stride + fields[j] * 4 + 4,
              ),
              (i * fields.length + j) * 4,
            );
        inputs[name] = compute.texture(w, h, false, packed);
        spare[name] = compute.texture(w, h);
        resources.push(inputs[name], spare[name]);
      }
      edits = await GlBodyEdits.create(
        compute,
        { bodyCount: 37, width, height },
        dimension,
        sources[dimension].glsl,
      );
      const changes = [];
      for (let body = 0; body < 37; body++) {
        const position =
            dimension === 2 ? [body * 0.7, 2] : [body * 0.7, 2, 0.3],
          q = dimension === 2 ? 0.7 : [0, Math.sin(0.3), 0, Math.cos(0.3)];
        changes.push({
          body,
          position,
          rotation: q,
          linearVelocity: dimension === 2 ? [0.2, -0.3] : [0.2, -0.3, 0.4],
          angularVelocity: dimension === 2 ? 0.4 : [0.1, 0.2, 0.3],
        });
        changes.push({
          body,
          impulse: dimension === 2 ? [0.3, 0.7] : [0.3, 0.7, -0.2],
          worldPoint:
            dimension === 2
              ? [body * 0.7 + 0.2, 2.3]
              : [body * 0.7 + 0.2, 2.3, 0.5],
        });
        changes.push({
          body,
          force: dimension === 2 ? [0.2, 0.4] : [0.2, 0.4, 0.6],
          angularImpulse: dimension === 2 ? 0.05 : [0.05, -0.03, 0.02],
          torque: dimension === 2 ? 0.1 : [0.1, 0.2, -0.1],
        });
      }
      solver.editBodies(changes);
      const commands = solver.bodyCommands.queue;
      check(
        commands.count > 37 * 4,
        "Expected ordered commands across all bodies",
      );
      edits.dispatch(commands, inputs, spare);
      const expected = await solver.readBodies(),
        actual = new Float32Array(expected.length);
      for (const [name, fields] of Object.entries(groups)) {
        const packed = await compute.read(inputs[name]);
        for (let i = 0; i < 37; i++)
          for (let j = 0; j < fields.length; j++)
            actual.set(
              packed.subarray(
                (i * fields.length + j) * 4,
                (i * fields.length + j + 1) * 4,
              ),
              i * stride + fields[j] * 4,
            );
      }
      let maxError = 0;
      for (let i = 0; i < actual.length; i++) {
        if (dimension === 3 && i % stride === 11) continue; // Cache invalidation marker cleared during the next step.
        check(
          Number.isFinite(actual[i]),
          `${dimension}D command produced nonfinite ${i}`,
        );
        maxError = Math.max(
          maxError,
          Math.abs(actual[i] - expected[i]) /
            Math.max(1, Math.abs(expected[i])),
        );
      }
      check(
        maxError < 1e-5,
        `${dimension}D body commands differ from WebGPU: ${maxError}`,
      );
      rows.push({
        dimension,
        bodies: 37,
        ...edits.lastBatch,
        maxRelativeError: maxError,
        passed: true,
      });
      edits.destroy();
      edits = null;
      solver.destroy();
      solver = null;
      for (const r of resources) compute.release(r);
    }
    return { passed: true, rows, errors };
  } finally {
    edits?.destroy();
    solver?.destroy();
    pipeline.destroy();
    compute.destroy();
  }
}
