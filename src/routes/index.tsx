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
    </ul>
  </main>
));
