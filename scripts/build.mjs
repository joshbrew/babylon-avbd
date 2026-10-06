import { build, context } from "esbuild";
import web from "../tinybuild.web.config.js";
import { sourceMapsEnabled, removeStaleSourceMap } from "./source-maps.mjs";
const options = {
  entryPoints: web.bundler.entryPoints,
  bundle: true,
  outfile: web.bundler.outfile,
  loader: { ".wgsl": "text" },
  sourcemap: sourceMapsEnabled,
  minify: true,
};
const performanceOptions = {
  ...options,
  entryPoints: ["tests/performance-entry.js"],
  outfile: "dist/performance.js",
  format: "esm",
};
await removeStaleSourceMap(options.outfile);
await removeStaleSourceMap(performanceOptions.outfile);
if (process.argv.includes("--serve")) {
  const ctx = await context(options);
  const benchmark = await context(performanceOptions);
  await ctx.watch();
  await benchmark.watch();
  const server = await ctx.serve({
    servedir: ".",
    host: web.server.host,
    port: web.server.port,
  });
  console.log(`Simulation: http://127.0.0.1:${server.port}`);
} else {
  await build(options);
  await build(performanceOptions);
}
