/**
 * Deep Q-Network (DQN) Implementation
 * 
 * DQN is a value-based reinforcement learning algorithm that learns an action-value
 * function Q(s,a) representing the expected return from taking action a in state s.
 * It introduced two key innovations that stabilized deep RL training:
 * 
 * Key Components:
 * 1. **Experience Replay**: Stores transitions in buffer D, breaks temporal correlations
 * 2. **Target Network**: Separate frozen network θ⁻ provides stable TD targets
 * 3. **ε-Greedy Exploration**: Balances exploration vs exploitation with decaying ε
 * 
 * Mathematical Foundation:
 * - Q-value: Q^π(s,a) = E_π[Σ γ^k · r_{t+k+1} | s_t=s, a_t=a]
 * - Bellman equation: Q*(s,a) = E[r + γ · max_{a'} Q*(s',a')]
 * - TD error: δ = r + γ · max_{a'} Q_target(s',a') - Q(s,a)
 * - Loss: L(θ) = E_{(s,a,r,s')~D}[(y - Q(s,a;θ))²]
 * 
 * References:
 * - Mnih et al. (2015): "Human-level control through deep reinforcement learning"
 * - Van Hasselt et al. (2016): "Deep Reinforcement Learning with Double Q-learning"
 * 
 * @see https://www.nature.com/articles/nature14236
 * @see https://arxiv.org/abs/1509.06461
 */
import * as tf from "@tensorflow/tfjs";
import seedrandom from "seedrandom";
import { ReplayBuffer } from "./buffers";
import { LinearSchedule } from "./schedules";
import type {
  Algorithm,
  AlgorithmDiagnostics,
  AlgorithmInit,
  TrainBatch,
  TrainHyperParams,
} from "./types";
import type { EnvObservation } from "@/env";
import { toObservationArray } from "@/utils/observation";

/**
 * DQN Hyperparameters
 * 
 * @property epsilonStart - Initial ε for ε-greedy exploration (typically 1.0)
 * @property epsilonFinal - Final ε after decay (typically 0.01-0.1)
 * @property epsilonDecaySteps - Steps to decay ε linearly
 * @property bufferSize - Maximum number of transitions in replay buffer
 * @property minBufferBeforeTraining - Minimum buffer size before training starts
 */
export interface DqnHyperParams extends TrainHyperParams {
  epsilonStart: number;
  epsilonFinal: number;
  epsilonDecaySteps: number;
  bufferSize: number;
  minBufferBeforeTraining: number;
}

/**
 * Default DQN Hyperparameters
 * 
 * These values are based on the original DQN Nature paper and work well
 * for discrete action environments like Atari games.
 * 
 * Tuning Guide:
 * - Increase bufferSize for more diverse samples
 * - Decrease targetUpdateFrequency for faster target updates (less stable)
 * - Increase batchSize for more stable gradients (slower training)
 * - Adjust epsilon decay for exploration-exploitation balance
 */
const DEFAULT_HYPER: DqnHyperParams = {
  learningRate: 2.5e-4,           // Adam learning rate
  gamma: 0.99,                    // Discount factor for future rewards
  targetUpdateFrequency: 1_000,   // Steps between target network syncs
  batchSize: 64,                  // Mini-batch size for SGD
  epsilonStart: 1.0,              // Initial exploration rate (100%)
  epsilonFinal: 0.05,             // Final exploration rate (5%)
  epsilonDecaySteps: 25_000,      // Linear decay over 25k steps
  bufferSize: 50_000,             // Maximum replay buffer size
  minBufferBeforeTraining: 1_000, // Minimum samples before training
};

const ENCODING_HEADER_BYTES = 4;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class DqnTfjsAgent implements Algorithm<DqnHyperParams> {
  readonly id = "dqn-tfjs";
  readonly backend = "tfjs" as const;
  readonly hyper: DqnHyperParams;

  private onlineModel: tf.LayersModel | null = null;
  private targetModel: tf.LayersModel | null = null;
  private optimizer: tf.Optimizer | null = null;
  private replay: ReplayBuffer | null = null;
  private epsilonSchedule: LinearSchedule | null = null;
  private epsilon = 1.0;
  private rng: seedrandom.PRNG = seedrandom();
  private obsSize = 0;
  private actionSize = 0;
  private stepCounter = 0;
  private diagnostics: AlgorithmDiagnostics = {};

  constructor(hyperOverrides: Partial<DqnHyperParams> = {}) {
    this.hyper = { ...DEFAULT_HYPER, ...hyperOverrides };
  }

  async init(config: AlgorithmInit) {
    await tf.ready();
    try {
      if (tf.getBackend() !== "webgl") {
        await tf.setBackend("webgl");
      }
    } catch {
      // fall back to existing backend if WebGL is unavailable
    }

    this.obsSize = config.obsShape.reduce((acc, curr) => acc * curr, 1);
    this.actionSize = config.actionSize;
    this.rng = seedrandom(config.seed);
    this.replay = new ReplayBuffer(this.hyper.bufferSize);
    this.optimizer = tf.train.adam(this.hyper.learningRate);
    this.epsilonSchedule = new LinearSchedule(
      this.hyper.epsilonStart,
      this.hyper.epsilonFinal,
      this.hyper.epsilonDecaySteps
    );
    this.epsilon = this.hyper.epsilonStart;
    this.stepCounter = 0;

    this.onlineModel = this.buildNetwork(this.obsSize, this.actionSize);
    this.targetModel = this.buildNetwork(this.obsSize, this.actionSize);
    await this.hardSyncTarget();
  }

  async act(observation: EnvObservation) {
    if (!this.onlineModel) {
      throw new Error("DQN agent not initialized");
    }
    const obsArray = Array.from(toObservationArray(observation));
    const obsTensor = tf.tensor2d([obsArray], [
      1,
      this.obsSize,
    ]);
    this.epsilon = this.epsilonSchedule
      ? this.epsilonSchedule.value(this.stepCounter)
      : this.hyper.epsilonFinal;

    let action: number;
    if (this.rng() < this.epsilon) {
      action = Math.floor(this.rng() * this.actionSize);
    } else {
      const qValues = this.onlineModel.predict(obsTensor) as tf.Tensor;
      const data = await qValues.argMax(-1).data();
      action = data[0];
      qValues.dispose();
    }

    obsTensor.dispose();
    return action;
  }

  async observe(batch: TrainBatch) {
    if (!this.replay || !this.optimizer || !this.onlineModel || !this.targetModel) {
      return;
    }

    const transitionCount = batch.rewards.length;
    const obsStride = this.obsSize;

    for (let i = 0; i < transitionCount; i += 1) {
      const obsStart = i * obsStride;
      const actionValue = batch.actions[i];
      const observation = batch.observations.slice(obsStart, obsStart + obsStride);
      const nextObservation = batch.nextObservations.slice(
        obsStart,
        obsStart + obsStride
      );
      this.replay.add({
        observation: new Float32Array(observation),
        action: new Float32Array([actionValue]),
        reward: batch.rewards[i],
        nextObservation: new Float32Array(nextObservation),
        done: Boolean(batch.dones[i]),
      });
    }

    if (this.replay.getSize() < (this.hyper.minBufferBeforeTraining ?? 0)) {
      return;
    }

    const batchSize = this.hyper.batchSize ?? 32;
    const sample = this.replay.sample(batchSize, this.rng);
    const actionStride = sample.actionLength ?? 1;
    const actionValues = new Float32Array(batchSize);
    for (let i = 0; i < batchSize; i += 1) {
      actionValues[i] = sample.actions[i * actionStride];
    }
    const gamma = this.hyper.gamma;

    let lossValue: number | undefined;

    await this.optimizer.minimize(() => {
      return tf.tidy(() => {
        // === Online Network Forward Pass ===
        // Compute Q(s,a) for all actions, then select Q-values for taken actions
        const obsTensor = tf.tensor2d(sample.observations, [
          batchSize,
          this.obsSize,
        ]);
        const qValues = this.onlineModel!.apply(obsTensor, {
          training: true,
        }) as tf.Tensor;

        const actionTensor = tf.tensor1d(actionValues, "int32");
        const qSelected = tf.sum(
          tf.mul(qValues, tf.oneHot(actionTensor, this.actionSize)),
          -1
        );

        // === Target Network Forward Pass ===
        // Use target network θ⁻ for stable Q-value targets
        // y = r + γ · max_a' Q(s', a'; θ⁻)
        const nextObs = tf.tensor2d(sample.nextObservations, [
          batchSize,
          this.obsSize,
        ]);
        const nextQ = this.targetModel!.predict(nextObs) as tf.Tensor;
        const maxNextQ = tf.max(nextQ, -1);
        const rewardTensor = tf.tensor1d(sample.rewards);
        const doneTensor = tf.tensor1d(Float32Array.from(sample.dones), "float32");

        // === Bellman Target Computation ===
        // y = r + γ · max_a' Q(s', a') if not done
        // y = r if done (no future rewards)
        // The (1 - done) mask zeros out future Q-values for terminal states
        const target = tf.add(
          rewardTensor,
          tf.mul(
            tf.mul(tf.sub(1, doneTensor), gamma),
            maxNextQ
          )
        );

        // === Temporal Difference Loss ===
        // L(θ) = E[(y - Q(s,a;θ))²]
        // MSE between predicted Q-value and target
        const loss = tf.losses.meanSquaredError(target, qSelected);
        lossValue = loss.dataSync()[0];

        actionTensor.dispose();
        rewardTensor.dispose();
        doneTensor.dispose();
        return loss as tf.Scalar;
      });
    }, true);

    this.stepCounter += transitionCount;
    if (lossValue !== undefined) {
      this.diagnostics.loss = lossValue;
    }
    this.diagnostics.learningRate = this.hyper.learningRate;

    if (
      this.hyper.targetUpdateFrequency &&
      this.stepCounter % this.hyper.targetUpdateFrequency === 0
    ) {
      await this.hardSyncTarget();
    }
  }

  async save() {
    if (!this.onlineModel) {
      throw new Error("Cannot save before initialization");
    }
    const namedWeights: tf.NamedTensorMap = {};

    this.onlineModel.weights.forEach((weight) => {
      namedWeights[weight.originalName] = weight.read();
    });

    const { data, specs } = await tf.io.encodeWeights(namedWeights);
    Object.values(namedWeights).forEach((tensor) => tensor.dispose());

    const meta = textEncoder.encode(JSON.stringify({ specs }));
    const header = new Uint8Array(new Uint32Array([meta.byteLength]).buffer);
    const payload = new Uint8Array(data);

    const combined = new Uint8Array(
      ENCODING_HEADER_BYTES + meta.byteLength + payload.byteLength
    );
    combined.set(header, 0);
    combined.set(meta, ENCODING_HEADER_BYTES);
    combined.set(payload, ENCODING_HEADER_BYTES + meta.byteLength);

    return combined.buffer;
  }

  async load(buffer: ArrayBuffer) {
    if (!this.onlineModel) {
      throw new Error("Cannot load before initialization");
    }
    const dataView = new DataView(buffer);
    const metaLength = dataView.getUint32(0, true);
    const metaStart = ENCODING_HEADER_BYTES;
    const metaEnd = metaStart + metaLength;

    const metaRaw = new Uint8Array(buffer, metaStart, metaLength);
    const payload = new Uint8Array(buffer, metaEnd);

    const { specs } = JSON.parse(textDecoder.decode(metaRaw)) as {
      specs: tf.io.WeightsManifestEntry[];
    };

    const weightMap = await tf.io.decodeWeights(payload.buffer, specs);
    const weights = this.onlineModel.weights.map((weight) => {
      const tensor = weightMap[weight.originalName];
      if (!tensor) {
        throw new Error(`Missing weight ${weight.originalName}`);
      }
      return tensor;
    });

    await this.onlineModel.setWeights(weights);
    await this.hardSyncTarget();
    Object.values(weightMap).forEach((tensor) => tensor.dispose());
  }

  async dispose() {
    this.onlineModel?.dispose();
    this.targetModel?.dispose();
    this.optimizer?.dispose();
    this.onlineModel = null;
    this.targetModel = null;
    this.optimizer = null;
    this.replay = null;
  }

  /**
   * Build Q-Network
   * 
   * Architecture:
   * - Input: Observation vector
   * - Hidden: 128 units × 2 layers with ReLU activation
   * - Output: Q-values for each action (no activation)
   * 
   * The network outputs raw Q-values Q(s,a) for each action a.
   * During action selection, we choose: a* = argmax_a Q(s,a)
   * 
   * ReLU activation is used for computational efficiency and has been
   * shown to work well in value-based methods.
   * 
   * Glorot uniform initialization ensures proper gradient flow in deep networks.
   * 
   * @param obsSize - Dimensionality of observation space
   * @param actionSize - Number of discrete actions
   * @returns Keras Sequential model
   */
  private buildNetwork(obsSize: number, actionSize: number) {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 128,
        activation: "relu",
        inputShape: [obsSize],
        kernelInitializer: "glorotUniform",
      })
    );
    model.add(
      tf.layers.dense({
        units: 128,
        activation: "relu",
        kernelInitializer: "glorotUniform",
      })
    );
    // Output layer: Q-values (no activation)
    model.add(tf.layers.dense({ units: actionSize }));
    return model;
  }

  /**
   * Hard Sync Target Network
   * 
   * Copies weights from online network θ to target network θ⁻.
   * This is done periodically (every C steps) to provide stable TD targets.
   * 
   * The target network computes: y = r + γ · max_a' Q(s', a'; θ⁻)
   * 
   * Without a target network, the Q-value targets would change with every
   * update, leading to oscillations and divergence. The fixed target network
   * breaks this dependency and stabilizes training.
   * 
   * Alternative approaches:
   * - Soft updates: θ⁻ ← τ·θ + (1-τ)·θ⁻ (Polyak averaging)
   * - Hard updates: θ⁻ ← θ (used here)
   */
  private async hardSyncTarget() {
    if (!this.onlineModel || !this.targetModel) {
      return;
    }
    const weights = this.onlineModel.getWeights();
    await this.targetModel.setWeights(weights);
    weights.forEach((w) => w.dispose());
  }

  getDiagnostics(): AlgorithmDiagnostics {
    return { ...this.diagnostics };
  }

}

export const createDqnAgent = (hyper?: Partial<DqnHyperParams>) =>
  new DqnTfjsAgent(hyper);



