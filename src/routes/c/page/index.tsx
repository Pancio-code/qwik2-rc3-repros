import { component$, createContextId, Pending, Slot, useContextProvider, useStore } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

export const useSlow = routeLoader$(
  async () => {
    await new Promise((r) => setTimeout(r, 1500));
    return "slow data";
  },
  { blockSSR: false },
);

const Ctx = createContextId<{ open: boolean }>("c-wrapper");

/** A stateful wrapper that projects its children through <Slot/>. */
const Wrapper = component$(() => {
  const state = useStore({ open: true });
  useContextProvider(Ctx, state);
  return (
    <section id="wrapper">
      <Slot />
    </section>
  );
});

const Data = component$(() => {
  const slow = useSlow();
  return <p id="data">{slow.value}</p>;
});

export default component$(() => (
  <main>
    <h1 id="title">C: page</h1>
    <Pending fallback$={() => <p id="fallback">loading…</p>}>
      <Wrapper>
        <Data />
      </Wrapper>
    </Pending>
  </main>
));
