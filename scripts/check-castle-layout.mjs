import { browserCheck } from "./browser-check.mjs";
const b = await browserCheck();
try {
  await b.navigate("?demo=cannon&paused=1");
  for (let i = 0; i < 600; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  for (const width of [1440, 390]) {
    await b.call("Emulation.setDeviceMetricsOverride", {
      width,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.evaluate("__AVBD_LAB__.step()");
    const state = await b.evaluate(
      `(()=>{const v=document.querySelector('.lab-view').getBoundingClientRect(),a=document.querySelector('.lab-sidebar').getBoundingClientRect();return {width:innerWidth,scroll:document.documentElement.scrollWidth,canvasWidth:v.width,canvasHeight:v.height,sidebarY:a.y,errors:__AVBD_LAB__.diagnostics.errors};})()`,
    );
    if (
      state.scroll > width ||
      state.canvasWidth < width * (width < 600 ? 0.95 : 0.65) ||
      state.canvasHeight < 400 ||
      state.errors.length
    )
      throw Error(JSON.stringify(state));
    if (width < 600 && state.sidebarY < 400)
      throw Error("Mobile controls should sit below the castle");
    await b.screenshot(
      `test-results/screenshots/castle-${width === 1440 ? "ready" : "390"}.png`,
    );
    console.log(
      `PASS castle layout ${width}: scene ${Math.round(state.canvasWidth)} × ${Math.round(state.canvasHeight)}, controls remain accessible`,
    );
  }
} finally {
  await b.close();
}
