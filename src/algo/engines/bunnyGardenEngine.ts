/**
 * BUNNY GARDEN ENGINE
 * ===================
 * 
 * Game simulation for Bunny Garden environment.
 * Single discrete agent collecting carrots in a maze.
 */

import {
  LevelConfig,
  EnvironmentType,
  BunnyAgent,
  BunnyAction,
} from '@/types/game';

import {
  buildObstacleSet,
  isBlockedByObstacle,
  isBlockedByAgent,
  isBlockedByMovingObstacle,
  updateMovingObstacles,
  clampToGrid,
  isGoal,
} from './BaseGameEngine';

/**
 * Bunny Garden Engine
 * Simulates a single bunny maze environment
 */
export class BunnyGardenEngine {
  readonly environment = EnvironmentType.BUNNY_GARDEN;
  readonly observationShape = [5];
  readonly actionDim = 4;
  readonly actionSpace = 'discrete' as const;

  private agents: BunnyAgent[] = [];
  private obstacles: Set<string>;
  private movingObstacles: Array<{
    id: string;
    x: number;
    y: number;
    pathX: number[];
    pathY: number[];
    speed: number;
    phase: number;
  }>;
  private level: LevelConfig;
  private timestep = 0;
  private maxSteps = 500;

  constructor(level: LevelConfig) {
    this.level = level;
    this.obstacles = buildObstacleSet(level);
    this.movingObstacles = level.movingObstacles || [];

    // Initialize single bunny agent
    const startPos = level.startPositions[0];
    const agent: BunnyAgent = {
      id: 'bunny_0',
      x: startPos.x,
      y: startPos.y,
      done: false,
      reward: 0,
      episodeReturn: 0,
      steps: 0,
      energy: 1.0,
    };
    this.agents = [agent];
  }

  /**
   * Build observation for bunny
   */
  buildObservation(agent: BunnyAgent, level: LevelConfig): Float32Array {
    const goal = level.goalPositions[0] || { x: level.gridSize - 1, y: level.gridSize - 1 };

    return new Float32Array([
      agent.x,
      agent.y,
      goal.x,
      goal.y,
      agent.energy,
    ]);
  }

  /**
   * Compute reward
   */
  computeReward(
    agent: BunnyAgent,
    newX: number,
    newY: number,
    level: LevelConfig,
    wasBlocked: boolean
  ): number {
    let reward = -0.01; // Step penalty

    // Goal reached
    if (isGoal(newX, newY, level.goalPositions)) {
      reward += 1.0;
    }

    // Collision penalty
    if (wasBlocked) {
      reward -= 1.0;
    }

    return reward;
  }

  /**
   * Apply action to bunny
   */
  applyAction(agent: BunnyAgent, action: BunnyAction): {
    newX: number;
    newY: number;
    blocked: boolean;
  } {
    let newX = agent.x;
    let newY = agent.y;

    // Discrete movement
    switch (action) {
      case BunnyAction.UP:
        newY -= 1;
        break;
      case BunnyAction.DOWN:
        newY += 1;
        break;
      case BunnyAction.LEFT:
        newX -= 1;
        break;
      case BunnyAction.RIGHT:
        newX += 1;
        break;
    }

    // Clamp to grid
    [newX, newY] = clampToGrid(newX, newY);

    // Check collision
    const blocked = this.isBlocked(newX, newY);

    return { newX, newY, blocked };
  }

  /**
   * Check if position is blocked
   */
  isBlocked(x: number, y: number): boolean {
    return (
      isBlockedByObstacle(x, y, this.obstacles) ||
      isBlockedByMovingObstacle(x, y, this.movingObstacles) ||
      isBlockedByAgent(x, y, this.agents.map(a => ({ x: a.x, y: a.y })))
    );
  }

  /**
   * Check if position is goal
   */
  isGoalPosition(x: number, y: number): boolean {
    return isGoal(x, y, this.level.goalPositions);
  }

  /**
   * Step the game one timestep
   */
  step(actions: number[]): { observations: Float32Array[]; rewards: number[]; dones: boolean[] } {
    updateMovingObstacles(this.movingObstacles, this.timestep);
    this.timestep++;

    const observations: Float32Array[] = [];
    const rewards: number[] = [];
    const dones: boolean[] = [];

    for (let i = 0; i < this.agents.length; i++) {
      const bunny = this.agents[i];
      const action = actions[i] as BunnyAction;

      // Apply action
      const { newX, newY, blocked } = this.applyAction(bunny, action);

      // Update position
      if (!blocked) {
        bunny.x = newX;
        bunny.y = newY;
      }

      // Compute reward
      const reward = this.computeReward(bunny, bunny.x, bunny.y, this.level, blocked);

      // Update stats
      bunny.steps++;
      bunny.reward = reward;
      bunny.episodeReturn += reward;

      // Build observation
      const obs = this.buildObservation(bunny, this.level);
      observations.push(obs);
      rewards.push(reward);

      // Check if done
      const done = bunny.steps >= this.maxSteps || this.isGoalPosition(bunny.x, bunny.y);
      bunny.done = done;
      dones.push(done);
    }

    return { observations, rewards, dones };
  }

  /**
   * Reset the game
   */
  reset(): BunnyAgent[] {
    this.timestep = 0;
    this.agents = [];

    const resetAgent = this.level.startPositions[0];
    const bunny: BunnyAgent = {
      id: 'bunny_0',
      x: resetAgent.x,
      y: resetAgent.y,
      done: false,
      reward: 0,
      episodeReturn: 0,
      steps: 0,
      energy: 1.0,
    };

    this.agents = [bunny];
    return this.agents;
  }

  /**
   * Get current agents
   */
  getAgents(): BunnyAgent[] {
    return this.agents;
  }

  /**
   * Get agent state
   */
  getAgentState(id: string): BunnyAgent | undefined {
    return this.agents.find(a => a.id === id);
  }
}

export function createBunnyGardenEngine(level: LevelConfig): BunnyGardenEngine {
  return new BunnyGardenEngine(level);
}
