let pending;
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
