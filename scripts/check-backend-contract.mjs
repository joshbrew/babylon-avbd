import "./prepare-webgl.mjs";
import { build } from "esbuild";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { checkReadmeExamples } from "./check-readme-examples.mjs";
import { resolve } from "node:path";

if (process.argv.includes("--webgl2") && process.argv.includes("--package"))
  throw Error(
    "WebGL2 is experimental repository code and is excluded from the package. Run --webgl2 separately.",
  );

await build({
  entryPoints: ["tests/backend-contract.js"],
  outfile: "dist/backend-contract.js",
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  plugins: process.argv.includes("--package")
    ? [
        {
          name: "packed-backend-contract",
          setup(b) {
            b.onResolve({ filter: /^\.\.\/src\/index\.js$/ }, () => ({
              path: resolve("dist/avbd.js"),
            }));
          },
        },
      ]
    : [],
});
const browser = await browserCheck();
const results = [];
try {
  await browser.navigate("tests/performance.html");
  await browser.evaluate(
    "import('/dist/backend-contract.js').then(m=>globalThis.backendContract=m)",
  );
  for (const backend of process.argv.includes("--webgl2")
    ? ["webgl2"]
    : ["cpu", "webgpu"])
    for (const dimension of [2, 3]) {
      for (const name of [
        "checkBackend",
        "checkFloor",
        "checkConstraints",
        "checkContacts",
        "checkSleeping",
        "checkForces",
        "checkShapeQueries",
      ]) {
        const result = await browser.evaluate(
          `backendContract.${name}('${backend}',${dimension})`,
        );
        results.push({ check: name, ...result });
        console.log(result);
      }
      if (dimension === 3) {
        const result = await browser.evaluate(
          `backendContract.checkConstraintFrames('${backend}')`,
        );
        results.push({ check: "checkConstraintFrames", ...result });
        console.log(result);
        results.push(
          await browser.evaluate(`backendContract.checkFabric('${backend}')`),
        );
        const heavy = await browser.evaluate(
          `backendContract.checkHeavyFloor('${backend}')`,
        );
        results.push({ check: "checkHeavyFloor", ...heavy });
        console.log(heavy);
      }
    }
  if (!process.argv.includes("--webgl2"))
    for (const dimension of [2, 3]) {
      const result = await browser.evaluate(
        `backendContract.checkCpuEventCapacity(${dimension})`,
      );
      results.push({ check: "checkCpuEventCapacity", ...result });
      console.log(result);
    }
  if (!process.argv.includes("--webgl2"))
    results.push(
      ...(await checkReadmeExamples(browser, {
        portableOnly: true,
        backends: ["cpu", "webgpu"],
      })),
    );
  assert.deepEqual(browser.errors, []);
} catch (error) {
  results.push({ passed: false, error: error.stack });
  throw error;
} finally {
  await mkdir("test-results", { recursive: true });
  await writeFile(
    process.argv.includes("--webgl2")
      ? "test-results/webgl-contract.json"
      : "test-results/backend-contract.json",
    JSON.stringify(
      { date: new Date().toISOString(), results, errors: browser.errors },
      null,
      2,
    ),
  );
  await browser.close();
  for (const path of [
    "dist/backend-contract.js",
    "dist/readme-scene-examples.js",
    "dist/readme-worker-example.js",
  ])
    await unlink(path).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
}
