import { readdir, readFile, stat, unlink, rmdir } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { writeAtomicFile as writeFile } from "./report-file.mjs";

// Keep current validation summaries and report inputs. Follow report links to
// retain screenshots used by published HTML and the README. Raw check summaries
// keep their measurements, but do not retain every diagnostic capture.
const root = fileURLToPath(new URL("../test-results/", import.meta.url));
const within = (path) => resolve(path).startsWith(resolve(root) + sep);
const roots = [
  "playgrounds.json",
  "galton-startup.json",
  "galton-pegs.json",
  "lab-timing.json",
  "lab-step-rate.json",
  "lab-sleep.json",
  "sleep-stability.json",
  "jointed-settling.json",
  "siege-damage.json",
  "demo-startup.json",
  "slingshot-input.json",
  "slingshot-game.json",
  "naval.json",
  "naval-performance.json",
  "terrain-import.json",
  "terrain.json",
  "terrain-cooking.json",
  "runtime-efficiency.json",
  "hploc-refit-performance.json",
  "webgpu-upload-performance.json",
  "color-bucket-performance.json",
  "movement-solve-performance.json",
  "connected-sleep-performance.json",
  "scene-sleep-performance.json",
  "pipeline-batching-performance.json",
  "small-group-performance.json",
  "command-encoding-performance.json",
  "scenes-static-terrain.json",
  "workers.json",
  "worker-cannon.json",
  "execution-ui.json",
  "worker-performance.json",
  "particle-capacity.json",
  "particle-capacity.html",
  "report.html",
  "solver-performance.html",
  "package-performance.html",
  "scenes.json",
  "solver-scenes.json",
  "solver-performance.json",
  "solver-paper.json",
  "hardware.json",
  "gpu.json",
  "backend-contract.json",
  "backend-comparison.json",
  "cpu-demos.json",
  "cpu-slingshot.json",
  "cpu-features.json",
  "webgl-broadphase.json",
  "webgl-contacts.json",
  "webgl-coloring.json",
  "webgl-solve.json",
  "webgl-world.json",
  "webgl-edits.json",
  "webgl-bounce.json",
  "webgl-sleeping.json",
  "webgl-contract.json",
  "webgl-demos.json",
  "webgl-scene-behavior.json",
  "webgl-readme.json",
  "compatibility-performance.json",
  "rook.json",
  "routes.json",
  "controls.json",
  "showcase-motion.json",
  "ragdoll-net.json",
  "tearable-cloth.json",
  "cloth-fragments.json",
  "feature-scenes.json",
  "voronoi-fracture.json",
  "chainmail.json",
  "policy-2d.json",
  "shapes-2d.json",
  "stress-2d.json",
  "paper-motion.json",
  "hploc-motion-hploc.json",
  "solver-hploc.json",
  "solver-ragdoll-collision.json",
  "solver-ragdoll-settled.json",
  "solver-sleep-batching.json",
  "package-performance.json",
  "native-api-performance.json",
  "capsule-performance.json",
  "power-state.txt",
  "benchmark-preview.json",
  "solver-selection.json",
  "castle.json",
  "improvements.json",
  "navigation.json",
  "babylon-readme.json",
  "solver-report-check.json",
  "web-suite.json",
  "library-build.json",
  "library-build-cdn.json",
  "package.json",
  "published-package.json",
  "contact-portability.json",
  "contact-performance.json",
  "contact-compatibility-features.json",
  "connected-phone-floor.json",
  "connected-phone-contacts.json",
  "connected-phone-demos.json",
  "connected-phone-scene-comparison.json",
  "connected-phone-step-rate.json",
  "package-report-check.json",
  "renderer-performance.json",
  "renderer-performance.html",
  "babylon-renderer.json",
  "renderer-report-check.json",
  "cleanup-results.json",
  "cleanup-dist.json",
];
const entries = await readdir(root, { recursive: true, withFileTypes: true });
const files = entries
  .filter((entry) => entry.isFile())
  .map((entry) => resolve(entry.parentPath, entry.name));
const available = new Set(files);
const retained = new Set(
  roots
    .map((name) => resolve(root, name))
    .filter((path) => available.has(path)),
);
// README images refer directly to results so publishing needs no copied assets.
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
const metadata = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const repository = new URL(
  metadata.repository.url.replace(/^git\+/, "").replace(/\.git$/, ""),
);
for (const match of readme.matchAll(/\[[^\]\n]*\]\(([^\s)]+)\)/g)) {
  const url = new URL(match[1], "https://local.invalid/README.md");
  let artifact = url.origin === "https://local.invalid" ? url.pathname : "";
  for (const [origin, prefix] of [
    ["https://raw.githubusercontent.com", `${repository.pathname}/HEAD/`],
    ["https://github.com", `${repository.pathname}/blob/HEAD/`],
  ])
    if (url.origin === origin && url.pathname.startsWith(prefix))
      artifact = "/" + url.pathname.slice(prefix.length);
  if (!artifact.startsWith("/test-results/")) continue;
  const linked = resolve(
    root,
    decodeURIComponent(artifact.slice("/test-results/".length)),
  );
  if (!within(linked)) throw Error(`Unsafe README link: ${match[1]}`);
  if (!available.has(linked))
    throw Error(`Missing README artifact: ${match[1]}`);
  retained.add(linked);
}
for (const path of retained) {
  if (!within(path))
    throw Error(`Result path is outside the results folder: ${path}`);
  if (!path.endsWith(".html")) continue;
  const html = await readFile(path, "utf8");
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const url = new URL(
      match[1].replaceAll("&amp;", "&"),
      `https://local.invalid/test-results/${relative(root, path).split(sep).join("/")}`,
    );
    if (
      url.origin !== "https://local.invalid" ||
      !url.pathname.startsWith("/test-results/")
    )
      continue;
    const linked = resolve(
      root,
      decodeURIComponent(url.pathname.slice("/test-results/".length)),
    );
    if (!within(linked)) throw Error(`Unsafe report link: ${match[1]}`);
    if (!available.has(linked))
      throw Error(`Missing report artifact: ${match[1]}`);
    retained.add(linked);
  }
}
// Remove optional capture references when the image is not published. Numerical
// evidence remains intact and saved summaries do not point at deleted files.
const updatedSummaries = [];
for (const path of retained) {
  if (!path.endsWith(".json") || path === resolve(root, "cleanup-results.json"))
    continue;
  let changed = false;
  const prune = (value) => {
    if (
      typeof value === "string" &&
      /^(?:(?:\/)?test-results\/)?screenshots\//.test(value)
    ) {
      const linked = resolve(root, value.replace(/^\/?test-results\//, ""));
      if (!within(linked)) throw Error(`Unsafe result screenshot: ${value}`);
      if (!retained.has(linked)) {
        changed = true;
        return undefined;
      }
    }
    if (Array.isArray(value))
      return value.map(prune).filter((v) => v !== undefined);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .map(([key, item]) => [key, prune(item)])
          .filter(([, item]) => item !== undefined),
      );
    return value;
  };
  const value = prune(JSON.parse(await readFile(path, "utf8")));
  if (changed) updatedSummaries.push({ path, value });
}
const obsolete = files.filter((path) => !retained.has(path));
const removed = await Promise.all(
  obsolete.map(async (path) => ({
    path: relative(root, path).split(sep).join("/"),
    bytes: (await stat(path)).size,
  })),
);
const report = {
  date: new Date().toISOString(),
  applied: process.argv.includes("--apply"),
  retained: retained.size,
  removedFiles: removed.length,
  removedBytes: removed.reduce((sum, item) => sum + item.bytes, 0),
  removed,
  prunedCaptureSummaries: updatedSummaries.map(({ path }) =>
    relative(root, path).split(sep).join("/"),
  ),
};
console.log(
  `${report.applied ? "Removing" : "Would remove"} ${report.removedFiles} obsolete files (${(report.removedBytes / 1024 / 1024).toFixed(1)} MiB); keeping ${report.retained} report assets and current summaries.`,
);
if (report.applied) {
  for (const { path, value } of updatedSummaries)
    await writeFile(path, JSON.stringify(value, null, 2));
  for (const path of obsolete) {
    if (!within(path))
      throw Error(`Deletion is outside the results folder: ${path}`);
    await unlink(path);
  }
  report.removedDirectories = [];
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(entry.parentPath, entry.name))
    .sort((a, b) => b.length - a.length);
  for (const path of directories) {
    if (!within(path))
      throw Error(`Directory is outside the results folder: ${path}`);
    try {
      // Only remove empty directories; never recursively delete a tree.
      await rmdir(path);
      report.removedDirectories.push(relative(root, path).split(sep).join("/"));
    } catch (error) {
      if (!["ENOTEMPTY", "EEXIST"].includes(error.code)) throw error;
    }
  }
  await writeFile(
    resolve(root, "cleanup-results.json"),
    JSON.stringify(report, null, 2),
  );
} else {
  for (const file of removed) console.log(file.path);
}
