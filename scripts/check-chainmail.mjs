import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
const b = await browserCheck();
try {
  await b.navigate(
    "?demo=canonical&scene=showcase-chain-mail-1.6k&backend=gpu&paused=1",
  );
  let ready = false;
  for (let i = 0; i < 400; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) {
      ready = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  assert.ok(ready, "Chain-mail scene must initialize");
  const initial = await b.evaluate("__AVBD_LAB__.snapshot()");
  assert.equal(initial.rings.length, 1200);
  let pairs = 0,
    maxGap = 0;
  for (const flat of initial.rings.filter((r) => r.plane === "ringFlat"))
    for (const link of initial.rings.filter((r) => r.plane !== "ringFlat")) {
      const a = initial.poses.slice(flat.index * 40, flat.index * 40 + 3),
        c = initial.poses.slice(link.index * 40, link.index * 40 + 3);
      const distance = Math.hypot(...a.map((v, i) => v - c[i]));
      if (Math.abs(distance - 0.5) > 0.0001) continue;
      // Perpendicular centerline circles have their nearest points along the
      // shared axis. Their wire surfaces should meet without an initial gap.
      const separation =
        Math.abs(flat.radius + link.radius - distance) - flat.wire - link.wire;
      maxGap = Math.max(maxGap, Math.abs(separation));
      pairs++;
    }
  assert.ok(
    pairs > 1500 && maxGap < 1e-4,
    `Neighboring chain-mail wires must touch at their rest spacing: ${pairs} pairs, ${maxGap} m gap`,
  );
  await b.screenshot("test-results/screenshots/chainmail-rest.png");
  await b.evaluate("__AVBD_LAB__.step(360)");
  const final = await b.evaluate(
    "(async()=>{await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot();})()",
  );
  assert.equal(final.rings.length, initial.rings.length);
  assert.ok(
    final.poses.every(Number.isFinite) &&
      !final.stats.overflow &&
      !final.stats.clashes &&
      !final.errors.length &&
      !b.errors.length,
  );
  await b.screenshot("test-results/screenshots/chainmail-settled.png");
  await writeFile(
    "test-results/chainmail.json",
    JSON.stringify(
      {
        passed: true,
        rings: initial.rings.length,
        touchingPairs: pairs,
        maxRestWireGap: maxGap,
        steps: final.steps,
        stats: final.stats,
        errors: b.errors,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS chain mail: ${pairs} touching rest pairs, ${maxGap} m maximum wire gap, GPU settling valid`,
  );
} finally {
  await b.close();
}
