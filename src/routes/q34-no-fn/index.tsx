import { component$, Pending, useComputed$, useSignal } from "@qwik.dev/core";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Column {
  key: string;
  width?: string;
  label?: string;
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
            <td key={col.key}>{r.toUpperCase()}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/** Like /q34/ but the columns hold no function: is `col` in the state? */
const Late = component$(() => {
  const rows = useComputed$(async () => {
    await wait(300);
    return ["a", "b"];
  });
  return (
    <Table
      rows={rows.value}
      columns={[{ key: "name", width: "40%", label: "COLUMN-LABEL-MARKER" }]}
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
      <Pending fallback$={() => <p>loading…</p>}>
        <Late />
      </Pending>
    </>
  );
});
