import { browserCheck } from "./browser-check.mjs";
import { readFile, writeFile } from "node:fs/promises";
const report = JSON.parse(
  await readFile("test-results/package-performance.json", "utf8"),
);
const expectedRows = report.runs.reduce(
  (n, r) =>
    n +
    Number(!!r.sleeping) +
    Number(!!r.sleeping2D) +
    (r.nativeEdits?.length ?? 0) +
    (r.nativeEdits?.filter((e) => e.motion).length ?? 0) +
    2 * (r.nativeOverhead?.length ?? 0),
  0,
);
const browser = await browserCheck(),
  checks = [];
try {
  for (const width of [1440, 390]) {
    await browser.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await browser.navigate("test-results/package-performance.html");
    for (let i = 0; i < 100; i++) {
      if (
        await browser.evaluate(
          "document.readyState==='complete'&&document.querySelector('h1')?.textContent==='Native GPU API benchmarks'",
        )
      )
        break;
      await new Promise((r) => setTimeout(r, 50));
    }
    const result = await browser.evaluate(
      `({width:innerWidth,scroll:document.documentElement.scrollWidth,rows:document.querySelectorAll('tbody tr').length,laptop:document.body.textContent.includes('RTX 4070 Laptop GPU'),links:[...document.querySelectorAll('nav a')].map(a=>a.getAttribute('href'))})`,
    );
    if (
      result.scroll > width ||
      result.rows !== expectedRows ||
      !result.laptop ||
      !result.links.includes("../")
    )
      throw Error(JSON.stringify(result));
    checks.push(result);
    await browser.screenshot(
      `test-results/screenshots/package-performance-report-${width}.png`,
    );
    await browser.evaluate(
      "[...document.querySelectorAll('h3')].find(h => h.textContent === 'Updating 100,000 bodies together')?.scrollIntoView({block:'start'});window.scrollBy(0,-24)",
    );
    await browser.screenshot(
      `test-results/screenshots/package-bulk-edits-${width}.png`,
    );
  }
  if (browser.errors.length) throw Error(browser.errors.join("\n"));
  await writeFile(
    "test-results/package-report-check.json",
    JSON.stringify({ passed: true, checks }, null, 2),
  );
  console.log(
    "PASS native API report: GPU provenance, measured rows, navigation and desktop/mobile layout",
  );
} finally {
  await browser.close();
}
