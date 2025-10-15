import type { LevelConfig } from '@/types/game';
import { EnvironmentType } from '@/types/game';
import {
  buildObstacleSet,
  isBlockedByObstacle,
  isBlockedByMovingObstacle,
  isBlockedByAgent,
  updateMovingObstacles,
  clampToGrid,
} from "./BaseGameEngine";

export interface BotAgent {
  id: string;
  x: number;
  y: number;
  angle: number;
  battery: number; // 0-100
  carrying: boolean; // has package
  steps: number;
  reward: number;
  episodeReturn: number;
  done: boolean;
}

export class WarehouseBotsEngine {
  readonly environment = EnvironmentType.WAREHOUSE_BOTS;
  readonly observationShape = [34];
  readonly actionDim = 5; // discrete: [up, down, left, right, pick_drop]
  readonly actionSpace = "discrete";

  private agents: BotAgent[] = [];
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
  private packageLocations: Array<{ x: number; y: number; collected: boolean }> = [];
  private deliveryZones: Array<{ x: number; y: number }> = [];

  constructor(level: LevelConfig) {
    this.level = level;
    this.obstacles = buildObstacleSet(level);
    this.movingObstacles = level.movingObstacles || [];
    this.startPositions = [
      [2, 2],
      [2, 23],
      [23, 12],
    ];

    // Initialize packages at random valid locations (simplified)
    this.packageLocations = [
      { x: 5, y: 5, collected: false },
      { x: 10, y: 15, collected: false },
      { x: 20, y: 8, collected: false },
    ];

    // Delivery zones
    this.deliveryZones = [
      { x: 12, y: 2 },
      { x: 2, y: 12 },
      { x: 23, y: 23 },
    ];

    this.agents = this.startPositions.map((pos, idx) => ({
      id: `bot_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      battery: 100,
      carrying: false,
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
  }

  /**
   * Observation: [5x5 occupancy grid, battery, carrying, 5 neighbor offsets]
   * - 25 cells: local 5x5 grid around agent
   * - 1 battery: normalized energy
   * - 1 carrying: binary
   * - 8 neighbors: relative position offsets to 4 nearest bots (x,y each)
   */
  private buildObservation_impl(agent: BotAgent): number[] {
    const obs: number[] = [];

    // 5x5 occupancy grid centered on agent
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const checkX = agent.x + dx;
        const checkY = agent.y + dy;
        const occupied =
          this.isBlocked(checkX, checkY) ||
          this.agents.some(
            (a) => a.x === checkX && a.y === checkY && a.id !== agent.id
          )
            ? 1
            : 0;
        obs.push(occupied);
      }
    }

    // Battery
    obs.push(agent.battery / 100);

    // Carrying flag
    obs.push(agent.carrying ? 1 : 0);

    // Neighbor offsets (4 nearest agents)
    const otherAgents = this.agents.filter((a) => a.id !== agent.id);
    const nearby = otherAgents
      .sort(
        (a, b) =>
          Math.hypot(a.x - agent.x, a.y - agent.y) -
          Math.hypot(b.x - agent.x, b.y - agent.y)
      )
      .slice(0, 4);

    for (let i = 0; i < 4; i++) {
      if (i < nearby.length) {
        const dx = (nearby[i].x - agent.x) / 25;
        const dy = (nearby[i].y - agent.y) / 25;
        obs.push(dx);
        obs.push(dy);
      } else {
        obs.push(0);
        obs.push(0);
      }
    }

    return obs;
  }

  buildObservation(agent: BotAgent): Float32Array {
    const obs = this.buildObservation_impl(agent);
    return new Float32Array(obs);
  }

  /**
   * Discrete actions: 0=up, 1=down, 2=left, 3=right, 4=pick_drop
   */
  applyAction(agent: BotAgent, action: number): { newX: number; newY: number; blocked: boolean } {
    let newX = agent.x;
    let newY = agent.y;

    // Movement actions
    if (action === 0) {
      // up
      newY -= 1;
    } else if (action === 1) {
      // down
      newY += 1;
    } else if (action === 2) {
      // left
      newX -= 1;
    } else if (action === 3) {
      // right
      newX += 1;
    } else if (action === 4) {
      // pick_drop
      this.handlePickDrop(agent);
    }

    // Clamp to grid
    [newX, newY] = clampToGrid(newX, newY);

    // Check collision
    const blocked = this.isBlocked(newX, newY);

    // Consume battery
    agent.battery = Math.max(0, agent.battery - 0.3);

    return { newX, newY, blocked };
  }

  private handlePickDrop(agent: BotAgent): void {
    if (!agent.carrying) {
      // Try to pick up package
      for (const pkg of this.packageLocations) {
        if (!pkg.collected && Math.hypot(pkg.x - agent.x, pkg.y - agent.y) < 0.5) {
          agent.carrying = true;
          pkg.collected = true;
          break;
        }
      }
    } else {
      // Try to drop off package at delivery zone
      for (const zone of this.deliveryZones) {
        if (Math.hypot(zone.x - agent.x, zone.y - agent.y) < 0.5) {
          agent.carrying = false;
          break;
        }
      }
    }
  }

  private isBlocked(x: number, y: number): boolean {
    if (isBlockedByObstacle(x, y, this.obstacles)) return true;
    const movingObs = this.movingObstacles.map((mo) => ({ x: mo.x, y: mo.y }));
    if (movingObs.some((mo) => isBlockedByMovingObstacle(x, y, [mo]))) return true;
    const agentPositions = this.agents.map((a) => ({ x: a.x, y: a.y }));
    if (isBlockedByAgent(x, y, agentPositions)) return true;
    return false;
  }

  computeReward(agent: BotAgent, newX: number, newY: number, wasBlocked: boolean): number {
    let reward = -0.01; // step penalty

    if (wasBlocked) {
      reward -= 0.5; // collision penalty
    }

    // Delivery reward (check if near delivery zone while carrying)
    if (agent.carrying) {
      for (const zone of this.deliveryZones) {
        if (Math.hypot(zone.x - newX, zone.y - newY) < 1.0) {
          reward += 0.5; // proximity bonus
        }
      }
    } else {
      // Pickup reward (check if near package)
      for (const pkg of this.packageLocations) {
        if (!pkg.collected && Math.hypot(pkg.x - newX, pkg.y - newY) < 1.0) {
          reward += 0.3; // proximity bonus
        }
      }
    }

    return reward;
  }

  step(actions: number[]): {
    observations: Float32Array[];
    rewards: number[];
    dones: boolean[];
  } {
    updateMovingObstacles(this.movingObstacles, this.timestep);
    this.timestep++;

    const observations: Float32Array[] = [];
    const rewards: number[] = [];
    const dones: boolean[] = [];

    for (let i = 0; i < this.agents.length; i++) {
      const bot = this.agents[i];
      const action = actions[i];

      const { newX, newY, blocked } = this.applyAction(bot, action);

      if (!blocked && action !== 4) {
        bot.x = newX;
        bot.y = newY;
      }

      const reward = this.computeReward(bot, bot.x, bot.y, blocked);

      bot.steps++;
      bot.reward = reward;
      bot.episodeReturn += reward;

      const obs = this.buildObservation(bot);
      observations.push(obs);
      rewards.push(reward);

      const allCollected = this.packageLocations.every((p) => p.collected);
      const done =
        bot.steps >= this.maxSteps ||
        bot.battery <= 0 ||
        allCollected;
      bot.done = done;
      dones.push(done);
    }

    return { observations, rewards, dones };
  }

  reset(): BotAgent[] {
    this.timestep = 0;
    this.packageLocations.forEach((p) => {
      p.collected = false;
    });
    this.agents = this.startPositions.map((pos, idx) => ({
      id: `bot_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      battery: 100,
      carrying: false,
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
    return this.agents;
  }

  getAgents(): BotAgent[] {
    return this.agents;
  }

  getAgentState(id: string): BotAgent | undefined {
    return this.agents.find((a) => a.id === id);
  }

  getPackageLocations(): Array<{ x: number; y: number; collected: boolean }> {
    return this.packageLocations;
  }

  getDeliveryZones(): Array<{ x: number; y: number }> {
    return this.deliveryZones;
  }
}
