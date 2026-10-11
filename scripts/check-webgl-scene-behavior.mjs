import "./prepare-webgl.mjs";
import { build } from "esbuild";
import { browserCheck } from "./browser-check.mjs";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import assert from "node:assert/strict";
const bundle = ".temp/webgl-scene-behavior.js";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/webgl-scene-behavior.js"],
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
    `import('/${bundle}').then(m=>m.checkGlSceneBehavior()).then(result=>globalThis.__GL_BEHAVIOR__=result,error=>globalThis.__GL_BEHAVIOR__={passed:false,error:error.stack})`,
  );
  result = await browser.evaluate("__GL_BEHAVIOR__");
  assert.equal(result.passed, true, result.error);
  assert.deepEqual(browser.errors, []);
  console.log(
    `PASS WebGL2 scene behavior: ${result.rows.length} checks, 60 verified steps per settling scene`,
  );
} finally {
  if (result)
    await writeFile(
      "test-results/webgl-scene-behavior.json",
      JSON.stringify(result, null, 2) + "\n",
    );
  await browser.close();
  await unlink(bundle).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}
