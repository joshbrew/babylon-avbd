import { writeFile } from "node:fs/promises";

// Requires an authorized Android browser, a reversed demo port and a forwarded
// DevTools socket. Select only this project's existing tab.
export async function connectedBrowser() {
  const endpoint = process.env.AVBD_PHONE_CDP ?? "http://127.0.0.1:9223";
  const origin = process.env.AVBD_PHONE_DEMO ?? "http://localhost:8080";
  const targets = await (await fetch(`${endpoint}/json/list`)).json();
  const target = targets.find(
    (t) => t.type === "page" && new URL(t.url).origin === origin,
  );
  if (!target?.webSocketDebuggerUrl)
    throw Error("Unlock the connected phone and open the local AVBD demo.");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let next = 0;
  const pending = new Map(),
    errors = [];
  const rejectPending = () => {
    for (const item of pending.values()) {
      clearTimeout(item.timer);
      item.reject(Error("Connected browser closed"));
    }
    pending.clear();
  };
  socket.addEventListener("close", rejectPending);
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === "Runtime.exceptionThrown") {
      const d = message.params.exceptionDetails;
      errors.push(d.exception?.description ?? d.text);
    }
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    clearTimeout(item.timer);
    message.error
      ? item.reject(Error(message.error.message))
      : item.resolve(message.result);
  });
  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++next;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(Error(`${method} timed out on the connected phone`));
      }, 300000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const reply = await call("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (reply.exceptionDetails)
      throw Error(
        reply.exceptionDetails.exception?.description ??
          reply.exceptionDetails.text,
      );
    return reply.result.value;
  };
  await call("Runtime.enable");
  await call("Page.enable");
  return {
    call,
    evaluate,
    errors,
    origin,
    async navigate(path) {
      const url = new URL(path, origin);
      if (url.origin !== origin)
        throw Error("Phone tests must stay on the local demo");
      await call("Page.navigate", { url: url.href });
    },
    async ready(expression) {
      const start = performance.now();
      while (performance.now() - start < 180000) {
        try {
          if (await evaluate(expression)) return;
        } catch (error) {
          if (!/context|navigated/.test(error.message)) throw error;
        }
        if (errors.length) throw Error(errors.join("\n"));
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      throw Error(`Connected phone startup timed out: ${expression}`);
    },
    async screenshot(path) {
      const { data } = await call("Page.captureScreenshot", { format: "png" });
      await writeFile(path, Buffer.from(data, "base64"));
    },
    close() {
      socket.close();
      rejectPending();
    },
  };
}
