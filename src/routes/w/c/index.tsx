import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

export const useSlowC = routeLoader$(
  async () => {
    await new Promise((r) => setTimeout(r, 500));
    return { n: 2 };
  },
  { blockSSR: false },
);

const Reads = component$(() => {
  const data = useSlowC();
  return <p id="n">{data.value.n}</p>;
});

export default component$(() => (
  <main>
    <h1>C</h1>
    <Reads />
  </main>
));
