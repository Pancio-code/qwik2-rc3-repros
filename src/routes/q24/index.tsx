import { component$, Pending, useComputed$, useSignal } from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Ready after 300 ms: streamed out of order, after the container state. */
const Slow = component$(() => {
  const v = useComputed$(async () => {
    await wait(300);
    return "slow";
  });
  const count = useSignal(0);
  return (
    <button id="slow" onClick$={() => count.value++}>
      {v.value} {count.value}
    </button>
  );
});

/** Ready at once: its segment is finalized before the container state is written. */
const Fast = component$(() => {
  const v = useComputed$(async () => "fast");
  return <p id="fast">{v.value}</p>;
});

export default component$(() => (
  <>
    <Pending fallback$={() => <p>loading slow…</p>}>
      <Slow />
    </Pending>
    <Pending fallback$={() => <p>loading fast…</p>}>
      <Fast />
    </Pending>
  </>
));
