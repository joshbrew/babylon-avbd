import { startCollisionBenchmarkDemo } from "./demo/collisionBenchmarkDemo.js";
import { startMixedColliderDemo } from "./demo/mixedColliderDemo.js";
import { startCanonicalLabDemo } from "./demo/canonicalLabDemo.js";
import { startSlingshotDemo } from "./demo/slingshotDemo.js";

const demo =
  new URLSearchParams(window.location.search).get("demo") || "canonical";

const starters = {
  slingshot: startSlingshotDemo,
  canonical: startCanonicalLabDemo,
  cannon: startCanonicalLabDemo,
  benchmark: startCollisionBenchmarkDemo,
  showcase: startMixedColliderDemo,
  rock: startMixedColliderDemo,
  "gpu-stress": startCanonicalLabDemo,
};

(starters[demo] || starters.canonical)().catch(showError);

function showError(error) {
  console.error(error);
  document.body.textContent = error.stack || error.message || String(error);
}
