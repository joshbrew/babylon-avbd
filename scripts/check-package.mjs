import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  rm,
  access,
} from "node:fs/promises";
import { createContext, runInContext } from "node:vm";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
const exec = promisify(execFile),
  require = createRequire(import.meta.url);
const npm =
  process.env.npm_execpath ??
  join(
    dirname(
      require.resolve("npm/package.json", {
        paths: [
          process.execPath.replace(/node(?:\.exe)?$/, "node_modules"),
          process.cwd(),
        ],
      }),
    ),
    "bin/npm-cli.js",
  );
for (const mode of [[], ["--cdn"]])
  await exec(process.execPath, ["scripts/build-library.mjs", ...mode], {
    windowsHide: true,
  });
const { stdout } = await exec(
  process.execPath,
  [npm, "pack", "--dry-run", "--ignore-scripts", "--json"],
  { windowsHide: true },
);
const pack = JSON.parse(stdout)[0],
  files = pack.files.map((f) => f.path);
assert.ok(
  files.every((file) => !file.endsWith(".map")),
  "Source maps must not ship in the package",
);
assert.ok(
  files.includes("dist/avbd.js") &&
    files.includes("dist/avbd.global.js") &&
    files.includes("dist/NOTICE"),
);
assert.ok(
  files.every((f) =>
    /^(?:dist\/avbd(?:\.global)?\.(?:js|d\.ts)|dist\/native\.(?:js|d\.ts)|dist\/(?:babylonAvbd|nativeScenes|gpuDevice)\.d\.ts|dist\/NOTICE|LICENSE|README\.md|tests\/README\.md|docs\/(?:README|BABYLON_API|HPLOC|RELEASE)\.md|package\.json)$/.test(
      f,
    ),
  ),
  JSON.stringify(files),
);
const metadata = JSON.parse(await readFile("package.json", "utf8"));
assert.equal(metadata.name, "avbd-babylon");
function exportTargets(value) {
  return typeof value === "string"
    ? [value]
    : Object.values(value).flatMap(exportTargets);
}
for (const target of exportTargets(metadata.exports))
  assert.ok(
    files.includes(target.replace(/^\.\//, "")),
    `Export target missing from tarball: ${target}`,
  );
assert.equal(pack.version, metadata.version);
assert.ok(
  files.includes("LICENSE") && files.includes("tests/README.md"),
  "license and linked test guide ship with the package",
);
const notices = await readFile("dist/NOTICE", "utf8");
for (const author of ["Steven Bobyn", "Chris Giles", "Erin Catto"])
  assert.ok(notices.includes(author), `missing attribution for ${author}`);
assert.equal(
  Object.keys(metadata.dependencies ?? {}).length,
  0,
  "no runtime dependencies",
);
const exports = await import("../dist/avbd.js");
const context = createContext({});
runInContext(await readFile("dist/avbd.global.js", "utf8"), context);
for (const key of [
  "AvbdPhysics",
  "AvbdPhysicsAggregate",
  "AvbdPhysicsBody",
  "AvbdShapeType",
  "createWebGPUDevice",
  "prepareWebGPUDevice3D",
  "AvbdPhysicsConstraint",
  "AvbdScene2D",
  "AvbdScene3D",
]) {
  assert.ok(exports[key], `ESM export ${key}`);
  assert.ok(context.AVBD[key], `browser global ${key}`);
}
for (const suffix of ["", "-cdn"]) {
  const manifest = JSON.parse(
    await readFile(`test-results/library-build${suffix}.json`, "utf8"),
  );
  assert.ok(
    manifest.inputs.every((f) => !f.includes("node_modules/@babylonjs/")),
  );
  assert.ok(
    manifest.inputs.every(
      (f) => !/(?:Demo|gpuStress|canonicalLab|avbd\.wgsl)/.test(f),
    ),
  );
}
// Check the artifact consumers install, including optional-peer behavior.
const tempRoot = resolve(".temp");
await mkdir(tempRoot, { recursive: true });
const consumer = await mkdtemp(join(tempRoot, "package-consumer-"));
try {
  const packed = JSON.parse(
    (
      await exec(
        process.execPath,
        [
          npm,
          "pack",
          "--ignore-scripts",
          "--json",
          "--pack-destination",
          consumer,
        ],
        { windowsHide: true },
      )
    ).stdout,
  )[0];
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  await exec(
    process.execPath,
    [
      npm,
      "install",
      join(consumer, packed.filename),
      "--prefix",
      consumer,
      "--ignore-scripts",
      "--offline",
      "--no-audit",
      "--no-fund",
      "--cache",
      resolve(".npm-cache"),
    ],
    { windowsHide: true },
  );
  const installed = await import(
    pathToFileURL(join(consumer, "node_modules/avbd-babylon/dist/avbd.js")).href
  );
  assert.equal(typeof installed.AvbdScene2D, "function");
  assert.equal(typeof installed.AvbdPhysics.create, "function");
  const native = await import(
    pathToFileURL(join(consumer, "node_modules/avbd-babylon/dist/native.js"))
      .href
  );
  assert.equal(native.AvbdScene2D, installed.AvbdScene2D);
  assert.equal(native.createWebGPUDevice, installed.createWebGPUDevice);
  assert.equal(native.prepareWebGPUDevice3D, installed.prepareWebGPUDevice3D);
  await writeFile(
    join(consumer, "native.ts"),
    `import { AvbdScene2D, AvbdScene3D, createWebGPUDevice } from "avbd-babylon/native";
async function use() {
  const { device } = await createWebGPUDevice();
  const scene = new AvbdScene2D();
  const circle = scene.addCircle(1, { restitution: 0.5 });
  const gpu = scene.createSolver(device);
  gpu.setLinearVelocity(circle, [1, 0]);
  // @ts-expect-error Body handles are numbers, not strings.
  gpu.setLinearVelocity("wrong", [1, 0]);
  gpu.destroy();
  new AvbdScene3D().createSolver(device).destroy();
}
`,
  );
  await exec(
    process.execPath,
    [
      resolve("node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--module",
      "nodenext",
      "--target",
      "es2022",
      join(consumer, "native.ts"),
    ],
    { windowsHide: true },
  );
  let babylonInstalled = false;
  try {
    await access(join(consumer, "node_modules/@babylonjs/core/package.json"));
    babylonInstalled = true;
  } catch {}
  assert.equal(
    babylonInstalled,
    false,
    "optional Babylon peer must not be auto-installed for native users",
  );
} finally {
  if (!consumer.startsWith(tempRoot + sep))
    throw Error("Unexpected package-test cleanup path");
  await rm(consumer, { recursive: true, force: true });
}
await writeFile(
  "test-results/package.json",
  JSON.stringify(
    {
      passed: true,
      name: pack.name,
      files,
      bytes: pack.size,
      exports: Object.keys(exports),
      runtimeDependencies: [],
    },
    null,
    2,
  ),
);
console.log(
  `PASS package: ${files.length} production files; ESM and AVBD global load without Babylon or a DOM`,
);
