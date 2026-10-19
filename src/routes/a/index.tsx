import { component$ } from "@qwik.dev/core";
import { Form, Link, routeAction$ } from "@qwik.dev/router";

export const useGo = routeAction$(async (_, { redirect }) => {
  throw redirect(302, "/a/target/");
});

export default component$(() => {
  const go = useGo();
  return (
    <main>
      <h1 id="title">A: start</h1>
      <Form action={go}>
        <button id="submit" type="submit">
          Action that redirects to an onGet-only route
        </button>
      </Form>
      <Link id="link" href="/a/target/">
        Link to the onGet-only route
      </Link>
    </main>
  );
});
