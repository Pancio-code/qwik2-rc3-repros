import { component$, Slot } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

/** A loader of a pathless group layout, shared by every page of the group. */
export const useGroupUser = routeLoader$(async () => ({ name: "Ada" }));

export default component$(() => {
  const user = useGroupUser();
  return (
    <div>
      <p id="user">group user: {user.value.name}</p>
      <Slot />
    </div>
  );
});
