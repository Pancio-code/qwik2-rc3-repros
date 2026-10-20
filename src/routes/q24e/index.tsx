import { component$, useComputed$ } from "@qwik.dev/core";

/** Throws while rendering on the server. No `<Catch>` anywhere. */
const Boom = component$(() => {
  const v = useComputed$(() => 1);
  if (v.value === 1) throw new Error("boom from q24e");
  return <p>never</p>;
});

export default component$(() => (
  <>
    <h1 id="title">Q24e</h1>
    <Boom />
  </>
));
