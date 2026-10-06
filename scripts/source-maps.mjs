import { unlink } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const sourceMapsEnabled =
  process.argv.includes("--sourcemap") || process.env.AVBD_SOURCEMAPS === "1";

export async function removeStaleSourceMap(outfile) {
  if (sourceMapsEnabled) return;
  const dist = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
  for (const name of [outfile + ".map", outfile.replace(/\.js$/, ".css.map")]) {
    const map = resolve(name);
    if (!map.startsWith(dist + sep) || !/\.(?:js|css)\.map$/.test(map))
      throw Error(`Source map is outside the build output: ${map}`);
    try {
      await unlink(map);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}
