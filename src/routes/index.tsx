import { component$ } from "@qwik.dev/core";

export default component$(() => (
  <main>
    <h1>Qwik 2.0.0-rc.3 reproductions</h1>
    <ul>
      <li>
        <a href="/d/">D: out-of-order segment inside an svg</a>
      </li>
      <li>
        <a href="/g/">G: navigating away while a loader loads</a>
      </li>
      <li>
        <a href="/s/">S: router actions (failed request, double click, array onSubmit$)</a>
      </li>
      <li>
        <a href="/i/">I: SSR waits for background loaders</a>
      </li>
      <li>
        <a href="/l/from/">L: a loader that redirects leaves its value undefined</a>
      </li>
      <li>
        <a href="/p/">P: an action that redirects stops running before the new page</a>
      </li>
      <li>
        <a href="/c/">C: Pending inside a component$ misses a reader projected through its Slot</a>
      </li>
      <li>
        <a href="/a/">A: a redirect to an onGet-only route gives a blank page</a>
      </li>
      <li>
        <a href="/css/">CSS: dynamic import() of a .css asks for a JS chunk that is never written</a>
      </li>
      <li>
        <a href="/nf/">NF: a page with Catch (500 when built without the catchBoundary flag)</a>
      </li>
    </ul>
  </main>
));
