import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { packageReportMarkup } from "../tests/package-performance-view.js";
await build({
  entryPoints: ["tests/performance-entry.js"],
  outfile: "dist/performance.js",
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
});
const browser = await browserCheck();
try {
  await browser.navigate("tests/performance.html");
  const result = await browser.evaluate(`(async()=>{
    for(let i=0;i<200&&!globalThis.__BENCHMARK_VIEW__;i++){
      if(globalThis.__PERFORMANCE_SETUP_ERROR__)throw Error(__PERFORMANCE_SETUP_ERROR__);
      await new Promise(r=>setTimeout(r,100));
    }
    if(!globalThis.__BENCHMARK_VIEW__)throw Error('Performance page did not initialize');
    document.querySelector('#repeats').value='3';
    return __BENCHMARK_VIEW__.runPackage();
  })()`);
  await browser.evaluate("__BENCHMARK_VIEW__.suspendPreview()");
  // Retain the raw renderer string as evidence for the saved hardware label.
  if (result.graphicsRenderer?.includes("RTX 4070 Laptop GPU"))
    result.hardwareLabel = "NVIDIA GeForce RTX 4070 Laptop GPU";
  await writeFile(
    "test-results/package-performance.json",
    JSON.stringify(result, null, 2),
  );
  if (
    result.runs.some(
      (r) =>
        !r.readback.identicalPoses ||
        r.nativeEdits?.some((e) => !e.identicalSelectedRecords) ||
        r.nativeEdits?.some(
          (e) => e.motion && !e.motion.identicalSelectedRecords,
        ) ||
        r.nativeOverhead?.some(
          (e) =>
            !e.properties.identicalSelectedRecords || !e.queries.identicalHits,
        ) ||
        r.sleeping?.finite === false ||
        r.sleeping2D?.finite === false,
    ) ||
    browser.errors.length
  )
    throw Error(JSON.stringify({ result, errors: browser.errors }));
  console.log(JSON.stringify(result, null, 2));
  await writeFile(
    "test-results/package-performance.html",
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Native GPU API benchmarks</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#203349;background:#f5f7fa;margin:0}main{max-width:1100px;padding:28px;margin:auto}table{border-collapse:collapse;width:100%;background:white}th,td{text-align:right;padding:12px;border-bottom:1px solid #dce4eb}th:first-child,td:first-child{text-align:left}.scroll{overflow:auto}a{color:#285bc4}details{padding:16px;background:white}h1,h3{line-height:1.3}</style><main><nav><a href="../">Main page</a> · <a href="../tests/performance.html">Run your own benchmark</a> · <a href="solver-performance.html">Paper comparisons</a></nav><h1>Native GPU API benchmarks</h1>${packageReportMarkup(result)}<p><a href="package-performance.json">Raw measurements</a></p></main></html>`,
  );
  await browser.evaluate(
    "document.querySelector('#package-results').scrollIntoView({block:'start'})",
  );
  await browser.screenshot(
    "test-results/screenshots/package-performance-browser.png",
  );
  await browser.navigate("test-results/package-performance.html");
  for (let i = 0; i < 100; i++) {
    const ready = await browser.evaluate(
      "location.pathname.endsWith('/package-performance.html')&&document.readyState==='complete'",
    );
    if (ready) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  await browser.screenshot(
    "test-results/screenshots/package-performance-report.png",
  );
} finally {
  await browser.close();
}
