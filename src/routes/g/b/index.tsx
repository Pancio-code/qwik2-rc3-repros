import { component$, Pending } from "@qwik.dev/core";
import { Link, routeLoader$ } from "@qwik.dev/router";

export const useData = routeLoader$(
  async () => {
    await new Promise((r) => setTimeout(r, 1000));
    return { count: 3 };
  },
  { blockSSR: false },
);

const Data = component$(() => {
  const data = useData();
  // After an aborted navigation `data.value` is the internal NEEDS_COMPUTATION symbol.
  console.log("Data render, value:", String(data.value));
  return <p id="data">{data.value.count.toLocaleString()}</p>;
});

export default component$(() => (
  <main>
    <h1>B</h1>
    <Link id="go-c" href="/g/c/">C</Link>
    <Pending fallback$={() => <p>loading…</p>}>
      <Data />
    </Pending>
  </main>
));
