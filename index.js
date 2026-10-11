import { startCollisionBenchmarkDemo } from "./demo/collision-benchmark/index.js";
import { startMixedColliderDemo } from "./demo/mixed-colliders/index.js";
import { startCanonicalLabDemo } from "./demo/lab/index.js";
import { startSlingshotDemo } from "./demo/slingshot/index.js";
import { startNavalDemo } from "./demo/naval/index.js";

const demo =
  new URLSearchParams(window.location.search).get("demo") || "canonical";

const starters = {
  naval: startNavalDemo,
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
