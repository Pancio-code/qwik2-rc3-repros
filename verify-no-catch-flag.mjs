// Builds this app WITHOUT the "catchBoundary" experimental flag, serves it and requests /nf/, a page
// that uses <Catch> (nothing throws). Restores vite.config.ts afterwards.
import { execSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const original = readFileSync("vite.config.ts", "utf8");
const PORT = 4322;
try {
  writeFileSync("vite.config.ts", original.replace('"catchBoundary", ', ""));
  const out = execSync("npm run build.client 2>&1 && npm run build.preview 2>&1", { encoding: "utf8" });
  const warnings = out.split("\n").filter((l) => /catch|experimental/i.test(l));
  console.log(`build warnings about Catch/experimental: ${warnings.length ? warnings.join(" | ") : "none"}`);
  const server = spawn("node", ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
  const serverLog = [];
  server.stdout.on("data", (d) => serverLog.push(String(d)));
  server.stderr.on("data", (d) => serverLog.push(String(d)));
  for (let i = 0; i < 50; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await new Promise((r) => setTimeout(r, 200)); }
  }
  const n = serverLog.length;
  const r = await fetch(`http://127.0.0.1:${PORT}/nf/`);
  const html = await r.text();
  await new Promise((r) => setTimeout(r, 500));
  console.log(`GET /nf/ -> HTTP ${r.status}; body says "500 Internal Server Error": ${html.includes("500 Internal Server Error")}; page content rendered: ${html.includes('id="fine"')}`);
  console.log(`server log lines during the request: ${serverLog.slice(n).join("").trim() || "none"}`);
  server.kill();
} finally {
  writeFileSync("vite.config.ts", original);
  execSync("npm run build.client && npm run build.preview", { stdio: "ignore" });
}
process.exit(0);
