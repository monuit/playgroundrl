import { create } from "zustand";
import type { LevelConfig } from "@/app/game/types_new";
import { SwarmDronesEngine } from "@/algo/engines";
import type { DroneAgent } from "@/algo/engines";

interface SwarmDronesState {
  engine: SwarmDronesEngine | null;
  agents: DroneAgent[];
  currentLevel: LevelConfig | null;
  timestep: number;
  episodeReturns: number[];
  allDone: boolean;

  initializeLevel: (level: LevelConfig) => void;
  step: (actions: number[][]) => void;
  reset: () => void;
  getAgents: () => DroneAgent[];
  getAgent: (id: string) => DroneAgent | undefined;
  isGameOver: () => boolean;
}

export const useSwarmDronesStore = create<SwarmDronesState>((set, get) => ({
  engine: null,
  agents: [],
  currentLevel: null,
  timestep: 0,
  episodeReturns: [0, 0, 0, 0],
  allDone: false,

  initializeLevel: (level: LevelConfig) => {
    const engine = new SwarmDronesEngine(level);
    const agents = engine.reset();
    set({
      engine,
      agents,
      currentLevel: level,
      timestep: 0,
      episodeReturns: [0, 0, 0, 0],
      allDone: false,
    });
  },

  step: (actions: number[][]) => {
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
      episodeReturns: [0, 0, 0, 0],
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
