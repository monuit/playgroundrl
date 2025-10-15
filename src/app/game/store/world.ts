import { LevelConfig } from '../types';

/**
 * Level 1: Static obstacles, simple navigation
 */
export const LEVEL_ONE: LevelConfig = {
  id: 'level1',
  name: 'Level 1: Static Obstacles',
  gridSize: 25,
  staticObstacles: [
    // Border walls
    ...Array.from({ length: 25 }, (_, i) => [i, 0] as [number, number]),
    ...Array.from({ length: 25 }, (_, i) => [i, 24] as [number, number]),
    ...Array.from({ length: 25 }, (_, i) => [0, i] as [number, number]),
    ...Array.from({ length: 25 }, (_, i) => [24, i] as [number, number]),
    // Interior walls - create maze-like corridors
    ...Array.from({ length: 12 }, (_, i) => [6, 2 + i] as [number, number]),
    ...Array.from({ length: 10 }, (_, i) => [12, 3 + i] as [number, number]),
    ...Array.from({ length: 12 }, (_, i) => [18, 2 + i] as [number, number]),
  ],
  goalPosition: [23, 23],
  startPositions: [
    [1, 1],
    [2, 2],
    [1, 3],
    [3, 1],
  ],
};

/**
 * Level 2: Static obstacles + moving obstacles
 */
export const LEVEL_TWO: LevelConfig = {
  id: 'level2',
  name: 'Level 2: Moving Obstacles',
  gridSize: 25,
  staticObstacles: [
    // Border
    ...Array.from({ length: 25 }, (_, i) => [i, 0] as [number, number]),
    ...Array.from({ length: 25 }, (_, i) => [i, 24] as [number, number]),
    ...Array.from({ length: 25 }, (_, i) => [0, i] as [number, number]),
    ...Array.from({ length: 25 }, (_, i) => [24, i] as [number, number]),
  ],
  movingObstacles: [
    {
      id: 'mov1',
      x: 12,
      y: 5,
      pathX: [8, 16],
      pathY: [5, 5],
      speed: 2,
      phase: 0,
    },
    {
      id: 'mov2',
      x: 12,
      y: 12,
      pathX: [12, 12],
      pathY: [8, 16],
      speed: 2,
      phase: 0,
    },
    {
      id: 'mov3',
      x: 12,
      y: 19,
      pathX: [6, 18],
      pathY: [19, 19],
      speed: 2.5,
      phase: 1,
    },
  ],
  goalPosition: [23, 23],
  startPositions: [
    [1, 1],
    [2, 2],
    [1, 3],
    [3, 1],
  ],
};

/**
 * World store: collision checking and tile queries
 */
import { create } from 'zustand';

interface WorldStore {
  level: LevelConfig | null;
  movingObstaclePositions: Map<string, [number, number]>;
  setLevel: (level: LevelConfig) => void;
  updateMovingObstacle: (id: string, x: number, y: number) => void;
  isBlocked: (x: number, y: number) => boolean;
  isGoal: (x: number, y: number) => boolean;
  isStatic: (x: number, y: number) => boolean;
  isMoving: (x: number, y: number) => boolean;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  level: null,
  movingObstaclePositions: new Map(),

  setLevel: (level) => {
    const positions = new Map<string, [number, number]>();
    if (level.movingObstacles) {
      level.movingObstacles.forEach((obs) => {
        positions.set(obs.id, [Math.round(obs.x), Math.round(obs.y)]);
      });
    }
    set({ level, movingObstaclePositions: positions });
  },

  updateMovingObstacle: (id, x, y) =>
    set((state) => {
      const newPositions = new Map(state.movingObstaclePositions);
      newPositions.set(id, [Math.round(x), Math.round(y)]);
      return { movingObstaclePositions: newPositions };
    }),

  isStatic: (x, y) => {
    const level = get().level;
    if (!level) return false;
    return level.staticObstacles.some(([ox, oy]) => ox === x && oy === y);
  },

  isMoving: (x, y) => {
    const positions = get().movingObstaclePositions;
    for (const pos of positions.values()) {
      if (pos[0] === x && pos[1] === y) return true;
    }
    return false;
  },

  isBlocked: (x, y) => {
    const state = get();
    return state.isStatic(x, y) || state.isMoving(x, y);
  },

  isGoal: (x, y) => {
    const level = get().level;
    if (!level) return false;
    return level.goalPosition[0] === x && level.goalPosition[1] === y;
  },
}));
