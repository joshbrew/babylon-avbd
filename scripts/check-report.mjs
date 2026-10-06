import { browserCheck } from "./browser-check.mjs";
import { readFile } from "node:fs/promises";
const scenes = JSON.parse(
  await readFile("test-results/scenes.json", "utf8"),
).results;
const expected = scenes.length;
const filterName = scenes[0].name;
const expectedVisible = scenes.filter((s) =>
  s.name.toLowerCase().includes(filterName.toLowerCase()),
).length;
const b = await browserCheck();
try {
  await b.navigate("test-results/report.html");
  for (let i = 0; i < 200; i++) {
    if (
      await b.evaluate(
        `document.querySelectorAll("[data-name]").length===${expected}`,
      )
    )
      break;
    await new Promise((r) => setTimeout(r, 30));
  }
  const result = await b.evaluate(
    `(async()=>{const imgs=[...document.images];for(const img of imgs){img.loading='eager';await img.decode();}const input=document.querySelector('#filter');input.value=${JSON.stringify(filterName)};input.dispatchEvent(new Event('input'));const visible=[...document.querySelectorAll('[data-name]')].filter(e=>!e.hidden).length;input.value='';input.dispatchEvent(new Event('input'));return {cards:document.querySelectorAll('[data-name]').length,visible,broken:imgs.filter(i=>!i.naturalWidth).length,scrollWidth:document.documentElement.scrollWidth,width:innerWidth};})()`,
  );
  if (
    result.cards !== expected ||
    result.visible !== expectedVisible ||
    result.broken ||
    result.scrollWidth > result.width ||
    b.errors.length
  )
    throw Error(JSON.stringify({ result, errors: b.errors }));
  await b.screenshot("test-results/screenshots/report.png");
  await b.call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const mobile = await b.evaluate(
    "({width:innerWidth,scroll:document.documentElement.scrollWidth})",
  );
  if (mobile.scroll > mobile.width) throw Error(JSON.stringify(mobile));
  await b.screenshot("test-results/screenshots/report-390.png");
  console.log(
    `PASS report: ${expected} scene cards, all images loaded, filter works, no horizontal overflow`,
  );
} finally {
  await b.close();
}
