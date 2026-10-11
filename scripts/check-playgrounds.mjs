import { galtonStatistics } from "../demo/galton-board/statistics.js";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { writeAtomicFile as writeFile } from "./report-file.mjs";
import { browserCheck } from "./browser-check.mjs";

const b = await browserCheck(),
  results = [];
const previous = await readFile("test-results/playgrounds.json", "utf8")
  .then(JSON.parse)
  .catch(() => ({ results: [] }));
const caseKey = (r) =>
  [r.scene, r.renderer ?? "physics", r.scope ?? "main"].join("/");
async function save(passed = false) {
  const keys = new Set(results.map(caseKey));
  const retained =
    process.argv.includes("--galton") ||
    process.argv.includes("--workers-only") ||
    process.argv.includes("--benchmarks-only")
      ? previous.results.filter((r) => !keys.has(caseKey(r)))
      : [];
  await writeFile(
    "test-results/playgrounds.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed,
        results: [...retained, ...results],
      },
      null,
      2,
    ),
  );
}
async function ready(expression) {
  for (let i = 0; i < 4000; i++) {
    if (await b.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 30));
  }
  throw Error(
    `Scene did not initialize: ${expression} ${JSON.stringify(await b.evaluate("({text:document.body.innerText.slice(-2000),errors:globalThis.__WORKER_BENCH__?.errors})"))} ${JSON.stringify(b.errors)}`,
  );
}
async function step(n) {
  for (let i = 0; i < n; i += 60)
    await b.evaluate(
      `(async()=>{await __AVBD_LAB__.step(${Math.min(60, n - i)});await __AVBD_LAB__.collect();})()`,
    );
}
async function snapshot() {
  return b.evaluate(
    "(async()=>{await __AVBD_LAB__.collect();return __AVBD_LAB__.snapshot({joints:true});})()",
  );
}
function valid(s) {
  assert.ok(s.poses.every(Number.isFinite), "All poses must be finite");
  assert.deepEqual(s.errors, []);
  assert.equal(s.stats.overflow, 0);
  assert.equal(s.stats.clashes, 0);
  for (let i = 0; i < s.bodyCount; i++)
    assert.ok(
      Math.abs(Math.hypot(...s.poses.slice(i * 40 + 4, i * 40 + 8)) - 1) <
        0.0001,
    );
}
async function action(id) {
  await b.evaluate(
    `document.querySelector('#lab-play-buttons [data-action="${id}"]').click();__AVBD_LAB__.pause(true)`,
  );
}
try {
  await mkdir("test-results/screenshots", { recursive: true });
  for (const id of process.argv.includes("--workers-only") ||
  process.argv.includes("--benchmarks-only")
    ? []
    : process.argv.includes("--galton")
      ? ["3d-marble-cascade"]
      : ["3d-tornado-town", "3d-domino-spiral", "3d-marble-cascade"]) {
    await b.navigate(
      `?demo=canonical&scope=main&scene=${id}&backend=gpu&scope=main&paused=1`,
    );
    await ready("globalThis.__AVBD_LAB__?.diagnostics.ready");
    assert.equal(
      await b.evaluate("document.querySelector('.lab-metrics').open"),
      false,
      "Playgrounds should leave the view clear by default",
    );
    const initial = await snapshot();
    valid(initial);
    await step(240);
    const settled = await snapshot();
    valid(settled);
    const play = settled.playground;
    let details;
    if (id === "3d-tornado-town") {
      const broken = (s) =>
        play.bonds.filter(
          (i) =>
            s.jointStates[i * 32 + 3] === 0 && s.jointStates[i * 32 + 7] === 0,
        ).length;
      assert.equal(broken(settled), 0, "Town must stand before the storm");
      await action("start");
      await step(1440);
      const storm = await snapshot();
      valid(storm);
      const lifted = play.debris.filter(
        (i) => storm.poses[i * 40 + 2] > initial.poses[i * 40 + 2] + 1,
      ).length;
      details = { lifted, broken: broken(storm), bodies: storm.bodyCount };
      assert.ok(
        lifted > 100 && details.broken > 100,
        "Wind must lift physical debris and fracture mortar",
      );
      await b.screenshot(`test-results/screenshots/${id}.png`);
      await action("stop");
      await step(240);
      assert.equal((await snapshot()).playground.active, false);
    } else if (id === "3d-domino-spiral") {
      assert.equal(play.dominos.length, 2048);
      const fallen = (s) =>
        play.dominos.filter((i) => s.poses[i * 40 + 2] < 0.55).length;
      assert.equal(fallen(settled), 0, "Dominoes must stand until tipped");
      await action("start");
      await step(1440);
      const chain = await snapshot();
      valid(chain);
      details = { fallen: fallen(chain), bodies: chain.bodyCount };
      assert.ok(
        details.fallen > 60,
        "The first impulse must propagate through many dominoes",
      );
      await b.screenshot(`test-results/screenshots/${id}.png`);
    } else {
      assert.equal(play.marbles.length, 40000);
      assert.equal(play.galton.queued, 40000);
      assert.ok(
        play.marbles.every((i) => settled.poses[i * 40 + 2] > 30),
        "Closed hatch must retain the marbles",
      );
      await action("start");
      await step(6000);
      await b.screenshot("test-results/screenshots/3d-marble-cascade-flow.png");
      console.log("Galton: 6,000 steps, checking the full release next");
      const fullReleaseStep = 12000;
      await step(fullReleaseStep - 6000);
      let cascade = await snapshot();
      console.log(
        JSON.stringify({
          step: fullReleaseStep,
          galton: cascade.playground.galton,
        }),
      );
      for (
        let extra = 0;
        extra < 15 &&
        cascade.playground.galton.bins.reduce((a, b) => a + b, 0) < 39800;
        extra++
      ) {
        await step(4000);
        cascade = await snapshot();
        console.log(
          JSON.stringify({
            step: fullReleaseStep + (extra + 1) * 4000,
            galton: cascade.playground.galton,
          }),
        );
      }
      valid(cascade);
      const histogram = Array(cascade.playground.galton.bins.length).fill(0);
      for (const i of play.marbles) {
        if (cascade.poses[i * 40 + 2] < 7.5) {
          const bin = Math.floor(
            (cascade.poses[i * 40] + histogram.length * 0.52) / 1.04,
          );
          if (bin >= 0 && bin < histogram.length) histogram[bin]++;
        }
      }
      const measured = cascade.playground.galton;
      assert.deepEqual(
        measured.bins,
        histogram,
        "GPU bin counts must match actual sphere positions",
      );
      assert.equal(measured.released, 40000);
      assert.equal(measured.queued, 0);
      assert.equal(measured.escaped, 0);
      const { expected, ...distribution } = galtonStatistics(histogram);
      console.log(JSON.stringify({ distribution }));
      await b.screenshot("test-results/screenshots/3d-marble-cascade.png");
      assert.ok(
        distribution.count >= 39800,
        "At least 99.5% of marbles must reach the bins; test the final distribution",
      );
      assert.ok(
        Math.abs(distribution.mean) < 0.5,
        "The distribution must be centered",
      );
      assert.ok(
        distribution.standardDeviation > 2 &&
          distribution.standardDeviation < 6,
        "Pegs must spread the sample across the board",
      );
      assert.ok(
        Math.abs(distribution.skewness) < 0.35,
        "Left/right spread must be approximately symmetric",
      );
      assert.ok(
        // Colliding marbles are not independent coin flips. Allow a broader
        // peak than the ideal binomial model, while rejecting flat/edge-heavy
        // samples and requiring the fitted CDF to agree within 3% below.
        distribution.kurtosis > 2.2 && distribution.kurtosis < 3.5,
        "The sample must have a bell-shaped peak and tails",
      );
      assert.ok(
        distribution.cdfError < 0.03,
        "The bin counts must approximate a normal distribution",
      );
      assert.ok(
        await b.evaluate("!!document.querySelector('#lab-galton-chart svg')"),
      );
      details = {
        released: measured.released,
        collected: distribution.count,
        timeStep: initial.timeStep,
        iterations: initial.iterations,
        outletWidth: play.feed.outletWidth,
        histogram,
        distribution,
        bodies: cascade.bodyCount,
        flowScreenshot: "screenshots/3d-marble-cascade-flow.png",
      };
      await b.screenshot(`test-results/screenshots/${id}.png`);
      await action("shake");
      await step(120);
      valid(await snapshot());
    }
    results.push({
      scene: id,
      passed: true,
      ...details,
      screenshot: `screenshots/${id}.png`,
    });
    await save();
    console.log(JSON.stringify(results.at(-1)));
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert.ok(await b.evaluate("document.body.scrollWidth <= innerWidth"));
    const mobile = `test-results/screenshots/${id}-mobile.png`;
    await b.screenshot(mobile);
    results.at(-1).mobileScreenshot = mobile.replace("test-results/", "");
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }
  // Both renderers and worker input modes use the same actions and world.
  for (const sceneId of process.argv.includes("--benchmarks-only") ||
  process.argv.includes("--distribution-only")
    ? []
    : process.argv.includes("--galton")
      ? ["3d-marble-cascade"]
      : ["3d-tornado-town", "3d-domino-spiral", "3d-marble-cascade"])
    for (const renderer of ["webgpu", "babylon"])
      for (const scope of ["worker", "worker-sab"]) {
        await b.navigate(
          `tests/workers.html?scene=${sceneId}&backend=gpu&renderer=${renderer}&scope=${scope}`,
        );
        await ready(
          "globalThis.__WORKER_BENCH__?.ready && globalThis.__WORKER_BENCH__?.client?.info?.bodies > 2000",
        );
        await b.evaluate(
          "__WORKER_BENCH__.client.control('pause',true);__WORKER_BENCH__.client.control('play','start')",
        );
        await b.evaluate("__WORKER_BENCH__.client.step(120)");
        const s = await b.evaluate("__WORKER_BENCH__.client.snapshot()");
        if (sceneId === "3d-marble-cascade") {
          assert.equal(s.galton.released + s.galton.queued, 40000);
          assert.ok(s.galton.released > 0 && s.galton.queued > 0);
        }
        assert.ok(s.poses.every(Number.isFinite));
        assert.deepEqual(s.errors, []);
        assert.equal(s.counters.overflow, 0);
        assert.equal(s.counters.clashes, 0);
        assert.equal(
          s.playActions.length,
          sceneId === "3d-domino-spiral"
            ? 1
            : sceneId === "3d-marble-cascade"
              ? 3
              : 2,
        );
        results.push({
          scene: sceneId,
          renderer,
          scope,
          passed: true,
          bodies: s.bodies,
        });
        await save();
        console.log(JSON.stringify(results.at(-1)));
        if (renderer === "babylon" && scope === "worker") {
          const screenshot = `test-results/screenshots/${sceneId}-babylon-worker.png`;
          await b.screenshot(screenshot);
          results.at(-1).screenshot = screenshot.replace("test-results/", "");
        }
      }
  if (
    !process.argv.includes("--workers-only") &&
    !process.argv.includes("--distribution-only")
  ) {
    await b.navigate("tests/performance.html?scene=3d-empty");
    await ready(
      "!!globalThis.__PERFORMANCE__ && !!globalThis.__BENCHMARK_VIEW__",
    );
    await b.evaluate("__BENCHMARK_VIEW__.suspendPreview()");
    for (const scene of process.argv.includes("--galton")
      ? ["3d-marble-cascade"]
      : ["3d-tornado-town", "3d-domino-spiral", "3d-marble-cascade"]) {
      const result = await b.evaluate(
        `__PERFORMANCE__.run(${JSON.stringify(scene)},"production",60,3)`,
      );
      assert.equal(result.sceneAction, "start");
      assert.ok(result.finite);
      assert.equal(result.counters.overflow, 0);
      assert.equal(result.counters.clashes, 0);
      if (scene === "3d-marble-cascade") {
        assert.equal(result.galton.released + result.galton.queued, 40000);
        assert.equal(result.galton.opened, true);
      }
      results.push({
        scene,
        renderer: "none",
        scope: "solver-only",
        passed: true,
        bodies: result.bodyCount,
        sceneAction: result.sceneAction,
        galton: result.galton,
      });
      await save();
      console.log(JSON.stringify(results.at(-1)));
      if (scene === "3d-marble-cascade") {
        const rendered = await b.evaluate(
          `__PERFORMANCE__.runRenderers("3d-marble-cascade",{warmup:3,samples:3,width:640,height:360})`,
        );
        assert.ok(rendered.identicalState && rendered.finite);
        assert.equal(rendered.sceneAction, "start");
        assert.equal(rendered.galton.released + rendered.galton.queued, 40000);
        assert.equal(rendered.galton.opened, true);
        results.push({
          scene,
          renderer: "paired",
          scope: "renderer-comparison",
          passed: true,
          bodies: rendered.bodyCount,
          identicalState: rendered.identicalState,
          galton: rendered.galton,
        });
        await save();
        console.log(JSON.stringify(results.at(-1)));
      }
    }
  }
  assert.deepEqual(b.errors, []);
  await save(true);
} finally {
  await b.close();
}
