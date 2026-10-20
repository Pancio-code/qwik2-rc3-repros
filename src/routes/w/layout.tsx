import { component$, Slot } from "@qwik.dev/core";
import { Link, useLocation } from "@qwik.dev/router";

export default component$(() => {
  const loc = useLocation();
  return (
    <>
      <p id="nav">{loc.isNavigating ? "navigating" : "idle"}</p>
      <nav>
        <Link id="go-a" href="/w/">A</Link> <Link id="go-b" href="/w/b/">B (slow loader)</Link>{" "}
        <Link id="go-c" href="/w/c/">C (slow loader)</Link>{" "}
        <Link id="go-d" href="/w/d/">D</Link>
      </nav>
      <Slot />
    </>
  );
});
