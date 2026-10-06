export function mainPageLink() {
  const link = document.createElement("a");
  link.href = "/";
  link.textContent = "← Back to main page";
  Object.assign(link.style, {
    display: "block",
    color: "#9bd5ff",
    font: "13px system-ui, sans-serif",
    padding: "4px 0",
    marginBottom: "12px",
    pointerEvents: "auto",
  });
  return link;
}
