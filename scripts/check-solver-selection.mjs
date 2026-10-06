import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const browser = await browserCheck(),
  results = [];
const assert = (value, message) => {
  if (!value) throw Error(message);
};
const wait = async (expression) => {
  for (let i = 0; i < 600; i++) {
    if (await browser.evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw Error(`Timed out: ${expression}`);
};
try {
  await browser.navigate(
    "?demo=canonical&scene=3d-ground&backend=gpu&paused=1",
  );
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  for (const mode of ["optimized", "points", "standard", "auto"]) {
    const state = await browser.evaluate(`(async()=>{
      const before=await __AVBD_LAB__.snapshot();
      const select=document.querySelector('#lab-solver-mode'); select.value=${JSON.stringify(mode)}; select.dispatchEvent(new Event('change'));
      const after=await __AVBD_LAB__.snapshot();
      return {mode:${JSON.stringify(mode)},decision:after.solverDecision,unchanged:before.steps===after.steps && before.poses.every((v,i)=>v===after.poses[i]),reason:document.querySelector('#lab-solver-reason').textContent,url:new URL(location.href).searchParams.get('solverMode')};
    })()`);
    assert(
      state.unchanged &&
        state.url === mode &&
        state.decision.requested === mode,
      "UI switch reset state or failed to persist",
    );
    assert(
      state.reason.includes(state.decision.reason),
      "UI did not explain its selection",
    );
    results.push(state);
    await browser.evaluate("__AVBD_LAB__.step(3)");
  }
  await browser.screenshot(
    "test-results/screenshots/solver-selection-controls.png",
  );
  for (const [scene, selected] of [
    ["showcase-box-columns-100k", "points"],
    ["showcase-ragdolls-on-cloth-24k", "standard"],
    ["paper-cloth-35k", "custom"],
  ]) {
    await browser.evaluate(
      `__AVBD_LAB__.select(${JSON.stringify(scene)},'gpu')`,
    );
    const choice = await browser.evaluate(
      "({decision:__AVBD_LAB__.diagnostics.solverDecision,disabled:document.querySelector('#lab-solver-mode').disabled,reason:document.querySelector('#lab-solver-reason').textContent})",
    );
    assert(
      choice.decision.selected === selected &&
        choice.reason.includes(choice.decision.reason),
      `${scene}: wrong selection ${JSON.stringify(choice)}`,
    );
    assert(
      choice.disabled === (selected === "custom"),
      "custom cloth override must stay disabled",
    );
    results.push({ scene, ...choice });
  }
  await browser.evaluate("__AVBD_LAB__.dispose()");
  await browser.navigate("tests/performance.html");
  await wait("globalThis.__BENCHMARK_VIEW__?.preview.state.phase==='ready'");
  await browser.evaluate(`(()=>{
    document.querySelector('#scene').value='paper-cloth-35k';
    document.querySelector('#variant').value='projected';
    document.querySelector('#variant').dispatchEvent(new Event('change'));
  })()`);
  await wait(
    "__BENCHMARK_VIEW__.preview.state.phase==='ready' && __BENCHMARK_VIEW__.preview.state.scene==='paper-cloth-35k'",
  );
  assert(
    await browser.evaluate(
      "document.querySelector('#variant').value==='production' && document.querySelector('#variant').type==='hidden'",
    ),
    "fabric controls allowed a rigid-body override",
  );
  await browser.evaluate(`(()=>{
    document.querySelector('#scene').value='3d-ground';
    document.querySelector('#variant').value='projected';
    document.querySelector('#variant').dispatchEvent(new Event('change'));
  })()`);
  await wait(
    "__BENCHMARK_VIEW__.preview.state.phase==='ready' && __BENCHMARK_VIEW__.preview.state.scene==='3d-ground' && __BENCHMARK_VIEW__.preview.state.solverMode==='auto'",
  );
  assert(
    await browser.evaluate(
      "__BENCHMARK_VIEW__.preview.api().diagnostics.solverDecision.requested==='auto'",
    ),
    "preview did not retain automatic selection",
  );
  await browser.evaluate("__BENCHMARK_VIEW__.suspendPreview()");
  for (const [variant, selected] of [
    ["production", "standard"],
    ["baseline", "standard"],
    ["projected", "optimized"],
    ["points", "points"],
  ]) {
    const result = await browser.evaluate(
      `__PERFORMANCE__.run('3d-ground',${JSON.stringify(variant)},2,3).then(r=>({variant:r.variant,decision:r.solverDecision,kernel:r.kernel,passed:r.finite && !r.counters.overflow && !r.counters.clashes,samples:r.samples.length}))`,
    );
    assert(
      result.passed &&
        result.samples === 3 &&
        result.decision.selected === selected,
      "benchmark override ignored or mislabeled",
    );
    results.push(result);
  }
  // Explicit standard must remain standard even on a load above the auto threshold.
  const large = await browser.evaluate(
    "__PERFORMANCE__.run('showcase-box-columns-100k','baseline',2,3).then(r=>({decision:r.solverDecision,passed:r.finite && !r.counters.overflow && !r.counters.clashes,kernel:r.kernel}))",
  );
  assert(
    large.passed &&
      large.kernel === "baseline" &&
      large.decision.selected === "standard",
    "large baseline was silently optimized",
  );
  results.push({ scene: "showcase-box-columns-100k", ...large });
  await browser.navigate("test-results/solver-performance.html");
  await wait("[...document.querySelectorAll('article')].some(a=>a.textContent.includes('Ragdolls on a rigid net'))");
  await browser.evaluate(
    "[...document.querySelectorAll('article')].find(a=>a.textContent.includes('Ragdolls on a rigid net')).scrollIntoView()",
  );
  await browser.screenshot(
    "test-results/screenshots/solver-ragdolls-explanation.png",
  );
  assert(!browser.errors.length, browser.errors.join("\n"));
  await writeFile(
    "test-results/solver-selection.json",
    JSON.stringify({ passed: true, results, errors: browser.errors }, null, 2),
  );
  console.log(
    "PASS automatic GPU layouts, preview defaults and developer override compatibility",
  );
} finally {
  await browser.close();
}
