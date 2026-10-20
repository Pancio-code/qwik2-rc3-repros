// Runs the reproductions Q24, Q24b, Q24c, Q24e and Q24f and prints what happens.
// Production build by default (`npm run build.client && npm run build.preview` first);
// `DEV=1 node verify3.mjs` runs them against `vite --mode ssr` instead (Q24c and Q24e only fail there).
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const PORT = 4322;
const BASE = `http://127.0.0.1:${PORT}`;
const mode = process.env.DEV ? ["--mode", "ssr"] : ["preview"];
// `node …/vite.js` and not `npx vite`: `server.kill()` must stop vite itself, not only npx.
const server = spawn("node", ["node_modules/vite/bin/vite.js", ...mode, "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore",
});
for (let i = 0; i < 100; i++) {
  try {
    await fetch(BASE);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}

const browser = await chromium.launch();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(path) {
  const p = await browser.newPage();
  const log = [];
  p.on("console", (m) => m.type() === "error" && log.push(`${m.type()}: ${m.text().split("\n")[0].slice(0, 160)}`));
  p.on("pageerror", (e) => log.push(`pageerror: ${e.message.slice(0, 160)}`));
  const loaded = await p
    .goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  return { p, log, loaded };
}

// In dev, vite's error overlay would cover the buttons after the first error.
const click = async (p, sel) => {
  await p.evaluate(() => document.querySelector("vite-error-overlay")?.remove());
  await p.click(sel, { timeout: 3000 }).catch(() => {});
};
const text = (p, sel) => p.textContent(sel, { timeout: 1000 }).then((t) => t?.trim(), () => "(missing)");

// Q24
{
  const html = await (await fetch(`${BASE}/q24/`)).text();
  const stateRoots = JSON.parse(html.match(/<script type="qwik\/state" q:instance="[^"]*">(.*?)<\/script>/s)[1]).length / 2;
  const patchStart = JSON.parse(html.match(/<script type="qwik\/state"[^>]*q:patch[^>]*>(.*?)<\/script>/s)[1])[0];
  const earlyVNode = html.match(/<script type="qwik\/vnode" q:r="2">(.*?)<\/script>/s)?.[1] ?? "";
  const pastEnd = [...earlyVNode.matchAll(/[<>[\]^=](\d+)/g)].map((m) => +m[1]).filter((id) => id >= stateRoots);
  console.log("Q24 HTML", JSON.stringify({ stateRoots, patchStart, earlySegmentRefsPastStateEnd: pastEnd }));
  const { p, log } = await page("/q24/");
  await click(p, "#slow");
  await sleep(300);
  await click(p, "#slow");
  await sleep(300);
  console.log("Q24 after two clicks:", JSON.stringify(await text(p, "#slow")), "(expected \"slow 2\")");
  console.log("  " + (log.join("\n  ") || "no errors"));
  await p.close();
}

// Q24b: two boundaries share an async signal; B subscribes late to a signal of the shell
for (const path of ["/q24b/", "/q24b/inline/"]) {
  const { p, log } = await page(path);
  await click(p, "#inc");
  await sleep(300);
  await click(p, "#inc");
  await sleep(300);
  console.log(
    `Q24b ${path} after two clicks:`,
    JSON.stringify({ button: await text(p, "#inc"), count: await text(p, "#count") }),
    '(expected {"button":"2","count":"2"})',
  );
  console.log("  " + (log.join("\n  ") || "no errors"));
  await p.close();
}

// Q24c: `.pending` of an outer signal read inside an out-of-order segment (dev only)
{
  const { p, log, loaded } = await page("/q24c/");
  if (!loaded) {
    console.log("Q24c: the document never finished loading (10 s)", JSON.stringify({ outer: await text(p, "#outer") }));
  } else {
    await click(p, "#child");
    await sleep(300);
    console.log("Q24c after a click:", JSON.stringify(await text(p, "#child")), '(expected "slow data 1")');
  }
  console.log("  " + (log.join("\n  ") || "no errors"));
  await p.close();
}

// Q24e: a component throws during SSR, no <Catch> (dev only)
{
  const started = Date.now();
  const r = await fetch(`${BASE}/q24e/`, { signal: AbortSignal.timeout(8000) })
    .then(async (res) => ({ status: res.status, body: await res.text() }))
    .catch((e) => ({ error: e.name }));
  console.log(
    "Q24e",
    r.error
      ? `the response never finished (${r.error} after ${Date.now() - started} ms)`
      : JSON.stringify({ status: r.status, inline500: r.body.includes("500 Internal Server Error") }),
  );
}

// Q24f: a computed signal first read inside a late out-of-order segment
{
  const { p, log } = await page("/q24f/");
  await click(p, "#inc");
  await sleep(300);
  await click(p, "#inc");
  await sleep(300);
  console.log(
    "Q24f after two clicks:",
    JSON.stringify({ button: await text(p, "#inc"), late: await text(p, "#late") }),
    '(expected {"button":"3","late":"slow 6"})',
  );
  console.log("  " + (log.join("\n  ") || "no errors"));
  await p.close();
}

await browser.close();
// SIGKILL: in dev the server waits forever for the hanging Q24c response.
server.kill("SIGKILL");
