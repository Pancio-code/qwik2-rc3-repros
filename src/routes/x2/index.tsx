// #9258 "root-owned computed first read by a late segment" + a useTask$ track() of a shell signal.
import { component$, isServer, Pending, useComputed$, useSignal, useTask$, type Signal } from "@qwik.dev/core";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Reader = component$((props: { value: Signal<number> }) => <span id="late-computed">{props.value.value}</span>);
const TaskReader = component$((props: { count: Signal<number> }) => {
  const observed = useSignal(0);
  useTask$(({ track }) => {
    observed.value = track(() => props.count.value);
  });
  return <span id="late-task">{observed.value}</span>;
});
export default component$(() => {
  const count = useSignal(0);
  const doubled = useComputed$(() => count.value * 2);
  return (
    <main>
      <button id="inc" onClick$={() => count.value++}>{count.value}</button>
      <Pending fallback$={() => <p>Waiting computed</p>}>
        {isServer ? wait(300).then(() => null) : null}
        <Reader value={doubled} />
        <TaskReader count={count} />
      </Pending>
    </main>
  );
});
