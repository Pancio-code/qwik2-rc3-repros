// .pending of a shell async computed, first read inside a late segment; the shell changes its source.
import { component$, isServer, Pending, useComputed$, useSignal, type AsyncSignal } from "@qwik.dev/core";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const Status = component$((props: { data: AsyncSignal<number> }) => <span id="status">{String(props.data.pending)}</span>);
export default component$(() => {
  const n = useSignal(0);
  const data = useComputed$(async ({ track }) => {
    const v = track(n);
    if (v > 0) await wait(1500);
    return v;
  }) as AsyncSignal<number>;
  return (
    <main>
      <button id="inc" onClick$={() => n.value++}>{n.value}</button>
      <Pending fallback$={() => <p>Waiting status</p>}>
        {isServer ? wait(300).then(() => null) : null}
        <Status data={data} />
      </Pending>
    </main>
  );
});
