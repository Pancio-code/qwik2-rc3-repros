# Qwik 2.0.0-rc.3 reproductions

Minimal reproductions of bugs found while moving a production app to Qwik 2.0.0-rc.3.
Plain `create-qwik@2.0.0-rc.3 empty` starter; the only change to the config is
`qwikVite({ experimental: ["catchBoundary", "pendingBoundary", "blockSSR"] })`.

```bash
npm install
npm run build.client && npm run build.preview
npx vite preview          # then open the pages below
npm run verify            # or: run every case headless with Playwright and print the result
                          # (verify.mjs: D, G, S; verify2.mjs: I, L, P, C, A, CSS, K, B)
npm run verify:no-catch-flag      # builds without the catchBoundary flag and requests /nf/
npm run verify:optimizer-export   # createOptimizer: declared in the types, missing at runtime
node verify3.mjs                  # out-of-order streaming: Q24, Q24b, Q24c, Q24e, Q24f against the build
DEV=1 node verify3.mjs            # the same against `vite --mode ssr` (Q24c and Q24e only fail there)
node verify-x.mjs                 # late out-of-order segments, scenarios from QwikDev/qwik#9258 (DEV=1 for dev)
node verify-h.mjs                 # /h/ head tags and /lp/ <Link> aria-pressed (npm i -D @axe-core/playwright for axe)
node verify-q34.mjs               # Q34 in a late out-of-order segment (OOS=0: in-order streaming, DEV=1: dev server)
node verify-e.mjs                 # <Catch> during SSR: Cache-Control and onBeforeFirstFlush (flags below)
```

| Route | Bug | What you see |
|---|---|---|
| [`/d/`](src/routes/d/index.tsx) | an out-of-order `<Pending>` segment is written inside an open `<svg>` | `TypeError: Failed to execute 'insertBefore' on 'Node'`, the fallback stays forever |
| [`/g/`](src/routes/g) | navigating away while a `blockSSR: false` loader loads | the old page re-renders with `.value` = `Symbol(…invalid)` and throws |
| [`/s/`](src/routes/s/index.tsx) | router actions | 1. `submit()` never settles when the request fails (offline or a non-JSON 502), `isRunning` stays `true`; 2. a double click on a `<Form>` button disabled by `isRunning` sends two POSTs; 3. a `<Form>` with an array `onSubmit$` posts only the first time |
| [`/i/`](src/routes/i/index.tsx) | the first SSR waits for every `blockSSR: false` loader, even one no component reads | the 100 ms loader's content reaches the browser after ~1.5 s, when the unread 1.5 s loader ends |
| [`/l/from/`](src/routes/l) | a loader that throws `redirect()` during a client navigation | the page renders once with `.value` = `undefined` and throws |
| [`/p/`](src/routes/p) | an action that throws `redirect()` | `isRunning` is `false` and the button enabled while the redirected page (1.5 s loader) is still loading |
| [`/c/`](src/routes/c) | `<Pending>` inside a `component$`, the reading child projected through that component's `<Slot>` (QwikDev/qwik#8801) | on client navigation the old page stays until the data arrives; no fallback. A stateful wrapper inside `<Pending>` (`/c/page/`) works |
| [`/a/`](src/routes/a) | an action `redirect()` or a `<Link>` to a route that has only `onGet` (it redirects again, no component) | blank page at `/a/target/`; the redirect to `/a/final/` is never followed |
| [`/css/`](src/routes/css/index.tsx) | dynamic `import("./probe.css")` in a production build | the CSS is in the main stylesheet, but the import asks for a JS chunk that was never written: 404, the import rejects |
| [`/nf/`](src/routes/nf/index.tsx) + `npm run verify:no-catch-flag` | `<Catch>` used without `experimental: ["catchBoundary"]` | HTTP 200 with a "500 Internal Server Error" page, nothing in the server log, no build warning |
| `npm run verify:optimizer-export` | `createOptimizer` in `@qwik.dev/core/optimizer` | declared in `optimizer.d.ts`, not exported by `optimizer.mjs` |
| [`/k/`](src/routes/k) | a client navigation to `/k/area/page/`, inside the pathless group `(grp)`, while `/k/[x]/` exists | the group layout's loader is fetched at `/k/area/q-loader-….json`, which `/k/[x]/` matches: 404 "Loader not found", empty page. As a document it works |
| [`/bf/`](src/routes/bf/index.tsx) | Back pressed right after a same-page navigation (`nav("?q=…")`) changed the URL | the router finishes its navigation with `replaceState(?q=…)` on top of the entry Back returned to: URL, field and list stay filtered |
| [`/q24/`](src/routes/q24/index.tsx) | a `<Pending>` that resolves before the shell ends adds state roots after the container state is written | the slow boundary's button does nothing after resume; `processRootRef` errors while the client applies its state patch |
| [`/q24b/`](src/routes/q24b/index.tsx), [`/q24b/inline/`](src/routes/q24b/inline/index.tsx) | two `<Pending>` boundaries share an async signal; the second one subscribes late to a signal of the shell | `/q24b/`: `Cannot read properties of undefined (reading '0')` in `processRootRef` at the first click, the count never updates; `/q24b/inline/`: no error, the count never updates |
| [`/q24c/`](src/routes/q24c/index.tsx) (dev only) | `.pending` of an async signal read inside an out-of-order `<Pending>` | the dev server asserts "Do not use signals across containers" and the response never finishes |
| [`/q24e/`](src/routes/q24e/index.tsx) (dev only) | a component throws while rendering on the server, no `<Catch>` | the dev server never finishes the response and logs nothing (the build answers with an inline 500) |
| [`/q24f/`](src/routes/q24f/index.tsx) | a computed signal first read inside a late `<Pending>` | it never updates after resume, no error |
| [`/x1/`](src/routes/x1/index.tsx) … [`/x6/`](src/routes/x6/index.tsx) + `node verify-x.mjs` | a `<Pending>` segment that resolves after the root state was streamed reads shell state: computed (sync and async), two segments sharing an async signal, `.pending`, an object picked in the shell (scenarios from the tests of QwikDev/qwik#9258 and #9259) | on rc.3 and on `main` before #9258: no update after resume, `Cannot read properties of undefined (reading '0')`, `.pending` stays `false` (dev: the response never finishes), the object loses its identity. **Fixed by QwikDev/qwik#9258** |
| [`/h/`](src/routes/h/index.tsx), [`/h/old/`](src/routes/h/old/index.tsx) + `node verify-h.mjs` | a `head` script or style declared with its attributes on the object (the recommended form; `props` is deprecated) | `DocumentHeadTags` renders the content a second time as an attribute: `<script type="application/ld+json" script="…">`, `<style style="…">`. The deprecated `props` form (`/h/old/`) is fine |
| [`/lp/`](src/routes/lp/index.tsx) + `node verify-h.mjs` | a `<Link>` client navigation to a slow page | the link carries `aria-pressed="true"` until the navigation ends (axe `aria-allowed-attr`, critical: not allowed on a link); if the navigation fails (offline) it is never removed |
| [`/q34/`](src/routes/q34/index.tsx), [`/q34-in-order/`](src/routes/q34-in-order/index.tsx), [`/q34-no-fn/`](src/routes/q34-no-fn/index.tsx) + `node verify-q34.mjs` | an inline component inside a late `<Pending>` reads a field of a plain object (whose `render` is a function) in an attribute (QwikDev/qwik#9267) | `QWIK ERROR Code(Q34)` "Cannot serialize function", the router's 500 page appended after the shell, the segment never shows. Fine in-order; `/q34-no-fn/` shows the object reaching the state only with out-of-order streaming. Control: [`/q34-props/`](src/routes/q34-props/index.tsx) (functions as `component$` props) fails in both modes, as documented |
| [`/e/`](src/routes/e/index.tsx), [`/e-late/`](src/routes/e-late/index.tsx) + `node verify-e.mjs` | a route component throws during SSR inside `<Catch>` (QwikDev/qwik#9268) | HTTP 200 with no `Cache-Control: no-store` (promised by the `Catch` docs); `onBeforeFirstFlush` gets `hasCaughtError: false` because `<html …>` is flushed before the async root body, with every in-order strategy |
| [`/w/`](src/routes/w) + `node verify-w.mjs --with-g-v1` | B, C and D clicked 60 ms apart while B and C load (`blockSSR: false`, read while rendering), **with the invalidate-and-recompute fix first proposed for #9237** (`g-v1.patch`) | URL `/w/d/`, page A still on screen, `isNavigating` stays `true` (40/40). Plain rc.3: no hang (0/30), but the #9237 symbol |

`npm run verify` output on 2.0.0-rc.3:

```
D {"templateInsideSvg":true,"fallbackVisible":true}
  pageerror: Failed to execute 'insertBefore' on 'Node': parameter 1 is not of type 'Node'.
G click C 100 ms after B: {"path":"/g/c/","h1":"C"}
  log: Data render, value: Symbol(qwik.2.0.0-rc.3-dev+3fd543f.invalid)
  pageerror: Cannot read properties of undefined (reading 'toLocaleString')
S1 (abort), 3 s after the click: {"outcome":"pending","isRunning":"true"}
S1 (502 html), 3 s after the click: {"outcome":"pending","isRunning":"true"}
S2 double click, POSTs sent: 2
S3 two separate submissions, POSTs sent: 1 onSubmit$ ran: 2
```

`node verify2.mjs` output on 2.0.0-rc.3:

```
I "fast" (100 ms loader) reached the browser after 1521 ms, whole page after 1523 ms
  [i] fast start 13162
  [i] slow start 13162
  [i] fast end 13263
  [i] slow end 14664
  [i] page render 14666
L after the click: {"url":"/l/list/?sort=new","items":"3 items, sorted by new"}
  log: List render, value: undefined
  log: List render, value: {"sort":"new","items":["a","b","c"]}
  pageerror: Cannot read properties of undefined (reading 'items')
P samples after the click: [{"at":300,"path":"/p/next/","disabled":false,"isRunning":"false"},{"at":700,"path":"/p/next/","disabled":false,"isRunning":"false"},{"at":1100,"path":"/p/next/","disabled":false,"isRunning":"false"}]
C (stateful wrapper inside Pending), every 200 ms after the click: fallback fallback fallback fallback fallback fallback fallback data data data data data data data data data
C (Pending inside a component$, reader through its Slot), every 200 ms after the click: old-page old-page old-page old-page old-page old-page old-page data data data data data data data data data
A via action that redirects to /a/target/ (onGet-only, redirects to /a/final/): {"path":"/a/target/","title":null,"bodyText":""}
A via <Link> to /a/target/ (onGet-only, redirects to /a/final/): {"path":"/a/target/","title":null,"bodyText":""}
CSS dynamic import(): {"state":"import failed: TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4321/build/q-BvRk9kiK.js","color":"rgb(1, 2, 3)"} failed requests: 404 /build/q-BvRk9kiK.js/
K client navigation /k/ -> /k/area/page/: {"path":"/k/area/page/","title":null,"user":"group user: "}
  q-loader: 404 /k/area/q-loader-GSlisHtew2I.w5ltof.json {"error":"Loader not found"}
  pageerror: Loader GSlisHtew2I returned empty response
K document GET /k/area/page/: 200, group user rendered: true
B Back 0 ms after the filter URL changed: wrong state 13/20
  last history calls: pushState /bf/?q=Bianchi | --- Back | popstate /bf/ | replaceState /bf/?q=Bianchi | replaceState /bf/?q=Bianchi
B Back 300 ms after the filter URL changed: wrong state 0/20
```

`npm run verify:no-catch-flag` and `npm run verify:optimizer-export` on 2.0.0-rc.3:

```
build warnings about Catch/experimental: none
GET /nf/ -> HTTP 200; body says "500 Internal Server Error": true; page content rendered: false
server log lines during the request: none

@qwik.dev/core 2.0.0-rc.3
createOptimizer declared in node_modules/@qwik.dev/core/dist/optimizer.d.ts: true
runtime exports of @qwik.dev/core/optimizer: qwikRolldown, qwikRollup, qwikVite
typeof createOptimizer at runtime: undefined
```

`node verify3.mjs` output on 2.0.0-rc.3 (`DEV=1 node verify3.mjs` gives the same for Q24, Q24b and
Q24f; Q24c prints "the document never finished loading" and Q24e "the response never finished"):

```
Q24 HTML {"stateRoots":106,"patchStart":106,"earlySegmentRefsPastStateEnd":[106,107,109]}
Q24 after two clicks: "slow 0" (expected "slow 2")
  error: %cQWIK ERROR  Cannot assign to read only property '0' of string 'q-Bx6uYRQg.js' TypeError: Cannot assign to read only property '0' of string 'q-Bx6uYRQg.js'
  error: %cQWIK ERROR  t is not a function TypeError: t is not a function
  pageerror: t is not a function
  error: %cQWIK ERROR  t is not a function TypeError: t is not a function
  pageerror: t is not a function
Q24b /q24b/ after two clicks: {"button":"2","count":"0"} (expected {"button":"2","count":"2"})
  error: %cQWIK ERROR  Cannot read properties of undefined (reading '0') TypeError: Cannot read properties of undefined (reading '0')
Q24b /q24b/inline/ after two clicks: {"button":"2","count":"0"} (expected {"button":"2","count":"2"})
  no errors
Q24c after a click: "slow data 1" (expected "slow data 1")
  no errors
Q24e {"status":200,"inline500":true}
Q24f after two clicks: {"button":"3","late":"slow 2"} (expected {"button":"3","late":"slow 6"})
  no errors
```

On `main` at `1bcd4b47b` (before QwikDev/qwik#9258), `node verify3.mjs` gives: Q24 fixed (by
QwikDev/qwik#9254); Q24b, Q24c (dev) and Q24f fail as above. With QwikDev/qwik#9258 (pkg.pr.new build
`c447c30`), Q24b, Q24c and Q24f pass in build and dev. Q24e still fails in dev: the response never finishes
(QwikDev/qwik#9252).

`node verify-x.mjs` output (build; `DEV=1` gives the same, except that the two `.pending` rows on rc.3
and on `main` before #9258 print `LOAD TIMEOUT`), 2.0.0-rc.3 and `main` at `1bcd4b47b`:

```
x1 computed late (#9259)     FAIL {"b":"2","late":"slow 2"} expected {"b":"2","late":"slow 4"}
x2 computed late (#9258)     FAIL {"c":"0"} expected {"c":"2"}
x2 task track() late         PASS {"t":"1"}
x3 shared async, child       FAIL {"b":"2","c":"0"} expected {"b":"2","c":"2"}
    QWIK ERROR  Cannot read properties of undefined (reading '0') TypeError: Cannot read properties of undefined (reading '0')
x3i shared async, inline     FAIL {"b":"2","c":"0"} expected {"b":"2","c":"2"}
x4 .pending late (during)    FAIL {"s":"false"} expected {"s":"true"}
x4 .pending late (after)     PASS {"s":"false"}
x5 object identity           FAIL {"m":"lost (0)"} expected {"m":"confirmed (1)"}
x6 async computed late       FAIL {"late":"3"} expected {"late":"6"}
```

With QwikDev/qwik#9258 (pkg.pr.new build `c447c30`), build and dev: all nine rows `PASS`, no errors.

`node verify-q34.mjs` and `OOS=0 node verify-q34.mjs` output on 2.0.0-rc.3 (build; the same on `main` at
`e63f0b2`). `src/entry.ssr.tsx` reads `OOS=0` to turn out-of-order streaming off; `DEV=1 node verify-q34.mjs /q34/`
runs the dev server, where the stream is cut instead:

```
build, out-of-order on
/q34/          HTTP 200, 500 page appended, state, #late="(missing)"
    server: QWIK ERROR Code(Q34) https://qwikdev-build-v2.qwik-8nx.pages.dev/docs/errors/#q34
    browser: QWIK ERROR  Cannot read properties of null (reading 'flags') TypeError: Cannot read properties of null (reading 'flags')
/q34-in-order/ HTTP 200, state, #late="nameAB"
/q34-no-fn/    HTTP 200, state, #late="nameAB", column object in state
build, out-of-order off
/q34/          HTTP 200, state, #late="nameAB"
/q34-in-order/ HTTP 200, state, #late="nameAB"
/q34-no-fn/    HTTP 200, state, #late="nameAB"
```

`node verify-e.mjs` output on 2.0.0-rc.3 (build; the same in dev and on `main` at `e63f0b2`). `src/entry.ssr.tsx`
reads the flags: `E_STATUS=1` wraps `onBeforeFirstFlush` (logs its argument, and on `hasCaughtError` sets 500),
`E_CHUNK=n` sets `maximumInitialChunk`, `E_INORDER=disabled`, `OOS=0`; `E_APP=1` makes the boundary's `onError$`
log `headersSent`:

```
build
/e/      HTTP 200, cache-control=null, fallback="fallback: An error occurred"
    server: (nothing)
/e-late/ HTTP 200, cache-control=null, fallback="fallback: An error occurred"
    server: (nothing)
build E_STATUS=1 E_CHUNK=100000
/e/      HTTP 200, cache-control=null, fallback="fallback: An error occurred"
    server: [E] onBeforeFirstFlush {"hasCaughtError":false}
build OOS=0 E_STATUS=1 E_INORDER=disabled
/e/      HTTP 200, cache-control=null, fallback="fallback: An error occurred"
    server: [E] onBeforeFirstFlush {"hasCaughtError":false}
build E_APP=1
/e/      HTTP 200, cache-control=null, fallback="fallback: An error occurred"
    server: [onError$] headersSent=true
```
