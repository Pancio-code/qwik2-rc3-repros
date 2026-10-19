import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";

export default component$(() => (
  <main>
    <h1>G: navigating away while a loader loads</h1>
    <p>Click B, then click C within one second.</p>
    <Link id="go-b" href="/g/b/">B (slow loader)</Link> <Link id="go-c" href="/g/c/">C</Link>
  </main>
));
