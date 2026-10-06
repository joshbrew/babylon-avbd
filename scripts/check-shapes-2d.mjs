import { browserCheck } from "./browser-check.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await browserCheck();
const wait = async (expression) => {
  for (let i = 0; i < 400; i++) {
    if (await browser.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw Error(`Timed out: ${expression}`);
};
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await browser.navigate(
    "?demo=canonical&scene=2d-mixed-shapes&backend=gpu&paused=1",
  );
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  const checks = [];
  for (let seconds = 1; seconds <= 10; seconds++) {
    await browser.evaluate("__AVBD_LAB__.step(120)");
    const state = await browser.evaluate(
      "(async()=>{await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot()})()",
    );
    const dynamic = state.poses.slice(6);
    if (
      state.errors.length ||
      state.stats.overflow ||
      state.stats.colorConflicts ||
      !state.poses.flat().every(Number.isFinite) ||
      dynamic.some((p) => p[1] < -0.05 || Math.abs(p[0]) > 14.05)
    )
      throw Error(JSON.stringify(state));
    checks.push({
      seconds,
      steps: state.steps,
      bodies: state.bodyCount,
      contacts: state.stats.contacts,
      conflicts: state.stats.colorConflicts,
    });
  }
  const screenshots = [];
  await browser.evaluate("document.querySelector('.lab-metrics').open=true");
  await browser.evaluate("new Promise(requestAnimationFrame)");
  const expanded = await browser.evaluate(
    "document.querySelector('.lab-metrics').getBoundingClientRect().height",
  );
  await browser.evaluate(
    "document.querySelector('.lab-metrics > summary').click()",
  );
  await browser.evaluate("new Promise(requestAnimationFrame)");
  const collapsed = await browser.evaluate(
    "({open:document.querySelector('.lab-metrics').open,height:document.querySelector('.lab-metrics').getBoundingClientRect().height,readings:document.querySelector('#lab-readings').getBoundingClientRect().height})",
  );
  if (collapsed.open || collapsed.height >= expanded || collapsed.height > 60)
    throw Error(
      `Performance meter did not collapse: ${JSON.stringify({ expanded, collapsed })}`,
    );
  await browser.screenshot(
    "test-results/screenshots/2d-performance-collapsed.png",
  );
  await browser.evaluate(
    "document.querySelector('.lab-metrics > summary').click()",
  );
  if (!(await browser.evaluate("document.querySelector('.lab-metrics').open")))
    throw Error("Performance meter did not reopen");
  await browser.evaluate(
    "document.querySelector('.lab-metrics > summary').focus()",
  );
  await browser.call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  await browser.call("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: " ",
    code: "Space",
    windowsVirtualKeyCode: 32,
  });
  if (await browser.evaluate("document.querySelector('.lab-metrics').open"))
    throw Error("Performance meter keyboard collapse failed");
  await browser.evaluate("document.querySelector('.lab-metrics').open=true");
  for (const width of [1440, 390]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    if (width < 600)
      await browser.evaluate(
        "document.querySelector('.lab-metrics').open=false",
      );
    await browser.evaluate("document.querySelector('#lab-fit').click()");
    await browser.evaluate("new Promise(requestAnimationFrame)");
    const fit = await browser.evaluate(
      "({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()})",
    );
    if (fit.scroll > fit.width || fit.canvas.width <= 0)
      throw Error(JSON.stringify(fit));
    const path = `test-results/screenshots/2d-mixed-shapes-settled-${width}.png`;
    await browser.screenshot(path);
    screenshots.push({ width, path });
  }
  await browser.navigate("tests/performance.html");
  await wait("globalThis.__BENCHMARK_VIEW__?.preview.state.phase==='ready'");
  await browser.evaluate(
    "(()=>{const s=document.querySelector('#scene');s.value='2d-mixed-shapes';s.dispatchEvent(new Event('change'));})()",
  );
  await wait(
    "__BENCHMARK_VIEW__.preview.state.phase==='ready'&&__BENCHMARK_VIEW__.preview.state.scene==='2d-mixed-shapes'",
  );
  await browser.evaluate("__BENCHMARK_VIEW__.preview.api().pause(true)");
  const steps = await browser.evaluate(
    "__BENCHMARK_VIEW__.preview.api().diagnostics.steps",
  );
  await browser.evaluate("__BENCHMARK_VIEW__.preview.api().step()");
  if (
    (await browser.evaluate(
      "__BENCHMARK_VIEW__.preview.api().diagnostics.steps",
    )) !==
    steps + 1
  )
    throw Error("Preview single step failed");
  await browser.screenshot(
    "test-results/screenshots/preview-2d-mixed-shapes.png",
  );
  if (browser.errors.length) throw Error(browser.errors.join("\n"));
  await writeFile(
    "test-results/shapes-2d.json",
    JSON.stringify(
      {
        passed: true,
        checks,
        screenshots,
        preview: true,
        collapsibleMeter: {
          passed: true,
          expandedHeight: expanded,
          collapsedHeight: collapsed.height,
        },
        errors: browser.errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS 2D shapes: ten seconds of mixed collisions, bounded bodies, desktop/mobile GPU screenshots and playable benchmark preview",
  );
} finally {
  await browser.close();
}
