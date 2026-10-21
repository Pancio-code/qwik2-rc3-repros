// Async computed of a shell signal (useComputed$ with await), first read in a late segment: the #9259 "known limit".
import { component$, isServer, Pending, useComputed$, useSignal } from "@qwik.dev/core";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Late = component$((props: { v: { value: number } }) => <p id="late">{props.v.value}</p>);
export default component$(() => {
  const count = useSignal(1);
  const tripled = useComputed$(async ({ track }) => {
    const c = track(count);
    await wait(10);
    return c * 3;
  });
  return (
    <main>
      <button id="inc" onClick$={() => count.value++}>{count.value}</button>
      <Pending fallback$={() => <p>Waiting</p>}>
        {isServer ? wait(300).then(() => null) : null}
        <Late v={tripled} />
      </Pending>
    </main>
  );
});
