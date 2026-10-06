import { browserCheck } from "./browser-check.mjs";
import { readdir, readFile } from "node:fs/promises";
const b = await browserCheck();
try {
  await b.navigate("?demo=canonical&scene=2d-empty&backend=ref");
  for (let i = 0; i < 300; i++) {
    if (await b.evaluate("globalThis.__AVBD_LAB__?.diagnostics.ready")) break;
    await new Promise((r) => setTimeout(r, 30));
  }
  await b.evaluate("__AVBD_LAB__.stop()");
  const supported = new Set(
    JSON.parse(await readFile("test-results/scenes.json", "utf8")).results.map(
      (s) => s.name + ".png",
    ),
  );
  const files = (await readdir("test-results/screenshots")).filter((f) =>
    supported.has(f),
  );
  for (const [label, filter] of [
    ["2d", (s) => s.startsWith("2d-") && s.endsWith("-ref.png")],
    ["2d-sequential", (s) => s.startsWith("2d-") && s.endsWith("-soa-seq.png")],
    [
      "2d-colored",
      (s) => s.startsWith("2d-") && s.endsWith("-soa-colored.png"),
    ],
    ["3d-cpu", (s) => s.startsWith("3d-") && s.endsWith("-ref.png")],
    ["3d-gpu", (s) => s.startsWith("3d-") && s.endsWith("-gpu.png")],
    ["2d-gpu", (s) => s.startsWith("2d-") && s.endsWith("-gpu.png")],
    ["showcase", (s) => s.startsWith("showcase-") && s.endsWith("-gpu.png")],
  ]) {
    const names = files.filter(filter).sort();
    const height = Math.ceil(names.length / 4) * 245;
    await b.call("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await b.evaluate(
      `(async()=>{document.body.innerHTML='<canvas id="sheet" width="1440" height="${height}" style="display:block"></canvas>';document.body.style='margin:0;background:white;overflow:hidden';document.documentElement.style.overflow='hidden';const c=document.getElementById('sheet').getContext('2d');c.fillStyle='white';c.fillRect(0,0,1440,${height});const files=${JSON.stringify(names)};for(let i=0;i<files.length;i++){const img=new Image();img.src='/test-results/screenshots/'+files[i];await img.decode();const x=i%4*360,y=Math.floor(i/4)*245;c.drawImage(img,300,60,1140,790,x,y+24,355,215);c.fillStyle='#26303a';c.font='13px system-ui';c.fillText(files[i].replace('.png',''),x+8,y+17);}})()`,
    );
    await b.screenshot(`test-results/screenshots/contact-sheet-${label}.png`);
  }
} finally {
  await b.close();
}
