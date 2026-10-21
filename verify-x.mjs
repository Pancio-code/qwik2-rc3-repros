// Cross-check of PR #9258 / #9259 scenarios in a real browser. `DEV=1` for vite --mode ssr.
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
const PORT = 4323, BASE = `http://127.0.0.1:${PORT}`;
const mode = process.env.DEV ? ["--mode", "ssr"] : ["preview"];
const server = spawn("node", ["node_modules/vite/bin/vite.js", ...mode, "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
const browser = await chromium.launch();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (p, s) => p.textContent(s, { timeout: 1000 }).then((t) => t?.trim(), () => "(missing)");
async function run(name, path, steps, read, expected) {
  const p = await browser.newPage(); const log = [];
  p.on("console", (m) => m.type() === "error" && log.push(m.text().replace(/%c|background:[^;]*;|color:[^;]*;|padding:[^;]*;|border-radius:[^;]*;|font-size:[^;]*;/g, "").trim().split("\n")[0].slice(0, 140)));
  p.on("pageerror", (e) => log.push(`pageerror: ${e.message.slice(0, 140)}`));
  const ok = await p.goto(BASE + path, { waitUntil: "networkidle", timeout: 10000 }).then(() => true, () => false);
  if (!ok) { console.log(`${name.padEnd(28)} LOAD TIMEOUT`); await p.close(); return; }
  const got = {};
  for (const s of steps) { await p.evaluate(() => document.querySelector("vite-error-overlay")?.remove()); if (typeof s === "number") await sleep(s); else await p.click(s, { timeout: 3000 }).catch(() => log.push(`click ${s} failed`)); }
  for (const [k, sel] of Object.entries(read)) got[k] = await text(p, sel);
  const pass = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`${name.padEnd(28)} ${pass ? "PASS" : "FAIL"} ${JSON.stringify(got)}${pass ? "" : " expected " + JSON.stringify(expected)}${log.length ? "\n    " + [...new Set(log)].join("\n    ") : ""}`);
  await p.close();
}
await run("x1 computed late (#9259)", "/x1/", ["#inc", 200], { b: "#inc", late: "#late" }, { b: "2", late: "slow 4" });
await run("x2 computed late (#9258)", "/x2/", ["#inc", 200], { c: "#late-computed" }, { c: "2" });
await run("x2 task track() late", "/x2/", ["#inc", 200], { t: "#late-task" }, { t: "1" });
await run("x3 shared async, child", "/x3/", ["#inc", 150, "#inc", 200], { b: "#inc", c: "#count" }, { b: "2", c: "2" });
await run("x3i shared async, inline", "/x3i/", ["#inc", 150, "#inc", 200], { b: "#inc", c: "#count" }, { b: "2", c: "2" });
await run("x4 .pending late (during)", "/x4/", ["#inc", 300], { s: "#status" }, { s: "true" });
await run("x4 .pending late (after)", "/x4/", ["#inc", 2200], { s: "#status" }, { s: "false" });
await run("x5 object identity", "/x5/", ["#select", 150, "#confirm", 150], { m: "#msg" }, { m: "confirmed (1)" });
await run("x6 async computed late", "/x6/", ["#inc", 400], { late: "#late" }, { late: "6" });
await browser.close(); server.kill("SIGKILL");
