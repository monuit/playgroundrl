"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, Object3D, Vector2 } from "three";
import type { Env, EnvFactory, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

const FISH_COUNT = 12;
const ALGAE_PATCH_COUNT = 20;
const PREDATOR_COUNT = 2;
const ARENA_RADIUS = 140;
const MAX_STEPS = 600;
const TURN_ANGLE = (18 / 180) * Math.PI;
const BASE_SPEED = 8;
const BOOST_SPEED = 14;
const ENERGY_DECAY = 0.004;
const BOOST_COST = 0.04;
const SECTOR_COUNT = 6;

interface FishState {
  id: number;
  position: Vector2;
  velocity: Vector2;
  heading: number;
  energy: number;
  schooling: boolean;
}

interface PredatorState {
  id: number;
  position: Vector2;
  heading: number;
}

interface AlgaePatchState {
  id: number;
  position: Vector2;
  density: number;
}

interface ReefSimState {
  fishes: FishState[];
  predators: PredatorState[];
  algae: AlgaePatchState[];
  steps: number;
  predationEvents: number;
  algaeCleared: number;
}

export interface ReefGuardiansRenderableState {
  fishes: Array<{
    id: number;
    position: { x: number; y: number };
    heading: number;
    schooling: boolean;
    energy: number;
  }>;
  predators: Array<{
    id: number;
    position: { x: number; y: number };
  }>;
  algae: Array<{
    id: number;
    position: { x: number; y: number };
    density: number;
  }>;
  centroid: { x: number; y: number };
  cohesion: number;
  steps: number;
  maxSteps: number;
  energy: number;
  algaeCleared: number;
  predationEvents: number;
}

const randomVectorInCircle = (radius: number) => {
  const theta = Math.random() * Math.PI * 2;
  const r = Math.random() * radius;
  return new Vector2(Math.cos(theta) * r, Math.sin(theta) * r);
};

class ReefGuardiansEnv implements Env {
  readonly id = "reef-guardians";
  readonly actionSpace = { type: "discrete", n: 5 } as const;
  readonly obsSpace = { shape: [24] } as const;

  private rng: () => number;
  private state: ReefSimState;

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
    const leader = this.state.fishes[0];
    let reward = -0.02;

    switch (active) {
      case 0:
        leader.heading -= TURN_ANGLE;
        break;
      case 1:
        leader.heading += TURN_ANGLE;
        break;
      case 2:
        leader.velocity = new Vector2(Math.cos(leader.heading), Math.sin(leader.heading)).multiplyScalar(BASE_SPEED);
        break;
      case 3:
        leader.velocity = new Vector2(Math.cos(leader.heading), Math.sin(leader.heading)).multiplyScalar(BOOST_SPEED);
        leader.energy = Math.max(0, leader.energy - BOOST_COST);
        reward -= 0.05;
        break;
      case 4:
        leader.schooling = !leader.schooling;
        reward += leader.schooling ? 0.05 : -0.05;
        break;
      default:
        break;
    }

  this.advanceFish();
    const clearedReward = this.consumeAlgae();
    reward += clearedReward;

    const predationPenalty = this.updatePredators();
    reward += predationPenalty;

    const cohesionReward = this.computeCohesionReward();
    reward += cohesionReward;

    this.state.steps += 1;
    leader.energy = Math.max(0, leader.energy - ENERGY_DECAY);

    const done = leader.energy <= 0 || this.state.steps >= MAX_STEPS;

    const observation = this.buildObservation();

    return {
      state: observation,
      reward,
      done,
      info: {
        cohesion: cohesionReward,
        algaeCleared: this.state.algaeCleared,
        predationEvents: this.state.predationEvents,
        energy: leader.energy,
      },
    };
  }

  private createInitialState(): ReefSimState {
    const fishes: FishState[] = Array.from({ length: FISH_COUNT }, (_, id) => ({
      id,
      position: randomVectorInCircle(ARENA_RADIUS * 0.3),
      velocity: new Vector2(),
      heading: (this.rng() - 0.5) * Math.PI * 2,
      energy: 1,
      schooling: true,
    }));

    const predators: PredatorState[] = Array.from({ length: PREDATOR_COUNT }, (_, id) => ({
      id,
      position: randomVectorInCircle(ARENA_RADIUS * 0.8),
      heading: this.rng() * Math.PI * 2,
    }));

    const algae: AlgaePatchState[] = Array.from({ length: ALGAE_PATCH_COUNT }, (_, id) => ({
      id,
      position: randomVectorInCircle(ARENA_RADIUS * 0.85),
      density: 0.4 + this.rng() * 0.6,
    }));

    return {
      fishes,
      predators,
      algae,
      steps: 0,
      predationEvents: 0,
      algaeCleared: 0,
    };
  }

  private advanceFish() {
    const leader = this.state.fishes[0];
    const targetVelocity = leader.velocity.length() > 0 ? leader.velocity.clone() : new Vector2(Math.cos(leader.heading), Math.sin(leader.heading)).multiplyScalar(BASE_SPEED * 0.8);
    leader.position.add(targetVelocity);
    leader.position.setLength(Math.min(leader.position.length(), ARENA_RADIUS * 0.92));
    leader.velocity.lerp(targetVelocity, 0.2);

    const centroid = this.computeCentroid();

    for (let i = 1; i < this.state.fishes.length; i += 1) {
      const fish = this.state.fishes[i];
      const cohesionVector = centroid.clone().sub(fish.position).multiplyScalar(0.02 + (fish.schooling ? 0.04 : 0));
      const alignment = leader.velocity.clone().multiplyScalar(0.6);
      const separation = fish.position.clone().sub(leader.position).multiplyScalar(0.0015);
      fish.velocity.add(cohesionVector).add(alignment).sub(separation);
      fish.velocity.clampLength(2, BOOST_SPEED * 0.6);
      fish.position.add(fish.velocity);
      if (fish.position.length() > ARENA_RADIUS) {
        fish.position.setLength(ARENA_RADIUS - 8);
        fish.velocity.multiplyScalar(-0.4);
      }
    }
  }

  private consumeAlgae() {
    let reward = 0;
    for (const fish of this.state.fishes) {
      for (const patch of this.state.algae) {
        const distance = fish.position.distanceTo(patch.position);
        if (distance < 18 && patch.density > 0) {
          const amount = Math.min(patch.density, 0.04 + (fish.schooling ? 0.02 : 0.01));
          patch.density = Math.max(0, patch.density - amount);
          reward += amount * 2.5;
          this.state.algaeCleared += amount;
        }
      }
    }
    return reward;
  }

  private updatePredators() {
    let penalty = 0;
    for (const predator of this.state.predators) {
      predator.heading += (this.rng() - 0.5) * 0.1;
      const direction = new Vector2(Math.cos(predator.heading), Math.sin(predator.heading));
      predator.position.add(direction.multiplyScalar(6 + this.rng() * 2));
      if (predator.position.length() > ARENA_RADIUS * 0.95) {
        predator.position.setLength(ARENA_RADIUS * 0.95);
        predator.heading += Math.PI;
      }

      let closest: FishState | null = null;
      let distance = Infinity;
      for (const fish of this.state.fishes) {
        const dist = fish.position.distanceTo(predator.position);
        if (dist < distance) {
          distance = dist;
          closest = fish;
        }
      }
      if (closest && distance < 14) {
        penalty -= 1;
        this.state.predationEvents += 1;
        closest.position.add(randomVectorInCircle(24));
        closest.energy = Math.max(0.2, closest.energy - 0.1);
      }
    }
    return penalty;
  }

  private computeCentroid() {
    const sum = this.state.fishes.reduce(
      (acc, fish) => {
        acc.x += fish.position.x;
        acc.y += fish.position.y;
        return acc;
      },
      { x: 0, y: 0 }
    );
    return new Vector2(sum.x / this.state.fishes.length, sum.y / this.state.fishes.length);
  }

  private computeCohesionReward() {
    const centroid = this.computeCentroid();
    let cohesion = 0;
    for (const fish of this.state.fishes) {
      const distance = fish.position.distanceTo(centroid);
      cohesion += 1 - Math.min(1, distance / ARENA_RADIUS);
    }
    cohesion /= this.state.fishes.length;
    return cohesion * 0.15;
  }

  private sectorReadings(leader: FishState) {
    const readings = new Array(SECTOR_COUNT).fill(0);
    for (const patch of this.state.algae) {
      if (patch.density <= 0) {
        continue;
      }
      const vector = patch.position.clone().sub(leader.position);
      const distance = vector.length();
      if (distance > 80) {
        continue;
      }
      const angle = (Math.atan2(vector.y, vector.x) - leader.heading + Math.PI * 2) % (Math.PI * 2);
      const index = Math.floor((angle / (Math.PI * 2)) * SECTOR_COUNT) % SECTOR_COUNT;
      readings[index] += (patch.density / (1 + distance / 40));
    }
    return readings.map((value) => Math.min(1, value));
  }

  private buildObservation(): EnvObservation {
    const leader = this.state.fishes[0];
    const buffer = new Float32Array(24);
    let index = 0;

    const sectors = this.sectorReadings(leader);
    sectors.forEach((value) => {
      buffer[index++] = value;
    });

    const centroid = this.computeCentroid();
    const centroidVec = centroid.clone().sub(leader.position).divideScalar(ARENA_RADIUS);
    buffer[index++] = centroidVec.x;
    buffer[index++] = centroidVec.y;

    let nearestPredatorVec = new Vector2();
    let nearestDistance = Infinity;
    for (const predator of this.state.predators) {
      const diff = predator.position.clone().sub(leader.position);
      const dist = diff.length();
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestPredatorVec = diff.divideScalar(ARENA_RADIUS);
      }
    }
    buffer[index++] = nearestPredatorVec.x;
    buffer[index++] = nearestPredatorVec.y;
    buffer[index++] = Math.min(1, nearestDistance / ARENA_RADIUS);

    buffer[index++] = leader.energy;
    buffer[index++] = leader.velocity.length() / BOOST_SPEED;
    buffer[index++] = leader.schooling ? 1 : 0;
    buffer[index++] = this.state.algaeCleared;
    buffer[index++] = this.state.predationEvents;
    buffer[index++] = this.state.steps / MAX_STEPS;

    const cohesion = this.computeCohesionReward() / 0.15;
    buffer[index++] = cohesion;

    const algaeRemaining = this.state.algae.reduce((acc, patch) => acc + patch.density, 0) / ALGAE_PATCH_COUNT;
    buffer[index++] = Math.min(1, algaeRemaining);

    while (index < buffer.length) {
      buffer[index++] = 0;
    }

    const metadata: ReefGuardiansRenderableState = {
      fishes: this.state.fishes.map((fish) => ({
        id: fish.id,
        position: { x: fish.position.x, y: fish.position.y },
        heading: fish.heading,
        schooling: fish.schooling,
        energy: fish.energy,
      })),
      predators: this.state.predators.map((pred) => ({
        id: pred.id,
        position: { x: pred.position.x, y: pred.position.y },
      })),
      algae: this.state.algae.map((patch) => ({
        id: patch.id,
        position: { x: patch.position.x, y: patch.position.y },
        density: patch.density,
      })),
      centroid: { x: centroid.x, y: centroid.y },
      cohesion,
      steps: this.state.steps,
      maxSteps: MAX_STEPS,
      energy: leader.energy,
      algaeCleared: this.state.algaeCleared,
      predationEvents: this.state.predationEvents,
    };

    return { buffer, metadata } as unknown as EnvObservation;
  }
}

export const createReefGuardiansEnv: EnvFactory = {
  id: "reef-guardians",
  name: "Reef Guardians",
  description: "Schools of reef fish shepherd algae grazers while evading predators in a caustic underwater cavern.",
  create: () => new ReefGuardiansEnv(),
};

const isReefRenderableState = (value: unknown): value is ReefGuardiansRenderableState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<ReefGuardiansRenderableState>;
  return Array.isArray(record.fishes) && Array.isArray(record.algae);
};

const buildFallbackState = (): ReefGuardiansRenderableState => {
  try {
    const env = createReefGuardiansEnv.create();
    const observation = env.reset();
    if (observation && typeof observation === "object" && "metadata" in observation) {
      const metadata = (observation as { metadata?: unknown }).metadata;
      if (isReefRenderableState(metadata)) {
        return metadata;
      }
    }
  } catch {
    // ignore
  }

  return {
    fishes: [],
    predators: [],
    algae: [],
    centroid: { x: 0, y: 0 },
    cohesion: 0,
    steps: 0,
    maxSteps: MAX_STEPS,
    energy: 1,
    algaeCleared: 0,
    predationEvents: 0,
  };
};

const FISH_COLOR = new Color("#22d3ee");
const LEADER_COLOR = new Color("#38bdf8");
const ALGAE_COLOR = new Color("#dbf4ff");
const PREDATOR_COLOR = new Color("#f97316");

export const ReefGuardiansScene = memo(function ReefGuardiansScene({
  state,
}: {
  state: ReefGuardiansRenderableState;
}) {
  const fallback = useMemo(buildFallbackState, []);
  const resolvedState = useMemo(() => {
    if (isReefRenderableState(state)) {
      return state;
    }
    return fallback;
  }, [state, fallback]);

  const fishRef = useRef<InstancedMesh>(null);
  const predatorRef = useRef<InstancedMesh>(null);
  const algaeRef = useRef<InstancedMesh>(null);
  const tempObject = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!fishRef.current) {
      return;
    }
    resolvedState.fishes.forEach((fish, index) => {
      tempObject.position.set(fish.position.x, Math.sin(index) * 2, fish.position.y);
      tempObject.rotation.set(Math.PI / 2, 0, -fish.heading);
      tempObject.scale.set(fish.id === 0 ? 1.4 : 1.1, fish.id === 0 ? 1.4 : 1.1, fish.schooling ? 1.2 : 0.8);
      tempObject.updateMatrix();
      fishRef.current!.setMatrixAt(index, tempObject.matrix);
      fishRef.current!.setColorAt(index, fish.id === 0 ? LEADER_COLOR : FISH_COLOR);
    });
    fishRef.current.count = resolvedState.fishes.length;
    fishRef.current.instanceMatrix.needsUpdate = true;
    fishRef.current.instanceColor!.needsUpdate = true;
  }, [resolvedState.fishes, tempObject]);

  useEffect(() => {
    if (!predatorRef.current) {
      return;
    }
    resolvedState.predators.forEach((predator, index) => {
      tempObject.position.set(predator.position.x, 4, predator.position.y);
      tempObject.rotation.set(Math.PI / 2, 0, 0);
      tempObject.scale.set(1.8, 1.8, 1.8);
      tempObject.updateMatrix();
      predatorRef.current!.setMatrixAt(index, tempObject.matrix);
      predatorRef.current!.setColorAt(index, PREDATOR_COLOR);
    });
    predatorRef.current.count = resolvedState.predators.length;
    predatorRef.current.instanceMatrix.needsUpdate = true;
    predatorRef.current.instanceColor!.needsUpdate = true;
  }, [resolvedState.predators, tempObject]);

  useEffect(() => {
    if (!algaeRef.current) {
      return;
    }
    resolvedState.algae.forEach((patch, index) => {
      tempObject.position.set(patch.position.x, -3, patch.position.y);
      const scale = 0.6 + patch.density;
      tempObject.scale.set(scale, 0.4, scale);
      tempObject.updateMatrix();
      algaeRef.current!.setMatrixAt(index, tempObject.matrix);
      const color = ALGAE_COLOR.clone().lerp(new Color("#10b981"), Math.min(1, patch.density));
      algaeRef.current!.setColorAt(index, color);
    });
    algaeRef.current.count = resolvedState.algae.length;
    algaeRef.current.instanceMatrix.needsUpdate = true;
    algaeRef.current.instanceColor!.needsUpdate = true;
  }, [resolvedState.algae, tempObject]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (fishRef.current) {
      for (let i = 0; i < fishRef.current.count; i += 1) {
        fishRef.current.getMatrixAt(i, tempObject.matrix);
        tempObject.position.y = Math.sin(elapsed * 1.5 + i) * 2;
        tempObject.updateMatrix();
        fishRef.current.setMatrixAt(i, tempObject.matrix);
      }
      fishRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <fog attach="fog" args={["#0f172a", 120, 420]} />
      <ambientLight intensity={0.3} color={0x0ea5e9} />
      <directionalLight position={[60, 180, -80]} intensity={1.4} color={0x38bdf8} />
      <pointLight position={[-120, 40, 60]} intensity={0.8} color={0x0ea5e9} />

      <mesh position={[0, -12, 0]} receiveShadow>
        <cylinderGeometry args={[ARENA_RADIUS, ARENA_RADIUS * 0.96, 8, 48]} />
        <meshStandardMaterial color="#082f49" roughness={0.95} metalness={0.05} />
      </mesh>

      <instancedMesh ref={algaeRef} args={[undefined, undefined, resolvedState.algae.length]}>
        <sphereGeometry args={[4, 12, 12]} />
        <meshStandardMaterial emissive="#14b8a6" emissiveIntensity={0.3} vertexColors />
      </instancedMesh>

      <instancedMesh ref={fishRef} args={[undefined, undefined, resolvedState.fishes.length]}>
        <coneGeometry args={[5, 12, 8]} />
        <meshStandardMaterial emissive="#38bdf8" emissiveIntensity={0.5} metalness={0.4} roughness={0.4} vertexColors />
      </instancedMesh>

      <instancedMesh ref={predatorRef} args={[undefined, undefined, resolvedState.predators.length]}>
        <torusGeometry args={[8, 2, 16, 32]} />
        <meshStandardMaterial emissive="#fb923c" emissiveIntensity={0.7} metalness={0.7} roughness={0.3} vertexColors />
      </instancedMesh>

      <mesh position={[resolvedState.centroid.x, -2, resolvedState.centroid.y]}>
        <sphereGeometry args={[4, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.8} opacity={0.5} transparent />
      </mesh>
    </group>
  );
});

export const ReefGuardiansDefinition: EnvDefinition<ReefGuardiansRenderableState> = {
  ...createReefGuardiansEnv,
  Scene: ReefGuardiansScene,
};
