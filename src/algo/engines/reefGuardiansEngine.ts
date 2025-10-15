import type { LevelConfig } from "@/app/game/types_new";
import { EnvironmentType } from "@/app/game/types_new";
import {
  buildObstacleSet,
  isBlockedByObstacle,
  isBlockedByMovingObstacle,
  isBlockedByAgent,
  updateMovingObstacles,
  clampToGrid,
  normalizeAngle,
} from "./BaseGameEngine";

export interface FishAgent {
  id: string;
  x: number;
  y: number;
  angle: number;
  energy: number; // 0-100
  steps: number;
  reward: number;
  episodeReturn: number;
  done: boolean;
}

export class ReefGuardiansEngine {
  readonly environment = EnvironmentType.REEF_GUARDIANS;
  readonly observationShape = [15];
  readonly actionDim = 3; // continuous: [steer, boost, school_toggle]
  readonly actionSpace = "continuous";

  private agents: FishAgent[] = [];
  private obstacles: Set<string>;
  private movingObstacles: Array<{
    id: string;
    x: number;
    y: number;
    pathX: [number, number];
    pathY: [number, number];
    speed: number;
    phase: number;
  }>;
  private level: LevelConfig;
  private timestep: number = 0;
  private maxSteps: number = 500;
  private startPositions: Array<[number, number]>;
  private predatorX: number = 12;
  private predatorY: number = 12;

  constructor(level: LevelConfig) {
    this.level = level;
    this.obstacles = buildObstacleSet(level);
    this.movingObstacles = level.movingObstacles || [];
    this.startPositions = [
      [5, 5],
      [7, 5],
      [9, 5],
      [5, 7],
      [7, 7],
      [9, 7],
    ];

    this.agents = this.startPositions.map((pos, idx) => ({
      id: `fish_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      energy: 100,
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
  }

  /**
   * Observation: [8 sector algae, predator_dir, school_centroid, energy]
   * 8 sectors around agent, predator direction, distance to school center, remaining energy
   */
  private buildObservation_impl(agent: FishAgent): number[] {
    const obs: number[] = [];

    // 8-sector algae density (simplified as uniform)
    for (let i = 0; i < 8; i++) {
      const sectorAngle = (2 * Math.PI * i) / 8;
      // Simple heuristic: algae density based on distance from walls
      const checkX = agent.x + Math.cos(sectorAngle) * 3;
      const checkY = agent.y + Math.sin(sectorAngle) * 3;
      const density = this.isBlocked(checkX, checkY) ? 0 : 1;
      obs.push(density);
    }

    // Predator direction (angle from agent to predator, normalized)
    const predatorAngle = Math.atan2(this.predatorY - agent.y, this.predatorX - agent.x);
    const predatorRelAngle = normalizeAngle(predatorAngle - agent.angle) / Math.PI; // [-1, 1]
    obs.push(predatorRelAngle);

    // School centroid distance
    let centerX = 0,
      centerY = 0;
    for (const fish of this.agents) {
      centerX += fish.x;
      centerY += fish.y;
    }
    centerX /= this.agents.length;
    centerY /= this.agents.length;
    const schoolDist = Math.hypot(centerX - agent.x, centerY - agent.y) / 10; // normalize
    obs.push(Math.min(schoolDist, 1.0));

    // Energy
    obs.push(agent.energy / 100);

    return obs;
  }

  buildObservation(agent: FishAgent): Float32Array {
    const obs = this.buildObservation_impl(agent);
    return new Float32Array(obs);
  }

  /**
   * Continuous action: [steer (-1 to 1), boost (0 or 1), school_toggle (0 or 1)]
   */
  applyAction(agent: FishAgent, action: number[]): { newX: number; newY: number; blocked: boolean } {
    const [steer, boost, schoolToggle] = action;

    // Update angle
    agent.angle += steer * 0.2;
    agent.angle = normalizeAngle(agent.angle);

    // Compute movement
    let moveSpeed = 0.3;
    if (boost > 0.5) {
      moveSpeed = 0.6;
      agent.energy = Math.max(0, agent.energy - 1.0); // boost costs energy
    }

    // School cohesion if toggled
    if (schoolToggle > 0.5) {
      let centerX = 0,
        centerY = 0;
      for (const fish of this.agents) {
        centerX += fish.x;
        centerY += fish.y;
      }
      centerX /= this.agents.length;
      centerY /= this.agents.length;

      const schoolAngle = Math.atan2(centerY - agent.y, centerX - agent.x);
      agent.angle = schoolAngle;
      moveSpeed *= 0.8; // slightly slower when schooling
    }

    let newX = agent.x + Math.cos(agent.angle) * moveSpeed;
    let newY = agent.y + Math.sin(agent.angle) * moveSpeed;

    // Clamp to grid
    [newX, newY] = clampToGrid(newX, newY);

    // Check collision
    const blocked = this.isBlocked(newX, newY);

    // Consume energy
    agent.energy = Math.max(0, agent.energy - 0.2);

    return { newX, newY, blocked };
  }

  private isBlocked(x: number, y: number): boolean {
    if (isBlockedByObstacle(x, y, this.obstacles)) return true;
    const movingObs = this.movingObstacles.map((mo) => ({ x: mo.x, y: mo.y }));
    if (movingObs.some((mo) => isBlockedByMovingObstacle(x, y, [mo]))) return true;
    const agentPositions = this.agents.map((a) => ({ x: a.x, y: a.y }));
    if (isBlockedByAgent(x, y, agentPositions)) return true;
    return false;
  }

  private isGoalPosition(x: number, y: number): boolean {
    return this.level.goalPositions.some((goal) => Math.hypot(goal.x - x, goal.y - y) < 0.5);
  }

  computeReward(agent: FishAgent, newX: number, newY: number, wasBlocked: boolean): number {
    let reward = -0.01; // step penalty

    if (wasBlocked) {
      reward -= 1.0;
    }

    // Algae consumption reward (simplified)
    reward += 0.05;

    // School cohesion reward
    let centerX = 0,
      centerY = 0;
    for (const fish of this.agents) {
      centerX += fish.x;
      centerY += fish.y;
    }
    centerX /= this.agents.length;
    centerY /= this.agents.length;
    const schoolDist = Math.hypot(centerX - newX, centerY - newY);
    if (schoolDist < 3) {
      reward += 0.1; // bonus for staying close to school
    }

    // Predator avoidance penalty
    const predatorDist = Math.hypot(this.predatorX - newX, this.predatorY - newY);
    if (predatorDist < 2) {
      reward -= 1.0; // strong negative for being caught
    } else if (predatorDist < 5) {
      reward -= 0.2; // weak penalty for being close
    }

    return reward;
  }

  step(actions: number[][]): {
    observations: Float32Array[];
    rewards: number[];
    dones: boolean[];
  } {
    updateMovingObstacles(this.movingObstacles, this.timestep);
    this.timestep++;

    // Update predator position (simple movement in Level 2)
    if (this.level.difficulty > 5) {
      // Level 2: predator moves
      const predatorSpeed = 0.3;
      const predatorAngle = Math.sin(this.timestep * 0.05) * Math.PI;
      this.predatorX += Math.cos(predatorAngle) * predatorSpeed;
      this.predatorY = Math.sin(this.timestep * 0.1) * 12 + 12; // oscillate on Y
    }

    const observations: Float32Array[] = [];
    const rewards: number[] = [];
    const dones: boolean[] = [];

    for (let i = 0; i < this.agents.length; i++) {
      const fish = this.agents[i];
      const action = actions[i];

      const { newX, newY, blocked } = this.applyAction(fish, action);

      if (!blocked) {
        fish.x = newX;
        fish.y = newY;
      }

      const reward = this.computeReward(fish, fish.x, fish.y, blocked);

      fish.steps++;
      fish.reward = reward;
      fish.episodeReturn += reward;

      const obs = this.buildObservation(fish);
      observations.push(obs);
      rewards.push(reward);

      const done =
        fish.steps >= this.maxSteps ||
        fish.energy <= 0 ||
        this.isGoalPosition(fish.x, fish.y);
      fish.done = done;
      dones.push(done);
    }

    return { observations, rewards, dones };
  }

  reset(): FishAgent[] {
    this.timestep = 0;
    this.predatorX = 12;
    this.predatorY = 12;
    this.agents = this.startPositions.map((pos, idx) => ({
      id: `fish_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      energy: 100,
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
    return this.agents;
  }

  getAgents(): FishAgent[] {
    return this.agents;
  }

  getAgentState(id: string): FishAgent | undefined {
    return this.agents.find((a) => a.id === id);
  }
}
