// #9258 "late inline subscriptions when segments share an async signal" (#9250 shape, data resolved after the root state).
import { component$, isServer, Pending, useComputed$, useSignal, type Signal } from "@qwik.dev/core";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Reader = component$((props: { data: { value: string }; count?: Signal<number> }) => (
  <p>
    {props.data.value}
    {props.count && <span id="count">{props.count.value}</span>}
  </p>
));
export default component$(() => {
  const count = useSignal(0);
  const data = useComputed$(async () => {
    if (isServer) await wait(300);
    return "data";
  });
  return (
    <main>
      <button id="inc" onClick$={() => count.value++}>{count.value}</button>
      <Pending fallback$={() => <p>Waiting first</p>}><Reader data={data} /></Pending>
      <Pending fallback$={() => <p>Waiting second</p>}><Reader data={data} count={count} /></Pending>
    </main>
  );
});
