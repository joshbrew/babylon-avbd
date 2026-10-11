import { webglContactSources } from "./webgl-contact-math.mjs";
import { webglSolveSources2D } from "./webgl-solve-math.mjs";
import { webglSolveSources3D } from "./webgl-solve3D-math.mjs";
import { webglEditSources } from "./webgl-edit-math.mjs";
import { webglRestitutionSources } from "./webgl-restitution-math.mjs";
import { readFile, writeFile } from "node:fs/promises";
const sources = {};
for (const dimension of [2, 3])
  sources[dimension] = {
    contact: (await webglContactSources(dimension, { hulls: dimension === 3 }))
      .glsl,
    solve: (dimension === 2 ? webglSolveSources2D() : webglSolveSources3D())
      .glsl,
    ...(dimension === 3
      ? { cloth: webglSolveSources3D({ cloth: true }).glsl }
      : {}),
    edits: (await webglEditSources(dimension)).glsl,
    restitution: webglRestitutionSources(dimension).glsl,
  };
const path = new URL("../src/webgl/generatedMath.js", import.meta.url);
const source =
  "// Generated from the production AVBD kernels by scripts/generate-webgl-math.mjs.\n// Shader translation is a build step; browsers need no parser or dependencies.\nexport default " +
  JSON.stringify(sources) +
  ";\n";
if (
  (await readFile(path, "utf8").catch((e) => {
    if (e.code !== "ENOENT") throw e;
    return "";
  })) !== source
)
  await writeFile(path, source);
console.log("Prepared WebGL2 AVBD shaders");
