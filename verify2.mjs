// Second batch of reproductions (I, L, P, C, A, CSS, K, B) against the production build (`npm run build.client &&
// npm run build.preview` first). Starts `vite preview` itself.
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const PORT = 4321;
const BASE = `http://127.0.0.1:${PORT}`;
const serverLog = [];
const server = spawn("node", ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (d) => serverLog.push(...String(d).split("\n").filter(Boolean)));
server.stderr.on("data", (d) => serverLog.push(...String(d).split("\n").filter(Boolean)));
for (let i = 0; i < 50; i++) {
  try {
    await fetch(BASE);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}
const logsSince = (n, re) => serverLog.slice(n).filter((l) => re.test(l));
const browser = await chromium.launch();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function page() {
  const p = await browser.newPage();
  const log = [];
  p.on("console", (m) => log.push(`${m.type()}: ${m.text().split("\n")[0].slice(0, 160)}`));
  p.on("pageerror", (e) => log.push(`pageerror: ${e.message.slice(0, 160)}`));
  return { p, log };
}
const only = process.argv[2];
const run = (k) => !only || only.split(",").includes(k);

if (run("I")) {
  const n = serverLog.length;
  const t0 = Date.now();
  const r = await fetch(`${BASE}/i/`);
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let html = "";
  let fastAt = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    html += dec.decode(value, { stream: true });
    if (fastAt === null && html.includes('id="fast"')) fastAt = Date.now() - t0;
  }
  console.log(`I "fast" (100 ms loader) reached the browser after ${fastAt} ms, whole page after ${Date.now() - t0} ms`);
  console.log("  " + logsSince(n, /\[i\]/).join("\n  "));
}

if (run("L")) {
  const { p, log } = await page();
  await p.goto(`${BASE}/l/from/`, { waitUntil: "networkidle" });
  await p.click("#go-list");
  await sleep(2000);
  const r = await p.evaluate(() => ({ url: location.pathname + location.search, items: document.querySelector("#items")?.textContent ?? null }));
  console.log("L after the click:", JSON.stringify(r));
  console.log("  " + log.filter((l) => /List render|ERROR|pageerror/.test(l)).join("\n  "));
  await p.close();
}

if (run("P")) {
  const { p } = await page();
  let posts = 0;
  p.on("request", (r) => r.method() === "POST" && posts++);
  await p.goto(`${BASE}/p/`, { waitUntil: "networkidle" });
  await p.click("#go");
  const samples = [];
  for (const at of [300, 700, 1100]) {
    await sleep(at - (samples.at(-1)?.at ?? 0));
    samples.push({
      at,
      ...(await p.evaluate(() => ({
        path: location.pathname,
        disabled: document.querySelector("#go")?.hasAttribute("disabled") ?? null,
        isRunning: document.querySelector("#running")?.textContent ?? null,
      }))),
    });
  }
  // A second click while the next page is still loading.
  const clicked = await p.evaluate(() => {
    const b = document.querySelector("#go");
    if (!b || b.disabled) return false;
    b.click();
    return true;
  });
  await sleep(2500);
  console.log("P samples after the click:", JSON.stringify(samples));
  console.log(`P second click went through: ${clicked}, POSTs sent: ${posts}, final path ${await p.evaluate(() => location.pathname)}`);
  await p.close();
}

if (run("C")) {
  for (const [id, label] of [["#go-page", "stateful wrapper inside Pending"], ["#go-section", "Pending inside a component$, reader through its Slot"]]) {
    const { p } = await page();
    await p.goto(`${BASE}/c/`, { waitUntil: "networkidle" });
    await p.click(id);
    const seen = [];
    for (let i = 0; i < 16; i++) {
      await sleep(200);
      seen.push(await p.evaluate(() => (!document.querySelector("#title") ? "old-page" : document.querySelector("#data") ? "data" : document.querySelector("#fallback") ? "fallback" : "page")));
    }
    console.log(`C (${label}), every 200 ms after the click: ${seen.join(" ")}`);
    await p.close();
  }
}

if (run("A")) {
  for (const [id, how] of [["#submit", "action that redirects"], ["#link", "<Link>"]]) {
    const { p, log } = await page();
    await p.goto(`${BASE}/a/`, { waitUntil: "networkidle" });
    await p.click(id);
    await sleep(2500);
    const r = await p.evaluate(() => ({ path: location.pathname, title: document.querySelector("#title")?.textContent ?? null, bodyText: document.body.innerText.trim().slice(0, 60) }));
    console.log(`A via ${how} to /a/target/ (onGet-only, redirects to /a/final/):`, JSON.stringify(r));
    if (log.length) console.log("  " + log.join("\n  "));
    await p.close();
  }
}

if (run("CSS")) {
  const { p, log } = await page();
  const failed = [];
  p.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${new URL(r.url()).pathname}`));
  await p.goto(`${BASE}/css/`, { waitUntil: "networkidle" });
  await sleep(1500);
  const r = await p.evaluate(() => ({ state: document.querySelector("#state")?.textContent, color: getComputedStyle(document.querySelector("#title")).color }));
  console.log("CSS dynamic import():", JSON.stringify(r), "failed requests:", failed.join(", "));
  await p.close();
}

if (run("K")) {
  const { p, log } = await page();
  const loaders = [];
  p.on("response", async (r) => r.url().includes("q-loader") && loaders.push(`${r.status()} ${new URL(r.url()).pathname} ${(await r.text().catch(() => "")).slice(0, 40)}`));
  await p.goto(`${BASE}/k/`, { waitUntil: "networkidle" });
  await p.click("#go-page");
  await sleep(2500);
  const r = await p.evaluate(() => ({ path: location.pathname, title: document.querySelector("#title")?.textContent ?? null, user: document.querySelector("#user")?.textContent ?? null }));
  console.log("K client navigation /k/ -> /k/area/page/:", JSON.stringify(r));
  console.log("  q-loader: " + loaders.join(", "));
  console.log("  " + log.filter((l) => /pageerror/.test(l)).join("\n  "));
  const d = await fetch(`${BASE}/k/area/page/`);
  console.log(`K document GET /k/area/page/: ${d.status}, group user rendered: ${(await d.text()).includes('id="user"')}`);
}

if (run("B")) {
  for (const waitMs of [0, 300]) {
    let wrong = 0;
    let trace = "";
    for (let i = 0; i < 20; i++) {
      const { p } = await page();
      await p.addInitScript(() => {
        window.__trace = [];
        const rec = (what) => window.__trace.push(`${what} ${location.pathname}${location.search}`);
        const push = history.pushState.bind(history);
        const repl = history.replaceState.bind(history);
        history.pushState = (...a) => (push(...a), rec("pushState"));
        history.replaceState = (...a) => (repl(...a), rec("replaceState"));
        addEventListener("popstate", () => rec("popstate"));
      });
      await p.goto(`${BASE}/bf/`, { waitUntil: "networkidle" });
      await p.fill("#q", "Bianchi");
      await p.click("#filter");
      await p.waitForURL(/q=Bianchi/);
      if (waitMs) await sleep(waitMs);
      await p.evaluate(() => window.__trace.push("--- Back"));
      await p.goBack();
      await sleep(1500);
      const r = await p.evaluate(() => ({ url: location.pathname + location.search, field: document.querySelector("#q").value, trace: window.__trace }));
      if (r.url !== "/bf/" || r.field !== "") {
        wrong++;
        if (!trace) trace = r.trace.slice(-5).join(" | ");
      }
      await p.close();
    }
    console.log(`B Back ${waitMs} ms after the filter URL changed: wrong state ${wrong}/20${trace ? `\n  last history calls: ${trace}` : ""}`);
  }
}

await browser.close();
server.kill();
process.exit(0);
