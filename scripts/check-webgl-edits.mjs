import { webglEditSources } from "./webgl-edit-math.mjs";
import { build } from "esbuild";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
const sources = { 2: await webglEditSources(2), 3: await webglEditSources(3) },
  bundle = ".temp/webgl-edits-test.js";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/webgl-edits.js"],
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
    `(async()=>{const {checkGlEdits}=await import('/${bundle}');checkGlEdits(${JSON.stringify(sources)}).then(result=>globalThis.__GL_EDIT_RESULT__=result,error=>globalThis.__GL_EDIT_RESULT__={passed:false,error:error.stack});return true;})()`,
  );
  let last;
  const started = Date.now();
  for (;;) {
    const state = await browser.evaluate(
      "({stage:globalThis.__GL_EDIT_PROGRESS__,result:globalThis.__GL_EDIT_RESULT__})",
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
      throw Error(`Command check timed out at ${last}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(result.passed, true, result.error);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(browser.errors, []);
  console.log(
    `PASS WebGL2 body edits: ${result.rows.length} backend comparisons`,
  );
} catch (error) {
  result = { ...result, passed: false, error: error.stack };
  throw error;
} finally {
  await writeFile(
    "test-results/webgl-edits.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  await browser.close();
  await unlink(bundle).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
}
