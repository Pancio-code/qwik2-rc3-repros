import { $, Catch, component$, Pending, useComputed$ } from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Throws after an await: with out-of-order streaming the error comes after the first flush. */
const Broken = component$(() => {
  const data = useComputed$(async () => {
    await wait(200);
    throw new Error("E-MARKER: late render failed");
  });
  return <p>{String(data.value)}</p>;
});

export default component$(() => (
  <Catch
    fallback$={$((error) => (
      <p id="fallback">fallback: {error.message}</p>
    ))}
  >
    <Pending fallback$={() => <p>loading…</p>}>
      <Broken />
    </Pending>
  </Catch>
));
