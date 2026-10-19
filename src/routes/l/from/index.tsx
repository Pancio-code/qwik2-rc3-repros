import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";

export default component$(() => (
  <main>
    <h1>L: start here</h1>
    <Link id="go-list" href="/l/list/">
      List (its loader redirects to ?sort=new)
    </Link>
  </main>
));
