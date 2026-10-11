import { webglSolveSources2D } from "./webgl-solve-math.mjs";
import { build } from "esbuild";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
const sources = webglSolveSources2D(),
  bundle = ".temp/webgl-solve-test.js";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/webgl-solve2D.js"],
  outfile: bundle,
  bundle: true,
  format: "esm",
});
const browser = await browserCheck();
let result;
try {
  await browser.navigate("tests/performance.html");
  await browser.evaluate(
    `(async()=>{const {checkGlSolve2D}=await import('/${bundle}');checkGlSolve2D(${JSON.stringify(sources)}).then(result=>globalThis.__GL_SOLVE_RESULT__=result,error=>globalThis.__GL_SOLVE_RESULT__={passed:false,error:error.stack});return true;})()`,
  );
  let lastStage;
  const started = Date.now();
  for (;;) {
    let timer;
    const state = await Promise.race([
      browser.evaluate(
        "({stage:globalThis.__GL_SOLVE_PROGRESS__,result:globalThis.__GL_SOLVE_RESULT__})",
      ),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(Error(`Solve check stalled at ${lastStage}`)),
          60000,
        );
      }),
    ]).finally(() => clearTimeout(timer));
    if (state.stage !== lastStage) {
      console.log(state.stage);
      lastStage = state.stage;
    }
    if (state.result) {
      result = state.result;
      break;
    }
    if (Date.now() - started > 180000)
      throw Error(`Solve check exceeded time limit at ${lastStage}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(result.passed, true, result.error);
  assert.deepEqual(browser.errors, []);
  console.log(
    `PASS WebGL2 2D solve: ${result.stages.length} stage comparisons, maximum relative error ${result.maxRelativeError}`,
  );
} catch (error) {
  result = { ...result, passed: false, error: error.stack };
  throw error;
} finally {
  await writeFile(
    "test-results/webgl-solve.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  await browser.close();
  await unlink(bundle).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}
