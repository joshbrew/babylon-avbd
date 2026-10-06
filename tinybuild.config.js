// Library only. This config never builds or starts the demo website.
export default {
  build: true,
  server: false,
  bundler: {
    entryPoints: ["src/index.js"],
    outfile: "dist/avbd.js",
    bundleESM: true,
    bundleBrowser: false,
    bundleNode: false,
    bundleTypes: false,
    bundleHTML: false,
    includeDefaultPlugins: false,
    loader: { ".wgsl": "text" },
    external: ["@babylonjs/*"],
    target: "es2022",
    globalThis: "AVBD",
    minify: true,
    sourcemap: false,
    metafile: true,
  },
};
