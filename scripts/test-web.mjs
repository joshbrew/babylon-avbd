import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(new URL("../test-results/", import.meta.url), { recursive: true });
const checks = [
  "build",
  "check-contact-portability",
  "check-scenes",
  "check-benchmark-scenes",
  "check-benchmark-preview",
  "check-solver-selection",
  "check-2d-stress",
  "check-shapes-2d",
  "check-policy2d",
  "check-feature-scenes",
  "check-babylon-renderer",
  "benchmark-renderers",
  "check-renderer-report",
  "check-voronoi-fracture",
  "check-chainmail",
  "check-paper-scenes",
  "check-hploc-motion",
  "check-showcase-motion",
  "check-ragdoll-net",
  "check-tearable-cloth",
  "check-cloth-fragments",
  "check-rook",
  "check-controls",
  "check-castle",
  "check-castle-layout",
  "check-routes",
  "check-improvements",
  "report-solver",
  "check-babylon-docs",
  "check-package-report",
  "report-web",
  "check-navigation",
  "check-report",
  "check-solver-report",
];
const reportPath = new URL("../test-results/web-suite.json", import.meta.url);
const resumeFrom = process.argv
  .find((arg) => arg.startsWith("--from="))
  ?.slice(7);
let report = { started: new Date().toISOString(), checks: [] };
if (resumeFrom !== undefined) {
  const index = checks.indexOf(resumeFrom);
  if (index < 0) throw Error(`Unknown browser check: ${resumeFrom}`);
  if (index > 0) {
    report = JSON.parse(await readFile(reportPath, "utf8"));
    if (
      !checks
        .slice(0, index)
        .every(
          (name, i) =>
            report.checks[i]?.name === name && report.checks[i]?.passed,
        )
    )
      throw Error(
        "Cannot resume: preceding browser checks are missing or failed",
      );
    report.checks = report.checks.slice(0, index);
    (report.resumes ??= []).push({
      from: resumeFrom,
      date: new Date().toISOString(),
    });
  }
}
for (const name of checks.slice(report.checks.length)) {
  console.log(`Browser suite: ${name}`);
  const start = performance.now();
  const args = [`scripts/${name}.mjs`];
  if (name === "check-babylon-renderer") args.push("--all");
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  report.checks.push({
    name,
    passed: code === 0,
    elapsedMs: performance.now() - start,
  });
  report.passed =
    report.checks.length === checks.length &&
    report.checks.every((c) => c.passed);
  report.status =
    code !== 0 ? "failed" : report.passed ? "complete" : "running";
  report.updated = new Date().toISOString();
  if (report.status !== "running") report.completed = report.updated;
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  if (code !== 0) process.exit(code);
}
console.log(
  "PASS complete browser suite: all GPU scene views and benchmark scenes, motion, controls, app routes and responsive reports",
);
