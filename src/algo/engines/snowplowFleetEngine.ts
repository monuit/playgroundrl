import type { LevelConfig } from '@/types/game';
import { EnvironmentType } from '@/types/game';
import {
  buildObstacleSet,
  isBlockedByObstacle,
  isBlockedByMovingObstacle,
  isBlockedByAgent,
  updateMovingObstacles,
  clampToGrid,
  normalizeAngle,
} from "./BaseGameEngine";

export interface PlowAgent {
  id: string;
  x: number;
  y: number;
  angle: number;
  fuel: number; // 0-100
  visited: Set<string>; // "x,y" tiles cleared
  steps: number;
  reward: number;
  episodeReturn: number;
  done: boolean;
}

export class SnowplowFleetEngine {
  readonly environment = EnvironmentType.SNOWPLOW_FLEET;
  readonly observationShape = [30];
  readonly actionDim = 3; // continuous: [steer, throttle, blade_toggle]
  readonly actionSpace = "continuous";

  private agents: PlowAgent[] = [];
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
  private snowDepth: Map<string, number> = new Map(); // "x,y" -> depth 0-10
  private trafficZones: Array<{ x: number; y: number; intensity: number }> = [];

  constructor(level: LevelConfig) {
    this.level = level;
    this.obstacles = buildObstacleSet(level);
    this.movingObstacles = level.movingObstacles || [];
    this.startPositions = [
      [2, 12],
      [23, 12],
    ];

    // Initialize snow depth on all reachable tiles
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        if (!this.isBlocked(x, y)) {
          this.snowDepth.set(`${x},${y}`, Math.random() * 8 + 2); // 2-10 depth
        }
      }
    }

    // Traffic zones where plowing provides extra reward
    this.trafficZones = [
      { x: 6, y: 12, intensity: 0.8 },
      { x: 19, y: 12, intensity: 0.7 },
      { x: 12, y: 6, intensity: 0.6 },
    ];

    this.agents = this.startPositions.map((pos, idx) => ({
      id: `plow_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      fuel: 100,
      visited: new Set(),
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
  }

  /**
   * Observation: [16 forward/side distance, traffic_ahead, fuel, coverage, 8 neighbor offsets]
   * - 8 forward rays: depth sensing (distance to obstacles)
   * - 8 side rays: perpendicular sensing
   * - 1 traffic intensity ahead
   * - 1 fuel level
   * - 1 coverage percentage
   * - 4 agents: relative offsets (x,y each)
   */
  private buildObservation_impl(agent: PlowAgent): number[] {
    const obs: number[] = [];

    // 8 forward rays (distributed ±30° from heading)
    for (let i = 0; i < 8; i++) {
      const rayAngle = agent.angle + (i - 3.5) * (Math.PI / 12);
      let distance = 10;
      for (let d = 0.5; d <= 10; d += 0.5) {
        const checkX = agent.x + Math.cos(rayAngle) * d;
        const checkY = agent.y + Math.sin(rayAngle) * d;
        if (this.isBlocked(checkX, checkY)) {
          distance = d;
          break;
        }
      }
      obs.push(distance / 10);
    }

    // 8 side rays (perpendicular sensing)
    for (let i = 0; i < 8; i++) {
      const rayAngle = agent.angle + Math.PI / 2 + (i - 3.5) * (Math.PI / 12);
      let distance = 10;
      for (let d = 0.5; d <= 10; d += 0.5) {
        const checkX = agent.x + Math.cos(rayAngle) * d;
        const checkY = agent.y + Math.sin(rayAngle) * d;
        if (this.isBlocked(checkX, checkY)) {
          distance = d;
          break;
        }
      }
      obs.push(distance / 10);
    }

    // Traffic intensity ahead
    let trafficAhead = 0;
    for (const zone of this.trafficZones) {
      const dx = zone.x - agent.x;
      const dy = zone.y - agent.y;
      const angleToZone = Math.atan2(dy, dx);
      const angleDiff = Math.abs(normalizeAngle(angleToZone - agent.angle));
      if (angleDiff < Math.PI / 4) {
        trafficAhead = Math.max(trafficAhead, zone.intensity);
      }
    }
    obs.push(trafficAhead);

    // Fuel
    obs.push(agent.fuel / 100);

    // Coverage percentage
    let clearedTiles = 0;
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        const key = `${x},${y}`;
        if ((this.snowDepth.get(key) || 0) === 0 || agent.visited.has(key)) {
          clearedTiles++;
        }
      }
    }
    const coverage = clearedTiles / 625; // 25x25 = 625 tiles
    obs.push(Math.min(coverage, 1.0));

    // Neighbor offsets (other plow)
    const otherAgents = this.agents.filter((a) => a.id !== agent.id);
    for (const other of otherAgents) {
      const dx = (other.x - agent.x) / 25;
      const dy = (other.y - agent.y) / 25;
      obs.push(dx);
      obs.push(dy);
    }
    // Pad to 4 agents if needed
    while (obs.length < 30) {
      obs.push(0);
    }

    return obs;
  }

  buildObservation(agent: PlowAgent): Float32Array {
    const obs = this.buildObservation_impl(agent);
    return new Float32Array(obs);
  }

  /**
   * Continuous actions: [steer (-1 to 1), throttle (0 to 1), blade_toggle (0 or 1)]
   */
  applyAction(agent: PlowAgent, action: number[]): { newX: number; newY: number; blocked: boolean } {
    const [steer, throttle, bladeToggle] = action;

    // Update angle
    agent.angle += steer * 0.15;
    agent.angle = normalizeAngle(agent.angle);

    // Movement
    const moveSpeed = throttle * 0.5; // 0 to 0.5 units/step
    let newX = agent.x + Math.cos(agent.angle) * moveSpeed;
    let newY = agent.y + Math.sin(agent.angle) * moveSpeed;

    // Clamp to grid
    [newX, newY] = clampToGrid(newX, newY);

    // Check collision
    const blocked = this.isBlocked(newX, newY);

    // Fuel consumption
    agent.fuel = Math.max(0, agent.fuel - throttle * 0.3);

    // Blade clears snow
    if (bladeToggle > 0.5) {
      const key = `${Math.round(agent.x)},${Math.round(agent.y)}`;
      if (this.snowDepth.has(key)) {
        const currentDepth = this.snowDepth.get(key) || 0;
        this.snowDepth.set(key, Math.max(0, currentDepth - 3)); // clear 3 units
        agent.visited.add(key);
      }
      agent.fuel = Math.max(0, agent.fuel - 0.5); // blade uses more fuel
    }

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

  computeReward(agent: PlowAgent, newX: number, newY: number, wasBlocked: boolean): number {
    let reward = -0.01; // step penalty

    if (wasBlocked) {
      reward -= 1.0;
    }

    // Reward for clearing snow
    const key = `${Math.round(newX)},${Math.round(newY)}`;
    const currentDepth = this.snowDepth.get(key) || 0;
    if (currentDepth > 0) {
      reward += currentDepth * 0.1; // deeper snow = more reward
    }

    // Traffic zone bonus
    for (const zone of this.trafficZones) {
      if (Math.hypot(zone.x - newX, zone.y - newY) < 1.0) {
        reward += zone.intensity * 0.5; // priority to clear traffic zones
      }
    }

    // Coverage efficiency (slight bonus for newly cleared tiles)
    if (!agent.visited.has(key) && currentDepth === 0) {
      reward += 0.2;
      agent.visited.add(key);
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

    const observations: Float32Array[] = [];
    const rewards: number[] = [];
    const dones: boolean[] = [];

    for (let i = 0; i < this.agents.length; i++) {
      const plow = this.agents[i];
      const action = actions[i];

      const { newX, newY, blocked } = this.applyAction(plow, action);

      if (!blocked) {
        plow.x = newX;
        plow.y = newY;
      }

      const reward = this.computeReward(plow, plow.x, plow.y, blocked);

      plow.steps++;
      plow.reward = reward;
      plow.episodeReturn += reward;

      const obs = this.buildObservation(plow);
      observations.push(obs);
      rewards.push(reward);

      const allCleared = Array.from(this.snowDepth.values()).every((d) => d === 0);
      const done =
        plow.steps >= this.maxSteps ||
        plow.fuel <= 0 ||
        allCleared;
      plow.done = done;
      dones.push(done);
    }

    return { observations, rewards, dones };
  }

  reset(): PlowAgent[] {
    this.timestep = 0;

    // Reset snow depth
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        if (!this.isBlocked(x, y)) {
          this.snowDepth.set(`${x},${y}`, Math.random() * 8 + 2);
        }
      }
    }

    this.agents = this.startPositions.map((pos, idx) => ({
      id: `plow_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      fuel: 100,
      visited: new Set(),
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
    return this.agents;
  }

  getAgents(): PlowAgent[] {
    return this.agents;
  }

  getAgentState(id: string): PlowAgent | undefined {
    return this.agents.find((a) => a.id === id);
  }

  getSnowDepth(x: number, y: number): number {
    return this.snowDepth.get(`${x},${y}`) || 0;
  }

  getTrafficZones(): Array<{ x: number; y: number; intensity: number }> {
    return this.trafficZones;
  }
}
