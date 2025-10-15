import { create } from "zustand";
import type { LevelConfig } from "@/app/game/types_new";
import { BunnyGardenEngine } from "@/algo/engines";
import type { BunnyAgent } from "@/app/game/types_new";

interface BunnyGardenState {
  engine: BunnyGardenEngine | null;
  agents: BunnyAgent[];
  currentLevel: LevelConfig | null;
  timestep: number;
  episodeReturn: number;
  done: boolean;

  initializeLevel: (level: LevelConfig) => void;
  step: (action: number) => void;
  reset: () => void;
  getAgent: () => BunnyAgent | undefined;
  isGameOver: () => boolean;
}

export const useBunnyGardenStore = create<BunnyGardenState>((set, get) => ({
  engine: null,
  agents: [],
  currentLevel: null,
  timestep: 0,
  episodeReturn: 0,
  done: false,

  initializeLevel: (level: LevelConfig) => {
    const engine = new BunnyGardenEngine(level);
    const agents = engine.reset();
    set({
      engine,
      agents,
      currentLevel: level,
      timestep: 0,
      episodeReturn: 0,
      done: false,
    });
  },

  step: (action: number) => {
    const state = get();
    if (!state.engine) return;

    const { rewards, dones } = state.engine.step([action]);
    const agents = state.engine.getAgents();

    set({
      agents,
      timestep: state.timestep + 1,
      episodeReturn: state.episodeReturn + (rewards[0] || 0),
      done: dones[0] || false,
    });
  },

  reset: () => {
    const state = get();
    if (!state.engine || !state.currentLevel) return;

    const agents = state.engine.reset();
    set({
      agents,
      timestep: 0,
      episodeReturn: 0,
      done: false,
    });
  },

  getAgent: () => {
    const state = get();
    return state.agents[0];
  },

  isGameOver: () => {
    return get().done;
  },
}));
