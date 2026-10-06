import { browserCheck } from "./browser-check.mjs";
import { writeFile, mkdir } from "node:fs/promises";
const b = await browserCheck(),
  results = [];
try {
  await mkdir("test-results/screenshots", { recursive: true });
  for (const route of ["rock", "showcase", "cannon", "benchmark"]) {
    const errorStart = b.errors.length;
    await b.navigate("?demo=" + route);
    for (let i = 0; i < 300; i++) {
      if (await b.evaluate('document.querySelector("canvas")?.width > 300'))
        break;
      await new Promise((r) => setTimeout(r, 50));
    }
    if (route === "benchmark")
      await b.evaluate(
        `(()=>{const inputs=document.querySelectorAll('input');inputs[2].value=2000;inputs[3].value=2000;[...document.querySelectorAll('button')].find(e=>e.textContent==='Start benchmark').click();})()`,
      );
    if (route === "cannon")
      await b.evaluate(
        `[...document.querySelectorAll('button')].find(e=>e.textContent==='Shoot').click()`,
      );
    const samples = await b.evaluate(
      `new Promise(resolve=>{const samples=[];let last=performance.now();const sample=now=>{if(samples.length>=90)return resolve(samples.slice(10));samples.push(now-last);last=now;requestAnimationFrame(sample);};requestAnimationFrame(sample);})`,
    );
    samples.sort((a, b) => a - b);
    await b.screenshot(`test-results/screenshots/route-${route}.png`);
    const metrics = await b.evaluate("document.body.innerText");
    const errors = b.errors.slice(errorStart);
    const entry = {
      route,
      frameMs: {
        mean: samples.reduce((a, b) => a + b, 0) / samples.length,
        median: samples[Math.floor(samples.length * 0.5)],
        p95: samples[Math.floor(samples.length * 0.95)],
      },
      errors,
      metrics,
      passed: !errors.length,
    };
    results.push(entry);
    console.log(
      `${entry.passed ? "PASS" : "FAIL"} ${route}: ${(1000 / entry.frameMs.median).toFixed(1)} FPS`,
    );
    await writeFile(
      "test-results/routes.json",
      JSON.stringify({ results }, null, 2),
    );
  }
  if (results.some((s) => !s.passed)) process.exitCode = 1;
} finally {
  await b.close();
}
