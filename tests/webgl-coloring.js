import { GlCompute } from "../src/webgl/compute.js";
import { GlBroadphase } from "../src/webgl/broadphase.js";
import { GlColoring } from "../src/webgl/coloring.js";
const check = (value, message) => {
  if (!value) throw Error(message);
};
const metadataShader = `#version 300 es
precision highp float;precision highp int;precision highp usampler2D;
uniform usampler2D neighbors0,neighbors1,neighbors2,neighbors3;
uniform uint bodyCount,bodyCapacity,bodyWidth,outputWidth,neighborCapacity,contactsPerPair;
layout(location=0)out uvec4 metadata;
uint neighbor(uint body,uint index){uint page=index/15u,slot=index%15u+1u;uint i=page*bodyCapacity+body;ivec2 uv=ivec2(i%bodyWidth,i/bodyWidth);
if(slot<4u)return texelFetch(neighbors0,uv,0)[int(slot)];if(slot<8u)return texelFetch(neighbors1,uv,0)[int(slot-4u)];if(slot<12u)return texelFetch(neighbors2,uv,0)[int(slot-8u)];return texelFetch(neighbors3,uv,0)[int(slot-12u)];}
void main(){uint index=uint(gl_FragCoord.x)+uint(gl_FragCoord.y)*outputWidth,pair=index/contactsPerPair,a=pair/neighborCapacity,k=pair%neighborCapacity;
metadata=uvec4(0u);if(a>=bodyCount)return;uint b=neighbor(a,k);if(b!=0u&&index%contactsPerPair==0u)metadata=uvec4(a,b-1u,0u,1u);}
`;
export async function checkGlColoring() {
  const c = new GlCompute(
      document.createElement("canvas").getContext("webgl2", {
        antialias: false,
        depth: false,
        stencil: false,
      }),
    ),
    rows = [];
  try {
    for (const dimension of [2, 3])
      for (const [name, N, capacity, rounds, colorCap, expectedFlags] of [
        ["empty", 0, 15, 64, 64, 0],
        ["sparse collision chain", 4096, 15, 64, 64, 0],
        ["dense collision graph", 64, 75, 64, 64, 0],
        ["unfinished coloring", 12, 15, 1, 64, 1],
        ["insufficient colors", 12, 15, 64, 8, 1],
        ["collision overflow", 64, 15, 64, 64, 4],
        ["sensors", 64, 75, 1, 64, 0],
        ["joint chain and released joints", 257, 15, 64, 64, 0],
      ]) {
        globalThis.__GL_COLOR_PROGRESS__ = `${dimension}D ${name}`;
        await new Promise((r) => setTimeout(r, 20));
        const grid = new GlBroadphase(c, {
            dimension,
            bodyCount: N,
            neighborCapacity: capacity,
            cellSize: 2,
          }),
          filters = new Uint32Array(grid.capacity * 4),
          bounds = new Float32Array(grid.capacity * 4);
        for (let i = 0; i < N; i++) {
          filters.set(
            [1, 1, Number(i !== 0), Number(name === "sensors")],
            i * 4,
          );
          bounds.set(
            [
              name.includes("chain")
                ? i * (name.startsWith("joint") ? 4 : 1)
                : 0,
              0,
              0,
              0.55,
            ],
            i * 4,
          );
        }
        const resources = [],
          own = (r) => (resources.push(r), r),
          filter = own(c.texture(grid.width, grid.height, true, filters)),
          bound = own(c.texture(grid.width, grid.height, false, bounds));
        let coloring;
        try {
          grid.dispatch(bound, filter);
          const points = dimension === 3 ? 8 : 2,
            slots = Math.max(1, N * grid.neighborCapacity * points),
            width = Math.min(c.maxTextureSize, Math.ceil(Math.sqrt(slots))),
            height = Math.ceil(slots / width);
          const metadata = own(c.texture(width, height, true)),
            program = own(c.program(metadataShader));
          c.dispatch(
            program,
            [metadata],
            Object.fromEntries(
              grid.neighbors.map((texture, i) => [`neighbors${i}`, texture]),
            ),
            {
              bodyCount: ["uniform1ui", N],
              bodyCapacity: ["uniform1ui", grid.capacity],
              bodyWidth: ["uniform1ui", grid.width],
              outputWidth: ["uniform1ui", width],
              neighborCapacity: ["uniform1ui", grid.neighborCapacity],
              contactsPerPair: ["uniform1ui", points],
            },
          );
          const joints = [];
          if (name.startsWith("joint")) {
            for (let i = 1; i < N; i++) joints.push([1, i - 1, i, 0]);
            joints.push([1, -1, 1, 0], [0, 1, N - 1, 0]);
          }
          const lists = Array.from({ length: N }, () => []);
          joints.forEach((j, index) => {
            for (const i of j.slice(1, 3)) if (i >= 0) lists[i].push(index);
          });
          const adj = [0];
          for (const list of lists) adj.push(adj.at(-1) + list.length);
          adj.push(...lists.flat());
          const padded = new Uint32Array(
            Math.max(4, Math.ceil(adj.length / 4) * 4),
          );
          padded.set(adj);
          const jointAdjacency = own(
            c.texture(padded.length / 4, 1, true, padded),
          );
          const jointInfo = own(
            c.texture(
              Math.max(1, joints.length),
              1,
              true,
              new Uint32Array(
                Int32Array.from(joints.length ? joints.flat() : [0, 0, 0, 0])
                  .buffer,
              ),
            ),
          );
          coloring = await GlColoring.create(c, grid, {
            contactsPerPair: points,
            jointAdjacency,
            jointInfo,
            rounds,
            colorCap,
          });
          const colors = await c.read(coloring.dispatch(filter, metadata)),
            status = await c.read(coloring.validation);
          check(
            (status[0] & expectedFlags) === expectedFlags,
            `${dimension}D ${name}: missing failure flag ${expectedFlags}, got ${status[0]}`,
          );
          if (expectedFlags === 0) {
            check(
              status[0] === 0,
              `${dimension}D ${name}: unexpected failure ${status[0]}`,
            );
            const neighbors = await Promise.all(
              grid.neighbors.map((t) => c.read(t)),
            );
            for (let i = 1; i < N; i++) {
              check(colors[i * 4] < colorCap, `${name}: uncolored body ${i}`);
              if (name !== "sensors")
                for (let k = 0; k < grid.neighborCapacity; k++) {
                  const slot = (k % 15) + 1,
                    page = Math.floor(k / 15),
                    j =
                      neighbors[Math.floor(slot / 4)][
                        (page * grid.capacity + i) * 4 + (slot % 4)
                      ] - 1;
                  if (j > 0)
                    check(
                      colors[i * 4] !== colors[j * 4],
                      `${name}: colliding bodies ${i}, ${j} share a color`,
                    );
                }
            }
            for (const [type, a, b] of joints)
              if (type !== 0 && a > 0 && b > 0)
                check(
                  colors[a * 4] !== colors[b * 4],
                  `${name}: joint color conflict`,
                );
          }
          check(
            colors[grid.capacity * 4] === status[0],
            `${name}: published solve guard differs`,
          );
          check(c.gl.getError() === c.gl.NO_ERROR, `${name}: WebGL error`);
          rows.push({
            dimension,
            name,
            bodies: N,
            colors: status[1],
            flags: status[0],
            passed: true,
          });
        } finally {
          coloring?.destroy();
          grid.destroy();
          for (const resource of resources) c.release(resource);
        }
      }
    check(
      c.textures.size === 0 && c.programs.size === 0,
      "GPU coloring leaked resources",
    );
    return { passed: true, rows };
  } finally {
    c.destroy();
  }
}
