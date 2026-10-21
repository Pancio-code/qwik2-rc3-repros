import { component$ } from "@qwik.dev/core";
import { routeLoader$ } from "@qwik.dev/router";

export const useSlow = routeLoader$(async () => {
  await new Promise((r) => setTimeout(r, 1500));
  return "slow page";
});

export default component$(() => {
  const slow = useSlow();
  return <h1 id="slow">{slow.value}</h1>;
});
