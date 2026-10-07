import {
  readdir,
  readFile,
  stat,
  unlink,
  rmdir,
  writeFile,
} from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Keep current validation summaries and report inputs. Follow report links to
// retain their screenshots, including those linked from the main README;
// experimental runs and unlinked captures can go.
const root = fileURLToPath(new URL("../test-results/", import.meta.url));
const within = (path) => resolve(path).startsWith(resolve(root) + sep);
const roots = [
  "report.html",
  "solver-performance.html",
  "package-performance.html",
  "scenes.json",
  "solver-scenes.json",
  "solver-performance.json",
  "solver-paper.json",
  "hardware.json",
  "gpu.json",
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
};
console.log(
  `${report.applied ? "Removing" : "Would remove"} ${report.removedFiles} obsolete files (${(report.removedBytes / 1024 / 1024).toFixed(1)} MiB); keeping ${report.retained} report assets and current summaries.`,
);
if (report.applied) {
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
