import { createDqnAgent, type DqnHyperParams } from "./dqn_tfjs";
import { createPpoAgent, type PpoHyperParams } from "./ppo_tfjs";
import type { Algorithm } from "./types";

export interface AlgorithmFactory {
  id: string;
  name: string;
  backend: "tfjs" | "pyodide";
  create: () => Algorithm;
  description: string;
}

export const ALGORITHMS: AlgorithmFactory[] = [
  {
    id: "dqn-tfjs",
    name: "DQN (tfjs)",
    backend: "tfjs",
    create: () => createDqnAgent(),
    description: "Deep Q-Network baseline for discrete control and ablations.",
  },
  {
    id: "ppo-tfjs",
    name: "PPO (tfjs)",
    backend: "tfjs",
    create: () => createPpoAgent(),
    description: "PPO with 1k-step rollouts, ±0.12 clipping, and 256-unit actor-critic heads.",
  },
];

export const ALGORITHM_LOOKUP = ALGORITHMS.reduce<Record<string, AlgorithmFactory>>(
  (acc, algo) => {
    acc[algo.id] = algo;
    return acc;
  },
  {}
);

export type { Algorithm } from "./types";
export type { DqnHyperParams, PpoHyperParams };

