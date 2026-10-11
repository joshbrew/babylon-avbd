import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
execFileSync(
  process.execPath,
  [
    "--experimental-transform-types",
    fileURLToPath(new URL("./generate-webgl-math.mjs", import.meta.url)),
  ],
  { stdio: "inherit" },
);
