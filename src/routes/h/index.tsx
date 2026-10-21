// DocumentHeadTags: a head script/style declared the recommended way (properties on the object, no
// deprecated `props`) is rendered with its content duplicated as an attribute (`script="…"`, `style="…"`).
import { component$ } from "@qwik.dev/core";
import type { DocumentHead } from "@qwik.dev/router";

export default component$(() => <p>View source: look at the JSON-LD script and the style in the head.</p>);

export const head: DocumentHead = {
  title: "head tags",
  scripts: [{ type: "application/ld+json", script: '{"@context":"https://schema.org","@type":"Organization","name":"Example"}' }],
  styles: [{ key: "probe", style: "p{color:rgb(1, 2, 3)}" }],
};
