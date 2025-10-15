export type RewardLanguage = "javascript" | "python";

export interface TrainerInitPayload {
  runId: string;
  envId: string;
  algoId: string;
  backend: "tfjs" | "pyodide";
  seed: string;
  hyper?: Record<string, number>;
  rewardLanguage?: RewardLanguage;
  rewardSource?: string;
}

export interface TrainerStartPayload {
  maxEpisodes?: number;
  maxSteps?: number;
  speedMultiplier?: number;
}

export type TrainerCommand =
  | { type: "init"; payload: TrainerInitPayload }
  | { type: "start"; payload?: TrainerStartPayload }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "step"; payload: { steps: number } }
  | { type: "setReward"; payload: { language: RewardLanguage; source: string } }
  | { type: "setSeed"; payload: { seed: string } }
  | { type: "saveCheckpoint"; payload?: { label?: string } }
  | { type: "loadCheckpoint"; payload: { weights: ArrayBuffer } }
  | { type: "dispose" };

export interface TrainerMetric {
  episode: number;
  reward: number;
  steps: number;
  loss?: number;
  entropy?: number;
  learningRate?: number;
  stepsPerSecond?: number;
  timeMs?: number;
}

export type TrainerEvent =
  | { type: "ready" }
  | { type: "initialised"; payload: { runId: string } }
  | { type: "started" }
  | { type: "paused" }
  | { type: "resumed" }
  | { type: "stepped"; payload: { metrics: TrainerMetric } }
  | {
      type: "checkpoint-saved";
      payload: {
        label?: string;
        episode: number;
        reward: number;
        steps: number;
        weights: ArrayBuffer;
        timestamp: string;
      };
    }
  | {
      type: "state";
      payload: {
        observation: Float32Array;
        metadata?: Record<string, unknown>;
      };
    }
  | { type: "completed"; payload: { episodes: number; steps: number } }
  | { type: "error"; error: string; stack?: string };
