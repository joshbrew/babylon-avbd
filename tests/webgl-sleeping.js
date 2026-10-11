import { GlCompute } from "../src/webgl/compute.js";
import { GlWorld2D } from "../src/webgl/world2D.js";
import { GlWorld3D } from "../src/webgl/world3D.js";
import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { NativeCpuSolver } from "../src/native/cpu/world.js";
import { CommandStaging } from "../src/gpu/bodyCommands2D.js";
const check = (v, m) => {
  if (!v) throw Error(m);
};
export async function checkGlSleep(sources) {
  const compute = new GlCompute(
      document
        .createElement("canvas")
        .getContext("webgl2", {
          antialias: false,
          depth: false,
          stencil: false,
        }),
    ),
    rows = [];
  let world, metadata;
  try {
    for (const dimension of [2, 3]) {
      globalThis.__GL_SLEEP_PROGRESS__ = `${dimension}D sleeping setup`;
      const scene =
        dimension === 2
          ? new AvbdScene2D({ iterations: 5 })
          : new AvbdScene3D({ iterations: 5 });
      scene.addBox(dimension === 2 ? [10, 1] : [10, 1, 10], {
        position: dimension === 2 ? [0, -0.5] : [0, -0.5, 0],
        density: 0,
      });
      scene.addBox(dimension === 2 ? [0.8, 0.8] : [0.8, 0.8, 0.8], {
        position: dimension === 2 ? [0, 0.4] : [0, 0.4, 0],
      });
      scene.addBox(dimension === 2 ? [0.8, 0.8] : [0.8, 0.8, 0.8], {
        position: dimension === 2 ? [2, 0.4] : [2, 0.4, 0],
      });
      metadata = new NativeCpuSolver(scene, dimension);
      world = (dimension === 2 ? GlWorld2D : GlWorld3D).create(compute, {
        bodies: metadata.packBodyRecords(),
        params: { ...metadata.params },
        contactMath: sources[dimension].contact.glsl,
        solveMath: sources[dimension].solve.glsl,
        editMath: dimension === 2 ? sources[dimension].edits.glsl : undefined,
        colorCap: 4,
        colorRounds: 8,
        neighborCapacity: 15,
      });
      if (dimension === 3) world.prepareEdits(sources[dimension].edits.glsl);
      const policy = world.enableSleeping({
        delay: 0.2,
        speed: 0.1,
        eligible: [false, true, false],
      });
      for (let i = 0; i < 90; i++) {
        world.step();
        if (i % 15 === 14) {
          globalThis.__GL_SLEEP_PROGRESS__ = `${dimension}D settling ${i + 1}/90`;
          await new Promise((r) => setTimeout(r, 0));
        }
      }
      const sleeping = await policy.readStats();
      check(
        sleeping.sleeping === 1,
        `${dimension}D expected one eligible sleeping box: ${JSON.stringify(sleeping)}`,
      );
      const before = await world.readBodies();
      for (let i = 0; i < 10; i++) world.step();
      const after = await world.readBodies(),
        stride = dimension === 2 ? 24 : 40;
      check(
        Math.abs(before[stride + 1] - after[stride + 1]) < 1e-7,
        "Sleeping box moved",
      );
      const edits = new CommandStaging();
      edits.append(1, 2, dimension === 2 ? [0, 2] : [0, 2, 0]);
      world.applyCommands(edits);
      world.step();
      check(
        (await policy.readStats()).sleeping === 0,
        "Impulse did not wake the box",
      );
      const state = await world.readBodies();
      check(
        state[stride + (dimension === 2 ? 13 : 33)] > 1,
        "Sleeping body did not receive its impulse",
      );
      check(
        (await world.readStatus()).problems === 0,
        "Sleeping invalidated the graph",
      );
      rows.push({
        dimension,
        sleeping: sleeping.sleeping,
        impulseWakes: true,
        passed: true,
      });
      world.destroy();
      world = null;
      metadata.destroy();
      metadata = null;
    }
    return { passed: true, rows, errors: [] };
  } finally {
    world?.destroy();
    metadata?.destroy();
    compute.destroy();
  }
}
