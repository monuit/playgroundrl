"use client";

import {
  Billboard,
  Edges,
  Float,
  Grid,
  Line,
  MeshReflectorMaterial,
  Sparkles,
  Text,
  Trail,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import { Color, Group } from "three";
import type { Env, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 400;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 12;
const BALL_SIZE = 12;
const PLAYER_SPEED = 6;
const AI_SPEED = 4;

export interface PongRenderableState {
  ball: { x: number; y: number };
  player: { y: number };
  enemy: { y: number };
  score: { player: number; enemy: number };
}

interface PongSimState {
  ball: { x: number; y: number };
  velocity: { x: number; y: number };
  playerY: number;
  enemyY: number;
  score: { player: number; enemy: number };
}

class PongEnv implements Env {
  readonly id = "pong";
  readonly actionSpace = { type: "discrete", n: 3 } as const;
  readonly obsSpace = { shape: [6] } as const;
  private state: PongSimState = this.initialState();

  reset(): EnvObservation {
    this.state = this.initialState();
    return this.getObservation();
  }

  step(action: number | number[]): EnvStepResult {
    const move = Array.isArray(action) ? action[0] : action;
    this.updatePlayer(move ?? 1);
    this.updateEnemy();
    this.updateBall();

    let reward = 0;
    let done = false;

    if (this.state.ball.x < 0) {
      done = true;
      reward = -1;
      this.state.score.enemy += 1;
      this.state = { ...this.state, ...this.initialState(), score: this.state.score };
    }

    if (this.state.ball.x > ARENA_WIDTH) {
      done = true;
      reward = 1;
      this.state.score.player += 1;
      this.state = { ...this.state, ...this.initialState(), score: this.state.score };
    }

    return {
      state: this.getObservation(),
      reward,
      done,
      info: {
        score: this.state.score,
      },
    };
  }

  private updatePlayer(move: number) {
    const direction = Math.max(-1, Math.min(1, move));
    this.state.playerY += direction * PLAYER_SPEED;
    this.state.playerY = Math.max(
      PADDLE_HEIGHT / 2,
      Math.min(ARENA_HEIGHT - PADDLE_HEIGHT / 2, this.state.playerY)
    );
  }

  private updateEnemy() {
    const target = this.state.ball.y;
    if (target > this.state.enemyY + 4) {
      this.state.enemyY += AI_SPEED;
    } else if (target < this.state.enemyY - 4) {
      this.state.enemyY -= AI_SPEED;
    }
    this.state.enemyY = Math.max(
      PADDLE_HEIGHT / 2,
      Math.min(ARENA_HEIGHT - PADDLE_HEIGHT / 2, this.state.enemyY)
    );
  }

  private updateBall() {
    const { ball, velocity } = this.state;
    ball.x += velocity.x;
    ball.y += velocity.y;

    if (ball.y < BALL_SIZE / 2 || ball.y > ARENA_HEIGHT - BALL_SIZE / 2) {
      velocity.y *= -1;
      ball.y = Math.max(
        BALL_SIZE / 2,
        Math.min(ARENA_HEIGHT - BALL_SIZE / 2, ball.y)
      );
    }

    // collision with player paddle
    if (
      ball.x <= PADDLE_WIDTH + BALL_SIZE / 2 &&
      Math.abs(ball.y - this.state.playerY) <= PADDLE_HEIGHT / 2
    ) {
      ball.x = PADDLE_WIDTH + BALL_SIZE / 2;
      velocity.x *= -1.05;
      velocity.y += (ball.y - this.state.playerY) * 0.05;
    }

    // collision with enemy paddle
    if (
      ball.x >= ARENA_WIDTH - (PADDLE_WIDTH + BALL_SIZE / 2) &&
      Math.abs(ball.y - this.state.enemyY) <= PADDLE_HEIGHT / 2
    ) {
      ball.x = ARENA_WIDTH - (PADDLE_WIDTH + BALL_SIZE / 2);
      velocity.x *= -1.05;
      velocity.y += (ball.y - this.state.enemyY) * 0.05;
    }
  }

  private getObservation(): EnvObservation {
    const { ball, velocity, playerY, enemyY, score } = this.state;
    const buffer = new Float32Array([
      ball.x / ARENA_WIDTH,
      ball.y / ARENA_HEIGHT,
      velocity.x / 10,
      velocity.y / 10,
      playerY / ARENA_HEIGHT,
      enemyY / ARENA_HEIGHT,
    ]);
    const metadata: PongRenderableState = {
      ball: { ...ball },
      player: { y: playerY },
      enemy: { y: enemyY },
      score: { ...score },
    };

    return { buffer, metadata } as unknown as EnvObservation;
  }

  private initialState(): PongSimState {
    return {
      ball: {
        x: ARENA_WIDTH / 2,
        y: ARENA_HEIGHT / 2,
      },
      velocity: {
        x: (Math.random() > 0.5 ? 1 : -1) * 4,
        y: (Math.random() - 0.5) * 6,
      },
      playerY: ARENA_HEIGHT / 2,
      enemyY: ARENA_HEIGHT / 2,
      score: { player: 0, enemy: 0 },
    };
  }
}

interface PaddleProps {
  color: string;
}

const Paddle = memo(function Paddle({ color }: PaddleProps) {
  const emissive = useMemo(() => new Color(color).multiplyScalar(0.45), [color]);
  return (
    <Float speed={0.6} floatIntensity={0.2} rotationIntensity={0.1}>
      <mesh castShadow>
        <boxGeometry args={[PADDLE_WIDTH, PADDLE_HEIGHT, 24]} />
        <meshStandardMaterial
          color={color}
          metalness={0.35}
          roughness={0.25}
          emissive={emissive}
          emissiveIntensity={0.9}
        />
        <Edges scale={1.04} threshold={4} color="#f8fafc" />
      </mesh>
    </Float>
  );
});

const Ball = memo(function Ball() {
  return (
    <mesh castShadow>
      <icosahedronGeometry args={[BALL_SIZE * 0.55, 1]} />
      <meshStandardMaterial
        color="#fde047"
        emissive="#facc15"
        emissiveIntensity={0.9}
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
});

export const PongScene = memo(function PongScene({
  state,
}: {
  state: PongRenderableState;
}) {
  const playerRef = useRef<Group>(null);
  const enemyRef = useRef<Group>(null);
  const ballRef = useRef<Group>(null);

  const positions = useMemo(
    () => ({
      playerX: -ARENA_WIDTH / 2 + PADDLE_WIDTH,
      enemyX: ARENA_WIDTH / 2 - PADDLE_WIDTH,
    }),
    []
  );

  const safeState = useMemo(() => {
    const partial = state as Partial<PongRenderableState>;
    return {
      ball: {
        x: typeof partial.ball?.x === "number" ? partial.ball.x : ARENA_WIDTH / 2,
        y: typeof partial.ball?.y === "number" ? partial.ball.y : ARENA_HEIGHT / 2,
      },
      player: {
        y: typeof partial.player?.y === "number" ? partial.player.y : ARENA_HEIGHT / 2,
      },
      enemy: {
        y: typeof partial.enemy?.y === "number" ? partial.enemy.y : ARENA_HEIGHT / 2,
      },
      score: {
        player:
          typeof partial.score?.player === "number" ? partial.score.player : 0,
        enemy:
          typeof partial.score?.enemy === "number" ? partial.score.enemy : 0,
      },
    };
  }, [state]);

  useFrame(({ clock }) => {
    const wobble = Math.sin(clock.getElapsedTime() * 1.2) * 4;
    if (playerRef.current) {
      playerRef.current.position.set(
        positions.playerX,
        safeState.player.y - ARENA_HEIGHT / 2,
        wobble * 0.3
      );
    }
    if (enemyRef.current) {
      enemyRef.current.position.set(
        positions.enemyX,
        safeState.enemy.y - ARENA_HEIGHT / 2,
        -wobble * 0.3
      );
    }
    if (ballRef.current) {
      ballRef.current.position.set(
        safeState.ball.x - ARENA_WIDTH / 2,
        safeState.ball.y - ARENA_HEIGHT / 2,
        Math.sin(clock.getElapsedTime() * 2.4) * 6
      );
    }
  });

  return (
    <>
      <group position={[0, -ARENA_HEIGHT / 2 - 6, -12]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[ARENA_WIDTH * 1.4, ARENA_HEIGHT * 1.8]} />
          <MeshReflectorMaterial
            mirror={0.55}
            blur={[400, 80]}
            mixStrength={2.8}
            depthScale={0.9}
            minDepthThreshold={0.6}
            maxDepthThreshold={1.2}
            color="#0f172a"
            metalness={0.75}
            roughness={0.2}
          />
        </mesh>
        <Grid
          args={[ARENA_WIDTH * 1.5, ARENA_HEIGHT * 1.5]}
          position={[0, 0.05, 0]}
          cellColor="rgba(14,165,233,0.35)"
          sectionColor="rgba(244,63,94,0.4)"
          cellSize={25}
          sectionThickness={1.8}
          fadeStrength={1.2}
          fadeDistance={ARENA_WIDTH}
        />
        <Sparkles
          count={120}
          scale={[ARENA_WIDTH * 0.9, 80, ARENA_HEIGHT * 0.9]}
          size={6}
          speed={0.35}
          noise={0.6}
          opacity={0.4}
        />
      </group>

      <Billboard position={[0, ARENA_HEIGHT / 2 + 90, 40]} follow lockX={false} lockY={false} lockZ={false}>
        <group>
          <Text
            fontSize={38}
            color="#e0f2fe"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="rgba(14,165,233,0.6)"
          >
            {safeState.score.player} — {safeState.score.enemy}
          </Text>
          <Text
            fontSize={14}
            position={[0, -24, 0]}
            color="#bae6fd"
            anchorX="center"
            anchorY="middle"
          >
            PLAYER · ARENA · AI
          </Text>
        </group>
      </Billboard>

      <Line
        points={Array.from({ length: 21 }, (_, index) => [
          0,
          -ARENA_HEIGHT / 2 + (index * ARENA_HEIGHT) / 20,
          -2,
        ])}
        color="#7dd3fc"
        lineWidth={2}
        dashed
        dashSize={40}
        gapSize={28}
      />

      <group ref={playerRef}>
        <Paddle color="#22d3ee" />
      </group>
      <group ref={enemyRef}>
        <Paddle color="#f472b6" />
      </group>
      <Trail
        width={12}
        color="#fde68a"
        length={1.6}
        decay={0.5}
        local
      >
        <group ref={ballRef}>
          <Ball />
        </group>
      </Trail>

      <ambientLight intensity={0.35} color="#d1d5db" />
      <directionalLight position={[0, 220, 160]} intensity={1.2} color="#bfdbfe" castShadow />
      <spotLight
        position={[-220, 240, 80]}
        angle={0.45}
        penumbra={0.5}
        intensity={1.1}
        color="#0ea5e9"
        castShadow
      />
      <spotLight
        position={[220, 240, 80]}
        angle={0.45}
        penumbra={0.5}
        intensity={1}
        color="#f472b6"
        castShadow
      />
    </>
  );
});

export const PongDefinition: EnvDefinition<PongRenderableState> = {
  id: "pong",
  name: "Pong",
  description: "Classic Pong with discrete actions (up, stay, down).",
  create: () => new PongEnv(),
  Scene: PongScene,
};
