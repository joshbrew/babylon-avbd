/** Manual overrides belong to one scene; a resolved preset is never an override. */
export function sceneSleepSelection(query, initialScene) {
  const overrides = new Map();
  if (query.has("sleeping"))
    overrides.set(initialScene, query.get("sleeping") === "1");
  return {
    get: (scene) => overrides.get(scene),
    set: (scene, enabled) => overrides.set(scene, !!enabled),
    writeUrl(url, scene) {
      url.searchParams.delete("sleeping");
      const enabled = overrides.get(scene);
      if (enabled !== undefined)
        url.searchParams.set("sleeping", enabled ? "1" : "0");
      return url;
    },
  };
}
