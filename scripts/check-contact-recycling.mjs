import assert from "node:assert/strict";
import { build } from "esbuild";
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeReport } from "./report-file.mjs";
await mkdir(".temp", { recursive: true });
await build({
  entryPoints: ["tests/contact-recycling.js"],
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/contact-recycling.js",
  plugins: process.argv.includes("--package")
    ? [
        {
          name: "packed-recycling-contract",
          setup(b) {
            b.onResolve(
              { filter: /src\/native\/(?:scenes|pipeline)\.js$/ },
              () => ({ path: resolve("dist/native.js") }),
            );
          },
        },
      ]
    : [],
});
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  const result = await b.evaluate(
    `import('/.temp/contact-recycling.js').then(m=>m.checkContactRecycling({portable:${process.argv.includes("--portable")}}))`,
  );
  assert.deepEqual(b.errors, []);
  const suffix = process.argv.includes("--package")
    ? "-package"
    : process.argv.includes("--portable")
      ? "-portable"
      : "";
  await writeReport(`test-results/contact-recycling${suffix}.json`, {
    passed: true,
    date: new Date().toISOString(),
    result,
  });
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(
    JSON.stringify(b.logs.filter((l) => l.level !== "debug").slice(0, 5)),
  );
  throw error;
} finally {
  await b.close();
}
