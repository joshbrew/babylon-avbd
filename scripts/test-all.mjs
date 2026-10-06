import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(new URL("../test-results/", import.meta.url), { recursive: true });

async function run(args) {
  const child = spawn(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (code !== 0) process.exit(code);
}

await run(["scripts/check-reference-integrity.mjs"]);
await run(["scripts/test-gpu.mjs"]);
await run(["scripts/check-package.mjs"]);
await run([
  "node_modules/typescript/bin/tsc",
  "--noEmit",
  "--strict",
  "--skipLibCheck",
  "--module",
  "nodenext",
  "--target",
  "es2022",
  "tests/package-api-types.ts",
]);
if (process.argv.includes("--strict"))
  await run(["scripts/check-babylon-docs.mjs"]);
