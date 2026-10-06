import { browserCheck } from "./browser-check.mjs";
import { mkdir, writeFile } from "node:fs/promises";
const b = await browserCheck(),
  results = [];
const wait = async (expression) => {
  for (let i = 0; i < 400; i++) {
    if (await b.evaluate(expression)) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  const page = await b.evaluate("document.body.innerText.slice(0,1800)");
  throw Error(`Timed out: ${expression}: ${page}; ${b.errors.join("\n")}`);
};
const assert = (condition, message) => {
  if (!condition) throw Error(message);
};
try {
  await mkdir("test-results/screenshots", { recursive: true });
  await b.navigate("?demo=showcase");
  await wait("!!globalThis.__MIXED_GALLERY__");
  await b.evaluate("__MIXED_GALLERY__.pause(true)");
  const before = await b.evaluate("__MIXED_GALLERY__.snapshot()");
  await b.evaluate("__MIXED_GALLERY__.step(360)");
  const after = await b.evaluate("__MIXED_GALLERY__.snapshot()");
  let rotated = 0,
    minY = Infinity,
    nonfinite = 0,
    maxQuaternionError = 0;
  for (let i = 0; i < after.indices.length; i++) {
    const o = after.indices[i] * 40,
      p = after.poses.slice(o, o + 8),
      q = p.slice(4);
    if (p.some((x) => !Number.isFinite(x))) nonfinite++;
    minY = Math.min(minY, p[1]);
    maxQuaternionError = Math.max(
      maxQuaternionError,
      Math.abs(Math.hypot(...q) - 1),
    );
    if (
      1 - Math.abs(q.reduce((s, x, k) => s + x * before.poses[o + 4 + k], 0)) >
      0.001
    )
      rotated++;
  }
  assert(
    !nonfinite && maxQuaternionError < 0.0002 && rotated > 100 && minY > -0.1,
    "Mixed gallery motion failed",
  );
  assert(
    !after.counters.overflow && !after.counters.clashes && !after.errors.length,
    "Mixed gallery collisions failed",
  );
  await b.screenshot("test-results/screenshots/mixed-gallery-settled.png");
  const renderErrors = b.logs.filter((entry) =>
    /GL_INVALID|sampler type|shader.*error/i.test(entry.text),
  );
  assert(
    !renderErrors.length,
    "Gallery rendering failed: " + JSON.stringify(renderErrors),
  );
  assert(
    await b.evaluate(
      "__MIXED_GALLERY__.world.scene.getEngine()._gl.getError() === 0",
    ),
    "Gallery WebGL error",
  );
  const meshSync = await b.evaluate(`(async()=>{
    const w=__MIXED_GALLERY__.world;await w.syncMeshes();const p=await w.readBodies();
    let maxCenterError=0,maxSphereRadiusError=0;
    for(const a of w.aggregates){
      const o=a.body.gpuIndex*40;
      const center=a.mesh.position.add(a.localCenter.applyRotationQuaternion(a.mesh.rotationQuaternion)).asArray();
      maxCenterError=Math.max(maxCenterError,Math.hypot(...center.map((v,i)=>v-p[o+i])));
      if(a.type==='sphere'){
        const v=a.mesh.getVerticesData('position');let radius=0;
        for(let i=0;i<v.length;i+=3)radius=Math.max(radius,Math.hypot(v[i],v[i+1],v[i+2]));
        maxSphereRadiusError=Math.max(maxSphereRadiusError,Math.abs(radius-p[o+16]/2));
      }
    }
    const resting=w.aggregates.filter(a=>a.mesh.name.startsWith('projectile'));
    return {maxCenterError,maxSphereRadiusError,resting:resting.map(a=>{const o=a.body.gpuIndex*40;return {height:p[o+1],radius:p[o+16]/2,verticalSpeed:p[o+33]};})};
  })()`);
  assert(
    meshSync.maxCenterError < 0.00001 &&
      meshSync.maxSphereRadiusError < 0.00001,
    "Gallery mesh poses and sphere radii must match GPU colliders: " +
      JSON.stringify(meshSync),
  );
  assert(
    meshSync.resting.length === 8 &&
      meshSync.resting.every(
        (s) =>
          Math.abs(s.verticalSpeed) < 0.01 &&
          s.height > s.radius - 0.025 &&
          s.height < s.radius + 0.025,
      ),
    "Unfired balls must settle on the ground without persistent bounce",
  );
  await b.evaluate("__MIXED_GALLERY__.shoot(); __MIXED_GALLERY__.step(60)");
  await b.screenshot("test-results/screenshots/mixed-gallery-impact.png");
  results.push({
    name: "Mixed gallery",
    rotated,
    minY,
    maxQuaternionError,
    meshSync,
    counters: after.counters,
    errors: after.errors,
    passed: true,
  });
  await b.navigate("?demo=benchmark");
  await wait("!!globalThis.__COLLISION_BENCHMARK__");
  await b.evaluate(
    `(()=>{const inputs=document.querySelectorAll('input');inputs[2].value=2000;inputs[3].value=2000;inputs[1].value=60;__COLLISION_BENCHMARK__.start();})()`,
  );
  // Particles arrive in bursts. Capture an actual collision observation, rather
  // than assuming a particular render frame coincides with a collision burst.
  let particles;
  for (let i = 0; i < 400; i++) {
    const snapshot = await b.evaluate("__COLLISION_BENCHMARK__.snapshot()");
    if (snapshot.frame > 160 && snapshot.hits > 0) {
      particles = snapshot;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert(particles, "No GPU particle collisions observed within 20 seconds");
  assert(
    particles.sprites &&
      particles.triangles === 20 &&
      particles.alive > 1000 &&
      particles.hits > 0 &&
      particles.collisionMs > 0 &&
      !particles.errors.length,
    "GPU particles not active: " + JSON.stringify(particles),
  );
  const rects = await b.evaluate(
    `Array.from(document.querySelectorAll('canvas'),c=>{const r=c.getBoundingClientRect();return [r.x,r.y,r.width,r.height];})`,
  );
  assert(
    rects.length === 2 &&
      rects[0].every((x, i) => Math.abs(x - rects[1][i]) < 1),
    "Sprite viewport must match the shield",
  );
  await b.screenshot("test-results/screenshots/collision-sprites.png");
  await b.evaluate("__COLLISION_BENCHMARK__.stop()");
  results.push({
    name: "GPU collision sprites",
    ...particles,
    rects,
    passed: true,
  });
  await b.navigate(
    "?demo=canonical&scene=showcase-box-columns-100k&backend=gpu&paused=1",
  );
  await wait("globalThis.__AVBD_LAB__?.diagnostics.ready");
  await wait("__AVBD_LAB__.diagnostics.frames>3");
  await b.screenshot("test-results/screenshots/columns-enhanced.png");
  await b.evaluate(`document.querySelector('#lab-enhanced').click()`);
  await b.screenshot("test-results/screenshots/columns-benchmark.png");
  const labErrors = await b.evaluate("__AVBD_LAB__.diagnostics.errors");
  assert(!labErrors.length, labErrors.join("\n"));
  assert(!b.errors.length, b.errors.join("\n"));
  results.push({
    name: "Enhanced / benchmark rendering modes",
    errors: b.errors,
    passed: true,
  });
  await writeFile(
    "test-results/improvements.json",
    JSON.stringify({ results, errors: b.errors }, null, 2),
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await b.close();
}
