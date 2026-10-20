import { component$, Pending, type ReadonlySignal, useComputed$, useSignal } from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Late out-of-order segment: the first one to read the computed signal `double`. */
const Late = component$<{ double: ReadonlySignal<number> }>(({ double }) => {
  const slow = useComputed$(async () => {
    await wait(300);
    return "slow";
  });
  return (
    <p id="late">
      {slow.value} {double.value}
    </p>
  );
});

export default component$(() => {
  const count = useSignal(1);
  // Not read by the shell: first computed inside the late boundary.
  const double = useComputed$(() => count.value * 2);
  return (
    <>
      <button id="inc" onClick$={() => count.value++}>
        {count.value}
      </button>
      <Pending fallback$={() => <p>loading…</p>}>
        <Late double={double} />
      </Pending>
    </>
  );
});
