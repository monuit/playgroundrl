import { create } from 'zustand';
import { Agent, LevelConfig } from '../types';
import { LEVEL_ONE, LEVEL_TWO } from './world';

interface AgentsStore {
  agents: Agent[];
  addAgent: (id: string, startX: number, startY: number) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  getAgent: (id: string) => Agent | undefined;
  resetAgents: (startPositions: Array<[number, number]>) => void;
  getAgentAt: (x: number, y: number) => Agent | undefined;
}

export const useAgentsStore = create<AgentsStore>((set, get) => ({
  agents: [],

  addAgent: (id, startX, startY) =>
    set((state) => ({
      agents: [
        ...state.agents,
        {
          id,
          x: startX,
          y: startY,
          goalX: 0,
          goalY: 0,
          done: false,
          reward: 0,
          episodeReturn: 0,
          steps: 0,
        },
      ],
    })),

  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),

  getAgent: (id) => get().agents.find((a) => a.id === id),

  resetAgents: (startPositions) =>
    set((state) => ({
      agents: state.agents.map((agent, idx) => {
        const [startX, startY] = startPositions[idx % startPositions.length];
        return {
          ...agent,
          x: startX,
          y: startY,
          done: false,
          reward: 0,
          episodeReturn: 0,
          steps: 0,
        };
      }),
    })),

  getAgentAt: (x, y) =>
    get().agents.find((agent) => agent.x === x && agent.y === y),
}));

interface GameStore {
  level: LevelConfig;
  tick: number;
  paused: boolean;
  tickDuration: number;
  seed?: number;
  setLevel: (level: LevelConfig) => void;
  setLevelById: (levelId: 'level1' | 'level2') => void;
  setPaused: (paused: boolean) => void;
  setTickDuration: (duration: number) => void;
  incrementTick: () => void;
  setSeed: (seed?: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  level: LEVEL_ONE,
  tick: 0,
  paused: true,
  tickDuration: 100,
  seed: undefined,

  setLevel: (level) => set({ level, tick: 0 }),

  setLevelById: (levelId) => {
    const level = levelId === 'level1' ? LEVEL_ONE : LEVEL_TWO;
    set({ level, tick: 0 });
  },

  setPaused: (paused) => set({ paused }),

  setTickDuration: (duration) => set({ tickDuration: Math.max(50, duration) }),

  incrementTick: () => set((state) => ({ tick: state.tick + 1 })),

  setSeed: (seed) => set({ seed }),
}));
