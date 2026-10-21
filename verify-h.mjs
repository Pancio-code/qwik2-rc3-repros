// /h/: head script/style content duplicated as an attribute. /lp/: aria-pressed on <Link> during navigation (+ axe).
// Build first (`npm run build.client && npm run build.preview`); `DEV=1` runs against `vite --mode ssr`.
// Needs `npm i -D @axe-core/playwright` for the axe line.
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
const PORT = 4324, BASE = `http://127.0.0.1:${PORT}`;
const mode = process.env.DEV ? ["--mode", "ssr"] : ["preview"];
const server = spawn("node", ["node_modules/vite/bin/vite.js", ...mode, "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
try {
  for (let i = 0; i < 100; i++) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 200)); } }
  const html = await (await fetch(`${BASE}/h/`)).text();
  const ld = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>/)?.[0] ?? "(no ld+json script)";
  const st = html.match(/<style[^>]*probe[^>]*>/)?.[0] ?? "(no style tag found)";
  console.log("H script tag:", ld.slice(0, 200));
  console.log("H style tag: ", st.slice(0, 200));
  console.log("H content duplicated as attribute:", JSON.stringify({ script: / script="/.test(ld), style: / style="/.test(st) }));

  const browser = await chromium.launch();
  const p = await (await browser.newContext()).newPage();
  await p.goto(`${BASE}/lp/`, { waitUntil: "networkidle" });
  await p.click("#go");
  await p.waitForTimeout(300);
  const during = await p.evaluate(() => document.querySelector("#go")?.getAttribute("aria-pressed") ?? null);
  let axe = "(axe not installed)";
  try {
    const { default: AxeBuilder } = await import("@axe-core/playwright");
    const r = await new AxeBuilder({ page: p }).include("nav").withRules(["aria-allowed-attr"]).analyze();
    axe = JSON.stringify(r.violations.map((v) => ({ id: v.id, impact: v.impact, msg: v.nodes[0]?.failureSummary?.split("\n")[1]?.trim() })));
  } catch (e) { axe = `(axe failed: ${e.message.slice(0, 80)})`; }
  await p.waitForSelector("#slow", { timeout: 5000 }).catch(() => {});
  console.log("LP aria-pressed 300 ms after the click:", JSON.stringify(during));
  console.log("LP axe aria-allowed-attr during navigation:", axe);
  await browser.close();
} finally {
  server.kill("SIGKILL");
}
