/**
 * ENVIRONMENT REGISTRY & FACTORY
 * ==============================
 * 
 * Central location for all environment configurations.
 * Each environment has Level 1 & Level 2 with specific obstacles, rewards, etc.
 */

import {
  EnvironmentType,
  LevelType,
  GRID_SIZE,
  LevelConfig,
  EnvironmentConfig,
} from '@/types/game';

// ════════════════════════════════════════════════════════════════════════════
// BUNNY GARDEN
// ════════════════════════════════════════════════════════════════════════════

const BUNNY_GARDEN_LEVEL_1: LevelConfig = {
  id: LevelType.LEVEL_1,
  name: 'Bunny Garden - Level 1',
  gridSize: GRID_SIZE,
  staticObstacles: [
    // Border walls
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: 0 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: GRID_SIZE - 1 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: 0, y: i })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: GRID_SIZE - 1, y: i })),
    // Interior maze walls
    { x: 12, y: 5 }, { x: 12, y: 6 }, { x: 12, y: 7 },
    { x: 5, y: 12 }, { x: 6, y: 12 }, { x: 7, y: 12 },
    { x: 18, y: 18 }, { x: 18, y: 19 }, { x: 19, y: 18 },
  ],
  goalPositions: [{ x: 23, y: 23 }],
  startPositions: [{ x: 1, y: 1 }],
  difficulty: 1,
  description: 'Simple maze with one goal',
};

const BUNNY_GARDEN_LEVEL_2: LevelConfig = {
  id: LevelType.LEVEL_2,
  name: 'Bunny Garden - Level 2',
  gridSize: GRID_SIZE,
  staticObstacles: [
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: 0 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: GRID_SIZE - 1 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: 0, y: i })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: GRID_SIZE - 1, y: i })),
    // More complex maze
    { x: 12, y: 5 }, { x: 12, y: 6 }, { x: 12, y: 7 }, { x: 12, y: 8 },
    { x: 5, y: 12 }, { x: 6, y: 12 }, { x: 7, y: 12 }, { x: 8, y: 12 },
    { x: 18, y: 18 }, { x: 18, y: 19 }, { x: 19, y: 18 }, { x: 20, y: 18 },
    { x: 10, y: 15 }, { x: 15, y: 10 },
  ],
  movingObstacles: [
    {
      id: 'mov1',
      x: 12,
      y: 12,
      pathX: [8, 16],
      pathY: [12, 12],
      speed: 2,
      phase: 0,
    },
  ],
  goalPositions: [{ x: 23, y: 23 }],
  startPositions: [{ x: 1, y: 1 }],
  difficulty: 2,
  description: 'Complex maze with moving obstacles',
};

// ════════════════════════════════════════════════════════════════════════════
// SWARM DRONES
// ════════════════════════════════════════════════════════════════════════════

const SWARM_DRONES_LEVEL_1: LevelConfig = {
  id: LevelType.LEVEL_1,
  name: 'Swarm Drones - Level 1',
  gridSize: GRID_SIZE,
  staticObstacles: [
    // Border walls
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: 0 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: GRID_SIZE - 1 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: 0, y: i })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: GRID_SIZE - 1, y: i })),
    // Sparse obstacles to encourage coverage
    { x: 12, y: 12 }, { x: 8, y: 8 }, { x: 18, y: 18 },
  ],
  goalPositions: [], // No single goal; coverage-based rewards
  startPositions: [
    { x: 1, y: 1 },
    { x: 23, y: 1 },
    { x: 1, y: 23 },
    { x: 23, y: 23 },
  ],
  difficulty: 1,
  description: 'Open maze for drone coverage mapping',
};

const SWARM_DRONES_LEVEL_2: LevelConfig = {
  id: LevelType.LEVEL_2,
  name: 'Swarm Drones - Level 2',
  gridSize: GRID_SIZE,
  staticObstacles: [
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: 0 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: i, y: GRID_SIZE - 1 })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: 0, y: i })),
    ...Array.from({ length: GRID_SIZE }, (_, i) => ({ x: GRID_SIZE - 1, y: i })),
    // Dense obstacles
    { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 6 },
    { x: 18, y: 5 }, { x: 18, y: 6 }, { x: 19, y: 5 },
    { x: 5, y: 18 }, { x: 5, y: 19 }, { x: 6, y: 18 },
    { x: 18, y: 18 }, { x: 18, y: 19 }, { x: 19, y: 18 },
    { x: 12, y: 12 },
  ],
  movingObstacles: [
    {
      id: 'door1',
      x: 12,
      y: 5,
      pathX: [10, 14],
      pathY: [5, 5],
      speed: 1.5,
      phase: 0,
    },
  ],
  goalPositions: [],
  startPositions: [
    { x: 2, y: 2 },
    { x: 22, y: 2 },
    { x: 2, y: 22 },
    { x: 22, y: 22 },
  ],
  difficulty: 2,
  description: 'Complex maze with moving doors',
};

// ════════════════════════════════════════════════════════════════════════════
// REEF GUARDIANS
// ════════════════════════════════════════════════════════════════════════════

const REEF_GUARDIANS_LEVEL_1: LevelConfig = {
  id: LevelType.LEVEL_1,
  name: 'Reef Guardians - Level 1',
  gridSize: GRID_SIZE,
  staticObstacles: [
    // Coral clusters
    { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 6 },
    { x: 18, y: 18 }, { x: 19, y: 18 }, { x: 18, y: 19 },
    { x: 12, y: 12 },
  ],
  goalPositions: [{ x: 23, y: 23 }], // Algae grazing zone
  startPositions: Array.from({ length: 6 }, (_, i) => ({
    x: 1 + (i % 3),
    y: 1 + Math.floor(i / 3),
  })),
  difficulty: 1,
  description: 'Open reef with light predator threat',
};

const REEF_GUARDIANS_LEVEL_2: LevelConfig = {
  id: LevelType.LEVEL_2,
  name: 'Reef Guardians - Level 2',
  gridSize: GRID_SIZE,
  staticObstacles: [
    { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 6 }, { x: 7, y: 5 },
    { x: 18, y: 18 }, { x: 19, y: 18 }, { x: 18, y: 19 }, { x: 20, y: 18 },
    { x: 12, y: 12 }, { x: 12, y: 13 }, { x: 13, y: 12 },
  ],
  movingObstacles: [
    {
      id: 'predator1',
      x: 12,
      y: 1,
      pathX: [12, 12],
      pathY: [1, 20],
      speed: 1,
      phase: 0,
    },
  ],
  goalPositions: [{ x: 23, y: 23 }],
  startPositions: Array.from({ length: 6 }, (_, i) => ({
    x: 2 + (i % 3),
    y: 2 + Math.floor(i / 3),
  })),
  difficulty: 2,
  description: 'Reef with active predator',
};

// ════════════════════════════════════════════════════════════════════════════
// WAREHOUSE BOTS
// ════════════════════════════════════════════════════════════════════════════

const WAREHOUSE_BOTS_LEVEL_1: LevelConfig = {
  id: LevelType.LEVEL_1,
  name: 'Warehouse Bots - Level 1',
  gridSize: GRID_SIZE,
  staticObstacles: [
    // Shelves
    { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
    { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 },
    { x: 15, y: 15 }, { x: 15, y: 16 }, { x: 15, y: 17 },
  ],
  goalPositions: [{ x: 23, y: 23 }], // Dock station
  startPositions: [
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 2, y: 3 },
  ],
  difficulty: 1,
  description: 'Open warehouse with few obstacles',
};

const WAREHOUSE_BOTS_LEVEL_2: LevelConfig = {
  id: LevelType.LEVEL_2,
  name: 'Warehouse Bots - Level 2',
  gridSize: GRID_SIZE,
  staticObstacles: [
    // Dense shelves
    { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 6, y: 5 },
    { x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }, { x: 11, y: 10 },
    { x: 15, y: 15 }, { x: 15, y: 16 }, { x: 15, y: 17 }, { x: 16, y: 15 },
    { x: 12, y: 12 },
  ],
  movingObstacles: [
    {
      id: 'traffic1',
      x: 1,
      y: 12,
      pathX: [1, 23],
      pathY: [12, 12],
      speed: 0.8,
      phase: 0,
    },
  ],
  goalPositions: [{ x: 23, y: 23 }],
  startPositions: [
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 2, y: 3 },
  ],
  difficulty: 2,
  description: 'Crowded warehouse with traffic',
};

// ════════════════════════════════════════════════════════════════════════════
// SNOWPLOW FLEET
// ════════════════════════════════════════════════════════════════════════════

const SNOWPLOW_FLEET_LEVEL_1: LevelConfig = {
  id: LevelType.LEVEL_1,
  name: 'Snowplow Fleet - Level 1',
  gridSize: GRID_SIZE,
  staticObstacles: [
    // Parked cars
    { x: 5, y: 5 }, { x: 6, y: 5 },
    { x: 18, y: 18 }, { x: 18, y: 19 },
  ],
  goalPositions: [], // Routes, not points
  startPositions: [
    { x: 1, y: 12 },
    { x: 23, y: 12 },
  ],
  difficulty: 1,
  description: 'Light snow, minimal traffic',
};

const SNOWPLOW_FLEET_LEVEL_2: LevelConfig = {
  id: LevelType.LEVEL_2,
  name: 'Snowplow Fleet - Level 2',
  gridSize: GRID_SIZE,
  staticObstacles: [
    { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 },
    { x: 18, y: 18 }, { x: 18, y: 19 }, { x: 19, y: 18 },
    { x: 12, y: 10 }, { x: 12, y: 11 }, { x: 12, y: 12 },
  ],
  movingObstacles: [
    {
      id: 'traffic1',
      x: 1,
      y: 5,
      pathX: [1, 23],
      pathY: [5, 5],
      speed: 1.2,
      phase: 0,
    },
    {
      id: 'traffic2',
      x: 1,
      y: 18,
      pathX: [1, 23],
      pathY: [18, 18],
      speed: 1,
      phase: 1,
    },
  ],
  goalPositions: [],
  startPositions: [
    { x: 1, y: 12 },
    { x: 23, y: 12 },
  ],
  difficulty: 2,
  description: 'Heavy snow, heavy traffic',
};

// ════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ════════════════════════════════════════════════════════════════════════════

export const ENVIRONMENT_LEVELS: Record<EnvironmentType, Record<LevelType, LevelConfig>> = {
  [EnvironmentType.BUNNY_GARDEN]: {
    [LevelType.LEVEL_1]: BUNNY_GARDEN_LEVEL_1,
    [LevelType.LEVEL_2]: BUNNY_GARDEN_LEVEL_2,
  },
  [EnvironmentType.SWARM_DRONES]: {
    [LevelType.LEVEL_1]: SWARM_DRONES_LEVEL_1,
    [LevelType.LEVEL_2]: SWARM_DRONES_LEVEL_2,
  },
  [EnvironmentType.REEF_GUARDIANS]: {
    [LevelType.LEVEL_1]: REEF_GUARDIANS_LEVEL_1,
    [LevelType.LEVEL_2]: REEF_GUARDIANS_LEVEL_2,
  },
  [EnvironmentType.WAREHOUSE_BOTS]: {
    [LevelType.LEVEL_1]: WAREHOUSE_BOTS_LEVEL_1,
    [LevelType.LEVEL_2]: WAREHOUSE_BOTS_LEVEL_2,
  },
  [EnvironmentType.SNOWPLOW_FLEET]: {
    [LevelType.LEVEL_1]: SNOWPLOW_FLEET_LEVEL_1,
    [LevelType.LEVEL_2]: SNOWPLOW_FLEET_LEVEL_2,
  },
};

export const ENVIRONMENT_CONFIGS: Record<EnvironmentType, EnvironmentConfig> = {
  [EnvironmentType.BUNNY_GARDEN]: {
    id: EnvironmentType.BUNNY_GARDEN,
    name: 'Bunny Garden',
    description: 'Navigate carrots through maze obstacles to reach goals',
    levels: ENVIRONMENT_LEVELS[EnvironmentType.BUNNY_GARDEN],
  },
  [EnvironmentType.SWARM_DRONES]: {
    id: EnvironmentType.SWARM_DRONES,
    name: 'Swarm Drones',
    description: 'Coordinate aerial drones in 3D space avoiding no-fly zones',
    levels: ENVIRONMENT_LEVELS[EnvironmentType.SWARM_DRONES],
  },
  [EnvironmentType.REEF_GUARDIANS]: {
    id: EnvironmentType.REEF_GUARDIANS,
    name: 'Reef Guardians',
    description: 'Guide fish through underwater coral reefs with currents',
    levels: ENVIRONMENT_LEVELS[EnvironmentType.REEF_GUARDIANS],
  },
  [EnvironmentType.WAREHOUSE_BOTS]: {
    id: EnvironmentType.WAREHOUSE_BOTS,
    name: 'Warehouse Bots',
    description: 'Optimize robot pathfinding in warehouse grids with shelves',
    levels: ENVIRONMENT_LEVELS[EnvironmentType.WAREHOUSE_BOTS],
  },
  [EnvironmentType.SNOWPLOW_FLEET]: {
    id: EnvironmentType.SNOWPLOW_FLEET,
    name: 'Snowplow Fleet',
    description: 'Clear snow from city streets with traffic constraints',
    levels: ENVIRONMENT_LEVELS[EnvironmentType.SNOWPLOW_FLEET],
  },
};

export function getLevelConfig(env: EnvironmentType, level: LevelType): LevelConfig {
  return ENVIRONMENT_LEVELS[env][level];
}

export function getAllEnvironments(): EnvironmentType[] {
  return Object.values(EnvironmentType);
}

export function getEnvironmentName(env: EnvironmentType): string {
  return ENVIRONMENT_CONFIGS[env].name;
}

export function getEnvironmentDescription(env: EnvironmentType): string {
  return ENVIRONMENT_CONFIGS[env].description;
}
