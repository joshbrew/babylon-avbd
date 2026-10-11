import { webglContactSources } from "./webgl-contact-math.mjs";
import { webglSolveSources2D } from "./webgl-solve-math.mjs";
import { webglSolveSources3D } from "./webgl-solve3D-math.mjs";
import { build } from "esbuild";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
const sources = {
    contact: await webglContactSources(2),
    solve: webglSolveSources2D(),
    contact3D: await webglContactSources(3, { hulls: true }),
    solve3D: webglSolveSources3D(),
    only3D: process.argv.includes("--3d"),
    hulls: true,
    joints: true,
  },
  bundle = ".temp/webgl-world-test.js";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/webgl-world.js"],
  outfile: bundle,
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
});
const browser = await browserCheck();
let result;
try {
  await browser.navigate("tests/performance.html");
  await browser.evaluate(
    `(async()=>{const {checkGlWorld}=await import('/${bundle}');checkGlWorld(${JSON.stringify(sources)}).then(result=>globalThis.__GL_WORLD_RESULT__=result,error=>globalThis.__GL_WORLD_RESULT__={passed:false,error:error.stack});return true;})()`,
  );
  let last;
  const started = Date.now();
  for (;;) {
    const state = await browser.evaluate(
      "({stage:globalThis.__GL_WORLD_PROGRESS__,result:globalThis.__GL_WORLD_RESULT__})",
    );
    if (state.stage !== last) {
      console.log(state.stage);
      last = state.stage;
    }
    if (state.result) {
      result = state.result;
      break;
    }
    if (Date.now() - started > 240000)
      throw Error(`World check timed out at ${last}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(result.passed, true, result.error);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(browser.errors, []);
  console.log(`PASS WebGL2 complete steps: ${result.rows.length} scene checks`);
} catch (error) {
  result = { ...result, passed: false, error: error.stack };
  throw error;
} finally {
  await writeFile(
    "test-results/webgl-world.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  await browser.close();
  await unlink(bundle).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
}
