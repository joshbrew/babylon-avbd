import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { browserCheck } from "./browser-check.mjs";
await build({
  entryPoints: ["tests/ragdoll-net-motion.js"],
  outfile: "dist/net-motion.js",
  bundle: true,
  format: "esm",
  loader: { ".wgsl": "text" },
});
const browser = await browserCheck();
try {
  await browser.navigate("test-results/package-performance.html");
  const result = await browser.evaluate(
    `(async()=>{const {measureRagdollNet}=await import('/dist/net-motion.js');return measureRagdollNet();})()`,
  );
  const passed = !(
    result.timeStep !== 1 / 240 ||
    result.iterations !== 5 ||
    result.broadphase !== "hploc" ||
    !result.rigidNet ||
    result.rigidNet.seamOverlap < 0.019 ||
    result.snapshots.some(
      (s) =>
        s.bodiesWhollyBelowVisibleSheet ||
        s.ragdollsStraddlingSheet ||
        s.limbsPenetratingVisibleSheet,
    ) ||
    browser.errors.length
  );
  await writeFile(
    "test-results/ragdoll-net.json",
    JSON.stringify({ passed, ...result, errors: browser.errors }, null, 2),
  );
  if (!passed) throw Error(JSON.stringify({ result, errors: browser.errors }));
  console.log(
    "PASS ragdoll net: 30 seconds of GPU motion; no submerged limbs, straddling ragdolls or rounded limbs penetrating the drawn sheet by more than 5 mm",
  );
} finally {
  await browser.close();
}
