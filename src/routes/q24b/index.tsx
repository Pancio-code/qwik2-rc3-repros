import { component$, Pending, type ReadonlySignal, type Signal, useComputed$, useSignal } from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Boundary A: reads the shared async signal. */
const A = component$<{ data: ReadonlySignal<string> }>(({ data }) => <p id="a">{data.value}</p>);

/** Rendered inside B after the data arrived: subscribes late to `count`, a signal of the shell. */
const Count = component$<{ count: Signal<number> }>(({ count }) => <span id="count">{count.value}</span>);

/** Boundary B: reads the same async signal, then renders `Count`. */
const B = component$<{ data: ReadonlySignal<string>; count: Signal<number> }>(({ data, count }) => (
  <p id="b">
    {data.value} <Count count={count} />
  </p>
));

export default component$(() => {
  const count = useSignal(0);
  // Read only inside the two boundaries, not by the shell.
  const data = useComputed$(async () => {
    await wait(300);
    return "data";
  });
  return (
    <>
      <button id="inc" onClick$={() => count.value++}>
        {count.value}
      </button>
      <Pending fallback$={() => <p>loading a…</p>}>
        <A data={data} />
      </Pending>
      <Pending fallback$={() => <p>loading b…</p>}>
        <B data={data} count={count} />
      </Pending>
    </>
  );
});
