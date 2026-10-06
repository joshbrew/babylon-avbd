// Website and browser benchmark bundles, kept separate from the package build.
export default {
  bundler: {
    entryPoints: ["index.js"],
    outfile: "dist/index.js",
    bundleBrowser: true,
    bundleESM: false,
    bundleTypes: false,
    bundleHTML: false,
    includeDefaultPlugins: false,
    loader: { ".wgsl": "text" },
    minify: true,
    sourcemap: false,
  },
  server: { host: "127.0.0.1", port: 8080, startpage: "index.html" },
};
