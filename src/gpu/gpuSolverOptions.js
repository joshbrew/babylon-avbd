import { selectSolverMode } from "./solverPolicy.js";

// Keep the reference solver untouched. Adopt the measured contact arithmetic
// optimization for large rigid-body workloads; smaller/joint-heavy workloads
// showed inconsistent gains, so they retain the original kernel.
export function appGpuSolverOptions(ref, options = {}) {
  // Selection is owned by AppGpuSolver3D so it also reacts to live body/constraint changes.
  selectSolverMode({
    ...options,
    requested: options.solverMode ?? "auto",
    bodyCount: ref.bodies.length,
    custom: !!options.shaders?.solve,
  });
  return { ...options, solverMode: options.solverMode ?? "auto" };
}

export function sceneGpuCapacity(id) {
  if (id.startsWith("paper-walls-")) return { colors: 32 };
  if (id === "showcase-ragdolls-on-cloth-24k")
    return { contacts: 300_000, pairs: 300_000, manifolds: 100_000 };
  // Reserve coloring headroom before dense rings acquire their first contacts.
  // Waiting for asynchronous counters can otherwise let the initial eight
  // groups run out, assigning adjacent bodies to the same solve group.
  if (id === "showcase-brick-ring-110k" || id === "showcase-brick-ring-28k")
    return { colors: 32 };
  if (
    id === "showcase-wall-smash-2k" ||
    id === "showcase-jointed-drop-34k" ||
    id === "3d-100k-rook-impact"
  )
    return { colors: 32 };
  if (id === "showcase-box-pile-4k")
    return { contacts: 48_000, pairs: 48_000, manifolds: 12_000 };
  return undefined;
}

export function sceneGpuSolverOptions(id) {
  const dense =
    id.startsWith("paper-walls-") ||
    [
      "showcase-wall-smash-2k",
      "showcase-jointed-drop-34k",
      "3d-100k-rook-impact",
    ].includes(id);
  return {
    capacity: sceneGpuCapacity(id),
    // Columns have only one or two touching pairs per body. Share the four
    // face points across lanes instead of leaving lanes without a pair idle.
    ...(id === "showcase-box-columns-100k"
      ? { contactScheduling: "points" }
      : {}),
    ...(id.startsWith("paper-")
      ? { minimumColors: 16, minimumColorRounds: 16 }
      : {}),
    ...([
      "showcase-brick-ring-110k",
      "showcase-brick-ring-28k",
      "showcase-ragdolls-on-cloth-24k",
    ].includes(id)
      ? { minimumColors: 16, minimumColorRounds: 16 }
      : {}),
    ...(dense ? { colorRounds: 32 } : {}),
  };
}
