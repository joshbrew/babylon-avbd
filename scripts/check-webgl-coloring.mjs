import { build } from "esbuild";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
const bundle = ".temp/webgl-coloring-test.js";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/webgl-coloring.js"],
  outfile: bundle,
  bundle: true,
  format: "esm",
});
const browser = await browserCheck();
let result;
try {
  await browser.navigate("tests/performance.html");
  await browser.evaluate(
    `(async()=>{const {checkGlColoring}=await import('/${bundle}');checkGlColoring().then(result=>globalThis.__GL_COLOR_RESULT__=result,error=>globalThis.__GL_COLOR_RESULT__={passed:false,error:error.stack});return true;})()`,
  );
  const started = Date.now();
  let last;
  for (;;) {
    const state = await browser.evaluate(
      "({stage:globalThis.__GL_COLOR_PROGRESS__,result:globalThis.__GL_COLOR_RESULT__})",
    );
    if (state.stage !== last) {
      console.log(state.stage);
      last = state.stage;
    }
    if (state.result) {
      result = state.result;
      break;
    }
    if (Date.now() - started > 120000)
      throw Error(`Coloring check timed out at ${last}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(result.passed, true, result.error);
  assert.deepEqual(browser.errors, []);
  console.log(`PASS WebGL2 coloring: ${result.rows.length} checks in 2D/3D`);
} catch (error) {
  result = { ...result, passed: false, error: error.stack };
  throw error;
} finally {
  await writeFile(
    "test-results/webgl-coloring.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  await browser.close();
  await unlink(bundle).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}
