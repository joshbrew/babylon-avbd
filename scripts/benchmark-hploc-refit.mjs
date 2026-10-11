import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
import { gpuBenchmarkHardware } from "./gpu-benchmark-hardware.mjs";

await mkdir(".temp", { recursive: true });
await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `export {PRELUDE_3D} from './reference/three-avbd/src/avbd3d/gpu/layout.ts';
      export {default as source} from './src/gpu/hplocpp.wgsl';
      export {createWebGPUDevice} from './src/gpu/device.js';`,
  },
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
  outfile: ".temp/hploc-refit.js",
});
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  const result = await b.evaluate(`(async()=>{
    const {PRELUDE_3D,source,createWebGPUDevice}=await import('/.temp/hploc-refit.js');
    const {device,adapter}=await createWebGPUDevice();
    const errors=[],results=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    try{
      if(!device.features.has('timestamp-query'))throw Error('GPU timestamp queries are required for this benchmark');
      const module=device.createShaderModule({code:PRELUDE_3D+source});
      const entry=(binding,type)=>({binding,visibility:GPUShaderStage.COMPUTE,buffer:{type}});
      const bindLayout=device.createBindGroupLayout({entries:[entry(0,'uniform'),entry(1,'read-only-storage'),entry(2,'storage'),entry(4,'storage')]});
      const layout=device.createPipelineLayout({bindGroupLayouts:[bindLayout]});
      const pipelines=['leaves','refitLeaves'].map(entryPoint=>device.createComputePipeline({layout,compute:{module,entryPoint}}));
      for(const count of [2416,100000,510000]){
        const resources=[];
        const buffer=(size,usage)=>{const b=device.createBuffer({size,usage});resources.push(b);return b;};
        const bodies=buffer(count*160,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST),
          nodes=buffer(count*32,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC),
          bounds=buffer(Math.ceil(count/128)*32,GPUBufferUsage.STORAGE),
          uniform=buffer(48,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST),
          staging=buffer(count*32,GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST),
          resolve=buffer(256,GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC),
          timeRead=buffer(16,GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST);
        const query=device.createQuerySet({type:'timestamp',count:2});
        try{
          const data=new Float32Array(count*40);
          for(let i=0;i<count;i++){
            const o=i*40,a=(i%13)*.1;data.set([i%101-50,Math.floor(i/101)%71-35,i%23],o);
            data.set([0,Math.sin(a),0,Math.cos(a)],o+4);data.set([1+i%3,.2,2],o+16);
            data[o+39]=i%5===0?1:0;
          }
          device.queue.writeBuffer(bodies,0,data);device.queue.writeBuffer(uniform,0,new Uint32Array([count,0,0,0,0,0,0,0,0,0,0,0]));
          const group=device.createBindGroup({layout:bindLayout,entries:[[0,uniform],[1,bodies],[2,nodes],[4,bounds]].map(([binding,buffer])=>({binding,resource:{buffer}}))});
          const run=async(mode,repeats=20,readNodes=false)=>{
            const e=device.createCommandEncoder(),p=e.beginComputePass({timestampWrites:{querySet:query,beginningOfPassWriteIndex:0,endOfPassWriteIndex:1}});
            p.setPipeline(pipelines[mode]);p.setBindGroup(0,group);
            for(let i=0;i<repeats;i++)p.dispatchWorkgroups(Math.ceil(count/128));p.end();
            e.resolveQuerySet(query,0,2,resolve,0);e.copyBufferToBuffer(resolve,0,timeRead,0,16);
            if(readNodes)e.copyBufferToBuffer(nodes,0,staging,0,count*32);
            device.queue.submit([e.finish()]);await timeRead.mapAsync(GPUMapMode.READ);
            const t=new BigUint64Array(timeRead.getMappedRange()),ms=Number(t[1]-t[0])/1e6/repeats;timeRead.unmap();
            if(!readNodes)return ms;
            await staging.mapAsync(GPUMapMode.READ);const data=new Uint32Array(staging.getMappedRange()).slice();staging.unmap();return data;
          };
          const expected=await run(0,1,true),actual=await run(1,1,true);
          const identical=expected.every((v,i)=>v===actual[i]);
          const reduction=[],direct=[];
          for(let i=0;i<40;i++)for(const mode of i%2?[1,0]:[0,1]){
            const t=await run(mode);if(i>=10)(mode?direct:reduction).push(t);
          }
          const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
          results.push({bodies:count,identical,withSceneReductionMs:median(reduction),refitLeavesMs:median(direct),reductionSamples:reduction,refitSamples:direct});
        }finally{query.destroy();resources.forEach(b=>b.destroy());}
      }
      return {date:new Date().toISOString(),adapter:{vendor:adapter.info.vendor,architecture:adapter.info.architecture,description:adapter.info.description},results,errors};
    }finally{device.destroy();}
  })()`);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(b.errors, []);
  for (const row of result.results) {
    assert.ok(row.identical);
    console.log(
      JSON.stringify({
        ...row,
        reductionSamples: undefined,
        refitSamples: undefined,
      }),
    );
  }
  await writeFile(
    "test-results/hploc-refit-performance.json",
    JSON.stringify(
      {
        passed: true,
        method:
          "Leaf AABB update only, excluding tree traversal, internal refit, collisions, solving and rendering. GPU timestamps; 10 warmup plus 30 alternating samples, 20 dispatches per sample. Exact bitwise bounds comparison. Not a total simulation speedup.",
        ...result,
        ...(await gpuBenchmarkHardware(result.adapter)),
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
