let pending;
/**
 * Load lightweight UI metadata once; scene builders and solver shaders load separately.
 * A rejected fetch clears the cache so a later navigation can retry.
 */
export function loadSceneCatalogue() {
  return (pending ??= fetch("/dist/scene-catalogue.json")
    .then(async (response) => {
      if (!response.ok)
        throw Error(`Scene catalogue could not load (${response.status})`);
      return response.json();
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    }));
}
