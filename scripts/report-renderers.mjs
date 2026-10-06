import { readFile, writeFile } from "node:fs/promises";
import { rendererReportHTML } from "../tests/renderer-performance-view.js";
const report = JSON.parse(
  await readFile("test-results/renderer-performance.json", "utf8"),
);
const screenshots = JSON.parse(
  await readFile("test-results/babylon-renderer.json", "utf8"),
);
await writeFile(
  "test-results/renderer-performance.html",
  rendererReportHTML(report, screenshots),
);
console.log("Renderer report updated from saved measurements.");
