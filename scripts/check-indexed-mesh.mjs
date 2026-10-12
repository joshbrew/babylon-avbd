import assert from "node:assert/strict";
import { indexedMesh } from "../demo/shared/geometry/indexedMesh.js";

// Preserve triangle order, smooth normals, hard edges and signed-zero bits.
const triangles = new Float32Array([
  0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0,
  0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0, 0, 0, 0, 0, 1,
]);
function check(input) {
  const { vertices, indices } = indexedMesh(input);
  const original = new Uint32Array(
    input.buffer,
    input.byteOffset,
    input.length,
  );
  const packed = new Uint32Array(vertices.buffer);
  for (let i = 0; i < indices.length; i++)
    assert.deepEqual(
      packed.slice(indices[i] * 6, indices[i] * 6 + 6),
      original.slice(i * 6, i * 6 + 6),
    );
  return { vertices, indices };
}
const small = check(triangles);
assert.equal(small.vertices.length / 6, 6);
assert.ok(small.indices instanceof Uint16Array);
// A view into another buffer must use its own offset and length.
check(triangles.subarray(6, 36));
const large = new Float32Array(65537 * 6);
for (let i = 0; i < 65537; i++) large[i * 6] = i;
assert.ok(check(large).indices instanceof Uint32Array);
console.log(
  "Indexed meshes preserve all triangle and normal bits, including buffer views and large meshes.",
);
