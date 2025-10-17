"use client";

import { memo, useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { Env, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

interface GridPoint {
  x: number;
  y: number;
}

export interface TinyGridMetadata {
  size: number;
  agent: GridPoint;
  goal: GridPoint;
  walls: GridPoint[];
  steps: number;
  maxSteps: number;
}

const ACTIONS: Record<number, GridPoint> = {
  0: { x: 0, y: -1 }, // up
  1: { x: 1, y: 0 }, // right
  2: { x: 0, y: 1 }, // down
  3: { x: -1, y: 0 }, // left
};

class TinyGridEnv implements Env {
  readonly id = "tiny-grid";
  readonly actionSpace = { type: "discrete", n: 4 } as const;
  readonly obsSpace = { shape: [6] } as const;
  private readonly size: number;
  private readonly maxSteps: number;
  private readonly slipProbability = 0.05;
  private steps = 0;
  private agent: GridPoint = { x: 0, y: 0 };
  private goal: GridPoint = { x: 0, y: 0 };
  private walls: GridPoint[] = [];

  constructor(size = 5, maxSteps = 40) {
    this.size = size;
    this.maxSteps = maxSteps;
  }

  reset(): EnvObservation {
    this.steps = 0;
    this.agent = { x: 0, y: 0 };
    this.goal = { x: this.size - 1, y: this.size - 1 };
    this.walls = this.generateWalls();
    return this.getObservation();
  }

  step(action: number): EnvStepResult {
    this.steps += 1;
    const effectiveAction =
      Math.random() < this.slipProbability
        ? Math.floor(Math.random() * this.actionSpace.n!)
        : action;
    const delta = ACTIONS[effectiveAction] ?? { x: 0, y: 0 };
    const candidate = {
      x: this.agent.x + delta.x,
      y: this.agent.y + delta.y,
    };
    if (this.isValid(candidate)) {
      this.agent = candidate;
    }

    const reachedGoal = this.agent.x === this.goal.x && this.agent.y === this.goal.y;
    const reward = reachedGoal ? 1 : -0.01;
    const done = reachedGoal || this.steps >= this.maxSteps;

    return {
      state: this.getObservation(),
      reward,
      done,
      info: {
        position: this.agent,
        goal: this.goal,
      },
    };
  }

  private isValid(point: GridPoint) {
    if (point.x < 0 || point.x >= this.size || point.y < 0 || point.y >= this.size) {
      return false;
    }
    return !this.walls.some((wall) => wall.x === point.x && wall.y === point.y);
  }

  private generateWalls(): GridPoint[] {
    const cells: GridPoint[] = [];
    for (let i = 0; i < this.size; i += 1) {
      for (let j = 0; j < this.size; j += 1) {
        if ((i === 0 && j === 0) || (i === this.size - 1 && j === this.size - 1)) {
          continue;
        }
        if (Math.random() < 0.1) {
          cells.push({ x: i, y: j });
        }
      }
    }
    return cells;
  }

  private getObservation(): EnvObservation {
    const buffer = new Float32Array([
      this.agent.x / (this.size - 1),
      this.agent.y / (this.size - 1),
      this.goal.x / (this.size - 1),
      this.goal.y / (this.size - 1),
      this.steps / this.maxSteps,
      this.walls.length / (this.size * this.size),
    ]);
    const metadata: TinyGridMetadata = {
      size: this.size,
      agent: { ...this.agent },
      goal: { ...this.goal },
      walls: this.walls.map((wall) => ({ ...wall })),
      steps: this.steps,
      maxSteps: this.maxSteps,
    };
    return { buffer, metadata } as unknown as EnvObservation;
  }
}

export const TinyGridScene = memo(function TinyGridScene({
  state,
}: {
  state: TinyGridMetadata;
}) {
  const agentRef = useRef<Mesh>(null);
  const goalRef = useRef<Mesh>(null);
  const offset = useMemo(() => (state.size - 1) / 2, [state.size]);

  useFrame(() => {
    if (agentRef.current) {
      agentRef.current.position.set(
        state.agent.x - offset,
        0.5,
        state.agent.y - offset
      );
    }
    if (goalRef.current) {
      goalRef.current.position.set(
        state.goal.x - offset,
        0.25,
        state.goal.y - offset
      );
    }
  });

  const gridLines = useMemo(() => {
    const lines: ReactNode[] = [];
    for (let i = 0; i < state.size; i += 1) {
      const position = i - offset - 0.5;
      lines.push(
        <mesh key={`h-${i}`} position={[0, 0, position]}>
          <planeGeometry args={[state.size, 0.01]} />
          <meshBasicMaterial color="#1e293b" side={2} />
        </mesh>
      );
      lines.push(
        <mesh key={`v-${i}`} position={[position, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[state.size, 0.01]} />
          <meshBasicMaterial color="#1e293b" side={2} />
        </mesh>
      );
    }
    return lines;
  }, [state.size, offset]);

  return (
    <>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <planeGeometry args={[state.size, state.size]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {gridLines}
      </group>
      <mesh ref={goalRef} position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <mesh ref={agentRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
      {state.walls.map((wall, index) => (
        <mesh
          key={`${wall.x}-${wall.y}-${index}`}
          position={[wall.x - offset, 0.5, wall.y - offset]}
        >
          <boxGeometry args={[0.9, 1, 0.9]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      ))}
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 5, 3]} intensity={0.8} />
    </>
  );
});

export const TinyGridDefinition: EnvDefinition<TinyGridMetadata> = {
  id: "tiny-grid",
  name: "Tiny Grid",
  description: "Move to the goal while avoiding procedural walls. Supports stochastic slips.",
  create: () => new TinyGridEnv(),
  Scene: TinyGridScene,
};


