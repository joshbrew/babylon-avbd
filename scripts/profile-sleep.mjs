import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck();
const report = { date: new Date().toISOString(), runs: [] };
try {
  await browser.navigate("tests/performance.html");
  for (let i = 0; i < 300; i++) {
    if (await browser.evaluate("!!globalThis.__PERFORMANCE__")) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  report.adapter = await browser.evaluate("__PERFORMANCE__.info");
  for (let repeat = 0; repeat < 3; repeat++)
    for (const batch of repeat % 2 ? [true, false] : [false, true]) {
      const result = await browser.evaluate(
        `__PERFORMANCE__.runSleepScheduling(${batch})`,
      );
      report.runs.push({ ...result, repeat });
      await writeFile(
        "test-results/solver-sleep-batching.json",
        JSON.stringify(report, null, 2),
      );
      console.log(JSON.stringify({ batch, repeat, summary: result.summary }));
    }
  report.errors = [
    ...browser.errors,
    ...(await browser.evaluate("__PERFORMANCE__.errors")),
  ];
  if (report.errors.length) throw Error(report.errors.join("\n"));
  report.summary = Object.fromEntries(
    [false, true].map((batch) => {
      const samples = report.runs
        .filter((r) => r.batchPasses === batch)
        .flatMap((r) => r.samples.map((p) => p.total));
      return [
        batch ? "batched" : "separate",
        {
          n: samples.length,
          mean: samples.reduce((s, x) => s + x, 0) / samples.length,
        },
      ];
    }),
  );
  await writeFile(
    "test-results/solver-sleep-batching.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report.summary));
} finally {
  await browser.close();
}
