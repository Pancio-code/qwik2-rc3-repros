import {
  component$,
  type JSXOutput,
  useComputed$,
  useSignal,
} from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Column {
  key: string;
  width?: string;
  render: (row: string) => JSXOutput;
}

/** Inline component (plain function): a data table whose columns carry `render` functions. */
const Table = ({ columns, rows }: { columns: Column[]; rows: string[] }) => (
  <table id="late">
    <thead>
      <tr>
        {columns.map((col) => (
          // The optimizer wraps this attribute in a derived signal whose argument is `col`.
          <th
            key={col.key}
            style={col.width ? { width: col.width } : undefined}
          >
            {col.key}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r}>
          {columns.map((col) => (
            <td key={col.key}>{col.render(r)}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/** Same as /q34/ without <Pending>: a component (async computed) that renders the inline `Table`. */
const Late = component$(() => {
  const rows = useComputed$(async () => {
    await wait(300);
    return ["a", "b"];
  });
  return (
    <Table
      rows={rows.value}
      columns={[
        { key: "name", width: "40%", render: (r) => <b>{r.toUpperCase()}</b> },
      ]}
    />
  );
});

export default component$(() => {
  const n = useSignal(0);
  return (
    <>
      <button id="inc" onClick$={() => n.value++}>
        {n.value}
      </button>

      <Late />
    </>
  );
});
