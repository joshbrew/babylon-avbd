import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import { browserCheck } from "./browser-check.mjs";
import { parseTerrainMesh } from "../demo/terrain/mesh.js";

const obj = "v -2 0 -2\nv 2 0 -2\nv 2 0 2\nv -2 0 2\nf -4 -1 -2 -3 # floor\n";
const parsed = parseTerrainMesh(obj, "floor.obj");
assert.equal(parsed.indices.length, 6);
assert.equal(parsed.height, 0);
assert.ok(parsed.positions.every(Number.isFinite));
assert.throws(
  () => parseTerrainMesh("v 0 0 0\nf 1 2 3", "bad.obj"),
  /invalid face/,
);
assert.throws(
  () => parseTerrainMesh('{"positions":[0,0,null]}', "bad.json"),
  /finite XYZ/,
);
assert.throws(
  () =>
    parseTerrainMesh(
      "v 0 0 0\nv 2 0 0\nv 1 0 1\nv 2 0 2\nv 0 0 2\nf 1 2 3 4 5",
      "concave.obj",
    ),
  /Triangulate concave/,
);
await mkdir(".temp", { recursive: true });
await mkdir("test-results/screenshots", { recursive: true });
const filename = resolve(".temp/imported-floor.obj");
await writeFile(filename, obj);
async function buildFixture() {
  await build({
    bundle: true,
    format: "esm",
    outfile: ".temp/terrain-visual-check.js",
    loader: { ".wgsl": "text" },
    stdin: {
      resolveDir: process.cwd(),
      contents: `
export {createSimulationSession} from './demo/shared/runtime/simulationSession.js';
export {landscapeMesh,caveMesh} from './demo/terrain/mesh.js';
export {terrainSurfaceOf} from './demo/terrain/visual.js';
`,
    },
  });
}
const b = await browserCheck(),
  results = [];
async function wait(expression) {
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate(expression)) return;
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error(`Timed out: ${expression}`);
}
try {
  await b.navigate(
    "?demo=canonical&scope=main&scene=3d-static-terrain&backend=gpu&paused=1",
  );
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  assert.equal(
    await b.evaluate("__AVBD_LAB__.diagnostics.terrain.surfaces"),
    2,
  );
  await b.evaluate("__AVBD_LAB__.pause(true);__AVBD_LAB__.step(240)");
  await b.screenshot("test-results/screenshots/terrain-organic.png");
  const { root } = await b.call("DOM.getDocument");
  const { nodeId } = await b.call("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: "#lab-terrain-file",
  });
  await b.call("DOM.setFileInputFiles", { nodeId, files: [filename] });
  await wait(
    "__AVBD_LAB__.diagnostics.ready && __AVBD_LAB__.diagnostics.terrain.imported",
  );
  assert.deepEqual(await b.evaluate("__AVBD_LAB__.diagnostics.terrain"), {
    name: "imported-floor.obj",
    triangles: 2,
    colliders: 2,
    surfaces: 1,
    imported: true,
  });
  for (const backend of ["gpu", "cpu"]) {
    console.log(`Checking imported terrain on ${backend}`);
    if (backend === "cpu")
      await b.evaluate("__AVBD_LAB__.select('3d-static-terrain','cpu')");
    await b.evaluate("__AVBD_LAB__.pause(true);__AVBD_LAB__.step(480)");
    const snapshot = await b.evaluate("__AVBD_LAB__.snapshot()");
    assert.ok(snapshot.poses.every(Number.isFinite));
    assert.deepEqual(snapshot.errors, []);
    for (let i = 2; i < snapshot.bodyCount; i++)
      assert.ok(
        snapshot.poses[i * 40 + 2] > -0.1,
        "Imported floor must support every dynamic body",
      );
    results.push({
      backend,
      bodies: snapshot.bodyCount,
      renderer: snapshot.renderer,
      errors: snapshot.errors,
    });
    await b.screenshot(
      `test-results/screenshots/terrain-import-${backend}.png`,
    );
  }
  await b.evaluate(
    "(async()=>{await __AVBD_LAB__.select('3d-static-terrain','gpu');await __AVBD_LAB__.setRenderer('babylon');})()",
  );
  await b.evaluate("__AVBD_LAB__.pause(true);__AVBD_LAB__.step(120)");
  const babylon = await b.evaluate("__AVBD_LAB__.snapshot()");
  assert.deepEqual(babylon.errors, []);
  assert.equal(babylon.renderer, "babylon");
  await b.screenshot("test-results/screenshots/terrain-import-babylon.png");
  await b.evaluate("__AVBD_LAB__.dispose()");
  // Import data survives the execution-scope switch; the source mesh is drawn
  // once even though it is cooked into multiple collision bodies.
  await b.navigate(
    "tests/workers.html?scene=3d-static-terrain&terrain=uploaded&scope=worker-sab",
  );
  await wait("globalThis.__WORKER_BENCH__?.ready");
  const worker = await b.evaluate("__WORKER_BENCH__.client.snapshot()");
  assert.equal(worker.terrain.imported, true);
  assert.equal(worker.bodies, 122);
  assert.equal(worker.sharedInput, true);
  assert.ok(worker.poses.every(Number.isFinite));
  assert.deepEqual(worker.errors, []);
  assert.ok(
    await b.evaluate(
      "document.getElementById('scene-controls').href.includes('terrain=uploaded')",
    ),
  );
  await b.evaluate("__WORKER_BENCH__.client.destroy()");
  await buildFixture();
  const geometry = await b.evaluate(`(async()=>{
    const m=await import('/.temp/terrain-visual-check.js');
    const canvas=document.getElementById('canvas').cloneNode(false);document.getElementById('canvas').replaceWith(canvas);
    const s=await m.createSimulationSession(canvas,{scene:'3d-static-terrain',backend:'gpu',renderer:'webgpu'});
    try {
      const surfaces=s.built.solver.bodies.map(m.terrainSurfaceOf).filter(v=>v?.vertices);
      const meshes=[m.landscapeMesh(),m.caveMesh()];
      return {surfaces:surfaces.length,capsules:s.renderer.visuals.groups.find(g=>g.kind===2)?.count,counts:surfaces.map(v=>v.vertices.length),expected:meshes.map(v=>v.indices.length*6),finite:surfaces.every(v=>v.vertices.every(Number.isFinite)),errors:s.errors};
    }finally{s.destroy();}
  })()`);
  assert.equal(geometry.surfaces, 2);
  assert.equal(geometry.capsules, 40);
  assert.deepEqual(geometry.counts, geometry.expected);
  assert.ok(geometry.finite);
  assert.deepEqual(geometry.errors, []);
  assert.deepEqual(b.errors, []);
  await writeFile(
    "test-results/terrain-import.json",
    JSON.stringify(
      {
        passed: true,
        results,
        geometry,
        worker: { sharedInput: worker.sharedInput, bodies: worker.bodies },
        screenshots: [
          "terrain-organic",
          "terrain-import-gpu",
          "terrain-import-cpu",
          "terrain-import-babylon",
        ].map((n) => `screenshots/${n}.png`),
      },
      null,
      2,
    ),
  );
  console.log(
    "Terrain OBJ/JSON validation, GPU/CPU/Babylon rendering, source geometry and worker import passed",
  );
} finally {
  await b.close();
}
