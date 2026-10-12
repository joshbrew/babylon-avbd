import "./demo/lab/style.css";
import "./demo/slingshot/style.css";
import "./demo/naval/style.css";

const canonical = async () => {
  const query = new URLSearchParams(location.search);
  const { workersAvailable } =
    await import("./demo/shared/runtime/executionScope.js");
  if (
    query.get("embed") !== "1" &&
    query.get("scope") !== "main" &&
    navigator.gpu &&
    workersAvailable()
  ) {
    const { startWorkerLab } = await import("./demo/lab/workerView.js");
    return startWorkerLab(document.body, query);
  }
  const { startCanonicalLabDemo } = await import("./demo/lab/index.js");
  return startCanonicalLabDemo();
};

const demo =
  new URLSearchParams(window.location.search).get("demo") || "canonical";

const starters = {
  naval: async () => (await import("./demo/naval/index.js")).startNavalDemo(),
  slingshot: async () =>
    (await import("./demo/slingshot/index.js")).startSlingshotDemo(),
  canonical,
  cannon: canonical,
  benchmark: async () =>
    (
      await import("./demo/collision-benchmark/index.js")
    ).startCollisionBenchmarkDemo(),
  showcase: async () =>
    (await import("./demo/mixed-colliders/index.js")).startMixedColliderDemo(),
  rock: async () =>
    (await import("./demo/mixed-colliders/index.js")).startMixedColliderDemo(),
  "gpu-stress": canonical,
};

(starters[demo] || starters.canonical)().catch(showError);

function showError(error) {
  console.error(error);
  document.body.textContent = error.stack || error.message || String(error);
}
