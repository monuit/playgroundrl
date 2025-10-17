"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Color, InstancedMesh, Object3D, Vector2 } from "three";
import type { Env, EnvFactory, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

const GRID_WIDTH = 10;
const GRID_HEIGHT = 8;
const CELL_SIZE = 22;
const BOT_COUNT = 6;
const MAX_STEPS = 720;
const TURN_LEFT = -1;
const TURN_RIGHT = 1;
const JOB_BACKLOG_TARGET = 5;

const enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

interface BotState {
  id: number;
  position: Vector2;
  facing: Direction;
  battery: number;
  carrying: boolean;
  docking: boolean;
  velocity: number;
}

interface ShelfState {
  id: number;
  position: { x: number; y: number };
  reserved: boolean;
}

interface StationState {
  id: number;
  position: { x: number; y: number };
  queue: number;
}

interface OrderState {
  id: number;
  shelfId: number;
  stationId: number;
  progress: "waiting" | "picked" | "delivered";
}

interface WarehouseState {
  bots: BotState[];
  shelves: ShelfState[];
  stations: StationState[];
  orders: OrderState[];
  completed: number;
  steps: number;
  blockingEvents: number;
}

export interface WarehouseBotsRenderableState {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  bots: Array<{
    id: number;
    position: { x: number; y: number };
    facing: Direction;
    battery: number;
    carrying: boolean;
    docking: boolean;
  }>;
  shelves: ShelfState[];
  stations: StationState[];
  ordersInBacklog: number;
  completed: number;
  steps: number;
  maxSteps: number;
  blockingEvents: number;
}

const gridToWorld = (x: number, y: number) => {
  const originX = ((GRID_WIDTH - 1) * CELL_SIZE) / 2;
  const originY = ((GRID_HEIGHT - 1) * CELL_SIZE) / 2;
  return new Vector2(x * CELL_SIZE - originX, y * CELL_SIZE - originY);
};

const rotateFacing = (facing: Direction, direction: typeof TURN_LEFT | typeof TURN_RIGHT) => {
  const next = (facing + (direction === TURN_LEFT ? 3 : 1)) % 4;
  return next as Direction;
};

const moveForward = (position: Vector2, facing: Direction) => {
  const delta = new Vector2();
  switch (facing) {
    case Direction.North:
      delta.set(0, -1);
      break;
    case Direction.East:
      delta.set(1, 0);
      break;
    case Direction.South:
      delta.set(0, 1);
      break;
    case Direction.West:
      delta.set(-1, 0);
      break;
  }
  return position.clone().add(delta);
};

class WarehouseBotsEnv implements Env {
  readonly id = "warehouse-bots";
  readonly actionSpace = { type: "discrete", n: 6 } as const;
  readonly obsSpace = { shape: [24] } as const;

  private rng: () => number;
  private state: WarehouseState;

  constructor() {
    this.rng = Math.random;
    this.state = this.createInitialState();
  }

  reset(): EnvObservation {
    this.state = this.createInitialState();
    return this.buildObservation();
  }

  step(action: number | number[]): EnvStepResult {
    const active = Array.isArray(action) ? action[0] ?? 0 : action ?? 0;
    const leader = this.state.bots[0];
    let reward = -0.02;

    switch (active) {
      case 0: {
        this.tryMoveBot(leader);
        break;
      }
      case 1:
        leader.facing = rotateFacing(leader.facing, TURN_LEFT);
        leader.velocity = 0;
        reward -= 0.01;
        break;
      case 2:
        leader.facing = rotateFacing(leader.facing, TURN_RIGHT);
        leader.velocity = 0;
        reward -= 0.01;
        break;
      case 3:
        reward += this.tryToggleDock(leader);
        break;
      case 4:
        leader.battery = Math.min(1, leader.battery + (this.isOnCharger(leader) ? 0.08 : 0.01));
        reward -= 0.015;
        break;
      case 5:
      default:
        reward -= 0.005;
        break;
    }

    this.advanceSupportBots();
    const blockingPenalty = this.resolveBlocking();
    reward += blockingPenalty;

    const backlogPenalty = -0.02 * this.backlogSize();
    reward += backlogPenalty;

    const completionReward = this.advanceOrders();
    reward += completionReward;

    leader.battery = Math.max(0, leader.battery - 0.005 - leader.velocity * 0.0008);

    this.state.steps += 1;
    const done = this.state.steps >= MAX_STEPS || leader.battery <= 0;

    const observation = this.buildObservation();

    return {
      state: observation,
      reward,
      done,
      info: {
        backlog: this.backlogSize(),
        completed: this.state.completed,
        blocking: this.state.blockingEvents,
        battery: leader.battery,
      },
    };
  }

  private createInitialState(): WarehouseState {
    const bots: BotState[] = Array.from({ length: BOT_COUNT }, (_, id) => {
      const position = gridToWorld(id % GRID_WIDTH, GRID_HEIGHT - 1 - Math.floor(id / GRID_WIDTH));
      return {
        id,
        position,
        facing: Direction.North,
        battery: 1,
        carrying: false,
        docking: false,
        velocity: 0,
      };
    });

    const shelves: ShelfState[] = [];
    let sid = 0;
    for (let x = 1; x < GRID_WIDTH - 1; x += 2) {
      for (let y = 1; y < GRID_HEIGHT - 2; y += 2) {
        shelves.push({ id: sid, position: { x, y }, reserved: false });
        sid += 1;
      }
    }

    const stations: StationState[] = Array.from({ length: 3 }, (_, id) => ({
      id,
      position: { x: GRID_WIDTH - 1, y: id * 2 + 1 },
      queue: 0,
    }));

    const orders = this.generateOrders(shelves, stations);

    return {
      bots,
      shelves,
      stations,
      orders,
      completed: 0,
      steps: 0,
      blockingEvents: 0,
    };
  }

  private generateOrders(shelves: ShelfState[], stations: StationState[]): OrderState[] {
    const orders: OrderState[] = [];
    for (let i = 0; i < JOB_BACKLOG_TARGET; i += 1) {
      const shelf = shelves[Math.floor(this.rng() * shelves.length)];
      const station = stations[Math.floor(this.rng() * stations.length)];
      orders.push({ id: i, shelfId: shelf.id, stationId: station.id, progress: "waiting" });
      station.queue += 1;
    }
    return orders;
  }

  private backlogSize() {
    return this.state.orders.filter((order) => order.progress !== "delivered").length;
  }

  private tryMoveBot(bot: BotState) {
    const targetGrid = moveForward(this.gridPosition(bot.position), bot.facing);
    if (!this.isWithinGrid(targetGrid.x, targetGrid.y)) {
      bot.velocity = 0;
      bot.battery = Math.max(0, bot.battery - 0.01);
      return;
    }

    const blocked = this.state.bots.some((other) => other.id !== bot.id && this.gridPosition(other.position).equals(targetGrid));
    if (blocked) {
      bot.velocity = 0;
      return;
    }

    bot.velocity = 1;
    bot.position = gridToWorld(targetGrid.x, targetGrid.y);
  }

  private tryToggleDock(bot: BotState) {
    const grid = this.gridPosition(bot.position);
    const order = this.state.orders.find((o) => o.progress !== "delivered");
    if (!order) {
      return -0.01;
    }

    const shelf = this.state.shelves.find((s) => s.id === order.shelfId);
    const station = this.state.stations.find((s) => s.id === order.stationId);

    if (!shelf || !station) {
      return -0.01;
    }

    if (!bot.carrying && grid.x === shelf.position.x && grid.y === shelf.position.y && order.progress === "waiting") {
      bot.carrying = true;
      order.progress = "picked";
      shelf.reserved = true;
      return 0.4;
    }

    if (bot.carrying && grid.x === station.position.x && grid.y === station.position.y && order.progress === "picked") {
      bot.carrying = false;
      order.progress = "delivered";
      this.state.completed += 1;
      station.queue = Math.max(0, station.queue - 1);
      return 1.2;
    }

    return -0.02;
  }

  private advanceSupportBots() {
    for (let i = 1; i < this.state.bots.length; i += 1) {
      const bot = this.state.bots[i];
      if (this.rng() < 0.3) {
        bot.facing = rotateFacing(bot.facing, this.rng() > 0.5 ? TURN_LEFT : TURN_RIGHT);
      }
      if (this.rng() < 0.6) {
        this.tryMoveBot(bot);
      }
      bot.battery = Math.max(0.2, bot.battery - 0.0025);
      if (bot.battery < 0.25 && this.isOnCharger(bot)) {
        bot.battery = Math.min(1, bot.battery + 0.05);
      }
    }
  }

  private resolveBlocking() {
    let penalty = 0;
    const leaderGrid = this.gridPosition(this.state.bots[0].position);
    for (let i = 1; i < this.state.bots.length; i += 1) {
      const otherGrid = this.gridPosition(this.state.bots[i].position);
      if (otherGrid.equals(leaderGrid)) {
        penalty -= 0.4;
        this.state.blockingEvents += 1;
      }
    }
    return penalty;
  }

  private advanceOrders() {
    let reward = 0;
    if (this.state.orders.every((order) => order.progress === "delivered")) {
      reward += 2.4;
      const additional = this.generateOrders(this.state.shelves, this.state.stations);
      this.state.orders.push(...additional.map((order, index) => ({ ...order, id: this.state.orders.length + index })));
    }
    return reward;
  }

  private isWithinGrid(x: number, y: number) {
    return x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT;
  }

  private gridPosition(position: Vector2) {
    const originX = ((GRID_WIDTH - 1) * CELL_SIZE) / 2;
    const originY = ((GRID_HEIGHT - 1) * CELL_SIZE) / 2;
    const x = Math.round((position.x + originX) / CELL_SIZE);
    const y = Math.round((position.y + originY) / CELL_SIZE);
    return new Vector2(x, y);
  }

  private isOnCharger(bot: BotState) {
    const grid = this.gridPosition(bot.position);
    return grid.x === 0 && grid.y === GRID_HEIGHT - 1;
  }

  private buildObservation(): EnvObservation {
    const leader = this.state.bots[0];
    const grid = this.gridPosition(leader.position);
    const buffer = new Float32Array(24);
    let index = 0;

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nx = grid.x + dx;
        const ny = grid.y + dy;
        if (!this.isWithinGrid(nx, ny)) {
          buffer[index++] = 1;
          continue;
        }
        const occupied = this.state.bots.some((bot) => this.gridPosition(bot.position).equals(new Vector2(nx, ny)));
        buffer[index++] = occupied ? 1 : 0;
      }
    }

    buffer[index++] = leader.battery;
    buffer[index++] = leader.carrying ? 1 : 0;
    buffer[index++] = this.backlogSize() / (JOB_BACKLOG_TARGET * 2);
    buffer[index++] = this.state.completed / Math.max(1, this.state.steps);

    const neighborBots = this.state.bots.slice(1).sort((a, b) => leader.position.distanceTo(a.position) - leader.position.distanceTo(b.position));
    neighborBots.slice(0, 2).forEach((bot) => {
      buffer[index++] = (bot.position.x - leader.position.x) / (GRID_WIDTH * CELL_SIZE);
      buffer[index++] = (bot.position.y - leader.position.y) / (GRID_HEIGHT * CELL_SIZE);
    });

    buffer[index++] = this.state.blockingEvents / Math.max(1, this.state.steps);
    buffer[index++] = leader.velocity;
    buffer[index++] = leader.facing / 3;
    buffer[index++] = grid.x / GRID_WIDTH;
    buffer[index++] = grid.y / GRID_HEIGHT;
    buffer[index++] = this.state.steps / MAX_STEPS;

    while (index < buffer.length) {
      buffer[index++] = 0;
    }

    const metadata: WarehouseBotsRenderableState = {
      gridWidth: GRID_WIDTH,
      gridHeight: GRID_HEIGHT,
      cellSize: CELL_SIZE,
      bots: this.state.bots.map((bot) => ({
        id: bot.id,
        position: { x: bot.position.x, y: bot.position.y },
        facing: bot.facing,
        battery: bot.battery,
        carrying: bot.carrying,
        docking: bot.docking,
      })),
      shelves: this.state.shelves,
      stations: this.state.stations,
      ordersInBacklog: this.backlogSize(),
      completed: this.state.completed,
      steps: this.state.steps,
      maxSteps: MAX_STEPS,
      blockingEvents: this.state.blockingEvents,
    };

    return { buffer, metadata } as unknown as EnvObservation;
  }
}

export const createWarehouseBotsEnv: EnvFactory = {
  id: "warehouse-bots",
  name: "Warehouse Bots",
  description: "Queue-aware Kiva bots shuttle shelves to stations while avoiding congestion and keeping SLAs in view.",
  create: () => new WarehouseBotsEnv(),
};

const isWarehouseRenderableState = (value: unknown): value is WarehouseBotsRenderableState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<WarehouseBotsRenderableState>;
  return Array.isArray(record.bots) && typeof record.gridWidth === "number";
};

const buildFallbackState = (): WarehouseBotsRenderableState => {
  try {
    const env = createWarehouseBotsEnv.create();
    const obs = env.reset();
    if (obs && typeof obs === "object" && "metadata" in obs) {
      const metadata = (obs as { metadata?: unknown }).metadata;
      if (isWarehouseRenderableState(metadata)) {
        return metadata;
      }
    }
  } catch {
    // ignore
  }

  return {
    gridWidth: GRID_WIDTH,
    gridHeight: GRID_HEIGHT,
    cellSize: CELL_SIZE,
    bots: [],
    shelves: [],
    stations: [],
    ordersInBacklog: 0,
    completed: 0,
    steps: 0,
    maxSteps: MAX_STEPS,
    blockingEvents: 0,
  };
};

const BOT_COLOR = new Color("#38bdf8");
const LEADER_COLOR = new Color("#facc15");
const SHELF_COLOR = new Color("#1e293b");
const STATION_COLOR = new Color("#22d3ee");

export const WarehouseBotsScene = memo(function WarehouseBotsScene({
  state,
}: {
  state: WarehouseBotsRenderableState;
}) {
  const fallback = useMemo(buildFallbackState, []);
  const resolvedState = useMemo(() => {
    if (isWarehouseRenderableState(state)) {
      return state;
    }
    return fallback;
  }, [state, fallback]);

  const botRef = useRef<InstancedMesh>(null);
  const shelfRef = useRef<InstancedMesh>(null);
  const stationRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!shelfRef.current) {
      return;
    }
    resolvedState.shelves.forEach((shelf, index) => {
      const world = gridToWorld(shelf.position.x, shelf.position.y);
      tempObject.position.set(world.x, 5, world.y);
      tempObject.scale.set(0.8, 0.5, 0.8);
      tempObject.updateMatrix();
      shelfRef.current!.setMatrixAt(index, tempObject.matrix);
      shelfRef.current!.setColorAt(index, SHELF_COLOR);
    });
    shelfRef.current.count = resolvedState.shelves.length;
    shelfRef.current.instanceMatrix.needsUpdate = true;
    shelfRef.current.instanceColor!.needsUpdate = true;
  }, [resolvedState.shelves, tempObject]);

  useEffect(() => {
    if (!stationRef.current) {
      return;
    }
    resolvedState.stations.forEach((station, index) => {
      const world = gridToWorld(station.position.x, station.position.y);
      tempObject.position.set(world.x, 3, world.y);
      tempObject.scale.set(0.9, 0.4, 0.9);
      tempObject.updateMatrix();
      stationRef.current!.setMatrixAt(index, tempObject.matrix);
      const intensity = Math.min(1, station.queue / JOB_BACKLOG_TARGET);
      const color = STATION_COLOR.clone().lerp(new Color("#f97316"), intensity);
      stationRef.current!.setColorAt(index, color);
    });
    stationRef.current.count = resolvedState.stations.length;
    stationRef.current.instanceMatrix.needsUpdate = true;
    stationRef.current.instanceColor!.needsUpdate = true;
  }, [resolvedState.stations, tempObject]);

  useEffect(() => {
    if (!botRef.current) {
      return;
    }
    resolvedState.bots.forEach((bot, index) => {
      tempObject.position.set(bot.position.x, 6, bot.position.y);
      tempObject.rotation.set(0, (bot.facing / 4) * Math.PI * 2, 0);
      tempObject.scale.set(1.1, 1.1, 1.1);
      tempObject.updateMatrix();
      botRef.current!.setMatrixAt(index, tempObject.matrix);
      botRef.current!.setColorAt(index, bot.id === 0 ? LEADER_COLOR : BOT_COLOR);
    });
    botRef.current.count = resolvedState.bots.length;
    botRef.current.instanceMatrix.needsUpdate = true;
    botRef.current.instanceColor!.needsUpdate = true;
  }, [resolvedState.bots, tempObject]);

  useFrame((state, delta) => {
    if (!botRef.current) {
      return;
    }
    for (let i = 0; i < botRef.current.count; i += 1) {
      botRef.current.getMatrixAt(i, tempObject.matrix);
      tempObject.rotation.y += delta * 0.2;
      tempObject.updateMatrix();
      botRef.current.setMatrixAt(i, tempObject.matrix);
    }
    botRef.current.instanceMatrix.needsUpdate = true;
  });

  const gridLines = useMemo(() => {
    const lines: Array<{ from: [number, number, number]; to: [number, number, number] }> = [];
    for (let x = 0; x <= GRID_WIDTH; x += 1) {
      const from = gridToWorld(x - 0.5, -0.5);
      const to = gridToWorld(x - 0.5, GRID_HEIGHT - 0.5);
      lines.push({ from: [from.x, 0, from.y], to: [to.x, 0, to.y] });
    }
    for (let y = 0; y <= GRID_HEIGHT; y += 1) {
      const from = gridToWorld(-0.5, y - 0.5);
      const to = gridToWorld(GRID_WIDTH - 0.5, y - 0.5);
      lines.push({ from: [from.x, 0, from.y], to: [to.x, 0, to.y] });
    }
    return lines;
  }, []);

  const chargerPosition = useMemo(() => gridToWorld(0, GRID_HEIGHT - 1), []);

  return (
    <group>
      <ambientLight intensity={0.35} color={0xe2e8f0} />
      <directionalLight position={[140, 180, 120]} intensity={1.6} color={0x38bdf8} />
      <pointLight position={[-120, 40, -120]} intensity={0.7} color={0xf97316} />

      <mesh position={[0, -4, 0]} receiveShadow>
        <boxGeometry args={[GRID_WIDTH * CELL_SIZE * 1.1, 6, GRID_HEIGHT * CELL_SIZE * 1.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.05} />
      </mesh>

      {gridLines.map((line, index) => (
        <Line key={`grid-${index}`} points={[line.from, line.to]} color="#1e293b" lineWidth={1} opacity={0.5} transparent />
      ))}

      <instancedMesh ref={shelfRef} args={[undefined, undefined, resolvedState.shelves.length]}>
        <boxGeometry args={[CELL_SIZE * 0.6, 10, CELL_SIZE * 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.6} vertexColors />
      </instancedMesh>

      <instancedMesh ref={stationRef} args={[undefined, undefined, resolvedState.stations.length]}>
        <boxGeometry args={[CELL_SIZE * 0.8, 6, CELL_SIZE * 0.8]} />
        <meshStandardMaterial emissive="#38bdf8" emissiveIntensity={0.4} vertexColors />
      </instancedMesh>

      <instancedMesh ref={botRef} args={[undefined, undefined, resolvedState.bots.length]}>
        <boxGeometry args={[CELL_SIZE * 0.5, 8, CELL_SIZE * 0.5]} />
        <meshStandardMaterial emissive="#38bdf8" emissiveIntensity={0.6} metalness={0.4} roughness={0.5} vertexColors />
      </instancedMesh>

  <mesh position={[chargerPosition.x, 0, chargerPosition.y]}>
        <boxGeometry args={[CELL_SIZE * 0.8, 4, CELL_SIZE * 0.8]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
});

export const WarehouseBotsDefinition: EnvDefinition<WarehouseBotsRenderableState> = {
  ...createWarehouseBotsEnv,
  Scene: WarehouseBotsScene,
};
