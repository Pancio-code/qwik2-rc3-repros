import { component$ } from "@qwik.dev/core";
import { useLocation } from "@qwik.dev/router";

/** A dynamic sibling of the pathless group: it also matches /k/area/. */
export default component$(() => {
  const loc = useLocation();
  return (
    <main>
      <h1 id="title">K: dynamic page for "{loc.params.x}"</h1>
    </main>
  );
});
