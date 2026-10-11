import "./prepare-webgl.mjs";
import { build, context } from "esbuild";
import { fileURLToPath } from "node:url";
import { createServer, request } from "node:http";
import { mkdir, writeFile, rename, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import web from "../tinybuild.web.config.js";
import { sourceMapsEnabled, removeStaleSourceMap } from "./source-maps.mjs";
// Resolve entries and outputs from this checkout, including direct script calls
// made from another working directory.
process.chdir(fileURLToPath(new URL("../", import.meta.url)));
const options = {
  entryPoints: web.bundler.entryPoints,
  bundle: true,
  outfile: web.bundler.outfile,
  loader: { ".wgsl": "text" },
  sourcemap: sourceMapsEnabled,
  minify: true,
  write: false,
  plugins: [
    {
      name: "atomic-web-output",
      setup(builder) {
        builder.onEnd(async (result) => {
          if (result.errors.length) return;
          for (const file of result.outputFiles ?? []) {
            const temporary = `${file.path}.${process.pid}.tmp`;
            await mkdir(dirname(file.path), { recursive: true });
            try {
              await writeFile(temporary, file.contents);
              for (let attempt = 0; ; attempt++) {
                try {
                  await rename(temporary, file.path);
                  break;
                } catch (error) {
                  // Windows scanners and readers can briefly hold the output.
                  // Keep the old complete bundle until an atomic replace succeeds.
                  if (
                    process.platform !== "win32" ||
                    !["EPERM", "EBUSY", "EACCES"].includes(error.code) ||
                    attempt >= 5
                  )
                    throw error;
                  await delay(50 * 2 ** attempt);
                }
              }
            } finally {
              await unlink(temporary).catch((error) => {
                if (error.code !== "ENOENT") throw error;
              });
            }
          }
        });
      },
    },
  ],
};
const bundles = [
  options,
  ...web.additionalBundles.map((bundle) => ({ ...options, ...bundle })),
];
await Promise.all(
  bundles.map((bundle) => removeStaleSourceMap(bundle.outfile)),
);
if (process.argv.includes("--serve")) {
  const contexts = await Promise.all(bundles.map((bundle) => context(bundle)));
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  const server = await contexts[0].serve({
    servedir: ".",
    host: web.server.host,
    port: 0,
  });
  // esbuild owns rebuilds; the local front server supplies isolation headers.
  const front = createServer((incoming, outgoing) => {
    const proxy = request(
      {
        host: web.server.host,
        port: server.port,
        path: incoming.url,
        method: incoming.method,
        headers: incoming.headers,
      },
      (response) => {
        outgoing.writeHead(response.statusCode, {
          ...response.headers,
          ...web.server.headers,
        });
        response.pipe(outgoing);
      },
    );
    proxy.on("error", (error) => {
      if (!outgoing.headersSent) outgoing.writeHead(502);
      outgoing.end(error.message);
    });
    incoming.pipe(proxy);
  });
  await new Promise((resolve, reject) => {
    front.once("error", reject);
    front.listen(web.server.port, web.server.host, resolve);
  });
  console.log(`Simulation: http://127.0.0.1:${web.server.port}`);
} else {
  await Promise.all(bundles.map((bundle) => build(bundle)));
}
