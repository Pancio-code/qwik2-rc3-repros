import { component$ } from "@qwik.dev/core";
import { Form, routeAction$ } from "@qwik.dev/router";

let posts = 0;

export const useGo = routeAction$(async (_, { redirect }) => {
  posts++;
  console.log(`[p] action post #${posts}`);
  throw redirect(302, "/p/next/");
});

export default component$(() => {
  const go = useGo();
  return (
    <main>
      <h1>P: action that redirects</h1>
      <Form action={go}>
        <button id="go" type="submit" disabled={go.isRunning}>
          Save and go to the next page (disabled while running)
        </button>
      </Form>
      <p>
        isRunning: <span id="running">{String(go.isRunning)}</span>
      </p>
    </main>
  );
});
