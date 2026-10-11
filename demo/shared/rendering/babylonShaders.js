// Adapt the viewer's WGSL entry points to Babylon's ShaderMaterial interface.
// Geometry, lighting, shape silhouettes and tear topology use the same source.
export function babylonShader(
  source,
  vertexName,
  fragmentName,
  constants = {},
) {
  const functions = [];
  for (const match of source.matchAll(
    /(?:@(vertex|fragment)\s+)?fn\s+(\w+)\s*\([^]*?\)\s*(?:->[^]*?)?\{/g,
  )) {
    let depth = 1,
      end = match.index + match[0].length;
    while (depth && end < source.length) {
      const c = source[end++];
      if (c === "{") depth++;
      if (c === "}") depth--;
    }
    functions.push({
      name: match[2],
      start: match.index,
      end,
      code: source.slice(match.index, end),
    });
  }
  const reachable = new Set([vertexName, fragmentName]);
  for (const name of reachable) {
    const current = functions.find((f) => f.name === name);
    if (current)
      for (const f of functions)
        if (new RegExp(`\\b${f.name}\\s*\\(`).test(current.code))
          reachable.add(f.name);
  }
  for (const f of functions.toReversed())
    if (!reachable.has(f.name))
      source = source.slice(0, f.start) + source.slice(f.end);
  source = source.replace(
    /@group\(\d+\)\s*@binding\(\d+\)\s*(var(?:<[^>]+>)?\s+(\w+)\s*:[^;]+;)/g,
    (declaration, variable, name) => {
      return [...source.matchAll(new RegExp(`\\b${name}\\b`, "g"))].length > 1
        ? declaration
        : "";
    },
  );
  for (const match of [...source.matchAll(/var\s+(\w+)\s*:\s*sampler\s*;/g)])
    if (!match[1].endsWith("Sampler"))
      source = source.replaceAll(
        new RegExp(`\\b${match[1]}\\b`, "g"),
        `${match[1]}Sampler`,
      );
  const entries = [
    ...source.matchAll(
      /@(vertex|fragment)\s+fn\s+(\w+)\((.*?)\)\s*->\s*(?:@\w+\([^)]*\)\s*)?(\w+(?:<[^>]+>)?)\s*\{/gs,
    ),
  ];
  const vertex = entries.find((m) => m[2] === vertexName && m[1] === "vertex");
  const fragment = entries.find(
    (m) => m[2] === fragmentName && m[1] === "fragment",
  );
  if (!vertex || !fragment)
    throw Error(`Missing shader entry ${vertexName}/${fragmentName}`);
  const struct = source.match(
    new RegExp(`struct ${vertex[4]}\\s*\\{([^}]+)\\}`),
  );
  const fields = struct
    ? [
        ...struct[1].matchAll(
          /@(builtin|location)\(([^)]+)\)\s*(\w+)\s*:\s*(\w+(?:<[^>]+>)?)/g,
        ),
      ]
    : [];
  const varyings = fields.filter((m) => m[1] === "location");
  const declarations = varyings
    .map((m) => `varying ${m[3]}: ${m[4]};`)
    .join("\n");
  const argumentsFor = (entry, stage) => {
    return [
      ...entry[3].matchAll(
        /(?:@(builtin|location)\((\w+)\)\s*)?(\w+)\s*:\s*(\w+(?:<[^>]+>)?)/g,
      ),
    ]
      .map((m) => {
        if (m[1] === "builtin") {
          if (m[2] === "instance_index") return "u32(vertexInputs.avbdSlot)";
          if (m[2] === "vertex_index") return "vertexInputs.vertexIndex";
          if (m[2] === "front_facing") return "fragmentInputs.frontFacing";
        }
        if (m[1] === "location")
          return m[2] === "0" ? "vertexInputs.position" : "vertexInputs.normal";
        if (stage === "fragment" && m[4] === vertex[4]) return "o";
        throw Error(`Unsupported shader parameter ${entry[2]}:${m[3]}`);
      })
      .join(",");
  };
  const storage = [...source.matchAll(/var<storage[^>]*>\s+(\w+)\s*:/g)].map(
    (m) => m[1],
  );
  const uniforms = [...source.matchAll(/var<uniform>\s+(\w+)\s*:/g)].map(
    (m) => m[1],
  );
  const textures = [...source.matchAll(/var\s+(\w+)\s*:\s*texture_/g)].map(
    (m) => m[1],
  );
  const samplers = [...source.matchAll(/var\s+(\w+)\s*:\s*sampler\s*;/g)].map(
    (m) => m[1],
  );
  let common = source
    .replace(/@group\(\d+\)\s*@binding\(\d+\)\s*/g, "")
    .replace(/@(vertex|fragment)\s+/g, "")
    .replace(/@(location|builtin)\([^)]*\)\s*/g, "")
    .replace(
      /override\s+(\w+)\s*:\s*(\w+)\s*=\s*([^;]+);/g,
      (_, name, type, value) =>
        `const ${name}:${type}=${constants[name] ?? value};`,
    );
  // The tear shader calls its native entry 'main'. Keep Babylon's wrapper unique.
  if (vertexName === "main")
    common = common.replace(/fn main\(/g, "fn avbdVertex(");
  const call = `${vertexName === "main" ? "avbdVertex" : vertexName}(${argumentsFor(vertex, "vertex")})`;
  const position = fields.find((m) => m[1] === "builtin")?.[3];
  const vertexCode = `attribute position:vec3f;\nattribute normal:vec3f;\nattribute avbdSlot:f32;\n${declarations}\n${common}\n@vertex fn main(input:VertexInputs)->FragmentInputs {\nlet o=${call};\nvertexOutputs.position=${position ? `o.${position}` : "o"};\n${varyings.map((m) => `vertexOutputs.${m[3]}=o.${m[3]};`).join("\n")}\n}`;
  const fragmentCode = `${declarations}\n${common}\n@fragment fn main(input:FragmentInputs)->FragmentOutputs {\n${struct ? `var o:${vertex[4]};\n${varyings.map((m) => `o.${m[3]}=fragmentInputs.${m[3]};`).join("\n")}` : ""}\nfragmentOutputs.color=${fragmentName}(${argumentsFor(fragment, "fragment")});\n}`;
  return { vertexCode, fragmentCode, storage, uniforms, textures, samplers };
}
