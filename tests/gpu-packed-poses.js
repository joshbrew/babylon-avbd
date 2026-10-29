import { AvbdScene3D } from "../src/native/scenes.js";
import { packedPoseContract } from "./packed-poses-contract.js";
import { contactLifetimesContract } from "./contact-lifetimes-contract.js";
import { queryMasksContract } from "./query-masks-contract.js";
export async function packedPoseGpuTests(device, test) {
  await test("Native 3D queries preserve legacy probes and support bilateral weapon masks", async () => {
    const scene = new AvbdScene3D({ gravity: 0 });
    const add = (x, collidesWith) =>
      scene.addSphere(0.5, {
        position: [x, 0, 0],
        mass: 0,
        group: 4,
        collidesWith,
      });
    const refs = {
      marker: add(-4, 0),
      friendlyOnly: add(0, 2),
      hostileOnly: add(4, 8),
    };
    const solver = scene.createSolver(device);
    try {
      await queryMasksContract(
        solver,
        Object.fromEntries(
          Object.entries(refs).map(([key, ref]) => [
            key,
            solver.bodyIndex(ref),
          ]),
        ),
      );
    } finally {
      solver.destroy();
    }
  });
  await test("Contact lifetimes: recycled overlap begins again and readback storage is reused", async () => {
    const scene = new AvbdScene3D({ gravity: 0 });
    const player = scene.addSphere(1.2, {
      mass: 0,
      group: 32,
      collidesWith: 8,
    });
    const bullet = scene.addSphere(0.2, {
      mass: 1,
      group: 8,
      collidesWith: 32,
      isTrigger: true,
    });
    const solver = scene.createSolver(device);
    try {
      await contactLifetimesContract(
        solver,
        solver.bodyIndex(player),
        solver.bodyIndex(bullet),
      );
    } finally {
      solver.destroy();
    }
  });
  await test("Native 3D packed poses preserve flags, velocities, order and atomic validation", async () => {
    const scene = new AvbdScene3D({ gravity: 0 });
    const refs = Array.from({ length: 4 }, (_, i) =>
      scene.addSphere(0.5, {
        position: [i * 3, 0, 0],
        mass: 2,
        group: 4,
        collidesWith: 2,
        isTrigger: i === 1,
      }),
    );
    const solver = scene.createSolver(device);
    try {
      await packedPoseContract(
        solver,
        Uint32Array.from(refs, (body) => solver.bodyIndex(body)).sort(),
      );
    } finally {
      solver.destroy();
    }
  });
}
