"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { Env, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

interface CartPoleState {
  x: number;
  xDot: number;
  theta: number;
  thetaDot: number;
}

interface CartPoleMetadata {
  state: CartPoleState;
  forceMagnitude: number;
  episodeSteps: number;
  maxSteps: number;
}

const GRAVITY = 9.8;
const MASSCART = 1.0;
const MASSPOLE = 0.1;
const TOTAL_MASS = MASSPOLE + MASSCART;
const LENGTH = 0.5; // actually half the pole's length
const POLEMASS_LENGTH = MASSPOLE * LENGTH;
const FORCE_MAG = 10.0;
const TAU = 0.02; // seconds between state updates
const X_THRESHOLD = 2.4;
const THETA_THRESHOLD_RADIANS = (12 * Math.PI) / 180;

class CartPoleEnv implements Env {
  readonly id = "cartpole-lite";
  readonly actionSpace = { type: "discrete", n: 2 } as const;
  readonly obsSpace = { shape: [4] } as const;
  private state: CartPoleState = { x: 0, xDot: 0, theta: 0, thetaDot: 0 };
  private steps = 0;
  private readonly maxSteps: number;

  constructor(maxSteps = 500) {
    this.maxSteps = maxSteps;
  }

  reset(): EnvObservation {
    this.steps = 0;
    this.state = {
      x: Math.random() * 0.1 - 0.05,
      xDot: Math.random() * 0.1 - 0.05,
      theta: Math.random() * 0.1 - 0.05,
      thetaDot: Math.random() * 0.1 - 0.05,
    };
    return this.getObservation();
  }

  step(action: number): EnvStepResult {
    const force = action === 1 ? FORCE_MAG : -FORCE_MAG;
    const { x, xDot, theta, thetaDot } = this.state;

    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const temp =
      (force + POLEMASS_LENGTH * thetaDot * thetaDot * sinTheta) / TOTAL_MASS;
    const thetaAcc =
      (GRAVITY * sinTheta - cosTheta * temp) /
      (LENGTH * (4.0 / 3.0 - (MASSPOLE * cosTheta * cosTheta) / TOTAL_MASS));
    const xAcc = temp - (POLEMASS_LENGTH * thetaAcc * cosTheta) / TOTAL_MASS;

    this.state = {
      x: x + TAU * xDot,
      xDot: xDot + TAU * xAcc,
      theta: theta + TAU * thetaDot,
      thetaDot: thetaDot + TAU * thetaAcc,
    };

    this.steps += 1;

    const done =
      this.state.x < -X_THRESHOLD ||
      this.state.x > X_THRESHOLD ||
      this.state.theta < -THETA_THRESHOLD_RADIANS ||
      this.state.theta > THETA_THRESHOLD_RADIANS ||
      this.steps >= this.maxSteps;

    const reward = done ? (this.steps >= this.maxSteps ? 1 : 0) : 1;

    return {
      state: this.getObservation(),
      reward,
      done,
      info: {
        steps: this.steps,
      },
    };
  }

  private getObservation(): EnvObservation {
    const { x, xDot, theta, thetaDot } = this.state;
    const buffer = new Float32Array([x, xDot, theta, thetaDot]);
    const metadata: CartPoleMetadata = {
      state: { ...this.state },
      forceMagnitude: FORCE_MAG,
      episodeSteps: this.steps,
      maxSteps: this.maxSteps,
    };
    return { buffer, metadata } as unknown as EnvObservation;
  }
}

export const CartPoleScene = memo(function CartPoleScene({
  state,
}: {
  state: CartPoleMetadata;
}) {
  const cartRef = useRef<Mesh>(null);
  const poleRef = useRef<Mesh>(null);

  useFrame(() => {
    if (cartRef.current) {
      cartRef.current.position.x = state.state.x;
    }
    if (poleRef.current) {
      poleRef.current.position.x = state.state.x;
      poleRef.current.rotation.z = -state.state.theta;
    }
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh ref={cartRef} position={[0, -0.2, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.4]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
      <mesh ref={poleRef} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.0, 12]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={0.8} />
    </>
  );
});

export const CartPoleDefinition: EnvDefinition<CartPoleMetadata> = {
  id: "cartpole-lite",
  name: "CartPole Lite",
  description: "Classic cart-pole control with discrete actions.",
  create: () => new CartPoleEnv(),
  Scene: CartPoleScene,
};
