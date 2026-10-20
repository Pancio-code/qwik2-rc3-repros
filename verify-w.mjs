// W: three links clicked 60 ms apart (B and C have a slow loader read while rendering).
// `node verify-w.mjs [rounds]` runs on the installed Qwik; `node verify-w.mjs [rounds] --with-g-v1` first
// applies g-v1.patch (the invalidate-and-recompute fix first proposed for #9237), rebuilds, runs, then
// removes the patch again. Starts `vite preview` itself.
import { execSync, spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const PORT = 4322;
const BASE = `http://127.0.0.1:${PORT}`;
const ROUNDS = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 30);
const withV1 = process.argv.includes("--with-g-v1");
const sh = (cmd) => execSync(cmd, { stdio: "inherit" });
if (withV1) sh("git apply g-v1.patch");
try {
  sh("npm run -s build.client > /dev/null && npm run -s build.preview > /dev/null");
} finally {
  if (withV1) sh("git apply -R g-v1.patch");
}
const server = spawn("node", ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
for (let i = 0; i < 50; i++) {
  try {
    await fetch(BASE);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}
const browser = await chromium.launch();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let stuck = 0;
const examples = [];
for (let i = 0; i < ROUNDS; i++) {
  const p = await browser.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message.slice(0, 120)));
  await p.goto(`${BASE}/w/`, { waitUntil: "networkidle" });
  await p.click("#go-b", { noWaitAfter: true });
  await sleep(60);
  await p.click("#go-c", { noWaitAfter: true });
  await sleep(60);
  await p.click("#go-d", { noWaitAfter: true });
  await sleep(3000);
  const r = await p.evaluate(() => ({ path: location.pathname, h1: document.querySelector("h1")?.textContent, nav: document.querySelector("#nav")?.textContent }));
  if (r.nav !== "idle" || r.h1 !== "D") {
    stuck++;
    if (examples.length < 3) examples.push({ ...r, errors });
  }
  await p.close();
}
console.log(`W${withV1 ? " (with g-v1.patch)" : ""} stuck ${stuck}/${ROUNDS}`, JSON.stringify(examples));
await browser.close();
server.kill();
