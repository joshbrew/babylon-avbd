import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/sleeping-impact-scenes.js"],
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/sleeping-impact-scenes.js",
});
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  const results = [];
  for (const scene of ["paper-walls-510k-3", "paper-walls-510k-4"]) {
    const result = await b.evaluate(
      `(async()=>{const m=await import('/.temp/sleeping-impact-scenes.js');return m.checkStartupImpact('${scene}');})()`,
    );
    results.push(result);
    console.log(JSON.stringify(result));
  }
  assert.deepEqual(b.errors, []);
  await writeAtomicFile(
    ".temp/sleeping-impact-scenes-last.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
} finally {
  await b.close();
}
