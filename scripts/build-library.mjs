import {
  bundleESM,
  bundleBrowser,
} from "tinybuild/tinybuild/esbuild/bundler.js";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import library from "../tinybuild.config.js";
import cdn from "../tinybuild.cdn.config.js";
import { sourceMapsEnabled, removeStaleSourceMap } from "./source-maps.mjs";
await mkdir("dist", { recursive: true });
const config = structuredClone(
  (process.argv.includes("--cdn") ? cdn : library).bundler,
);
config.sourcemap = sourceMapsEnabled;
await removeStaleSourceMap(config.outfile);
const built = await (
  process.argv.includes("--cdn") ? bundleBrowser : bundleESM
)({ ...config, defaultConfig: true, plugins: [], bundle: true }, false);
if (!built?.metafile)
  throw Error("Library build produced no dependency manifest");
const unwanted = Object.keys(built.metafile.inputs).filter(
  (name) =>
    name.includes("node_modules/@babylonjs/") ||
    /(?:Demo|canonicalLab|gpuStress|avbd\.wgsl)/.test(name),
);
if (unwanted.length)
  throw Error(`Unexpected package dependencies: ${unwanted.join(", ")}`);
await copyFile("src/babylon/babylonAvbd.d.ts", "dist/babylonAvbd.d.ts");
await copyFile("src/native/scenes.d.ts", "dist/nativeScenes.d.ts");
await copyFile("src/gpu/device.d.ts", "dist/gpuDevice.d.ts");
await writeFile(
  "dist/native.js",
  'export { AvbdScene2D, AvbdScene3D, createWebGPUDevice, prepareWebGPUDevice3D } from "./avbd.js";\n',
);
await writeFile(
  "dist/native.d.ts",
  'export * from "./nativeScenes.js";\nexport * from "./gpuDevice.js";\n',
);
await writeFile(
  "dist/avbd.d.ts",
  (await readFile("src/index.d.ts", "utf8"))
    .replace("./babylon/babylonAvbd.js", "./babylonAvbd.js")
    .replace("./native/scenes.js", "./nativeScenes.js")
    .replace("./gpu/device.js", "./gpuDevice.js"),
);
await writeFile(
  "dist/avbd.global.d.ts",
  (await readFile("src/global.d.ts", "utf8")).replace(
    "./index.js",
    "./avbd.js",
  ),
);
await writeFile(
  "dist/NOTICE",
  "AVBD WebGPU incorporates the MIT-licensed three-avbd solver by Steven Bobyn.\nPinned source: https://github.com/sbobyn/three-avbd/tree/b3675dea83c78aba9644b059975f48285bf02a47\n\n" +
    (await readFile("reference/three-avbd/LICENSE", "utf8")) +
    "\n\nUpstream third-party notices (preserved from three-avbd):\n\n" +
    (await readFile("reference/three-avbd/THIRD_PARTY_NOTICES.md", "utf8")),
);
await mkdir("test-results", { recursive: true });
await writeFile(
  "test-results/library-build" +
    (process.argv.includes("--cdn") ? "-cdn" : "") +
    ".json",
  JSON.stringify(
    {
      passed: true,
      inputs: Object.keys(built.metafile.inputs),
      output: built.metafile.outputs,
    },
    null,
    2,
  ),
);
console.log(
  "PASS library build: no Babylon runtime, demo pages or legacy solver in the bundle",
);
