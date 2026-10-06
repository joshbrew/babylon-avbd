import { build } from "esbuild";
import { createServer } from "node:http";
import {
  readFile,
  mkdtemp,
  rm,
  access,
  writeFile,
  mkdir,
} from "node:fs/promises";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { resolve, join, extname, basename, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { sourceMapsEnabled, removeStaleSourceMap } from "./source-maps.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
await removeStaleSourceMap(join(root, "dist/gpu-tests.js"));
await build({
  entryPoints: [join(root, "tests/gpu.js")],
  outfile: join(root, "dist/gpu-tests.js"),
  bundle: true,
  format: "esm",
  minify: true,
  loader: { ".wgsl": "text" },
  sourcemap: sourceMapsEnabled,
});
const candidates = process.env.AVBD_TEST_BROWSER
  ? [process.env.AVBD_TEST_BROWSER]
  : process.platform === "win32"
    ? [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      ]
    : [
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ];
let browserPath;
for (const candidate of candidates) {
  try {
    await access(candidate);
    browserPath = candidate;
    break;
  } catch {}
}
if (!browserPath)
  throw new Error(
    "Chrome or Edge is required for GPU tests. Set AVBD_TEST_BROWSER to its executable path.",
  );

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    const path = resolve(root, "." + pathname);
    if (!path.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    const content = await readFile(path);
    response.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".map": "application/json",
      }[extname(path)] ?? "application/octet-stream",
    );
    response.end(content);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const profile = await mkdtemp(join(tmpdir(), "avbd-gpu-tests-"));
const browser = spawn(
  browserPath,
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
const browserErrors = [];
let stderr = "",
  pending = new Map(),
  nextId = 0,
  incoming = "";
browser.stderr.on("data", (chunk) => {
  stderr = (stderr + chunk).slice(-8000);
});
browser.on("error", (error) => {
  for (const p of pending.values()) p.reject(error);
  pending.clear();
});
let browserExited = false;
browser.once("exit", () => {
  browserExited = true;
  for (const p of pending.values())
    p.reject(Error("GPU test browser exited before replying"));
  pending.clear();
});
browser.on("exit", (code) => {
  for (const p of pending.values())
    p.reject(new Error(`Test browser exited (${code}): ${stderr}`));
  pending.clear();
});
browser.stdio[4].on("data", (chunk) => {
  incoming += chunk.toString();
  let end;
  while ((end = incoming.indexOf("\0")) >= 0) {
    const message = JSON.parse(incoming.slice(0, end));
    incoming = incoming.slice(end + 1);
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      browserErrors.push(details.exception?.description ?? details.text);
    }
    if (
      message.method === "Log.entryAdded" &&
      message.params.entry.level === "error" &&
      message.params.entry.source !== "network"
    ) {
      browserErrors.push(message.params.entry.text);
    }
    const p = pending.get(message.id);
    if (p) {
      pending.delete(message.id);
      message.error
        ? p.reject(new Error(message.error.message))
        : p.resolve(message.result);
    }
  }
});
const command = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    if (browserExited) return reject(Error("GPU test browser has exited"));
    const id = ++nextId;
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
const deadline = setTimeout(
  () => {
    console.error("GPU test timeout\n" + stderr);
    browser.kill();
  },
  Number(process.env.AVBD_GPU_TIMEOUT_MS ?? 900000),
);
try {
  await command("Browser.getVersion");
  const { targetId } = await command("Target.createTarget", {
    url: `http://127.0.0.1:${server.address().port}/tests/gpu.html${process.env.AVBD_GPU_FILTER ? "?filter=" + encodeURIComponent(process.env.AVBD_GPU_FILTER) : ""}`,
  });
  const { sessionId } = await command("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  await command("Runtime.enable", {}, sessionId);
  await command("Log.enable", {}, sessionId);
  let result,
    delivered = 0;
  while (!result?.done) {
    const reply = await command(
      "Runtime.evaluate",
      { expression: "globalThis.__GPU_TEST_RESULT__", returnByValue: true },
      sessionId,
    );
    result = reply.result?.value;
    for (const entry of result?.cases?.slice(delivered) ?? [])
      console.log(
        `${entry.passed ? "PASS" : "FAIL"} ${entry.name}${entry.error ? ": " + entry.error : ""}`,
      );
    delivered = result?.cases?.length ?? delivered;
    if (!result?.done) await new Promise((done) => setTimeout(done, 100));
  }
  await mkdir(join(root, "test-results"), { recursive: true });
  result.validationErrors.push(...new Set(browserErrors));
  if (process.platform === "win32" && result.hardware) {
    try {
      const { stdout } = await promisify(execFile)(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          "Get-CimInstance Win32_VideoController | Select-Object Name,DriverVersion | ConvertTo-Json -Compress",
        ],
        { windowsHide: true, timeout: 10000 },
      );
      const entries = [JSON.parse(stdout)]
        .flat()
        .filter((h) =>
          h.Name.toLowerCase().includes(result.hardware.toLowerCase()),
        );
      if (entries.length === 1) {
        result.hardware = entries[0].Name;
        if (result.capsuleBenchmark)
          Object.assign(result.capsuleBenchmark, {
            hardware: entries[0].Name,
            driver: entries[0].DriverVersion,
            identification:
              "Current Windows GPU name uniquely matched to WebGPU adapter vendor",
          });
      }
    } catch {}
  }
  if (result.capsuleBenchmark)
    await writeFile(
      join(root, "test-results/capsule-performance.json"),
      JSON.stringify(result.capsuleBenchmark, null, 2) + "\n",
    );
  await writeFile(
    join(
      root,
      process.env.AVBD_GPU_FILTER
        ? "test-results/gpu-selected.json"
        : "test-results/gpu.json",
    ),
    JSON.stringify(result, null, 2) + "\n",
  );
  for (const error of result.validationErrors)
    console.error("GPU VALIDATION ERROR: " + error);
  console.log(`GPU tests: ${result.passed} passed, ${result.failed} failed`);
  if (result.failed || result.validationErrors.length || !result.cases.length)
    process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  try {
    await command("Browser.close");
  } catch {}
  browser.kill();
  server.close();
  // Remove only the isolated profile created by this run after the browser exits.
  if (browser.exitCode === null)
    await new Promise((done) => browser.once("exit", done));
  const cleanupPath = resolve(profile);
  if (
    !cleanupPath.startsWith(resolve(tmpdir()) + sep) ||
    !basename(cleanupPath).startsWith("avbd-gpu-tests-")
  ) {
    throw new Error(
      "Refusing to remove a browser profile outside the test temporary directory.",
    );
  }
  await rm(cleanupPath, {
    recursive: true,
    force: true,
    maxRetries: 6,
    retryDelay: 200,
  }).catch(() => {});
}
