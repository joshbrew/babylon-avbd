import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck(),
  snapshots = [];
try {
  await browser.navigate(
    "?demo=canonical&scene=3d-tearable-cloth&backend=gpu&paused=1",
  );
  let ready = false;
  for (let i = 0; i < 400; i++) {
    ready = await browser.evaluate(
      "globalThis.__AVBD_LAB__?.diagnostics.ready",
    );
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  if (!ready) throw Error("Fabric scene did not initialize");
  const before = await browser.evaluate("__AVBD_LAB__.snapshot()");
  const patch = await browser.evaluate("__AVBD_LAB__.tearPatch()");
  if (!patch || patch.indices.length < 9 || !patch.releasedEdges)
    throw Error("Expected a separated physical fabric patch");
  for (const target of [120, 360, 960]) {
    let current = snapshots.at(-1)?.steps ?? before.steps;
    while (current < target) {
      await browser.evaluate(
        `__AVBD_LAB__.step(${Math.min(20, target - current)})`,
      );
      const stats = await browser.evaluate("__AVBD_LAB__.collect()");
      if (stats.overflow || stats.clashes) throw Error(JSON.stringify(stats));
      current += Math.min(20, target - current);
    }
    const s = await browser.evaluate("__AVBD_LAB__.snapshot({joints:true})");
    const physicalPatch = patch.indices.map((index) =>
      s.poses.slice(index * 40, index * 40 + 40),
    );
    if (
      s.bodyCount !== before.bodyCount ||
      s.fabric.materialFaces !== 1922 ||
      s.fabric.renderedVertices !== 1922 * 18 ||
      patch.releasedSlots.some((slot) => s.jointStates[slot * 32 + 3] !== 0) ||
      physicalPatch.some((p) => !p.every(Number.isFinite) || p[19] <= 0) ||
      s.errors.length
    )
      throw Error(
        "Detached fabric must retain its material, mass and live bodies: " +
          JSON.stringify(s.fabric),
      );
    const mean = (k) =>
      physicalPatch.reduce((sum, p) => sum + p[k], 0) / physicalPatch.length;
    const result = {
      steps: s.steps,
      seconds: s.steps * s.timeStep,
      bodies: s.bodyCount,
      materialFaces: s.fabric.materialFaces,
      renderedVertices: s.fabric.renderedVertices,
      detachedPoints: patch.indices.length,
      boundaryReleased: true,
      center: [mean(0), mean(1), mean(2)],
      finite: true,
    };
    snapshots.push(result);
    await browser.screenshot(
      `test-results/screenshots/cloth-fragments-${target}.png`,
    );
    console.log(JSON.stringify(result));
  }
  if (snapshots.at(-1).center[2] > 1 || snapshots[0].center[2] < 1)
    throw Error(
      "Separated patch must fall from the sheet and settle on the floor",
    );
  if (browser.errors.length) throw Error(browser.errors.join("\n"));
  await writeFile(
    "test-results/cloth-fragments.json",
    JSON.stringify(
      { passed: true, patch, snapshots, errors: browser.errors },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
