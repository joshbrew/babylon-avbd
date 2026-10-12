/** Keep setup visible even when the performance panel is collapsed. */
export function sceneLoading(root, message, failed = false) {
  const view = root.querySelector(".lab-view");
  const panel = root.querySelector(".lab-loading");
  if (!panel) return;
  panel.hidden = message == null;
  view.setAttribute("aria-busy", String(message != null && !failed));
  if (message != null) {
    panel.querySelector("strong").textContent = failed
      ? "Could not load scene"
      : "Loading scene…";
    panel.querySelector("span").textContent = message;
  }
}

export const paintLoading = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
