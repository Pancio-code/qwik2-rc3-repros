import { Catch, component$ } from "@qwik.dev/core";

const Fine = component$(() => <p id="fine">fine</p>);

/** Uses <Catch> without the experimental "catchBoundary" flag; nothing throws. */
export default component$(() => (
  <main>
    <h1 id="title">NF: Catch without the flag</h1>
    <Catch fallback$={() => <p>error</p>}>
      <Fine />
    </Catch>
  </main>
));
