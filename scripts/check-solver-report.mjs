import { browserCheck } from "./browser-check.mjs";
import { readFile, writeFile } from "node:fs/promises";

const data = JSON.parse(
  await readFile("test-results/solver-performance.json", "utf8"),
);
const catalog = JSON.parse(
  await readFile("test-results/solver-scenes.json", "utf8"),
);
if (
  data.summary.length !== 4 ||
  data.checkedScenes !== catalog.results.length ||
  data.errors.length ||
  catalog.results.some((r) => !r.passed)
)
  throw Error("Incomplete production solver report data");
const browser = await browserCheck();
const results = [];
const expectedSleepCharts =
  data.packageBenchmarks?.runs.reduce(
    (sum, r) => sum + Number(!!r.sleeping) + Number(!!r.sleeping2D),
    0,
  ) ?? 0;
try {
  for (const width of [1440, 390]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await browser.navigate("test-results/solver-performance.html");
    for (let i = 0; i < 100; i++) {
      if (
        await browser.evaluate(
          "document.querySelectorAll('article:not(.sleep-run)').length===4",
        )
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    const result = await browser.evaluate(`(async()=>{
      for(const image of document.images) await image.decode();
      return {width:innerWidth,scroll:document.documentElement.scrollWidth,
        cards:document.querySelectorAll('article:not(.sleep-run)').length,
        sleepCharts:document.querySelectorAll('.sleep-run').length,
        sleepBars:document.querySelectorAll('.sleep-run .bar span').length,
        images:[...document.images].every(image=>image.naturalWidth>0),
        stages:document.querySelectorAll('article:not(.sleep-run) .bar span').length,
        namedHardware:document.body.textContent.includes('RTX 4070 Laptop GPU')&&!document.body.textContent.toLowerCase().includes('this laptop')};
    })()`);
    if (
      result.cards !== 4 ||
      result.stages !== 16 ||
      result.sleepCharts !== expectedSleepCharts ||
      result.sleepBars !== expectedSleepCharts * 2 ||
      !result.namedHardware ||
      !result.images ||
      result.scroll > result.width
    )
      throw Error(JSON.stringify(result));
    const explanation = await browser.evaluate(`(()=>{
      const text=document.body.innerText;
      return {plain:text.includes('Smaller time = faster simulation.') && text.includes('Drawing is separate.') && text.includes('What is “Move + prepare”?'),
        localVsPaper:[...document.querySelectorAll('article:not(.sleep-run)')].every(a=>a.textContent.includes('GPU AVBD') && a.textContent.includes('Physics per step')) && text.includes('separate native implementation on a desktop GPU'),
        automatic:!!document.querySelector('#solver-selection') && text.includes('rechecks the choice when objects or connections change'),
        unambiguous:!text.includes('Original math') && !text.includes('Streamlined math') && !text.includes('Standard WebGPU solver') && !text.includes('Optimized WebGPU solver'),
        paperScenes:['paper-walls-510k-3','paper-walls-510k-4','paper-cloth-35k'].every(id=>document.querySelector('a[href*="scene='+id+'"]')),
        limits:text.includes('different fabric model') && text.includes('same scene on the same graphics card'),
        hiddenHardware:[...document.querySelectorAll('details')].some(d=>!d.open && d.textContent.includes('16,384'))};
    })()`);
    if (!Object.values(explanation).every(Boolean))
      throw Error(JSON.stringify(explanation));
    result.explanation = explanation;
    const protections = await browser.evaluate(`(()=>{
      const text=document.body.innerText;
      return {comparison:!!document.querySelector('#contact-scheduling'),
        protection:text.includes('A held step still fails the correctness checks.')};
    })()`);
    if (!Object.values(protections).every(Boolean))
      throw Error(JSON.stringify(protections));
    result.protections = protections;
    if (data.hploc) {
      const treeInfo = await browser.evaluate(
        "!!document.querySelector('#gpu-tree') && document.body.innerText.includes('Body count alone does not choose the tree.')",
      );
      if (!treeInfo) throw Error("Missing plain-English tree comparison");
    }
    if (data.capsuleBenchmark) {
      if (
        !(await browser.evaluate(
          "document.querySelectorAll('#capsule-collisions .bar span').length===2 && document.querySelector('#capsule-collisions').textContent.includes('Movement, drawing and frame rate are not part')",
        ))
      )
        throw Error("Missing capsule collision comparison");
      await browser.evaluate(
        "document.querySelector('#capsule-collisions').scrollIntoView()",
      );
      await browser.screenshot(
        `test-results/screenshots/solver-capsules-${width}.png`,
      );
    }
    if (data.ragdollCollision?.phases.length) {
      const ragdolls = await browser.evaluate(
        `({charts:document.querySelectorAll('.ragdoll-run').length,bars:document.querySelectorAll('.ragdoll-run .bar span').length,plain:document.querySelector('#gpu-tree').textContent.includes('this is not a frame-rate measurement')})`,
      );
      const fiveIterations = await browser.evaluate(
        "document.querySelector('#gpu-tree').textContent.includes('five solver iterations') && [...document.querySelectorAll('article:not(.sleep-run)')].some(a=>a.textContent.includes('Ragdolls on a rigid net') && a.textContent.includes('5 solver iterations per step'))",
      );
      if (
        ragdolls.charts !== 2 ||
        ragdolls.bars !== 12 ||
        !ragdolls.plain ||
        !fiveIterations
      )
        throw Error(JSON.stringify(ragdolls));
      result.ragdolls = ragdolls;
      await browser.evaluate(
        "document.querySelector('.ragdoll-run').scrollIntoView()",
      );
      await browser.screenshot(
        `test-results/screenshots/solver-ragdoll-collisions-${width}.png`,
      );
    }
    await browser.screenshot(
      `test-results/screenshots/solver-report-${width}.png`,
    );
    await browser.evaluate(
      "document.querySelector('#sleeping-comparison').scrollIntoView()",
    );
    await browser.screenshot(
      `test-results/screenshots/solver-sleeping-${width}.png`,
    );
    if (data.packageBenchmarks?.runs.some((r) => r.sleeping2D)) {
      await browser.evaluate(
        "document.querySelector('#sleeping-2d-comparison').scrollIntoView()",
      );
      await browser.screenshot(
        `test-results/screenshots/solver-sleeping-2d-${width}.png`,
      );
    }
    await browser.evaluate(
      "document.querySelector('#contact-scheduling').scrollIntoView()",
    );
    await browser.screenshot(
      `test-results/screenshots/solver-contacts-${width}.png`,
    );
    if (data.hploc) {
      await browser.evaluate(
        "document.querySelector('#gpu-tree').scrollIntoView()",
      );
      await browser.screenshot(
        `test-results/screenshots/solver-tree-${width}.png`,
      );
    }
    await browser.evaluate(
      "[...document.querySelectorAll('h2')].find(h=>h.textContent==='How does this compare with the paper?').closest('section').scrollIntoView()",
    );
    await browser.screenshot(
      `test-results/screenshots/solver-paper-${width}.png`,
    );
    results.push(result);
  }
  if (browser.errors.length) throw Error(browser.errors.join("\n"));
  await writeFile(
    "test-results/solver-report-check.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
  console.log(
    "PASS production solver report: four stage charts, separate paper comparison, all images loaded, desktop/mobile fit",
  );
} finally {
  await browser.close();
}
