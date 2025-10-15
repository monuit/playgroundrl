import { create } from "zustand";
import type { LevelConfig } from "@/app/game/types_new";
import { WarehouseBotsEngine } from "@/algo/engines";
import type { BotAgent } from "@/algo/engines";

interface WarehouseBotsState {
  engine: WarehouseBotsEngine | null;
  agents: BotAgent[];
  currentLevel: LevelConfig | null;
  timestep: number;
  episodeReturns: number[];
  allDone: boolean;

  initializeLevel: (level: LevelConfig) => void;
  step: (actions: number[]) => void;
  reset: () => void;
  getAgents: () => BotAgent[];
  getAgent: (id: string) => BotAgent | undefined;
  isGameOver: () => boolean;
}

export const useWarehouseBotsStore = create<WarehouseBotsState>((set, get) => ({
  engine: null,
  agents: [],
  currentLevel: null,
  timestep: 0,
  episodeReturns: [0, 0, 0],
  allDone: false,

  initializeLevel: (level: LevelConfig) => {
    const engine = new WarehouseBotsEngine(level);
    const agents = engine.reset();
    set({
      engine,
      agents,
      currentLevel: level,
      timestep: 0,
      episodeReturns: [0, 0, 0],
      allDone: false,
    });
  },

  step: (actions: number[]) => {
    const state = get();
    if (!state.engine) return;

    const { rewards, dones } = state.engine.step(actions);
    const agents = state.engine.getAgents();

    const newReturns = state.episodeReturns.map((r, i) => r + (rewards[i] || 0));
    const allDone = dones.every((d) => d);

    set({
      agents,
      timestep: state.timestep + 1,
      episodeReturns: newReturns,
      allDone,
    });
  },

  reset: () => {
    const state = get();
    if (!state.engine || !state.currentLevel) return;

    const agents = state.engine.reset();
    set({
      agents,
      timestep: 0,
      episodeReturns: [0, 0, 0],
      allDone: false,
    });
  },

  getAgents: () => {
    return get().agents;
  },

  getAgent: (id: string) => {
    return get().agents.find((a) => a.id === id);
  },

  isGameOver: () => {
    return get().allDone;
  },
}));
