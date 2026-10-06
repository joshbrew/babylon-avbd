import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck(),
  report = { date: new Date().toISOString(), runs: [] };
try {
  await browser.navigate("tests/performance.html");
  for (let i = 0; i < 400; i++) {
    if (await browser.evaluate("!!globalThis.__PERFORMANCE__")) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  report.adapter = await browser.evaluate("__PERFORMANCE__.info");
  for (const cache of [false, true, true, false]) {
    const run = await browser.evaluate(
      `__PERFORMANCE__.runSleepScheduling(true,360,30,{cacheAdjacencyKeys:${cache}})`,
    );
    report.runs.push(run);
    await writeFile(
      "test-results/rook-adjacency.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(
      JSON.stringify({
        cache,
        median: run.summary.median,
        awake: run.awake,
        finite: run.finite,
      }),
    );
  }
  report.errors = [
    ...browser.errors,
    ...(await browser.evaluate("__PERFORMANCE__.errors")),
  ];
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
  await writeFile(
    "test-results/rook-adjacency.json",
    JSON.stringify(report, null, 2) + "\n",
  );
} finally {
  await browser.close();
}
