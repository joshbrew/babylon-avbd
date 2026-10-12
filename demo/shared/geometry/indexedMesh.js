/** Reuse byte-identical position/normal vertices without changing triangles. */
export function indexedMesh(triangles) {
  const words = new Uint32Array(
    triangles.buffer,
    triangles.byteOffset,
    triangles.length,
  );
  const vertices = [],
    indices = [],
    slots = new Map();
  for (let offset = 0; offset < words.length; offset += 6) {
    const key = words.subarray(offset, offset + 6).join(",");
    let slot = slots.get(key);
    if (slot === undefined) {
      slot = vertices.length / 6;
      slots.set(key, slot);
      vertices.push(...triangles.subarray(offset, offset + 6));
    }
    indices.push(slot);
  }
  const IndexArray = vertices.length / 6 <= 65536 ? Uint16Array : Uint32Array;
  return {
    vertices: new Float32Array(vertices),
    indices: new IndexArray(indices),
  };
}
