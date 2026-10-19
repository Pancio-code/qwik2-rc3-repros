import { component$ } from "@qwik.dev/core";
import { Link } from "@qwik.dev/router";

export default component$(() => (
  <main>
    <h1 id="title">K: start here</h1>
    <Link id="go-page" href="/k/area/page/">
      /k/area/page/ (inside the pathless group (grp); /k/[x]/ also matches
      /k/area/)
    </Link>
  </main>
));
