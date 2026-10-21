import { $, Catch, component$ } from "@qwik.dev/core";
import { getRequestEvent } from "@qwik.dev/router";

/** Throws while rendering on the server. */
const Broken = component$(() => {
  throw new Error("E-MARKER: render failed");
});

export default component$(() => (
  <Catch
    fallback$={$((error) => (
      <p id="fallback">fallback: {error.message}</p>
    ))}
    onError$={$((error, info) => {
      if (typeof window !== "undefined") return;
      // E_LOG=1: the documented reporting hook logs on the server.
      if (process.env.E_LOG === "1")
        console.error(`[onError$] ${info.phase} ${error.message}`);
      // E_APP=1: our app's workaround, a 500 if the headers have not left yet.
      if (process.env.E_APP === "1") {
        const ev = getRequestEvent();
        console.error(`[onError$] headersSent=${ev?.headersSent}`);
        if (ev && !ev.headersSent) ev.status(500);
      }
    })}
  >
    <Broken />
  </Catch>
));
