import { webglContactSources } from "./webgl-contact-math.mjs";
import { build } from "esbuild";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { contactFragment } from "../src/webgl/narrowphase.js";
const sources = {
  2: await webglContactSources(2),
  3: await webglContactSources(3),
};
await mkdir(".temp", { recursive: true });
for (const dimension of [2, 3])
  for (const { code, variant } of typeof sources[dimension].glsl === "string"
    ? [{ code: sources[dimension].glsl, variant: "all" }]
    : Object.entries(sources[dimension].glsl).map(([variant, code]) => ({
        variant,
        code,
      })))
    await writeFile(
      `.temp/webgl-contacts-${dimension}d-${variant}.glsl`,
      contactFragment(dimension, code, variant),
    );
const bundle = ".temp/webgl-contact-test.js";
await build({
  entryPoints: ["tests/webgl-contacts.js"],
  outfile: bundle,
  bundle: true,
  format: "esm",
});
const browser = await browserCheck();
let result;
try {
  await browser.navigate("tests/performance.html");
  await browser.evaluate(
    `(async()=>{const {checkGlContacts}=await import('/${bundle}');checkGlContacts(${JSON.stringify(sources)}).then(result=>globalThis.__GL_CONTACT_RESULT__=result,error=>globalThis.__GL_CONTACT_RESULT__={error:error.stack});return true;})()`,
  );
  let lastStage;
  const started = Date.now();
  for (;;) {
    let timer;
    const state = await Promise.race([
      browser.evaluate(
        "({stage:globalThis.__GL_CONTACT_PROGRESS__,result:globalThis.__GL_CONTACT_RESULT__})",
      ),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(Error(`Contact check stalled at ${lastStage}`)),
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
      throw Error(`Contact check exceeded its time limit at ${lastStage}`);
    await new Promise((r) => setTimeout(r, 100));
  }
  if (result.error) throw Error(result.error);
  assert.equal(result.passed, true);
  assert.deepEqual(browser.errors, []);
  await writeFile(
    "test-results/webgl-contacts.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  for (const row of result.rows)
    console.log(
      `PASS WebGL2 ${row.dimension}D contacts vs WebGPU: ${row.contactPoints} points, ${row.candidatePairs} pairs, maximum error ${row.maxError}`,
    );
} catch (error) {
  result = { ...result, passed: false, error: error.stack };
  await writeFile(
    "test-results/webgl-contacts.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  throw error;
} finally {
  await browser.close();
  await unlink(bundle).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
}
