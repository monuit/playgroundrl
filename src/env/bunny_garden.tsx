"use client";

import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import { DoubleSide } from "three";
import type { Group } from "three";
import type { Env, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

interface Vector2 {
  x: number;
  y: number;
}

interface BunnyCarrot {
  id: number;
  position: Vector2;
  value: number;
  active: boolean;
}

interface BunnyObstacle {
  id: number;
  position: Vector2;
  radius: number;
  height: number;
}

export interface BunnyRenderableState {
  bounds: number;
  bunny: {
    position: Vector2;
    heading: number;
    energy: number;
  };
  carrots: BunnyCarrot[];
  obstacles: BunnyObstacle[];
  trail: Vector2[];
  steps: number;
  maxSteps: number;
  collected: number;
  target: number;
}

const ACTION_VECTORS: Record<number, Vector2> = {
  0: { x: 0, y: 1 },
  1: { x: 1, y: 1 },
  2: { x: 1, y: 0 },
  3: { x: 1, y: -1 },
  4: { x: 0, y: -1 },
  5: { x: -1, y: -1 },
  6: { x: -1, y: 0 },
  7: { x: -1, y: 1 },
};

const BOUNDS = 120;
const MAX_STEPS = 240;
const MAX_TRAIL = 48;
const TARGET_CARROTS = 6;
const CARROT_COUNT = 5;
const OBSTACLE_COUNT = 4;
const BASE_SPEED = 12;
const CARROT_RADIUS = 10;
const ENERGY_DECAY = 0.006;
const ENERGY_REPLENISH = 0.18;
const START_ENERGY = 1;

interface BunnyInternalState {
  bunny: Vector2;
  velocity: Vector2;
  energy: number;
  carrots: BunnyCarrot[];
  obstacles: BunnyObstacle[];
  trail: Vector2[];
  steps: number;
  collected: number;
}

class BunnyGardenEnv implements Env {
  readonly id = "lumen-bunny";
  readonly actionSpace = { type: "discrete", n: 8 } as const;
  readonly obsSpace = { shape: [16] } as const;

  private rng: () => number;
  private state: BunnyInternalState;

  constructor() {
    this.rng = () => Math.random();
    this.state = this.createInitialState();
  }

  reset(): EnvObservation {
    this.state = this.createInitialState();
    return this.getObservation();
  }

  step(action: number | number[]): EnvStepResult {
    const direction = ACTION_VECTORS[Array.isArray(action) ? action[0] ?? 0 : action ?? 0] ?? {
      x: 0,
      y: 0,
    };
    const magnitude = Math.hypot(direction.x, direction.y) || 1;
    const velocity = {
      x: (direction.x / magnitude) * BASE_SPEED,
      y: (direction.y / magnitude) * BASE_SPEED,
    };

    const previousPosition = { ...this.state.bunny };
  const previousNearest: BunnyCarrot | null = this.findNearestCarrot(this.state.bunny);

    this.state.velocity = velocity;
    this.state.bunny = this.applyMovement(this.state.bunny, velocity);
    const collided = this.resolveObstacleCollision();

  const nearest: BunnyCarrot | null = this.findNearestCarrot(this.state.bunny);
    let reward = -0.01 - (Math.hypot(velocity.x, velocity.y) / (BASE_SPEED * 12));
    if (previousNearest && nearest) {
      const before = Math.hypot(
        previousNearest.position.x - previousPosition.x,
        previousNearest.position.y - previousPosition.y
      );
      const after = Math.hypot(
        nearest.position.x - this.state.bunny.x,
        nearest.position.y - this.state.bunny.y
      );
      reward += (before - after) / (BOUNDS * 2);
    }

    if (collided) {
      reward -= 0.08;
    }

    let collectedNow = false;
    this.state.carrots = this.state.carrots.map((carrot) => {
      if (!carrot.active) {
        return carrot;
      }
      const distance = Math.hypot(
        carrot.position.x - this.state.bunny.x,
        carrot.position.y - this.state.bunny.y
      );
      if (distance <= CARROT_RADIUS) {
        collectedNow = true;
        this.state.collected += 1;
        reward += 1.6 * carrot.value;
        this.state.energy = Math.min(1, this.state.energy + ENERGY_REPLENISH * carrot.value);
        return {
          ...carrot,
          position: this.randomSpot(40),
          value: this.randomValue(),
          active: true,
        };
      }
      return carrot;
    });

    if (!collectedNow) {
      this.state.energy = Math.max(0, this.state.energy - ENERGY_DECAY * (1 + magnitude * 0.05));
    }

    this.state.steps += 1;
    this.updateTrail(this.state.bunny);

    const done =
      this.state.steps >= MAX_STEPS ||
      this.state.energy <= 0 ||
      this.state.collected >= TARGET_CARROTS;

    return {
      state: this.getObservation(),
      reward,
      done,
      info: {
        collected: this.state.collected,
        energy: this.state.energy,
        steps: this.state.steps,
      },
    };
  }

  private createInitialState(): BunnyInternalState {
    const obstacles = Array.from({ length: OBSTACLE_COUNT }, (_, id) => ({
      id,
      position: this.randomSpot(0),
      radius: 16 + this.rng() * 12,
      height: 24 + this.rng() * 12,
    }));

    const carrots: BunnyCarrot[] = Array.from({ length: CARROT_COUNT }, (_, id) => ({
      id,
      position: this.randomSpot(30),
      value: this.randomValue(),
      active: true,
    }));

    return {
      bunny: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      energy: START_ENERGY,
      carrots,
      obstacles,
      trail: [],
      steps: 0,
      collected: 0,
    };
  }

  private getObservation(): EnvObservation {
  const nearest: BunnyCarrot | null = this.findNearestCarrot(this.state.bunny);
  const nearestId = nearest ? nearest.id : -1;
  const nextNearest: BunnyCarrot | null = this.findNextNearest(this.state.bunny, nearestId);

    const buffer = new Float32Array([
      this.state.bunny.x / BOUNDS,
      this.state.bunny.y / BOUNDS,
      this.state.velocity.x / BASE_SPEED,
      this.state.velocity.y / BASE_SPEED,
      this.state.energy,
      this.state.steps / MAX_STEPS,
      this.state.collected / TARGET_CARROTS,
      nearest ? (nearest.position.x - this.state.bunny.x) / BOUNDS : 0,
      nearest ? (nearest.position.y - this.state.bunny.y) / BOUNDS : 0,
      nearest
        ? Math.hypot(
            nearest.position.x - this.state.bunny.x,
            nearest.position.y - this.state.bunny.y
          ) /
          (Math.sqrt(2) * BOUNDS)
        : 1,
      nextNearest ? (nextNearest.position.x - this.state.bunny.x) / BOUNDS : 0,
      nextNearest ? (nextNearest.position.y - this.state.bunny.y) / BOUNDS : 0,
      this.state.carrots.length ? this.state.carrots.filter((carrot) => carrot.active).length / CARROT_COUNT : 0,
      this.state.obstacles.length ? this.state.obstacles[0].radius / (BOUNDS / 2) : 0,
      this.state.obstacles.length > 1 ? this.state.obstacles[1].radius / (BOUNDS / 2) : 0,
      this.state.energy * (nearest ? nearest.value : 0.5),
    ]);

    const metadata: BunnyRenderableState = {
      bounds: BOUNDS,
      bunny: {
        position: { ...this.state.bunny },
        heading: Math.atan2(this.state.velocity.y, this.state.velocity.x) || 0,
        energy: this.state.energy,
      },
      carrots: this.state.carrots.map((carrot) => ({ ...carrot })),
      obstacles: this.state.obstacles.map((obstacle) => ({ ...obstacle })),
      trail: this.state.trail.map((point) => ({ ...point })),
      steps: this.state.steps,
      maxSteps: MAX_STEPS,
      collected: this.state.collected,
      target: TARGET_CARROTS,
    };

    return { buffer, metadata } as unknown as EnvObservation;
  }

  private applyMovement(position: Vector2, velocity: Vector2) {
    const next = {
      x: position.x + velocity.x,
      y: position.y + velocity.y,
    };
    return {
      x: Math.min(BOUNDS, Math.max(-BOUNDS, next.x)),
      y: Math.min(BOUNDS, Math.max(-BOUNDS, next.y)),
    };
  }

  private resolveObstacleCollision() {
    let collided = false;
    this.state.obstacles.forEach((obstacle) => {
      const dx = this.state.bunny.x - obstacle.position.x;
      const dy = this.state.bunny.y - obstacle.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance < obstacle.radius) {
        collided = true;
        const push = obstacle.radius - distance;
        const nx = dx / (distance || 1);
        const ny = dy / (distance || 1);
        this.state.bunny.x += nx * push;
        this.state.bunny.y += ny * push;
      }
    });
    return collided;
  }

  private findNearestCarrot(origin: Vector2): BunnyCarrot | null {
    let best: BunnyCarrot | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    this.state.carrots.forEach((carrot) => {
      if (!carrot.active) {
        return;
      }
      const distance = Math.hypot(origin.x - carrot.position.x, origin.y - carrot.position.y);
      if (distance < bestDistance) {
        best = carrot;
        bestDistance = distance;
      }
    });
    return best;
  }

  private findNextNearest(origin: Vector2, excludeId: number): BunnyCarrot | null {
    let best: BunnyCarrot | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    this.state.carrots.forEach((carrot) => {
      if (!carrot.active || carrot.id === excludeId) {
        return;
      }
      const distance = Math.hypot(origin.x - carrot.position.x, origin.y - carrot.position.y);
      if (distance < bestDistance) {
        best = carrot;
        bestDistance = distance;
      }
    });
    return best;
  }

  private updateTrail(position: Vector2) {
    this.state.trail.push({ ...position });
    if (this.state.trail.length > MAX_TRAIL) {
      this.state.trail.shift();
    }
  }

  private randomSpot(margin: number): Vector2 {
    const range = BOUNDS - margin;
    return {
      x: (this.rng() * 2 - 1) * range,
      y: (this.rng() * 2 - 1) * range,
    };
  }

  private randomValue() {
    return 0.8 + this.rng() * 0.4;
  }
}

const isRenderableState = (value: unknown): value is BunnyRenderableState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<BunnyRenderableState>;
  return (
    typeof record.bounds === "number" &&
    record.bunny !== undefined &&
    Array.isArray(record.carrots) &&
    Array.isArray(record.obstacles)
  );
};

const buildFallbackState = (): BunnyRenderableState => {
  try {
    const env = new BunnyGardenEnv();
    const observation = env.reset();
    if (observation && typeof observation === "object" && "metadata" in observation) {
      const metadata = (observation as { metadata?: unknown }).metadata;
      if (isRenderableState(metadata)) {
        return metadata;
      }
    }
  } catch {
    // ignore
  }

  return {
    bounds: BOUNDS,
    bunny: {
      position: { x: 0, y: 0 },
      heading: 0,
      energy: 1,
    },
    carrots: [],
    obstacles: [],
    trail: [],
    steps: 0,
    maxSteps: MAX_STEPS,
    collected: 0,
    target: TARGET_CARROTS,
  };
};

export const BunnyScene = memo(function BunnyScene({
  state,
}: {
  state: BunnyRenderableState;
}) {
  const clamp = (value: number) => {
    if (!Number.isFinite(value)) {
      return 0;
    }
    if (value > BOUNDS) {
      return BOUNDS;
    }
    if (value < -BOUNDS) {
      return -BOUNDS;
    }
    return value;
  };

  const sanitizeVector = (point: Vector2): Vector2 => ({
    x: clamp(point.x),
    y: clamp(point.y),
  });
  const sanitizeTrail = (trail: Vector2[]) =>
    trail
      .map((point) => sanitizeVector(point))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  const sanitizeCarrots = (carrots: BunnyCarrot[]) =>
    carrots
      .map((carrot) => ({
        ...carrot,
        position: sanitizeVector(carrot.position),
      }))
      .filter((carrot) => Number.isFinite(carrot.position.x) && Number.isFinite(carrot.position.y));
  const sanitizeObstacles = (obstacles: BunnyObstacle[]) =>
    obstacles
      .map((obstacle) => ({
        ...obstacle,
        position: sanitizeVector(obstacle.position),
        radius: Number.isFinite(obstacle.radius) && obstacle.radius > 0 ? obstacle.radius : 0,
        height: Number.isFinite(obstacle.height) && obstacle.height > 0 ? obstacle.height : 0,
      }))
      .filter(
        (obstacle) =>
          Number.isFinite(obstacle.position.x) &&
          Number.isFinite(obstacle.position.y) &&
          obstacle.radius > 0 &&
          obstacle.height > 0
      );

  const fallback = useMemo(buildFallbackState, []);
  const resolved = isRenderableState(state) ? state : fallback;
  const sanitized = {
    ...resolved,
    bunny: {
      position: sanitizeVector(resolved.bunny.position),
      heading: Number.isFinite(resolved.bunny.heading) ? resolved.bunny.heading : 0,
      energy: Number.isFinite(resolved.bunny.energy) ? resolved.bunny.energy : 0,
    },
    carrots: sanitizeCarrots(resolved.carrots),
    obstacles: sanitizeObstacles(resolved.obstacles),
    trail: sanitizeTrail(resolved.trail),
  };

  const bunnyRef = useRef<Group>(null);

  const trailPoints = useMemo(() => {
    if (!sanitized.trail.length) {
      return [] as Array<[number, number, number]>;
    }
    return sanitized.trail.map(
      (point): [number, number, number] => [point.x, 0.5, point.y]
    );
  }, [sanitized.trail]);

  useFrame(() => {
    if (bunnyRef.current) {
      bunnyRef.current.position.set(sanitized.bunny.position.x, 4, sanitized.bunny.position.y);
      bunnyRef.current.rotation.y = -sanitized.bunny.heading + Math.PI / 2;
      const pulse = 0.85 + sanitized.bunny.energy * 0.4;
      bunnyRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh receiveShadow position={[0, -0.35, 0]}>
          <planeGeometry args={[BOUNDS * 2.8, BOUNDS * 2.8]} />
          <meshStandardMaterial color="#01030d" />
        </mesh>
        <mesh receiveShadow>
          <planeGeometry args={[BOUNDS * 2.4, BOUNDS * 2.4]} />
          <meshStandardMaterial color="#040b1a" />
        </mesh>
        <mesh position={[0, 0.03, 0]} receiveShadow>
          <planeGeometry args={[BOUNDS * 2.32, BOUNDS * 2.32]} />
          <meshStandardMaterial color="#07162d" opacity={0.92} transparent />
        </mesh>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <planeGeometry args={[BOUNDS * 2.2, BOUNDS * 2.2, 24, 24]} />
          <meshStandardMaterial color="#0b1d38" opacity={0.45} transparent wireframe />
        </mesh>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <ringGeometry args={[BOUNDS * 0.88, BOUNDS * 1.02, 96]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={1.15}
            transparent
            opacity={0.75}
            side={DoubleSide}
            roughness={0.32}
            metalness={0.45}
          />
        </mesh>
      </group>

      <Sparkles
        count={120}
        speed={0.7}
        opacity={0.5}
        size={2.4}
        scale={[BOUNDS * 1.1, 58, BOUNDS * 1.1]}
        color="#38bdf8"
      />

      <group ref={bunnyRef}>
        <mesh castShadow>
          <sphereGeometry args={[6, 32, 32]} />
          <meshStandardMaterial
            color="#f472b6"
            emissive="#f472b6"
            emissiveIntensity={0.64}
            roughness={0.35}
            metalness={0.18}
          />
        </mesh>
        <mesh position={[0, 6, -3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[2.2, 6, 16]} />
          <meshStandardMaterial color="#fef08a" emissive="#fde68a" emissiveIntensity={0.75} />
        </mesh>
        <mesh position={[0, 4, 3]} castShadow>
          <sphereGeometry args={[2.5, 18, 18]} />
          <meshStandardMaterial color="#f9a8d4" emissive="#f472b6" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {sanitized.carrots.map((carrot) => (
        <group key={carrot.id} position={[carrot.position.x, 3, carrot.position.y]}>
          <mesh castShadow>
            <cylinderGeometry args={[3.8, 3.8, 14, 12]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={1.15}
              roughness={0.25}
              metalness={0.45}
            />
          </mesh>
          <mesh position={[0, 9, 0]}>
            <octahedronGeometry args={[3.2, 0]} />
            <meshStandardMaterial
              color="#e0f2fe"
              emissive="#bae6fd"
              emissiveIntensity={1.35}
              roughness={0.1}
            />
          </mesh>
        </group>
      ))}

      {sanitized.obstacles.map((obstacle) => (
        <mesh
          key={obstacle.id}
          position={[obstacle.position.x, obstacle.height / 2, obstacle.position.y]}
          castShadow
        >
          <cylinderGeometry args={[obstacle.radius * 0.35, obstacle.radius * 0.52, obstacle.height * 1.2, 32]} />
          <meshStandardMaterial
            color="#1d4ed8"
            emissive="#60a5fa"
            emissiveIntensity={0.82}
            transparent
            opacity={0.78}
            roughness={0.28}
            metalness={0.55}
          />
        </mesh>
      ))}

      {trailPoints.length > 1 ? (
        <Line points={trailPoints} color="#38bdf8" lineWidth={2.6} opacity={0.8} />
      ) : null}

      <ambientLight intensity={0.55} color="#60a5fa" />
      <directionalLight position={[60, 110, 90]} intensity={1.3} castShadow color="#38bdf8" />
      <directionalLight position={[-70, 140, -60]} intensity={0.9} color="#f472b6" />
      <pointLight position={[0, 62, 0]} intensity={1.05} distance={260} color="#38bdf8" decay={1.4} />
    </group>
  );
});

export const BunnyGardenDefinition: EnvDefinition<BunnyRenderableState> = {
  id: "lumen-bunny",
  name: "Lumen Valley",
  description: "Bunnies weave through luminous groves to harvest radiant carrots.",
  create: () => new BunnyGardenEnv(),
  Scene: BunnyScene,
};
