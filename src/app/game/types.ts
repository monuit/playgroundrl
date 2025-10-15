/**
 * Game system types and constants
 */

// Grid configuration
export const GRID_SIZE = 25;
export const TILE_SIZE = 1;

// Action space: discrete 4 directions
export enum Action {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
}

// Agent state
export interface Agent {
  id: string;
  x: number;
  y: number;
  goalX: number;
  goalY: number;
  done: boolean;
  reward: number;
  episodeReturn: number;
  steps: number;
}

// Level configuration
export interface LevelConfig {
  id: string;
  name: string;
  gridSize: number;
  staticObstacles: Array<[number, number]>;
  movingObstacles?: MovingObstacle[];
  goalPosition: [number, number];
  startPositions: Array<[number, number]>;
}

// Moving obstacle descriptor
export interface MovingObstacle {
  id: string;
  x: number;
  y: number;
  pathX: [number, number]; // [min, max] for x oscillation
  pathY: [number, number]; // [min, max] for y oscillation
  speed: number; // units per second
  phase: number; // time offset
}

// Observation vector for the policy
export interface Observation {
  agentX: number;
  agentY: number;
  goalX: number;
  goalY: number;
  distToGoal: number;
  // Level 2 additions:
  visionRays?: number[]; // distance samples from agent
}

// Game state
export interface GameState {
  level: LevelConfig;
  agents: Agent[];
  tick: number;
  paused: boolean;
  tickDuration: number; // ms
  seed?: number;
}

// ONNX inference result
export interface InferenceResult {
  action: Action;
  logits: number[];
}
