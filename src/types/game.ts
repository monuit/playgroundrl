/**
 * GAME TYPES
 * ==========
 * 
 * Shared types for game environments, levels, and agents.
 */

// ════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT & LEVEL TYPES
// ════════════════════════════════════════════════════════════════════════════

export enum EnvironmentType {
  BUNNY_GARDEN = "bunny_garden",
  SWARM_DRONES = "swarm_drones",
  REEF_GUARDIANS = "reef_guardians",
  WAREHOUSE_BOTS = "warehouse_bots",
  SNOWPLOW_FLEET = "snowplow_fleet",
}

export enum LevelType {
  LEVEL_1 = "level_1",
  LEVEL_2 = "level_2",
}

export const GRID_SIZE = 25;

// ════════════════════════════════════════════════════════════════════════════
// LEVEL CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

export interface Position {
  x: number;
  y: number;
}

export interface Position3D extends Position {
  z: number;
}

export interface MovingObstacle extends Position {
  id?: string;
  pathX: number[];
  pathY: number[];
  speed: number;
  phase: number;
}

export interface LevelConfig {
  id: LevelType;
  name: string;
  gridSize: number;
  staticObstacles: Position[];
  movingObstacles?: MovingObstacle[];
  goalPositions: Position[];
  startPositions: Position[];
  difficulty: number;
  description: string;
  timeLimit?: number;
  rewards?: {
    goal: number;
    step: number;
    collision: number;
  };
}

// ════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

export interface EnvironmentConfig {
  id: EnvironmentType;
  name: string;
  description: string;
  levels: {
    [LevelType.LEVEL_1]: LevelConfig;
    [LevelType.LEVEL_2]: LevelConfig;
  };
}

// ENVIRONMENT_CONFIGS is defined and exported from @/app/env/index.ts

// ════════════════════════════════════════════════════════════════════════════
// AGENT TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface BaseAgent {
  id: string;
  position: Position;
  velocity?: Position;
  rotation?: number;
}

export interface BunnyAgent extends BaseAgent {
  type: "bunny";
  energy: number;
}

export interface DroneAgent extends BaseAgent {
  type: "drone";
  battery: number;
  altitude: number;
}

export interface FishAgent extends BaseAgent {
  type: "fish";
  oxygen: number;
  depth: number;
}

export interface BotAgent extends BaseAgent {
  type: "bot";
  cargo: number;
  capacity: number;
}

export interface PlowAgent extends BaseAgent {
  type: "plow";
  fuel: number;
  coverage: number;
}

export type Agent = BunnyAgent | DroneAgent | FishAgent | BotAgent | PlowAgent;

// ════════════════════════════════════════════════════════════════════════════
// SCENE COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

export interface SceneProps {
  levelConfig: LevelConfig;
  agents?: Agent[];
  showGrid?: boolean;
}
