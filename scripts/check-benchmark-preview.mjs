import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck(),
  results = [];
const wait = async (expression) => {
  for (let i = 0; i < 600; i++) {
    if (await browser.evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const state = await browser.evaluate(
    "({preview:globalThis.__BENCHMARK_VIEW__?.preview.state,setup:globalThis.__PERFORMANCE_SETUP_ERROR__,message:document.querySelector('#preview-message')?.textContent,status:document.querySelector('#status')?.textContent})",
  );
  throw Error(
    `Timed out: ${expression}: ${JSON.stringify(state)}; ${browser.errors.join("\n")}`,
  );
};
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
try {
  await browser.navigate("tests/performance.html");
  await wait("globalThis.__BENCHMARK_VIEW__?.preview.state.phase==='ready'");
  for (const scene of [
    "showcase-brick-ring-28k",
    "2d-net",
    "2d-mixed-shapes",
    "2d-sleeping-pile",
    "2d-limited-hinges",
    "2d-slingshot-siege",
    "3d-tearable-cloth",
    "showcase-ragdolls-on-cloth-24k",
    "3d-100k-rook-impact",
    "3d-castle-siege",
    "paper-walls-510k-3",
    "paper-cloth-35k",
  ]) {
    await browser.evaluate(
      `(()=>{const s=document.querySelector('#scene');s.value=${JSON.stringify(scene)};s.dispatchEvent(new Event('change'));})()`,
    );
    await wait(
      `__BENCHMARK_VIEW__.preview.state.phase==='ready'&&__BENCHMARK_VIEW__.preview.state.scene===${JSON.stringify(scene)}`,
    );
    const initial = await browser.evaluate(
      "__BENCHMARK_VIEW__.preview.api().diagnostics.steps",
    );
    await wait(
      `__BENCHMARK_VIEW__.preview.api().diagnostics.steps>${initial + 5}`,
    );
    await browser.evaluate("document.querySelector('#preview-pause').click()");
    const paused = await browser.evaluate(
      "__BENCHMARK_VIEW__.preview.api().diagnostics.steps",
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    assert(
      await browser.evaluate(
        `__BENCHMARK_VIEW__.preview.api().diagnostics.steps===${paused}`,
      ),
      "Pause did not stop simulation",
    );
    await browser.evaluate("document.querySelector('#preview-step').click()");
    await wait(
      `__BENCHMARK_VIEW__.preview.api().diagnostics.steps===${paused + 1}`,
    );
    const fit = await browser.evaluate(
      "__BENCHMARK_VIEW__.preview.fit().then(()=>true)",
    );
    assert(fit, "Fit did not complete");
    if (
      ["3d-100k-rook-impact", "3d-castle-siege", "2d-slingshot-siege"].includes(
        scene,
      )
    ) {
      await browser.evaluate("__BENCHMARK_VIEW__.preview.shoot()");
      assert(
        !(await browser.evaluate(
          "document.querySelector('#preview-shoot').hidden",
        )),
        "Cannon control missing",
      );
    }
    const errors = await browser.evaluate(
      "__BENCHMARK_VIEW__.preview.api().diagnostics.errors",
    );
    assert(!errors.length, errors.join("\n"));
    await browser.screenshot(`test-results/screenshots/preview-${scene}.png`);
    results.push({ scene, passed: true, pause: true, step: true, fit: true });
    await browser.evaluate("document.querySelector('#preview-pause').click()");
  }
  // The playable preview follows the benchmark's explicit collision choice.
  await browser.evaluate(`(()=>{
    const s=document.querySelector('#scene');s.value='3d-mixed-sizes-10k';
    document.querySelector('#broadphase').value='hploc';s.dispatchEvent(new Event('change'));
  })()`);
  await wait(
    "__BENCHMARK_VIEW__.preview.state.phase==='ready' && __BENCHMARK_VIEW__.preview.state.scene==='3d-mixed-sizes-10k'",
  );
  const treePreview = await browser.evaluate(
    "__BENCHMARK_VIEW__.preview.api().snapshot().then(s=>s.broadphase==='hploc' && !document.querySelector('#preview-frame').contentDocument.querySelector('#lab-debug').checked)",
  );
  assert(
    treePreview,
    "Preview did not use the requested GPU tree with stress overlays off",
  );
  await browser.evaluate(`(()=>{
    document.querySelector('#broadphase').value='grid';document.querySelector('#broadphase').dispatchEvent(new Event('change'));
  })()`);
  await wait(
    "__BENCHMARK_VIEW__.preview.state.phase==='ready' && __BENCHMARK_VIEW__.preview.state.broadphase==='grid'",
  );
  assert(
    await browser.evaluate(
      "__BENCHMARK_VIEW__.preview.api().snapshot().then(s=>s.broadphase==='grid')",
    ),
    "Preview did not switch back to grid",
  );
  await browser.evaluate("document.querySelector('#detailed').checked=true");
  await browser.evaluate(`(()=>{
    document.querySelector('#broadphase').value='hploc';
    const scene=document.querySelector('#scene');scene.value='3d-ground';scene.dispatchEvent(new Event('change'));
  })()`);
  await wait("__BENCHMARK_VIEW__.preview.state.phase==='ready'");
  await browser.evaluate(`(()=>{
    globalThis.previewBefore=__BENCHMARK_VIEW__.preview.api();
    globalThis.previewIsolationChecks=[];
    const run=__PERFORMANCE__.run.bind(__PERFORMANCE__);
    __PERFORMANCE__.run=async(...args)=>{
      previewIsolationChecks.push({closed:!document.querySelector('#preview-frame'),disposed:previewBefore.diagnostics.disposed});
      return run(...args);
    };
    document.querySelector('#warmup').value=5;document.querySelector('#samples').value=5;
    document.querySelector('#run-selected').click();
  })()`);
  await wait("__BENCHMARK_VIEW__.state.done");
  const run = await browser.evaluate(
    "({checks:previewIsolationChecks,results:__BENCHMARK_VIEW__.state.results,phase:__BENCHMARK_VIEW__.preview.state.phase})",
  );
  assert(
    run.checks.length === 1 && run.checks[0].closed && run.checks[0].disposed,
    "Preview competed with benchmark",
  );
  assert(
    run.results.length === 1 &&
      run.results[0].passed &&
      run.results[0].broadphase === "hploc" &&
      run.results[0].details.bodySolve.mean >= 0 &&
      run.results[0].samples.length === 5,
    "Selected benchmark failed",
  );
  assert(run.phase === "ready", "Preview did not return after measurements");
  await browser.evaluate(`(()=>{
    globalThis.savedBenchmarkRun=__PERFORMANCE__.run;
    __PERFORMANCE__.run=async()=>{throw Error('Preview restoration test');};
    document.querySelector('#run-selected').click();
  })()`);
  await wait("__BENCHMARK_VIEW__.state.done");
  const recovery = await browser.evaluate(
    "({failed:!__BENCHMARK_VIEW__.state.results[0].passed,ready:__BENCHMARK_VIEW__.preview.state.phase==='ready',enabled:!document.querySelector('#run-selected').disabled})",
  );
  assert(
    recovery.failed && recovery.ready && recovery.enabled,
    "Failed run did not restore playable preview",
  );
  await browser.evaluate("__PERFORMANCE__.run=savedBenchmarkRun");
  await browser.evaluate("document.querySelector('#preview-reset').click()");
  await wait("__BENCHMARK_VIEW__.preview.state.phase==='ready'");
  for (const width of [1440, 390]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const layout =
      await browser.evaluate(`(()=>{const f=document.querySelector('#preview-frame');return {
      width:innerWidth,scroll:document.documentElement.scrollWidth,
      childWidth:f.contentDocument.querySelector('.lab-view').getBoundingClientRect().width,
      frameWidth:f.getBoundingClientRect().width};})()`);
    assert(
      layout.scroll <= layout.width &&
        Math.abs(layout.childWidth - layout.frameWidth) < 2,
      "Embedded preview does not fit viewport",
    );
    await browser.evaluate(
      "document.querySelector('#preview-panel').scrollIntoView()",
    );
    await browser.screenshot(
      `test-results/screenshots/benchmark-preview-${width}.png`,
    );
  }
  assert(!browser.errors.length, browser.errors.join("\n"));
  await writeFile(
    "test-results/benchmark-preview.json",
    JSON.stringify(
      {
        passed: true,
        results,
        treePreview,
        detailedTreeBenchmark: true,
        isolation: run.checks,
        recovery,
        errors: browser.errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS playable previews: ring, net, tearable cloth, ragdolls, cannon, half-million walls and fabric; controls, benchmark teardown/restore, desktop/mobile",
  );
} finally {
  await browser.close();
}
