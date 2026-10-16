import { contactRecyclingPresets } from "./contactRecyclingPresets.js";
export function sceneContactRecycling(id, choice = "auto", backend = "gpu") {
  if (choice === "auto" || choice === undefined)
    return backend === "gpu" ? (contactRecyclingPresets[id] ?? false) : false;
  if (choice === "on") return true;
  if (choice === "off") return false;
  if (typeof choice === "boolean" || (choice && typeof choice === "object"))
    return choice;
  throw Error("Contact recycling must be auto, on or off");
}

/** A manual comparison belongs to its scene; other scenes use their measured preset. */
export function sceneContactRecyclingSelection(query, initialScene) {
  const overrides = new Map();
  if (["on", "off"].includes(query.get("recycling")))
    overrides.set(initialScene, query.get("recycling"));
  return {
    get: (scene) => overrides.get(scene) ?? "auto",
    set(scene, choice) {
      if (choice === "auto") overrides.delete(scene);
      else overrides.set(scene, choice);
    },
    writeUrl(url, scene) {
      url.searchParams.delete("recycling");
      if (overrides.has(scene))
        url.searchParams.set("recycling", overrides.get(scene));
      return url;
    },
  };
}
