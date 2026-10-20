import { component$, Pending, type ReadonlySignal, useComputed$, useSignal } from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Async = ReadonlySignal<string> & { pending: boolean };

/** Inside an out-of-order <Pending>: reads `.pending` of a signal created outside the boundary. */
const Child = component$<{ data: Async }>(({ data }) => {
  const slow = useComputed$(async () => {
    await wait(300);
    return "slow";
  });
  const count = useSignal(0);
  return (
    <button id="child" onClick$={() => count.value++}>
      {slow.value} {data.pending ? "pending" : data.value} {count.value}
    </button>
  );
});

export default component$(() => {
  const data = useComputed$(async () => "data") as unknown as Async;
  return (
    <>
      <p id="outer">{data.pending ? "pending" : "ready"}</p>
      <Pending fallback$={() => <p>loading…</p>}>
        <Child data={data} />
      </Pending>
    </>
  );
});
