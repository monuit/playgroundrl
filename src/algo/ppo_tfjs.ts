/**
 * Proximal Policy Optimization (PPO) Implementation
 * 
 * PPO is a state-of-the-art policy gradient method that learns directly from
 * environment interactions. It uses a clipped surrogate objective to constrain
 * policy updates, preventing destructively large steps that can destabilize training.
 * 
 * Key Components:
 * 1. **Actor-Critic Architecture**: Separate policy (actor) and value (critic) networks
 * 2. **Clipped Surrogate Objective**: L^CLIP = E[min(r(θ)·Â, clip(r(θ), 1-ε, 1+ε)·Â)]
 * 3. **Generalized Advantage Estimation (GAE)**: Balances bias-variance tradeoff
 * 4. **Multiple Epochs**: Reuses rollout data for sample efficiency
 * 
 * Mathematical Foundation:
 * - Importance ratio: r(θ) = π_θ(a|s) / π_θ_old(a|s)
 * - Advantage normalization: Â_norm = (Â - μ) / (σ + ε)
 * - Total loss: L^PPO = L^CLIP + c₁·L^VF - c₂·H(π_θ)
 * 
 * References:
 * - Schulman et al. (2017): "Proximal Policy Optimization Algorithms"
 * - Bick, Daniel (2021): "Towards Delivering a Coherent Self-Contained Explanation of PPO"
 * 
 * @see https://arxiv.org/abs/1707.06347
 * @see https://fse.studenttheses.ub.rug.nl/25709/
 */
import * as tf from "@tensorflow/tfjs";
import seedrandom from "seedrandom";
import { RolloutBuffer } from "./buffers";
import type {
  ActionMetadata,
  Algorithm,
  AlgorithmDiagnostics,
  AlgorithmInit,
  TrainBatch,
  TrainHyperParams,
} from "./types";
import type { EnvObservation } from "@/env";
import { toObservationArray } from "@/utils/observation";

/**
 * PPO Hyperparameters
 * 
 * @property clipRange - ε for clipping ratio in [1-ε, 1+ε] (typically 0.1-0.2)
 * @property entropyCoeff - c₂ coefficient for entropy bonus (encourages exploration)
 * @property valueCoeff - c₁ coefficient for value function loss
 * @property rolloutLength - Number of steps before policy update (1024-2048 typical)
 * @property miniBatchSize - Size of mini-batches for SGD updates
 * @property epochs - Number of passes through rollout data (3-10 typical)
 * @property gaeLambda - λ for Generalized Advantage Estimation (0.95-0.99)
 * @property clipValueLoss - Whether to clip value function loss (improves stability)
 * @property maxGradNorm - Maximum gradient norm for clipping (0 = disabled)
 * @property normalizeAdvantages - Whether to normalize advantages across mini-batch
 * @property targetKL - Early stopping if KL divergence exceeds this (0 = disabled)
 */
export interface PpoHyperParams extends TrainHyperParams {
  clipRange: number;
  entropyCoeff: number;
  valueCoeff: number;
  rolloutLength: number;
  miniBatchSize: number;
  epochs: number;
  gaeLambda: number;
  clipValueLoss: boolean;
  maxGradNorm: number;
  normalizeAdvantages: boolean;
  targetKL: number;
}

/**
 * Default PPO Hyperparameters
 * 
 * These values are based on the original PPO paper and subsequent research.
 * They represent a good starting point for most continuous control tasks.
 * 
 * Tuning Guide:
 * - Increase clipRange for faster learning (but less stable)
 * - Increase entropyCoeff for more exploration
 * - Increase rolloutLength for better advantage estimates
 * - Increase epochs for better sample efficiency (but risk overfitting)
 * - Enable clipValueLoss for more stable value learning
 * - Set maxGradNorm > 0 to prevent gradient explosions
 * - Set targetKL > 0 for early stopping on large policy changes
 */
const DEFAULT_PPO_HYPER: PpoHyperParams = {
  learningRate: 2.5e-4,      // Adam learning rate (1e-4 to 3e-4 typical)
  gamma: 0.99,               // Discount factor for future rewards
  clipRange: 0.12,           // PPO clipping parameter ε (0.1-0.3 typical)
  entropyCoeff: 0.01,        // Entropy bonus coefficient c₂
  valueCoeff: 0.5,           // Value function loss coefficient c₁
  rolloutLength: 1024,       // Steps per policy update
  miniBatchSize: 256,        // Mini-batch size for SGD
  epochs: 4,                 // Optimization epochs per rollout
  gaeLambda: 0.95,          // GAE λ parameter (0.9-0.99 typical)
  clipValueLoss: false,      // Clip value loss (recommended for stability)
  maxGradNorm: 0.5,         // Gradient norm clipping (0 = disabled)
  normalizeAdvantages: true, // Normalize advantages (recommended)
  targetKL: 0,              // Early stopping KL threshold (0 = disabled)
  batchSize: 0,
};

/**
 * Small epsilon for numerical stability
 * Prevents log(0) and division by zero
 */
const epsilon = 1e-8;

export class PpoTfjsAgent implements Algorithm<PpoHyperParams> {
  readonly id = "ppo-tfjs";
  readonly backend = "tfjs" as const;
  readonly hyper: PpoHyperParams;

  private policyModel: tf.LayersModel | null = null;
  private valueModel: tf.LayersModel | null = null;
  private optimizer: tf.Optimizer | null = null;
  private obsSize = 0;
  private actionSize = 0;
  private rng: seedrandom.PRNG = seedrandom();
  private lastAction: ActionMetadata | undefined;
  private rollout = new RolloutBuffer();
  private diagnostics: AlgorithmDiagnostics = {};
  private oldValuePredictions: Float32Array | null = null;

  constructor(hyperOverrides: Partial<PpoHyperParams> = {}) {
    this.hyper = {
      ...DEFAULT_PPO_HYPER,
      ...hyperOverrides,
    };
  }

  async init(config: AlgorithmInit) {
    await tf.ready();
    try {
      if (tf.getBackend() !== "webgl") {
        await tf.setBackend("webgl");
      }
    } catch {
      // continue with whichever backend is available
    }

    this.obsSize = config.obsShape.reduce((acc, curr) => acc * curr, 1);
    this.actionSize = config.actionSize;
    this.rng = seedrandom(config.seed);
    this.rollout.clear();

    this.policyModel = this.buildPolicyNetwork(this.obsSize, this.actionSize);
    this.valueModel = this.buildValueNetwork(this.obsSize);
    this.optimizer = tf.train.adam(this.hyper.learningRate);
  }

  async act(observation: EnvObservation) {
    if (!this.policyModel || !this.valueModel) {
      throw new Error("PPO agent not initialized");
    }
    const flatObs = Array.from(toObservationArray(observation));
    const obsTensor = tf.tensor2d([flatObs], [1, this.obsSize]);

    const logits = this.policyModel.predict(obsTensor) as tf.Tensor;
    const values = this.valueModel.predict(obsTensor) as tf.Tensor;
    const logitsArray = Array.from(await logits.data());
    const valueArray = Array.from(await values.data());

    const probs = this.softmax(logitsArray);
    const action = this.sampleFromDistribution(probs);
    const logProb = Math.log(Math.max(probs[action], epsilon));

    this.lastAction = {
      logProb,
      valueEstimate: valueArray[0],
      distributionParams: {
        logits: logitsArray,
        probs,
      },
    };

    logits.dispose();
    values.dispose();
    obsTensor.dispose();

    return action;
  }

  getActionMetadata() {
    return this.lastAction;
  }

  async observe(batch: TrainBatch) {
    if (!this.policyModel || !this.valueModel || !this.optimizer) {
      return;
    }

    const stepCount = batch.rewards.length;
    const obsStride = this.obsSize;
    const extras = batch.extras ?? {};
    const logProbExtras = extras.logProbs ?? new Float32Array(stepCount);
    const valueExtras = extras.values ?? new Float32Array(stepCount);
    const advantageExtras = extras.advantages ?? new Float32Array(stepCount);
    const returnExtras = extras.returns ?? new Float32Array(stepCount);

    for (let i = 0; i < stepCount; i += 1) {
      const offset = i * obsStride;
      this.rollout.push({
        observation: new Float32Array(
          batch.observations.slice(offset, offset + obsStride)
        ),
        action: new Float32Array([batch.actions[i]]),
        logProb: logProbExtras[i] ?? 0,
        reward: batch.rewards[i],
        value: valueExtras[i] ?? 0,
        done: Boolean(batch.dones[i]),
      });
    }

    const shouldTrain =
      this.rollout.steps.length >= this.hyper.rolloutLength ||
      Boolean(extras.flush);

    if (!shouldTrain) {
      return;
    }

    await this.trainFromRollout({
      logProbs: logProbExtras,
      values: valueExtras,
      advantages: advantageExtras,
      returns: returnExtras,
    });
    this.rollout.clear();
  }

  async save() {
    if (!this.policyModel || !this.valueModel) {
      throw new Error("Cannot save before initialization");
    }
    const policyData = await this.encodeModelWeights(this.policyModel);
    const valueData = await this.encodeModelWeights(this.valueModel);
    const joined = new Uint8Array(
      8 + policyData.byteLength + valueData.byteLength
    );
    const view = new DataView(joined.buffer);
    view.setUint32(0, policyData.byteLength, true);
    view.setUint32(4, valueData.byteLength, true);
    joined.set(new Uint8Array(policyData), 8);
    joined.set(new Uint8Array(valueData), 8 + policyData.byteLength);
    return joined.buffer;
  }

  async load(buffer: ArrayBuffer) {
    if (!this.policyModel || !this.valueModel) {
      throw new Error("Cannot load before initialization");
    }
    const view = new DataView(buffer);
    const policySize = view.getUint32(0, true);
    const valueSize = view.getUint32(4, true);
    const policySegment = buffer.slice(8, 8 + policySize);
    const valueSegment = buffer.slice(8 + policySize, 8 + policySize + valueSize);
    await this.decodeIntoModel(this.policyModel, policySegment);
    await this.decodeIntoModel(this.valueModel, valueSegment);
  }

  async dispose() {
    this.policyModel?.dispose();
    this.valueModel?.dispose();
    this.optimizer?.dispose();
    this.policyModel = null;
    this.valueModel = null;
    this.optimizer = null;
    this.rollout.clear();
  }

  /**
   * Build Policy Network (Actor)
   * 
   * Architecture:
   * - Input: Observation vector
   * - Hidden: 256 units × 2 layers with GELU activation
   * - Output: Action logits (unnormalized log probabilities)
   * 
   * The policy network outputs logits which are converted to probabilities
   * via softmax: π(a|s) = exp(logit_a) / Σ exp(logit_i)
   * 
   * GELU (Gaussian Error Linear Unit) activation provides smooth gradients
   * and often performs better than ReLU in deep RL tasks.
   * 
   * @param obsSize - Dimensionality of observation space
   * @param actionSize - Number of discrete actions
   * @returns Keras Sequential model
   */
  private buildPolicyNetwork(obsSize: number, actionSize: number) {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 256,
        activation: "gelu",
        inputShape: [obsSize],
      })
    );
    model.add(
      tf.layers.dense({
        units: 256,
        activation: "gelu",
      })
    );
    // Output layer: no activation (logits)
    model.add(tf.layers.dense({ units: actionSize }));
    return model;
  }

  /**
   * Build Value Network (Critic)
   * 
   * Architecture:
   * - Input: Observation vector
   * - Hidden: 256 units × 2 layers with GELU activation
   * - Output: Single scalar value V(s)
   * 
   * The value network estimates the expected cumulative discounted reward
   * from a given state: V(s) = E[Σ γ^t · r_t | s_0 = s]
   * 
   * This is used to compute advantages: A(s,a) = Q(s,a) - V(s)
   * which reduces variance in policy gradient estimates.
   * 
   * @param obsSize - Dimensionality of observation space
   * @returns Keras Sequential model
   */
  private buildValueNetwork(obsSize: number) {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 256,
        activation: "gelu",
        inputShape: [obsSize],
      })
    );
    model.add(
      tf.layers.dense({
        units: 256,
        activation: "gelu",
      })
    );
    // Output layer: single value estimate
    model.add(
      tf.layers.dense({
        units: 1,
      })
    );
    return model;
  }

  private softmax(values: number[]) {
    const max = Math.max(...values);
    const exp = values.map((v) => Math.exp(v - max));
    const sum = exp.reduce((acc, val) => acc + val, 0);
    return exp.map((val) => val / Math.max(sum, epsilon));
  }

  private sampleFromDistribution(probs: number[]) {
    const threshold = this.rng();
    let cumulative = 0;
    for (let i = 0; i < probs.length; i += 1) {
      cumulative += probs[i];
      if (threshold <= cumulative) {
        return i;
      }
    }
    return probs.length - 1;
  }

  private async trainFromRollout(stats: {
    logProbs: Float32Array | Uint8Array;
    values: Float32Array | Uint8Array;
    advantages: Float32Array | Uint8Array;
    returns: Float32Array | Uint8Array;
  }) {
    const steps = this.rollout.steps;
    if (steps.length === 0) {
      return;
    }

    const obsSize = this.obsSize;
    const total = steps.length;
    const observations = new Float32Array(total * obsSize);
    const actions = new Int32Array(total);
    const logProbs = this.toFloatArray(stats.logProbs);
    const oldValues = this.toFloatArray(stats.values);
    const returns = this.toFloatArray(stats.returns);
    const advantages = this.toFloatArray(stats.advantages);

    for (let i = 0; i < total; i += 1) {
      const step = steps[i];
      observations.set(step.observation, i * obsSize);
      actions[i] = step.action[0];
      if (!Number.isFinite(logProbs[i])) {
        logProbs[i] = step.logProb;
      }
      if (!Number.isFinite(oldValues[i])) {
        oldValues[i] = step.value;
      }
    }

    // === Advantage Normalization ===
    // Normalizing advantages: Â = (A - μ) / σ improves training stability
    // by keeping gradient magnitudes consistent across different reward scales
    if (this.hyper.normalizeAdvantages) {
      const meanAdv =
        advantages.reduce((acc, val) => acc + val, 0) / Math.max(total, 1);
      const variance =
        advantages.reduce((acc, val) => acc + (val - meanAdv) ** 2, 0) /
        Math.max(total, 1);
      const stdAdv = Math.sqrt(variance + epsilon);
      for (let i = 0; i < total; i += 1) {
        advantages[i] = (advantages[i] - meanAdv) / stdAdv;
      }
    }

    const indices = Array.from({ length: total }, (_, idx) => idx);
    const miniBatch = this.hyper.miniBatchSize;

    let lastLoss: number | undefined;
    let lastEntropy: number | undefined;
    let lastKL: number | undefined;
    
    // Store old value predictions for value clipping
    this.oldValuePredictions = new Float32Array(oldValues);


    // === Training Loop with Early Stopping ===
    epochLoop: for (let epoch = 0; epoch < this.hyper.epochs; epoch += 1) {
      this.shuffle(indices);
      for (let start = 0; start < total; start += miniBatch) {
        const end = Math.min(start + miniBatch, total);
        const batchIdx = indices.slice(start, end);
        await this.optimizer!.minimize(() => {
          return tf.tidy(() => {
            const obsBatch = tf.tensor2d(
              this.sliceByIndices(observations, obsSize, batchIdx),
              [batchIdx.length, obsSize]
            );
            const actionBatch = tf.tensor1d(
              batchIdx.map((i) => actions[i]),
              "int32"
            );
            const advantageBatch = tf.tensor1d(batchIdx.map((i) => advantages[i]));
            const returnBatch = tf.tensor1d(batchIdx.map((i) => returns[i]));
            const oldLogProbBatch = tf.tensor1d(
              batchIdx.map((i) => logProbs[i])
            );

            // === Policy Network Forward Pass ===
            const logits = this.policyModel!.apply(obsBatch, {
              training: true,
            }) as tf.Tensor;
            const logSoftmax = tf.logSoftmax(logits);
            const probs = tf.exp(logSoftmax);
            const selectedLogProbs = tf.sum(
              tf.mul(tf.oneHot(actionBatch, this.actionSize), logSoftmax),
              -1
            );

            // === Importance Sampling Ratio ===
            // r(θ) = π_θ(a|s) / π_θ_old(a|s)
            // Measures how much the new policy differs from the old policy
            const ratio = tf.exp(selectedLogProbs.sub(oldLogProbBatch));
            
            // === Clipped Surrogate Objective ===
            // clip(r, 1-ε, 1+ε) prevents the ratio from straying too far from 1
            // This is PPO's key innovation for stable policy updates
            const clippedRatio = tf.clipByValue(
              ratio,
              1 - this.hyper.clipRange,
              1 + this.hyper.clipRange
            );

            // Take minimum of clipped and unclipped objective
            // This creates a pessimistic bound that prevents over-optimization
            const surrogate1 = ratio.mul(advantageBatch);
            const surrogate2 = clippedRatio.mul(advantageBatch);
            const actorLoss = tf.neg(tf.mean(tf.minimum(surrogate1, surrogate2)));

            // === Entropy Bonus ===
            // H(π) = -E[log π(a|s)] encourages exploration by penalizing
            // deterministic policies (high entropy = more random)
            const entropy = tf.mean(
              tf.neg(tf.sum(probs.mul(logSoftmax), -1))
            );

            // === Value Function Loss ===
            // MSE between predicted values V(s) and actual returns
            // Helps the critic better estimate state values for advantage computation
            const values = this.valueModel!.apply(obsBatch, {
              training: true,
            }) as tf.Tensor;
            const flatValues = values.reshape([batchIdx.length]);
            
            let valueLoss: tf.Tensor;
            if (this.hyper.clipValueLoss && this.oldValuePredictions) {
              // === Clipped Value Loss ===
              // Clips value updates similar to policy clipping
              // V_clipped = V_old + clip(V_new - V_old, -ε, ε)
              const oldValueBatch = tf.tensor1d(
                batchIdx.map((i) => this.oldValuePredictions![i])
              );
              const valueDiff = flatValues.sub(oldValueBatch);
              const clippedValueDiff = tf.clipByValue(
                valueDiff,
                -this.hyper.clipRange,
                this.hyper.clipRange
              );
              const clippedValue = oldValueBatch.add(clippedValueDiff);
              
              const vfLoss1 = tf.square(returnBatch.sub(flatValues));
              const vfLoss2 = tf.square(returnBatch.sub(clippedValue));
              valueLoss = tf.mean(tf.maximum(vfLoss1, vfLoss2));
              
              oldValueBatch.dispose();
              valueDiff.dispose();
              clippedValueDiff.dispose();
              clippedValue.dispose();
              vfLoss1.dispose();
              vfLoss2.dispose();
            } else {
              // Standard MSE value loss
              valueLoss = tf.mean(tf.square(returnBatch.sub(flatValues)));
            }

            // === KL Divergence Calculation ===
            // KL(π_old || π) = E[log π_old - log π] measures policy change
            // Used for monitoring training stability and early stopping
            const approxKL = tf.mean(oldLogProbBatch.sub(selectedLogProbs));

            // === Combined Loss ===
            // L^PPO = L^CLIP + c₁·L^VF - c₂·H(π)
            // Balance between policy improvement, value accuracy, and exploration
            const totalLoss = actorLoss
              .add(valueLoss.mul(this.hyper.valueCoeff))
              .sub(entropy.mul(this.hyper.entropyCoeff));

            const lossScalar = totalLoss as tf.Scalar;
            lastLoss = lossScalar.dataSync()[0];
            lastEntropy = entropy.dataSync()[0];
            lastKL = approxKL.dataSync()[0];

            actionBatch.dispose();
            advantageBatch.dispose();
            returnBatch.dispose();
            oldLogProbBatch.dispose();
            approxKL.dispose();

            return lossScalar;
          });
        });
        
        // === Early Stopping on Large KL Divergence ===
        // If KL divergence exceeds target, stop training to prevent policy collapse
        if (this.hyper.targetKL > 0 && lastKL !== undefined && lastKL > this.hyper.targetKL) {
          break epochLoop;
        }
      }
    }

    if (lastLoss !== undefined) {
      this.diagnostics.loss = lastLoss;
    }
    if (lastEntropy !== undefined) {
      this.diagnostics.entropy = lastEntropy;
    }
    if (lastKL !== undefined) {
      this.diagnostics.approxKL = lastKL;
    }
    this.diagnostics.learningRate = this.hyper.learningRate;
  }

  getDiagnostics(): AlgorithmDiagnostics {
    return { ...this.diagnostics };
  }

  private async encodeModelWeights(model: tf.LayersModel) {
    const namedWeights: tf.NamedTensorMap = {};
    model.weights.forEach((weight) => {
      namedWeights[weight.originalName] = weight.read();
    });
    const { data, specs } = await tf.io.encodeWeights(namedWeights);
    Object.values(namedWeights).forEach((tensor) => tensor.dispose());

    const metadata = new TextEncoder().encode(JSON.stringify({ specs }));
    const header = new Uint8Array(new Uint32Array([metadata.byteLength]).buffer);
    const combined = new Uint8Array(header.length + metadata.length + data.byteLength);
    combined.set(header, 0);
    combined.set(metadata, header.length);
    combined.set(new Uint8Array(data), header.length + metadata.length);
    return combined.buffer;
  }

  private async decodeIntoModel(model: tf.LayersModel, buffer: ArrayBuffer) {
    const view = new DataView(buffer);
    const metaLength = view.getUint32(0, true);
    const metaStart = 4;
    const metaEnd = metaStart + metaLength;
    const metadata = new Uint8Array(buffer, metaStart, metaLength);
    const payload = buffer.slice(metaEnd);
    const { specs } = JSON.parse(new TextDecoder().decode(metadata)) as {
      specs: tf.io.WeightsManifestEntry[];
    };
    const weightsMap = await tf.io.decodeWeights(payload, specs);
    const ordered = model.weights.map((weight) => {
      const tensor = weightsMap[weight.originalName];
      if (!tensor) {
        throw new Error(`Missing weight ${weight.originalName}`);
      }
      return tensor;
    });
    await model.setWeights(ordered);
    Object.values(weightsMap).forEach((tensor) => tensor.dispose());
  }

  private sliceByIndices(array: Float32Array, stride: number, indices: number[]) {
    const result = new Float32Array(indices.length * stride);
    indices.forEach((idx, i) => {
      const start = idx * stride;
      result.set(array.slice(start, start + stride), i * stride);
    });
    return result;
  }

  private shuffle(indices: number[]) {
    for (let i = indices.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }

  private toFloatArray(input: Float32Array | Uint8Array) {
    if (input instanceof Float32Array) {
      return new Float32Array(input);
    }
    return Float32Array.from(input);
  }
}

export const createPpoAgent = (hyper?: Partial<PpoHyperParams>) =>
  new PpoTfjsAgent(hyper);













