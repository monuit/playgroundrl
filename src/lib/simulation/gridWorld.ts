import seedrandom from "seedrandom";

export type TileType = 0 | 1 | 2;

export type Difficulty = "meadow" | "labyrinth";

export interface GridWorldConfig {
  size: number;
  agentCount: number;
  rewardCount: number;
  maxSteps: number;
  difficulty: Difficulty;
  seed?: string;
}

export interface AgentRenderableState {
  id: number;
  x: number;
  y: number;
  heading: number;
  reward: number;
  trail: Array<{ x: number; y: number }>;
  color: string;
}

export interface RewardRenderableState {
  id: number;
  x: number;
  y: number;
  value: number;
}

export interface GridRenderableState {
  size: number;
  tiles: Uint8Array;
  difficulty: Difficulty;
  rewards: RewardRenderableState[];
  agents: AgentRenderableState[];
  tick: number;
  step: number;
  episode: number;
  totalReward: number;
  episodeReward: number;
  stepReward: number;
}

interface AgentInternalState {
  id: number;
  x: number;
  y: number;
  heading: number;
  reward: number;
  trail: Array<{ x: number; y: number }>;
  color: string;
}

interface RewardInternalState {
  id: number;
  x: number;
  y: number;
  value: number;
}

const ACTION_VECTORS: Array<{ dx: number; dy: number; heading: number }> = [
  { dx: 0, dy: 0, heading: 0 },
  { dx: 0, dy: -1, heading: -Math.PI / 2 },
  { dx: 1, dy: 0, heading: 0 },
  { dx: 0, dy: 1, heading: Math.PI / 2 },
  { dx: -1, dy: 0, heading: Math.PI },
  { dx: 1, dy: -1, heading: -Math.PI / 4 },
  { dx: 1, dy: 1, heading: Math.PI / 4 },
  { dx: -1, dy: 1, heading: (3 * Math.PI) / 4 },
  { dx: -1, dy: -1, heading: -(3 * Math.PI) / 4 },
];

const TRAIL_LENGTH = 32;

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

const tileIndex = (x: number, y: number, size: number) => y * size + x;

export class GridWorldEngine {
  private config: GridWorldConfig;
  private rng: seedrandom.PRNG;
  private tiles: Uint8Array;
  private agents: AgentInternalState[] = [];
  private rewards: RewardInternalState[] = [];
  private tick = 0;
  private stepCount = 0;
  private episode = 1;
  private totalReward = 0;
  private episodeReward = 0;
  private scratchObservation: Float32Array;

  constructor(config: GridWorldConfig) {
    this.config = { ...config };
    this.rng = seedrandom(this.config.seed ?? undefined);
    this.tiles = new Uint8Array(this.config.size * this.config.size);
    this.scratchObservation = new Float32Array(this.config.size * this.config.size + 8);
    this.reset(config);
  }

  reset(config?: Partial<GridWorldConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
      this.rng = seedrandom(this.config.seed ?? undefined);
      this.tiles = new Uint8Array(this.config.size * this.config.size);
      this.scratchObservation = new Float32Array(
        this.config.size * this.config.size + 8
      );
    }
    this.tick = 0;
    this.stepCount = 0;
    this.episode = 1;
    this.totalReward = 0;
    this.episodeReward = 0;
    this.generateLayout();
    this.spawnAgents();
    this.seedRewards();
  }

  configure(config: Partial<GridWorldConfig>) {
    this.reset({ ...config });
  }

  summary() {
    return {
      tick: this.tick,
      step: this.stepCount,
      episode: this.episode,
      totalReward: this.totalReward,
      episodeReward: this.episodeReward,
    };
  }

  getRenderableState(): GridRenderableState {
    const { size, difficulty } = this.config;
    return {
      size,
      tiles: this.tiles.slice(0),
      difficulty,
      rewards: this.rewards.map((reward) => ({ ...reward })),
      agents: this.agents.map((agent) => ({
        id: agent.id,
        x: agent.x,
        y: agent.y,
        heading: agent.heading,
        reward: agent.reward,
        trail: agent.trail.slice(0),
        color: agent.color,
      })),
      tick: this.tick,
      step: this.stepCount,
      episode: this.episode,
      totalReward: this.totalReward,
      episodeReward: this.episodeReward,
      stepReward: 0,
    };
  }

  buildObservations(): Float32Array[] {
    return this.agents.map((agent) => this.sampleObservation(agent));
  }

  heuristicActions(): number[] {
    return this.agents.map((agent) => this.heuristicAction(agent));
  }

  step(actions: number[]): GridRenderableState {
    const { size, maxSteps } = this.config;
    let stepReward = 0;

    for (const [index, agent] of this.agents.entries()) {
      const actionIndex = actions[index] ?? 0;
      const vector = ACTION_VECTORS[actionIndex] ?? ACTION_VECTORS[0];
      const nextX = clamp(agent.x + vector.dx, 0, size - 1);
      const nextY = clamp(agent.y + vector.dy, 0, size - 1);
      const tile = this.tiles[tileIndex(nextX, nextY, size)];

      agent.heading = vector.heading;

      if (tile === 1) {
        // obstacle -> soft penalty
        agent.reward -= 0.01;
        stepReward -= 0.01;
        continue;
      }

      if (nextX !== agent.x || nextY !== agent.y) {
        agent.trail.push({ x: agent.x, y: agent.y });
        if (agent.trail.length > TRAIL_LENGTH) {
          agent.trail.shift();
        }
      }

      agent.x = nextX;
      agent.y = nextY;

      const rewardIndex = this.rewards.findIndex(
        (reward) => reward.x === agent.x && reward.y === agent.y
      );

      if (rewardIndex !== -1) {
        const rewardValue = this.rewards[rewardIndex].value;
        agent.reward += rewardValue;
        stepReward += rewardValue;
        this.episodeReward += rewardValue;
        this.totalReward += rewardValue;
        const tileIdx = tileIndex(agent.x, agent.y, size);
        this.tiles[tileIdx] = 0;
        this.rewards.splice(rewardIndex, 1);
        this.placeReward(rewardIndex);
      }
    }

    this.tick += 1;
    this.stepCount += 1;

    if (this.stepCount >= maxSteps) {
      this.episode += 1;
      this.stepCount = 0;
      this.episodeReward = 0;
      this.generateLayout();
      this.spawnAgents();
      this.seedRewards();
    }

    const renderState = this.getRenderableState();
    renderState.stepReward = stepReward;
    return renderState;
  }

  private sampleObservation(agent: AgentInternalState): Float32Array {
  const { size, maxSteps } = this.config;
    const length = size * size;
    const view = this.scratchObservation;

    for (let index = 0; index < length; index += 1) {
      const tile = this.tiles[index];
      if (tile === 0) {
        view[index] = 0;
      } else if (tile === 1) {
        view[index] = 0.9;
      } else {
        view[index] = 0.5;
      }
    }

    const base = length;
    view[base] = agent.x / (size - 1 || 1);
    view[base + 1] = agent.y / (size - 1 || 1);
    view[base + 2] = Math.cos(agent.heading);
    view[base + 3] = Math.sin(agent.heading);

    const nearest = this.findNearestReward(agent.x, agent.y);
    if (nearest) {
      view[base + 4] = (nearest.x - agent.x) / size;
      view[base + 5] = (nearest.y - agent.y) / size;
      view[base + 6] = nearest.value / 5;
    } else {
      view[base + 4] = 0;
      view[base + 5] = 0;
      view[base + 6] = 0;
    }

    view[base + 7] = this.stepCount / (maxSteps || 1);

    return view.slice(0);
  }

  private heuristicAction(agent: AgentInternalState): number {
    const nearest = this.findNearestReward(agent.x, agent.y);
    if (!nearest) {
      return 0;
    }
    const dx = nearest.x - agent.x;
    const dy = nearest.y - agent.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 1 && absY < 1) {
      return 0;
    }
    if (absX > absY) {
      return dx > 0 ? 2 : 4;
    }
    if (absY > absX) {
      return dy > 0 ? 3 : 1;
    }
    if (dx >= 0 && dy >= 0) {
      return 6;
    }
    if (dx >= 0 && dy < 0) {
      return 5;
    }
    if (dx < 0 && dy >= 0) {
      return 7;
    }
    return 8;
  }

  private generateLayout() {
    const { size, difficulty } = this.config;
    this.tiles.fill(0);

    const obstacleChance = difficulty === "labyrinth" ? 0.24 : 0.08;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const idx = tileIndex(x, y, size);
        if (this.rng() < obstacleChance) {
          this.tiles[idx] = 1;
        }
      }
    }

    if (difficulty === "labyrinth") {
      // simple smoothing pass
      const copy = this.tiles.slice(0);
      const neighbors = (cx: number, cy: number) => {
        let total = 0;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) continue;
            const nx = clamp(cx + ox, 0, size - 1);
            const ny = clamp(cy + oy, 0, size - 1);
            if (copy[tileIndex(nx, ny, size)] === 1) {
              total += 1;
            }
          }
        }
        return total;
      };
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const idx = tileIndex(x, y, size);
          const count = neighbors(x, y);
          if (count >= 5) {
            this.tiles[idx] = 1;
          } else if (count <= 2) {
            this.tiles[idx] = 0;
          }
        }
      }
    }

    // carve central plaza
    const plazaRadius = Math.max(2, Math.floor(size * 0.08));
    const center = Math.floor(size / 2);
    for (let y = center - plazaRadius; y <= center + plazaRadius; y += 1) {
      for (let x = center - plazaRadius; x <= center + plazaRadius; x += 1) {
        if (x >= 0 && y >= 0 && x < size && y < size) {
          const idx = tileIndex(x, y, size);
          this.tiles[idx] = 0;
        }
      }
    }
  }

  private spawnAgents() {
  const { agentCount } = this.config;
    this.agents = [];
    for (let id = 0; id < agentCount; id += 1) {
      const position = this.randomEmptyTile();
      this.agents.push({
        id,
        x: position.x,
        y: position.y,
        heading: 0,
        reward: 0,
        trail: [],
        color: this.agentColor(id),
      });
    }
  }

  private seedRewards() {
    this.rewards = [];
    for (let id = 0; id < this.config.rewardCount; id += 1) {
      this.placeReward(id);
    }
  }

  private placeReward(id: number) {
    const position = this.randomEmptyTile();
    const idx = tileIndex(position.x, position.y, this.config.size);
    this.tiles[idx] = 2;
    const reward: RewardInternalState = {
      id,
      x: position.x,
      y: position.y,
      value: 1 + this.rng() * 0.5,
    };
    if (this.rewards[id]) {
      this.rewards[id] = reward;
    } else {
      this.rewards.push(reward);
    }
  }

  private randomEmptyTile(): { x: number; y: number } {
    const { size } = this.config;
    for (let tries = 0; tries < size * size * 2; tries += 1) {
      const x = Math.floor(this.rng() * size);
      const y = Math.floor(this.rng() * size);
      const idx = tileIndex(x, y, size);
      if (this.tiles[idx] === 0 && !this.isAgentAt(x, y)) {
        return { x, y };
      }
    }
    // fallback search
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const idx = tileIndex(x, y, size);
        if (this.tiles[idx] === 0 && !this.isAgentAt(x, y)) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 };
  }

  private isAgentAt(x: number, y: number) {
    return this.agents.some((agent) => agent.x === x && agent.y === y);
  }

  private findNearestReward(x: number, y: number) {
    if (this.rewards.length === 0) {
      return null as RewardInternalState | null;
    }
    let best: RewardInternalState | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const reward of this.rewards) {
      const distance = Math.hypot(reward.x - x, reward.y - y);
      if (distance < bestDistance) {
        best = reward;
        bestDistance = distance;
      }
    }
    return best;
  }

  private agentColor(id: number) {
    const palette = [
      "#38bdf8",
      "#a855f7",
      "#22d3ee",
      "#f97316",
      "#facc15",
      "#4ade80",
      "#f472b6",
      "#94a3b8",
      "#c084fc",
      "#2dd4bf",
    ];
    return palette[id % palette.length];
  }
}
