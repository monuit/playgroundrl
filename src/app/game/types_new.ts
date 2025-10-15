/**
 * CORE TYPE SYSTEM - Multi-Environment RL Playground
 * ===================================================
 * 
 * Defines all types, interfaces, and enums across all environments.
 */

// ════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT TYPES
// ════════════════════════════════════════════════════════════════════════════

export enum EnvironmentType {
  BUNNY_GARDEN = 'bunny_garden',
  SWARM_DRONES = 'swarm_drones',
  REEF_GUARDIANS = 'reef_guardians',
  WAREHOUSE_BOTS = 'warehouse_bots',
  SNOWPLOW_FLEET = 'snowplow_fleet',
}

export enum LevelType {
  LEVEL_1 = 'level_1',
  LEVEL_2 = 'level_2',
}

export enum AlgorithmType {
  PPO = 'ppo',
  DQN = 'dqn',
}

// ════════════════════════════════════════════════════════════════════════════
// GRID CONFIGURATION (GLOBAL)
// ════════════════════════════════════════════════════════════════════════════

export const GRID_SIZE = 25;
export const TILE_SIZE = 1;
export const GRID_ORIGIN = { x: 0, y: 0 };
export const GRID_MAX = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };

// ════════════════════════════════════════════════════════════════════════════
// GENERIC AGENT TYPE
// ════════════════════════════════════════════════════════════════════════════

export interface BaseAgent {
  id: string;
  x: number;
  y: number;
  done: boolean;
  reward: number;
  episodeReturn: number;
  steps: number;
}

/**
 * Bunny Garden specific fields
 */
export interface BunnyAgent extends BaseAgent {
  energy: number;
}

/**
 * Swarm Drones specific fields
 */
export interface DroneAgent extends BaseAgent {
  battery: number; // 0-100
  angle: number; // radians
  visited: Set<string>; // tile hashes
  lidarRays: number[]; // 8-16 distance readings
}

/**
 * Reef Guardians specific fields
 */
export interface FishAgent extends BaseAgent {
  energy: number;
  schoolId: number; // which school this fish belongs to
  predatorThreat: number; // 0-1, proximity to nearest predator
}

/**
 * Warehouse Bots specific fields
 */
export interface BotAgent extends BaseAgent {
  battery: number;
  carrying: boolean;
  jobId: string | null;
  docked: boolean;
}

/**
 * Snowplow Fleet specific fields
 */
export interface PlowAgent extends BaseAgent {
  angle: number; // blade angle
  salt: number; // remaining salt
  fuel: number; // remaining fuel
  cleared: number; // meters cleared this episode
}

// Generic agent type for polymorphic use
export type Agent = BunnyAgent | DroneAgent | FishAgent | BotAgent | PlowAgent;

// ════════════════════════════════════════════════════════════════════════════
// OBSERVATION TYPES
// ════════════════════════════════════════════════════════════════════════════

/**
 * Base observation (all envs have this)
 */
export interface BaseObservation {
  agentX: number;
  agentY: number;
  goalX: number;
  goalY: number;
  distanceToGoal: number;
}

export interface BunnyObservation extends BaseObservation {
  energy: number;
}

export interface DroneObservation extends BaseObservation {
  battery: number;
  angle: number;
  lidarRays: number[]; // 8-16 values
  neighborOffsets: number[]; // [dx1, dy1, dx2, dy2, ...]
  visitedTileBit: number; // 0 or 1
}

export interface FishObservation extends BaseObservation {
  energy: number;
  sectorAlgae: number[]; // 6-8 sectors
  predatorDirection: number; // 0-2π
  schoolCentroidX: number;
  schoolCentroidY: number;
}

export interface BotObservation extends BaseObservation {
  battery: number;
  occupancyGrid: number[][]; // 5x5 local occupancy
  jobQueueSignal: number; // pending orders
  neighborVelocities: number[]; // [vx1, vy1, vx2, vy2, ...]
  carrying: number; // 0 or 1
}

export interface PlowObservation extends BaseObservation {
  angle: number;
  snowDepth: number[];  // local depth map
  trafficDensity: number[]; // nearby vehicles
  salt: number;
  fuel: number;
}

export type Observation =
  | BunnyObservation
  | DroneObservation
  | FishObservation
  | BotObservation
  | PlowObservation;

// ════════════════════════════════════════════════════════════════════════════
// ACTION TYPES
// ════════════════════════════════════════════════════════════════════════════

export enum BunnyAction {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
}

export interface DroneAction {
  turn: number; // -15° to +15°
  thrust: number; // 0-1
  hover: boolean; // hover/scan or move
  returnToBase: boolean;
}

export interface FishAction {
  steerAngle: number; // -π/4 to π/4
  boost: boolean;
  schoolToggle: boolean; // join/leave school
}

export enum BotAction {
  MOVE_FORWARD = 0,
  TURN_LEFT = 1,
  TURN_RIGHT = 2,
  DOCK = 3,
  CHARGE = 4,
}

export interface PlowAction {
  steerAngle: number;
  speed: number; // 0-1
  plowAngle: number; // blade angle
  saltSpread: boolean;
}

export type Action = BunnyAction | DroneAction | FishAction | BotAction | PlowAction;

// ════════════════════════════════════════════════════════════════════════════
// LEVEL CONFIGURATIONS
// ════════════════════════════════════════════════════════════════════════════

export interface LevelConfig {
  id: LevelType;
  name: string;
  gridSize: number;
  staticObstacles: Array<{ x: number; y: number }>;
  movingObstacles?: Array<{
    id: string;
    x: number;
    y: number;
    pathX: [number, number];
    pathY: [number, number];
    speed: number;
    phase: number;
  }>;
  goalPositions: Array<{ x: number; y: number }>;
  startPositions: Array<{ x: number; y: number }>;
  difficulty: number; // 1-10
  description: string;
}

// ════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIG
// ════════════════════════════════════════════════════════════════════════════

export interface EnvironmentConfig {
  type: EnvironmentType;
  name: string;
  agentType: string;
  agentCount: number;
  levels: {
    [key in LevelType]: LevelConfig;
  };
  observationShape: number[];
  actionSpace: 'discrete' | 'continuous';
  actionDim: number;
  algorithms: AlgorithmType[];
  description: string;
}

// ════════════════════════════════════════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════════════════════════════════════════

export interface GameState {
  environment: EnvironmentType;
  level: LevelType;
  algorithm: AlgorithmType;
  tick: number;
  paused: boolean;
  tickDuration: number; // ms per step
  agents: Agent[];
  config: EnvironmentConfig;
}

// ════════════════════════════════════════════════════════════════════════════
// STEP RESULT (returned by engine)
// ════════════════════════════════════════════════════════════════════════════

export interface StepResult {
  agentId: string;
  reward: number;
  done: boolean;
  observation: Observation;
  action: Action;
  nextObservation: Observation;
}

// ════════════════════════════════════════════════════════════════════════════
// INFERENCE RESULT
// ════════════════════════════════════════════════════════════════════════════

export interface InferenceResult {
  action: Action;
  logitsOrQValues: number[];
  modelName: string;
  algorithm: AlgorithmType;
}

// ════════════════════════════════════════════════════════════════════════════
// ENGINE INTERFACE (implemented by each environment)
// ════════════════════════════════════════════════════════════════════════════

export interface GameEngine {
  readonly environment: EnvironmentType;
  readonly observationShape: number[];
  readonly actionDim: number;
  readonly actionSpace: 'discrete' | 'continuous';

  // Core methods
  buildObservation(agent: Agent, config: LevelConfig): Float32Array;
  computeReward(prevPos: { x: number; y: number }, newPos: { x: number; y: number }, config: LevelConfig): number;
  applyAction(agent: Agent, action: Action, config: LevelConfig): { newX: number; newY: number; blocked: boolean };
  isBlocked(x: number, y: number, config: LevelConfig): boolean;
  isGoal(x: number, y: number, config: LevelConfig): boolean;

  // Step function
  stepGame(agents: Agent[], config: LevelConfig): Promise<StepResult[]>;
  resetGame(agents: Agent[], config: LevelConfig): Agent[];
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

// Initialize with placeholder levels - will be populated by environment modules
const createEnvironmentConfig = (
  type: EnvironmentType,
  name: string,
  agentType: string,
  agentCount: number,
  observationShape: number[],
  actionSpace: 'discrete' | 'continuous',
  actionDim: number,
  description: string,
): EnvironmentConfig => ({
  type,
  name,
  agentType,
  agentCount,
  observationShape,
  actionSpace,
  actionDim,
  algorithms: [AlgorithmType.PPO, AlgorithmType.DQN],
  description,
  levels: {
    [LevelType.LEVEL_1]: {
      id: LevelType.LEVEL_1,
      name: `${name} - Level 1`,
      gridSize: GRID_SIZE,
      staticObstacles: [],
      goalPositions: [{ x: 23, y: 23 }],
      startPositions: [{ x: 1, y: 1 }],
      difficulty: 1,
      description: 'Basic level',
    },
    [LevelType.LEVEL_2]: {
      id: LevelType.LEVEL_2,
      name: `${name} - Level 2`,
      gridSize: GRID_SIZE,
      staticObstacles: [],
      movingObstacles: [],
      goalPositions: [{ x: 23, y: 23 }],
      startPositions: [{ x: 1, y: 1 }],
      difficulty: 2,
      description: 'Advanced level',
    },
  },
});

export const ENVIRONMENT_CONFIGS: Record<EnvironmentType, EnvironmentConfig> = {
  [EnvironmentType.BUNNY_GARDEN]: createEnvironmentConfig(
    EnvironmentType.BUNNY_GARDEN,
    'Bunny Garden',
    'bunny',
    1,
    [5],
    'discrete',
    4,
    'Gentle exploration with treat collection',
  ),
  [EnvironmentType.SWARM_DRONES]: createEnvironmentConfig(
    EnvironmentType.SWARM_DRONES,
    'Swarm Drones',
    'drone',
    4,
    [26],
    'continuous',
    4,
    'Tiny quadcopters exploring a neon maze',
  ),
  [EnvironmentType.REEF_GUARDIANS]: createEnvironmentConfig(
    EnvironmentType.REEF_GUARDIANS,
    'Reef Guardians',
    'fish',
    6,
    [15],
    'continuous',
    3,
    'Fish herd algae grazers vs predators',
  ),
  [EnvironmentType.WAREHOUSE_BOTS]: createEnvironmentConfig(
    EnvironmentType.WAREHOUSE_BOTS,
    'Warehouse Bots',
    'bot',
    3,
    [34],
    'discrete',
    5,
    'Kiva-style bots fetching shelves',
  ),
  [EnvironmentType.SNOWPLOW_FLEET]: createEnvironmentConfig(
    EnvironmentType.SNOWPLOW_FLEET,
    'Snowplow Fleet',
    'plow',
    2,
    [30],
    'continuous',
    4,
    'Clear city blocks in ongoing snow',
  ),
};
