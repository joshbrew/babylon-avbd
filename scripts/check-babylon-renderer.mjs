import { browserCheck } from "./browser-check.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
const browser = await browserCheck(),
  results = [];
try {
  await browser.call("Page.addScriptToEvaluateOnNewDocument", {
    source:
      "globalThis.__RENDER_ERRORS__=[];const originalError=console.error.bind(console);console.error=(...args)=>{__RENDER_ERRORS__.push(args.map(String).join(' '));originalError(...args);};",
  });
  const scenes = process.argv.includes("--all")
    ? JSON.parse(
        await readFile("test-results/solver-scenes.json", "utf8"),
      ).results.map((r) => r.scene)
    : [
        "3d-voronoi-demolition",
        "3d-sphere-contacts",
        "2d-triggers-and-masks",
        "showcase-ragdolls-on-cloth-24k",
        "3d-tearable-cloth",
        "showcase-chain-mail-1.6k",
        "showcase-box-columns-100k",
      ];
  for (const scene of scenes) {
    await browser.navigate(
      `?demo=canonical&scene=${scene}&backend=gpu&renderer=babylon&quality=benchmark&paused=1`,
    );
    for (let i = 0; i < 1200; i++) {
      const state = await browser.evaluate(
        "({ready:globalThis.__AVBD_LAB__?.diagnostics.ready,errors:globalThis.__AVBD_LAB__?.diagnostics.errors,text:globalThis.__AVBD_LAB__?.diagnostics.errors.length?document.body.innerText.slice(-4000):null})",
      );
      const consoleErrors = await browser.evaluate(
        "globalThis.__RENDER_ERRORS__??[]",
      );
      if (state.errors?.length || consoleErrors.length)
        throw Error(
          JSON.stringify({
            scene,
            errors: state.errors,
            stack: await browser.evaluate(
              "globalThis.__AVBD_LAB__?.diagnostics.errorStack",
            ),
            console: consoleErrors,
            browserErrors: browser.errors,
          }),
        );
      if (state.ready) break;
      if (i === 1199)
        throw Error(`Babylon renderer initialization timed out: ${scene}`);
      await new Promise((r) => setTimeout(r, 50));
    }
    await browser.evaluate("__AVBD_LAB__.step(5)");
    const result = await browser.evaluate(
      "(async()=>{await __AVBD_LAB__.collect();const s=await __AVBD_LAB__.snapshot();return {scene:s.scene,renderer:s.renderer,renderStats:s.renderStats,bodyCount:s.bodyCount,stats:s.stats,finite:s.poses.flat().every(Number.isFinite),errors:s.errors}})()",
    );
    if (
      !result.finite ||
      result.errors.length ||
      result.stats.overflow ||
      result.stats.clashes ||
      result.renderer !== "babylon" ||
      result.renderStats.poseDownloads ||
      result.renderStats.matrixUpdates ||
      (result.bodyCount && !result.renderStats.draws)
    )
      throw Error(JSON.stringify(result));
    await browser.screenshot(`test-results/screenshots/babylon-${scene}.png`);
    results.push(result);
    console.log(
      `PASS Babylon renderer ${scene}: ${result.bodyCount} bodies, ${result.renderStats.draws} draws, zero pose downloads`,
    );
    await browser.evaluate("__AVBD_LAB__.dispose()");
  }
  await browser.navigate("?demo=slingshot&renderer=babylon&paused=1");
  for (let i = 0; i < 600; i++) {
    if (await browser.evaluate("!!globalThis.__SLINGSHOT__?.ready")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  const slingshot = await browser.evaluate(
    "(async()=>{if(!globalThis.__SLINGSHOT__?.ready)throw Error('Slingshot not ready');await __SLINGSHOT__.step(5);await __SLINGSHOT__.collect();return {scene:'slingshot',renderStats:__SLINGSHOT__.renderStats,state:__SLINGSHOT__.state};})()",
  );
  if (
    slingshot.renderStats.renderer !== "babylon" ||
    slingshot.renderStats.poseDownloads ||
    slingshot.state.errors.length
  )
    throw Error(JSON.stringify(slingshot));
  await browser.screenshot("test-results/screenshots/babylon-slingshot.png");
  results.push(slingshot);
  await browser.evaluate("__SLINGSHOT__.dispose()");
  console.log(
    "PASS Babylon slingshot renderer: interactions and zero pose downloads",
  );
  await build({
    entryPoints: ["tests/contact-sample-check.js"],
    bundle: true,
    format: "esm",
    outfile: "dist/contact-sample-check.js",
    loader: { ".wgsl": "text" },
  });
  const contactSamples = await browser.evaluate(
    "(async()=>{const {checkContactSamples}=await import('/dist/contact-sample-check.js');return checkContactSamples();})()",
  );
  console.log(
    "PASS GPU contact dots: known positions, sparse contacts, region sampling and buffer switching; 32 KiB output",
  );
  if (browser.errors.length) throw Error(browser.errors.join("\n"));
  await writeFile(
    "test-results/babylon-renderer.json",
    JSON.stringify({ passed: true, results, contactSamples }, null, 2),
  );
} finally {
  await browser.close();
}
