import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Use an already authorized, unlocked Android browser with an existing local
// demo tab. ADB setup: reverse tcp:8080 tcp:8080, then forward tcp:9223
// localabstract:chrome_devtools_remote. This never opens unrelated tabs.
const endpoint = process.env.AVBD_PHONE_CDP ?? "http://127.0.0.1:9223";
const origin = process.env.AVBD_PHONE_DEMO ?? "http://localhost:8080";
const targets = await (await fetch(`${endpoint}/json/list`)).json();
const target = targets.find(
  (t) => t.type === "page" && new URL(t.url).origin === origin,
);
if (!target)
  throw Error(
    "Unlock the connected phone and open the local AVBD demo in its browser.",
  );
await mkdir(".temp", { recursive: true });
await build({
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/connected-contact-tests.js",
  stdin: {
    resolveDir: process.cwd(),
    contents: `
export {createWebGPUDevice} from './src/gpu/device.js';
export {checkGpuContacts3D} from './src/gpu/contactCheck3D.js';
export {setGpuExecutionPolicy3D} from './src/gpu/executionPolicy3D.js';
export {AppGpuSolver3D} from './src/gpu/appGpuSolver3D.js';
export {canonicalGpuTests} from './tests/gpu-canonical.js';
export {packageFeatureGpuTests} from './tests/gpu-package-features.js';
export {contactPortabilityGpuTests} from './tests/gpu-contact-portability.js';
`,
  },
});
const servedFixture = await fetch(`${origin}/.temp/connected-contact-tests.js`, {
  signal: AbortSignal.timeout(10000),
});
if (!servedFixture.ok || await servedFixture.text() !== await readFile(".temp/connected-contact-tests.js", "utf8"))
  throw Error("Run the phone check from the same repository that serves the local demo.");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
let next = 0;
const pending = new Map();
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data),
    item = pending.get(message.id);
  if (!item) return;
  pending.delete(message.id);
  clearTimeout(item.timer);
  message.error
    ? item.reject(Error(message.error.message))
    : item.resolve(message.result);
});
const call = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(Error(`${method} timed out`));
    }, 300000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify({ id, method, params }));
  });
async function evaluate(expression) {
  const result = await call("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails)
    throw Error(
      result.exceptionDetails.exception?.description ??
        result.exceptionDetails.text,
    );
  return result.result.value;
}
try {
  console.log(
    "Testing 3D contacts and native features on the connected phone.",
  );
  const result = await evaluate(`(async()=>{
    const lab=globalThis.__AVBD_LAB__;
    if(!lab?.diagnostics.ready)throw Error('Open a ready canonical demo first');
    lab.pause(true);
    const tests=await import('/.temp/connected-contact-tests.js?build=${Date.now()}');
    const {device,adapter}=await tests.createWebGPUDevice({preferredLimits:{maxStorageBuffersPerShaderStage:9}});
    const errors=[],modes=[];
    globalThis.__AVBD_PHONE_TEST__={running:true,modes};
    device.addEventListener('uncapturederror',event=>errors.push(event.error.message));
    let qualification;
    try{
      qualification=await tests.checkGpuContacts3D(device);
      if(!qualification.passed)throw Error('Physical GPU floor-contact qualification failed');
      const selected=qualification.attempts.find(a=>a.mode===qualification.selected).pipeline.solver;
      for(const broadphase of ['grid','hploc']){
        tests.setGpuExecutionPolicy3D(device,{
          portableContactMath:selected.portableContactMath,
          scalarPrimal:selected.scalarPrimal,
          dispatchIsolation:qualification.selected.includes('isolated'),broadphase,
        });
        const cases=[];
        const test=async(name,run)=>{
          if(name.includes('benchmark')||name.includes('half-million')||(broadphase==='hploc'&&name.includes('GPU 2D')))return;
          device.pushErrorScope('internal');device.pushErrorScope('validation');let failure;
          try{await run();await device.queue.onSubmittedWorkDone();}catch(error){failure=error.message;}
          const validation=await device.popErrorScope(),internal=await device.popErrorScope();
          cases.push({name,passed:!failure&&!validation&&!internal,error:failure??validation?.message??internal?.message});
          globalThis.__AVBD_PHONE_TEST__.last={broadphase,...cases.at(-1)};
        };
        await tests.canonicalGpuTests(device,test,undefined,tests.AppGpuSolver3D);
        await tests.packageFeatureGpuTests(device,test);
        if(broadphase==='grid')await tests.contactPortabilityGpuTests(device,async(name,run)=>{
          if(name.includes('portable hull contacts'))await test(name,run);
        });
        modes.push({broadphase,cases});
      }
      return {qualification,modes,errors,userAgent:navigator.userAgent,
        adapter:{vendor:adapter.info.vendor,architecture:adapter.info.architecture,device:adapter.info.device,description:adapter.info.description}};
    }finally{device.destroy();globalThis.__AVBD_PHONE_TEST__.running=false;}
  })()`);
  const cases = result.modes.flatMap((mode) => mode.cases);
  result.passed =
    result.qualification.passed &&
    !result.errors.length &&
    cases.every((c) => c.passed);
  result.scope =
    "Physical connected Android phone, native GPU features using the device-qualified 3D contact path. Desktop performance is measured separately.";
  result.measuredAt = new Date().toISOString();
  await writeFile(
    "test-results/connected-phone-contacts.json",
    JSON.stringify(result, null, 2),
  );
  console.log(
    `${result.passed ? "PASS" : "FAIL"}: ${cases.filter((c) => c.passed).length}/${cases.length} physical-phone GPU feature checks; contact path ${result.qualification.selected}.`,
  );
  for (const mode of result.modes)
    for (const c of mode.cases)
      if (!c.passed) console.log(`${mode.broadphase}: ${c.name}: ${c.error}`);
  if (!result.passed) process.exitCode = 1;
} finally {
  await evaluate("globalThis.__AVBD_LAB__?.pause(false)").catch(() => {});
  ws.close();
}
