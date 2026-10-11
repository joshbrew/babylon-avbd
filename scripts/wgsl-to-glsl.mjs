import { WgslParser } from "wgsl_reflect/wgsl_reflect.module.js";

// Build-time translation of the package's pure shader functions. Compute
// scheduling, storage writes and atomics must be supplied by the GL backend.
// Unsupported syntax fails the build; it never silently changes an equation.
export function wgslToGlsl(
  source,
  {
    roots,
    storage = {},
    globals = [],
    prelude = "",
    loopBounds = {},
    loopLimits = {},
    flatStructArrays = {},
  } = {},
) {
  const ast = WgslParser.Parse(source),
    functions = new Map(),
    structs = new Map(),
    constants = new Map(),
    scope = new Map();
  for (const n of ast) {
    if (n.astNodeType === "function") functions.set(n.name, n);
    else if (n.astNodeType === "struct") structs.set(n.name, n);
    else if (n.astNodeType === "const") constants.set(n.name, n);
  }
  const name = (n) => `w_${n}`;
  const flatMember = (s, member) => flatStructArrays[s.name]?.includes(member);
  function type(t) {
    if (!t) return "void";
    if (t.name === "ptr") return type(t.type);
    if (t.name === "atomic") return type(t.format);
    if (t.name === "array") return { array: type(t.format), count: t.count };
    const scalar = {
      f32: "float",
      f16: "float",
      i32: "int",
      u32: "uint",
      bool: "bool",
      x32: "int",
      abstract_int: "int",
      abstract_float: "float",
    };
    if (scalar[t.name]) return scalar[t.name];
    const v = /^vec([234])([fiuhb])?$/.exec(t.name);
    if (v) {
      const f =
        v[2] ??
        { f32: "f", i32: "i", u32: "u", bool: "b" }[t.format?.name] ??
        "f";
      return `${{ f: "", h: "", i: "i", u: "u", b: "b" }[f]}vec${v[1]}`;
    }
    const m = /^mat([234])x([234])f?$/.exec(t.name);
    if (m) return `mat${m[1]}${m[1] === m[2] ? "" : `x${m[2]}`}`;
    if (structs.has(t.name)) return name(t.name);
    throw Error(`Unsupported WGSL type ${t.name}`);
  }
  const base = (t) => (typeof t === "object" ? base(t.array) : t);
  const decl = (t, n) =>
    typeof t === "object" ? `${decl(t.array, n)}[${t.count}]` : `${t} ${n}`;
  const ctor = (t) =>
    typeof t === "object" ? `${ctor(t.array)}[${t.count}]` : t;
  const scalar = (t) =>
    /^[biu]?vec/.test(t)
      ? ({ i: "int", u: "uint", b: "bool" }[t[0]] ?? "float")
      : t;
  const vector = (t) => typeof t === "string" && /^[biu]?vec[234]$/.test(t);
  const zeros = new Set();
  function zero(t) {
    if (typeof t === "object")
      return `${ctor(t)}(${Array.from({ length: t.count }, () => zero(t.array)).join(",")})`;
    if (t.startsWith("w_")) {
      const s = structs.get(t.slice(2));
      return `${t}(${s.members
        .flatMap((m) => {
          const mt = type(m.type);
          return flatMember(s, m.name)
            ? Array.from({ length: mt.count }, () => zero(mt.array))
            : [zero(mt)];
        })
        .join(",")})`;
    }
    return t === "bool"
      ? "false"
      : t === "uint"
        ? "0u"
        : t === "int"
          ? "0"
          : `${t}(0.0)`;
  }
  for (const n of ast)
    if (["var", "const", "let", "override"].includes(n.astNodeType) && n.type)
      scope.set(n.name, type(n.type));
  const usedFunctions = new Set(),
    usedConstants = new Set();
  let currentFunction;
  function infer(e, env = scope) {
    if (!e) return "void";
    let t;
    switch (e.astNodeType) {
      case "varExpr":
        t = env.get(e.name);
        break;
      case "constExpr": {
        const c = constants.get(e.name);
        t = c?.type ? type(c.type) : infer(c?.value ?? e.initializer, env);
        break;
      }
      case "literalExpr":
        t = type(e.type);
        break;
      case "createExpr":
      case "typecastExpr":
      case "bitcastExpr":
        t = type(e.type);
        break;
      case "unaryOp":
        t = e.operator === "!" ? "bool" : infer(e.right, env);
        break;
      case "binaryOp": {
        const a = infer(e.left, env),
          b = infer(e.right, env);
        if (["==", "!=", "<", ">", "<=", ">="].includes(e.operator))
          t = vector(a) ? `bvec${a.at(-1)}` : "bool";
        else if (["&&", "||"].includes(e.operator)) t = "bool";
        else if (
          e.operator === "*" &&
          typeof a === "string" &&
          a.startsWith("mat") &&
          vector(b)
        )
          t = b;
        else
          t = vector(a)
            ? a
            : vector(b)
              ? b
              : a === "float" || b === "float"
                ? "float"
                : a;
        break;
      }
      case "callExpr": {
        if (functions.has(e.name)) t = type(functions.get(e.name).returnType);
        else if (structs.has(e.name)) t = name(e.name);
        else if (["dot", "length", "distance", "determinant"].includes(e.name))
          t = "float";
        else if (["all", "any"].includes(e.name)) t = "bool";
        else if (
          [
            "arrayLength",
            "countOneBits",
            "countLeadingZeros",
            "countTrailingZeros",
            "firstLeadingBit",
            "firstTrailingBit",
          ].includes(e.name)
        )
          t = "uint";
        else t = infer(e.args[0], env);
        break;
      }
      default:
        throw Error(`Cannot infer WGSL expression ${e.astNodeType}`);
    }
    if (t === undefined) throw Error(`Unknown WGSL variable ${e.name}`);
    for (let p = e.postfix; p; p = p.postfix) {
      if (p.index !== undefined)
        t =
          typeof t === "object"
            ? t.array
            : typeof t === "string" && t.startsWith("mat")
              ? `vec${t.at(-1)}`
              : scalar(t);
      else {
        const s = typeof t === "string" && structs.get(t.slice(2));
        if (s) t = type(s.members.find((m) => m.name === p.value)?.type);
        else
          t =
            p.value.length === 1
              ? scalar(t)
              : `${scalar(t) === "float" ? "" : { uint: "u", int: "i", bool: "b" }[scalar(t)]}vec${p.value.length}`;
      }
    }
    return t;
  }
  function postfix(e, text, t, env) {
    for (let p = e.postfix; p; p = p.postfix) {
      if (p.index !== undefined) {
        text += `[int(${expr(p.index, env)})]`;
        t =
          typeof t === "object"
            ? t.array
            : typeof t === "string" && t.startsWith("mat")
              ? `vec${t.at(-1)}`
              : scalar(t);
      } else {
        const s = typeof t === "string" && structs.get(t.slice(2));
        if (s && flatMember(s, p.value)) {
          const member = type(s.members.find((m) => m.name === p.value).type),
            index = p.postfix;
          if (index?.index === undefined)
            throw Error("Flattened struct arrays require an element index");
          if (index.index.astNodeType === "literalExpr")
            text += `.${name(p.value)}_${index.index.scalarValue}`;
          else
            text = `get_${name(s.name)}_${p.value}(${text},uint(${expr(index.index, env)}))`;
          t = member.array;
          p = index;
          continue;
        }
        text += `.${s ? name(p.value) : p.value}`;
        t = s
          ? type(s.members.find((m) => m.name === p.value)?.type)
          : p.value.length === 1
            ? scalar(t)
            : `${scalar(t) === "float" ? "" : { uint: "u", int: "i", bool: "b" }[scalar(t)]}vec${p.value.length}`;
      }
    }
    return text;
  }
  function expr(e, env = scope, lvalue = false) {
    if (!e) return "";
    let out, t;
    switch (e.astNodeType) {
      case "varExpr": {
        t = env.get(e.name);
        const binding = storage[e.name];
        if (binding) {
          const p = e.postfix;
          if (!p || p.index === undefined)
            throw Error(`Storage ${e.name} requires an index`);
          const idx = expr(p.index, env);
          const prefix = lvalue ? binding.write : binding.read;
          if (!prefix)
            throw Error(
              `Storage ${e.name} has no ${lvalue ? "write" : "read"} mapping`,
            );
          out = prefix(idx);
          return postfix({ postfix: p.postfix }, out, t.array, env);
        }
        out = name(e.name);
        break;
      }
      case "constExpr":
        usedConstants.add(e.name);
        out = name(e.name);
        t = constants.get(e.name)?.type
          ? type(constants.get(e.name).type)
          : infer(e.initializer, env);
        break;
      case "literalExpr": {
        t = type(e.type);
        const literal = (x, st) =>
          st === "uint"
            ? `${x >>> 0}u`
            : st === "bool"
              ? x
                ? "true"
                : "false"
              : st === "int"
                ? String(x | 0)
                : Number.isInteger(x) && !/[eE]/.test(String(x))
                  ? `${x}.0`
                  : String(x);
        out = e.isVector
          ? `${t}(${Array.from(e.vectorValue, (v) => literal(v, scalar(t))).join(",")})`
          : literal(e.scalarValue, t);
        break;
      }
      case "createExpr":
      case "typecastExpr":
        t = type(e.type);
        out = e.args?.length
          ? `${ctor(t)}(${e.args.map((a) => expr(a, env)).join(",")})`
          : zero(t);
        break;
      case "bitcastExpr": {
        t = type(e.type);
        const from = scalar(infer(e.value, env)),
          to = scalar(t),
          f =
            from === "float"
              ? to === "uint"
                ? "floatBitsToUint"
                : "floatBitsToInt"
              : to === "float"
                ? from === "uint"
                  ? "uintBitsToFloat"
                  : "intBitsToFloat"
                : ctor(t);
        out = `${f}(${expr(e.value, env)})`;
        break;
      }
      case "unaryOp":
        t = infer({ ...e, astNodeType: e.astNodeType, postfix: null }, env);
        out =
          e.operator === "&" || e.operator === "*"
            ? expr(e.right, env, lvalue)
            : `(${e.operator}${expr(e.right, env)})`;
        break;
      case "binaryOp": {
        t = infer({ ...e, astNodeType: e.astNodeType, postfix: null }, env);
        let a = expr(e.left, env),
          b = expr(e.right, env);
        const at = infer(e.left, env),
          bt = infer(e.right, env);
        if (
          vector(at) &&
          ["==", "!=", "<", ">", "<=", ">="].includes(e.operator)
        )
          out = `${{ "==": "equal", "!=": "notEqual", "<": "lessThan", ">": "greaterThan", "<=": "lessThanEqual", ">=": "greaterThanEqual" }[e.operator]}(${a},${b})`;
        else {
          if (scalar(at) === "float" && ["int", "uint"].includes(bt))
            b = `float(${b})`;
          if (scalar(bt) === "float" && ["int", "uint"].includes(at))
            a = `float(${a})`;
          out = `(${a} ${e.operator} ${b})`;
        }
        break;
      }
      case "callExpr":
      case "call": {
        t = infer({ ...e, astNodeType: "callExpr", postfix: null }, env);
        const args = e.args.map((a) => expr(a, env));
        if (functions.has(e.name)) {
          usedFunctions.add(e.name);
          out = `${name(e.name)}(${args.join(",")})`;
        } else if (structs.has(e.name))
          out = `${name(e.name)}(${args.join(",")})`;
        else if (e.name === "select")
          out = vector(infer(e.args[2], env))
            ? `mix(${args.join(",")})`
            : `(${args[2]} ? ${args[1]} : ${args[0]})`;
        else if (e.name === "atan2") out = `atan(${args.join(",")})`;
        else if (e.name === "inverseSqrt")
          out = `inversesqrt(${args.join(",")})`;
        // WGSL permits an ordinary multiply followed by addition for fma.
        // GLSL ES 3.00 has no fma builtin. See WGSL #fma-builtin accuracy.
        else if (e.name === "fma")
          out = `((${args[0]} * ${args[1]}) + ${args[2]})`;
        else if (e.name === "arrayLength") {
          const arg = e.args[0].right ?? e.args[0];
          if (!storage[arg.name]?.length)
            throw Error(`Array length missing for ${arg.name}`);
          out = storage[arg.name].length;
        } else if (
          [
            "abs",
            "min",
            "max",
            "clamp",
            "floor",
            "ceil",
            "round",
            "trunc",
            "fract",
            "sign",
            "sqrt",
            "sin",
            "cos",
            "tan",
            "asin",
            "acos",
            "atan",
            "exp",
            "exp2",
            "log",
            "log2",
            "pow",
            "dot",
            "cross",
            "length",
            "distance",
            "normalize",
            "transpose",
            "determinant",
            "all",
            "any",
            "mix",
            "step",
            "smoothstep",
            "reflect",
            "refract",
          ].includes(e.name)
        )
          out = `${e.name}(${args.join(",")})`;
        else throw Error(`Unsupported WGSL builtin ${e.name}`);
        break;
      }
      default:
        throw Error(`Unsupported WGSL expression ${e.astNodeType}`);
    }
    return postfix(e, out, t, env);
  }
  function statement(n, env, inline = false) {
    const end = inline ? "" : ";";
    switch (n.astNodeType) {
      case "let":
      case "var":
      case "const": {
        const t = n.type ? type(n.type) : infer(n.value, env);
        env.set(n.name, t);
        return `${decl(t, name(n.name))} = ${n.value ? expr(n.value, env) : zero(t)}${end}`;
      }
      case "assign": {
        const left = expr(n.variable, env, true),
          right = expr(n.value, env);
        // D3D cannot address a dynamically indexed array member of an inout
        // structure in all call contexts. Constant-index stores express the
        // same bounded write without depending on that driver representation.
        const access = [];
        for (let p = n.variable.postfix; p; p = p.postfix) access.push(p);
        const index = access.at(-1)?.index;
        if (index && index.astNodeType !== "literalExpr") {
          const array = {
            ...n.variable,
            astNodeType: n.variable.astNodeType,
            postfix: access
              .slice(0, -1)
              .reduceRight((next, p) => ({ ...p, postfix: next }), null),
          };
          const t = infer(array, env);
          if (
            typeof t === "object" &&
            Number.isInteger(t.count) &&
            t.count > 0
          ) {
            return `{int t_store_index=int(${expr(index, env)});${decl(t.array, "t_store_value")}=${right};switch(t_store_index){${Array.from(
              { length: t.count },
              (_, i) => {
                const at = {
                  ...n.variable,
                  astNodeType: n.variable.astNodeType,
                  postfix: access.reduceRight(
                    (next, p, j) => ({
                      ...p,
                      index:
                        j === access.length - 1
                          ? {
                              astNodeType: "literalExpr",
                              type: { name: "i32" },
                              scalarValue: i,
                            }
                          : p.index,
                      postfix: next,
                    }),
                    null,
                  ),
                };
                return `case ${i}:${expr(at, env, true)} ${n.operator} t_store_value;break;`;
              },
            ).join("")}}}`;
          }
        }
        return `${left} ${n.operator} ${right}${end}`;
      }
      case "increment":
        return `${expr(n.variable, env, true)}${n.operator}${end}`;
      case "return":
        return `return${n.value && infer(n.value, env) !== "void" ? ` ${expr(n.value, env)}` : ""};`;
      case "call":
        return `${expr(n, env)};`;
      case "if":
        return `if(${expr(n.condition, env)})${block(n.body, env)}${(n.elseif ?? []).map((e) => `else if(${expr(e.condition, env)})${block(e.body, env)}`).join("")}${n.else ? `else${block(n.else, env)}` : ""}`;
      case "for": {
        const local = new Map(env),
          init = n.init ? statement(n.init, local, true) : "",
          originalCondition = expr(n.condition, local),
          increment = n.increment ? statement(n.increment, local, true) : "";
        const key = `${currentFunction}.${n.init?.name}`;
        const limit = loopLimits[key];
        const condition =
          limit === undefined
            ? originalCondition
            : `(${name(n.init.name)}<${limit}${local.get(n.init.name) === "uint" ? "u" : ""}&&(${originalCondition}))`;
        const bound = loopBounds[key];
        if (bound !== undefined) {
          const hasBreak = (value) => {
            if (!value || typeof value !== "object") return false;
            if (value.astNodeType === "break") return true;
            return Object.values(value).some((child) =>
              Array.isArray(child) ? child.some(hasBreak) : hasBreak(child),
            );
          };
          if (n.body.some(hasBreak))
            throw Error(
              "Bounded geometry loops with break require explicit control-flow lowering",
            );
          if (
            !Number.isInteger(bound) ||
            bound < 1 ||
            n.init?.astNodeType !== "var" ||
            n.init.value?.scalarValue !== 0 ||
            n.increment?.operator !== "++"
          )
            throw Error(
              "Geometry unrolling requires a zero-based unit increment loop",
            );
          // The small fixed geometry arrays bound these loops. Explicit copies
          // avoid ANGLE/D3D's failed nested-loop unrolling of inout structures.
          // Each copy retains the original dynamic stop and continue behavior.
          const variable = name(n.init.name),
            active = `${variable}_active`,
            t = local.get(n.init.name);
          const body = block(n.body, local);
          return `{bool ${active}=true;${Array.from({ length: bound }, (_, i) => `{${decl(t, variable)}=${i}${t === "uint" ? "u" : ""};if(${active}){if(!(${condition})){${active}=false;}else do${body}while(false);}}`).join("\n")}}`;
        }
        return `for(${init};${condition};${increment})${block(n.body, local)}`;
      }
      case "while":
        return `while(${expr(n.condition, env)})${block(n.body, env)}`;
      case "loop":
        if (n.continuing)
          throw Error(
            "WGSL continuing blocks need explicit backend scheduling",
          );
        return `while(true)${block(n.body, env)}`;
      case "break":
        return n.condition ? `if(${expr(n.condition, env)})break;` : "break;";
      case "continue":
        return "continue;";
      case "switch":
        return `switch(${expr(n.condition, env)}){${n.cases.map((c) => `${c.astNodeType === "default" ? "default:" : c.selectors.map((s) => `case ${expr(s, env)}:`).join("")}${block(c.body, env)}break;`).join("")}}`;
      default:
        throw Error(`Unsupported WGSL statement ${n.astNodeType}`);
    }
  }
  const block = (body, env) => {
    const local = new Map(env);
    return `{\n${body.map((n) => statement(n, local)).join("\n")}\n}`;
  };
  // Statements in a block share declarations; child blocks receive a copy.
  function functionBody(body, env) {
    return `{\n${body.map((n) => statement(n, env)).join("\n")}\n}`;
  }
  const emitFunction = (f) => {
    currentFunction = f.name;
    const env = new Map(scope);
    for (const a of f.args) env.set(a.name, type(a.type));
    const args = f.args
      .map(
        (a) =>
          `${a.type.name === "ptr" ? "inout " : ""}${decl(type(a.type), name(a.name))}`,
      )
      .join(",");
    const signature = `${ctor(type(f.returnType))} ${name(f.name)}(${args})`;
    return { signature, code: signature + functionBody(f.body, env) };
  };
  const selected = new Map();
  for (const root of roots ?? []) usedFunctions.add(root);
  for (const f of usedFunctions) {
    if (!functions.has(f)) throw Error(`Missing shader function ${f}`);
    selected.set(f, emitFunction(functions.get(f)));
  }
  const constCode = [];
  for (const c of usedConstants) {
    const n = constants.get(c);
    if (!n) throw Error(`Missing shader constant ${c}`);
    const t = n.type ? type(n.type) : infer(n.value);
    scope.set(c, t);
    constCode.push(`const ${decl(t, name(c))} = ${expr(n.value)};`);
  }
  const structCode = [...structs.values()].map(
    (s) =>
      `struct ${name(s.name)} {${s.members
        .flatMap((m) => {
          const mt = type(m.type);
          return flatMember(s, m.name)
            ? Array.from(
                { length: mt.count },
                (_, i) => `${decl(mt.array, name(m.name) + "_" + i)};`,
              )
            : [`${decl(mt, name(m.name))};`];
        })
        .join("")}};`,
  );
  const flatGetters = [...structs.values()].flatMap((s) =>
    s.members
      .filter((m) => flatMember(s, m.name))
      .map((m) => {
        const mt = type(m.type);
        return `${ctor(mt.array)} get_${name(s.name)}_${m.name}(${name(s.name)} v,uint i){${Array.from({ length: mt.count }, (_, i) => `if(i==${i}u)return v.${name(m.name)}_${i};`).join("")}return ${zero(mt.array)};}`;
      }),
  );
  const zeroCode = [];
  for (const n of zeros) {
    const s = structs.get(n);
    zeroCode.push(
      `${name(n)} zero_${name(n)}(){ ${name(n)} v;${s.members.map((m) => `v.${name(m.name)}=${zero(type(m.type))};`).join("")}return v;}`,
    );
  }
  const globalCode = globals.map((g) => {
    const n = ast.find((n) => n.name === g);
    if (!n) throw Error(`Missing shader global ${g}`);
    return `${n.storage === "uniform" ? "uniform " : ""}${decl(type(n.type), name(g))}${n.value ? ` = ${expr(n.value)}` : ""};`;
  });
  return [
    ...structCode,
    ...flatGetters,
    ...constCode,
    ...zeroCode,
    ...globalCode,
    prelude,
    ...[...selected.values()].map((f) => `${f.signature};`),
    ...[...selected.values()].map((f) => f.code),
  ].join("\n");
}
