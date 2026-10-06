import library from "./tinybuild.config.js";
export default {
  ...library,
  bundler: {
    ...library.bundler,
    outfile: "dist/avbd.global.js",
    bundleESM: false,
    bundleBrowser: true,
    globalThis: "AVBD",
  },
};
