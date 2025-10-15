export interface Transition {
  observation: Float32Array;
  action: Float32Array;
  reward: number;
  nextObservation: Float32Array;
  done: boolean;
}

export class ReplayBuffer {
  private readonly observations: Float32Array[];
  private readonly actions: Float32Array[];
  private readonly rewards: number[];
  private readonly nextObservations: Float32Array[];
  private readonly dones: boolean[];
  private writeIndex = 0;
  private size = 0;
  private actionLength: number | null = null;

  constructor(private readonly capacity: number) {
    this.observations = new Array(capacity);
    this.actions = new Array(capacity);
    this.rewards = new Array(capacity);
    this.nextObservations = new Array(capacity);
    this.dones = new Array(capacity);
  }

  add(transition: Transition) {
    this.observations[this.writeIndex] = transition.observation;
    this.actions[this.writeIndex] = transition.action;
    this.rewards[this.writeIndex] = transition.reward;
    this.nextObservations[this.writeIndex] = transition.nextObservation;
    this.dones[this.writeIndex] = transition.done;
    if (this.actionLength === null) {
      this.actionLength = transition.action.length;
    }
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    this.size = Math.min(this.size + 1, this.capacity);
  }

  sample(batchSize: number, rng: () => number) {
    if (this.size === 0) {
      throw new Error("ReplayBuffer is empty");
    }
    const indices = new Array(batchSize)
      .fill(0)
      .map(() => Math.floor(rng() * this.size));

    const obsLength = this.observations[0].length;
    const actionLength = this.actionLength ?? this.actions[0].length;

    const observations = new Float32Array(batchSize * obsLength);
    const actions = new Float32Array(batchSize * actionLength);
    const rewards = new Float32Array(batchSize);
    const nextObservations = new Float32Array(batchSize * obsLength);
    const dones = new Uint8Array(batchSize);

    indices.forEach((idx, batchIdx) => {
      const offsetObs = batchIdx * obsLength;
      const offsetAct = batchIdx * actionLength;
      observations.set(this.observations[idx], offsetObs);
      actions.set(this.actions[idx], offsetAct);
      rewards[batchIdx] = this.rewards[idx];
      nextObservations.set(this.nextObservations[idx], offsetObs);
      dones[batchIdx] = this.dones[idx] ? 1 : 0;
    });

    return {
      observations,
      actions,
      rewards,
      nextObservations,
      dones,
      actionLength,
    };
  }

  getSize() {
    return this.size;
  }

  getActionLength() {
    return this.actionLength;
  }
}

export interface RolloutStep {
  observation: Float32Array;
  action: Float32Array;
  logProb: number;
  reward: number;
  value: number;
  done: boolean;
}

export class RolloutBuffer {
  private storage: RolloutStep[] = [];

  push(step: RolloutStep) {
    this.storage.push(step);
  }

  clear() {
    this.storage = [];
  }

  get steps() {
    return this.storage;
  }
}
