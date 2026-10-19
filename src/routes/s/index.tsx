import { $, component$, useSignal } from "@qwik.dev/core";
import { Form, routeAction$ } from "@qwik.dev/router";

let posts = 0;

/** Every POST that reaches the server is counted. */
export const useSave = routeAction$(async () => {
  posts++;
  await new Promise((r) => setTimeout(r, 300));
  return { posts };
});

export default component$(() => {
  const save = useSave();
  const outcome = useSignal("idle");

  return (
    <main>
      <h1>S: router actions</h1>

      <h2>1. submit() and a failed request</h2>
      <p>Block <code>?qaction=</code> in devtools (or go offline), then click.</p>
      <button
        id="submit"
        onClick$={async () => {
          outcome.value = "pending";
          try {
            const r = await save.submit();
            outcome.value = `resolved, status ${r.status}`;
          } catch (e) {
            outcome.value = `rejected: ${String(e)}`;
          }
        }}
      >
        action.submit()
      </button>
      <p>
        outcome: <span id="outcome">{outcome.value}</span>, isRunning:{" "}
        <span id="running">{String(save.isRunning)}</span>
      </p>

      <h2>2. Double click on a Form button</h2>
      <Form action={save} id="form-double">
        <button id="double" type="submit" disabled={save.isRunning}>
          Double-click me (disabled while running)
        </button>
      </Form>

      <h2>3. Form with an array onSubmit$</h2>
      <Form action={save} id="form-array" onSubmit$={[$(() => console.log("onSubmit$ ran"))]}>
        <button id="array" type="submit">
          Submit, wait, submit again
        </button>
      </Form>

      <p>
        posts the server received so far (last result): <span id="posts">{save.value?.posts ?? 0}</span>
      </p>
    </main>
  );
});
