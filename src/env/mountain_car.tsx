"use client";

import { memo, useMemo, useRef } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { Env, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

const MIN_POSITION = -1.2;
const MAX_POSITION = 0.6;
const GOAL_POSITION = 0.45;
const MAX_STEPS = 200;
const FORCE = 0.0015;
const GRAVITY = 0.0025;
const MAX_SPEED = 0.07;
const TRACK_SCALE = 6;

export interface MountainCarMetadata {
  position: number;
  velocity: number;
  goal: number;
  steps: number;
  maxSteps: number;
}

class MountainCarEnv implements Env {
  readonly id = "mountain-car";
  readonly actionSpace = { type: "discrete", n: 3 } as const;
  readonly obsSpace = { shape: [4] } as const;
  private position = -0.5;
  private velocity = 0;
  private steps = 0;

  reset(): EnvObservation {
    this.position = -0.5 + Math.random() * 0.1;
    this.velocity = 0;
    this.steps = 0;
    return this.getObservation();
  }

  step(action: number): EnvStepResult {
    this.steps += 1;
    const force = (Math.max(0, Math.min(2, action)) - 1) * FORCE;
    this.velocity += force - GRAVITY * Math.cos(3 * this.position);
    this.velocity = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.velocity));
    this.position += this.velocity;

    if (this.position < MIN_POSITION) {
      this.position = MIN_POSITION;
      this.velocity = 0;
    }
    if (this.position > MAX_POSITION) {
      this.position = MAX_POSITION;
    }

    const done = this.position >= GOAL_POSITION || this.steps >= MAX_STEPS;
    const reward = done && this.position >= GOAL_POSITION ? 0 : -1;

    return {
      state: this.getObservation(),
      reward,
      done,
      info: {
        position: this.position,
        velocity: this.velocity,
      },
    };
  }

  private getObservation(): EnvObservation {
    const buffer = new Float32Array([
      this.position,
      this.velocity,
      Math.sin(3 * this.position),
      this.steps / MAX_STEPS,
    ]);
    const metadata: MountainCarMetadata = {
      position: this.position,
      velocity: this.velocity,
      goal: GOAL_POSITION,
      steps: this.steps,
      maxSteps: MAX_STEPS,
    };
    return { buffer, metadata } as unknown as EnvObservation;
  }
}

const projectPosition = (position: number) => {
  const range = MAX_POSITION - MIN_POSITION;
  const x = ((position - MIN_POSITION) / range) * TRACK_SCALE - TRACK_SCALE / 2;
  const y = Math.sin(3 * position) * 1.2;
  return { x, y };
};

export const MountainCarScene = memo(function MountainCarScene({
  state,
}: {
  state: MountainCarMetadata;
}) {
  const cartRef = useRef<Mesh>(null);
  const goalRef = useRef<Mesh>(null);

  const trackPoints = useMemo(() => {
    const points: Array<[number, number, number]> = [];
    const step = 0.02;
    for (let x = MIN_POSITION; x <= MAX_POSITION; x += step) {
      const { x: px, y: py } = projectPosition(x);
      points.push([px, py, 0]);
    }
    return points;
  }, []);

  useFrame(() => {
    if (cartRef.current) {
      const { x, y } = projectPosition(state.position);
      cartRef.current.position.set(x, 0.4 + y, 0);
      cartRef.current.rotation.z = Math.atan(3 * Math.cos(3 * state.position)) * 0.2;
    }
    if (goalRef.current) {
      const { x, y } = projectPosition(state.goal);
      goalRef.current.position.set(x, 0.6 + y, 0);
    }
  });

  return (
    <group>
      <Line
        points={trackPoints}
        color="#475569"
        lineWidth={3}
        dashed={false}
        transparent
      />
      <mesh ref={cartRef} castShadow>
        <boxGeometry args={[0.4, 0.25, 0.4]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.1} roughness={0.4} />
      </mesh>
      <mesh ref={goalRef}>
        <coneGeometry args={[0.2, 0.5, 16]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[TRACK_SCALE + 1, TRACK_SCALE / 2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={1} castShadow />
    </group>
  );
});

export const MountainCarDefinition: EnvDefinition<MountainCarMetadata> = {
  id: "mountain-car",
  name: "Mountain Car",
  description:
    "Classic physics control problem. Push the car back and forth to build enough momentum to reach the goal hill.",
  create: () => new MountainCarEnv(),
  Scene: MountainCarScene,
};
