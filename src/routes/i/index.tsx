import { component$, Pending } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useFast = routeLoader$(
  async () => {
    console.log(`[i] fast start ${Date.now() % 100000}`);
    await wait(100);
    console.log(`[i] fast end ${Date.now() % 100000}`);
    return "fast";
  },
  { blockSSR: false },
);

/** Never read by any component. */
export const useSlow = routeLoader$(
  async () => {
    console.log(`[i] slow start ${Date.now() % 100000}`);
    await wait(1500);
    console.log(`[i] slow end ${Date.now() % 100000}`);
    return "slow";
  },
  { blockSSR: false },
);

const Fast = component$(() => {
  const fast = useFast();
  return <p id="fast">{fast.value}</p>;
});

export default component$(() => {
  console.log(`[i] page render ${Date.now() % 100000}`);
  return (
    <main>
      <h1>I: SSR waits for background loaders</h1>
      <Pending fallback$={() => <p>loading…</p>}>
        <Fast />
      </Pending>
    </main>
  );
});
