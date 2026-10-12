import { build } from "esbuild";

/** UI metadata comes from the real builders, without loading those builders on the page. */
export async function buildSceneCatalogue() {
  const result = await build({
    stdin: {
      contents: 'export { canonicalScenes } from "./demo/lab/scenes.js";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
    loader: { ".wgsl": "text" },
  });
  const module = { exports: {} };
  new Function("module", "exports", result.outputFiles[0].text)(
    module,
    module.exports,
  );
  return JSON.stringify(module.exports.canonicalScenes);
}
