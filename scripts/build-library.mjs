import { build } from "esbuild";
import { mkdir, readFile } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";
import library from "../tinybuild.config.js";
import cdn from "../tinybuild.cdn.config.js";
import { sourceMapsEnabled, removeStaleSourceMap } from "./source-maps.mjs";
await mkdir("dist", { recursive: true });
const config = structuredClone(
  (process.argv.includes("--cdn") ? cdn : library).bundler,
);
config.sourcemap = sourceMapsEnabled;
await removeStaleSourceMap(config.outfile);
// Read the tinybuild configs directly, as the web build does. Output is atomic;
// no shared scratch directory or bundler-generated wrapper needs deletion.
const built = await build({
  entryPoints: config.entryPoints,
  outfile: config.outfile,
  bundle: true,
  format: process.argv.includes("--cdn") ? "iife" : "esm",
  ...(process.argv.includes("--cdn")
    ? { globalName: `globalThis.${config.globalThis}` }
    : {}),
  platform: "browser",
  target: config.target,
  external: config.external,
  loader: config.loader,
  minify: config.minify,
  sourcemap: config.sourcemap,
  metafile: true,
  write: false,
});
for (const file of built.outputFiles) await writeFile(file.path, file.contents);
if (!built?.metafile)
  throw Error("Library build produced no dependency manifest");
const unwanted = Object.keys(built.metafile.inputs).filter(
  (name) =>
    name.includes("node_modules/@babylonjs/") ||
    name.startsWith("src/webgl/") ||
    name.startsWith("demo/") ||
    /(?:Demo|canonicalLab|gpuStress|avbd\.wgsl)/.test(name),
);
if (unwanted.length)
  throw Error(`Unexpected package dependencies: ${unwanted.join(", ")}`);
await writeFile(
  "dist/utilities.js",
  'export { GpuTimer, GPUBufferRecycler, GpuSurfaceParticles, PARTICLE_BYTE_STRIDE, GpuContactSample, sampledContactShader, seedConstraintColoring, addGpuStepPass, WorkerCanvas, INPUT_WORDS, createSharedInput, writeSharedInput, readSharedInput } from "./avbd.js";\n',
);
await writeFile("dist/utilities.d.ts", await readFile("src/utilities.d.ts"));
await writeFile(
  "dist/babylonAvbd.d.ts",
  (await readFile("src/babylon/babylonAvbd.d.ts", "utf8")).replace(
    "../native/scenes.js",
    "./nativeScenes.js",
  ),
);
await writeFile("dist/gpuDevice.d.ts", await readFile("src/gpu/device.d.ts"));
await writeFile(
  "dist/solverPipeline.d.ts",
  (await readFile("src/native/pipeline.d.ts", "utf8"))
    .replaceAll('"./scenes.js"', '"./nativeScenes.js"')
    .replaceAll('"../gpu/device.js"', '"./gpuDevice.js"'),
);
await writeFile(
  "dist/nativeScenes.d.ts",
  (await readFile("src/native/scenes.d.ts", "utf8")).replaceAll(
    '"./pipeline.js"',
    '"./solverPipeline.js"',
  ),
);
await writeFile(
  "dist/native.js",
  'export { AvbdScene2D, AvbdScene3D, createWebGPUDevice, prepareWebGPUDevice3D, createSolverPipeline, cookHeightfield, cookStaticMesh } from "./avbd.js";\n',
);
await writeFile(
  "dist/native.d.ts",
  'export * from "./nativeScenes.js";\nexport * from "./gpuDevice.js";\nexport * from "./solverPipeline.js";\n',
);
await writeFile(
  "dist/avbd.d.ts",
  (await readFile("src/index.d.ts", "utf8"))
    .replace("./babylon/babylonAvbd.js", "./babylonAvbd.js")
    .replace("./native/scenes.js", "./nativeScenes.js")
    .replace("./gpu/device.js", "./gpuDevice.js")
    .replace("./native/pipeline.js", "./solverPipeline.js"),
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
  "PASS library build: self-contained solvers, no Babylon runtime or demo pages in the bundle",
);
