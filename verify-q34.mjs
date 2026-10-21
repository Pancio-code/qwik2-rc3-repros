// Q34: plain functions reached from an out-of-order segment. `DEV=1` for vite --mode ssr, `OOS=0` in-order.
// For each route: HTTP status, whether the 500 page got appended, whether a qwik/state script exists,
// the late content, whether the column marker is in the state, and the state after a click on #inc.
import { spawn, execSync } from "node:child_process";
import { chromium } from "@playwright/test";
const PORT = 4334, BASE = `http://127.0.0.1:${PORT}`;
if (execSync("ss -ltnH").toString().includes(`:${PORT} `)) throw new Error(`port ${PORT} already in use`);
const mode = process.env.DEV ? ["--mode", "ssr"] : ["preview"];
const server = spawn("node", ["node_modules/vite/bin/vite.js", ...mode, "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
let out = "";
server.stdout.on("data", (d) => (out += d));
server.stderr.on("data", (d) => (out += d));
for (let i = 0; i < 100; i++) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
const browser = await chromium.launch();
console.log(`${process.env.DEV ? "dev" : "build"}, out-of-order ${process.env.OOS === "0" ? "off" : "on"}`);
for (const path of (process.argv[2] ?? "/q34/,/q34-in-order/,/q34-no-fn/,/q34-props/").split(",")) {
  out = "";
  let status = "?", html = "";
  try {
    const res = await fetch(BASE + path);
    status = res.status;
    html = await res.text();
  } catch {
    status += " (stream cut)";
  }
  const state = [...html.matchAll(/<script[^>]*qwik\/state[^>]*>([^<]*)<\/script>/g)].map((m) => m[1]).join("");
  const p = await browser.newPage(); const log = [];
  p.on("console", (m) => m.type() === "error" && log.push(m.text().replace(/%c/g, "").split("\n")[0].slice(0, 120)));
  p.on("pageerror", (e) => log.push(`pageerror: ${e.message.slice(0, 120)}`));
  await p.goto(BASE + path, { waitUntil: "networkidle", timeout: 10000 }).catch(() => log.push("load timeout"));
  const late = await p.textContent("#late", { timeout: 1000 }).then((t) => t?.trim(), () => "(missing)");
  await p.click("#inc", { timeout: 1000 }).catch(() => {});
  await p.waitForTimeout(300);
  const q34 = out.match(/(Cannot serialize function: |QWIK ERROR Code\(Q34\)\S* )[^\n]{0,60}/)?.[0];
  console.log(
    `${path.padEnd(14)} HTTP ${status}${html.includes("500 Internal Server Error") ? ", 500 page appended" : ""}, ` +
      `${state ? "state" : "NO state"}, #late=${JSON.stringify(late)}` +
      `${state.includes("COLUMN-LABEL-MARKER") ? ", column object in state" : ""}` +
      `${q34 ? `\n    server: ${q34}` : ""}${log.length ? "\n    browser: " + [...new Set(log)].join("\n             ") : ""}`,
  );
  await p.close();
}
await browser.close(); server.kill("SIGKILL");
