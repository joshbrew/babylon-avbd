import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
await mkdir(".temp", { recursive: true });
await build({
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/contact-compatibility-features.js",
  stdin: {
    resolveDir: process.cwd(),
    contents: `
export {createWebGPUDevice} from './src/gpu/device.js';
export {setGpuExecutionPolicy3D} from './src/gpu/executionPolicy3D.js';
export {AppGpuSolver3D} from './src/gpu/appGpuSolver3D.js';
export {canonicalGpuTests} from './tests/gpu-canonical.js';
export {packageFeatureGpuTests} from './tests/gpu-package-features.js';
`,
  },
});
const browser = await browserCheck();
try {
  await browser.navigate("test-results/solver-performance.html");
  const result = await browser.evaluate(`(async()=>{
    const {createWebGPUDevice,setGpuExecutionPolicy3D,AppGpuSolver3D,canonicalGpuTests,packageFeatureGpuTests}=await import('/.temp/contact-compatibility-features.js');
    const {device}=await createWebGPUDevice({requiredLimits:{maxStorageBuffersPerShaderStage:9}});
    const errors=[],modes=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    try {
      for(const broadphase of ['grid','hploc']){
        setGpuExecutionPolicy3D(device,{dispatchIsolation:true,broadphase});
        const cases=[],excluded=[];
        const test=async(name,run)=>{
          // Normal validation covers 2D, performance measurements and read-only
          // half-million selections. Here exercise 3D collision/solver features.
          if(name.includes('GPU 2D')||name.includes('benchmark')||name.includes('half-million')){excluded.push(name);return;}
          device.pushErrorScope('validation');
          try{await run();await device.queue.onSubmittedWorkDone();}
          finally{const error=await device.popErrorScope();if(error)throw Error(error.message);}
          cases.push({name,passed:true});
        };
        await canonicalGpuTests(device,test,undefined,AppGpuSolver3D);
        await packageFeatureGpuTests(device,test);
        modes.push({broadphase,dispatchIsolation:true,cases,excluded});
      }
      return {modes,errors};
    }finally{device.destroy();}
  })()`);
  assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
  assert.equal(browser.errors.length, 0, JSON.stringify(browser.errors));
  assert(result.modes.every((m) => m.cases.length >= 20));
  await writeFile(
    "test-results/contact-compatibility-features.json",
    JSON.stringify(
      {
        passed: true,
        scope:
          "Desktop GPU: forced compatibility execution, same 3D numerical tests for each collision path; actual mobile GPU verification is separate.",
        ...result,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS compatibility features: ${result.modes.map((m) => m.broadphase + " " + m.cases.length + " GPU cases").join("; ")}`,
  );
} finally {
  await browser.close();
}
