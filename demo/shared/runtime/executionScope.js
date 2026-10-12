/** Check the canvas-transfer prerequisites; GPU support is checked during initialization. */
export function workersAvailable() {
  return (
    typeof Worker === "function" &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function"
  );
}

export function workerSceneUrl(config) {
  const url = new URL("/tests/workers.html", location.href);
  for (const [key, value] of Object.entries(config))
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  return url;
}

/** Open the matching scene in the shared play/benchmark worker view. */
export function mountExecutionScope(
  host,
  options,
  { laboratory = false } = {},
) {
  const label = document.createElement("label"),
    select = document.createElement("select");
  label.textContent = "Execution ";
  for (const [value, name] of [
    ["main", "Main thread"],
    ["worker", "Dedicated worker"],
    ["worker-sab", "Dedicated worker · shared input"],
  ]) {
    if (
      value === "worker-sab" &&
      (!crossOriginIsolated || typeof SharedArrayBuffer !== "function")
    )
      continue;
    const option = new Option(name, value);
    option.disabled = value !== "main" && !workersAvailable();
    select.add(option);
  }
  label.append(select);
  host.append(label);
  select.onchange = () => {
    if (select.value === "main") return;
    const config = { ...options(), scope: select.value };
    if (laboratory) {
      const url = new URL(location.href);
      for (const [key, value] of Object.entries(config))
        url.searchParams.set(key, value);
      location.href = url;
    } else location.href = workerSceneUrl(config);
  };
  return select;
}
