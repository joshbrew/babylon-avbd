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
await run(["scripts/check-backend-contract.mjs"]);
await run(["scripts/build.mjs"]);
for (const script of [
  "check-cpu-demos",
  "check-cpu-features",
  "check-cpu-slingshot",
  "check-webgl-broadphase",
  "check-webgl-coloring",
  "check-webgl-demos",
  "check-webgl-scene-behavior",
  "check-compatibility-performance",
])
  await run([`scripts/${script}.mjs`]);
for (const script of [
  "check-webgl-contacts",
  "check-webgl-solve",
  "check-webgl-world",
  "check-webgl-edits",
  "check-webgl-bounce",
  "check-webgl-sleeping",
])
  await run(["--experimental-transform-types", `scripts/${script}.mjs`]);
await run(["scripts/check-backend-contract.mjs", "--webgl2"]);
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
