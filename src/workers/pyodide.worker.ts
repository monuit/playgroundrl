/// <reference lib="webworker" />

import type { TrainerCommand, TrainerEvent } from "./types";

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

ctx.postMessage({ type: "ready" } satisfies TrainerEvent);

ctx.onmessage = (event: MessageEvent<TrainerCommand>) => {
  const message = event.data;
  switch (message.type) {
    case "init":
      ctx.postMessage({
        type: "error",
        error: "Pyodide backend is not yet implemented in the MVP.",
      } satisfies TrainerEvent);
      break;
    default:
      ctx.postMessage({
        type: "error",
        error: `Unsupported command "${message.type}" for Pyodide backend.`,
      } satisfies TrainerEvent);
      break;
  }
};
