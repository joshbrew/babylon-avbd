import { readFile } from "node:fs/promises";
import { wgslToGlsl } from "./wgsl-to-glsl.mjs";

/** The command format and impulse/teleport equations are shared by backends. */
export async function webglEditSources(dimension) {
  if (![2, 3].includes(dimension))
    throw Error("Body commands require 2D or 3D");
  let wgsl = await readFile(
    dimension === 2
      ? "src/gpu/bodyCommands2D.wgsl"
      : "src/native/bodyCommands3D.wgsl",
    "utf8",
  );
  const entry =
    dimension === 2
      ? "let i=id.x+id.y*DISPATCH_STRIDE;\n if(i>=arrayLength(&ranges)){return;}\n let range=ranges[i];let index=commands[range.x].header.x;var b=bodies[index];"
      : "let i=id.x+id.y*DISPATCH_STRIDE;\n if(i>=arrayLength(&ranges)){return;}\n let range=ranges[i];let index=commands[range.x].header.x;var b=bodies[index];";
  if (wgsl.split(entry).length !== 2)
    throw Error("Body command entry layout changed");
  wgsl = wgsl.replace(
    entry,
    "let index=id.x;let range=ranges[index];var b=bodies[index];",
  );
  const glsl = wgslToGlsl(wgsl, {
    roots: ["edit"],
    storage: {
      bodies: {
        read: (i) => `loadEditBody(uint(${i}))`,
        write: () => "bodyResult",
      },
      commands: { read: (i) => `loadCommand(uint(${i}))` },
      ranges: { read: (i) => `loadRange(uint(${i}))` },
    },
    prelude:
      "w_Body loadEditBody(uint i);w_Command loadCommand(uint i);uvec2 loadRange(uint i);w_Body bodyResult;",
  });
  return { wgsl, glsl };
}
