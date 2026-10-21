// E: an error caught by <Catch> during SSR. Prints status, Cache-Control, the fallback and server output.
// `DEV=1` vite --mode ssr, `OOS=0` in-order, `E_LOG=1` onError$ logs, `E_APP=1` 500 from onError$,
// `E_STATUS=1` 500 from onBeforeFirstFlush, `E_CHUNK=n` maximumInitialChunk, `E_INORDER=disabled`.
import { spawn, execSync } from "node:child_process";
const PORT = 4335, BASE = `http://127.0.0.1:${PORT}`;
if (execSync("ss -ltnH").toString().includes(`:${PORT} `)) throw new Error(`port ${PORT} already in use`);
const mode = process.env.DEV ? ["--mode", "ssr"] : ["preview"];
const server = spawn("node", ["node_modules/vite/bin/vite.js", ...mode, "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
let out = "";
server.stdout.on("data", (d) => (out += d));
server.stderr.on("data", (d) => (out += d));
for (let i = 0; i < 100; i++) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
const flags = ["OOS", "E_LOG", "E_APP", "E_STATUS", "E_CHUNK", "E_INORDER"].filter((k) => process.env[k]).map((k) => `${k}=${process.env[k]}`).join(" ");
console.log(`${process.env.DEV ? "dev" : "build"} ${flags}`);
for (const path of (process.argv[2] ?? "/e/,/e-late/").split(",")) {
  out = "";
  const res = await fetch(BASE + path);
  const html = await res.text();
  await new Promise((r) => setTimeout(r, 300));
  const fb = html.match(/id="fallback"[^>]*>(.*?)<\/p>/)?.[1]?.replace(/<!--[^>]*-->/g, "") ?? "(no fallback)";
  const logged = out.split("\n").filter((l) => /E-MARKER|onError|\[E\]|Catch/.test(l)).map((l) => l.slice(0, 150));
  console.log(`${path.padEnd(8)} HTTP ${res.status}, cache-control=${res.headers.get("cache-control")}, fallback=${JSON.stringify(fb)}\n    server: ${logged.length ? logged.join("\n            ") : "(nothing)"}`);
}
server.kill("SIGKILL");
