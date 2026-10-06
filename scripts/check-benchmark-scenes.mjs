import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck();
try {
  await browser.navigate("tests/performance.html");
  for (let i = 0; i < 300; i++) {
    const state = await browser.evaluate(
      "({ready:!!globalThis.__BENCHMARK_VIEW__,error:globalThis.__PERFORMANCE_SETUP_ERROR__})",
    );
    if (state.error) throw Error(state.error);
    if (state.ready) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const inventory = await browser.evaluate(
    "__PERFORMANCE__.scenes.map(s=>s.id)",
  );
  if (
    !inventory.includes("3d-tearable-cloth") ||
    !inventory.includes("2d-mixed-shapes") ||
    ![
      "2d-sleeping-pile",
      "2d-limited-hinges",
      "3d-limited-hinges",
      "2d-triggers-and-masks",
      "3d-triggers-and-masks",
      "3d-voronoi-demolition",
      "2d-slingshot-siege",
    ].every((id) => inventory.includes(id)) ||
    inventory.length < 68 ||
    new Set(inventory).size !== inventory.length
  )
    throw Error("Incomplete scene catalog");
  await browser.evaluate("document.querySelector('#run-all').click()");
  let delivered = 0,
    report;
  for (let i = 0; i < 1800; i++) {
    const progress = await browser.evaluate(
      "({done:__BENCHMARK_VIEW__.state.done,results:__BENCHMARK_VIEW__.state.results.map(r=>({scene:r.scene,passed:r.passed,error:r.error,ms:r.summary?.total.mean}))})",
    );
    for (const result of progress.results.slice(delivered))
      console.log(
        `${result.passed ? "PASS" : "FAIL"} ${result.scene}: ${result.ms?.toFixed(3) ?? result.error} ms`,
      );
    delivered = progress.results.length;
    if (progress.done) {
      report = await browser.evaluate("__BENCHMARK_VIEW__.state");
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!report) throw Error("All-scene benchmark timeout");
  report.browserErrors = browser.errors;
  for (const [scene, expected] of [
    ["3d-mixed-sizes-1k", "grid"],
    ["3d-mixed-sizes-10k", "hploc"],
    ["3d-mixed-sizes-50k", "hploc"],
    ["paper-walls-510k-4", "grid"],
  ])
    if (report.results.find((r) => r.scene === scene)?.broadphase !== expected)
      throw Error(
        `Automatic collision choice for ${scene} should be ${expected}`,
      );
  await writeFile(
    "test-results/solver-scenes.json",
    JSON.stringify(report, null, 2),
  );
  for (const width of [1440, 390]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const ui = await browser.evaluate(
      "({rows:document.querySelectorAll('#results tr').length,scroll:document.documentElement.scrollWidth,width:innerWidth})",
    );
    if (ui.rows !== inventory.length || ui.scroll > ui.width)
      throw Error(JSON.stringify(ui));
    await browser.screenshot(
      `test-results/screenshots/browser-benchmarks-${width}.png`,
    );
  }
  if (
    report.cancelled ||
    report.results.length !== inventory.length ||
    report.errors.length ||
    browser.errors.length ||
    report.results.some(
      (r) => !r.passed || r.samples.length !== 30 || r.verifiedSteps !== 90,
    ) ||
    new Set(report.results.map((r) => r.scene)).size !== inventory.length
  )
    throw Error(
      "Incomplete or invalid scene benchmarks: " + report.errors.join("\n"),
    );
  console.log(
    `PASS all ${inventory.length} browser benchmarks: ${inventory.length * 90} verified fixed steps, ${inventory.length * 30} distinct GPU profiles, desktop/mobile fit`,
  );
} finally {
  await browser.close();
}
