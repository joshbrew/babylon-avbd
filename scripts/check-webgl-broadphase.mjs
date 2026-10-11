import { build } from "esbuild";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
await mkdir(".temp", { recursive: true });
const bundle = ".temp/webgl-broadphase-test.js";
await build({
  entryPoints: ["tests/webgl-broadphase.js"],
  outfile: bundle,
  bundle: true,
  format: "esm",
});
const browser = await browserCheck();
try {
  await browser.navigate("tests/performance.html");
  const result = await browser.evaluate(
    `(async()=>{const {checkGlBroadphase}=await import('/${bundle}');return await checkGlBroadphase();})()`,
  );
  assert.equal(result.passed, true);
  assert.deepEqual(browser.errors, []);
  await writeFile(
    "test-results/webgl-broadphase.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  for (const row of result.rows)
    console.log(
      `PASS WebGL2 ${row.dimension}D ${row.name}: ${row.bodies} bodies, ${row.adjacencyEntries} candidate entries, ${row.overflowBodies} overflowing bodies`,
    );
} finally {
  await browser.close();
  await unlink(bundle).catch((e) => {
    if (e.code !== "ENOENT") throw e;
  });
}
