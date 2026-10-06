import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";
import { browserCheck } from "./browser-check.mjs";
import { checkReadmeExamples } from "./check-readme-examples.mjs";
const doc =
  (await readFile("README.md", "utf8")) +
  "\n" +
  (await readFile("docs/README.md", "utf8"));
const snippets = [...doc.matchAll(/```js\n([\s\S]*?)\n```/g)].map((m) => m[1]);
const source = snippets.find((s) => s.startsWith("// src/main.js"));
if (!source) throw Error("Complete Babylon example missing");
await build({
  stdin: {
    contents:
      source.replace("../vendor/avbd/", "./") +
      "\nglobalThis.__DOC_EXAMPLE__ = { physics, engine, scene, box };",
    resolveDir: process.cwd(),
    sourcefile: "babylon-doc-example.js",
  },
  bundle: true,
  format: "esm",
  outfile: "dist/babylon-doc-example.js",
  loader: { ".wgsl": "text" },
});
// Parse every other JS snippet too; snippets intentionally share example context.
for (const snippet of snippets)
  await build({
    stdin: { contents: snippet },
    write: false,
    bundle: false,
    format: "esm",
    logLevel: "silent",
  });
const b = await browserCheck();
try {
  await b.navigate("test-results/solver-performance.html");
  await b.evaluate(
    `(async()=>{document.body.innerHTML='<canvas id="canvas" style="width:100vw;height:100vh;display:block"></canvas>';await import('/dist/babylon-doc-example.js');})()`,
  );
  const result = await b.evaluate(
    `(async()=>{const {physics,engine,box}=__DOC_EXAMPLE__;engine.stopRenderLoop();physics.initialize();for(let i=0;i<180;i++){physics.step();await physics.device.queue.onSubmittedWorkDone();}await physics.syncMeshes();const result={steps:physics.steps,y:box.position.y,finite:(await physics.readBodies()).every(Number.isFinite),errors:physics.errors};return result;})()`,
  );
  if (
    !result.finite ||
    result.errors.length ||
    result.y < 0.4 ||
    result.y > 0.7 ||
    b.errors.length
  )
    throw Error(JSON.stringify({ result, errors: b.errors }));
  const selection = await b.evaluate(`(async()=>{
    const w=__DOC_EXAMPLE__.physics, before=await w.readBodies();
    const manual=w.setSolverMode('optimized'), after=await w.readBodies();
    const automatic=w.setSolverMode('auto');
    return {preserved:before.every((v,i)=>v===after[i]),manual:manual.selected,automatic:automatic.selected,requested:w.solverDecision.requested};
  })()`);
  if (
    !selection.preserved ||
    selection.manual !== "optimized" ||
    selection.automatic !== "standard" ||
    selection.requested !== "auto"
  )
    throw Error(JSON.stringify(selection));
  await b.screenshot("test-results/screenshots/babylon-readme-example.png");
  await b.evaluate(
    "__DOC_EXAMPLE__.physics.dispose();__DOC_EXAMPLE__.scene.dispose();__DOC_EXAMPLE__.engine.dispose()",
  );
  const examples = await checkReadmeExamples(b);
  if (b.errors.length) throw Error(b.errors.join("\n"));
  await writeFile(
    "test-results/babylon-readme.json",
    JSON.stringify(
      { passed: true, snippets: snippets.length, result, selection, examples },
      null,
      2,
    ),
  );
  console.log(
    "PASS Babylon README: all JS snippets parse; complete example settles its rotating box on the floor",
  );
} finally {
  await b.close();
}
