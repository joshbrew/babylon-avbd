import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { writeReport } from "./report-file.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";
await mkdir(".temp", { recursive: true });
await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `export {checkColorBuckets} from './tests/gpu-color-buckets.js'; export {createWebGPUDevice} from './src/gpu/device.js';`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/color-buckets.js",
});
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  const result = await b.evaluate(`(async()=>{
    const {checkColorBuckets,createWebGPUDevice}=await import('/.temp/color-buckets.js');const {device,adapter}=await createWebGPUDevice();
    const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    try{
      if(!device.features.has('timestamp-query'))throw Error('Timestamp queries required');
      const results=[];for(const dimension of [2,3])for(const dynamicEvery of [0,64])results.push(...await checkColorBuckets(device,dimension,[256,1024,2416,100000,510000],true,dynamicEvery));
      return {date:new Date().toISOString(),adapter:{vendor:adapter.info.vendor,architecture:adapter.info.architecture,description:adapter.info.description},results,errors};
    }finally{device.destroy();}
  })()`);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(b.errors, []);
  for (const row of result.results)
    console.log(JSON.stringify({ ...row, samples: undefined }));
  await writeReport("test-results/color-bucket-performance.json", {
    passed: true,
    method:
      "GPU color bucketing only; excludes graph coloring rounds, collisions, AVBD solving and rendering. Exact word-for-word comparison, 10 warmup and 20 alternating samples, 20 dispatches per sample; 1, 4 and 64 colors, static and pending bodies, spare capacity and partial workgroups.",
    ...result,
    ...(await gpuBenchmarkHardware(result.adapter)),
  });
} finally {
  await b.close();
}
