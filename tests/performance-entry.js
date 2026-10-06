import("./performance.js").catch((error) => {
  const status = document.getElementById("status");
  if (status)
    status.textContent = `Unable to start benchmark: ${error.message}`;
  globalThis.__PERFORMANCE_SETUP_ERROR__ = error.message;
});
