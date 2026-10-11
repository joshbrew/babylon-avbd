import { readFile } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";
import { workerReportMarkdown } from "./worker-report-view.mjs";
const input =
  process.argv.find((value) => value.startsWith("--input="))?.slice(8) ??
  "test-results/worker-performance.json";
const report = JSON.parse(await readFile(input, "utf8"));
if (!report.passed) throw Error("Worker measurements have not passed checks");
const path = "README.md",
  source = await readFile(path, "utf8");
const start = "<!-- worker-results:start -->",
  end = "<!-- worker-results:end -->";
const block = `${start}\n${workerReportMarkdown(report)}\n${end}`;
const next = source.includes(start)
  ? source.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block)
  : source.replace("![Worker comparisons", `${block}\n\n![Worker comparisons`);
if (next === source && !source.includes(start))
  throw Error("Worker report insertion point missing");
await writeFile(path, next);
console.log("Updated README worker tables from measured results");
