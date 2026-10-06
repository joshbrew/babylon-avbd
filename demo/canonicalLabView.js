export const labMarkup = `
<main class="canonical-lab">
  <aside class="lab-sidebar">
    <a class="lab-home" href="/">← Back to main page</a>
    <div class="lab-eyebrow">AVBD · GPU & REFERENCE</div>
    <h1>Solver laboratory</h1>
    <p>Explore the GPU showcase, large paper workloads and all 33 original solver tests, in 2D and 3D.</p>
    <label for="lab-scene">SCENE</label><select id="lab-scene"></select>
    <label for="lab-backend">SOLVER</label><select id="lab-backend"></select>
    <label for="lab-renderer">RENDERER</label><select id="lab-renderer"><option value="webgpu">Direct WebGPU</option><option value="babylon">Babylon WebGPU · thin instances</option></select>
    <p>Both draw the same GPU physics. Changing renderer restarts the scene.</p>
    <div class="lab-actions"><button id="lab-pause">Pause</button><button id="lab-step">Step</button><button id="lab-reset">Reset</button></div>
    <button id="lab-shoot" hidden>Launch cannonball</button>
    <label id="lab-projectile-label" for="lab-projectile" hidden>PROJECTILE</label>
    <select id="lab-projectile" hidden><option value="sphere">Sphere</option><option value="box">Box</option><option value="capsule">Capsule hull</option><option value="cylinder">Cylinder hull</option></select>
    <fieldset id="lab-cannon-aim" hidden><legend>Cannon aim</legend>
      <label for="lab-cannon-yaw">DIRECTION <output id="lab-cannon-yaw-value">−16°</output></label><input id="lab-cannon-yaw" type="range" min="-40" max="40" step="1" value="-16">
      <label for="lab-cannon-elevation">ELEVATION <output id="lab-cannon-elevation-value">10°</output></label><input id="lab-cannon-elevation" type="range" min="0" max="50" step="1" value="10">
      <label for="lab-cannon-speed">SHOT SPEED <output id="lab-cannon-speed-value">44 m/s</output></label><input id="lab-cannon-speed" type="range" min="20" max="65" step="1" value="44">
      <p>Aim left or right across the walls; raise the barrel to reach the towers and roofs. Space fires a shot.</p>
    </fieldset>
    <label for="lab-iterations">ITERATIONS</label><input id="lab-iterations" type="number" min="1" max="40" value="10">
    <div id="lab-collision-options"><label for="lab-broadphase">FIND COLLISIONS</label><select id="lab-broadphase"><option value="auto">Automatic</option><option value="grid">Grid</option><option value="hploc">GPU tree</option></select>
    <input id="lab-solver-mode" type="hidden" value="auto">
    <p id="lab-solver-reason"></p>
    <label><input id="lab-detail-times" type="checkbox"> Show detailed calculation times</label></div>
    <label><input id="lab-debug" type="checkbox" checked> Show constraint links and contacts</label>
    <button id="lab-fit">Fit view</button>
    <button id="lab-tear-patch" hidden>Pull out a fabric patch</button>
    <fieldset id="lab-feature-controls" hidden><legend>Try the features</legend>
      <div id="lab-motor-controls" hidden><button id="lab-motor-reverse">Reverse motors</button><button id="lab-motor-stop">Stop motors</button></div>
      <div id="lab-filter-controls" hidden>
        <label><input id="lab-blue-shelf" type="checkbox"> Blue balls collide with the shelf</label>
        <label><input id="lab-sensor-enabled" type="checkbox" checked> Detect trigger overlaps</label>
        <p>Ball colors show current contacts: <strong style="color:#b17f09">gold = inside the trigger</strong>; <strong style="color:#287951">green = touching the shelf</strong>; <strong style="color:#167ca1">cyan = touching the floor</strong>. Other balls keep their lane color. Purple balls ignore both the shelf and trigger.</p>
        <p id="lab-contact-colors" aria-live="polite"></p>
        <p id="lab-trigger-events" aria-live="polite">Trigger entries — coral: 0, blue: 0, purple: 0.</p>
        <div><button id="lab-ray-query">Cast a ray</button><button id="lab-shape-query">Cast a sphere</button></div>
        <p id="lab-query-result" aria-live="polite">Queries look for coral balls and skip triggers. A circle or sphere can hit sooner than a thin ray.</p>
        <p>These switches change the live GPU world. Reset restores the example's starting settings.</p>
      </div>
    </fieldset>
    <label><input id="lab-enhanced" type="checkbox" checked> Enhanced colors, lighting and antialiasing</label>
    <details id="lab-options"><summary>Solver options</summary>
      <label><input data-param="postStabilize" type="checkbox"> Post-stabilization</label>
      <label><input data-param="stiffnessRescale" type="checkbox"> Friction stiffness rescaling</label>
      <label><input data-param="vbd" type="checkbox"> VBD comparison mode</label>
    </details>
    <p id="lab-description"></p>
    <nav class="lab-links">
      <a id="lab-report" href="/test-results/report.html" hidden>Scene check report and screenshots ↗</a>
      <a href="/test-results/solver-performance.html">Solver performance and paper comparison ↗</a>
      <a href="/test-results/renderer-performance.html">Babylon and direct WebGPU drawing comparison ↗</a>
      <a href="/tests/performance.html">Run all-scene GPU benchmarks ↗</a>
      <a href="?demo=gpu-stress">100,000 block impact benchmark ↗</a>
      <a href="?demo=showcase">Mixed collider gallery ↗</a>
      <a href="?demo=benchmark">GPU collision benchmark ↗</a>
      <a href="?demo=cannon">Castle cannon siege ↗</a>
      <a href="?demo=canonical&scene=3d-voronoi-demolition&backend=gpu">Voronoi wall and wrecking ball ↗</a>
      <a href="?demo=slingshot">2D slingshot siege · 1K–10K bricks ↗</a>
      <a href="?demo=canonical&scene=2d-limited-hinges&backend=gpu">2D hinges and motors ↗</a>
      <a href="?demo=canonical&scene=3d-limited-hinges&backend=gpu">3D hinges and motors ↗</a>
      <a href="?demo=canonical&scene=2d-triggers-and-masks&backend=gpu">2D triggers and masks ↗</a>
      <a href="?demo=canonical&scene=3d-triggers-and-masks&backend=gpu">3D triggers and masks ↗</a>
    </nav>
    <p>Source: <a href="https://github.com/sbobyn/three-avbd" target="_blank" rel="noopener">three-avbd</a> · pinned and verified</p>
  </aside>
  <section class="lab-view">
    <div class="lab-title"><h2></h2><span></span></div>
    <details class="lab-metrics" open><summary>Performance</summary><div id="lab-readings"></div>
      <canvas class="lab-chart" width="290" height="60"></canvas>
      <div class="lab-legend"><span style="color:#3e5bd7">● Physics</span><span style="color:#297652">● Collisions</span><span style="color:#c6783c">● Render</span></div>
      <div class="lab-status"></div>
    </details>
    <div class="lab-help"></div>
  </section>
</main>`;
