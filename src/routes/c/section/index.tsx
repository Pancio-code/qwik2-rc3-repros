import { component$, Pending, Slot } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

export const useSlowSection = routeLoader$(
  async () => {
    await new Promise((r) => setTimeout(r, 1500));
    return "slow data";
  },
  { blockSSR: false },
);

/** <Pending> INSIDE a component$; the reading child is projected through that component's <Slot>. */
const Section = component$(() => (
  <Pending fallback$={() => <p id="fallback">loading…</p>}>
    <Slot />
  </Pending>
));

const Data = component$(() => {
  const slow = useSlowSection();
  return <p id="data">{slow.value}</p>;
});

export default component$(() => (
  <main>
    <h1 id="title">C: section</h1>
    <Section>
      <Data />
    </Section>
  </main>
));
