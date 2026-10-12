import { readFile, readdir, stat, unlink } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import web from "../tinybuild.web.config.js";
import { writeAtomicFile as writeFile } from "./report-file.mjs";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const dist = resolve(root, "dist");
const inside = (path) => resolve(path).startsWith(dist + sep);
const metadata = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const retained = new Set(
  metadata.files
    .filter((name) => name.startsWith("dist/"))
    .map((name) => resolve(root, name)),
);
const pages = [resolve(root, "index.html")];
for (const bundle of web.additionalBundles)
  retained.add(resolve(root, bundle.outfile));
for (const asset of web.additionalAssets ?? [])
  retained.add(resolve(root, asset));
const testEntries = await readdir(resolve(root, "tests"), {
  recursive: true,
  withFileTypes: true,
});
for (const entry of testEntries)
  if (entry.isFile() && entry.name.endsWith(".html"))
    pages.push(resolve(entry.parentPath, entry.name));
for (const page of pages) {
  const html = await readFile(page, "utf8");
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const url = new URL(
      match[1],
      `https://local.invalid/${relative(root, page).split(sep).join("/")}`,
    );
    if (url.origin !== "https://local.invalid") continue;
    const asset = resolve(root, "." + decodeURIComponent(url.pathname));
    if (inside(asset)) retained.add(asset);
  }
}
// Follow emitted ESM imports so lazy renderers and worker/shared chunks stay
// deployable. Hashed chunks from previous builds become ordinary unused assets.
for (const path of retained) {
  if (!path.endsWith(".js")) continue;
  const code = await readFile(path, "utf8");
  for (const match of code.matchAll(
    /(?:\bfrom\s*|\bimport\s*\(|\bimport\s*)(["'])([^"']+)\1/g,
  )) {
    if (!match[2].startsWith(".")) continue;
    const dependency = resolve(path, "..", match[2]);
    if (!inside(dependency))
      throw Error(`Browser import is outside dist: ${dependency}`);
    retained.add(dependency);
  }
}
for (const path of retained) {
  if (!inside(path)) throw Error(`Build asset is outside dist: ${path}`);
  if (!(await stat(path)).isFile())
    throw Error(`Missing release asset: ${path}`);
}
const entries = await readdir(dist, { recursive: true, withFileTypes: true });
const obsolete = entries
  .filter((entry) => entry.isFile())
  .map((entry) => resolve(entry.parentPath, entry.name))
  .filter((path) => !retained.has(path));
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
  removedBytes: removed.reduce((sum, file) => sum + file.bytes, 0),
  removed,
};
console.log(
  `${report.applied ? "Removing" : "Would remove"} ${removed.length} unused build artifacts (${(report.removedBytes / 1024 / 1024).toFixed(1)} MiB); keeping all ${retained.size} package and browser-page assets.`,
);
if (report.applied) {
  for (const path of obsolete) {
    if (!inside(path)) throw Error(`Deletion is outside dist: ${path}`);
    await unlink(path);
  }
  await writeFile(
    resolve(root, "test-results/cleanup-dist.json"),
    JSON.stringify(report, null, 2),
  );
} else for (const file of removed) console.log(file.path);
