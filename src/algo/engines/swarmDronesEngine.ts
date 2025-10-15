import type { LevelConfig } from '@/types/game';
import { EnvironmentType } from '@/types/game';
import {
  buildObstacleSet,
  isBlockedByObstacle,
  isBlockedByMovingObstacle,
  isBlockedByAgent,
  updateMovingObstacles,
  clampToGrid,
  getAgentsInRange,
  normalizeAngle,
} from "./BaseGameEngine";

export interface DroneAgent {
  id: string;
  x: number;
  y: number;
  angle: number; // radians [-π, π]
  battery: number; // 0-100
  visited: Set<string>; // "x,y" format
  steps: number;
  reward: number;
  episodeReturn: number;
  done: boolean;
}

export class SwarmDronesEngine {
  readonly environment = EnvironmentType.SWARM_DRONES;
  readonly observationShape = [26];
  readonly actionDim = 4; // continuous: [turn, thrust, hover_toggle, return_to_base]
  readonly actionSpace = "continuous";

  private agents: DroneAgent[] = [];
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

  constructor(level: LevelConfig) {
    this.level = level;
    this.obstacles = buildObstacleSet(level);
    this.movingObstacles = level.movingObstacles || [];
    this.startPositions = [
      [2, 2],
      [22, 2],
      [2, 22],
      [22, 22],
    ];

    this.agents = this.startPositions.map((pos, idx) => ({
      id: `drone_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      battery: 100,
      visited: new Set(),
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
  }

  /**
   * Build 16-ray lidar observation for a drone
   * Returns lidar distances + angle + battery + visited_bit + neighbor offsets
   */
  private buildLidarObservation(agent: DroneAgent): number[] {
    const lidar: number[] = [];
    const rayCount = 16;
    const maxDistance = 10;

    // Cast 16 rays around the drone
    for (let i = 0; i < rayCount; i++) {
      const rayAngle = agent.angle + (2 * Math.PI * i) / rayCount;
      const dx = Math.cos(rayAngle);
      const dy = Math.sin(rayAngle);

      let distance_val = maxDistance;
      for (let d = 0.5; d < maxDistance; d += 0.5) {
        const checkX = agent.x + dx * d;
        const checkY = agent.y + dy * d;
        if (
          this.isBlocked(checkX, checkY) ||
          this.isGoalPosition(checkX, checkY)
        ) {
          distance_val = d;
          break;
        }
      }
      lidar.push(distance_val / maxDistance); // normalize to [0, 1]
    }

    // Angle (normalized)
    const normalizedAngle = normalizeAngle(agent.angle) / Math.PI; // [-1, 1]

    // Battery (0-1)
    const batteryNorm = agent.battery / 100;

    // Visited bit (1 if current tile visited, 0 otherwise)
    const currentTile = `${Math.round(agent.x)},${Math.round(agent.y)}`;
    const visitedBit = agent.visited.has(currentTile) ? 1 : 0;

    // Neighbor offsets to nearest 4 agents
    const neighborOffsets: number[] = [];
    const nearestAgents = getAgentsInRange(agent.x, agent.y, 5, this.agents, this.agents.indexOf(agent));
    for (let i = 0; i < 4; i++) {
      if (i < nearestAgents.length) {
        const nearbyAgent = this.agents[nearestAgents[i]];
        const dx = (nearbyAgent.x - agent.x) / 10; // normalize distance
        const dy = (nearbyAgent.y - agent.y) / 10;
        neighborOffsets.push(dx, dy);
      } else {
        neighborOffsets.push(0, 0);
      }
    }

    return [...lidar, normalizedAngle, batteryNorm, visitedBit, ...neighborOffsets];
  }

  buildObservation(agent: DroneAgent): Float32Array {
    const obs = this.buildLidarObservation(agent);
    return new Float32Array(obs);
  }

  /**
   * Continuous action: [turn (-1 to 1), thrust (0 to 1), hover (0 or 1), return_to_base (0 or 1)]
   */
  applyAction(agent: DroneAgent, action: number[]): { newX: number; newY: number; blocked: boolean } {
    const [turn, thrust, hover, returnToBase] = action;

    // Update angle
    agent.angle += turn * 0.3; // max turn rate
    agent.angle = normalizeAngle(agent.angle);

    let newX = agent.x;
    let newY = agent.y;

    // Apply movement if not hovering
    if (hover < 0.5) {
      const moveX = Math.cos(agent.angle) * thrust * 0.5;
      const moveY = Math.sin(agent.angle) * thrust * 0.5;
      newX = agent.x + moveX;
      newY = agent.y + moveY;
    }

    // Return to base if triggered
    if (returnToBase > 0.5) {
      const baseX = agent.id === "drone_0" ? 2 : agent.id === "drone_1" ? 22 : agent.id === "drone_2" ? 2 : 22;
      const baseY = agent.id === "drone_0" ? 2 : agent.id === "drone_1" ? 2 : agent.id === "drone_2" ? 22 : 22;
      const angle = Math.atan2(baseY - agent.y, baseX - agent.x);
      newX = agent.x + Math.cos(angle) * 0.3;
      newY = agent.y + Math.sin(angle) * 0.3;
    }

    // Clamp to grid
    [newX, newY] = clampToGrid(newX, newY);

    // Check collision
    const blocked = this.isBlocked(newX, newY);

    // Consume battery
    agent.battery = Math.max(0, agent.battery - 0.5);

    return { newX, newY, blocked };
  }

  private isBlocked(x: number, y: number): boolean {
    if (isBlockedByObstacle(x, y, this.obstacles)) return true;
    // updateMovingObstacles handles the pathX/pathY interpolation, so pass as-is
    const movingObs = this.movingObstacles.map((mo) => ({
      x: mo.x,
      y: mo.y,
    }));
    if (movingObs.some((mo) => isBlockedByMovingObstacle(x, y, [mo]))) return true;
    const agentPositions = this.agents.map((a) => ({ x: a.x, y: a.y }));
    if (isBlockedByAgent(x, y, agentPositions)) return true;
    return false;
  }

  private isGoalPosition(x: number, y: number): boolean {
    // Check if within 0.5 units of any goal position
    return this.level.goalPositions.some(
      (goal) => Math.hypot(goal.x - x, goal.y - y) < 0.5
    );
  }

  computeReward(agent: DroneAgent, newX: number, newY: number, level: LevelConfig, wasBlocked: boolean): number {
    let reward = -0.01; // step penalty

    // Collision penalty
    if (wasBlocked) {
      reward -= 1.0;
    }

    // Coverage reward: +1.0 for visiting new tile
    const tile = `${Math.round(newX)},${Math.round(newY)}`;
    if (!agent.visited.has(tile)) {
      agent.visited.add(tile);
      reward += 1.0;
    }

    // Battery penalty if low
    if (agent.battery < 20) {
      reward -= 0.1;
    }

    // Goal proximity bonus
    if (this.isGoalPosition(newX, newY)) {
      reward += 10.0;
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
      const drone = this.agents[i];
      const action = actions[i];

      // Apply action
      const { newX, newY, blocked } = this.applyAction(drone, action);

      // Update position if not blocked
      if (!blocked) {
        drone.x = newX;
        drone.y = newY;
      }

      // Compute reward
      const reward = this.computeReward(drone, drone.x, drone.y, this.level, blocked);

      // Update stats
      drone.steps++;
      drone.reward = reward;
      drone.episodeReturn += reward;

      // Build observation
      const obs = this.buildObservation(drone);
      observations.push(obs);
      rewards.push(reward);

      // Check done
      const done = drone.steps >= this.maxSteps || drone.battery <= 0 || this.isGoalPosition(drone.x, drone.y);
      drone.done = done;
      dones.push(done);
    }

    return { observations, rewards, dones };
  }

  reset(): DroneAgent[] {
    this.timestep = 0;
    this.agents = this.startPositions.map((pos, idx) => ({
      id: `drone_${idx}`,
      x: pos[0],
      y: pos[1],
      angle: 0,
      battery: 100,
      visited: new Set(),
      steps: 0,
      reward: 0,
      episodeReturn: 0,
      done: false,
    }));
    return this.agents;
  }

  getAgents(): DroneAgent[] {
    return this.agents;
  }

  getAgentState(id: string): DroneAgent | undefined {
    return this.agents.find((a) => a.id === id);
  }
}
