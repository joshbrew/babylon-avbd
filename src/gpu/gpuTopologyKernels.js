import { makeTopologyWGSL } from "../../reference/three-avbd/src/avbd2d/gpu/wgsl-topology.ts";
import {
  PRELUDE_3D,
  TOPOLOGY_ACCESSORS_3D,
} from "../../reference/three-avbd/src/avbd3d/gpu/layout.ts";

// Cache sort keys for short adjacency lists. Large lists retain the original
// insertion sort; key ordering and constraint accumulation order are identical.
const original =
  "  let list = params.adjListOffset;\n  for (var i = lo + 1u; i < hi; i++) {";
const source = makeTopologyWGSL(PRELUDE_3D, TOPOLOGY_ACCESSORS_3D);
if (source.split(original).length !== 2)
  throw Error("Pinned adjacency sort changed; review the cached-key variant");
export const cachedAdjacencyWGSL = source.replace(
  original,
  `
  let list = params.adjListOffset;
  let count = hi - lo;
  if (count <= 16u) {
    var ids: array<u32, 16>;
    var keys: array<vec2u, 16>;
    for (var i = 0u; i < count; i++) {
      ids[i] = atomicLoad(&adj[list + lo + i]);
      keys[i] = adjKey(b, ids[i]);
    }
    for (var i = 1u; i < count; i++) {
      let id = ids[i];
      let key = keys[i];
      var j = i;
      loop {
        if (j == 0u) { break; }
        if (!keyLess(key, keys[j - 1u])) { break; }
        ids[j] = ids[j - 1u];
        keys[j] = keys[j - 1u];
        j--;
      }
      ids[j] = id;
      keys[j] = key;
    }
    for (var i = 0u; i < count; i++) {
      atomicStore(&adj[list + lo + i], ids[i]);
    }
    return;
  }
  for (var i = lo + 1u; i < hi; i++) {`,
);
