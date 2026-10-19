# Qwik 2.0.0-rc.3 reproductions

Minimal reproductions of bugs found while moving a production app to Qwik 2.0.0-rc.3.
Plain `create-qwik@2.0.0-rc.3 empty` starter; the only change to the config is
`qwikVite({ experimental: ["catchBoundary", "pendingBoundary", "blockSSR"] })`.

```bash
npm install
npm run build.client && npm run build.preview
npx vite preview          # then open the pages below
npm run verify            # or: run every case headless with Playwright and print the result
                          # (verify.mjs: D, G, S; verify2.mjs: I, L, P, C)
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
```
