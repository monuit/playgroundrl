import { create } from "zustand";
import { TrainerClient } from "@/lib/trainerClient";
import type { TrainerEvent } from "@/workers/types";
import { ALGORITHM_LOOKUP } from "@/algo";
import { ENV_LOOKUP, ENVIRONMENTS } from "@/env";
import {
  addCheckpoint,
  appendMetric,
  createRunManifest,
  deleteCheckpointRecord,
  fetchCheckpoints,
  getCheckpoint,
  listRuns,
  updateCheckpoint,
  type CheckpointRecord,
  type RunManifest,
} from "@/state/persistence";
import {
  exportRunBundle,
  importRunBundle,
  type ExportFormat,
} from "@/state/export_import";
import { validateRewardSource } from "@/utils/rewardValidator";

const randomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type TrainingStatus = "idle" | "initialising" | "ready" | "running" | "paused" | "error";

export interface TrainingMetric {
  episode: number;
  reward: number;
  steps: number;
  loss?: number;
  entropy?: number;
  learningRate?: number;
  stepsPerSecond?: number;
  timeMs?: number;
}

export interface CheckpointSummary {
  id: number;
  episode: number;
  reward: number;
  steps: number;
  createdAt: string;
  label?: string;
  pinned?: boolean;
  notes?: string;
  updatedAt?: string;
}

interface TrainingState {
  runId: string | null;
  envId: string;
  algoId: string;
  backend: "tfjs" | "pyodide";
  status: TrainingStatus;
  seed: string;
  speedMultiplier: number;
  metrics: TrainingMetric[];
  currentObservation?: Float32Array;
  currentMetadata?: Record<string, unknown>;
  rewardSource: string;
  runs: RunManifest[];
  checkpoints: CheckpointSummary[];
  lastError?: string;
  client: TrainerClient;
  setEnvId(id: string): void;
  setAlgoId(id: string): void;
  setSeed(seed: string): void;
  setSpeed(speed: number): void;
  initialise(): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  step(steps: number): Promise<void>;
  setReward(source: string): Promise<void>;
  resetMetrics(): void;
  saveCheckpoint(label?: string): Promise<void>;
  loadCheckpoint(id: number): Promise<void>;
  deleteCheckpoint(id: number): Promise<void>;
  renameCheckpoint(id: number, label: string): Promise<void>;
  setCheckpointNotes(id: number, notes: string): Promise<void>;
  toggleCheckpointPin(id: number): Promise<void>;
  exportCheckpoint(id: number): Promise<Blob | null>;
  refreshCheckpoints(): Promise<void>;
  exportRun(format?: ExportFormat): Promise<Blob | null>;
  importRun(file: File | ArrayBuffer | Blob): Promise<string | null>;
  refreshRuns(): Promise<void>;
}

const trainerClient = new TrainerClient();

const mapCheckpoint = (record: CheckpointRecord): CheckpointSummary => ({
  id: record.id!,
  episode: record.episode,
  reward: record.rewardMean,
  steps: record.step,
  createdAt: record.createdAt,
  label: record.label,
  pinned: record.pinned,
  notes: record.notes,
  updatedAt: record.updatedAt,
});

const DEFAULT_ENV_ID = ENVIRONMENTS[0]?.id ?? "swarm-drones";

export const useTrainingStore = create<TrainingState>((set, get) => {
  const fallbackEnvId = DEFAULT_ENV_ID;
  if (typeof window !== "undefined") {
    trainerClient.onEvent((event: TrainerEvent) => {
      switch (event.type) {
        case "initialised":
          set({ status: "ready", runId: event.payload.runId });
          void get().refreshCheckpoints();
          break;
        case "started":
          set({ status: "running", lastError: undefined });
          break;
        case "paused":
          set({ status: "paused" });
          break;
        case "resumed":
          set({ status: "running" });
          break;
        case "state":
          set({
            currentObservation: event.payload.observation,
            currentMetadata: event.payload.metadata,
          });
          break;
        case "stepped": {
          const metric = event.payload.metrics;
          const runId = get().runId;
          if (runId) {
            void appendMetric({
              runId,
              episode: metric.episode,
              reward: metric.reward,
              steps: metric.steps,
              timestamp: new Date().toISOString(),
              loss: metric.loss,
              entropy: metric.entropy,
              learningRate: metric.learningRate,
              stepsPerSecond: metric.stepsPerSecond,
              timeMs: metric.timeMs,
            });
          }
          set((state) => {
            const metrics = [...state.metrics, metric].slice(-200);
            return { metrics };
          });
          break;
        }
        case "checkpoint-saved": {
          const state = get();
          if (!state.runId) {
            break;
          }
          void (async () => {
            const bufferCopy = event.payload.weights.slice(0);
            const checkpoint: CheckpointRecord = {
              runId: state.runId!,
              step: event.payload.steps,
              episode: event.payload.episode,
              rewardMean: event.payload.reward,
              createdAt: event.payload.timestamp,
              weights: bufferCopy,
              label: event.payload.label,
            };
            await addCheckpoint(checkpoint);
            const records = await fetchCheckpoints(state.runId!);
            set({ checkpoints: records.map(mapCheckpoint) });
          })();
          break;
        }
        case "completed":
          set({ status: "ready" });
          break;
        case "error":
          set({ status: "error", lastError: event.error });
          break;
        default:
          break;
      }
    });

    void (async () => {
      try {
        const runs = await listRuns();
        set({ runs });
      } catch {
        // ignore boot failures
      }
    })();
  }

  return {
    runId: null,
    envId: fallbackEnvId,
    algoId: "ppo-tfjs",
    backend: "tfjs",
    status: "idle",
    seed: "playgroundrl-seed",
    speedMultiplier: 1,
    metrics: [],
    currentObservation: undefined,
    currentMetadata: undefined,
    rewardSource:
      "const coverage = state.info?.coverage ?? 0;\nconst collisions = state.info?.collisions ?? 0;\nconst battery = state.info?.battery ?? 1;\nconst steps = state.info?.steps ?? 0;\nconst smoothing = Math.min(1, steps / 200);\nconst explorationBonus = coverage * 0.6 + smoothing * 0.25 - collisions * 0.02;\nconst batteryGuard = battery < 0.2 ? -0.1 : 0;\nreturn reward + explorationBonus + batteryGuard;",
    runs: [],
    checkpoints: [],
    lastError: undefined,
    client: trainerClient,
    setEnvId: (envId) => {
      const definition = ENV_LOOKUP[envId] ?? ENV_LOOKUP[fallbackEnvId];
      if (!definition) {
        return;
      }
      set({ envId: definition.id });
    },
    setAlgoId: (algoId) => {
      const algoDef = ALGORITHM_LOOKUP[algoId];
      if (!algoDef) {
        return;
      }
      set({
        algoId,
        backend: algoDef.backend,
      });
    },
    setSeed: (seed) => set({ seed }),
    setSpeed: (speedMultiplier) => set({ speedMultiplier }),
    resetMetrics: () =>
      set({
        metrics: [],
        currentObservation: undefined,
        currentMetadata: undefined,
      }),
    initialise: async () => {
      const state = get();
      const runId = randomId();
      set({ status: "initialising", runId, lastError: undefined });
      const envDef = ENV_LOOKUP[state.envId] ?? ENV_LOOKUP[fallbackEnvId];
      if (!envDef) {
        throw new Error("Unable to resolve environment definition");
      }
      const algoDef = ALGORITHM_LOOKUP[state.algoId];
      if (!algoDef) {
        throw new Error("Unable to resolve algorithm definition");
      }
      const manifest: RunManifest = {
        id: runId,
        createdAt: new Date().toISOString(),
        envId: envDef.id,
        algoId: algoDef.id,
        backend: algoDef.backend,
        seed: state.seed,
        rewardSource: state.rewardSource,
        version: 1,
      };
      await createRunManifest(manifest);
      const runs = await listRuns();
      set({ runs, checkpoints: [] });
      await state.client.init({
        runId,
        envId: envDef.id,
        algoId: algoDef.id,
        backend: algoDef.backend,
        seed: state.seed,
      });
    },
    start: async () => {
      const state = get();
      if (state.status === "idle") {
        await state.initialise();
      }
      await state.client.start();
    },
    pause: async () => {
      const state = get();
      if (state.status !== "running") {
        return;
      }
      await state.client.pause();
    },
    resume: async () => {
      const state = get();
      if (state.status !== "paused") {
        return;
      }
      await state.client.resume();
    },
    step: async (steps) => {
      const state = get();
      await state.client.step(steps);
    },
    setReward: async (source) => {
      const state = get();
      validateRewardSource(source);
      await state.client.setReward(source);
      set({ rewardSource: source });
    },
    saveCheckpoint: async (label) => {
      const state = get();
      if (!state.runId) {
        return;
      }
      await state.client.saveCheckpoint(label);
    },
    loadCheckpoint: async (id) => {
      const state = get();
      const record = await getCheckpoint(id);
      if (!record) {
        throw new Error("Checkpoint not found");
      }
      await state.client.loadCheckpoint(record.weights.slice(0));
    },
    deleteCheckpoint: async (id) => {
      await deleteCheckpointRecord(id);
      await get().refreshCheckpoints();
    },
    renameCheckpoint: async (id, label) => {
      await updateCheckpoint(id, { label: label || undefined });
      await get().refreshCheckpoints();
    },
    setCheckpointNotes: async (id, notes) => {
      await updateCheckpoint(id, { notes: notes || undefined });
      await get().refreshCheckpoints();
    },
    toggleCheckpointPin: async (id) => {
      const checkpoint = await getCheckpoint(id);
      if (!checkpoint) {
        return;
      }
      await updateCheckpoint(id, { pinned: !checkpoint.pinned });
      await get().refreshCheckpoints();
    },
    exportCheckpoint: async (id) => {
      const checkpoint = await getCheckpoint(id);
      if (!checkpoint) {
        return null;
      }
      const blob = new Blob([checkpoint.weights], { type: "application/octet-stream" });
      return blob;
    },
    refreshCheckpoints: async () => {
      const state = get();
      if (!state.runId) {
        set({ checkpoints: [] });
        return;
      }
      const records = await fetchCheckpoints(state.runId);
      const mapped = records.map(mapCheckpoint).sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) {
          return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        }
        const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
        return bTime - aTime;
      });
      set({ checkpoints: mapped });
    },
    exportRun: async (format = "zip") => {
      const state = get();
      if (!state.runId) {
        return null;
      }
      return exportRunBundle(state.runId, { format });
    },
    importRun: async (file) => {
      const importedId = await importRunBundle(file);
      const runs = await listRuns();
      set({ runs });
      if (get().runId) {
        await get().refreshCheckpoints();
      }
      return importedId;
    },
    refreshRuns: async () => {
      const runs = await listRuns();
      set({ runs });
    },
  };
});


