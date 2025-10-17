"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, Object3D, Vector2 } from "three";
import type { Env, EnvFactory, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

const GRID_SIZE = 14;
const CELL_SIZE = 24;
const PLOW_COUNT = 4;
const VEHICLE_COUNT = 10;
const MAX_STEPS = 720;
const TURN_ANGLE = (18 / 180) * Math.PI;
const MAX_SPEED = 14;
const MIN_SPEED = 2;

interface PlowState {
  id: number;
  position: Vector2;
  heading: number;
  speed: number;
  plowAngle: number;
  salt: number;
  fuel: number;
  cleared: number;
}

interface VehicleState {
  id: number;
  position: Vector2;
  heading: number;
  speed: number;
}

interface SnowplowState {
  plows: PlowState[];
  vehicles: VehicleState[];
  snowDepth: number[];
  accidents: number;
  steps: number;
  weatherIntensity: number;
}

export interface SnowplowFleetRenderableState {
  gridSize: number;
  cellSize: number;
  snowDepth: number[];
  plows: Array<{
    id: number;
    position: { x: number; y: number };
    heading: number;
    speed: number;
    plowAngle: number;
    salt: number;
    fuel: number;
  }>;
  vehicles: Array<{
    id: number;
    position: { x: number; y: number };
    heading: number;
  }>;
  accidents: number;
  cleared: number;
  steps: number;
  maxSteps: number;
  weatherIntensity: number;
}

const gridIndex = (x: number, y: number) => y * GRID_SIZE + x;

const clampToGrid = (value: Vector2) => {
  const half = ((GRID_SIZE - 1) * CELL_SIZE) / 2;
  return new Vector2(
    Math.max(-half, Math.min(half, value.x)),
    Math.max(-half, Math.min(half, value.y))
  );
};

const isFiniteNumber = (value: number): value is number => Number.isFinite(value);
const isFiniteVector = (value: { x: number; y: number }) =>
  value !== undefined && isFiniteNumber(value.x) && isFiniteNumber(value.y);
const clamp01 = (value: number, fallback = 0) => {
  if (!isFiniteNumber(value)) {
    return fallback;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
};

const toTile = (position: Vector2) => {
  const half = ((GRID_SIZE - 1) * CELL_SIZE) / 2;
  const x = Math.min(
    GRID_SIZE - 1,
    Math.max(0, Math.round((position.x + half) / CELL_SIZE))
  );
  const y = Math.min(
    GRID_SIZE - 1,
    Math.max(0, Math.round((position.y + half) / CELL_SIZE))
  );
  return { x, y };
};

class SnowplowFleetEnv implements Env {
  readonly id = "snowplow-fleet";
  readonly actionSpace = { type: "discrete", n: 5 } as const;
  readonly obsSpace = { shape: [24] } as const;

  private rng: () => number;
  private state: SnowplowState;

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
    const leader = this.state.plows[0];
    let reward = -0.02;

    switch (active) {
      case 0:
        leader.heading -= TURN_ANGLE;
        break;
      case 1:
        leader.heading += TURN_ANGLE;
        break;
      case 2:
        leader.speed = Math.min(MAX_SPEED, leader.speed + 2);
        break;
      case 3:
        leader.plowAngle = leader.plowAngle > 0 ? 0 : 0.35;
        reward -= 0.01;
        break;
      case 4:
        if (leader.salt > 0) {
          leader.salt = Math.max(0, leader.salt - 0.06);
          this.addSaltTreatment(leader.position, leader.plowAngle);
          reward -= 0.05;
        }
        break;
      default:
        break;
    }

    this.advancePlow(leader);
    const clearedReward = this.clearSnow(leader);
    reward += clearedReward;

    this.advanceSupportPlows();
    this.advanceVehicles();
    const accidentPenalty = this.checkCollisions();
    reward += accidentPenalty;

    leader.fuel = Math.max(0, leader.fuel - leader.speed * 0.002 - (leader.plowAngle > 0 ? 0.002 : 0));
    leader.speed = Math.max(MIN_SPEED, leader.speed * 0.92);

    this.state.steps += 1;
    const done =
      this.state.steps >= MAX_STEPS ||
      leader.fuel <= 0 ||
      this.state.accidents >= 6;

    const observation = this.buildObservation();

    return {
      state: observation,
      reward,
      done,
      info: {
        accidents: this.state.accidents,
        cleared: leader.cleared,
        fuel: leader.fuel,
        salt: leader.salt,
      },
    };
  }

  private createInitialState(): SnowplowState {
    const half = ((GRID_SIZE - 1) * CELL_SIZE) / 2;
    const plows: PlowState[] = Array.from({ length: PLOW_COUNT }, (_, id) => ({
      id,
      position: new Vector2(-half + id * CELL_SIZE * 2, half - CELL_SIZE * 2),
      heading: -Math.PI / 2,
      speed: MIN_SPEED + this.rng() * 2,
      plowAngle: 0,
      salt: 1,
      fuel: 1,
      cleared: 0,
    }));

    const vehicles: VehicleState[] = Array.from({ length: VEHICLE_COUNT }, (_, id) => ({
      id,
      position: new Vector2(
        -half + (id % GRID_SIZE) * CELL_SIZE,
        -half + Math.floor(id / (GRID_SIZE / 2)) * CELL_SIZE
      ),
      heading: id % 2 === 0 ? 0 : Math.PI,
      speed: 8 + this.rng() * 4,
    }));

    const snowDepth = Array<number>(GRID_SIZE * GRID_SIZE)
      .fill(0)
      .map(() => 0.5 + this.rng() * 0.5);

    return {
      plows,
      vehicles,
      snowDepth,
      accidents: 0,
      steps: 0,
      weatherIntensity: 0.5 + this.rng() * 0.5,
    };
  }

  private advancePlow(plow: PlowState) {
    const dx = Math.cos(plow.heading) * plow.speed;
    const dy = Math.sin(plow.heading) * plow.speed;
    plow.position.add(new Vector2(dx, dy));
    plow.position.copy(clampToGrid(plow.position));
  }

  private addSaltTreatment(position: Vector2, angle: number) {
    const radius = angle > 0 ? 2 : 1;
    const tile = toTile(position);
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const x = tile.x + dx;
        const y = tile.y + dy;
        if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
          continue;
        }
        const idx = gridIndex(x, y);
        this.state.snowDepth[idx] = Math.max(0, this.state.snowDepth[idx] - 0.05);
      }
    }
  }

  private clearSnow(plow: PlowState) {
    const tile = toTile(plow.position);
    const idx = gridIndex(tile.x, tile.y);
    const depth = this.state.snowDepth[idx];
    const clearance = Math.min(depth, (plow.speed / MAX_SPEED) * (plow.plowAngle > 0 ? 0.6 : 0.4));
    if (clearance <= 0) {
      return -0.01;
    }
    this.state.snowDepth[idx] = Math.max(0, depth - clearance);
    plow.cleared += clearance;
    return clearance * 8;
  }

  private advanceSupportPlows() {
    for (let i = 1; i < this.state.plows.length; i += 1) {
      const plow = this.state.plows[i];
      if (this.rng() < 0.3) {
        plow.heading += (this.rng() - 0.5) * TURN_ANGLE;
      }
      this.advancePlow(plow);
      this.clearSnow(plow);
      plow.speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, plow.speed + (this.rng() - 0.5)));
      plow.plowAngle = plow.plowAngle > 0 ? plow.plowAngle : (this.rng() < 0.2 ? 0.35 : 0);
      plow.fuel = Math.max(0.2, plow.fuel - 0.002);
      if (plow.salt > 0 && this.rng() < 0.1) {
        plow.salt = Math.max(0, plow.salt - 0.02);
      }
    }
  }

  private advanceVehicles() {
    const half = ((GRID_SIZE - 1) * CELL_SIZE) / 2;
    for (const vehicle of this.state.vehicles) {
      const dx = Math.cos(vehicle.heading) * vehicle.speed;
      const dy = Math.sin(vehicle.heading) * vehicle.speed;
      vehicle.position.add(new Vector2(dx, dy));
      if (Math.abs(vehicle.position.x) > half || Math.abs(vehicle.position.y) > half) {
        vehicle.position.x = -vehicle.position.x;
        vehicle.position.y = -vehicle.position.y;
      }
    }
  }

  private checkCollisions() {
    let penalty = 0;
    const leader = this.state.plows[0];
    for (const vehicle of this.state.vehicles) {
      const distance = leader.position.distanceTo(vehicle.position);
      if (distance < CELL_SIZE * 0.3) {
        penalty -= 1.5;
        this.state.accidents += 1;
        vehicle.position.add(new Vector2((Math.random() - 0.5) * CELL_SIZE, (Math.random() - 0.5) * CELL_SIZE));
      }
    }
    return penalty;
  }

  private buildObservation(): EnvObservation {
    const leader = this.state.plows[0];
    const tile = toTile(leader.position);
    const buffer = new Float32Array(24);
    let index = 0;

    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        if (index >= 12) {
          break;
        }
        const x = tile.x + dx;
        const y = tile.y + dy;
        if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) {
          buffer[index++] = 1;
        } else {
          buffer[index++] = this.state.snowDepth[gridIndex(x, y)];
        }
      }
    }

    const nearbyTraffic = this.state.vehicles.filter(
      (vehicle) => vehicle.position.distanceTo(leader.position) < CELL_SIZE * 2
    );

    buffer[index++] = leader.speed / MAX_SPEED;
    buffer[index++] = leader.plowAngle;
    buffer[index++] = leader.salt;
    buffer[index++] = leader.fuel;
    buffer[index++] = nearbyTraffic.length / VEHICLE_COUNT;
    buffer[index++] = this.state.accidents / Math.max(1, this.state.steps);
    buffer[index++] = this.state.steps / MAX_STEPS;
    buffer[index++] = this.state.weatherIntensity;
    buffer[index++] = leader.cleared;

    while (index < buffer.length) {
      buffer[index++] = 0;
    }

    const metadata: SnowplowFleetRenderableState = {
      gridSize: GRID_SIZE,
      cellSize: CELL_SIZE,
      snowDepth: [...this.state.snowDepth],
      plows: this.state.plows.map((plow) => ({
        id: plow.id,
        position: { x: plow.position.x, y: plow.position.y },
        heading: plow.heading,
        speed: plow.speed,
        plowAngle: plow.plowAngle,
        salt: plow.salt,
        fuel: plow.fuel,
      })),
      vehicles: this.state.vehicles.map((vehicle) => ({
        id: vehicle.id,
        position: { x: vehicle.position.x, y: vehicle.position.y },
        heading: vehicle.heading,
      })),
      accidents: this.state.accidents,
      cleared: this.state.plows[0].cleared,
      steps: this.state.steps,
      maxSteps: MAX_STEPS,
      weatherIntensity: this.state.weatherIntensity,
    };

    return { buffer, metadata } as unknown as EnvObservation;
  }
}

export const createSnowplowFleetEnv: EnvFactory = {
  id: "snowplow-fleet",
  name: "Snowplow Fleet",
  description: "Autonomous plows clear storm-lashed city blocks, balancing collisions, salt, and lane coverage feedback.",
  create: () => new SnowplowFleetEnv(),
};

const isRenderableState = (value: unknown): value is SnowplowFleetRenderableState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<SnowplowFleetRenderableState>;
  return Array.isArray(record.snowDepth) && Array.isArray(record.plows);
};

const buildFallbackState = (): SnowplowFleetRenderableState => {
  try {
    const env = createSnowplowFleetEnv.create();
    const obs = env.reset();
    if (obs && typeof obs === "object" && "metadata" in obs) {
      const metadata = (obs as { metadata?: unknown }).metadata;
      if (isRenderableState(metadata)) {
        return metadata;
      }
    }
  } catch {
    // ignore
  }

  return {
    gridSize: GRID_SIZE,
    cellSize: CELL_SIZE,
    snowDepth: Array<number>(GRID_SIZE * GRID_SIZE).fill(0),
    plows: [],
    vehicles: [],
    accidents: 0,
    cleared: 0,
    steps: 0,
    maxSteps: MAX_STEPS,
    weatherIntensity: 0.5,
  };
};

const SNOW_COLOR = new Color("#cbd5f5");
const CLEAR_COLOR = new Color("#0ea5e9");
const PLOW_COLOR = new Color("#fbbf24");
const VEHICLE_COLOR = new Color("#94a3b8");

export const SnowplowFleetScene = memo(function SnowplowFleetScene({
  state,
}: {
  state: SnowplowFleetRenderableState;
}) {
  const fallback = useMemo(buildFallbackState, []);
  const resolvedState = useMemo(() => {
    if (isRenderableState(state)) {
      return state;
    }
    return fallback;
  }, [state, fallback]);

  const snowRef = useRef<InstancedMesh>(null);
  const plowRef = useRef<InstancedMesh>(null);
  const vehicleRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);
  const snowflakeRef = useRef<InstancedMesh>(null);

  const sanitizedSnowDepth = useMemo(() => {
    let invalidEntries = 0;
    const values = resolvedState.snowDepth.map((depth) => {
      if (!isFiniteNumber(depth)) {
        invalidEntries += 1;
        return 0;
      }
      return Math.max(0, depth);
    });
    if (invalidEntries > 0 && process.env.NODE_ENV !== "production") {
      console.warn(`[SnowplowFleetScene] Dropped ${invalidEntries} non-finite snow-depth readings.`);
    }
    return values;
  }, [resolvedState.snowDepth]);

  const sanitizedPlows = useMemo<SnowplowFleetRenderableState["plows"]>(() => {
    const entries: SnowplowFleetRenderableState["plows"] = [];
    resolvedState.plows.forEach((plow, index) => {
      const { position } = plow;
      if (!position || !isFiniteNumber(position.x) || !isFiniteNumber(position.y) || !isFiniteNumber(plow.heading)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[SnowplowFleetScene] Skipping invalid plow entry at index ${index}.`, plow);
        }
        return;
      }
      const clampedPosition = clampToGrid(new Vector2(position.x, position.y));
      entries.push({
        id: plow.id,
        position: { x: clampedPosition.x, y: clampedPosition.y },
        heading: plow.heading,
        speed: isFiniteNumber(plow.speed) ? plow.speed : MIN_SPEED,
        plowAngle: isFiniteNumber(plow.plowAngle) ? plow.plowAngle : 0,
        salt: clamp01(plow.salt, 1),
        fuel: clamp01(plow.fuel, 1),
      });
    });
    return entries;
  }, [resolvedState.plows]);

  const sanitizedVehicles = useMemo<SnowplowFleetRenderableState["vehicles"]>(() => {
    const entries: SnowplowFleetRenderableState["vehicles"] = [];
    resolvedState.vehicles.forEach((vehicle, index) => {
      const { position } = vehicle;
      if (!position || !isFiniteNumber(position.x) || !isFiniteNumber(position.y) || !isFiniteNumber(vehicle.heading)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[SnowplowFleetScene] Skipping invalid vehicle entry at index ${index}.`, vehicle);
        }
        return;
      }
      const clampedPosition = clampToGrid(new Vector2(position.x, position.y));
      entries.push({
        id: vehicle.id,
        position: { x: clampedPosition.x, y: clampedPosition.y },
        heading: vehicle.heading,
      });
    });
    return entries;
  }, [resolvedState.vehicles]);

  const clampedWeatherIntensity = useMemo(() => {
    const value = clamp01(resolvedState.weatherIntensity, 0.5);
    if (!isFiniteNumber(resolvedState.weatherIntensity) && process.env.NODE_ENV !== "production") {
      console.warn(`[SnowplowFleetScene] Non-finite weather intensity encountered:`, resolvedState.weatherIntensity);
    }
    return value;
  }, [resolvedState.weatherIntensity]);

  const snowPositions = useMemo(() => {
    const positions: Array<{ position: Vector2; index: number }> = [];
    let index = 0;
    for (let y = 0; y < resolvedState.gridSize; y += 1) {
      for (let x = 0; x < resolvedState.gridSize; x += 1) {
        const half = ((resolvedState.gridSize - 1) * resolvedState.cellSize) / 2;
        positions.push({ position: new Vector2(x * resolvedState.cellSize - half, y * resolvedState.cellSize - half), index });
        index += 1;
      }
    }
    return positions;
  }, [resolvedState.gridSize, resolvedState.cellSize]);

  useEffect(() => {
    if (!snowRef.current) {
      return;
    }
    snowPositions.forEach(({ position, index }) => {
      if (!isFiniteVector(position)) {
        return;
      }
      tempObject.position.set(position.x, 0, position.y);
      tempObject.scale.set(1, 1, 1);
      tempObject.updateMatrix();
      snowRef.current!.setMatrixAt(index, tempObject.matrix);
    });
    snowRef.current.instanceMatrix.needsUpdate = true;
  }, [snowPositions, tempObject]);

  useEffect(() => {
    if (!snowRef.current) {
      return;
    }
    sanitizedSnowDepth.forEach((depth, index) => {
      const color = CLEAR_COLOR.clone().lerp(SNOW_COLOR, Math.min(1, depth));
      snowRef.current!.setColorAt(index, color);
    });
    if (snowRef.current.instanceColor) {
      snowRef.current.instanceColor.needsUpdate = true;
    }
  }, [sanitizedSnowDepth]);

  useEffect(() => {
    if (!plowRef.current) {
      return;
    }
    let count = 0;
    sanitizedPlows.forEach((plow) => {
      tempObject.position.set(plow.position.x, 4, plow.position.y);
      tempObject.rotation.set(0, plow.heading, 0);
      tempObject.scale.set(1.2, 1.2, 1.2);
      tempObject.updateMatrix();
      plowRef.current!.setMatrixAt(count, tempObject.matrix);
      const color = PLOW_COLOR.clone().lerp(new Color("#16a34a"), Math.max(0, 1 - plow.fuel));
      plowRef.current!.setColorAt(count, color);
      count += 1;
    });
    plowRef.current.count = count;
    plowRef.current.instanceMatrix.needsUpdate = true;
    if (plowRef.current.instanceColor) {
      plowRef.current.instanceColor.needsUpdate = true;
    }
  }, [sanitizedPlows, tempObject]);

  useEffect(() => {
    if (!vehicleRef.current) {
      return;
    }
    let count = 0;
    sanitizedVehicles.forEach((vehicle) => {
      tempObject.position.set(vehicle.position.x, 2, vehicle.position.y);
      tempObject.rotation.set(0, vehicle.heading, 0);
      tempObject.scale.set(1, 1, 1);
      tempObject.updateMatrix();
      vehicleRef.current!.setMatrixAt(count, tempObject.matrix);
      vehicleRef.current!.setColorAt(count, VEHICLE_COLOR);
      count += 1;
    });
    vehicleRef.current.count = count;
    vehicleRef.current.instanceMatrix.needsUpdate = true;
    if (vehicleRef.current.instanceColor) {
      vehicleRef.current.instanceColor.needsUpdate = true;
    }
  }, [sanitizedVehicles, tempObject]);

  useEffect(() => {
    if (!snowflakeRef.current) {
      return;
    }
    for (let i = 0; i < snowflakeRef.current.count; i += 1) {
      const randX = (Math.random() - 0.5) * GRID_SIZE * CELL_SIZE;
      const randZ = (Math.random() - 0.5) * GRID_SIZE * CELL_SIZE;
      const randY = 60 + Math.random() * 40;
      tempObject.position.set(randX, randY, randZ);
      const scale = 0.5 + Math.random() * 0.8;
      tempObject.scale.set(scale, scale, scale);
      tempObject.updateMatrix();
      snowflakeRef.current.setMatrixAt(i, tempObject.matrix);
    }
    snowflakeRef.current.instanceMatrix.needsUpdate = true;
  }, [tempObject]);

  useFrame((state, delta) => {
    if (snowflakeRef.current) {
      for (let i = 0; i < snowflakeRef.current.count; i += 1) {
        snowflakeRef.current.getMatrixAt(i, tempObject.matrix);
        tempObject.position.y -= delta * 10 * clampedWeatherIntensity;
        if (tempObject.position.y < 0) {
          tempObject.position.y = 80 + Math.random() * 20;
        }
        tempObject.updateMatrix();
        snowflakeRef.current.setMatrixAt(i, tempObject.matrix);
      }
      snowflakeRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.25} color={0xbdd6f4} />
      <spotLight
        position={[90, 220, 120]}
        intensity={2.2}
        angle={0.5}
        penumbra={0.6}
        color={0x38bdf8}
      />
      <directionalLight position={[-140, 180, -160]} intensity={1.4} color={0x93c5fd} />

      <mesh position={[0, -6, 0]} receiveShadow>
        <boxGeometry args={[GRID_SIZE * CELL_SIZE * 1.2, 8, GRID_SIZE * CELL_SIZE * 1.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} metalness={0.1} />
      </mesh>

      <instancedMesh ref={snowRef} args={[undefined, undefined, sanitizedSnowDepth.length]}>
        <boxGeometry args={[CELL_SIZE * 0.95, 1.2, CELL_SIZE * 0.95]} />
        <meshStandardMaterial emissive="#38bdf8" emissiveIntensity={0.12} vertexColors />
      </instancedMesh>

      <instancedMesh ref={plowRef} args={[undefined, undefined, sanitizedPlows.length]}>
        <boxGeometry args={[CELL_SIZE * 0.8, 6, CELL_SIZE * 1.4]} />
        <meshStandardMaterial emissive="#fbbf24" emissiveIntensity={0.5} vertexColors />
      </instancedMesh>

      <instancedMesh ref={vehicleRef} args={[undefined, undefined, sanitizedVehicles.length]}>
        <boxGeometry args={[CELL_SIZE * 0.6, 4, CELL_SIZE]} />
        <meshStandardMaterial emissive="#94a3b8" emissiveIntensity={0.3} vertexColors />
      </instancedMesh>

      <instancedMesh ref={snowflakeRef} args={[undefined, undefined, 120]}>
        <coneGeometry args={[0.4, 1.2, 5]} />
        <meshStandardMaterial color="#e2e8f0" emissive="#e0f2fe" emissiveIntensity={0.4} transparent opacity={0.7} />
      </instancedMesh>
    </group>
  );
});

export const SnowplowFleetDefinition: EnvDefinition<SnowplowFleetRenderableState> = {
  ...createSnowplowFleetEnv,
  Scene: SnowplowFleetScene,
};
