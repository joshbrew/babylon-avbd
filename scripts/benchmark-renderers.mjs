import { browserCheck } from "./browser-check.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { rendererReportHTML } from "../tests/renderer-performance-view.js";
const browser = await browserCheck(),
  quick = process.argv.includes("--quick"),
  all = process.argv.includes("--all");
const report = { started: new Date().toISOString(), results: [], errors: [] };
try {
  await browser.navigate("tests/performance.html");
  for (let i = 0; i < 400; i++) {
    if (await browser.evaluate("!!globalThis.__BENCHMARK_VIEW__")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  await browser.evaluate("__BENCHMARK_VIEW__.suspendPreview()");
  await browser.evaluate(
    "(async()=>{globalThis.__RENDER_SESSION__=await __PERFORMANCE__.createRendererSession();})()",
  );
  const scenes = all
    ? await browser.evaluate("__PERFORMANCE__.scenes.map(s=>s.id)")
    : quick
      ? ["3d-sphere-contacts", "2d-triggers-and-masks"]
      : [
          "3d-sphere-contacts",
          "2d-mixed-shapes",
          "2d-stress-pile-10k",
          "showcase-chain-mail-1.6k",
          "3d-tearable-cloth",
          "showcase-ragdolls-on-cloth-24k",
          "showcase-box-columns-100k",
          "paper-walls-510k-4",
        ];
  for (let repeat = 1; repeat <= (quick ? 1 : 3); repeat++)
    for (const scene of scenes) {
      console.log(`Measuring ${scene}, repeat ${repeat}...`);
      const result = await browser.evaluate(
        `(async()=>{let timeout;try{return await Promise.race([__PERFORMANCE__.runRenderers(${JSON.stringify(scene)},{session:__RENDER_SESSION__,warmup:${quick ? 2 : 20},samples:${quick ? 3 : 30}}),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Renderer scene timed out: ${scene}')),120000);})]);}finally{clearTimeout(timeout);}})()`,
      );
      if (
        !result.passed ||
        !result.identicalState ||
        !result.finite ||
        result.errors.length ||
        result.records.babylon.some((r) => r.poseDownloads || r.matrixUpdates)
      )
        throw Error(JSON.stringify(result));
      report.results.push({ ...result, repeat });
      console.log(
        `PASS ${scene} repeat ${repeat}: direct draw ${result.webgpu.drawMs.median.toFixed(2)}ms; Babylon draw ${result.babylon.drawMs.median.toFixed(2)}ms + GPU copies ${result.babylon.copyMs.median.toFixed(2)}ms; identical physics`,
      );
    }
  report.completed = new Date().toISOString();
  await browser.evaluate("__RENDER_SESSION__.dispose()");
  report.adapter = report.results[0]?.adapter;
  if (process.platform === "win32") {
    const { stdout } = await promisify(execFile)(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion | ConvertTo-Json -Compress",
      ],
      { windowsHide: true },
    );
    const value = JSON.parse(stdout),
      cards = Array.isArray(value) ? value : [value],
      matching = cards.filter((c) =>
        c.Name.toLowerCase().includes(report.adapter.vendor),
      );
    if (matching.length === 1) {
      report.hardwareLabel = matching[0].Name;
      report.driver = matching[0].DriverVersion;
    }
  }
  if (browser.errors.length) throw Error(browser.errors.join("\n"));
  if (quick) {
    console.log(
      "PASS renderer benchmark: matched physics, real GPU draw/copy timestamps and separate CPU measurements",
    );
  } else {
    await writeFile(
      "test-results/renderer-performance.json",
      JSON.stringify(report, null, 2),
    );
    const screenshots = JSON.parse(
      await readFile("test-results/babylon-renderer.json", "utf8"),
    );
    await writeFile(
      "test-results/renderer-performance.html",
      rendererReportHTML(report, screenshots),
    );
  }
} finally {
  await browser.close();
}
