import { component$, Pending, useComputed$, useSignal, useTask$ } from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Inside <Pending>: ready after 50 ms. */
const Fast = component$(() => {
  const v = useComputed$(async () => {
    await wait(50);
    return "fast";
  });
  return <p id="fast">{v.value}</p>;
});

/** Inside an <svg>, outside any <Pending>: its task keeps the shell waiting 300 ms. */
const Circle = component$(() => {
  const r = useSignal(0);
  useTask$(async () => {
    await wait(300);
    r.value = 10;
  });
  return <circle cx="12" cy="12" r={r.value} />;
});

export default component$(() => (
  <main>
    <h1>D: out-of-order segment written inside an svg</h1>
    <Pending fallback$={() => <p id="fallback">loading…</p>}>
      <Fast />
    </Pending>
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M2 2h20" />
      <Circle />
    </svg>
  </main>
));
