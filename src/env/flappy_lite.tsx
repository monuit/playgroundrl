"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { Env, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

interface FlappyState {
  y: number;
  yVel: number;
  pipeX: number;
  gapY: number;
}

export interface FlappyMetadata {
  state: FlappyState;
  gapHeight: number;
  bounds: { top: number; bottom: number };
  steps: number;
  maxSteps: number;
}

class FlappyLiteEnv implements Env {
  readonly id = "flappy-lite";
  readonly actionSpace = { type: "discrete", n: 2 } as const;
  readonly obsSpace = { shape: [4] } as const;
  private state: FlappyState = { y: 0, yVel: 0, pipeX: 0, gapY: 0 };
  private readonly gapHeight = 0.8;
  private readonly maxSteps = 2000;
  private steps = 0;

  reset(): EnvObservation {
    this.steps = 0;
    this.state = {
      y: 0,
      yVel: 0,
      pipeX: 2,
      gapY: Math.random() * 1.5 - 0.75,
    };
    return this.getObservation();
  }

  step(action: number): EnvStepResult {
    this.steps += 1;
    const gravity = -0.03;
    const flapVelocity = 0.5;
    const pipeSpeed = 0.03;

    const yVel = this.state.yVel + gravity + (action === 1 ? flapVelocity : 0);
    const y = this.state.y + yVel * 0.02;
    let pipeX = this.state.pipeX - pipeSpeed;
    let gapY = this.state.gapY;

    if (pipeX < -2) {
      pipeX = 2;
      gapY = Math.random() * 1.5 - 0.75;
    }

    this.state = {
      y,
      yVel,
      pipeX,
      gapY,
    };

    const inGap =
      Math.abs(y - gapY) < this.gapHeight / 2 && Math.abs(pipeX) < 0.05;
    const hitGround = y < -1 || y > 1;
    const reward = hitGround ? -1 : inGap ? 1 : 0.01;
    const done = hitGround || this.steps >= this.maxSteps;

    return {
      state: this.getObservation(),
      reward,
      done,
      info: {
        steps: this.steps,
        passed: inGap,
      },
    };
  }

  private getObservation(): EnvObservation {
    const buffer = new Float32Array([
      this.state.y,
      this.state.yVel,
      this.state.pipeX,
      this.state.gapY,
    ]);
    const metadata: FlappyMetadata = {
      state: { ...this.state },
      gapHeight: this.gapHeight,
      bounds: { top: 1, bottom: -1 },
      steps: this.steps,
      maxSteps: this.maxSteps,
    };
    return { buffer, metadata } as unknown as EnvObservation;
  }
}

export const FlappyLiteScene = memo(function FlappyLiteScene({
  state,
}: {
  state: FlappyMetadata;
}) {
  const birdRef = useRef<Mesh>(null);
  const pipeTopRef = useRef<Mesh>(null);
  const pipeBottomRef = useRef<Mesh>(null);

  useFrame(() => {
    if (birdRef.current) {
      birdRef.current.position.set(-0.5, state.state.y, 0);
    }
    if (pipeTopRef.current && pipeBottomRef.current) {
      pipeTopRef.current.position.set(state.state.pipeX, state.state.gapY + state.gapHeight / 2 + 1, 0);
      pipeBottomRef.current.position.set(state.state.pipeX, state.state.gapY - state.gapHeight / 2 - 1, 0);
    }
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
      <mesh ref={birdRef} position={[-0.5, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#fb7185" />
      </mesh>
      <mesh ref={pipeTopRef} position={[1.5, 0, 0]}>
        <boxGeometry args={[0.4, 2, 0.4]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <mesh ref={pipeBottomRef} position={[1.5, -2, 0]}>
        <boxGeometry args={[0.4, 2, 0.4]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={0.8} />
    </>
  );
});

export const FlappyLiteDefinition: EnvDefinition<FlappyMetadata> = {
  id: "flappy-lite",
  name: "Flappy Lite",
  description: "Procedural obstacle dodger with simple bird physics.",
  create: () => new FlappyLiteEnv(),
  Scene: FlappyLiteScene,
};
