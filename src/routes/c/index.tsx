import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";

export default component$(() => (
  <main>
    <h1>C: start here</h1>
    <Link id="go-page" href="/c/page/">
      Page with a slow loader read through a stateful wrapper
    </Link>
    <br />
    <Link id="go-section" href="/c/section/">
      Page whose Pending is inside a component$ and the reader comes through its Slot
    </Link>
  </main>
));
