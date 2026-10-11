import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { browserCheck } from "./browser-check.mjs";
const b = await browserCheck(),
  quick = process.argv.includes("--quick"),
  report = {
    date: new Date().toISOString(),
    results: [],
    method:
      "Fresh scene per mode, one step per frame, 120 pointer updates/s, no synthetic UI load",
  };
const terrainOnly = process.argv.includes("--terrain");
const navalOnly = process.argv.includes("--naval");
const gpuOnly = process.argv.includes("--gpu");
const selectedScene = terrainOnly
  ? "3d-static-terrain"
  : navalOnly
    ? "naval"
    : null;
if (selectedScene || gpuOnly) {
  const previous = JSON.parse(
    await readFile("test-results/worker-performance.json", "utf8"),
  );
  report.results = previous.results.filter((r) =>
    selectedScene ? r.scene !== selectedScene : r.backend !== "gpu",
  );
  report.previousRun = previous.date;
}
try {
  await b.navigate("tests/workers.html?scene=3d-sphere-contacts");
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate("globalThis.__WORKER_BENCH__?.ready")) break;
    if (b.errors.length) throw Error(b.errors.join("\n"));
    await new Promise((r) => setTimeout(r, 50));
  }
  const cases = selectedScene
    ? [{ scene: selectedScene, backend: "gpu", renderer: "webgpu" }]
    : quick
      ? [{ scene: "2d-pyramid", backend: "cpu", renderer: "webgpu" }]
      : [
          { scene: "3d-static-terrain", backend: "gpu", renderer: "webgpu" },
          { scene: "naval", backend: "gpu", renderer: "webgpu" },
          {
            scene: "showcase-box-columns-100k",
            backend: "gpu",
            renderer: "webgpu",
          },
          { scene: "2d-stress-pile-10k", backend: "gpu", renderer: "webgpu" },
          { scene: "3d-pyramid", backend: "gpu", renderer: "babylon" },
          { scene: "2d-pyramid", backend: "gpu", renderer: "babylon" },
          { scene: "3d-pyramid", backend: "cpu", renderer: "webgpu" },
          { scene: "2d-joint-grid", backend: "cpu", renderer: "webgpu" },
        ];
  for (let repeat = 1; repeat <= (quick ? 1 : 2); repeat++)
    for (const options of cases.filter(
      (c) => !gpuOnly || c.backend === "gpu",
    )) {
      console.log(
        `Measuring ${options.backend} ${options.scene} ${options.renderer}, repeat ${repeat}`,
      );
      const rows = await b.evaluate(
        `__WORKER_BENCH__.compare(${JSON.stringify(options)},${JSON.stringify({ warmup: quick ? 2 : 30, samples: quick ? 5 : 120 })})`,
      );
      for (const row of rows) {
        assert.deepEqual(row.errors, []);
        assert.ok(row.physicsMs?.samples > 0);
        assert.ok(row.pageDelayMs.samples > 0);
        assert.ok(!row.counters.overflow && !row.counters.clashes);
        report.results.push({ ...row, repeat });
        console.log(
          `${row.scope}: physics ${row.physicsMs.median.toFixed(2)} ms, CPU ${row.cpuSubmitMs.median.toFixed(2)} ms, UI p95 ${row.pageDelayMs.p95.toFixed(2)} ms`,
        );
      }
    }
  assert.deepEqual(b.errors, []);
  report.passed = true;
  if (process.platform === "win32") {
    const { stdout } = await promisify(execFile)(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "@{cpu=(Get-CimInstance Win32_Processor | Select-Object -ExpandProperty Name);gpus=@(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name)} | ConvertTo-Json -Compress",
      ],
      { windowsHide: true },
    );
    report.hardware = JSON.parse(stdout);
  }
  await b.screenshot("test-results/screenshots/worker-comparison.png");
  report.screenshot = "screenshots/worker-comparison.png";
  if (!quick)
    await writeFile(
      "test-results/worker-performance.json",
      JSON.stringify(report, null, 2),
    );
} finally {
  await b.close();
}
