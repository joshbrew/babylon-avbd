import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, posix } from "node:path";
import { createHash } from "node:crypto";
const commit = "b3675dea83c78aba9644b059975f48285bf02a47",
  root = resolve("reference/three-avbd");
const response = await fetch(
  `https://api.github.com/repos/sbobyn/three-avbd/git/trees/${commit}?recursive=1`,
);
if (!response.ok) throw Error(`Upstream tree: ${response.status}`);
const tree = await response.json(),
  entries = new Map(tree.tree.map((x) => [x.path, x]));
const known = new Set([
  ...JSON.parse(await readFile(resolve(root, "sources.json"), "utf8")).map(
    (s) => s.path,
  ),
  ...JSON.parse(
    await readFile(resolve(root, "runtime-sources.json"), "utf8"),
  ).files.map((s) => s.path),
]);
const pending = ["src/avbd3d/bench-scenes.ts", "src/avbd2d/gpu/sim.ts"],
  visited = new Set(),
  files = [];
while (pending.length) {
  const path = pending.pop();
  if (visited.has(path)) continue;
  visited.add(path);
  let bytes,
    downloaded = false;
  try {
    bytes = await readFile(resolve(root, path));
  } catch {
    const r = await fetch(
      `https://raw.githubusercontent.com/sbobyn/three-avbd/${commit}/${path}`,
    );
    if (!r.ok) throw Error(`${path}: ${r.status}`);
    bytes = Buffer.from(await r.arrayBuffer());
    downloaded = true;
  }
  const sha = createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
  if (sha !== entries.get(path)?.sha) throw Error(`Integrity failure: ${path}`);
  if (downloaded) {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), bytes);
  }
  if (!known.has(path)) files.push({ path, sha });
  for (const m of bytes
    .toString()
    .matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g))
    if (m[1].startsWith("."))
      pending.push(posix.normalize(posix.join(posix.dirname(path), m[1])));
}
await writeFile(
  resolve(root, "demo-sources.json"),
  JSON.stringify(
    { commit, files: files.sort((a, b) => a.path.localeCompare(b.path)) },
    null,
    2,
  ) + "\n",
);
console.log(
  `Verified ${visited.size} dependencies; ${files.length} showcase files.`,
);
