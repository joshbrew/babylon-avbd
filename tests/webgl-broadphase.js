import { GlCompute } from "../src/webgl/compute.js";
import { GlBroadphase } from "../src/webgl/broadphase.js";

const check = (v, message) => {
  if (!v) throw Error(message);
};
const shader = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D inputBounds;
layout(location=0) out vec4 bounds;
void main(){bounds=texelFetch(inputBounds,ivec2(gl_FragCoord.xy),0);bounds.x+=.37;}`;

export async function checkGlBroadphase() {
  const canvas = document.createElement("canvas"),
    gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
    });
  const compute = new GlCompute(gl),
    rows = [];
  let seed = 0x12345678;
  const random = () =>
    ((seed = (Math.imul(seed, 1664525) + 1013904223) | 0) >>> 0) / 2 ** 32;
  try {
    for (const dimension of [2, 3]) {
      for (const [name, count, neighborCapacity] of [
        ["empty", 0, 1],
        ["single", 1, 1],
        ["cell boundaries and masks", 257, 60],
        ["crowded overflow", 64, 15],
        ["crowded capacity", 64, 75],
        ["sparse stress", 4096, 30],
      ]) {
        const grid = new GlBroadphase(compute, {
          bodyCount: count,
          dimension,
          cellSize: 2,
          neighborCapacity,
        });
        const bounds = new Float32Array(grid.capacity * 4),
          filters = new Uint32Array(grid.capacity * 4);
        for (let i = 0; i < count; i++) {
          const crowded = name.startsWith("crowded"),
            span = name === "sparse stress" ? 80 : 15;
          bounds.set(
            [
              crowded ? 0 : (random() - 0.5) * span,
              crowded ? 0 : (random() - 0.5) * span,
              dimension === 2 || crowded ? 0 : (random() - 0.5) * span,
              crowded ? 0.5 : 0.2 + random() * 0.75,
            ],
            i * 4,
          );
          filters.set([1, 0xffffffff, 1, 0], i * 4);
        }
        if (name === "cell boundaries and masks") {
          bounds.set([0, -0.2, 0, 20], 0); // A static floor larger than a cell.
          filters[2] = 0;
          bounds.set([-2, -2, dimension === 2 ? 0 : -2, 0.5], 4);
          bounds.set([-2.0001, -2, dimension === 2 ? 0 : -2, 0.5], 8);
          bounds.set([0, 0, 0, 4], 12); // Large dynamic body must find small shapes.
          for (let i = 4; i < count; i++) {
            filters[i * 4] = 1 << (i % 3);
            filters[i * 4 + 1] =
              i % 7 === 0 ? 0 : i % 5 === 0 ? 7 : 1 << (i % 3);
            filters[i * 4 + 2] = Number(i % 9 !== 0);
          }
        }
        const input = compute.texture(grid.width, grid.height, false, bounds),
          filter = compute.texture(grid.width, grid.height, true, filters);
        let gpuInput = input,
          shifted;
        // The second stress dispatch consumes GPU-written positions directly.
        if (name === "sparse stress") {
          shifted = compute.texture(grid.width, grid.height);
          const program = compute.program(shader);
          compute.dispatch(program, [shifted], { inputBounds: input });
          compute.release(program);
          gpuInput = shifted;
          for (let i = 0; i < count; i++)
            bounds[i * 4] = Math.fround(bounds[i * 4] + Math.fround(0.37));
        }
        const started = performance.now();
        grid.dispatch(gpuInput, filter);
        const arrays = await Promise.all(
          grid.neighbors.map((t) => compute.read(t)),
        );
        const elapsedMs = performance.now() - started;
        const sorted = await compute.read(grid.sorted);
        check(
          gl.getError() === gl.NO_ERROR,
          `${dimension}D ${name}: WebGL error`,
        );
        let overflow = 0,
          pairs = 0;
        for (let i = 0; i < count; i++) {
          const expected = [];
          if (filters[i * 4 + 2])
            for (let j = 0; j < count; j++) {
              if (
                i === j ||
                !(filters[i * 4] & filters[j * 4 + 1]) ||
                !(filters[j * 4] & filters[i * 4 + 1])
              )
                continue;
              const d = Math.hypot(
                bounds[i * 4] - bounds[j * 4],
                bounds[i * 4 + 1] - bounds[j * 4 + 1],
                bounds[i * 4 + 2] - bounds[j * 4 + 2],
              );
              if (d <= bounds[i * 4 + 3] + bounds[j * 4 + 3]) expected.push(j);
            }
          const actual = [];
          for (let p = 0; p < grid.pages; p++) {
            const offset = (p * grid.capacity + i) * 4;
            check(
              arrays[0][offset] === expected.length,
              `${dimension}D ${name} body ${i}: expected ${expected.length} candidates, received ${arrays[0][offset]}`,
            );
            for (let k = 1; k < 16; k++) {
              const id = arrays[Math.floor(k / 4)][offset + (k % 4)];
              if (id) actual.push(id - 1);
            }
          }
          check(
            new Set(actual).size === actual.length,
            `${name}: duplicate neighbors`,
          );
          check(
            actual.every((j) => expected.includes(j)),
            `${name}: invalid neighbor`,
          );
          check(
            actual.length === Math.min(expected.length, grid.neighborCapacity),
            `${name}: missing stored neighbors`,
          );
          if (expected.length > grid.neighborCapacity) overflow++;
          else
            check(
              actual.sort((a, b) => a - b).every((j, k) => j === expected[k]),
              `${name}: missed collision candidate`,
            );
          pairs += expected.length;
        }
        const ids = new Set();
        for (let i = 0; i < grid.capacity; i++) {
          if (i)
            check(
              sorted[(i - 1) * 4] < sorted[i * 4] ||
                (sorted[(i - 1) * 4] === sorted[i * 4] &&
                  sorted[(i - 1) * 4 + 1] <= sorted[i * 4 + 1]),
              `${name}: records out of order`,
            );
          if (i < count) ids.add(sorted[i * 4 + 1]);
          else check(sorted[i * 4] === 0xffffffff, `${name}: invalid padding`);
        }
        check(ids.size === count, `${name}: missing sorted body`);
        if (name === "crowded overflow")
          check(
            overflow === count,
            "Overflow must be visible for every crowded body",
          );
        else if (name === "crowded capacity")
          check(
            overflow === 0,
            "Sufficient neighbor capacity still overflowed",
          );
        rows.push({
          dimension,
          name,
          bodies: count,
          adjacencyEntries: pairs,
          overflowBodies: overflow,
          submitAndDownloadMs: elapsedMs,
          passed: true,
        });
        grid.destroy();
        compute.release(input);
        compute.release(filter);
        if (shifted) compute.release(shifted);
        check(
          compute.textures.size === 0 && compute.programs.size === 0,
          `${name}: leaked compute resources`,
        );
      }
    }
    return {
      passed: true,
      renderer: gl.getParameter(
        gl.getExtension("WEBGL_debug_renderer_info")?.UNMASKED_RENDERER_WEBGL ??
          gl.RENDERER,
      ),
      rows,
    };
  } finally {
    compute.destroy();
  }
}
