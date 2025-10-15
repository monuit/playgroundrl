/// <reference lib="webworker" />

import { ALGORITHM_LOOKUP } from "@/algo";
import type { Algorithm } from "@/algo";
import { ENV_LOOKUP } from "@/env";
import type { Env, EnvObservation, EnvStepResult } from "@/env";
import { toObservationArray } from "@/utils/observation";
import { validateRewardSource, RewardValidationError } from "@/utils/rewardValidator";
import type { PpoHyperParams } from "@/algo/ppo_tfjs";
import type { ActionMetadata, TrainBatch } from "@/algo/types";
import type {
  TrainerCommand,
  TrainerEvent,
  TrainerStartPayload,
} from "./types";

interface TransitionRecord {
  observation: Float32Array;
  action: number;
  reward: number;
  nextObservation: Float32Array;
  done: boolean;
  logProb: number;
  value: number;
  nextValue: number;
}

interface TrainingLimits {
  episodes?: number;
  steps?: number;
}

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope;

let env: Env | null = null;
let algo: Algorithm | null = null;
let running = false;
let paused = false;
let pauseAwaiter: (() => void) | null = null;
let activeLoop: Promise<void> | null = null;
let totalEpisodes = 0;
let totalSteps = 0;
let rolloutBuffer: TransitionRecord[] = [];
let customReward: ((state: EnvStepResult, raw: number) => number) | null = null;
let limits: TrainingLimits | null = null;
let lastEpisodeSummary: { episode: number; reward: number; steps: number; durationMs: number } | null = null;
let latestDiagnostics: { loss?: number; entropy?: number; learningRate?: number } | undefined;

ctx.postMessage({ type: "ready" } satisfies TrainerEvent);

ctx.onmessage = (event: MessageEvent<TrainerCommand>) => {
  const message = event.data;
  switch (message.type) {
    case "init":
      void handleInit(message);
      break;
    case "start":
      void handleStart(message.payload);
      break;
    case "pause":
      handlePause();
      break;
    case "resume":
      handleResume();
      break;
    case "step":
      void handleStep(message.payload.steps);
      break;
    case "setReward":
      handleRewardUpdate(message.payload.source);
      break;
    case "setSeed":
      // not yet implemented
      break;
    case "saveCheckpoint":
      void handleSaveCheckpoint(message.payload?.label);
      break;
    case "loadCheckpoint":
      void handleLoadCheckpoint(message.payload.weights);
      break;
    case "dispose":
      void cleanup();
      break;
    default:
      break;
  }
};

async function handleInit(message: Extract<TrainerCommand, { type: "init" }>) {
  try {
    const envDefinition = ENV_LOOKUP[message.payload.envId];
    if (!envDefinition) {
      throw new Error(`Unknown environment ${message.payload.envId}`);
    }
    const algorithmDefinition = ALGORITHM_LOOKUP[message.payload.algoId];
    if (!algorithmDefinition) {
      throw new Error(`Unknown algorithm ${message.payload.algoId}`);
    }

    env = envDefinition.create();
    algo = algorithmDefinition.create();
    const obsShape = Array.from(env.obsSpace.shape);
    const actionSize =
      env.actionSpace.type === "discrete"
        ? env.actionSpace.n ?? 1
        : env.actionSpace.shape?.[0] ?? 1;

    await algo.init({
      obsShape,
      actionSize,
      backend: algorithmDefinition.backend,
      seed: message.payload.seed,
    });

    ctx.postMessage({
      type: "initialised",
      payload: { runId: message.payload.runId },
    } satisfies TrainerEvent);
  } catch (error) {
    reportError(error as Error);
  }
}

async function handleStart(payload?: TrainerStartPayload) {
  if (!env || !algo) {
    reportError(new Error("Worker not initialised"));
    return;
  }
  if (activeLoop) {
    return;
  }

  limits = {
    episodes: payload?.maxEpisodes,
    steps: payload?.maxSteps,
  };
  running = true;
  paused = false;
  ctx.postMessage({ type: "started" } satisfies TrainerEvent);

  activeLoop = (async () => {
    try {
      while (running) {
        if (limits?.episodes && totalEpisodes >= limits.episodes) {
          break;
        }
        await runEpisode();
        if (limits?.steps && totalSteps >= limits.steps) {
          break;
        }
      }
      ctx.postMessage({
        type: "completed",
        payload: { episodes: totalEpisodes, steps: totalSteps },
      } satisfies TrainerEvent);
    } catch (error) {
      reportError(error as Error);
    } finally {
      running = false;
      activeLoop = null;
    }
  })();
}

function handlePause() {
  if (!running || paused) {
    return;
  }
  paused = true;
}

function handleResume() {
  if (!paused) {
    return;
  }
  paused = false;
  pauseAwaiter?.();
  pauseAwaiter = null;
  ctx.postMessage({ type: "resumed" } satisfies TrainerEvent);
}

async function handleStep(stepCount: number) {
  limits = { episodes: undefined, steps: stepCount };
  await handleStart({ maxSteps: stepCount });
}

function handleRewardUpdate(source: string) {
  try {
    validateRewardSource(source);

    const fn = new Function(
      "state",
      "reward",
      "info",
      `
        "use strict";
        ${source}
      `
    ) as (state: EnvStepResult, reward: number, info: Record<string, unknown>) => number;
    customReward = (state, reward) => {
      try {
        const result = fn(state, reward, state.info ?? {});
        return Number.isFinite(result) ? Number(result) : reward;
      } catch {
        return reward;
      }
    };
  } catch (error) {
    if (error instanceof RewardValidationError) {
      reportError(error);
      return;
    }
    reportError(error as Error);
  }
}

async function handleSaveCheckpoint(label?: string) {
  if (!algo) {
    reportError(new Error("Cannot save checkpoint before initialization"));
    return;
  }
  try {
    const weights = await algo.save();
    const summary = lastEpisodeSummary ?? {
      episode: totalEpisodes,
      reward: 0,
      steps: 0,
      durationMs: 0,
    };
    ctx.postMessage(
      {
        type: "checkpoint-saved",
        payload: {
          label,
          episode: summary.episode,
          reward: summary.reward,
          steps: summary.steps,
          weights,
          timestamp: new Date().toISOString(),
        },
      } satisfies TrainerEvent,
      [weights]
    );
  } catch (error) {
    reportError(error as Error);
  }
}

async function handleLoadCheckpoint(weights: ArrayBuffer) {
  if (!algo) {
    reportError(new Error("Cannot load checkpoint before initialization"));
    return;
  }
  try {
    await algo.load(weights);
  } catch (error) {
    reportError(error as Error);
  }
}

async function runEpisode() {
  if (!env || !algo) {
    throw new Error("Environment or algorithm missing");
  }
  let observation = env.reset();
  sendState(observation);
  let pendingTransition: TransitionRecord | null = null;
  let episodeReward = 0;
  let episodeSteps = 0;
  let pauseSignalSent = false;
  const episodeStart = typeof performance !== "undefined" ? performance.now() : Date.now();

  while (running) {
    if (paused) {
      if (!pauseSignalSent) {
        ctx.postMessage({ type: "paused" } satisfies TrainerEvent);
        pauseSignalSent = true;
      }
      await new Promise<void>((resolve) => {
        pauseAwaiter = resolve;
      });
      continue;
    }

    const action = await algo.act(observation);
    const metadata = algo.getActionMetadata?.();
    const result = env.step(action);
    sendState(result.state);

    const reward = applyReward(result);
    episodeReward += reward;
    episodeSteps += 1;
    totalSteps += 1;

    const transition = buildTransition({
      observation,
      action,
      reward,
      nextObservation: result.state,
      done: result.done,
      metadata,
    });

    if (pendingTransition) {
      pendingTransition.nextValue = transition.value;
      await dispatchTransition(pendingTransition);
    }

    pendingTransition = transition;

    observation = result.state;

    if (result.done) {
      if (pendingTransition) {
        pendingTransition.nextValue = 0;
        await dispatchTransition(pendingTransition);
        pendingTransition = null;
      }
      break;
    }

    if (limits?.steps && totalSteps >= limits.steps) {
      break;
    }
  }

  if (pendingTransition) {
    await dispatchTransition(pendingTransition);
    pendingTransition = null;
  }

  if (algo?.id.startsWith("ppo") && rolloutBuffer.length) {
    await flushRollout(true);
  }

  totalEpisodes += 1;

  const durationMs = (typeof performance !== "undefined" ? performance.now() : Date.now()) - episodeStart;
  const stepsPerSecond = durationMs > 0 ? (episodeSteps * 1000) / durationMs : undefined;
  const diagnostics = latestDiagnostics ?? {};

  ctx.postMessage({
    type: "stepped",
    payload: {
      metrics: {
        episode: totalEpisodes,
        reward: episodeReward,
        steps: episodeSteps,
        loss: diagnostics.loss,
        entropy: diagnostics.entropy,
        learningRate: diagnostics.learningRate,
        stepsPerSecond,
        timeMs: durationMs,
      },
    },
  } satisfies TrainerEvent);

  lastEpisodeSummary = {
    episode: totalEpisodes,
    reward: episodeReward,
    steps: episodeSteps,
    durationMs,
  };
  latestDiagnostics = undefined;
}

function buildTransition({
  observation,
  action,
  reward,
  nextObservation,
  done,
  metadata,
}: {
  observation: EnvObservation;
  action: number | number[];
  reward: number;
  nextObservation: EnvObservation;
  done: boolean;
  metadata?: ActionMetadata | undefined;
}): TransitionRecord {
  const actionValue = Array.isArray(action)
    ? Number(action[0] ?? 0)
    : Number(action);
  const logProb = metadata?.logProb ?? 0;
  const valueEstimate = (() => {
    const value = metadata?.valueEstimate;
    if (Array.isArray(value)) {
      return Number(value[0] ?? 0);
    }
    return Number(value ?? 0);
  })();

  return {
    observation: toObservationArray(observation),
    action: actionValue,
    reward,
    nextObservation: toObservationArray(nextObservation),
    done,
    logProb,
    value: valueEstimate,
    nextValue: valueEstimate,
  };
}

async function dispatchTransition(transition: TransitionRecord) {
  if (!algo) {
    return;
  }
  if (algo.id.startsWith("ppo")) {
    rolloutBuffer.push(transition);
    const hyper = algo.hyper as PpoHyperParams;
    if (rolloutBuffer.length >= hyper.rolloutLength) {
      await flushRollout(false);
    }
  } else {
    const batch = buildBatch([transition]);
    await algo.observe(batch);
    captureDiagnostics();
  }
}

async function flushRollout(force: boolean) {
  if (!algo || rolloutBuffer.length === 0) {
    return;
  }

  const hyper = algo.hyper as PpoHyperParams;
  const gamma = hyper.gamma;
  const lambda = hyper.gaeLambda;
  const transitions = rolloutBuffer.slice();

  const size = transitions.length;
  const obsSize = transitions[0].observation.length;

  const advantages = new Float32Array(size);
  const returns = new Float32Array(size);

  let nextAdvantage = 0;
  for (let i = size - 1; i >= 0; i -= 1) {
    const { reward, value, nextValue, done } = transitions[i];
    const delta = reward + gamma * (done ? 0 : nextValue) - value;
    nextAdvantage =
      delta + gamma * lambda * (done ? 0 : nextAdvantage);
    advantages[i] = nextAdvantage;
    returns[i] = advantages[i] + value;
  }

  const observations = new Float32Array(size * obsSize);
  const nextObservations = new Float32Array(size * obsSize);
  const actions = new Float32Array(size);
  const rewards = new Float32Array(size);
  const dones = new Uint8Array(size);
  const logProbs = new Float32Array(size);
  const values = new Float32Array(size);

  transitions.forEach((transition, index) => {
    observations.set(transition.observation, index * obsSize);
    nextObservations.set(transition.nextObservation, index * obsSize);
    actions[index] = transition.action;
    rewards[index] = transition.reward;
    dones[index] = transition.done ? 1 : 0;
    logProbs[index] = transition.logProb;
    values[index] = transition.value;
  });

  const batch: TrainBatch = {
    observations,
    actions,
    rewards,
    nextObservations,
    dones,
    extras: {
      logProbs,
      values,
      advantages,
      returns,
      flush: force ? new Uint8Array([1]) : new Uint8Array([0]),
    },
  };

  await algo.observe(batch);
  captureDiagnostics();
  rolloutBuffer = [];
}

function buildBatch(transitions: TransitionRecord[]): TrainBatch {
  const obsSize = transitions[0].observation.length;
  const size = transitions.length;

  const observations = new Float32Array(size * obsSize);
  const actions = new Float32Array(size);
  const rewards = new Float32Array(size);
  const nextObservations = new Float32Array(size * obsSize);
  const dones = new Uint8Array(size);

  transitions.forEach((transition, index) => {
    observations.set(transition.observation, index * obsSize);
    nextObservations.set(transition.nextObservation, index * obsSize);
    actions[index] = transition.action;
    rewards[index] = transition.reward;
    dones[index] = transition.done ? 1 : 0;
  });

  return {
    observations,
    actions,
    rewards,
    nextObservations,
    dones,
  };
}

function captureDiagnostics() {
  if (algo?.getDiagnostics) {
    latestDiagnostics = algo.getDiagnostics();
  }
}

function applyReward(result: EnvStepResult) {
  const baseReward = result.reward;
  if (!customReward) {
    return baseReward;
  }
  try {
    return customReward(result, baseReward);
  } catch {
    return baseReward;
  }
}

function extractMetadata(observation: EnvObservation) {
  if (
    observation &&
    typeof observation === "object" &&
    "metadata" in observation
  ) {
    return (observation as { metadata?: Record<string, unknown> }).metadata;
  }
  return undefined;
}

function sendState(observation: EnvObservation) {
  const buffer = toObservationArray(observation);
  const payloadBuffer = buffer.slice();
  ctx.postMessage({
    type: "state",
    payload: {
      observation: payloadBuffer,
      metadata: extractMetadata(observation),
    },
  } satisfies TrainerEvent);
}

async function cleanup() {
  running = false;
  paused = false;
  pauseAwaiter?.();
  pauseAwaiter = null;
  const loop = activeLoop;
  activeLoop = null;
  if (loop) {
    try {
      await loop;
    } catch (error) {
      reportError(error as Error);
    }
  }

  rolloutBuffer = [];
  totalEpisodes = 0;
  totalSteps = 0;
  lastEpisodeSummary = null;
  latestDiagnostics = undefined;

  await algo?.dispose();
  env = null;
  algo = null;
}

function reportError(error: Error) {
  ctx.postMessage({
    type: "error",
    error: error.message,
    stack: error.stack,
  } satisfies TrainerEvent);
}





















