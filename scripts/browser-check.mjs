import { createServer } from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { resolve, join, extname, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

export async function browserCheck() {
  const root = resolve(".");
  const server = createServer(async (req, res) => {
    try {
      const path = resolve(
        root,
        "." +
          decodeURIComponent(
            new URL(req.url, "http://localhost").pathname.replace(
              /\/$/,
              "/index.html",
            ),
          ),
      );
      if (!path.startsWith(root + sep)) return res.writeHead(403).end();
      res.setHeader(
        "Content-Type",
        { ".js": "text/javascript", ".css": "text/css", ".html": "text/html" }[
          extname(path)
        ] || "application/octet-stream",
      );
      res.end(await readFile(path));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const profile = await mkdtemp(join(tmpdir(), "avbd-scene-check-"));
  const browser = spawn(
    process.env.AVBD_TEST_BROWSER ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    [
      "--headless=new",
      "--remote-debugging-pipe",
      "--enable-unsafe-webgpu",
      "--force-high-performance-gpu",
      "--use-webgpu-power-preference=force-high-performance",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${profile}`,
    ],
    { windowsHide: true, stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] },
  );
  const errors = [],
    logs = [],
    pending = new Map();
  let incoming = "",
    next = 0;
  browser.stdio[4].on("data", (chunk) => {
    incoming += chunk;
    let end;
    while ((end = incoming.indexOf("\0")) >= 0) {
      const msg = JSON.parse(incoming.slice(0, end));
      incoming = incoming.slice(end + 1);
      if (msg.method === "Log.entryAdded") logs.push(msg.params.entry);
      if (msg.method === "Runtime.exceptionThrown")
        errors.push(
          msg.params.exceptionDetails.exception?.description ||
            msg.params.exceptionDetails.text,
        );
      const p = pending.get(msg.id);
      if (p) {
        pending.delete(msg.id);
        msg.error ? p.reject(Error(msg.error.message)) : p.resolve(msg.result);
      }
    }
  });
  browser.on("exit", () => {
    for (const p of pending.values()) p.reject(Error("Browser exited"));
    pending.clear();
  });
  const command = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++next;
      pending.set(id, { resolve, reject });
      browser.stdio[3].write(
        JSON.stringify({
          id,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }) + "\0",
      );
    });
  await command("Browser.getVersion");
  const { targetId } = await command("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await command("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const call = (method, params) => command(method, params, sessionId);
  await call("Runtime.enable");
  await call("Log.enable");
  await call("Page.enable");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const evaluate = async (expression) => {
    const r = await call("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails)
      throw Error(
        r.exceptionDetails.exception?.description || r.exceptionDetails.text,
      );
    return r.result?.value;
  };
  return {
    errors,
    logs,
    call,
    evaluate,
    navigate: (query) =>
      call("Page.navigate", {
        url: `http://127.0.0.1:${server.address().port}/${query}`,
      }),
    screenshot: async (path) => {
      const r = await call("Page.captureScreenshot", { format: "png" });
      await import("node:fs/promises").then((fs) =>
        fs.writeFile(path, Buffer.from(r.data, "base64")),
      );
    },
    close: async () => {
      try {
        await command("Browser.close");
      } catch {}
      browser.kill();
      server.close();
      if (browser.exitCode === null && browser.signalCode === null)
        await new Promise((r) => browser.once("exit", r));
      if (!resolve(profile).startsWith(resolve(tmpdir()) + sep))
        throw Error("Invalid temporary profile");
      await rm(profile, {
        recursive: true,
        force: true,
        maxRetries: 6,
        retryDelay: 200,
      }).catch(() => {});
    },
  };
}
