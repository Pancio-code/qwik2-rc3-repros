import { $, component$, Pending, useSignal, useTask$ } from "@qwik.dev/core";
import { routeLoader$, useLocation, useNavigate } from "@qwik.dev/router";

/** The list, filtered by ?q (300 ms, background loader). */
export const useList = routeLoader$(
  async ({ url }) => {
    await new Promise((r) => setTimeout(r, 300));
    const q = url.searchParams.get("q") ?? "";
    return ["Bianchi", "Rossi", "Verdi"].filter((n) =>
      n.toLowerCase().includes(q.toLowerCase()),
    );
  },
  { search: ["q"], blockSSR: false },
);

const List = component$(() => {
  const list = useList();
  return (
    <ul id="list">
      {list.value.map((n) => (
        <li key={n}>{n}</li>
      ))}
    </ul>
  );
});

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  // The field comes from the URL, and follows it on back/forward.
  const query = useSignal(loc.url.searchParams.get("q") ?? "");
  useTask$(({ track }) => {
    track(() => loc.url.search);
    query.value = loc.url.searchParams.get("q") ?? "";
  });
  const apply = $(async () => {
    const q = query.value.trim();
    await nav(q ? `/bf/?q=${encodeURIComponent(q)}` : "/bf/");
  });
  return (
    <main>
      <h1 id="title">B: filter, then Back</h1>
      <form preventdefault:submit onSubmit$={apply}>
        <input id="q" name="q" bind:value={query} />
        <button id="filter" type="submit">
          Filter
        </button>
      </form>
      <Pending fallback$={() => <p>loading…</p>}>
        <List />
      </Pending>
    </main>
  );
});
