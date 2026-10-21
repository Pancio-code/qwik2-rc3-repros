import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";
export default component$(() => <p>old props form</p>);
export const head: DocumentHead = {
  scripts: [{ key: "ld", props: { type: "application/ld+json" }, script: '{"old":true}' }],
  styles: [{ key: "probe", props: { media: "screen" }, style: "p{color:rgb(1, 2, 3)}" }],
};
