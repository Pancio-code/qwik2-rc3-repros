import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

/** Without `sort`, redirect to the same page with the default sort. */
export const useList = routeLoader$(
  async ({ url, redirect }) => {
    const sort = url.searchParams.get("sort");
    if (!sort) throw redirect(302, "/l/list/?sort=new");
    return { sort, items: ["a", "b", "c"] };
  },
  { search: ["sort"] },
);

export default component$(() => {
  const list = useList();
  // After the client navigation from /l/from/, `list.value` is `undefined` here.
  console.log("List render, value:", JSON.stringify(list.value));
  return (
    <main>
      <h1>List</h1>
      <p id="items">
        {list.value.items.length} items, sorted by {list.value.sort}
      </p>
    </main>
  );
});
