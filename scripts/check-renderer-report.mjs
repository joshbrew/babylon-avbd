import { browserCheck } from "./browser-check.mjs";
import { readFile, writeFile, access } from "node:fs/promises";
import { build } from "esbuild";

const report = JSON.parse(
  await readFile("test-results/renderer-performance.json", "utf8"),
);
const html = await readFile("test-results/renderer-performance.html", "utf8");
const expectedScenes = new Set(report.results.map((r) => r.scene)).size;
for (const match of html.matchAll(/src="(screenshots\/[^"]+)"/g))
  await access(`test-results/${match[1]}`);
const browser = await browserCheck(),
  checks = [];
const assert = (value, message) => {
  if (!value) throw Error(message);
};
async function wait(expression) {
  for (let i = 0; i < 800; i++) {
    if (await browser.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error(`Timed out: ${expression}; ${browser.errors.join("\n")}`);
}
try {
  for (const width of [1440, 390]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await browser.navigate("test-results/renderer-performance.html");
    await wait(
      "document.readyState==='complete'&&document.querySelector('h1')?.textContent==='Babylon and direct WebGPU rendering'",
    );
    const result = await browser.evaluate(
      `({width:innerWidth,scroll:document.documentElement.scrollWidth,cards:document.querySelectorAll('article').length,bars:document.querySelectorAll('.renderer-bar').length,hardware:document.body.textContent.includes('RTX 4070 Laptop GPU'),navigation:[...document.querySelectorAll('nav a')].map(a=>a.getAttribute('href')),separate:document.body.textContent.includes('GPU copies')&&document.body.textContent.includes('CPU submission')&&document.body.textContent.includes('not displayed frame rate'),images:document.querySelectorAll('img').length})`,
    );
    assert(
      result.scroll <= width &&
        result.cards === expectedScenes &&
        result.bars === expectedScenes * 2 &&
        result.hardware &&
        result.separate &&
        result.images >= 8 &&
        result.navigation.includes("../"),
      JSON.stringify(result),
    );
    checks.push(result);
    await browser.screenshot(
      `test-results/screenshots/renderer-comparison-${width}.png`,
    );
  }
  await browser.evaluate("document.querySelector('nav a').click()");
  await wait(
    "location.pathname==='/'&&globalThis.__AVBD_LAB__?.diagnostics.ready",
  );
  await browser.evaluate("__AVBD_LAB__.dispose()");
  await build({
    entryPoints: ["tests/contact-sample-check.js"],
    bundle: true,
    format: "esm",
    outfile: "dist/contact-sample-check.js",
    loader: { ".wgsl": "text" },
  });
  checks.push({
    contactSamples: await browser.evaluate(
      "(async()=>{const {checkContactSamples}=await import('/dist/contact-sample-check.js');return checkContactSamples();})()",
    ),
  });
  checks.push({ backToMain: true });
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await browser.navigate("tests/performance.html");
  await wait("globalThis.__BENCHMARK_VIEW__?.preview.state.phase==='ready'");
  await browser.evaluate(
    `(()=>{const p=__BENCHMARK_VIEW__.preview;if(!p.state.paused)p.pause();document.getElementById('scene').value='2d-mixed-shapes';const renderer=document.getElementById('renderer');renderer.value='babylon';renderer.dispatchEvent(new Event('change'));})()`,
  );
  await wait(
    "__BENCHMARK_VIEW__.preview.state.phase==='ready'&&__BENCHMARK_VIEW__.preview.state.scene==='2d-mixed-shapes'&&__BENCHMARK_VIEW__.preview.state.renderer==='babylon'",
  );
  await browser.evaluate("__BENCHMARK_VIEW__.preview.step()");
  const preview = await browser.evaluate(
    "(async()=>{const p=__BENCHMARK_VIEW__.preview;return {state:p.state,snapshot:await p.api().snapshot(),link:document.getElementById('preview-open').getAttribute('href')};})()",
  );
  assert(
    preview.snapshot.renderer === "babylon" &&
      preview.snapshot.renderStats.poseDownloads === 0 &&
      preview.link.includes("renderer=babylon"),
    "Babylon preview choice was not applied",
  );
  await browser.evaluate("__BENCHMARK_VIEW__.suspendPreview()");
  await browser.evaluate(
    "(()=>{document.getElementById('warmup').value=2;document.getElementById('samples').value=3;document.getElementById('repeats').value=1;})()",
  );
  const live = await browser.evaluate("__BENCHMARK_VIEW__.runRenderers()");
  assert(
    live.results.length === 1 &&
      live.results[0].passed &&
      live.results[0].identicalState &&
      !live.errors.length,
    "Live renderer comparison failed",
  );
  const restored = await browser.evaluate(
    "({renderer:__BENCHMARK_VIEW__.preview.state.renderer,phase:__BENCHMARK_VIEW__.preview.state.phase,download:!document.getElementById('renderer-download').disabled,running:__BENCHMARK_VIEW__.state.running})",
  );
  assert(
    restored.renderer === "babylon" &&
      restored.phase === "ready" &&
      restored.download &&
      !restored.running,
    "Benchmark did not restore the selected preview",
  );
  checks.push({
    preview: preview.state,
    live: live.results[0].scene,
    restored,
  });
  await browser.evaluate(
    "document.getElementById('renderer-comparison').scrollIntoView({block:'start'})",
  );
  await browser.screenshot(
    "test-results/screenshots/renderer-live-comparison.png",
  );
  await browser.evaluate("__BENCHMARK_VIEW__.suspendPreview()");

  await browser.navigate(
    "?demo=canonical&scene=3d-tearable-cloth&backend=gpu&renderer=babylon&paused=1",
  );
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  const torn = await browser.evaluate(
    "(async()=>{await __AVBD_LAB__.tearPatch();await __AVBD_LAB__.step(30);await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot();})()",
  );
  assert(
    torn.fabric.detachedPatch.length > 0 &&
      torn.poses.flat().every(Number.isFinite) &&
      !torn.errors.length,
    "Babylon tear topology failed",
  );
  await browser.screenshot("test-results/screenshots/babylon-cloth-torn.png");
  await browser.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await browser.evaluate("__AVBD_LAB__.step()");
  await browser.screenshot("test-results/screenshots/babylon-cloth-mobile.png");
  await browser.evaluate("__AVBD_LAB__.setRenderer('webgpu')");
  await browser.evaluate("__AVBD_LAB__.setRenderer('babylon')");
  const switched = await browser.evaluate(
    "(async()=>{await __AVBD_LAB__.step(2);const s=await __AVBD_LAB__.snapshot();return {renderer:s.renderer,errors:s.errors,finite:s.poses.flat().every(Number.isFinite)};})()",
  );
  assert(
    switched.renderer === "babylon" &&
      switched.finite &&
      !switched.errors.length,
    "Renderer switching or resized attachments failed",
  );
  checks.push({ tearPatch: torn.fabric.detachedPatch.length, switched });
  await browser.evaluate("__AVBD_LAB__.dispose()");
  assert(!browser.errors.length, browser.errors.join("\n"));
  await writeFile(
    "test-results/renderer-report-check.json",
    JSON.stringify({ passed: true, checks }, null, 2),
  );
  console.log(
    "PASS renderer report and controls: measured rows, hardware label, mobile layout, live preview/comparison, tearing and switching",
  );
} finally {
  await browser.close();
}
