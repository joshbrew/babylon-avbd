import { build } from "esbuild";
import { writeFile, mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
await mkdir(".temp", { recursive: true });
await build({
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/native-performance.js",
  stdin: {
    resolveDir: process.cwd(),
    contents: `
  export {nativeEditPerformance,nativeOverheadPerformance} from './tests/native-edit-performance.js';
  export {createWebGPUDevice} from './src/gpu/device.js';
`,
  },
});
const browser = await browserCheck();
try {
  await browser.navigate("test-results/solver-performance.html");
  const result = await browser.evaluate(`(async()=>{
    const {nativeEditPerformance,nativeOverheadPerformance,createWebGPUDevice}=await import('/.temp/native-performance.js');
    const {device,adapter}=await createWebGPUDevice({preferredLimits:{maxStorageBufferBindingSize:512*1024*1024,maxBufferSize:1024*1024*1024}});
    const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    try {
      const results=[],overhead=[];for(const dimension of [2,3]){results.push(await nativeEditPerformance(device,dimension));overhead.push(await nativeOverheadPerformance(device,dimension));}
      return {date:new Date().toISOString(),adapter:adapter.info.toJSON?.()??{vendor:adapter.info.vendor,description:adapter.info.description},scope:'100,000 native velocity edits; 10,000 property edits; 64 shape queries. Excludes solving and rendering.',results,overhead,errors};
    }finally{device.destroy();}
  })()`);
  if (browser.errors.length || result.errors.length)
    throw Error(
      JSON.stringify({ browser: browser.errors, gpu: result.errors }),
    );
  if (process.platform === "win32") {
    try {
      const { stdout } = await promisify(execFile)(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion | ConvertTo-Json -Compress",
        ],
        { windowsHide: true },
      );
      const hardware = JSON.parse(stdout),
        cards = Array.isArray(hardware) ? hardware : [hardware];
      const vendor = { nvidia: "NVIDIA", intel: "Intel", amd: "AMD" }[
        result.adapter.vendor?.toLowerCase()
      ];
      const matching = vendor
        ? cards.filter((c) => c.Name.includes(vendor))
        : [];
      if (matching.length === 1) {
        result.hardwareLabel = matching[0].Name;
        result.driver = matching[0].DriverVersion;
      }
    } catch {
      result.hardwareLabel =
        result.adapter.description || "GPU model unavailable";
    }
  }
  await writeFile(
    "test-results/native-api-performance.json",
    JSON.stringify(result, null, 2),
  );
  for (const r of result.results)
    console.log(
      `${r.dimension}D ${r.bodies} edits: object calls ${r.objects.cpuSubmitMs.toFixed(2)}ms CPU; editBodies ${r.commands.cpuSubmitMs.toFixed(2)}ms CPU / ${(r.commands.uploadedBytes / 1e6).toFixed(1)}MB; packed ${r.packed.cpuSubmitMs.toFixed(2)}ms CPU / ${(r.packed.uploadedBytes / 1e6).toFixed(1)}MB; identical selected records`,
    );
  for (const r of result.results)
    console.log(
      `${r.dimension}D combined motion: objects ${r.motion.objects.cpuSubmitMs.toFixed(2)}ms CPU, bulk ${r.motion.commands.cpuSubmitMs.toFixed(2)}ms, packed ${r.motion.packed.cpuSubmitMs.toFixed(2)}ms / ${(r.motion.packed.uploadedBytes / 1e6).toFixed(1)}MB`,
    );
  for (const r of result.overhead)
    console.log(
      `${r.dimension}D properties: per-body flush ${r.properties.perBodyFlush.cpuSubmitMs.toFixed(2)}ms CPU / ${r.properties.perBodyFlush.writeCalls} writes, one flush ${r.properties.oneFlush.cpuSubmitMs.toFixed(2)}ms / ${r.properties.oneFlush.writeCalls} writes; 64 queries individual ${r.queries.individualMs.toFixed(2)}ms, grouped ${r.queries.batchMs.toFixed(2)}ms`,
    );
} finally {
  await browser.close();
}
