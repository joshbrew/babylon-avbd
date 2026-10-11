import assert from "node:assert/strict";
import { browserCheck } from "./browser-check.mjs";
import { writeAtomicFile } from "./report-file.mjs";
const b = await browserCheck();
try {
  const results = [];
  for (const backend of ["webgpu", "cpu"]) {
    await b.navigate(`?demo=slingshot&bricks=1000&backend=${backend}&paused=1`);
    for (
      let i = 0;
      i < 1000 && !(await b.evaluate("globalThis.__SLINGSHOT__?.ready"));
      i++
    )
      await new Promise((r) => setTimeout(r, 30));
    assert.ok(await b.evaluate("globalThis.__SLINGSHOT__?.ready"));
    const result = await b.evaluate(`(async()=>{
      const lab=__SLINGSHOT__,g=lab.gpu,b=lab.built,initial=await g.readBodies();
      await lab.step(600);const settled=await g.readBodies();
      let maxSpeed=0,raised=0;
      for(const parts of b.ragdolls)for(const i of parts){maxSpeed=Math.max(maxSpeed,Math.hypot(...settled.slice(i*24+12,i*24+14)));raised=Math.max(raised,settled[i*24+1]-initial[i*24+1]);}
      const before=lab.state;
      lab.launch();lab.pause(true);
      const brick=b.bricks.at(-1),parts=b.ragdolls[0],enemy=parts.find(i=>b.targets.includes(i));
      // Isolate a brick and enemy from their joints, then use real floor impacts.
      // No health counter is edited by this test.
      const impacted=new Set([brick,...parts]),top=b.sim.solver;
      for(let j=0;j<top.jointCount;j++)if(impacted.has(top.info[j*4+1])||impacted.has(top.info[j*4+2]))g.disableConstraint(j);
      g.editBodies([{body:brick,position:[-60,16],linearVelocity:[0,-12],angularVelocity:0},{body:enemy,position:[-65,12],linearVelocity:[0,-12],angularVelocity:0}]);g.flushEdits();
      await lab.step(360);const poses=await g.readBodies(),state=lab.state;
      const removed=[brick,...parts].map(id=>({id,mass:poses[id*24+22],speed:Math.hypot(...poses.slice(id*24+12,id*24+15))}));
      const filters=g.bodyBuffer?Array.from(new Uint32Array(await g.read(g.filters,g.bodyCount*8))):null;
      const colors=g.bodyBuffer?new Float32Array(await g.read(lab.renderer.colors,g.bodyCount*16)):null;
      return {backend:${JSON.stringify(backend)},maxSpeed,raised,beforeDestroyed:before.destroyedBricks,beforeTargets:before.toppled,removed,filtersClear:!filters||[brick,...parts].every(i=>filters[i*2]===0&&filters[i*2+1]===0),invisible:!colors||[brick,...parts].every(i=>colors[i*4+3]===0),health:state.targets.find(t=>t.id===enemy)?.health,destroyedBricks:state.destroyedBricks,finite:Array.from(poses).every(Number.isFinite),errors:state.errors};
    })()`);
    console.log(JSON.stringify(result));
    assert.deepEqual(result.errors, []);
    assert.ok(result.finite);
    assert.equal(result.beforeDestroyed, 0);
    assert.equal(result.beforeTargets, 0);
    assert.ok(
      result.raised < 0.7,
      "Ragdolls must not jump above their starting height while settling",
    );
    assert.ok(
      result.maxSpeed < 3,
      "Settled ragdolls must not keep spinning or jumping",
    );
    assert.equal(result.health, 0);
    assert.ok(result.destroyedBricks > 0);
    assert.ok(result.removed.every((p) => p.mass === 0 && p.speed === 0));
    assert.ok(result.filtersClear);
    assert.ok(result.invisible);
    results.push(result);
    await b.evaluate("__SLINGSHOT__.dispose()");
  }
  assert.deepEqual(b.errors, []);
  await writeAtomicFile(
    "test-results/siege-damage.json",
    JSON.stringify({ passed: true, results }, null, 2),
  );
} finally {
  await b.close();
}
