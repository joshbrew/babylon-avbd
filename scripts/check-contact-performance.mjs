import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { browserCheck } from "./browser-check.mjs";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const baseline = resolve(
  process.argv.find((v) => v.startsWith("--baseline="))?.slice(11) ??
    "dist/avbd.js",
);
await mkdir(".temp", { recursive: true });
await build({
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/contact-performance.js",
  stdin: {
    resolveDir: process.cwd(),
    contents: `
export {AvbdScene3D as BaselineScene} from ${JSON.stringify(baseline)};
export {AvbdScene3D as CurrentScene} from './src/native/scenes.js';
export {createWebGPUDevice} from './src/gpu/device.js';
`,
  },
});
const browser = await browserCheck();
try {
  await browser.navigate("test-results/solver-performance.html");
  const result = await browser.evaluate(`(async()=>{
    const {BaselineScene,CurrentScene,createWebGPUDevice}=await import('/.temp/contact-performance.js');
    const {device,adapter}=await createWebGPUDevice({preferredLimits:{maxStorageBufferBindingSize:512*1024*1024,maxBufferSize:1024*1024*1024}});
    const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)], results=[];
    try {
      if(!device.features.has('timestamp-query'))throw Error('GPU timestamps are required for this performance comparison');
      for(const count of [10_000,100_000]){
        const worlds=[], shaders=[];
        try{
          for(const Scene of [BaselineScene,CurrentScene]){
            const scene=new Scene({iterations:5});
            scene.addBox([200,1,200],{mass:0,position:[0,-.5,0]});
            for(let i=0;i<count;i++)scene.addBox([.8,.8,.8],{position:[(i%100-50)*.9,.4+Math.floor(i/10000)*.799,(Math.floor(i/100)%100-50)*.9]});
            const codes=[], make=device.createShaderModule;
            device.createShaderModule=function(descriptor){codes.push(descriptor.code);return make.call(device,descriptor);};
            let world;
            try{world=scene.createSolver(device);}finally{device.createShaderModule=make;}
            worlds.push(world);shaders.push(codes);
            for(let i=0;i<90;i++)world.step();
            await device.queue.onSubmittedWorkDone();
          }
          const capture=world=>{
            const original=device.createCommandEncoder, commands=[];
            device.createCommandEncoder=function(...args){
              const encoder=original.apply(device,args), begin=encoder.beginComputePass;
              encoder.beginComputePass=function(...args){
                commands.push(['pass']);const pass=begin.apply(encoder,args),set=pass.setPipeline;
                pass.setPipeline=function(pipeline){commands.push(['pipeline',pipeline.label]);return set.call(pass,pipeline);};
                for(const method of ['dispatchWorkgroups','dispatchWorkgroupsIndirect']){
                  const original=pass[method];pass[method]=function(...args){commands.push([method,...(method==='dispatchWorkgroups'?args:[args[1]])]);return original.apply(pass,args);};
                }return pass;
              };return encoder;
            };
            try{world.step();}finally{device.createCommandEncoder=original;}
            return commands;
          };
          const commands=worlds.map(capture);await device.queue.onSubmittedWorkDone();
          const samples=[[],[]];
          for(let repeat=0;repeat<3;repeat++)for(let step=0;step<24;step++)for(const which of repeat%2?[1,0]:[0,1]){
            let cpu;const profile=await new Promise(resolve=>{
              worlds[which].profileNextStep(resolve);const start=performance.now();worlds[which].step();cpu=performance.now()-start;
            });samples[which].push({gpu:profile.total,cpu});
          }
          const counters=await Promise.all(worlds.map(w=>w.readCounters()));
          const records=await Promise.all(worlds.map(w=>w.readSelectedBodies([0,1,count])));
          const metrics=samples.map(s=>({gpuMs:median(s.map(v=>v.gpu)),cpuSubmitMs:median(s.map(v=>v.cpu)),samples:s}));
          results.push({bodies:count+1,iterations:5,dispatchIsolation:worlds[1].dispatchIsolation,shadersIdentical:JSON.stringify(shaders[0])===JSON.stringify(shaders[1]),shaderModuleCount:shaders[1].length,commandsIdentical:JSON.stringify(commands[0])===JSON.stringify(commands[1]),commands,counters,selectedPosesMatch:records[0].every((v,i)=>Number.isFinite(records[1][i])&&Math.abs(v-records[1][i])<1.e-5),baseline:metrics[0],current:metrics[1],gpuRatio:metrics[1].gpuMs/metrics[0].gpuMs});
        }finally{worlds.forEach(w=>w.destroy());}
      }
      return {date:new Date().toISOString(),adapter:adapter.info.toJSON?.()??{vendor:adapter.info.vendor,description:adapter.info.description},results,errors};
    }finally{device.destroy();}
  })()`);
  assert.equal(browser.errors.length, 0, JSON.stringify(browser.errors));
  assert.equal(result.errors.length, 0, JSON.stringify(result.errors));
  if (process.platform === "win32") {
    try {
      const { stdout } = await promisify(execFile)(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion | ConvertTo-Json -Compress",
        ],
        { windowsHide: true },
      );
      const cards = [JSON.parse(stdout)]
        .flat()
        .filter((card) =>
          card.Name.toLowerCase().includes(
            (result.adapter.vendor ?? "").toLowerCase(),
          ),
        );
      if (cards.length === 1) {
        result.hardwareLabel = cards[0].Name;
        result.driver = cards[0].DriverVersion;
      }
    } catch (error) {
      result.hardwareDetailsError = error.message;
    }
  }
  for (const row of result.results) {
    assert.equal(row.dispatchIsolation, false);
    assert(
      row.shadersIdentical && row.commandsIdentical && row.selectedPosesMatch,
      JSON.stringify(row),
    );
    assert(
      row.counters.every((c) => !c.overflow && !c.clashes),
      JSON.stringify(row.counters),
    );
    assert(
      row.gpuRatio < 1.15,
      `PC GPU time increased by more than 15% for ${row.bodies} bodies`,
    );
  }
  await writeFile(
    "test-results/contact-performance.json",
    JSON.stringify(
      {
        passed: true,
        baseline,
        scope:
          "Before/after compatibility changes. Same native GPU physics, five iterations, no rendering or sleeping; three alternating repeats. Timing includes GPU phase boundaries.",
        ...result,
      },
      null,
      2,
    ),
  );
  for (const row of result.results)
    console.log(
      `${row.bodies} bodies: GPU ${row.baseline.gpuMs.toFixed(3)} -> ${row.current.gpuMs.toFixed(3)} ms; CPU ${row.baseline.cpuSubmitMs.toFixed(3)} -> ${row.current.cpuSubmitMs.toFixed(3)} ms; identical shaders, dispatches and selected physics`,
    );
} finally {
  await browser.close();
}
