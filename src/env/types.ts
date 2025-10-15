export type NumericArray = Float32Array | Float64Array | Int32Array | Uint8Array | number[];

export type EnvObservation =
  | NumericArray
  | {
      buffer: NumericArray;
      metadata?: Record<string, unknown>;
    };

export interface EnvStepResult {
  state: EnvObservation;
  reward: number;
  done: boolean;
  info?: Record<string, unknown>;
}

export interface DiscreteActionSpace {
  type: "discrete";
  n: number;
}

export interface BoxActionSpace {
  type: "box";
  shape: number[];
  low: number;
  high: number;
}

export type ActionSpace = DiscreteActionSpace | BoxActionSpace;

export interface ObservationSpace {
  shape: readonly number[];
}

export interface Env {
  readonly id: string;
  readonly actionSpace: ActionSpace;
  readonly obsSpace: ObservationSpace;
  reset(): EnvObservation;
  step(action: number | number[]): EnvStepResult;
  render?(state: EnvObservation): void;
}

export type RewardFunction = (
  obs: EnvObservation,
  action: number | number[],
  info: Record<string, unknown>
) => number;

export interface EnvFactory {
  id: string;
  name: string;
  create: () => Env;
  description: string;
}
