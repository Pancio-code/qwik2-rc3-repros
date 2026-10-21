import {
  component$,
  type JSXOutput,
  Pending,
  type Signal,
  useComputed$,
  useSignal,
} from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Column {
  key: string;
  render: (row: string) => JSXOutput;
}

/**
 * Control (expected to fail in both modes): plain functions as a `component$` prop. In-order the
 * HTML is already sent when the state fails to serialize, so the page only looks fine.
 */
const Late = component$<{ columns: Column[]; n: Signal<number> }>(
  ({ columns, n }) => {
    const rows = useComputed$(async () => {
      await wait(300);
      return ["a", "b"];
    });
    return (
      <ul id="late">
        {rows.value.map((r) => (
          <li key={r}>
            {columns.map((c) => c.render(r))}
            {n.value}
          </li>
        ))}
      </ul>
    );
  },
);

export default component$(() => {
  const n = useSignal(0);
  return (
    <>
      <button id="inc" onClick$={() => n.value++}>
        {n.value}
      </button>
      <Pending fallback$={() => <p>loading…</p>}>
        <Late
          n={n}
          columns={[{ key: "name", render: (r) => <b>{r.toUpperCase()}</b> }]}
        />
      </Pending>
    </>
  );
});
