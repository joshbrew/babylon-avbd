import { browserCheck } from "./browser-check.mjs";
import { writeFile } from "node:fs/promises";
const b = await browserCheck(),
  results = [];
const wait = async (expression) => {
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 30));
  }
  throw Error("Navigation timed out: " + expression);
};
try {
  for (const page of [
    "?demo=slingshot",
    "?demo=benchmark",
    "?demo=showcase",
    "?demo=rock",
    "?demo=cannon",
    "?demo=gpu-stress",
    "tests/performance.html",
    "test-results/report.html",
    "test-results/solver-performance.html",
  ]) {
    await b.navigate(page);
    await wait(
      `[...document.querySelectorAll('a,button')].some(e=>e.textContent.includes('Back to main page')&&e.getBoundingClientRect().width>0)`,
    );
    const link = await b.evaluate(
      `(()=>{const e=[...document.querySelectorAll('a,button')].find(e=>e.textContent.includes('Back to main page'));e.scrollIntoView();const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,href:e.getAttribute('href')};})()`,
    );
    await b.screenshot(
      "test-results/screenshots/navigation-" +
        page.replace(/[^a-z0-9]/gi, "-") +
        ".png",
    );
    await b.call("Input.dispatchMouseEvent", {
      type: "mousePressed",
      button: "left",
      clickCount: 1,
      x: link.x,
      y: link.y,
    });
    await b.call("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      button: "left",
      clickCount: 1,
      x: link.x,
      y: link.y,
    });
    await wait(
      "location.pathname==='/'&&!!document.querySelector('.canonical-lab')&&globalThis.__AVBD_LAB__?.diagnostics.ready&&__AVBD_LAB__.diagnostics.scene==='showcase-brick-ring-28k'",
    );
    await b.evaluate("__AVBD_LAB__.dispose()");
    results.push({ page, passed: true });
    console.log("PASS back to main: " + page);
  }
  // Read the test page's navigation without starting its independent GPU suite.
  const gpuPage = await b.evaluate(
    `fetch('/tests/gpu.html').then(r=>r.text()).then(html=>{const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/'&&a.textContent.includes('Back to main page'));})`,
  );
  if (!gpuPage || b.errors.length)
    throw Error(JSON.stringify({ gpuPage, errors: b.errors }));
  results.push({
    page: "tests/gpu.html",
    passed: true,
    checked: "HTML navigation",
  });
  await writeFile(
    "test-results/navigation.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
} finally {
  await b.close();
}
