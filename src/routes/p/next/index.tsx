import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

/** Slow blocking loader: the new page needs 1.5 s. */
export const useNext = routeLoader$(async () => {
  await new Promise((r) => setTimeout(r, 1500));
  return "next";
});

export default component$(() => {
  const next = useNext();
  return (
    <main>
      <h1 id="next">Next page ({next.value})</h1>
    </main>
  );
});
