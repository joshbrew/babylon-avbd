import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, posix } from "node:path";
import { createHash } from "node:crypto";
const commit = "b3675dea83c78aba9644b059975f48285bf02a47";
const root = resolve("reference/three-avbd");
const tree = await fetch(
  `https://api.github.com/repos/sbobyn/three-avbd/git/trees/${commit}?recursive=1`,
).then((r) => r.json());
const entries = new Map(tree.tree.map((x) => [x.path, x]));
const original = new Set(
  JSON.parse(await readFile(resolve(root, "sources.json"), "utf8")).map(
    (s) => s.path,
  ),
);
const pending = ["src/avbd3d/gpu/solver.ts", "src/avbd3d/shapes.ts"];
const visited = new Set(),
  added = [];
while (pending.length) {
  const path = pending.pop();
  if (visited.has(path)) continue;
  visited.add(path);
  let bytes,
    downloaded = false;
  try {
    bytes = await readFile(resolve(root, path));
  } catch {
    const response = await fetch(
      `https://raw.githubusercontent.com/sbobyn/three-avbd/${commit}/${path}`,
    );
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
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
  if (!original.has(path)) added.push({ path, sha });
  for (const match of bytes
    .toString()
    .matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)) {
    if (match[1].startsWith("."))
      pending.push(posix.normalize(posix.join(posix.dirname(path), match[1])));
  }
}
await writeFile(
  resolve(root, "runtime-sources.json"),
  JSON.stringify(
    { commit, files: added.sort((a, b) => a.path.localeCompare(b.path)) },
    null,
    2,
  ) + "\n",
);
console.log(
  `Verified ${visited.size} dependencies; added ${added.length} runtime files.`,
);
