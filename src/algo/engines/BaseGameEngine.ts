/**
 * ENGINE UTILITIES
 * ================
 * 
 * Shared helper functions for all game engines.
 * Provides collision detection, pathfinding, and state helpers.
 */

import {
  LevelConfig,
  GRID_MAX,
  GRID_ORIGIN,
} from '@/types/game';

/**
 * Build obstacle set from level config for fast collision checking
 */
export function buildObstacleSet(level: LevelConfig): Set<string> {
  const set = new Set<string>();
  for (const obs of level.staticObstacles) {
    set.add(`${Math.round(obs.x)},${Math.round(obs.y)}`);
  }
  return set;
}

/**
 * Check if position is blocked by static obstacles
 */
export function isBlockedByObstacle(
  x: number,
  y: number,
  obstacles: Set<string>
): boolean {
  // Check bounds
  if (x < GRID_ORIGIN.x || x > GRID_MAX.x || y < GRID_ORIGIN.y || y > GRID_MAX.y) {
    return true;
  }

  // Check static obstacles
  if (obstacles.has(`${Math.round(x)},${Math.round(y)}`)) {
    return true;
  }

  return false;
}

/**
 * Check if position is blocked by moving obstacle
 */
export function isBlockedByMovingObstacle(
  x: number,
  y: number,
  movingObstacles: Array<{
    x: number;
    y: number;
  }>
): boolean {
  for (const mo of movingObstacles) {
    if (Math.abs(mo.x - x) < 0.5 && Math.abs(mo.y - y) < 0.5) {
      return true;
    }
  }
  return false;
}

/**
 * Check if position is blocked by other agents
 */
export function isBlockedByAgent(
  x: number,
  y: number,
  agentPositions: Array<{ x: number; y: number }>,
  excludeIndex?: number
): boolean {
  for (let i = 0; i < agentPositions.length; i++) {
    if (excludeIndex !== undefined && i === excludeIndex) continue;
    const agent = agentPositions[i];
    if (Math.abs(agent.x - x) < 0.5 && Math.abs(agent.y - y) < 0.5) {
      return true;
    }
  }
  return false;
}

/**
 * Update moving obstacles position based on timestep
 */
export function updateMovingObstacles(
  movingObstacles: Array<{
    id: string;
    x: number;
    y: number;
    pathX: number[];
    pathY: number[];
    speed: number;
    phase: number;
  }>,
  timestep: number
): void {
  for (const mo of movingObstacles) {
    // Simple linear path interpolation
    const pathLengthX = Math.max(...mo.pathX) - Math.min(...mo.pathX);
    const pathLengthY = Math.max(...mo.pathY) - Math.min(...mo.pathY);
    const totalDist = Math.sqrt(pathLengthX ** 2 + pathLengthY ** 2);

    if (totalDist === 0) continue; // Static "moving" obstacle

    const cycleTime = totalDist / mo.speed;
    const timeInCycle = (timestep + mo.phase) % cycleTime;
    const progress = timeInCycle / cycleTime;

    // Interpolate position along path
    const minX = Math.min(...mo.pathX);
    const maxX = Math.max(...mo.pathX);
    const minY = Math.min(...mo.pathY);
    const maxY = Math.max(...mo.pathY);

    if (maxX > minX) {
      mo.x = minX + (maxX - minX) * progress;
    }
    if (maxY > minY) {
      mo.y = minY + (maxY - minY) * progress;
    }
  }
}

/**
 * Compute Euclidean distance
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Clamp position to grid bounds
 */
export function clampToGrid(x: number, y: number): [number, number] {
  return [
    Math.max(GRID_ORIGIN.x, Math.min(GRID_MAX.x, x)),
    Math.max(GRID_ORIGIN.y, Math.min(GRID_MAX.y, y)),
  ];
}

/**
 * Check if position is a goal
 */
export function isGoal(x: number, y: number, goals: Array<{ x: number; y: number }>): boolean {
  for (const goal of goals) {
    if (Math.abs(goal.x - x) < 0.1 && Math.abs(goal.y - y) < 0.1) {
      return true;
    }
  }
  return false;
}

/**
 * Get closest agent
 */
export function getClosestAgent(
  x: number,
  y: number,
  agents: Array<{ x: number; y: number }>,
  excludeIndex?: number
): { index: number; distance: number } | null {
  let closest: { index: number; distance: number } | null = null;

  for (let i = 0; i < agents.length; i++) {
    if (excludeIndex !== undefined && i === excludeIndex) continue;
    const d = distance(x, y, agents[i].x, agents[i].y);
    if (!closest || d < closest.distance) {
      closest = { index: i, distance: d };
    }
  }

  return closest;
}

/**
 * Get all agents within range
 */
export function getAgentsInRange(
  x: number,
  y: number,
  range: number,
  agents: Array<{ x: number; y: number }>,
  excludeIndex?: number
): number[] {
  const result: number[] = [];

  for (let i = 0; i < agents.length; i++) {
    if (excludeIndex !== undefined && i === excludeIndex) continue;
    const d = distance(x, y, agents[i].x, agents[i].y);
    if (d <= range) {
      result.push(i);
    }
  }

  return result;
}

/**
 * Normalize angle to [-π, π]
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= 2 * Math.PI;
  while (normalized < -Math.PI) normalized += 2 * Math.PI;
  return normalized;
}

/**
 * Convert grid position to float array normalized to [-1, 1]
 */
export function normalizePosition(x: number, y: number): [number, number] {
  const normX = (x - GRID_ORIGIN.x) / (GRID_MAX.x - GRID_ORIGIN.x) * 2 - 1;
  const normY = (y - GRID_ORIGIN.y) / (GRID_MAX.y - GRID_ORIGIN.y) * 2 - 1;
  return [normX, normY];
}
