// Filesystem checks cannot run on the GPU. No CPU simulation is executed here.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sources from "../reference/three-avbd/sources.json" with { type: "json" };
import runtime from "../reference/three-avbd/runtime-sources.json" with { type: "json" };
import demos from "../reference/three-avbd/demo-sources.json" with { type: "json" };
const files = new Map(
  [...sources, ...runtime.files, ...demos.files].map((f) => [f.path, f.sha]),
);
for (const [path, sha] of files) {
  const bytes = await readFile(
    new URL("../reference/three-avbd/" + path, import.meta.url),
  );
  if (
    createHash("sha1")
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest("hex") !== sha
  )
    throw Error(`Pinned source changed: ${path}`);
}
console.log(
  `PASS source integrity: ${files.size} unchanged upstream files; no CPU simulation`,
);
