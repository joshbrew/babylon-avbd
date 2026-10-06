import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { makeVoronoiWall } from "../demo/voronoiGeometry.js";
const geometry = makeVoronoiWall();
assert.equal(geometry.cells.length, 216);
assert.ok(
  Math.abs(
    geometry.cells.reduce((sum, c) => sum + c.volume, 0) - geometry.volume,
  ) < 1e-8,
  "Voronoi cells must fill the wall without losing volume",
);
for (const [i, cell] of geometry.cells.entries()) {
  assert.ok(cell.volume > 0 && cell.vertices.length / 3 <= 32);
  for (const face of cell.faces)
    if (face.neighbor !== undefined) {
      const reverse = geometry.cells[face.neighbor].faces.find(
        (f) => f.neighbor === i,
      );
      assert.ok(
        reverse && Math.abs(face.length - reverse.length) < 1e-7,
        "Shared fracture faces must match",
      );
    }
}
const b = await browserCheck(),
  checkpoints = [];
try {
  await b.navigate(
    "?demo=canonical&scene=3d-voronoi-demolition&backend=gpu&paused=1",
  );
  let ready = false;
  for (let i = 0; i < 400; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) {
      ready = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 30));
  }
  assert.ok(ready, "Voronoi demo must initialize");
  const initial = await b.evaluate("__AVBD_LAB__.snapshot()");
  for (const step of [120, 480, 1440, 2400]) {
    await b.evaluate(
      `__AVBD_LAB__.step(${step} - __AVBD_LAB__.diagnostics.steps)`,
    );
    const s = await b.evaluate(
      "(async()=>{await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot({joints:true});})()",
    );
    const pieces = s.demolition.pieces;
    let moved = 0,
      rotated = 0,
      maxQuatError = 0,
      minZ = Infinity;
    for (const id of pieces) {
      const o = id * 40;
      if (
        Math.hypot(
          ...s.poses.slice(o, o + 3).map((v, i) => v - initial.poses[o + i]),
        ) > 0.15
      )
        moved++;
      const dot = Math.abs(
        s.poses
          .slice(o + 4, o + 8)
          .reduce((n, v, i) => n + v * initial.poses[o + 4 + i], 0),
      );
      if (dot < 0.995) rotated++;
      maxQuatError = Math.max(
        maxQuatError,
        Math.abs(Math.hypot(...s.poses.slice(o + 4, o + 8)) - 1),
      );
      minZ = Math.min(minZ, s.poses[o + 2]);
    }
    const result = {
      steps: s.steps,
      bodies: s.bodyCount,
      pieces: pieces.length,
      bonds: s.demolition.bonds.length,
      broken: s.demolition.broken,
      moved,
      rotated,
      maxQuatError,
      minZ,
      stats: s.stats,
      errors: s.errors,
    };
    checkpoints.push(result);
    console.log(JSON.stringify(result));
    assert.ok(
      s.poses.every(Number.isFinite) &&
        !s.stats.overflow &&
        !s.stats.clashes &&
        !s.errors.length &&
        maxQuatError < 0.0001 &&
        minZ > -0.5,
      "Fracture simulation must remain valid",
    );
    if (step === 120)
      assert.ok(
        result.broken === 0 && moved === 0,
        "Wall must hold together before the ball arrives",
      );
    if (step >= 1440)
      assert.ok(
        result.broken > 20 && moved > 20 && rotated > 10,
        "Impact must break bonds and release rotating stones",
      );
    assert.equal(
      s.bodyCount,
      initial.bodyCount,
      "Debris must persist without a lifetime",
    );
    await b.screenshot(`test-results/screenshots/voronoi-${step}.png`);
  }
  await b.evaluate(
    "__AVBD_LAB__.swingBall().then(()=>__AVBD_LAB__.pause(true)).then(()=>__AVBD_LAB__.step(360))",
  );
  assert.equal(
    await b.evaluate("__AVBD_LAB__.snapshot().then(s=>s.bodyCount)"),
    initial.bodyCount,
  );
  await b.evaluate(
    "__AVBD_LAB__.select('3d-voronoi-demolition','gpu').then(()=>__AVBD_LAB__.pause(true)).then(()=>__AVBD_LAB__.step(1))",
  );
  const reset = await b.evaluate(
    "(async()=>{await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot();})()",
  );
  assert.equal(reset.demolition.broken, 0, "Reset must rebuild all bonds");
  assert.ok(
    !b.errors.length &&
      !b.logs.some((e) => /GL_INVALID|sampler type/i.test(e.text)),
  );
  await writeFile(
    "test-results/voronoi-fracture.json",
    JSON.stringify(
      {
        passed: true,
        geometry: { cells: geometry.cells.length, volume: geometry.volume },
        checkpoints,
        reset: true,
        repeatSwing: true,
        errors: b.errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS Voronoi demolition: exact partition, shared-face bonds, intact wall, rotating debris, persistence and reset",
  );
} finally {
  await b.close();
}
