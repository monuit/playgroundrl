"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, Object3D, Vector2 } from "three";
import type { Env, EnvFactory, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

type NumericTuple = [number, number];

const GRID_SIZE = 18;
const CELL_SIZE = 18;
const GRID_HALF = ((GRID_SIZE - 1) * CELL_SIZE) / 2;
const DRONE_COUNT = 7;
const LIDAR_RAYS = 12;
const TURN_ANGLE = (15 / 180) * Math.PI;
const THRUST_DISTANCE = 8;
const HOVER_DECAY = 0.001;
const MOVE_DECAY = 0.0045;
const MAX_STEPS = 900;
const BASE_POSITION: NumericTuple = [0, 0];

interface DroneState {
  id: number;
  position: Vector2;
  heading: number;
  battery: number;
  returning: boolean;
  velocity: number;
  scanCooldown: number;
}

interface SwarmSimState {
  drones: DroneState[];
  visited: boolean[];
  steps: number;
  coverageCount: number;
  collisions: number;
}

export interface SwarmDronesRenderableState {
  gridSize: number;
  cellSize: number;
  visited: boolean[];
  drones: Array<{
    id: number;
    position: { x: number; y: number };
    heading: number;
    battery: number;
    isPrimary: boolean;
    returning: boolean;
  }>;
  frontiers: Array<{ x: number; y: number }>;
  base: { x: number; y: number };
  steps: number;
  maxSteps: number;
  coverage: number;
  collisions: number;
}

const toIndex = (x: number, y: number) => y * GRID_SIZE + x;

const clampPosition = (value: Vector2) => {
  const clamped = new Vector2(
    Math.max(-GRID_HALF, Math.min(GRID_HALF, value.x)),
    Math.max(-GRID_HALF, Math.min(GRID_HALF, value.y))
  );
  return clamped;
};

const tileFromPosition = (value: Vector2): NumericTuple => {
  const tx = Math.max(
    0,
    Math.min(
      GRID_SIZE - 1,
      Math.round((value.x + GRID_HALF) / CELL_SIZE)
    )
  );
  const ty = Math.max(
    0,
    Math.min(
      GRID_SIZE - 1,
      Math.round((value.y + GRID_HALF) / CELL_SIZE)
    )
  );
  return [tx, ty];
};

const computeFrontiers = (visited: boolean[]): Array<{ x: number; y: number }> => {
  const frontiers: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const idx = toIndex(x, y);
      if (visited[idx]) {
        continue;
      }
      const neighbors: NumericTuple[] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      if (
        neighbors.some(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) {
            return false;
          }
          return visited[toIndex(nx, ny)];
        })
      ) {
        frontiers.push({ x, y });
      }
    }
  }
  return frontiers.slice(0, 24);
};

class SwarmDronesEnv implements Env {
  readonly id = "swarm-drones";
  readonly actionSpace = { type: "discrete", n: 5 } as const;
  readonly obsSpace = { shape: [24] } as const;

  private rng: () => number;
  private state: SwarmSimState;

  constructor() {
    this.rng = Math.random;
    this.state = this.createInitialState();
  }

  reset(): EnvObservation {
    this.state = this.createInitialState();
    return this.createObservation();
  }

  step(action: number | number[]): EnvStepResult {
    const activeAction = Array.isArray(action) ? action[0] ?? 0 : action ?? 0;
    const primary = this.state.drones[0];
    let reward = -0.01;

    switch (activeAction) {
      case 0:
        primary.heading -= TURN_ANGLE;
        primary.returning = false;
        break;
      case 1:
        primary.heading += TURN_ANGLE;
        primary.returning = false;
        break;
      case 2: {
        primary.returning = false;
        primary.velocity = THRUST_DISTANCE;
        break;
      }
      case 3:
        primary.scanCooldown = 4;
        primary.returning = false;
        break;
      case 4:
        primary.returning = true;
        break;
      default:
        break;
    }

    this.advancePrimary(primary, activeAction);
    this.advanceSupport();

    const frontierScore = this.distanceToFrontier(primary);
    if (Number.isFinite(frontierScore)) {
      reward += 0.1 * (1 - frontierScore);
    }

    const coverageBefore = this.state.coverageCount;
    const visitedReward = this.updateCoverage(primary, activeAction === 3);
    reward += visitedReward;

    const collisionPenalty = this.resolveCollisions();
    reward += collisionPenalty;

    this.state.steps += 1;

    primary.battery = Math.max(
      0,
      primary.battery - (primary.velocity > 0 ? MOVE_DECAY : HOVER_DECAY) - (primary.returning ? 0.001 : 0)
    );

    const done =
      this.state.steps >= MAX_STEPS ||
      primary.battery <= 0 ||
      this.state.coverageCount >= GRID_SIZE * GRID_SIZE;

    if (!done && this.state.coverageCount === GRID_SIZE * GRID_SIZE && coverageBefore !== this.state.coverageCount) {
      reward += 10;
    }

    const observation = this.createObservation();

    return {
      state: observation,
      reward,
      done,
      info: {
        coverage: this.state.coverageCount / (GRID_SIZE * GRID_SIZE),
        collisions: this.state.collisions,
        battery: primary.battery,
        steps: this.state.steps,
      },
    };
  }

  private createInitialState(): SwarmSimState {
    const drones: DroneState[] = Array.from({ length: DRONE_COUNT }, (_, id) => ({
      id,
      position: new Vector2(
        BASE_POSITION[0] + (this.rng() - 0.5) * CELL_SIZE * 1.5,
        BASE_POSITION[1] + (this.rng() - 0.5) * CELL_SIZE * 1.5
      ),
      heading: this.rng() * Math.PI * 2,
      battery: 1,
      returning: false,
      velocity: 0,
      scanCooldown: 0,
    }));

    const visited = Array<boolean>(GRID_SIZE * GRID_SIZE).fill(false);
    visited[toIndex(Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2))] = true;

    return {
      drones,
      visited,
      steps: 0,
      coverageCount: visited.filter(Boolean).length,
      collisions: 0,
    };
  }

  private advancePrimary(primary: DroneState, action: number) {
    if (primary.scanCooldown > 0) {
      primary.scanCooldown -= 1;
    }

    let velocity = primary.velocity;

    if (primary.returning) {
      const target = new Vector2(BASE_POSITION[0], BASE_POSITION[1]);
      const vector = target.clone().sub(primary.position);
      const distance = vector.length();
      if (distance > 2) {
        primary.heading = Math.atan2(vector.y, vector.x);
        velocity = Math.min(THRUST_DISTANCE, distance * 0.5);
      } else {
        velocity = 0;
      }
    }

    const dx = Math.cos(primary.heading) * velocity;
    const dy = Math.sin(primary.heading) * velocity;

    primary.position.add(new Vector2(dx, dy));
    primary.position.copy(clampPosition(primary.position));
    primary.velocity = Math.max(0, velocity * 0.92);

    if (action !== 2 && !primary.returning) {
      primary.velocity *= 0.85;
    }
  }

  private advanceSupport() {
    for (let i = 1; i < this.state.drones.length; i += 1) {
      const drone = this.state.drones[i];
      const jitter = (this.rng() - 0.5) * TURN_ANGLE * 0.8;
      drone.heading += jitter;
      const speed = 4 + this.rng() * 2;
      const dx = Math.cos(drone.heading) * speed;
      const dy = Math.sin(drone.heading) * speed;
      drone.position.add(new Vector2(dx, dy));
      drone.position.copy(clampPosition(drone.position));
      drone.velocity = speed;
      drone.battery = Math.max(0.2, Math.min(1, drone.battery - MOVE_DECAY * 0.4));
      if (drone.battery < 0.3 && this.rng() < 0.4) {
        drone.returning = true;
        drone.heading = Math.atan2(-drone.position.y, -drone.position.x);
      }
      if (drone.returning) {
        const vector = new Vector2(-drone.position.x, -drone.position.y);
        const distance = vector.length();
        if (distance > 4) {
          drone.heading = Math.atan2(vector.y, vector.x);
          drone.position.add(vector.normalize().multiplyScalar(6));
        } else {
          drone.returning = false;
          drone.battery = 1;
        }
      }
    }
  }

  private updateCoverage(primary: DroneState, scanned: boolean) {
    const [tx, ty] = tileFromPosition(primary.position);
    const idx = toIndex(tx, ty);
    let reward = -0.002;

    if (!this.state.visited[idx]) {
      if (scanned || primary.velocity > 1) {
        this.state.visited[idx] = true;
        this.state.coverageCount += 1;
        reward += 1;
      } else {
        reward += 0.08;
      }
    }

    return reward;
  }

  private resolveCollisions() {
    let penalty = 0;
    const primary = this.state.drones[0];
    for (let i = 1; i < this.state.drones.length; i += 1) {
      const drone = this.state.drones[i];
      const distance = primary.position.distanceTo(drone.position);
      if (distance < CELL_SIZE * 0.35) {
        penalty -= 1;
        this.state.collisions += 1;
        const push = CELL_SIZE * 0.35 - distance;
        const dir = primary.position.clone().sub(drone.position).normalize();
        primary.position.add(dir.multiplyScalar(push * 0.5));
        drone.position.add(dir.multiplyScalar(-push * 0.5));
      }
    }
    const [x, y] = tileFromPosition(primary.position);
    if (x === 0 || y === 0 || x === GRID_SIZE - 1 || y === GRID_SIZE - 1) {
      penalty -= 0.3;
    }
    return penalty;
  }

  private distanceToFrontier(primary: DroneState) {
    const frontiers = computeFrontiers(this.state.visited);
    if (!frontiers.length) {
      return 0;
    }
    const pos = tileFromPosition(primary.position);
    let best = Infinity;
    for (const frontier of frontiers) {
      const dx = frontier.x - pos[0];
      const dy = frontier.y - pos[1];
      const dist = Math.sqrt(dx * dx + dy * dy) / GRID_SIZE;
      if (dist < best) {
        best = dist;
      }
    }
    return Math.min(1, best);
  }

  private neighborOffsets(primary: DroneState) {
    const offsets: Array<{ dx: number; dy: number }> = [];
    for (let i = 1; i < this.state.drones.length; i += 1) {
      const other = this.state.drones[i];
      offsets.push({
        dx: (other.position.x - primary.position.x) / (GRID_SIZE * CELL_SIZE),
        dy: (other.position.y - primary.position.y) / (GRID_SIZE * CELL_SIZE),
      });
    }
    offsets.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));
    return offsets.slice(0, 2);
  }

  private createObservation(): EnvObservation {
    const primary = this.state.drones[0];
    const buffer = new Float32Array(24);
    let index = 0;
    for (let i = 0; i < LIDAR_RAYS; i += 1) {
      const angle = primary.heading + (i / LIDAR_RAYS) * Math.PI * 2;
      buffer[index++] = this.castRay(primary.position, angle);
    }

    const offsets = this.neighborOffsets(primary);
    offsets.forEach(({ dx, dy }) => {
      buffer[index++] = dx;
      buffer[index++] = dy;
    });
    while (index < LIDAR_RAYS + 4) {
      buffer[index++] = 0;
    }

    const [tx, ty] = tileFromPosition(primary.position);
    const coverageRatio = this.state.coverageCount / (GRID_SIZE * GRID_SIZE);
    buffer[index++] = primary.battery;
    buffer[index++] = this.state.visited[toIndex(tx, ty)] ? 1 : 0;
    buffer[index++] = coverageRatio;
    buffer[index++] = this.state.steps / MAX_STEPS;
    buffer[index++] = primary.returning ? 1 : 0;
    buffer[index++] = primary.velocity / THRUST_DISTANCE;
    buffer[index++] = this.state.collisions / Math.max(1, this.state.steps);
    buffer[index++] = this.distanceToFrontier(primary);
    buffer[index++] = Math.hypot(primary.position.x, primary.position.y) / (GRID_SIZE * CELL_SIZE);
    buffer[index++] = offsets.length / (DRONE_COUNT - 1);
    buffer[index++] = this.state.drones.reduce((acc, d) => acc + d.battery, 0) / this.state.drones.length;
    buffer[index++] = coverageRatio >= 0.9 ? 1 : 0;
    buffer[index++] = LIDAR_RAYS / 16;
    buffer[index++] = this.state.steps;
    buffer[index++] = this.state.coverageCount;

    const metadata: SwarmDronesRenderableState = {
      gridSize: GRID_SIZE,
      cellSize: CELL_SIZE,
      visited: [...this.state.visited],
      drones: this.state.drones.map((drone, idx) => ({
        id: drone.id,
        position: { x: drone.position.x, y: drone.position.y },
        heading: drone.heading,
        battery: drone.battery,
        isPrimary: idx === 0,
        returning: drone.returning,
      })),
      frontiers: computeFrontiers(this.state.visited),
      base: { x: BASE_POSITION[0], y: BASE_POSITION[1] },
      steps: this.state.steps,
      maxSteps: MAX_STEPS,
      coverage: coverageRatio,
      collisions: this.state.collisions,
    };

    return { buffer, metadata } as unknown as EnvObservation;
  }

  private castRay(origin: Vector2, angle: number) {
    const direction = new Vector2(Math.cos(angle), Math.sin(angle));
    const maxDistance = GRID_SIZE * CELL_SIZE * 0.75;
    let distance = maxDistance;

    const temp = origin.clone();
    for (let i = 0; i < 36; i += 1) {
      temp.addScaledVector(direction, CELL_SIZE * 0.5);
      if (Math.abs(temp.x) > GRID_HALF || Math.abs(temp.y) > GRID_HALF) {
        distance = origin.distanceTo(temp);
        break;
      }
      for (let d = 1; d < this.state.drones.length; d += 1) {
        const other = this.state.drones[d];
        if (temp.distanceTo(other.position) < CELL_SIZE * 0.35) {
          distance = origin.distanceTo(temp);
          i = 36;
          break;
        }
      }
    }
    return distance / maxDistance;
  }
}

export const createSwarmDronesEnv: EnvFactory = {
  id: "swarm-drones",
  name: "Swarm Drones",
  description:
    "Lidar-guided micro drones cooperatively map neon mazes while maximizing coverage and minimizing collisions.",
  create: () => new SwarmDronesEnv(),
};

const isSwarmRenderableState = (value: unknown): value is SwarmDronesRenderableState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<SwarmDronesRenderableState>;
  return (
    typeof record.gridSize === "number" &&
    Array.isArray(record.visited) &&
    Array.isArray(record.drones)
  );
};

const buildFallbackState = (): SwarmDronesRenderableState => {
  try {
    const env = createSwarmDronesEnv.create();
    const obs = env.reset();
    if (obs && typeof obs === "object" && "metadata" in obs) {
      const metadata = (obs as { metadata?: unknown }).metadata;
      if (isSwarmRenderableState(metadata)) {
        return metadata;
      }
    }
  } catch {
    // ignore
  }

  return {
    gridSize: GRID_SIZE,
    cellSize: CELL_SIZE,
    visited: Array<boolean>(GRID_SIZE * GRID_SIZE).fill(false),
    drones: [],
    frontiers: [],
    base: { x: 0, y: 0 },
    steps: 0,
    maxSteps: MAX_STEPS,
    coverage: 0,
    collisions: 0,
  };
};

const BASE_TILE_COLOR = new Color("#0f172a");
const VISITED_TILE_COLOR = new Color("#38bdf8");
const FRONTIER_TILE_COLOR = new Color("#f97316");
const DRONE_COLOR_PRIMARY = new Color("#22d3ee");
const DRONE_COLOR_SUPPORT = new Color("#6366f1");

export const SwarmDronesScene = memo(function SwarmDronesScene({
  state,
}: {
  state: SwarmDronesRenderableState;
}) {
  const fallbackState = useMemo(buildFallbackState, []);
  const resolvedState = useMemo(() => {
    if (isSwarmRenderableState(state)) {
      return state;
    }
    return fallbackState;
  }, [state, fallbackState]);

  const tilePositions = useMemo(() => {
    const positions: Array<{ position: NumericTuple; index: number }> = [];
    let index = 0;
    for (let y = 0; y < resolvedState.gridSize; y += 1) {
      for (let x = 0; x < resolvedState.gridSize; x += 1) {
        const px = x * resolvedState.cellSize - GRID_HALF;
        const py = y * resolvedState.cellSize - GRID_HALF;
        positions.push({ position: [px, py], index });
        index += 1;
      }
    }
    return positions;
  }, [resolvedState.gridSize, resolvedState.cellSize]);

  const tileRef = useRef<InstancedMesh>(null);
  const droneRef = useRef<InstancedMesh>(null);
  const rotorRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!tileRef.current) {
      return;
    }
    tilePositions.forEach(({ position, index }) => {
      tempObject.position.set(position[0], -2, position[1]);
      tempObject.scale.set(1, 0.05, 1);
      tempObject.updateMatrix();
      tileRef.current!.setMatrixAt(index, tempObject.matrix);
      tileRef.current!.setColorAt(index, BASE_TILE_COLOR);
    });
    tileRef.current.instanceMatrix.needsUpdate = true;
    tileRef.current.instanceColor!.needsUpdate = true;
  }, [tilePositions, tempObject]);

  useEffect(() => {
    if (!tileRef.current) {
      return;
    }
    resolvedState.visited.forEach((visited, idx) => {
      const color = visited ? VISITED_TILE_COLOR : BASE_TILE_COLOR;
      tileRef.current!.setColorAt(idx, color);
    });
    resolvedState.frontiers.forEach(({ x, y }) => {
      const idx = toIndex(x, y);
      tileRef.current!.setColorAt(idx, FRONTIER_TILE_COLOR);
    });
    tileRef.current.instanceColor!.needsUpdate = true;
  }, [resolvedState.visited, resolvedState.frontiers]);

  useEffect(() => {
    if (!droneRef.current) {
      return;
    }
    const drones = resolvedState.drones;
    drones.forEach((drone, index) => {
      tempObject.position.set(drone.position.x, 6, drone.position.y);
      tempObject.rotation.set(0, -drone.heading + Math.PI / 2, 0);
      tempObject.scale.set(1.1, 1.1, 1.1);
      tempObject.updateMatrix();
      droneRef.current!.setMatrixAt(index, tempObject.matrix);
      droneRef.current!.setColorAt(index, drone.isPrimary ? DRONE_COLOR_PRIMARY : DRONE_COLOR_SUPPORT);
    });
    droneRef.current.count = drones.length;
    droneRef.current.instanceMatrix.needsUpdate = true;
    droneRef.current.instanceColor!.needsUpdate = true;

    if (rotorRef.current) {
      drones.forEach((drone, index) => {
        tempObject.position.set(drone.position.x, 8, drone.position.y);
        tempObject.scale.set(0.8, 0.1, 0.8);
        tempObject.updateMatrix();
        rotorRef.current!.setMatrixAt(index, tempObject.matrix);
        rotorRef.current!.setColorAt(index, drone.isPrimary ? DRONE_COLOR_PRIMARY : DRONE_COLOR_SUPPORT);
      });
      rotorRef.current.count = drones.length;
      rotorRef.current.instanceMatrix.needsUpdate = true;
      rotorRef.current.instanceColor!.needsUpdate = true;
    }
  }, [resolvedState.drones, tempObject]);

  useFrame(() => {
    if (rotorRef.current) {
      for (let i = 0; i < rotorRef.current.count; i += 1) {
        rotorRef.current.getMatrixAt(i, tempObject.matrix);
        tempObject.rotation.set(0, 0, (performance.now() / 80) % (Math.PI * 2));
        tempObject.updateMatrix();
        rotorRef.current.setMatrixAt(i, tempObject.matrix);
      }
      rotorRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
  <hemisphereLight args={[new Color("#38bdf8"), new Color("#020617"), 0.6]} />
      <spotLight
        position={[80, 180, 120]}
        intensity={1.8}
        angle={0.4}
        penumbra={0.6}
        color={0x38bdf8}
        castShadow
      />
      <spotLight
        position={[-120, 200, -160]}
        intensity={1.5}
        angle={0.5}
        penumbra={0.4}
        color={0x22d3ee}
      />
      <mesh position={[0, -8, 0]} receiveShadow>
        <boxGeometry args={[GRID_SIZE * CELL_SIZE * 1.1, 4, GRID_SIZE * CELL_SIZE * 1.1]} />
        <meshStandardMaterial color="#020617" roughness={0.9} metalness={0.1} />
      </mesh>

      <instancedMesh ref={tileRef} args={[undefined, undefined, resolvedState.gridSize * resolvedState.gridSize]}>
        <boxGeometry args={[CELL_SIZE * 0.92, 1.2, CELL_SIZE * 0.92]} />
        <meshStandardMaterial emissive="#0ea5e9" emissiveIntensity={0.12} vertexColors />
      </instancedMesh>

      <instancedMesh ref={droneRef} args={[undefined, undefined, resolvedState.drones.length]}>
        <cylinderGeometry args={[3.5, 6.0, 6, 6]} />
        <meshStandardMaterial emissive="#0ea5e9" emissiveIntensity={0.4} metalness={0.3} roughness={0.6} vertexColors />
      </instancedMesh>

      <instancedMesh ref={rotorRef} args={[undefined, undefined, resolvedState.drones.length]}>
        <cylinderGeometry args={[6.5, 6.5, 0.6, 16]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.6} transparent opacity={0.6} vertexColors />
      </instancedMesh>

      <mesh position={[resolvedState.base.x, 0, resolvedState.base.y]}>
        <cylinderGeometry args={[7, 7, 4, 24]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} metalness={0.8} roughness={0.2} />
      </mesh>

      <directionalLight position={[0, 100, 0]} intensity={0.3} color={0x22d3ee} />
    </group>
  );
});

export const SwarmDronesDefinition: EnvDefinition<SwarmDronesRenderableState> = {
  ...createSwarmDronesEnv,
  Scene: SwarmDronesScene,
};
