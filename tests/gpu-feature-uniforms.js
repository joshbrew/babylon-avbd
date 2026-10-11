import { AvbdScene2D, AvbdScene3D } from "../src/native/scenes.js";
import { assert, readBuffer } from "./helpers/gpu.js";

// Control uploads every optional uniform before use, as the previous path did.
function useFullUniformUploads(g) {
  for (const [feature, method] of [
    [g.sleeping, "before"],
    [g.restitution, "bind"],
  ]) {
    const original = feature[method];
    feature[method] = function (...args) {
      if (this.paramData) this.paramData.buffer = null;
      return original.apply(this, args);
    };
  }
}

export function createFeatureUniformFixture(device, dimension, count = 12) {
  const vec = (x, y) => (dimension === 2 ? [x, y] : [x, 0, y]);
  const scene =
    dimension === 2
      ? new AvbdScene2D({ iterations: 5 })
      : new AvbdScene3D({ iterations: 5, up: [0, 0, 1] });
  const floor = scene.addBox(
    dimension === 2 ? [count * 2 + 8, 1] : [count * 2 + 8, 8, 1],
    {
      position: vec(0, -0.5),
      ...(dimension === 2 ? { density: 0 } : { mass: 0 }),
    },
  );
  const bodies = [];
  for (let i = 0; i < count; i++) {
    const options = {
      position: vec((i - count / 2) * 1.5, i ? 3 : 0.4),
      allowSleep: true,
      restitution: i % 2 ? 0.7 : 0,
    };
    bodies.push(
      dimension === 2
        ? scene.addCircle(0.4, options)
        : scene.addSphere(0.4, options),
    );
  }
  const g = scene.createSolver(device, {
    sleeping: { timeThreshold: 0.05, speedThreshold: 0.1 },
    spatialSort: false,
    bodyCapacity: count + 4,
    colorCap: 16,
    colorRounds: 16,
  });
  return { g, floor, bodies, vec };
}

export async function featureUniformGpuTests(device, test) {
  for (const dimension of [2, 3])
    await test(`GPU feature uniforms ${dimension}D retain exact bounce, sleep and wake state`, async () => {
      const a = createFeatureUniformFixture(device, dimension),
        b = createFeatureUniformFixture(device, dimension);
      useFullUniformUploads(a.g);
      let sawEmpty = false,
        sawContacts = false,
        sawSleeping = false;
      try {
        for (let step = 0; step < 240; step++) {
          for (const f of [a, b]) {
            if (step === 80) f.g.body(f.floor).setTrigger(true);
            if (step === 100)
              for (const body of [f.floor, ...f.bodies])
                f.g.body(body).setCollisionGroups(1, 0);
            if (step === 120) {
              for (const body of [f.floor, ...f.bodies])
                f.g.body(body).setCollisionGroups(1, 1);
              f.g.body(f.floor).setTrigger(false);
              f.bodies.forEach((body, i) =>
                f.g.body(body).teleport(f.vec((i - 6) * 1.5, 0.4)),
              );
            }
            if (step === 150) {
              const g = f.g;
              if (dimension === 2)
                g.allocateContacts(g.contactCapacity * 2, g.pairCapacity * 2);
              else
                g.allocateContacts(
                  g.contactCapacity * 2,
                  g.pairCapacity * 2,
                  g.manifoldCapacity * 2,
                );
            }
            if (step === 190) f.g.body(f.bodies[0]).applyImpulse(f.vec(0, 2));
          }
          if (step === 210)
            for (const { g } of [a, b]) {
              g.params.dt = 1 / 120;
              g.params.gravity = -8;
            }
          if (step === 220 && dimension === 3)
            for (const { g } of [a, b]) g.params.up = [0.1, 0, Math.sqrt(0.99)];
          const worlds = step % 2 ? [a.g, b.g] : [b.g, a.g];
          worlds.forEach((g) => g.step());
          if (step % 10 !== 9) continue;
          const states = await Promise.all(worlds.map((g) => g.readBodies()));
          assert(
            states[0].every((v, i) => Number.isFinite(v) && v === states[1][i]),
            `Every pose and velocity matches at step ${step + 1}`,
          );
          for (const name of ["state", "globals"]) {
            const records = await Promise.all(
              worlds.map((g) => readBuffer(device, g.sleeping[name])),
            );
            const x = new Uint32Array(records[0]),
              y = new Uint32Array(records[1]);
            assert(
              x.every((v, i) => v === y[i]),
              `Sleep ${name} matches bit for bit`,
            );
          }
          const counts = await Promise.all(worlds.map((g) => g.readCounters()));
          assert(
            counts.every((c) => !c.overflow && !c.clashes),
            "Complete independent contacts",
          );
          assert(
            JSON.stringify(counts[0]) === JSON.stringify(counts[1]),
            "Contact counters match",
          );
          sawEmpty ||= counts[0].contacts === 0;
          sawContacts ||= counts[0].contacts > 0;
          sawSleeping ||= (await a.g.readSleepStats()).sleeping > 0;
        }
        for (const key of ["sleeping", "restitution"]) {
          assert(
            b.g[key].paramData.uploads < a.g[key].paramData.uploads / 2,
            `${key} avoids redundant uploads while settings change`,
          );
        }
        assert(
          sawEmpty && sawContacts && sawSleeping,
          "Exercise empty contacts, impacts and sleeping",
        );
      } finally {
        a.g.destroy();
        b.g.destroy();
      }
    });
}
