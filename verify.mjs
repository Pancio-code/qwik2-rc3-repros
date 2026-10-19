// Runs every reproduction against the production build (`npm run build.client && npm run
// build.preview` first) and prints what happens. Starts `vite preview` itself.
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const PORT = 4320;
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore",
});
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

async function page() {
  const p = await browser.newPage();
  const log = [];
  p.on("console", (m) => log.push(`${m.type()}: ${m.text().split("\n")[0].slice(0, 160)}`));
  p.on("pageerror", (e) => log.push(`pageerror: ${e.message.slice(0, 160)}`));
  return { p, log };
}

// D
{
  const { p, log } = await page();
  await p.goto(`${BASE}/d/`, { waitUntil: "networkidle" });
  const r = await p.evaluate(() => ({
    templateInsideSvg: !!document.querySelector("svg template, svg [q\\:r]"),
    fallbackVisible: !!document.querySelector("#fallback"),
  }));
  console.log("D", JSON.stringify(r));
  console.log("  " + log.join("\n  "));
  await p.close();
}

// G
for (const delay of [100, 300, 600]) {
  const { p, log } = await page();
  await p.goto(`${BASE}/g/`, { waitUntil: "networkidle" });
  await p.click("#go-b");
  await p.waitForSelector("h1:text('B')");
  await sleep(delay);
  await p.click("#go-c");
  await sleep(2500);
  const r = await p.evaluate(() => ({ path: location.pathname, h1: document.querySelector("h1")?.textContent }));
  console.log(`G click C ${delay} ms after B:`, JSON.stringify(r));
  console.log("  " + log.filter((l) => /Data render|ERROR|pageerror/.test(l)).join("\n  "));
  await p.close();
}

// S1: failed network, and a non-JSON 502
for (const kind of ["abort", "502 html"]) {
  const { p } = await page();
  await p.goto(`${BASE}/s/`, { waitUntil: "networkidle" });
  await p.route("**/*qaction=*", (route) =>
    kind === "abort"
      ? route.abort("internetdisconnected")
      : route.fulfill({ status: 502, contentType: "text/html", body: "<h1>Bad gateway</h1>" }),
  );
  await p.click("#submit");
  await sleep(3000);
  const r = await p.evaluate(() => ({
    outcome: document.querySelector("#outcome")?.textContent,
    isRunning: document.querySelector("#running")?.textContent,
  }));
  console.log(`S1 (${kind}), 3 s after the click:`, JSON.stringify(r));
  await p.close();
}

// S2: double click on a cold page (handlers not loaded yet)
{
  const { p } = await page();
  let posts = 0;
  p.on("request", (r) => r.method() === "POST" && r.url().includes("qaction") && posts++);
  await p.goto(`${BASE}/s/`, { waitUntil: "networkidle" });
  await p.dblclick("#double");
  await sleep(1500);
  console.log("S2 double click, POSTs sent:", posts);
  await p.close();
}

// S3: array onSubmit$, two submissions one after the other
{
  const { p, log } = await page();
  let posts = 0;
  p.on("request", (r) => r.method() === "POST" && r.url().includes("qaction") && posts++);
  await p.goto(`${BASE}/s/`, { waitUntil: "networkidle" });
  await p.click("#array");
  await sleep(1500);
  await p.click("#array");
  await sleep(1500);
  const ran = log.filter((l) => l.includes("onSubmit$ ran")).length;
  console.log("S3 two separate submissions, POSTs sent:", posts, "onSubmit$ ran:", ran);
  await p.close();
}

await browser.close();
server.kill();
