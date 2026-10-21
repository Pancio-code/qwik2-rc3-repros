import { createRenderer } from "@qwik.dev/router";
import Root from "./root";

export default createRenderer((opts) => ({
  jsx: <Root />,
  options: {
    ...opts,
    containerAttributes: { lang: "en-us", ...opts.containerAttributes },
    streaming: {
      ...opts.streaming,
      // OOS=0 turns out-of-order streaming off (default: on).
      outOfOrder: process.env.OOS !== "0",
      // E_CHUNK=n: ask the auto strategy to hold the first n bytes before the first flush.
      ...(process.env.E_CHUNK
        ? {
            inOrder: {
              strategy: "auto",
              maximumInitialChunk: Number(process.env.E_CHUNK),
            },
          }
        : {}),
      // E_INORDER=disabled: no in-order streaming at all.
      ...(process.env.E_INORDER === "disabled"
        ? { inOrder: { strategy: "disabled" } }
        : {}),
    },
    // E_STATUS=1: a <Catch> that caught before the first chunk turns the response into a 500.
    onBeforeFirstFlush:
      process.env.E_STATUS === "1"
        ? (info) => {
            console.error("[E] onBeforeFirstFlush", JSON.stringify(info));
            opts.onBeforeFirstFlush?.(info);
            if (info.hasCaughtError)
              opts.serverData?.qwikrouter?.ev?.status(500);
          }
        : opts.onBeforeFirstFlush,
  },
}));
