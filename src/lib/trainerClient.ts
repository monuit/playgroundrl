import type { TrainerCommand, TrainerEvent, TrainerInitPayload, TrainerStartPayload } from "@/workers/types";

type EventListener = (event: TrainerEvent) => void;

export class TrainerClient {
  private worker: Worker | null = null;
  private readonly listeners = new Set<EventListener>();

  async init(payload: TrainerInitPayload) {
    const worker = await this.ensureWorker();
    worker.postMessage({ type: "init", payload } satisfies TrainerCommand);
  }

  async start(payload?: TrainerStartPayload) {
    const worker = await this.ensureWorker();
    worker.postMessage({ type: "start", payload } satisfies TrainerCommand);
  }

  async pause() {
    const worker = await this.ensureWorker();
    worker.postMessage({ type: "pause" } satisfies TrainerCommand);
  }

  async resume() {
    const worker = await this.ensureWorker();
    worker.postMessage({ type: "resume" } satisfies TrainerCommand);
  }

  async step(steps: number) {
    const worker = await this.ensureWorker();
    worker.postMessage({ type: "step", payload: { steps } } satisfies TrainerCommand);
  }

  async setReward(source: string) {
    const worker = await this.ensureWorker();
    worker.postMessage({
      type: "setReward",
      payload: { language: "javascript", source },
    } satisfies TrainerCommand);
  }

  async saveCheckpoint(label?: string) {
    const worker = await this.ensureWorker();
    worker.postMessage(
      { type: "saveCheckpoint", payload: { label } } satisfies TrainerCommand
    );
  }

  async loadCheckpoint(weights: ArrayBuffer) {
    const worker = await this.ensureWorker();
    const copy = weights.slice(0);
    worker.postMessage(
      { type: "loadCheckpoint", payload: { weights: copy } } satisfies TrainerCommand,
      [copy]
    );
  }

  async dispose() {
    if (!this.worker) {
      return;
    }
    this.worker.postMessage({ type: "dispose" } satisfies TrainerCommand);
    this.worker.terminate();
    this.worker = null;
  }

  onEvent(listener: EventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async ensureWorker() {
    if (this.worker) {
      return this.worker;
    }
    if (typeof window === "undefined") {
      throw new Error("Workers are only available in the browser");
    }
    this.worker = new Worker(
      new URL("../workers/trainer.worker.ts", import.meta.url),
      {
        type: "module",
      }
    );
    this.worker.onmessage = (event: MessageEvent<TrainerEvent>) => {
      this.listeners.forEach((listener) => listener(event.data));
    };
    return this.worker;
  }
}
