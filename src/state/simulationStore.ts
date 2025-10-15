"use client";

import { create } from "zustand";
import type { StoreApi } from "zustand";
import type { Difficulty, GridRenderableState } from "@/lib/simulation/gridWorld";
import type { SimulationCommand, SimulationEvent } from "@/workers/simulation.types";
import type { EnvironmentType, LevelType } from '@/types/game';
import { EnvironmentType as EnvEnum, LevelType as LevelEnum } from '@/types/game';

const placeholderFrame: GridRenderableState = {
  size: 25,
  tiles: new Uint8Array(25 * 25),
  difficulty: "meadow",
  rewards: [],
  agents: [],
  tick: 0,
  step: 0,
  episode: 1,
  totalReward: 0,
  episodeReward: 0,
  stepReward: 0,
};

let workerInstance: Worker | null = null;
let lastTick = 0;
let lastTimestamp = 0;

const baseConfig = {
  difficulty: "meadow" as Difficulty,
  agentCount: 8,
  speed: 1,
  renderQuality: "high" as "high" | "medium",
  environment: EnvEnum.BUNNY_GARDEN as EnvironmentType,
  level: LevelEnum.LEVEL_1 as LevelType,
};

const ensureWorker = (
  set: StoreApi<SimulationState>["setState"],
  get: StoreApi<SimulationState>["getState"]
) => {
  if (typeof window === "undefined") {
    return null;
  }
  if (workerInstance) {
    return workerInstance;
  }
  workerInstance = new Worker(
    new URL("../workers/simulation.worker.ts", import.meta.url),
    {
      type: "module",
    }
  );
  workerInstance.onmessage = (event: MessageEvent<SimulationEvent>) => {
    const message = event.data;
    switch (message.type) {
      case "state": {
        const { frame, policyReady } = message.payload;
        const now = message.timestamp ?? Date.now();
        const tickDelta = frame.tick - lastTick;
        const timeDelta = now - lastTimestamp;
        const stepsPerSecond =
          tickDelta > 0 && timeDelta > 0
            ? (tickDelta / timeDelta) * 1000
            : get().stepsPerSecond;
        lastTick = frame.tick;
        lastTimestamp = now;
        set((state) => ({
          frame,
          policyReady,
          status: state.status === "idle" ? "ready" : state.status,
          message: undefined,
          totalReward: frame.totalReward,
          episode: frame.episode,
          tick: frame.tick,
          difficulty: frame.difficulty,
          agentCount: frame.agents.length || state.agentCount,
          stepsPerSecond,
          lastUpdated: now,
        }));
        break;
      }
      case "policy":
        set((state) => ({
          policyReady: message.payload.ready,
          status:
            state.status === "loading"
              ? message.payload.ready
                ? "ready"
                : "idle"
              : state.status,
          message: message.payload.message,
        }));
        break;
      case "error":
        set(() => ({ status: "error", message: message.error }));
        break;
      default:
        break;
    }
  };
  return workerInstance;
};

const sendCommand = (
  command: SimulationCommand,
  set: StoreApi<SimulationState>["setState"],
  get: StoreApi<SimulationState>["getState"]
) => {
  const worker = ensureWorker(set, get);
  worker?.postMessage(command);
};

export interface SimulationState {
  status: "idle" | "loading" | "ready" | "running" | "paused" | "error";
  message?: string;
  difficulty: Difficulty;
  agentCount: number;
  speed: number;
  renderQuality: "high" | "medium";
  policyReady: boolean;
  frame: GridRenderableState;
  tick: number;
  episode: number;
  totalReward: number;
  stepsPerSecond: number;
  environment: EnvironmentType;
  level: LevelType;
  lastUpdated?: number;
  loadPolicy(url?: string): Promise<void>;
  loadPolicyFromFile(file: File): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  step(steps?: number): Promise<void>;
  reset(): Promise<void>;
  setDifficulty(difficulty: Difficulty): void;
  setAgentCount(count: number): void;
  setSpeed(speed: number): void;
  toggleQuality(): void;
  setEnvironment(environment: EnvironmentType): void;
  setLevel(level: LevelType): void;
}

export const useSimulationStore = create<SimulationState>((set, get) => {
  if (typeof window !== "undefined") {
    ensureWorker(set, get);
  }
  return {
    status: "idle",
    message: undefined,
    difficulty: baseConfig.difficulty,
    agentCount: baseConfig.agentCount,
    speed: baseConfig.speed,
    renderQuality: baseConfig.renderQuality,
    policyReady: false,
    frame: placeholderFrame,
    tick: 0,
    episode: 1,
    totalReward: 0,
    stepsPerSecond: 0,
    environment: baseConfig.environment,
    level: baseConfig.level,
    loadPolicy: async (url = "/models/policy.onnx") => {
      set({ status: "loading", message: "Loading policy…" });
      sendCommand({ type: "loadPolicy", payload: { url } }, set, get);
    },
    loadPolicyFromFile: async (file: File) => {
      set({ status: "loading", message: `Loading ${file.name}…` });
      const buffer = await file.arrayBuffer();
      sendCommand({ type: "loadPolicy", payload: { buffer } }, set, get);
    },
    start: async () => {
      const state = get();
      set({ status: "running", message: undefined });
      sendCommand(
        {
          type: "configure",
          payload: {
            difficulty: state.difficulty,
            agentCount: state.agentCount,
          },
        },
        set,
        get
      );
      sendCommand(
        {
          type: "start",
          payload: { speed: Math.max(0.25, state.speed) },
        },
        set,
        get
      );
    },
    pause: async () => {
      set({ status: "paused" });
      sendCommand({ type: "pause" }, set, get);
    },
    resume: async () => {
      const state = get();
      set({ status: "running" });
      sendCommand(
        { type: "resume", payload: { speed: Math.max(0.25, state.speed) } },
        set,
        get
      );
    },
    step: async (steps = 1) => {
      sendCommand({ type: "step", payload: { steps } }, set, get);
    },
    reset: async () => {
      set({ status: "idle", message: "Resetting" });
      sendCommand(
        {
          type: "configure",
          payload: {
            difficulty: get().difficulty,
            agentCount: get().agentCount,
          },
        },
        set,
        get
      );
      sendCommand({ type: "reset" }, set, get);
    },
    setDifficulty: (difficulty) => {
      set({ difficulty });
      sendCommand({ type: "configure", payload: { difficulty } }, set, get);
    },
    setAgentCount: (count) => {
      const clamped = Math.max(1, Math.min(32, Math.round(count)));
      set({ agentCount: clamped });
      sendCommand({ type: "configure", payload: { agentCount: clamped } }, set, get);
    },
    setSpeed: (speed) => {
      const multiplier = Math.max(0.25, Math.min(5, speed));
      set({ speed: multiplier });
      const status = get().status;
      if (status === "running") {
        sendCommand({ type: "resume", payload: { speed: multiplier } }, set, get);
      }
    },
    toggleQuality: () => {
      set((state) => ({
        renderQuality: state.renderQuality === "high" ? "medium" : "high",
      }));
    },
    setEnvironment: (environment) => {
      set({ environment, level: LevelEnum.LEVEL_1 });
    },
    setLevel: (level) => {
      set({ level });
    },
  };
});
