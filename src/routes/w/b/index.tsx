import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

export const useSlow = routeLoader$(
  async () => {
    await new Promise((r) => setTimeout(r, 500));
    return { n: 1 };
  },
  { blockSSR: false },
);

const Reads = component$(() => {
  const data = useSlow();
  return <p id="n">{data.value.n}</p>;
});

export default component$(() => (
  <main>
    <h1>B</h1>
    <Reads />
  </main>
));
