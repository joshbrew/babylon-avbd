import { readFile, writeFile } from "node:fs/promises";
const read = (path) =>
  readFile("test-results/" + path, "utf8").then(JSON.parse);
const scenes = await read("scenes.json"),
  rook = await read("rook.json"),
  routes = await read("routes.json"),
  gpu = await read("gpu.json"),
  controls = await read("controls.json"),
  motion = await read("showcase-motion.json"),
  hardware = await read("hardware.json");
const policy2D = await read("policy-2d.json").catch(() => null);
const features = await read("feature-scenes.json");
const fabric = await read("cloth-fragments.json");
const fracture = await read("voronoi-fracture.json");
const chainmail = await read("chainmail.json");
if (!fracture.passed || !chainmail.passed)
  throw Error(
    "Fracture and chain-mail checks must pass before publishing the report",
  );
const fractureSection = `<section class="panel"><h2>Voronoi wall and wrecking ball</h2><p><a href="/?demo=canonical&scene=3d-voronoi-demolition&backend=gpu">Swing the wrecking ball ↗</a>. The wall has ${fracture.geometry.cells} irregular stones. A bounded Voronoi pattern divides the wall face; each piece runs through its full thickness and collides as a convex hull. Breakable welds connect neighboring faces.</p><p>The wall stays intact before impact. The ball opens a hole and releases rotating rubble: ${fracture.checkpoints.at(-1).broken} bonds are broken after ten simulated seconds. All stones remain in the world. Reset restores the wall; “Swing ball again” repositions the pendulum for another strike.</p><div class="checkpoints">${[120, 480, 1440, 2400].map((n) => `<figure><a href="screenshots/voronoi-${n}.png"><img loading="lazy" src="screenshots/voronoi-${n}.png" alt="Voronoi stone wall after ${n / 240} simulated seconds"></a><figcaption>${n / 240} simulated seconds</figcaption></figure>`).join("")}</div><p><a href="voronoi-fracture.json">Fracture check results</a>: cell volumes fill the wall, shared faces match, debris stays present and GPU contact storage checks pass.</p></section>`;
const chainmailSection = `<section class="panel"><h2>Chain-mail ring dimensions</h2><p><a href="/?demo=canonical&scene=showcase-chain-mail-1.6k&backend=gpu">Play the linked net ↗</a>. Ring radii and wire thickness follow the joint spacing. ${chainmail.touchingPairs.toLocaleString()} neighboring ring pairs meet at rest. The net uses connected rigid box proxies; the rings are decorative geometry rather than hollow torus colliders.</p><div class="checkpoints">${["rest", "settled"].map((state) => `<figure><a href="screenshots/chainmail-${state}.png"><img loading="lazy" src="screenshots/chainmail-${state}.png" alt="Chain-mail rings ${state}"></a><figcaption>${state === "rest" ? "Ring spacing at rest" : "Six simulated seconds"}</figcaption></figure>`).join("")}</div><p><a href="chainmail.json">Ring and GPU settling checks</a></p></section>`;
const examples = await read("babylon-readme.json");
const direct = examples.examples.find(
  (example) => example.kind === "direct-gpu-rendering",
);
if (!features.passed || !fabric.passed)
  throw Error(
    "Feature and fabric checks must pass before publishing the report",
  );
const vendor = rook.timing.adapter?.vendor?.toLowerCase();
const matches = vendor
  ? hardware.filter((gpu) => gpu.Name.toLowerCase().includes(vendor))
  : [];
const gpuModel =
  matches.length === 1
    ? matches[0].Name
    : rook.timing.adapter?.description || "GPU model not recorded";
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const ms = (v) => (typeof v === "number" ? v.toFixed(2) : "—");
const fps = (v) => (typeof v === "number" ? (1000 / v).toFixed(1) : "—");
const name = (id) =>
  id.replace(/^(showcase-|2d-|3d-)/, "").replaceAll("-", " ");
const backends = {
  gpu: "GPU",
  ref: "Reference CPU",
  "soa-seq": "Sequential CPU",
  "soa-colored": "Parallel-order CPU",
};
const slingshotRuns = policy2D?.passed
  ? policy2D.results.filter((r) => /^slingshot-\d+$/.test(r.scene))
  : [];
const slingshotSection = slingshotRuns.length
  ? `<section class="panel"><h2>Slingshot siege</h2><p><a href="/?demo=slingshot">Play the slingshot demo ↗</a>. The level combines breakable forts, rounded colliders, ropes, springs, ragdolls and powered gates. A real drag-and-release check launches the ball, breaks mortar and crosses the scoring sensor. Sleeping, reload, boost and bounce controls are checked too.</p><div class="scroll"><table><thead><tr><th>Bricks</th><th>Typical frame rate</th><th>Physics steps per second</th></tr></thead><tbody>${slingshotRuns.map((r) => `<tr><td>${r.quiet.bricks.toLocaleString()}</td><td>${fps(r.frameMs.median)} FPS</td><td>${r.stepsPerSecond.toFixed(1)}</td></tr>`).join("")}</tbody></table></div><p>Drawing and physics run together here. The intended physics rate is 120 steps per second; a lower measured rate means the scene advances more slowly. These are short playback checks, not solver-only timings.</p><div class="checkpoints"><figure><img src="screenshots/slingshot-aim.png" alt="Aiming the slingshot with radius-aware collision prediction"><figcaption>Aiming and collision queries</figcaption></figure><figure><img src="screenshots/slingshot-impact.png" alt="Bricks and mortar breaking after the slingshot impact"><figcaption>Impact and breakable mortar</figcaption></figure></div></section>`
  : "";
const featureSection = `<section class="panel"><h2>Hinges, motors, triggers and collision masks</h2><p>These examples run on the GPU in both 2D and 3D. Motor checks require the arms to stop at their angle limits, reverse direction and brake. Trigger checks require overlap events without pushing the balls. Coral balls land on the shelf; blue and purple balls pass through it. Turn on blue collisions to catch the blue balls too, or turn off detection to stop trigger events.</p><p>Ball shading shows real contact events: gold for trigger overlaps, green for shelf contacts and cyan for floor contacts. Purple balls ignore the shelf and trigger. Ray and circle/sphere casts use a collision filter to find only coral balls. The wider cast reaches them before the thin ray does.</p><div class="grid">${features.results.map((r) => `<article><div class="card-heading"><a href="/?demo=canonical&scene=${r.scene}&backend=gpu">${escape(name(r.scene))} ↗</a><span class="pass">Passed</span></div><a href="screenshots/${r.scene}.png"><img loading="lazy" src="screenshots/${r.scene}.png" alt="${escape(name(r.scene))} with interactive controls"></a></article>`).join("")}</div><p><a href="feature-scenes.json">Feature check results</a></p></section>`;
const fabricSection = `<section class="panel"><h2>Torn fabric keeps its material</h2><p>The cloth stretches before tearing and is held only at its four corners. Broken springs release the fabric; they do not delete it. The renderer retains each point's share of the sheet, so detached pieces follow the simulated points and remain on the floor. This is a point-and-spring fabric model.</p><p><a href="/?demo=canonical&scene=3d-tearable-cloth&backend=gpu">Play the fabric demo ↗</a>. Drag to tear it or use “Pull out a fabric patch”. The check separates a patch containing ${fabric.patch.indices.length} points and follows it for eight simulated seconds. The original ${fabric.snapshots.at(-1).bodies.toLocaleString()} bodies and all ${fabric.snapshots.at(-1).materialFaces.toLocaleString()} material faces remain present. There is no automatic lifetime.</p><div class="checkpoints">${[120, 360, 960].map((n) => `<figure><a href="screenshots/cloth-fragments-${n}.png"><img loading="lazy" src="screenshots/cloth-fragments-${n}.png" alt="Persistent detached fabric after ${n / 120} seconds"></a><figcaption>${n / 120} simulated seconds</figcaption></figure>`).join("")}</div><p><a href="cloth-fragments.json">Fragment check results</a> · <a href="tearable-cloth.json">Stretching and fracture checks</a></p></section>`;
const directSection = direct
  ? `<section class="panel"><h2>Direct GPU drawing example</h2><p>The README example draws ${direct.bodies.toLocaleString()} boxes, including the floor, in one instanced draw call. Its vertex shader reads live GPU positions, sizes and rotations. The check ran physics and drawing together with no pose downloads during drawing, then separately inspected the simulation for valid positions and sufficient contact storage.</p><figure><img loading="lazy" src="screenshots/readme-direct-gpu.png" alt="4096 boxes drawn directly from GPU physics poses"><figcaption><a href="../README.md#direct-gpu-rendering">Read the integration example</a> · <a href="babylon-readme.json">Executable example checks</a></figcaption></figure></section>`
  : "";
function interpretation(s) {
  const physics = s.timing?.solveMs.median,
    drawing = s.timing?.renderMs.median;
  if (typeof physics !== "number" || typeof drawing !== "number")
    return "Timing unavailable.";
  if (physics === 0 && s.backend === "gpu")
    return "Physics timing was not available in this capture.";
  if (physics >= 16.67 && drawing >= 16.67)
    return "Both moving objects and drawing the picture take more than 16.7 ms.";
  if (physics >= 16.67)
    return "Moving objects is the larger cost. Physics alone takes more than the 16.7 ms budget for 60 updates a second.";
  if (drawing >= 16.67)
    return "Drawing the picture is the larger cost. Drawing alone takes more than the 16.7 ms budget for 60 pictures a second.";
  return (
    "Each stage takes less than 16.7 ms, but they still share time with other work. " +
    (physics > drawing ? "Physics" : "Drawing") +
    " takes more time in this capture."
  );
}
const cards = scenes.results
  .map(
    (s) =>
      `<article data-name="${escape(s.name)}"><div class="card-heading"><a href="/?demo=canonical&scene=${s.scene}&backend=${s.backend}">${escape(name(s.scene))} · ${backends[s.backend]}</a><span class="${s.passed ? "pass" : "fail"}">${s.passed ? "Passed" : "Failed"}</span></div><a href="screenshots/${s.name}.png"><img loading="lazy" src="screenshots/${s.name}.png" alt="${escape(s.name)} screenshot"></a><p class="reading">${interpretation(s)}</p><div class="numbers"><span>${fps(s.timing?.frameMs.mean ?? s.timing?.frameMs.median)} FPS overall</span><span>Physics ${ms(s.timing?.solveMs.median)} ms</span><span>Slower physics ${ms(s.timing?.solveMs.p95)} ms</span><span>Drawing ${ms(s.timing?.renderMs.median)} ms</span>${s.backend === "gpu" ? `<span>Collision checks ${ms(s.timing?.collisionMs?.median)} ms</span><span>Movement solver ${ms(s.timing?.constraintMs?.median)} ms</span>` : ""}</div>${s.error ? `<p>${escape(s.error)}</p>` : ""}</article>`,
  )
  .join("");
const last = rook.checkpoints.at(-1);
const rookStage = `<p>The frame-rate sample starts after ${(last.steps / 60).toFixed(1)} simulated seconds of the impact. At the end, ${rook.timing.stats.awake.toLocaleString()} bodies are awake. More bricks can wake as they lose support, so compare the same point in the scene when repeating this test.</p>`;
const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AVBD scene checks</title><style>
*{box-sizing:border-box}body{margin:0;background:#f3f5f8;color:#27334a;font:14px/1.6 system-ui}main{max-width:1440px;margin:auto;padding:32px 24px}h1{font-size:34px;letter-spacing:-.04em}h2{font-size:22px}p{color:#53657d;max-width:1000px}a{color:#3e5bd7;text-decoration:none}.summary{display:flex;gap:14px;flex-wrap:wrap}.summary strong{background:white;border:1px solid #dbe1e9;padding:15px;border-radius:9px}.pass{color:#297652}.fail{color:#b53741}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px}article,.panel{background:white;border:1px solid #dbe1e9;border-radius:9px;overflow:hidden}.panel{padding:20px;margin:20px 0}.card-heading{display:flex;justify-content:space-between;gap:10px;padding:14px;font-size:13px;font-weight:650}img{display:block;width:100%;height:auto}.numbers{display:flex;gap:10px;flex-wrap:wrap;padding:12px;font-size:12px;color:#53657d}.reading{padding:0 12px;margin:12px 0 0;font-size:13px}input{margin:20px 0;width:min(450px,90%);padding:11px;border:1px solid #ccd6e5;border-radius:6px}.scroll{overflow:auto}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{text-align:left;border-bottom:1px solid #e0e5ee;padding:13px;font-size:13px}.checkpoints{display:flex;gap:12px}.checkpoints a{flex:1}.checkpoints figure{flex:1;min-width:0;margin:0}.checkpoints figcaption{padding:8px 0;color:#53657d}.checkpoints img{border-radius:8px}details{margin:16px 0}@media(max-width:600px){main{padding:20px 12px}.grid{grid-template-columns:1fr}.checkpoints{flex-direction:column}h1{font-size:29px}}
</style></head><body><main><a href="/">← Back to main page</a> · <a href="solver-performance.html">Solver calculation comparison</a> · <a href="../tests/performance.html">Play scenes and run benchmarks</a><h1>Scene checks and drawing performance</h1><p><b>Saved reference results: ${escape(gpuModel)}.</b> These timings were recorded on that GPU. Run the browser benchmark to measure your own computer.</p><p>This report checks that scenes display, run and respond to controls. Each scene card separates physics work from drawing. Captures use Chrome at 1440 × 900 on ${escape(gpuModel)}, with benchmark rendering.</p><div class="summary"><strong>${gpu.passed} GPU tests passed</strong><strong>${scenes.results.filter((s) => s.passed).length}/${scenes.results.length} scene/solver checks passed</strong><strong>${routes.results.filter((s) => s.passed).length} other pages checked</strong></div>
<section class="panel"><h2>What makes a scene slow?</h2><p><b>Physics moves the objects. Drawing makes the picture.</b> Compare these two numbers on each card. A large physics time means more work simulating movement and collisions. A large drawing time means more work making the image.</p><p><b>Smaller milliseconds are better; higher FPS is better.</b> A millisecond is a thousandth of a second. To show 60 pictures a second, each picture has about 16.7 ms. Physics and drawing need to leave room for other work too.</p><p>FPS tells you how often a new picture appears. These two stage timings help explain why. A steady 60 FPS may simply mean the screen refresh is limiting it. <a href="solver-performance.html">Compare physics calculations and paper results ↗</a></p><details><summary>Timing details and limits</summary><p>Cards show typical time (the median). “Slower physics” is p95: 95 out of 100 readings fit within that time. GPU physics is measured per simulation step and drawing per image. The larger stage is a clue rather than proof of the only bottleneck. FPS includes CPU work, waiting and display refresh. GPU readings are sampled periodically; the solver-only benchmark measures each step separately. Captures use Chrome at 1440 × 900 with simple benchmark rendering.</p></details></section>
<h2>100,000 block rook impact</h2><p>The rook uses GPU AVBD at 60 simulation steps per second, four solver iterations and sleeping for supported bricks. The cannonball is ten times denser than the bricks. The renderer reads GPU positions directly and draws the bricks together.</p><section class="panel"><p>${interpretation({ timing: { solveMs: rook.timing.summary.solveMs, renderMs: rook.timing.summary.renderMs }, backend: "gpu" })}</p><div class="scroll"><table><thead><tr><th>Overall frame rate</th><th>Typical physics, including sleeping</th><th>Typical drawing</th></tr></thead><tbody><tr><td>${fps(rook.timing.summary.frameMs.mean)} FPS</td><td>${ms(rook.timing.summary.solveMs.median)} ms/step</td><td>${ms(rook.timing.summary.renderMs.median)} ms/frame</td></tr></tbody></table></div><p>After six simulated seconds the ball has passed through the wall and the unsupported bricks above the opening have fallen. ${last.farMoved.toLocaleString()} of ${last.farCount.toLocaleString()} bricks in the outer quarters moved more than 15 cm. This checks that the impact remains localized instead of moving the whole wall.</p><details><summary>Stability check details</summary><p>The check requires at least 75% of outer-quarter bricks and 99.9% of outer-eighth bricks to stay within 15 cm of their starting positions. ${last.edgeMoved} of ${last.edgeCount.toLocaleString()} outer-eighth bricks exceeded that distance. Rotation normalization error was below ${last.maxQuatError.toExponential(2)}. Contact storage and parallel scheduling checks passed.</p></details></section><div class="checkpoints">${[60, 180, 360].map((n) => `<a href="screenshots/rook-${n}.png"><img src="screenshots/rook-${n}.png" alt="Rook impact at ${n / 60} seconds">${n / 60} simulated seconds</a>`).join("")}</div>
<h2>Brick ring and net motion</h2><p>These checks run for six simulated seconds. Objects move and rotate, the net keeps its pinned corners and catches the characters, and all checked positions and rotations remain valid.</p><div class="grid">${motion.results.map((s) => `<article><div class="card-heading">${escape(name(s.scene))} · six simulated seconds</div><a href="screenshots/${s.scene}-six-seconds.png"><img loading="lazy" src="screenshots/${s.scene}-six-seconds.png" alt="${escape(s.scene)} after six seconds"></a><div class="numbers"><span>${s.moved.toLocaleString()} objects moved</span><span>${s.rotated.toLocaleString()} objects rotated</span></div></article>`).join("")}</div>
<h2>Projectile controls</h2><p>${controls.results.filter((s) => s.passed).length}/${controls.results.length} control checks passed, including reset and launch. Capsule and cylinder projectiles use matching polygonal convex colliders.</p><div class="grid">${["sphere", "box", "capsule", "cylinder"].map((kind) => `<article><div class="card-heading">${kind} projectile</div><a href="screenshots/projectile-${kind}.png"><img loading="lazy" src="screenshots/projectile-${kind}.png" alt="${kind} projectile check"></a></article>`).join("")}</div>
${slingshotSection}${featureSection}${fractureSection}${chainmailSection}${fabricSection}${directSection}<h2>All scene checks</h2><p>“Passed” means the scene displayed, positions remained valid, contact storage and scheduling checks passed, and the single-step control advanced once. It does not mean every long-running physical behavior has been checked. Both 2D and 3D scenes support GPU physics; the original tests also offer CPU comparisons.</p><details><summary>Scene and solver settings</summary><p>Each scene retains its configured timestep and solving rounds. The GPU solves touching objects in separate work groups. Small scenes can spend more time submitting GPU work than calculating movement. Drawing enhancements are disabled for these captures.</p></details><input id="filter" aria-label="Filter scenes" placeholder="Filter by scene, 2D, 3D or solver"><div class="grid">${cards}</div>
<h2>Other pages</h2><p>These checks record overall FPS and screenshots. They do not measure physics and drawing separately, so their FPS cannot identify which stage limits performance.</p><div class="grid">${routes.results.map((s) => `<article><div class="card-heading"><a href="/?demo=${s.route}">${s.route}</a><span>${fps(s.frameMs.mean ?? s.frameMs.median)} FPS overall</span></div><a href="screenshots/route-${s.route}.png"><img loading="lazy" src="screenshots/route-${s.route}.png" alt="${s.route} screenshot"></a></article>`).join("")}</div><p>Generated ${new Date().toISOString()}. Raw results: <a href="scenes.json">scene checks</a> · <a href="rook.json">rook stability and timing</a> · <a href="routes.json">other pages</a> · <a href="controls.json">controls</a> · <a href="gpu.json">GPU tests</a>.</p></main><script>document.getElementById('filter').oninput=e=>{const q=e.target.value.toLowerCase();for(const card of document.querySelectorAll('[data-name]'))card.hidden=!card.dataset.name.includes(q)};</script></body></html>`;
await writeFile(
  "test-results/report.html",
  body.replace(
    "<p>After six simulated seconds",
    `${rookStage}<p>After six simulated seconds`,
  ),
);
console.log("Wrote test-results/report.html");
