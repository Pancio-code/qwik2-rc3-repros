import { component$, useSignal, useVisibleTask$ } from "@qwik.dev/core";

export default component$(() => {
  const state = useSignal("waiting");
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    try {
      await import("./probe.css");
      state.value = "css loaded";
    } catch (e) {
      state.value = `import failed: ${String(e)}`;
    }
  });
  return (
    <main>
      <h1 id="title" class="css-probe">
        CSS: dynamic import()
      </h1>
      <p id="state">{state.value}</p>
    </main>
  );
});
