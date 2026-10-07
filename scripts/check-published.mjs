import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  access,
  rm,
} from "node:fs/promises";
import { resolve, join, sep, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { createContext, runInContext } from "node:vm";
import { build } from "esbuild";
import { browserCheck } from "./browser-check.mjs";

// Install the public release, never a local tarball or workspace link.
const exec = promisify(execFile),
  require = createRequire(import.meta.url);
const npm =
  process.env.npm_execpath ??
  join(
    dirname(
      require.resolve("npm/package.json", {
        paths: [process.execPath.replace(/node(?:\.exe)?$/, "node_modules")],
      }),
    ),
    "bin/npm-cli.js",
  );
const version = process.argv[2] ?? JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
).version;
assert.match(version, /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/);
const registry = "https://registry.npmjs.org/";
const tempRoot = resolve(".temp");
await mkdir(tempRoot, { recursive: true });
const consumer = await mkdtemp(join(tempRoot, "published-consumer-"));
let browser;
try {
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify({ private: true, type: "module" }),
  );
  const npmRun = async (args) =>
    (
      await exec(
        process.execPath,
        [
          npm,
          ...args,
          "--registry",
          registry,
          "--fetch-retries=0",
          "--fetch-timeout=30000",
        ],
        { cwd: consumer, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      )
    ).stdout;
  const registryMetadata = JSON.parse(
    await npmRun(["view", `avbd-babylon@${version}`, "--json"]),
  );
  assert.equal(registryMetadata.version, version);
  await npmRun([
    "install",
    `avbd-babylon@${version}`,
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ]);
  const packageRoot = join(consumer, "node_modules/avbd-babylon");
  const metadata = JSON.parse(
    await readFile(join(packageRoot, "package.json"), "utf8"),
  );
  assert.equal(metadata.version, version);
  assert.equal(
    Object.keys(metadata.dependencies ?? {}).length,
    0,
    "No runtime dependencies",
  );
  assert.equal(
    await access(join(consumer, "node_modules/@babylonjs/core")).then(
      () => true,
      () => false,
    ),
    false,
    "Optional Babylon must not be installed for native users",
  );
  const lock = JSON.parse(
    await readFile(join(consumer, "package-lock.json"), "utf8"),
  );
  const installed = lock.packages["node_modules/avbd-babylon"];
  assert.equal(installed.integrity, registryMetadata.dist.integrity);
  assert.equal(installed.resolved, registryMetadata.dist.tarball);
  const nodeEntry = join(consumer, "node-check.mjs");
  await writeFile(
    nodeEntry,
    `import assert from 'node:assert/strict';
import * as main from 'avbd-babylon';
import * as native from 'avbd-babylon/native';
for(const key of ['AvbdScene2D','AvbdScene3D','AvbdPhysics','AvbdPhysicsAggregate','AvbdPhysicsBody','AvbdPhysicsConstraint','AvbdShapeType','createWebGPUDevice'])assert.ok(main[key],key);
assert.equal(main.AvbdScene2D,native.AvbdScene2D);
assert.equal(main.AvbdScene3D,native.AvbdScene3D);
assert.equal(main.createWebGPUDevice,native.createWebGPUDevice);
assert.equal(new native.AvbdScene2D().addCircle(.5),0);
assert.ok(new native.AvbdScene3D().addCapsule(.3,2));
console.log('PASS installed ESM/native exports without Babylon or DOM');`,
  );
  console.log(
    (
      await exec(process.execPath, [nodeEntry], {
        cwd: consumer,
        windowsHide: true,
      })
    ).stdout.trim(),
  );
  const globalContext = createContext({});
  runInContext(
    await readFile(join(packageRoot, "dist/avbd.global.js"), "utf8"),
    globalContext,
  );
  for (const key of [
    "AvbdPhysics",
    "AvbdPhysicsAggregate",
    "AvbdScene2D",
    "AvbdScene3D",
    "createWebGPUDevice",
  ])
    assert.ok(globalContext.AVBD[key], key);
  console.log("PASS installed browser-global bundle without Babylon or DOM");

  // Babylon is explicitly installed only for the integration tests.
  await npmRun([
    "install",
    "--save-dev",
    "@babylonjs/core@9.13.0",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
  ]);
  await writeFile(
    join(consumer, "api-types.ts"),
    await readFile("tests/package-api-types.ts", "utf8"),
  );
  await exec(
    process.execPath,
    [
      resolve("node_modules/typescript/bin/tsc"),
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--module",
      "nodenext",
      "--target",
      "es2022",
      join(consumer, "api-types.ts"),
    ],
    { windowsHide: true },
  );
  console.log("PASS installed Babylon and native TypeScript APIs");
  // Fresh test files import the registry package; the two utilities only assert
  // results and inspect GPU buffers. No workspace physics implementation is used.
  const featureTests = (await readFile("tests/gpu-package-features.js", "utf8"))
    .replace('"../src/index.js"', '"avbd-babylon"')
    .replace('"./helpers/gpu.js"', '"./gpu-helpers.js"')
    .replace('"../src/gpu/bodyReadback.js"', '"./readback-helper.js"');
  await writeFile(join(consumer, "feature-tests.js"), featureTests);
  await writeFile(
    join(consumer, "gpu-helpers.js"),
    await readFile("tests/helpers/gpu.js", "utf8"),
  );
  await writeFile(
    join(consumer, "readback-helper.js"),
    await readFile("src/gpu/bodyReadback.js", "utf8"),
  );
  await writeFile(
    join(consumer, "gpu-check.js"),
    `export {packageFeatureGpuTests} from './feature-tests.js';
export {createWebGPUDevice} from 'avbd-babylon/native';`,
  );
  const bundle = await build({
    entryPoints: [join(consumer, "gpu-check.js")],
    bundle: true,
    format: "esm",
    outfile: join(consumer, "browser.js"),
    metafile: true,
  });
  assert.ok(
    Object.keys(bundle.metafile.inputs).every((p) =>
      resolve(p).startsWith(consumer + sep),
    ),
    "GPU check must use only fresh consumer files and installed packages",
  );
  await writeFile(
    join(consumer, "index.html"),
    "<!doctype html><title>Published AVBD verification</title>",
  );
  browser = await browserCheck();
  const route = consumer
    .slice(resolve(".").length + 1)
    .split(sep)
    .join("/");
  await browser.navigate(`${route}/index.html`);
  const gpu = await browser.evaluate(`(async()=>{
    const {packageFeatureGpuTests,createWebGPUDevice}=await import('./browser.js');
    const {device,adapter}=await createWebGPUDevice({requiredLimits:{maxStorageBuffersPerShaderStage:9}});
    globalThis.__GPU_TEST_RESULT__={hardware:{vendor:adapter.info.vendor,description:adapter.info.description}};
    const errors=[],results=[];
    device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    try{
      await packageFeatureGpuTests(device,async(name,run)=>{
        try{await run();await device.queue.onSubmittedWorkDone();results.push({name,passed:true});}
        catch(error){results.push({name,passed:false,error:String(error.stack??error)});}
      });
      return {results,errors,adapter:globalThis.__GPU_TEST_RESULT__.hardware,capsuleBenchmark:globalThis.__GPU_TEST_RESULT__.capsuleBenchmark};
    }finally{device.destroy();}
  })()`);
  const result = {
    date: new Date().toISOString(),
    version,
    registry,
    tarball: installed.resolved,
    integrity: installed.integrity,
    runtimeDependencies: [],
    nativeWithoutBabylon: true,
    nodeExports: true,
    browserGlobal: true,
    types: true,
    ...gpu,
    browserErrors: browser.errors,
  };
  result.passed =
    gpu.results.length > 0 &&
    gpu.results.every((r) => r.passed) &&
    !gpu.errors.length &&
    !browser.errors.length;
  await writeFile(
    "test-results/published-package.json",
    JSON.stringify(result, null, 2),
  );
  assert.ok(result.passed, JSON.stringify(result, null, 2));
  console.log(
    `PASS published avbd-babylon@${version}: ${gpu.results.length} GPU feature tests; fresh registry install, native/Babylon APIs, types and global bundle`,
  );
} finally {
  if (browser) await browser.close();
  if (!resolve(consumer).startsWith(tempRoot + sep))
    throw Error("Unsafe consumer cleanup path");
  await rm(consumer, { recursive: true, force: true, maxRetries: 3 });
}
