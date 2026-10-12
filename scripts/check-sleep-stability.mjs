import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/sleep-stability.js"],
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/sleep-stability.js",
});
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  const result = await b.evaluate(
    `(async()=>{const {checkRingSleeping}=await import('/.temp/sleep-stability.js');return checkRingSleeping({drag:${process.argv.includes("--drag")}});})()`,
  );
  if (process.argv.includes("--drag")) {
    result.startupGrab = await b.evaluate(
      `(async()=>{const {checkRingStartupGrab}=await import('/.temp/sleep-stability.js');return checkRingStartupGrab();})()`,
    );
  }
  const tail = result.samples.filter((s) => s.step >= 700);
  await writeAtomicFile(
    ".temp/sleep-stability-last.json",
    JSON.stringify(result, null, 2),
  );
  assert.ok(
    tail.every((s) => s.sleeping > 100),
    "Resting debris stays asleep during repeated anchor updates",
  );
  assert.ok(
    result.samples.every((s) => !s.overflow && !s.clashes && !s.wakeRequested),
    "Sleep connectivity and contact scheduling remain valid",
  );
  if (result.errors.length || b.errors.length)
    throw Error(JSON.stringify({ errors: result.errors, browser: b.errors }));
  await writeAtomicFile(
    "test-results/sleep-stability.json",
    JSON.stringify({ passed: true, ...result }, null, 2),
  );
  console.log(
    JSON.stringify({
      passed: true,
      roots: result.roots,
      tailSleeping: {
        min: Math.min(...tail.map((s) => s.sleeping)),
        max: Math.max(...tail.map((s) => s.sleeping)),
      },
    }),
  );
} finally {
  await b.close();
}
