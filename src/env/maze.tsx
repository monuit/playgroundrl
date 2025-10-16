"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useMemo, useRef } from "react";
import type { Mesh } from "three";
import type { Env, EnvObservation, EnvStepResult } from "./types";
import type { EnvDefinition } from "./index";

const CELL_SIZE = 32;
const GRID_SIZE = 10;

interface MazeCell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
}

interface MazeState {
  grid: MazeCell[][];
  player: { x: number; y: number };
  goal: { x: number; y: number };
  steps: number;
}

export interface MazeRenderableState {
  grid: MazeCell[][];
  player: { x: number; y: number };
  goal: { x: number; y: number };
  steps: number;
}

class MazeEnv implements Env {
  readonly id = "maze";
  readonly actionSpace = {
    type: "discrete",
    n: 4,
  } as const;
  readonly obsSpace = {
    shape: [GRID_SIZE * GRID_SIZE * 3],
  } as const;

  private state: MazeState = this.createInitialState();

  reset(): EnvObservation {
    this.state = this.createInitialState();
    return this.getObservation();
  }

  step(action: number | number[]): EnvStepResult {
    const direction = Array.isArray(action) ? action[0] : action ?? 0;
    const { player } = this.state;
    const cell = this.state.grid[player.y][player.x];

    const next = { x: player.x, y: player.y };
    switch (direction) {
      case 0: // up
        if (!cell.walls.top) next.y -= 1;
        break;
      case 1: // right
        if (!cell.walls.right) next.x += 1;
        break;
      case 2: // down
        if (!cell.walls.bottom) next.y += 1;
        break;
      case 3: // left
        if (!cell.walls.left) next.x -= 1;
        break;
      default:
        break;
    }

    const moved = next.x !== player.x || next.y !== player.y;
    if (moved) {
      this.state.player = next;
      this.state.steps += 1;
    }

    const reachedGoal =
      this.state.player.x === this.state.goal.x &&
      this.state.player.y === this.state.goal.y;

    const reward = reachedGoal ? 1 : moved ? -0.01 : -0.05;

    return {
      state: this.getObservation(),
      reward,
      done: reachedGoal,
      info: {
        steps: this.state.steps,
      },
    };
  }

  private createInitialState(): MazeState {
    const grid = this.generateMaze(GRID_SIZE, GRID_SIZE);
    return {
      grid,
      player: { x: 0, y: 0 },
      goal: { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
      steps: 0,
    };
  }

  private generateMaze(width: number, height: number) {
    const grid: MazeCell[][] = new Array(height)
      .fill(0)
      .map((_, y) =>
        new Array(width).fill(0).map((__, x) => ({
          x,
          y,
          walls: {
            top: true,
            right: true,
            bottom: true,
            left: true,
          },
        }))
      );

    const visited = new Set<string>();
    const stack: MazeCell[] = [];

    const start = grid[0][0];
    stack.push(start);
    visited.add("0-0");

    const neighbors = (cell: MazeCell) => {
      const list: { cell: MazeCell; dir: "top" | "right" | "bottom" | "left" }[] = [];
      if (cell.y > 0) list.push({ cell: grid[cell.y - 1][cell.x], dir: "top" });
      if (cell.x < width - 1) list.push({ cell: grid[cell.y][cell.x + 1], dir: "right" });
      if (cell.y < height - 1) list.push({ cell: grid[cell.y + 1][cell.x], dir: "bottom" });
      if (cell.x > 0) list.push({ cell: grid[cell.y][cell.x - 1], dir: "left" });
      return list.filter(({ cell }) => !visited.has(`${cell.x}-${cell.y}`));
    };

    while (stack.length) {
      const current = stack[stack.length - 1];
      const available = neighbors(current);

      if (available.length === 0) {
        stack.pop();
        continue;
      }

      const { cell: next, dir } = available[Math.floor(Math.random() * available.length)];
      current.walls[dir] = false;
      const opposite =
        dir === "top" ? "bottom" : dir === "right" ? "left" : dir === "bottom" ? "top" : "right";
      next.walls[opposite] = false;

      stack.push(next);
      visited.add(`${next.x}-${next.y}`);
    }

    return grid;
  }

  private getObservation(): EnvObservation {
    const { grid, player, goal, steps } = this.state;
    const buffer = new Float32Array(grid.length * grid[0].length * 3);
    let idx = 0;
    for (let y = 0; y < grid.length; y += 1) {
      for (let x = 0; x < grid[y].length; x += 1) {
        const cell = grid[y][x];
        buffer[idx++] = cell.walls.top ? 1 : 0;
        buffer[idx++] = cell.walls.right ? 1 : 0;
        buffer[idx++] = cell.walls.bottom ? 1 : 0;
      }
    }

    const metadata: MazeRenderableState = {
      grid,
      player,
      goal,
      steps,
    };

    return { buffer, metadata } as unknown as EnvObservation;
  }
}

const isMazeRenderableState = (value: unknown): value is MazeRenderableState => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<MazeRenderableState>;
  return Array.isArray(record.grid) && typeof record.player === "object" && typeof record.goal === "object";
};

const buildFallbackState = (): MazeRenderableState => {
  try {
    const env = new MazeEnv();
    const observation = env.reset();
    if (observation && typeof observation === "object" && "metadata" in observation) {
      const metadata = (observation as { metadata?: unknown }).metadata;
      if (isMazeRenderableState(metadata)) {
        return metadata;
      }
    }
  } catch {
    // ignore fallback instantiation failures
  }

  const grid: MazeRenderableState["grid"] = Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({
      x,
      y,
      walls: {
        top: false,
        right: false,
        bottom: false,
        left: false,
      },
    }))
  );
  return {
    grid,
    player: { x: 0, y: 0 },
    goal: { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
    steps: 0,
  };
};

export const MazeScene = memo(function MazeScene({
  state,
}: {
  state: MazeRenderableState;
}) {
  const playerRef = useRef<Mesh>(null);
  const goalRef = useRef<Mesh>(null);

  const fallbackState = useMemo<MazeRenderableState>(buildFallbackState, []);

  const resolvedState = useMemo<MazeRenderableState>(() => {
    if (isMazeRenderableState(state)) {
      return state;
    }
    return fallbackState;
  }, [state, fallbackState]);

  const wallSegments = useMemo(() => {
    const segments: { x: number; y: number; orientation: "horizontal" | "vertical" }[] = [];
    resolvedState.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.walls.top) {
          segments.push({ x: cell.x, y: cell.y, orientation: "horizontal" });
        }
        if (cell.walls.left) {
          segments.push({ x: cell.x, y: cell.y, orientation: "vertical" });
        }
        if (cell.x === row.length - 1 && cell.walls.right) {
          segments.push({ x: cell.x + 1, y: cell.y, orientation: "vertical" });
        }
        if (cell.y === resolvedState.grid.length - 1 && cell.walls.bottom) {
          segments.push({ x: cell.x, y: cell.y + 1, orientation: "horizontal" });
        }
      });
    });
    return segments;
  }, [resolvedState]);

  useFrame(() => {
    if (playerRef.current) {
      playerRef.current.position.set(
        resolvedState.player.x * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2,
        (GRID_SIZE * CELL_SIZE) / 2 - resolvedState.player.y * CELL_SIZE - CELL_SIZE / 2,
        0
      );
    }
    if (goalRef.current) {
      goalRef.current.position.set(
        resolvedState.goal.x * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2,
        (GRID_SIZE * CELL_SIZE) / 2 - resolvedState.goal.y * CELL_SIZE - CELL_SIZE / 2,
        0
      );
    }
  });

  return (
    <>
      <group position={[0, 0, -12]}>
        <mesh>
          <planeGeometry args={[GRID_SIZE * CELL_SIZE * 1.05, GRID_SIZE * CELL_SIZE * 1.05]} />
          <meshStandardMaterial color="#111827" emissive="#312e81" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 0, -2]}>
          <planeGeometry args={[GRID_SIZE * CELL_SIZE * 1.08, GRID_SIZE * CELL_SIZE * 1.08]} />
          <meshStandardMaterial color="#3730a3" opacity={0.25} transparent />
        </mesh>
      </group>
      {wallSegments.map((segment, idx) => (
        <mesh
          key={`${segment.x}-${segment.y}-${segment.orientation}-${idx}`}
          position={[
            segment.orientation === "vertical"
              ? segment.x * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2
              : segment.x * CELL_SIZE - (GRID_SIZE * CELL_SIZE) / 2 + CELL_SIZE / 2,
            segment.orientation === "horizontal"
              ? (GRID_SIZE * CELL_SIZE) / 2 - segment.y * CELL_SIZE
              : (GRID_SIZE * CELL_SIZE) / 2 - segment.y * CELL_SIZE - CELL_SIZE / 2,
            5,
          ]}
        >
          <boxGeometry
            args={
              segment.orientation === "vertical"
                ? [4, CELL_SIZE, 10]
                : [CELL_SIZE, 4, 10]
            }
          />
          <meshStandardMaterial color="#4338ca" emissive="#6366f1" emissiveIntensity={0.25} />
        </mesh>
      ))}
      <mesh ref={playerRef}>
        <boxGeometry args={[CELL_SIZE * 0.6, CELL_SIZE * 0.6, 12]} />
        <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.45} />
      </mesh>
      <mesh ref={goalRef}>
        <boxGeometry args={[CELL_SIZE * 0.6, CELL_SIZE * 0.6, 12]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fde047" emissiveIntensity={0.35} />
      </mesh>
      <ambientLight intensity={0.55} color="#cbd5f5" />
      <directionalLight position={[0, 0, 180]} intensity={1.2} color="#c7d2fe" />
      <directionalLight position={[140, 120, 120]} intensity={0.7} color="#f472b6" />
    </>
  );
});

export const MazeDefinition: EnvDefinition<MazeRenderableState> = {
  id: "maze",
  name: "Aurora Labyrinth",
  description: "DFS-generated maze navigation bathed in aurora lighting for crisp planning.",
  create: () => new MazeEnv(),
  Scene: MazeScene,
};

