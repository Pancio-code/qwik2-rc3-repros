// <Link> sets aria-pressed="true" on the link while the client navigation it started runs.
// aria-pressed is a toggle-button state: it is not allowed on role=link.
import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";

export default component$(() => (
  <nav>
    <Link id="go" href="/lp/slow/">Go to a page whose loader takes 1.5 s</Link>
  </nav>
));
