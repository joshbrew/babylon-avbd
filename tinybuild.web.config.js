// Website and browser benchmark bundles, kept separate from the package build.
export default {
  bundler: {
    entryPoints: ["index.js"],
    outfile: "dist/index.js",
    bundleBrowser: false,
    bundleESM: true,
    bundleTypes: false,
    bundleHTML: false,
    includeDefaultPlugins: false,
    loader: { ".wgsl": "text" },
    minify: true,
    sourcemap: false,
  },
  additionalBundles: [
    {
      entryPoints: ["demo/shared/physics/webglWorld.js"],
      outfile: "dist/experimental-webgl.js",
      format: "esm",
    },
    {
      entryPoints: ["tests/performance-entry.js"],
      outfile: "dist/performance.js",
      format: "esm",
    },
    {
      entryPoints: ["tests/workers-entry.js"],
      outfile: "dist/workers.js",
      format: "esm",
    },
    {
      entryPoints: ["demo/shared/runtime/simulationWorker.js"],
      outfile: "dist/simulation-worker.js",
      format: "esm",
    },
  ],
  additionalAssets: ["dist/scene-catalogue.json"],
  server: {
    host: "127.0.0.1",
    port: 8080,
    startpage: "index.html",
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
};
